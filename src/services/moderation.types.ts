export type ModerationUserRole = "user" | "moderator" | "admin";
export type ModerationUserStatus = "active" | "suspended" | "banned";
export type ModerationReportStatus = "pending" | "resolved" | "dismissed";

export interface ModerationUserSummary {
  id: string;
  displayName: string;
  email: string;
  photoUrl: string;
  role: ModerationUserRole;
  status: ModerationUserStatus;
  suspendedUntil: string | null;
  profileComplete: boolean;
  createdAt: string;
  age?: number | null;
  gender?: string | null;
  interests: string[];
  traits: string[];
  reportCount: number;
  latestReportReason?: string;
  latestReportStatus?: ModerationReportStatus | string;
  latestReportAt?: string;
}

export interface ModerationProfileSnapshot {
  id: string;
  displayName: string;
  email: string;
  photoUrl: string;
  role: ModerationUserRole;
  status: ModerationUserStatus;
  suspendedUntil: string | null;
  profileComplete: boolean;
  createdAt: string;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  circleId: string | null;
  messageId: string | null;
  reason: string;
  details: string | null;
  status: ModerationReportStatus | string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ModerationReportWithProfiles extends ModerationReport {
  reporter: ModerationProfileSnapshot | null;
  reportedUser: ModerationProfileSnapshot | null;
}

export interface ModerationLogEntry {
  id: string;
  moderatorId: string;
  targetUserId: string;
  action: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  moderator: ModerationProfileSnapshot | null;
  targetUser: ModerationProfileSnapshot | null;
}

export interface ModerationOverview {
  totalUsers: number;
  activeUsers: number;
  moderators: number;
  admins: number;
  suspendedUsers: number;
  bannedUsers: number;
  pendingReports: number;
  resolvedReports: number;
  dismissedReports: number;
  moderationActions: number;
}
