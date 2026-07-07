import { Circle, Interest, ProfileTrait } from "../types";
import { clampMeetupDays, createMeetupDeadline } from "../utils/circleDeadline";

export interface CreateCircleInput {
  name: string;
  creatorId: string;
  size: number;
  ageRange: [number, number];
  educationLevel: string;
  locationRadius: number;
  interests: Interest[];
  vibe?: string;
  meetupGoal?: string;
  meetupTimeframe?: string;
  meetupDays?: number;
  meetupDeadline?: Date | string;
  imageUrl?: string | null;
  circleImageUri?: string;
  genderMix?: "Male" | "Female" | "Both";
  traits?: ProfileTrait[];
}

export interface CircleFilters {
  ageRange?: [number, number];
  age_range?: [number, number];
  educationLevel?: string;
  education_level?: string;
  locationRadius?: number;
  location_radius?: number;
  interests?: Interest[];
  vibe?: string;
  genderMix?: "Male" | "Female" | "Both";
  gender_mix?: "Male" | "Female" | "Both";
  traits?: ProfileTrait[];
}

export interface CircleRow {
  id: string;
  name: string;
  creator_id: string;
  size: number;
  members: unknown;
  pending_swipes: Record<string, string[]>;
  filters: CircleFilters;
  meetup_goal: string;
  meetup_timeframe?: string;
  meetup_days?: number;
  meetup_deadline?: string | null;
  image_url?: string | null;
  status: "forming" | "complete";
  created_at: string;
}

export const normalizeMemberIds = (members: unknown): string[] => {
  if (!Array.isArray(members)) return [];
  return members.map((id) => String(id));
};

const normalizeCircleFilters = (filters: CircleFilters): Circle["filters"] => ({
  ageRange: filters.ageRange ?? filters.age_range ?? [18, 50],
  educationLevel: filters.educationLevel ?? filters.education_level ?? "Any",
  locationRadius: filters.locationRadius ?? filters.location_radius ?? 10,
  interests: filters.interests ?? [],
  vibe: filters.vibe ?? "",
  genderMix: filters.genderMix ?? filters.gender_mix ?? "Both",
  traits: filters.traits ?? [],
});

export const rowToCircle = (row: CircleRow): Circle => ({
  id: row.id,
  name: row.name,
  creatorId: String(row.creator_id),
  size: row.size,
  members: normalizeMemberIds(row.members),
  pendingSwipes: row.pending_swipes,
  filters: normalizeCircleFilters(row.filters),
  meetupGoal: row.meetup_goal,
  meetupTimeframe: row.meetup_timeframe,
  meetupDays: row.meetup_days,
  meetupDeadline: row.meetup_deadline ? new Date(row.meetup_deadline) : null,
  imageUrl: row.image_url ?? null,
  status: row.status,
  createdAt: new Date(row.created_at),
});

export const buildCreateCirclePayload = (
  circleId: string,
  input: CreateCircleInput,
) => {
  const meetupDays = clampMeetupDays(input.meetupDays ?? 3);
  const meetupDeadline =
    input.meetupDeadline instanceof Date
      ? input.meetupDeadline
      : input.meetupDeadline
        ? new Date(input.meetupDeadline)
        : createMeetupDeadline(meetupDays);

  return {
    id: circleId,
    name: input.name,
    creator_id: input.creatorId,
    size: input.size,
    members: [input.creatorId],
    pending_swipes: {},
    skipped_swipes: {},
    filters: {
      age_range: input.ageRange,
      education_level: input.educationLevel,
      location_radius: input.locationRadius,
      interests: input.interests,
      vibe: input.vibe || "",
      gender_mix: input.genderMix || "Both",
      traits: input.traits || [],
    },
    meetup_goal: input.meetupGoal || "",
    meetup_timeframe: input.meetupTimeframe || `Within ${meetupDays} days`,
    meetup_days: meetupDays,
    meetup_deadline: meetupDeadline.toISOString(),
    image_url: input.imageUrl ?? null,
    status: "forming",
  };
};

export type AppTabVisibility = {
  circleTabVisible: boolean;
  swipeTabVisible: boolean;
};

/** Pure tab-bar rules used by SwipeTabVisibilityContext. */
export const resolveAppTabVisibility = (
  circle: Circle | null,
  userId: string,
  joinBrowsingActive = false,
): AppTabVisibility => {
  if (!circle) {
    return {
      circleTabVisible: !joinBrowsingActive,
      swipeTabVisible: joinBrowsingActive,
    };
  }

  if (circle.status === "complete") {
    return {
      circleTabVisible: true,
      swipeTabVisible: false,
    };
  }

  const isHost = circle.creatorId === userId;
  if (isHost) {
    const canSwipeMembers =
      circle.status === "forming" && circle.members.length < circle.size;
    return {
      circleTabVisible: true,
      swipeTabVisible: canSwipeMembers,
    };
  }

  // Matched joiner in a forming circle
  return {
    circleTabVisible: true,
    swipeTabVisible: false,
  };
};
