import { apiDelete, apiFetch, apiGet, apiPatch, apiPost, qs } from "@/lib/api/client";
import type {
  ApiMeta,
  Notification,
  NotificationPreference,
  Paginated,
} from "@/lib/api/types";

export async function getNotifications(params: {
  page?: number;
  limit?: number;
  read?: boolean;
  type?: string;
} = {}): Promise<Paginated<Notification>> {
  const { data, meta } = await apiFetch<Notification[]>(
    `/notifications${qs({
      page: params.page,
      limit: params.limit,
      // `read` is a real filter value when false, so it cannot go through the
      // falsy-dropping qs() helper as a boolean.
      ...(params.read === undefined ? {} : { read: String(params.read) }),
      type: params.type,
    })}`,
  );
  return meta ? { items: data, meta } : { items: data };
}

export function getUnreadCount(): Promise<{ count: number }> {
  return apiGet<{ count: number }>("/notifications/unread-count");
}

export function markRead(id: string): Promise<Notification> {
  return apiPatch<Notification>(`/notifications/${id}/read`, {});
}

export function markAllRead(): Promise<{ modified: number }> {
  return apiPost<{ modified: number }>("/notifications/read-all");
}

export function deleteNotification(id: string): Promise<null> {
  return apiDelete<null>(`/notifications/${id}`);
}

export function getPreferences(): Promise<NotificationPreference> {
  return apiGet<NotificationPreference>("/notifications/preferences");
}

export function updatePreferences(
  input: Partial<NotificationPreference>,
): Promise<NotificationPreference> {
  return apiPatch<NotificationPreference>("/notifications/preferences", input);
}

export type { ApiMeta };
