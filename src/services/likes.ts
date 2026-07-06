import {
  CircleCandidate,
  getUsersByIds,
  SwipeCandidate,
} from "./swipe";
import { supabase } from "./supabase";
import { Interest, ProfileTrait, User } from "../types";

interface CircleLikeRow {
  id: string;
  name: string;
  creator_id: string;
  size: number;
  members: string[] | null;
  pending_swipes: Record<string, string[]> | null;
  skipped_swipes?: Record<string, string[]> | null;
  filters: {
    age_range: [number, number];
    education_level: string;
    location_radius: number;
    interests?: Interest[];
    vibe?: string;
    gender_mix?: "Male" | "Female" | "Both";
    traits?: ProfileTrait[];
  };
  meetup_goal: string;
  meetup_timeframe?: string;
  meetup_days?: number;
  meetup_deadline?: string | null;
  status: "forming" | "complete";
  created_at: string;
  image_url?: string | null;
}

export type IncomingLike =
  | {
      id: string;
      type: "profile";
      profile: SwipeCandidate;
      circleId: string;
    }
  | {
      id: string;
      type: "circle";
      circle: CircleCandidate;
    };

const rowToCircleCandidate = (row: CircleLikeRow): CircleCandidate => ({
  id: row.id,
  name: row.name,
  creatorId: row.creator_id,
  size: row.size,
  members: row.members || [],
  filters: {
    ageRange: row.filters.age_range,
    educationLevel: row.filters.education_level,
    locationRadius: row.filters.location_radius,
    interests: row.filters.interests || [],
    vibe: row.filters.vibe,
    genderMix: row.filters.gender_mix,
    traits: row.filters.traits || [],
  },
  meetupGoal: row.meetup_goal,
  meetupTimeframe: row.meetup_timeframe,
  meetupDays: row.meetup_days,
  meetupDeadline: row.meetup_deadline ? new Date(row.meetup_deadline) : null,
  status: row.status,
  createdAt: new Date(row.created_at),
  imageUrl: row.image_url ?? undefined,
});

const hasSwipe = (
  swipes: Record<string, string[]> | null | undefined,
  actorId: string,
  targetId: string,
) => (swipes?.[actorId] || []).includes(targetId);

const getProfileLikesForHostedCircle = async (
  userId: string,
): Promise<IncomingLike[]> => {
  const { data, error } = await supabase
    .from("circles")
    .select("*")
    .eq("creator_id", userId)
    .eq("status", "forming")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error getting incoming profile likes:", error);
    return [];
  }

  const activeCircle = data as CircleLikeRow | null;
  if (!activeCircle) return [];

  const likerIds = Object.entries(activeCircle.pending_swipes || {})
    .filter(([likerId, targets]) => {
      if (likerId === userId) return false;
      if ((activeCircle.members || []).includes(likerId)) return false;
      if (!targets.includes(activeCircle.id)) return false;
      if ((activeCircle.pending_swipes?.[userId] || []).includes(likerId)) {
        return false;
      }
      if ((activeCircle.skipped_swipes?.[userId] || []).includes(likerId)) {
        return false;
      }
      return true;
    })
    .map(([likerId]) => likerId);

  const profiles = await getUsersByIds(likerIds);
  const order = new Map(likerIds.map((id, index) => [id, index]));

  return profiles
    .sort((a, b) => (order.get(a.uid) ?? 0) - (order.get(b.uid) ?? 0))
    .map((profile) => ({
      id: `profile:${activeCircle.id}:${profile.uid}`,
      type: "profile" as const,
      profile,
      circleId: activeCircle.id,
    }));
};

const getCircleLikesForUserProfile = async (
  userId: string,
  profile: User | null,
): Promise<IncomingLike[]> => {
  const { data, error } = await supabase
    .from("circles")
    .select("*")
    .eq("status", "forming")
    .neq("creator_id", userId);

  if (error) {
    console.error("Error getting incoming circle likes:", error);
    return [];
  }

  return ((data as CircleLikeRow[] | null) || [])
    .filter((row) => {
      const members = row.members || [];
      if (members.includes(userId)) return false;
      if (!hasSwipe(row.pending_swipes, row.creator_id, userId)) return false;
      if (hasSwipe(row.pending_swipes, userId, row.id)) return false;
      if (hasSwipe(row.skipped_swipes, userId, row.id)) return false;

      const [minAge, maxAge] = row.filters.age_range || [18, 50];
      if (profile && (profile.age < minAge || profile.age > maxAge)) {
        return false;
      }

      const genderMix = row.filters.gender_mix;
      if (
        profile &&
        genderMix &&
        genderMix !== "Both" &&
        profile.gender !== genderMix
      ) {
        return false;
      }

      return true;
    })
    .map((row) => ({
      id: `circle:${row.id}`,
      type: "circle" as const,
      circle: rowToCircleCandidate(row),
    }));
};

export const getIncomingLikes = async (
  userId: string,
  profile: User | null,
): Promise<IncomingLike[]> => {
  const [profileLikes, circleLikes] = await Promise.all([
    getProfileLikesForHostedCircle(userId),
    getCircleLikesForUserProfile(userId, profile),
  ]);

  return [...profileLikes, ...circleLikes];
};
