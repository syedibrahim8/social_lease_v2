import { ApiError } from '@/utils/ApiError';
import { eventBus } from '@/events/event-bus';
import { resolvePagination, buildPaginationMeta, type Paginated } from '@/utils/pagination';
import { campaignRepository } from '@/modules/campaigns/campaign.repository';
import { contractService } from '@/modules/contracts/contract.service';
import { paymentService } from '@/modules/payments/payment.service';
import {
  applicationRepository,
  type ApplicationFilter,
} from '@/modules/applications/application.repository';
import {
  ACTIVE_APPLICATION_STATUSES,
  type IApplicationDocument,
  type IOffer,
} from '@/modules/applications/application.types';
import type {
  ApplyDto,
  CounterOfferDto,
  ListApplicationsQuery,
} from '@/modules/applications/application.validators';

type ParticipantRole = 'BRAND' | 'CREATOR';

/**
 * Applications & negotiation use-cases.
 *
 * The negotiation is turn-based: at any moment exactly one offer is PENDING, and
 * only that offer's `receiver` may counter/accept/reject it. Acceptance locks the
 * creator's asset (one ACCEPTED application per creator+assetType) and removes the
 * campaign from the open market.
 */
export const applicationService = {
  /** Creator applies to a PUBLISHED campaign; seeds the first offer. */
  async apply(creatorId: string, dto: ApplyDto): Promise<IApplicationDocument> {
    const campaign = await campaignRepository.findRawById(dto.campaignId);
    if (!campaign) {
      throw ApiError.notFound('Campaign not found');
    }
    if (campaign.status !== 'PUBLISHED') {
      throw ApiError.conflict('This campaign is not open for applications');
    }
    // Only let creators who can actually be paid out engage — otherwise escrow
    // could fund work we can't release, inviting disputes.
    await paymentService.assertCreatorCanReceivePayouts(creatorId);
    if (await applicationRepository.existsForCampaignAndCreator(dto.campaignId, creatorId)) {
      throw ApiError.conflict('You have already applied to this campaign');
    }

    const brandId = campaign.brandId.toString();
    const created = await applicationRepository.create({
      campaignId: dto.campaignId,
      brandId,
      creatorId,
      assetType: campaign.assetType,
      proposal: dto.proposal,
      proposedPrice: dto.proposedPrice,
      estimatedReach: dto.estimatedReach,
      currency: campaign.currency,
      // Seed the negotiation thread with the creator's opening offer.
      offers: [
        { sender: creatorId, receiver: brandId, amount: dto.proposedPrice, message: dto.proposal },
      ],
    });
    eventBus.emit('application.received', {
      applicationId: created._id.toString(),
      campaignId: dto.campaignId,
      brandId,
      creatorId,
    });
    return (await applicationRepository.findById(created._id.toString())) ?? created;
  },

  /** A participant counters the current pending offer (turn-based). */
  async counterOffer(
    id: string,
    userId: string,
    dto: CounterOfferDto
  ): Promise<IApplicationDocument> {
    const { app, role } = await this.loadForTurn(id, userId);
    const pending = currentPendingOffer(app);

    // Append the counter; the previous offer is now superseded.
    pending.status = 'COUNTERED';
    const receiver = role === 'CREATOR' ? app.brandId.toString() : app.creatorId.toString();
    const offer = {
      sender: userId,
      receiver,
      amount: dto.amount,
      ...(dto.message !== undefined ? { message: dto.message } : {}),
    };
    // Mongoose casts string ids → ObjectId and fills status/createdAt defaults.
    app.offers.push(offer as unknown as IOffer);
    app.status = 'NEGOTIATING';

    await applicationRepository.save(app);
    eventBus.emit('offer.received', {
      applicationId: id,
      recipientId: receiver,
      senderId: userId,
      amount: dto.amount,
      currency: app.currency,
    });
    return (await applicationRepository.findById(id)) ?? app;
  },

  /** The current offer's receiver accepts it → agreement + asset lock. */
  async acceptOffer(id: string, userId: string): Promise<IApplicationDocument> {
    const { app } = await this.loadForTurn(id, userId);

    // The campaign must still be open, and the creator's asset must be free.
    const campaign = await campaignRepository.findRawById(app.campaignId.toString());
    if (!campaign || campaign.status !== 'PUBLISHED') {
      throw ApiError.conflict('This campaign is no longer open for selection');
    }
    const lock = await applicationRepository.findAcceptedByCreatorAsset(
      app.creatorId.toString(),
      app.assetType
    );
    if (lock) {
      throw ApiError.conflict(
        `This creator's ${app.assetType} is already committed to another campaign`
      );
    }

    const pending = currentPendingOffer(app);
    pending.status = 'ACCEPTED';
    app.status = 'ACCEPTED';
    app.agreedPrice = pending.amount;
    await applicationRepository.save(app); // partial-unique index is the race-safe backstop

    // Lock effects: free up nothing else for this asset; close the campaign.
    await applicationRepository.rejectOtherActiveForAsset(
      app.creatorId.toString(),
      app.assetType,
      id
    );
    await applicationRepository.rejectOtherApplicantsForCampaign(app.campaignId.toString(), id);
    await campaignRepository.updateById(app.campaignId.toString(), { status: 'NEGOTIATION' });

    // Agreement reached → auto-generate the formal contract record.
    await contractService.createFromApplication(app, campaign);

    // Notify the counterparty (the offer's original sender) that it was accepted.
    eventBus.emit('offer.accepted', {
      applicationId: id,
      campaignId: app.campaignId.toString(),
      recipientId: pending.sender.toString(),
      amount: pending.amount,
      currency: app.currency,
    });

    return (await applicationRepository.findById(id)) ?? app;
  },

  /** Either participant declines an active application. */
  async rejectOffer(id: string, userId: string): Promise<IApplicationDocument> {
    const { app } = await this.loadParticipantApp(id, userId);
    assertActive(app);

    const pending = app.offers.find((o) => o.status === 'PENDING');
    if (pending) pending.status = 'REJECTED';
    app.status = 'REJECTED';
    await applicationRepository.save(app);
    return (await applicationRepository.findById(id)) ?? app;
  },

  /** The creator withdraws their own application. */
  async withdraw(id: string, creatorId: string): Promise<IApplicationDocument> {
    const app = await applicationRepository.findDocById(id);
    if (!app) {
      throw ApiError.notFound('Application not found');
    }
    if (app.creatorId.toString() !== creatorId) {
      throw ApiError.forbidden('You can only withdraw your own application');
    }
    assertActive(app);
    app.status = 'WITHDRAWN';
    await applicationRepository.save(app);
    return (await applicationRepository.findById(id)) ?? app;
  },

  /** Fetch one application — participants only. */
  async getById(id: string, userId: string): Promise<IApplicationDocument> {
    const { app } = await this.loadParticipantApp(id, userId);
    return (await applicationRepository.findById(id)) ?? app;
  },

  /** A creator's own applications. */
  listMine(
    creatorId: string,
    query: ListApplicationsQuery
  ): Promise<Paginated<IApplicationDocument>> {
    const filter: ApplicationFilter = { creatorId };
    if (query.status) filter.status = query.status;
    if (query.campaignId) filter.campaignId = query.campaignId;
    return this.paginate(filter, query);
  },

  /** Applications received across a brand's campaigns. */
  listReceived(
    brandId: string,
    query: ListApplicationsQuery
  ): Promise<Paginated<IApplicationDocument>> {
    const filter: ApplicationFilter = { brandId };
    if (query.status) filter.status = query.status;
    if (query.campaignId) filter.campaignId = query.campaignId;
    return this.paginate(filter, query);
  },

  // --- internal helpers --------------------------------------------------

  async paginate(
    filter: ApplicationFilter,
    query: ListApplicationsQuery
  ): Promise<Paginated<IApplicationDocument>> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { items, total } = await applicationRepository.list(filter, { page, limit, skip });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  /** Load an application and the caller's participant role (404 to non-participants). */
  async loadParticipantApp(
    id: string,
    userId: string
  ): Promise<{ app: IApplicationDocument; role: ParticipantRole }> {
    const app = await applicationRepository.findDocById(id);
    if (!app) {
      throw ApiError.notFound('Application not found');
    }
    const role = participantRole(app, userId);
    if (!role) {
      // Hide existence from non-participants.
      throw ApiError.notFound('Application not found');
    }
    return { app, role };
  },

  /** As above, but also assert it's an active app and the caller holds the turn. */
  async loadForTurn(
    id: string,
    userId: string
  ): Promise<{ app: IApplicationDocument; role: ParticipantRole }> {
    const { app, role } = await this.loadParticipantApp(id, userId);
    assertActive(app);
    const pending = currentPendingOffer(app);
    if (pending.receiver.toString() !== userId) {
      throw ApiError.forbidden('It is not your turn to act on this offer');
    }
    return { app, role };
  },
};

function participantRole(app: IApplicationDocument, userId: string): ParticipantRole | null {
  if (app.creatorId.toString() === userId) return 'CREATOR';
  if (app.brandId.toString() === userId) return 'BRAND';
  return null;
}

function assertActive(app: IApplicationDocument): void {
  if (!ACTIVE_APPLICATION_STATUSES.includes(app.status)) {
    throw ApiError.conflict(`This application is ${app.status} and can no longer change`);
  }
}

function currentPendingOffer(app: IApplicationDocument): IOffer {
  const pending = app.offers.find((o) => o.status === 'PENDING');
  if (!pending) {
    throw ApiError.conflict('There is no pending offer to act on');
  }
  return pending;
}

export type ApplicationService = typeof applicationService;
