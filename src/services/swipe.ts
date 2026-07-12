import {
    Circle,
    EducationLevel,
    Interest,
    ProfileMedia,
    ProfileTrait,
    User,
} from "../types";
import { supabase } from "./supabase";
import { createNotification, createNotifications } from "./notifications";
import { translateActiveResource, translateResource } from "./TranslationService";

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
  meetup_days?: number;
  meetup_deadline?: string | null;
  status: "forming" | "complete";
  created_at: string;
  image_url?: string;
}

interface UserRow {
  id: string;
  display_name: string;
  age: number;
  gender: string;
  interests: Interest[];
  traits: string[];
  media: { uri: string; remoteUrl?: string }[];
  education: EducationLevel | "";
  location: { lat: number; lng: number; city?: string } | null;
  photo_url: string;
  bio: string;
  created_at: string;
}

interface NotificationCircleRow {
  id: string;
  name: string;
  creator_id: string;
  size: number;
  members: string[];
}

interface ActiveCircleOccupancyRow {
  creator_id: string;
  members: string[] | null;
}

const getActiveCircleOccupantIds = async (): Promise<Set<string>> => {
  const { data, error } = await supabase
    .from("circles")
    .select("creator_id, members")
    .in("status", ["forming", "complete"]);

  if (error) {
    console.error("Error getting active circle occupants:", error);
    return new Set();
  }

  const occupantIds = new Set<string>();

  (data as ActiveCircleOccupancyRow[] | null)?.forEach((circle) => {
    if (circle.creator_id) {
      occupantIds.add(String(circle.creator_id));
    }

    (circle.members || []).forEach((memberId) => {
      if (memberId) {
        occupantIds.add(String(memberId));
      }
    });
  });

  return occupantIds;
};

const getUserDisplayName = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from("users")
    .select("display_name, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error getting notification actor:", error);
    return translateResource("en", "notification.someone");
  }

  return data?.display_name || data?.email?.split("@")[0] || translateResource("en", "notification.someone");
};

const localizedNotificationData = (
  titleKey: string,
  bodyKey: string,
  params: Record<string, string | number>,
  data: Record<string, unknown>,
) => ({
  ...data,
  i18n: {
    titleKey,
    bodyKey,
    params,
  },
});

const getNotificationCircle = async (
  circleId: string,
): Promise<NotificationCircleRow | null> => {
  const { data, error } = await supabase
    .from("circles")
    .select("id, name, creator_id, size, members")
    .eq("id", circleId)
    .maybeSingle();

  if (error) {
    console.error("Error getting circle for notification:", error);
    return null;
  }

  return data as NotificationCircleRow | null;
};

const notifyCircleProgress = async (
  circle: NotificationCircleRow,
) => {
  const members = (circle.members || []).map((memberId) => String(memberId));
  const remaining = Math.max(circle.size - members.length, 0);

  if (remaining === 0) {
    await createNotifications(
      members,
      "circle_complete",
      translateResource("en", "notification.circleComplete.title"),
      translateResource("en", "notification.circleComplete.body", { circleName: circle.name }),
      localizedNotificationData(
        "notification.circleComplete.title",
        "notification.circleComplete.body",
        { circleName: circle.name },
        {
        action: "circle_complete",
        circleId: circle.id,
        },
      ),
    );
    return;
  }

  if (remaining === 1) {
    await createNotification(
      circle.creator_id,
      "circle_almost_full",
      translateResource("en", "notification.circleAlmostFull.title"),
      translateResource("en", "notification.circleAlmostFull.body"),
      localizedNotificationData(
        "notification.circleAlmostFull.title",
        "notification.circleAlmostFull.body",
        {},
        {
        action: "circle_progress",
        circleId: circle.id,
        },
      ),
    );
  }
};

const notifySwipeOutcome = async ({
  circleId,
  actorId,
  targetUserId,
  liked,
  result,
  source,
}: {
  circleId: string;
  actorId: string;
  targetUserId?: string;
  liked: boolean;
  result: {
    mutualMatch: boolean;
    addedToCircle: boolean;
    circleComplete: boolean;
  };
  source: "host" | "joiner";
}) => {
  if (!liked) return;

  try {
    const [circle, actorName] = await Promise.all([
      getNotificationCircle(circleId),
      getUserDisplayName(actorId),
    ]);

    if (!circle) return;

    if (source === "joiner") {
      if (result.addedToCircle) {
        await createNotification(
          circle.creator_id,
          "circle_accepted",
          translateResource("en", "notification.circleAccepted.title", { actorName }),
          translateResource("en", "notification.circleAccepted.hostBody", { circleName: circle.name }),
          localizedNotificationData(
            "notification.circleAccepted.title",
            "notification.circleAccepted.hostBody",
            { actorName, circleName: circle.name },
            {
            action: "circle_progress",
            actorId,
            circleId,
            },
          ),
        );
      } else {
        await createNotification(
          circle.creator_id,
          "circle_invite",
          translateResource("en", "notification.circleInvite.title", { actorName }),
          translateResource("en", "notification.circleInvite.body", { actorName, circleName: circle.name }),
          localizedNotificationData(
            "notification.circleInvite.title",
            "notification.circleInvite.body",
            { actorName, circleName: circle.name },
            {
            action: "review_joiner",
            actorId,
            circleId,
            },
          ),
        );
      }
    }

    if (source === "host" && targetUserId && result.addedToCircle) {
      await createNotification(
        targetUserId,
        "circle_accepted",
        translateResource("en", "notification.circleAccepted.title", { actorName }),
        translateResource("en", "notification.circleAccepted.joinerBody", { circleName: circle.name }),
        localizedNotificationData(
          "notification.circleAccepted.title",
          "notification.circleAccepted.joinerBody",
          { actorName, circleName: circle.name },
          {
          action: "circle_progress",
          actorId,
          circleId,
          },
        ),
      );
    }

    if (result.addedToCircle || result.circleComplete) {
      const updatedCircle = await getNotificationCircle(circleId);
      if (updatedCircle) {
        await notifyCircleProgress(updatedCircle);
      }
    }
  } catch (error) {
    console.error("Error creating swipe notifications:", error);
  }
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
    members: (row.members || []).map((id) => String(id)),
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
    meetupDays: row.meetup_days,
    meetupDeadline: row.meetup_deadline ? new Date(row.meetup_deadline) : null,
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
    members: (row.members || []).map((id) => String(id)),
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
    meetupDays: row.meetup_days,
    meetupDeadline: row.meetup_deadline ? new Date(row.meetup_deadline) : null,
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
    members: (row.members || []).map((id) => String(id)),
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
    meetupDays: row.meetup_days,
    meetupDeadline: row.meetup_deadline ? new Date(row.meetup_deadline) : null,
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
}: CandidateParams): Promise<SwipeCandidate[]> => {
  const [{ data: usersData, error }, activeCircleOccupantIds] =
    await Promise.all([
      supabase.from("users").select("*"),
      getActiveCircleOccupantIds(),
    ]);

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
      if (activeCircleOccupantIds.has(candidate.uid)) return false;
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

      // Distance filtering is temporarily disabled while the user pool is small.
      // Keep saving locationRadius on Circles so this can be restored later.

      return true;
    })
    .sort((a, b) => {
      const aAlreadyLikedCircle = circle.pendingSwipes?.[a.uid]?.includes(circle.id)
        ? 1
        : 0;
      const bAlreadyLikedCircle = circle.pendingSwipes?.[b.uid]?.includes(circle.id)
        ? 1
        : 0;
      return bAlreadyLikedCircle - aAlreadyLikedCircle;
    });
};

export const submitSwipe = async (
  circleId: string,
  currentUserId: string,
  targetUserId: string,
  liked: boolean,
): Promise<{
  mutualMatch: boolean;
  addedToCircle: boolean;
  circleComplete: boolean;
}> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== currentUserId) {
    throw new Error(translateActiveResource("auth.sessionExpired"));
  }

  const { data, error } = await supabase.rpc("submit_host_swipe", {
    p_circle_id: circleId,
    p_target_user_id: targetUserId,
    p_liked: liked,
  });

  if (error) {
    console.error("Error submitting host swipe:", error);
    throw error;
  }

  const result = data as {
    mutualMatch?: boolean;
    addedToCircle?: boolean;
    circleComplete?: boolean;
  } | null;

  const swipeResult = {
    mutualMatch: Boolean(result?.mutualMatch),
    addedToCircle: Boolean(result?.addedToCircle),
    circleComplete: Boolean(result?.circleComplete),
  };

  await notifySwipeOutcome({
    circleId,
    actorId: currentUserId,
    targetUserId,
    liked,
    result: swipeResult,
    source: "host",
  });

  return swipeResult;
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
  meetupDays?: number;
  meetupDeadline?: Date | null;
  status: "forming" | "complete";
  createdAt: Date;
  distance?: number;
  imageUrl?: string;
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

  return (circlesData as CircleRow[])
    .filter((row) => {
      if ((row.members || []).includes(userId)) return false;
      if ((row.pending_swipes?.[userId] || []).includes(row.id)) return false;
      if ((row.skipped_swipes?.[userId] || []).includes(row.id)) return false;
      return true;
    })
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
      meetupDays: row.meetup_days,
      meetupDeadline: row.meetup_deadline
        ? new Date(row.meetup_deadline)
        : null,
      status: row.status,
      createdAt: new Date(row.created_at),
      imageUrl: row.image_url,
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

      // Distance filtering is temporarily disabled while the Circle pool is small.
      // Keep accepting/saving locationRadius so this can be restored later.

      return true;
    })
    .map((circle) => ({
      ...circle,
      distance: undefined,
    }));
};

export const submitCircleSwipe = async (
  circleId: string,
  userId: string,
  liked: boolean,
): Promise<{
  mutualMatch: boolean;
  addedToCircle: boolean;
  circleComplete: boolean;
}> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error(translateActiveResource("auth.sessionExpired"));
  }

  const { data, error } = await supabase.rpc("submit_circle_swipe", {
    p_circle_id: circleId,
    p_liked: liked,
  });

  if (error) {
    console.error("Error submitting circle swipe:", error);
    throw error;
  }

  const result = data as {
    mutualMatch?: boolean;
    addedToCircle?: boolean;
    circleComplete?: boolean;
  } | null;

  const swipeResult = {
    mutualMatch: Boolean(result?.mutualMatch),
    addedToCircle: Boolean(result?.addedToCircle),
    circleComplete: Boolean(result?.circleComplete),
  };

  await notifySwipeOutcome({
    circleId,
    actorId: userId,
    liked,
    result: swipeResult,
    source: "joiner",
  });

  return swipeResult;
};
