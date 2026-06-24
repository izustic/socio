import type {
  ModerationProfileSnapshot,
  ModerationReport,
  ModerationReportStatus,
  ModerationUserRole,
  ModerationUserStatus,
  ModerationUserSummary,
} from "./moderation.types";

export interface ModerationUserRow {
  id: string;
  display_name?: string | null;
  email?: string | null;
  photo_url?: string | null;
  role?: ModerationUserRole | null;
  status?: ModerationUserStatus | null;
  suspended_until?: string | null;
  profile_complete?: boolean | null;
  created_at?: string | null;
  age?: number | null;
  gender?: string | null;
  interests?: unknown;
  traits?: unknown;
}

export interface ModerationReportRow {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  circle_id?: string | null;
  message_id?: string | null;
  reason?: string | null;
  details?: string | null;
  status?: ModerationReportStatus | string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string | null;
}

export interface ModerationLogRow {
  id: string;
  moderator_id: string;
  target_user_id: string;
  action?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
}

export const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item)) : [];

export const toModerationProfileSnapshot = (
  row: ModerationUserRow,
): ModerationProfileSnapshot => ({
  id: String(row.id),
  displayName: row.display_name || "Unnamed user",
  email: row.email || "",
  photoUrl: row.photo_url || "",
  role: (row.role as ModerationUserRole) || "user",
  status: (row.status as ModerationUserStatus) || "active",
  suspendedUntil: row.suspended_until || null,
  profileComplete: Boolean(row.profile_complete),
  createdAt: row.created_at || new Date().toISOString(),
});

export const toModerationUserSummary = (
  row: ModerationUserRow,
): ModerationUserSummary => ({
  ...toModerationProfileSnapshot(row),
  age: row.age ?? null,
  gender: row.gender ?? null,
  interests: toStringArray(row.interests),
  traits: toStringArray(row.traits),
  reportCount: 0,
});

export const toModerationReport = (row: ModerationReportRow): ModerationReport => ({
  id: String(row.id),
  reporterId: String(row.reporter_id),
  reportedUserId: String(row.reported_user_id),
  circleId: row.circle_id ? String(row.circle_id) : null,
  messageId: row.message_id ? String(row.message_id) : null,
  reason: row.reason || "",
  details: row.details ?? null,
  status: (row.status as ModerationReportStatus) || "pending",
  reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
  reviewedAt: row.reviewed_at ?? null,
  createdAt: row.created_at || new Date().toISOString(),
});

export const buildModerationLogMetadata = (
  metadata?: Record<string, unknown>,
): Record<string, unknown> | null =>
  metadata && Object.keys(metadata).length > 0 ? metadata : null;

export const getModerationActionForStatus = (
  status: ModerationUserStatus,
): string =>
  status === "active"
    ? "user_reactivated"
    : status === "suspended"
      ? "user_suspended"
      : "user_banned";
