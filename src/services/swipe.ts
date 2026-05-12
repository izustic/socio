import {
  Circle,
  EducationLevel,
  Interest,
  ProfileMedia,
  ProfileTrait,
  User,
} from "../types";
import { supabase } from "./supabase";

export interface SwipeCandidate extends User {
  uid: string;
}

interface CandidateParams {
  circle: Circle;
  currentUserId: string;
  currentUserProfile: User | null;
}

interface CircleRow {
  id: string;
  name: string;
  creator_id: string;
  size: number;
  members: string[];
  pending_swipes: Record<string, string[]>;
  skipped_swipes?: Record<string, string[]>;
  filters: {
    age_range: [number, number];
    education_level: string;
    location_radius: number;
    interests: Interest[];
    vibe?: string;
    gender_mix?: "Male" | "Female" | "Both";
    traits?: ProfileTrait[];
  };
  meetup_goal: string;
  meetup_timeframe?: string;
  status: "forming" | "complete";
  created_at: string;
}

interface UserRow {
  id: string;
  display_name: string;
  age: number;
  gender: string;
  interests: Interest[];
  traits: string[];
  media: Array<{ uri: string; remoteUrl?: string }>;
  education: EducationLevel | "";
  location: { lat: number; lng: number; city?: string } | null;
  photo_url: string;
  bio: string;
  created_at: string;
}

const getDistanceKm = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getActiveCircleForUser = async (
  userId: string,
): Promise<(Circle & { id: string }) | null> => {
  const { data, error } = await supabase
    .from("circles")
    .select("*")
    .eq("creator_id", userId)
    .eq("status", "forming")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error getting active circle:", error);
    return null;
  }

  if (!data || data.length === 0) return null;

  const row = data[0] as CircleRow;
  return {
    id: row.id,
    name: row.name,
    creatorId: row.creator_id,
    size: row.size,
    members: row.members,
    pendingSwipes: row.pending_swipes,
    filters: {
      ageRange: row.filters.age_range,
      educationLevel: row.filters.education_level,
      locationRadius: row.filters.location_radius,
      interests: row.filters.interests,
      vibe: row.filters.vibe,
      genderMix: row.filters.gender_mix,
      traits: row.filters.traits ?? [],
    },
    meetupGoal: row.meetup_goal,
    meetupTimeframe: row.meetup_timeframe,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
};

export const getCircleById = async (
  circleId: string,
): Promise<(Circle & { id: string }) | null> => {
  const { data, error } = await supabase
    .from("circles")
    .select("*")
    .eq("id", circleId)
    .maybeSingle();

  if (error) {
    console.error("Error getting circle:", error);
    return null;
  }

  if (!data) return null;

  const row = data as CircleRow;
  return {
    id: row.id,
    name: row.name,
    creatorId: row.creator_id,
    size: row.size,
    members: row.members,
    pendingSwipes: row.pending_swipes,
    filters: {
      ageRange: row.filters.age_range,
      educationLevel: row.filters.education_level,
      locationRadius: row.filters.location_radius,
      interests: row.filters.interests,
      vibe: row.filters.vibe,
      genderMix: row.filters.gender_mix,
      traits: row.filters.traits ?? [],
    },
    meetupGoal: row.meetup_goal,
    meetupTimeframe: row.meetup_timeframe,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
};

export const getLatestCircleForUser = async (
  userId: string,
): Promise<(Circle & { id: string }) | null> => {
  const { data, error } = await supabase
    .from("circles")
    .select("*")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error getting latest circle:", error);
    return null;
  }

  if (!data || data.length === 0) return null;

  const row = data[0] as CircleRow;
  return {
    id: row.id,
    name: row.name,
    creatorId: row.creator_id,
    size: row.size,
    members: row.members,
    pendingSwipes: row.pending_swipes,
    filters: {
      ageRange: row.filters.age_range,
      educationLevel: row.filters.education_level,
      locationRadius: row.filters.location_radius,
      interests: row.filters.interests,
      vibe: row.filters.vibe,
      genderMix: row.filters.gender_mix,
      traits: row.filters.traits ?? [],
    },
    meetupGoal: row.meetup_goal,
    meetupTimeframe: row.meetup_timeframe,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
};

export const getUsersByIds = async (
  userIds: string[],
): Promise<SwipeCandidate[]> => {
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .in("id", userIds);

  if (error) {
    console.error("Error getting users by ids:", error);
    return [];
  }

  return (data as UserRow[]).map((row) => ({
    uid: row.id,
    name: row.display_name ?? "",
    age: row.age ?? 0,
    gender: row.gender as
      | "Male"
      | "Female"
      | "Non-binary"
      | "Prefer not to say",
    interests: row.interests ?? [],
    traits: (row.traits ?? []) as ProfileTrait[],
    media: (row.media ?? []) as ProfileMedia[],
    education: row.education ?? "",
    location: row.location ?? undefined,
    photoURL: row.photo_url ?? "",
    bio: row.bio ?? "",
    notificationsEnabled: true,
    locationEnabled: true,
    profileComplete: true,
    createdAt: new Date(row.created_at),
  }));
};

export const getSwipeCandidates = async ({
  circle,
  currentUserId,
  currentUserProfile,
}: CandidateParams): Promise<SwipeCandidate[]> => {
  const { data: usersData, error } = await supabase.from("users").select("*");

  if (error) {
    console.error("Error getting swipe candidates:", error);
    return [];
  }

  const swipedByCurrent = new Set(circle.pendingSwipes?.[currentUserId] || []);
  const skippedByCurrent = new Set<string>();
  const memberSet = new Set(circle.members || []);

  return (usersData as UserRow[])
    .map((row) => ({
      uid: row.id,
      name: row.display_name ?? "",
      age: row.age ?? 0,
      gender: row.gender as
        | "Male"
        | "Female"
        | "Non-binary"
        | "Prefer not to say",
      interests: row.interests ?? [],
      traits: (row.traits ?? []) as ProfileTrait[],
      media: (row.media ?? []) as ProfileMedia[],
      education: row.education ?? "",
      location: row.location ?? undefined,
      photoURL: row.photo_url ?? "",
      bio: row.bio ?? "",
      notificationsEnabled: true,
      locationEnabled: true,
      profileComplete: true,
      createdAt: new Date(row.created_at),
    }))
    .filter((candidate) => {
      if (candidate.uid === currentUserId) return false;
      if (memberSet.has(candidate.uid)) return false;
      if (swipedByCurrent.has(candidate.uid)) return false;
      if (skippedByCurrent.has(candidate.uid)) return false;

      const [minAge, maxAge] = circle.filters.ageRange;
      if (
        typeof candidate.age !== "number" ||
        candidate.age < minAge ||
        candidate.age > maxAge
      )
        return false;

      if (
        circle.filters.educationLevel !== "Any" &&
        candidate.education !== circle.filters.educationLevel
      ) {
        return false;
      }

      const requiredInterests = new Set<Interest>(
        circle.filters.interests || [],
      );
      const candidateInterests = candidate.interests || [];
      const hasSharedInterest = candidateInterests.some((i) =>
        requiredInterests.has(i),
      );
      if (!hasSharedInterest) return false;

      if (
        circle.filters.genderMix &&
        circle.filters.genderMix !== "Both" &&
        candidate.gender !== circle.filters.genderMix
      ) {
        return false;
      }

      const requiredTraits = new Set<ProfileTrait>(circle.filters.traits || []);
      if (requiredTraits.size > 0) {
        const candidateTraits = candidate.traits || [];
        const hasSharedTrait = candidateTraits.some((trait) =>
          requiredTraits.has(trait),
        );
        if (!hasSharedTrait) return false;
      }

      if (currentUserProfile?.location && candidate.location) {
        const distance = getDistanceKm(
          currentUserProfile.location,
          candidate.location,
        );
        if (distance > (circle.filters.locationRadius || 10)) return false;
      }

      return true;
    });
};

export const submitSwipe = async (
  circleId: string,
  currentUserId: string,
  targetUserId: string,
  liked: boolean,
): Promise<{ mutualMatch: boolean; circleComplete: boolean }> => {
  // Get current circle data
  const { data: circle, error: fetchError } = await supabase
    .from("circles")
    .select("*")
    .eq("id", circleId)
    .single();

  if (fetchError || !circle) {
    throw new Error("Circle not found.");
  }

  const circleRow = circle as CircleRow;
  const pendingSwipes = { ...(circleRow.pending_swipes || {}) };
  const skippedSwipes = { ...(circleRow.skipped_swipes || {}) };
  const members = [...(circleRow.members || [])];
  const size = circleRow.size || 5;

  const upsertUserArray = (
    obj: Record<string, string[]>,
    uid: string,
    value: string,
  ) => {
    const current = new Set(obj[uid] || []);
    current.add(value);
    obj[uid] = Array.from(current);
  };

  let mutualMatch = false;
  if (liked) {
    upsertUserArray(pendingSwipes, currentUserId, targetUserId);
    const targetSwipes = new Set(pendingSwipes[targetUserId] || []);
    mutualMatch = targetSwipes.has(currentUserId);

    if (mutualMatch && !members.includes(targetUserId)) {
      members.push(targetUserId);
    }
  } else {
    upsertUserArray(skippedSwipes, currentUserId, targetUserId);
  }

  const circleComplete = members.length >= size;

  const { error } = await supabase
    .from("circles")
    .update({
      pending_swipes: pendingSwipes,
      skipped_swipes: skippedSwipes,
      members: members,
      status: circleComplete ? "complete" : "forming",
    })
    .eq("id", circleId);

  if (error) {
    console.error("Error updating circle:", error);
    throw error;
  }

  return { mutualMatch, circleComplete };
};

export interface JoinCircleFilters {
  ageRange: [number, number];
  educationLevel: string;
  locationRadius: number;
  interests: Interest[];
  vibe?: string;
  genderMix?: "Male" | "Female" | "Both";
  traits?: ProfileTrait[];
}

export interface CircleCandidate {
  id: string;
  name: string;
  creatorId: string;
  size: number;
  members: string[];
  filters: JoinCircleFilters;
  meetupGoal: string;
  meetupTimeframe?: string;
  status: "forming" | "complete";
  createdAt: Date;
  distance?: number;
}

export const getCircleCandidates = async (
  userId: string,
  userProfile: User | null,
  filters: JoinCircleFilters,
): Promise<CircleCandidate[]> => {
  // Get all forming circles that are not created by this user
  const { data: circlesData, error } = await supabase
    .from("circles")
    .select("*")
    .eq("status", "forming")
    .neq("creator_id", userId);

  if (error) {
    console.error("Error getting circle candidates:", error);
    return [];
  }

  const userLocation = userProfile?.location;

  return (circlesData as CircleRow[])
    .map((row) => ({
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
      status: row.status,
      createdAt: new Date(row.created_at),
    }))
    .filter((circle) => {
      // Filter by user's preferences against circle's filters
      const [minAge, maxAge] = filters.ageRange;

      // Check if user's age is within circle's age range
      if (
        userProfile &&
        (userProfile.age < minAge || userProfile.age > maxAge)
      ) {
        return false;
      }

      // Check education level
      if (
        filters.educationLevel !== "Any" &&
        filters.educationLevel !== circle.filters.educationLevel
      ) {
        return false;
      }

      // Check interests overlap
      const requiredInterests = new Set<Interest>(filters.interests || []);
      if (requiredInterests.size > 0) {
        const circleInterests = circle.filters.interests || [];
        const hasSharedInterest = circleInterests.some((i) =>
          requiredInterests.has(i),
        );
        if (!hasSharedInterest) return false;
      }

      // Check gender mix preference
      if (
        filters.genderMix &&
        filters.genderMix !== "Both" &&
        userProfile &&
        userProfile.gender !== filters.genderMix
      ) {
        return false;
      }

      // Check traits overlap
      const requiredTraits = new Set<ProfileTrait>(filters.traits || []);
      if (requiredTraits.size > 0 && userProfile?.traits) {
        const userTraits = new Set(userProfile.traits);
        const hasSharedTrait = Array.from(requiredTraits).some((trait) =>
          userTraits.has(trait),
        );
        if (!hasSharedTrait) return false;
      }

      // Check distance if user has location
      if (userLocation && circle.creatorId) {
        // We need to get creator's location - for now, skip distance check
        // In production, you'd fetch creator's location from their profile
        // const distance = getDistanceKm(userLocation, creatorLocation);
        // if (distance > filters.locationRadius) return false;
      }

      return true;
    })
    .map((circle) => ({
      ...circle,
      distance: userLocation ? 0 : undefined, // Placeholder - would calculate actual distance
    }));
};

export const submitCircleSwipe = async (
  circleId: string,
  userId: string,
  liked: boolean,
): Promise<{ mutualMatch: boolean; addedToCircle: boolean }> => {
  // Get current circle data
  const { data: circle, error: fetchError } = await supabase
    .from("circles")
    .select("*")
    .eq("id", circleId)
    .single();

  if (fetchError || !circle) {
    throw new Error("Circle not found.");
  }

  const circleRow = circle as CircleRow;
  const pendingSwipes = { ...(circleRow.pending_swipes || {}) };
  const skippedSwipes = { ...(circleRow.skipped_swipes || {}) };
  const members = [...(circleRow.members || [])];
  const size = circleRow.size || 5;

  let mutualMatch = false;
  let addedToCircle = false;

  if (liked) {
    // Add user to pending swipes for this circle
    const currentPending = new Set(pendingSwipes[circleRow.creator_id] || []);
    currentPending.add(userId);
    pendingSwipes[circleRow.creator_id] = Array.from(currentPending);

    // Check if creator already liked this user (mutual match)
    const creatorPending = new Set(pendingSwipes[circleRow.creator_id] || []);
    mutualMatch = creatorPending.has(userId);

    // If mutual match and circle not full, add user
    if (mutualMatch && members.length < size && !members.includes(userId)) {
      members.push(userId);
      addedToCircle = true;
    }
  } else {
    // Add to skipped
    const currentSkipped = new Set(skippedSwipes[circleRow.creator_id] || []);
    currentSkipped.add(userId);
    skippedSwipes[circleRow.creator_id] = Array.from(currentSkipped);
  }

  const circleComplete = members.length >= size;

  const { error } = await supabase
    .from("circles")
    .update({
      pending_swipes: pendingSwipes,
      skipped_swipes: skippedSwipes,
      members: members,
      status: circleComplete ? "complete" : "forming",
    })
    .eq("id", circleId);

  if (error) {
    console.error("Error updating circle:", error);
    throw error;
  }

  return { mutualMatch, addedToCircle };
};
