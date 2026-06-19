import type { RealtimeChannel } from "@supabase/supabase-js";
import { User } from "@/src/types";
import { supabase } from "./supabase";
import { getUserProfile } from "./user";

export interface NotificationSettings {
  circleActivity: boolean;
  newMessages: boolean;
  mutualMatches: boolean;
  suggestions: boolean;
  productUpdates: boolean;
  quietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface PrivacySettings {
  showInCircleSwipes: boolean;
  shareApproximateDistance: boolean;
  privateProfile: boolean;
}

export interface SettingsSnapshot {
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  verifiedPhoto: boolean;
}

export interface BlockedAccount {
  id: string;
  name: string;
  photoURL: string;
  blockedAt: string;
}

export interface ReportHistoryItem {
  id: string;
  reportedUserId: string;
  reason: string;
  status: string;
  createdAt: string;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  circleActivity: true,
  newMessages: true,
  mutualMatches: true,
  suggestions: false,
  productUpdates: false,
  quietHours: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
};

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showInCircleSwipes: true,
  shareApproximateDistance: true,
  privateProfile: false,
};

const parseNotificationSettings = (value: unknown): NotificationSettings => ({
  ...DEFAULT_NOTIFICATION_SETTINGS,
  ...(typeof value === "object" && value ? value : {}),
});

const parsePrivacySettings = (value: unknown): PrivacySettings => ({
  ...DEFAULT_PRIVACY_SETTINGS,
  ...(typeof value === "object" && value ? value : {}),
});

const rowToSettings = (row: any): SettingsSnapshot => ({
  notificationSettings: parseNotificationSettings(row?.notification_settings),
  privacySettings: parsePrivacySettings(row?.privacy_settings),
  verifiedPhoto: Boolean(row?.verified_photo),
});

export const getSettingsSnapshot = async (
  userId: string,
): Promise<SettingsSnapshot> => {
  const { data, error } = await supabase
    .from("users")
    .select("notification_settings, privacy_settings, verified_photo")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return rowToSettings(data);
};

export const updateNotificationSettings = async (
  userId: string,
  updates: Partial<NotificationSettings>,
): Promise<NotificationSettings> => {
  const current = await getSettingsSnapshot(userId);
  const next = { ...current.notificationSettings, ...updates };

  const { error } = await supabase
    .from("users")
    .update({
      notification_settings: next,
      notifications_enabled:
        next.circleActivity || next.newMessages || next.mutualMatches,
    })
    .eq("id", userId);

  if (error) throw error;
  return next;
};

export const updatePrivacySettings = async (
  userId: string,
  updates: Partial<PrivacySettings>,
): Promise<PrivacySettings> => {
  const current = await getSettingsSnapshot(userId);
  const next = { ...current.privacySettings, ...updates };

  const { error } = await supabase
    .from("users")
    .update({
      privacy_settings: next,
      location_enabled: next.shareApproximateDistance,
    })
    .eq("id", userId);

  if (error) throw error;
  return next;
};

export const verifyProfilePhoto = async (user: User): Promise<void> => {
  const hasPhoto = Boolean(user.photoURL || user.media?.some((item) => item.remoteUrl || item.uri));
  if (!hasPhoto) {
    throw new Error("Add a profile photo before verifying it.");
  }

  const { error } = await supabase
    .from("users")
    .update({ verified_photo: true })
    .eq("id", user.uid);

  if (error) throw error;
};

export const subscribeToSettings = (
  userId: string,
  callback: (settings: SettingsSnapshot) => void,
): RealtimeChannel =>
  supabase
    .channel(`settings:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "users",
        filter: `id=eq.${userId}`,
      },
      (payload) => callback(rowToSettings(payload.new)),
    )
    .subscribe();

export const subscribeToSafetyChanges = (
  userId: string,
  callback: () => void,
): RealtimeChannel =>
  supabase
    .channel(`safety:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "blocked_users",
        filter: `blocker_id=eq.${userId}`,
      },
      callback,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reports",
        filter: `reporter_id=eq.${userId}`,
      },
      callback,
    )
    .subscribe();

export const getBlockedAccounts = async (
  userId: string,
): Promise<BlockedAccount[]> => {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocked_id, created_at")
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const rows = data ?? [];
  const blockedIds = rows.map((row) => row.blocked_id).filter(Boolean);

  if (blockedIds.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, display_name, photo_url")
    .in("id", blockedIds);

  if (usersError) throw usersError;

  const byId = new Map((users ?? []).map((row) => [row.id, row]));
  return rows.map((row) => {
    const blocked = byId.get(row.blocked_id);
    return {
      id: row.blocked_id,
      name: blocked?.display_name || "Blocked account",
      photoURL: blocked?.photo_url || "",
      blockedAt: row.created_at,
    };
  });
};

export const unblockAccount = async (
  userId: string,
  blockedId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", userId)
    .eq("blocked_id", blockedId);

  if (error) throw error;
};

export const getReportHistory = async (
  userId: string,
): Promise<ReportHistoryItem[]> => {
  const { data, error } = await supabase
    .from("reports")
    .select("id, reported_user_id, reason, status, created_at")
    .eq("reporter_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    reportedUserId: row.reported_user_id,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
  }));
};

export const buildUserDataExport = async (userId: string) => {
  const [profile, settings, notifications, circles, messages, reports, blocked] =
    await Promise.all([
      getUserProfile(userId),
      getSettingsSnapshot(userId),
      supabase.from("notifications").select("*").eq("user_id", userId),
      supabase.from("circles").select("*").contains("members", [userId]),
      supabase.from("messages").select("*").eq("sender_id", userId),
      supabase.from("reports").select("*").eq("reporter_id", userId),
      getBlockedAccounts(userId),
    ]);

  if (notifications.error) throw notifications.error;
  if (circles.error) throw circles.error;
  if (messages.error) throw messages.error;
  if (reports.error) throw reports.error;

  return {
    exportedAt: new Date().toISOString(),
    profile,
    settings,
    notifications: notifications.data ?? [],
    circles: circles.data ?? [],
    messages: messages.data ?? [],
    reports: reports.data ?? [],
    blockedAccounts: blocked,
  };
};
