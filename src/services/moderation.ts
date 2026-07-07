import { supabase } from "./supabase";

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

const USER_SELECT =
  "id, display_name, email, photo_url, role, status, suspended_until, profile_complete, created_at, age, gender, interests, traits";
const REPORT_SELECT =
  "id, reporter_id, reported_user_id, circle_id, message_id, reason, details, status, reviewed_by, reviewed_at, created_at";
const LOG_SELECT =
  "id, moderator_id, target_user_id, action, reason, metadata, created_at";

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => String(item)) : [];

const toUserSummary = (row: any): ModerationProfileSnapshot => ({
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

const toModerationUserSummary = (row: any): ModerationUserSummary => ({
  ...toUserSummary(row),
  age: row.age ?? null,
  gender: row.gender ?? null,
  interests: toStringArray(row.interests),
  traits: toStringArray(row.traits),
  reportCount: 0,
});

const toReport = (row: any): ModerationReport => ({
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

const fetchUserSnapshots = async (
  userIds: string[],
): Promise<Map<string, ModerationProfileSnapshot>> => {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("users")
    .select(USER_SELECT)
    .in("id", uniqueIds);

  if (error) throw error;

  return new Map(
    (data ?? []).map((row) => [String(row.id), toUserSummary(row)]),
  );
};

const fetchReportProfiles = async (
  reports: ModerationReport[],
): Promise<ModerationReportWithProfiles[]> => {
  const ids = reports.flatMap((report) => [
    report.reporterId,
    report.reportedUserId,
  ]);
  const users = await fetchUserSnapshots(ids);

  return reports.map((report) => ({
    ...report,
    reporter: users.get(report.reporterId) ?? null,
    reportedUser: users.get(report.reportedUserId) ?? null,
  }));
};

const buildLogMetadata = (metadata?: Record<string, unknown>) =>
  metadata && Object.keys(metadata).length > 0 ? metadata : null;

const isMissingRpcError = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code;
  const message = String((error as { message?: string } | null)?.message ?? "");
  return code === "PGRST202" || message.includes("Could not find the function");
};

export type ReportUserInput = {
  reporterId?: string;
  reportedId: string;
  reason: string;
  details?: string | null;
  circleId?: string | null;
  messageId?: string | null;
};

export const reportUser = async (
  reporterOrInput: string | ReportUserInput,
  reportedId?: string,
  reason?: string,
) => {
  const input: ReportUserInput =
    typeof reporterOrInput === "string"
      ? {
          reporterId: reporterOrInput,
          reportedId: reportedId ?? "",
          reason: reason ?? "",
        }
      : reporterOrInput;

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "create_user_report",
      {
        p_reported_user_id: input.reportedId,
        p_reason: input.reason,
        p_details: input.details ?? null,
        p_circle_id: input.circleId ?? null,
        p_message_id: input.messageId ?? null,
      },
    );

    if (!rpcError) return rpcData;
    if (!isMissingRpcError(rpcError)) throw rpcError;

    if (!input.reporterId) {
      throw rpcError;
    }

    const { data, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: input.reporterId,
        reported_user_id: input.reportedId,
        circle_id: input.circleId ?? null,
        message_id: input.messageId ?? null,
        reason: input.reason,
        details: input.details ?? null,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error reporting user:", error);
    throw error;
  }
};

export const getReports = async (
  status: ModerationReportStatus | string = "pending",
  limit = 50,
): Promise<ModerationReportWithProfiles[]> => {
  try {
    let query = supabase
      .from("reports")
      .select(REPORT_SELECT)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return fetchReportProfiles((data ?? []).map((row) => toReport(row)));
  } catch (error) {
    console.error("Error getting reports:", error);
    throw error;
  }
};

export const getReportById = async (
  reportId: string,
): Promise<ModerationReportWithProfiles | null> => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select(REPORT_SELECT)
      .eq("id", reportId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const [report] = await fetchReportProfiles([toReport(data)]);
    return report ?? null;
  } catch (error) {
    console.error("Error getting report:", error);
    throw error;
  }
};

export const getModerationUsers = async (
  limit = 50,
): Promise<ModerationUserSummary[]> => {
  try {
    const [{ data: users, error: usersError }, { data: reports, error: reportsError }] =
      await Promise.all([
        supabase
          .from("users")
          .select(USER_SELECT)
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("reports")
          .select("reported_user_id, reason, status, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

    if (usersError) throw usersError;
    if (reportsError) throw reportsError;

    const reportBuckets = new Map<
      string,
      { count: number; latestReason?: string; latestStatus?: string; latestAt?: string }
    >();

    (reports ?? []).forEach((row: any) => {
      const userId = String(row.reported_user_id);
      const current = reportBuckets.get(userId) ?? { count: 0 };
      reportBuckets.set(userId, {
        count: current.count + 1,
        latestReason: current.latestReason ?? row.reason ?? "",
        latestStatus: current.latestStatus ?? row.status ?? "pending",
        latestAt: current.latestAt ?? row.created_at ?? "",
      });
    });

    return (users ?? [])
      .map((row: any) => {
        const summary = toModerationUserSummary(row);
        const bucket = reportBuckets.get(summary.id);
        return {
          ...summary,
          reportCount: bucket?.count ?? 0,
          latestReportReason: bucket?.latestReason,
          latestReportStatus: bucket?.latestStatus,
          latestReportAt: bucket?.latestAt,
        };
      })
      .sort((left, right) => {
        if (right.reportCount !== left.reportCount) {
          return right.reportCount - left.reportCount;
        }
        return (
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        );
      });
  } catch (error) {
    console.error("Error getting moderation users:", error);
    throw error;
  }
};

export const getModerationLogs = async (
  limit = 25,
): Promise<ModerationLogEntry[]> => {
  try {
    const { data, error } = await supabase
      .from("moderation_logs")
      .select(LOG_SELECT)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const rows = data ?? [];
    const userMap = await fetchUserSnapshots(
      rows.flatMap((row: any) => [row.moderator_id, row.target_user_id]),
    );

    return rows.map((row: any) => ({
      id: String(row.id),
      moderatorId: String(row.moderator_id),
      targetUserId: String(row.target_user_id),
      action: row.action || "unknown",
      reason: row.reason ?? null,
      metadata: row.metadata ?? null,
      createdAt: row.created_at || new Date().toISOString(),
      moderator: userMap.get(String(row.moderator_id)) ?? null,
      targetUser: userMap.get(String(row.target_user_id)) ?? null,
    }));
  } catch (error) {
    console.error("Error getting moderation logs:", error);
    throw error;
  }
};

export const getModerationOverview = async (): Promise<ModerationOverview> => {
  try {
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: moderators },
      { count: admins },
      { count: suspendedUsers },
      { count: bannedUsers },
      { count: pendingReports },
      { count: resolvedReports },
      { count: dismissedReports },
      { count: moderationActions },
    ] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "moderator"),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin"),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("status", "suspended"),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("status", "banned"),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "resolved"),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "dismissed"),
      supabase.from("moderation_logs").select("id", { count: "exact", head: true }),
    ]);

    return {
      totalUsers: totalUsers ?? 0,
      activeUsers: activeUsers ?? 0,
      moderators: moderators ?? 0,
      admins: admins ?? 0,
      suspendedUsers: suspendedUsers ?? 0,
      bannedUsers: bannedUsers ?? 0,
      pendingReports: pendingReports ?? 0,
      resolvedReports: resolvedReports ?? 0,
      dismissedReports: dismissedReports ?? 0,
      moderationActions: moderationActions ?? 0,
    };
  } catch (error) {
    console.error("Error getting moderation overview:", error);
    throw error;
  }
};

export const logModerationAction = async ({
  moderatorId,
  targetUserId,
  action,
  reason,
  metadata,
}: {
  moderatorId: string;
  targetUserId: string;
  action: string;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}) => {
  const { error } = await supabase.from("moderation_logs").insert({
    moderator_id: moderatorId,
    target_user_id: targetUserId,
    action,
    reason: reason ?? null,
    metadata: buildLogMetadata(metadata),
  });

  if (error) throw error;
};

export const dismissReport = async ({
  reportId,
  moderatorId,
  reason,
  metadata,
}: {
  reportId: string;
  moderatorId: string;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}) => {
  const { error: rpcError } = await supabase.rpc("dismiss_report", {
    p_report_id: reportId,
    p_reason: reason ?? null,
    p_metadata: buildLogMetadata(metadata) ?? {},
  });

  if (!rpcError) return;
  if (!isMissingRpcError(rpcError)) throw rpcError;

  const report = await getReportById(reportId);
  if (!report) {
    throw new Error("Report not found.");
  }

  const { error } = await supabase
    .from("reports")
    .update({
      status: "dismissed",
      reviewed_by: moderatorId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) throw error;

  await logModerationAction({
    moderatorId,
    targetUserId: report.reportedUserId,
    action: "report_dismissed",
    reason: reason ?? report.reason,
    metadata: {
      ...(metadata ?? {}),
      reportId,
      reportReason: report.reason,
    },
  });
};

export const updateUserStatus = async ({
  userId,
  status,
  suspendedUntil = null,
  reason,
  moderatorId,
  reportId,
  metadata,
}: {
  userId: string;
  status: ModerationUserStatus;
  suspendedUntil?: string | null;
  reason?: string | null;
  moderatorId?: string;
  reportId?: string;
  metadata?: Record<string, unknown>;
}) => {
  if (moderatorId) {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "moderate_user",
      {
        p_user_id: userId,
        p_status: status,
        p_suspended_until: status === "suspended" ? suspendedUntil : null,
        p_reason: reason ?? null,
        p_report_id: reportId ?? null,
        p_metadata: buildLogMetadata(metadata) ?? {},
      },
    );

    if (!rpcError) return toUserSummary(rpcData);
    if (!isMissingRpcError(rpcError)) throw rpcError;
  }

  const updates: Record<string, unknown> = {
    status,
    suspended_until: status === "suspended" ? suspendedUntil : null,
  };

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select(USER_SELECT)
    .single();

  if (error) throw error;

  if (moderatorId) {
    await logModerationAction({
      moderatorId,
      targetUserId: userId,
      action:
        status === "active"
          ? "user_reactivated"
          : status === "suspended"
            ? "user_suspended"
            : "user_banned",
      reason,
      metadata,
    });

    if (reportId) {
      await supabase
        .from("reports")
        .update({
          status: "resolved",
          reviewed_by: moderatorId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);
    }
  }

  return toUserSummary(data);
};

export const suspendUser = async ({
  userId,
  suspendedUntil,
  reason,
  moderatorId,
  reportId,
  metadata,
}: {
  userId: string;
  suspendedUntil: string;
  reason: string;
  moderatorId?: string;
  reportId?: string;
  metadata?: Record<string, unknown>;
}) => {
  const updated = await updateUserStatus({
    userId,
    status: "suspended",
    suspendedUntil,
    reason,
    moderatorId,
    metadata: {
      ...(metadata ?? {}),
      suspendedUntil,
      reportId: reportId ?? null,
    },
    reportId,
  });

  if (!moderatorId && reportId) {
    await supabase
      .from("reports")
      .update({
        status: "resolved",
        reviewed_by: moderatorId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reportId);
  }

  return updated;
};

export const banUser = async ({
  userId,
  reason,
  moderatorId,
  reportId,
  metadata,
}: {
  userId: string;
  reason: string;
  moderatorId?: string;
  reportId?: string;
  metadata?: Record<string, unknown>;
}) => {
  const updated = await updateUserStatus({
    userId,
    status: "banned",
    suspendedUntil: null,
    reason,
    moderatorId,
    metadata: {
      ...(metadata ?? {}),
      reportId: reportId ?? null,
    },
    reportId,
  });

  if (!moderatorId && reportId) {
    await supabase
      .from("reports")
      .update({
        status: "resolved",
        reviewed_by: moderatorId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reportId);
  }

  return updated;
};

export const updateUserRole = async ({
  userId,
  role,
  reason,
  moderatorId,
  metadata,
}: {
  userId: string;
  role: ModerationUserRole;
  reason?: string | null;
  moderatorId?: string;
  metadata?: Record<string, unknown>;
}) => {
  if (moderatorId) {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "set_user_role",
      {
        p_user_id: userId,
        p_role: role,
        p_reason: reason ?? null,
        p_metadata: buildLogMetadata(metadata) ?? {},
      },
    );

    if (!rpcError) return toUserSummary(rpcData);
    if (!isMissingRpcError(rpcError)) throw rpcError;
  }

  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId)
    .select(USER_SELECT)
    .single();

  if (error) throw error;

  if (moderatorId) {
    await logModerationAction({
      moderatorId,
      targetUserId: userId,
      action: "role_updated",
      reason,
      metadata: {
        ...(metadata ?? {}),
        role,
      },
    });
  }

  return toUserSummary(data);
};
