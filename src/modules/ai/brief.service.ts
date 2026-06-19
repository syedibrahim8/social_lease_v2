import { aiProvider, isAiConfigured } from '@/modules/ai/ai.provider';
import type { CampaignBrief } from '@/modules/ai/ai.types';
import type { CampaignBriefInput } from '@/modules/ai/ai.validators';

const SYSTEM =
  'You are an expert influencer-marketing strategist. Generate a practical, concise campaign ' +
  'brief as a JSON object with EXACTLY these keys: title (string), overview (string), ' +
  'objectives (string[]), targetAudience (string), keyMessages (string[]), ' +
  'suggestedPlatforms (string[]), contentIdeas (string[]), deliverables (string[]), ' +
  'dos (string[]), donts (string[]), hashtags (string[]), callToAction (string).';

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : [];

const asString = (v: unknown, fallback: string): string =>
  typeof v === 'string' && v.trim().length > 0 ? v : fallback;

/**
 * Campaign Brief Generator.
 *
 * The genuinely generative service → OpenAI is the PRIMARY engine here. The LLM
 * output is normalised against a deterministic template, which also serves as a
 * graceful fallback when OpenAI is unconfigured or errors — so the endpoint always
 * returns a usable, well-formed brief.
 */
export const briefService = {
  async generate(input: CampaignBriefInput): Promise<CampaignBrief> {
    if (isAiConfigured()) {
      try {
        const raw = await aiProvider.generateJson<Partial<CampaignBrief>>(
          SYSTEM,
          buildPrompt(input)
        );
        return normalize(raw, input);
      } catch {
        // fall through to the deterministic template
      }
    }
    return template(input);
  },
};

function buildPrompt(input: CampaignBriefInput): string {
  return [
    `Product description: ${input.productDescription}`,
    input.productName ? `Product name: ${input.productName}` : '',
    input.brandName ? `Brand: ${input.brandName}` : '',
    input.goals?.length ? `Goals: ${input.goals.join(', ')}` : '',
    input.targetAudience ? `Target audience: ${input.targetAudience}` : '',
    input.platform ? `Primary platform: ${input.platform}` : '',
    input.budget ? `Budget: ${input.budget}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function normalize(raw: Partial<CampaignBrief>, input: CampaignBriefInput): CampaignBrief {
  const t = template(input);
  const arr = (v: unknown, fallback: string[]): string[] => {
    const parsed = asStringArray(v);
    return parsed.length > 0 ? parsed : fallback;
  };
  return {
    title: asString(raw.title, t.title),
    overview: asString(raw.overview, t.overview),
    objectives: arr(raw.objectives, t.objectives),
    targetAudience: asString(raw.targetAudience, t.targetAudience),
    keyMessages: arr(raw.keyMessages, t.keyMessages),
    suggestedPlatforms: arr(raw.suggestedPlatforms, t.suggestedPlatforms),
    contentIdeas: arr(raw.contentIdeas, t.contentIdeas),
    deliverables: arr(raw.deliverables, t.deliverables),
    dos: arr(raw.dos, t.dos),
    donts: arr(raw.donts, t.donts),
    hashtags: arr(raw.hashtags, t.hashtags),
    callToAction: asString(raw.callToAction, t.callToAction),
    generatedBy: 'ai',
  };
}

function template(input: CampaignBriefInput): CampaignBrief {
  const brand = input.brandName ?? 'the brand';
  const product = input.productName ?? 'the product';
  const platform = input.platform ?? 'INSTAGRAM';
  const tag = (input.brandName ?? 'brand').replace(/[^a-zA-Z0-9]/g, '');
  return {
    title: `${product} creator campaign`,
    overview:
      `A creator marketing campaign for ${product} by ${brand}. ${input.productDescription}`.slice(
        0,
        500
      ),
    objectives: input.goals?.length
      ? input.goals
      : [
          'Drive product awareness',
          'Generate authentic engagement',
          'Convert interest into sign-ups',
        ],
    targetAudience:
      input.targetAudience ?? 'Engaged social audiences that match the product category',
    keyMessages: [
      `Why ${product} stands out`,
      'An authentic creator experience',
      'A clear value proposition',
    ],
    suggestedPlatforms: [platform],
    contentIdeas: [
      'Hero demo / walkthrough',
      'Authentic testimonial',
      'Before/after or real use-case story',
    ],
    deliverables: ['1 primary content piece', '1-2 supporting stories/posts'],
    dos: ['Disclose the partnership', 'Stay authentic to your voice', 'Include the call to action'],
    donts: ['Make unverifiable claims', 'Over-script the creator', 'Omit required disclosures'],
    hashtags: [`#${tag}`, `#${tag}Partner`, '#ad'].filter((h) => h.length > 3),
    callToAction: `Discover ${product} today.`,
    generatedBy: 'template',
  };
}

export type BriefService = typeof briefService;
