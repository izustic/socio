import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface AppNotification {
  id: string;
  userId: string;
  type:
    | "circle_invite"
    | "circle_accepted"
    | "circle_almost_full"
    | "circle_complete"
    | "message"
    | "system";
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export interface NotificationRealtimePayload {
  new?: AppNotification;
  old?: Partial<AppNotification>;
  eventType: "INSERT" | "UPDATE" | "DELETE" | string;
}

const rowToNotification = (row: NotificationRow): AppNotification => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as AppNotification["type"],
  title: row.title,
  body: row.body,
  data: row.data ?? undefined,
  read: row.read,
  createdAt: row.created_at,
});

const partialRowToNotification = (
  row: Partial<NotificationRow>,
): Partial<AppNotification> => ({
  id: row.id,
  userId: row.user_id,
  type: row.type as AppNotification["type"] | undefined,
  title: row.title,
  body: row.body,
  data: row.data ?? undefined,
  read: row.read,
  createdAt: row.created_at,
});

export const getNotifications = async (
  userId: string,
): Promise<AppNotification[]> => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data?.map((row) => rowToNotification(row as NotificationRow)) ?? [];
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) throw error;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

export const createNotification = async (
  userId: string,
  type: AppNotification["type"],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<string> => {
  try {
    const { data: result, error } = await supabase.rpc(
      "create_app_notification",
      {
        p_user_id: userId,
        p_type: type,
        p_title: title,
        p_body: body,
        p_data: data ?? null,
      },
    );

    if (error) throw error;

    return typeof result === "string" ? result : String(result ?? "");
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export const createNotifications = async (
  userIds: string[],
  type: AppNotification["type"],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> => {
  const uniqueUserIds = Array.from(new Set(userIds)).filter(Boolean);
  if (uniqueUserIds.length === 0) return;

  try {
    const results = await Promise.allSettled(
      uniqueUserIds.map((userId) =>
        supabase.rpc("create_app_notification", {
          p_user_id: userId,
          p_type: type,
          p_title: title,
          p_body: body,
          p_data: data ?? null,
        }),
      ),
    );

    const firstError = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (firstError) throw firstError.reason;
  } catch (error) {
    console.error("Error creating notifications:", error);
    throw error;
  }
};

export const subscribeToNotifications = (
  userId: string,
  callback: (payload: NotificationRealtimePayload) => void,
): RealtimeChannel => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const hasNew =
          payload.eventType !== "DELETE" &&
          payload.new &&
          Object.keys(payload.new).length > 0;
        const hasOld =
          payload.eventType !== "INSERT" &&
          payload.old &&
          Object.keys(payload.old).length > 0;

        callback({
          new: hasNew
            ? rowToNotification(payload.new as NotificationRow)
            : undefined,
          old: hasOld
            ? partialRowToNotification(payload.old as Partial<NotificationRow>)
            : undefined,
          eventType: payload.eventType,
        });
      },
    )
    .subscribe();

  return channel;
};

export const deleteNotification = async (
  notificationId: string,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};
