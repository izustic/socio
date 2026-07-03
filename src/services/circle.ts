import type { RealtimeChannel } from "@supabase/supabase-js";
import * as Crypto from "expo-crypto";
import { Circle, Interest } from "../types";
import {
  buildCreateCirclePayload,
  CreateCircleInput,
  resolveAppTabVisibility,
  rowToCircle,
  type AppTabVisibility,
  type CircleRow,
} from "./circle.helpers";
import { supabase, uploadCircleImage } from "./supabase";

const isMissingCircleImageColumnError = (error: unknown) =>
  Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "PGRST204" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.includes("'image_url' column"),
  );

export const createCircle = async (
  input: CreateCircleInput,
): Promise<string> => {
  try {
    const circleId = Crypto.randomUUID();
    const imageUrl = input.circleImageUri
      ? await uploadCircleImage(input.creatorId, circleId, input.circleImageUri)
      : input.imageUrl;
    const payload = buildCreateCirclePayload(circleId, {
      ...input,
      imageUrl,
    });
    const fallbackPayload: Record<string, unknown> = { ...payload };
    delete fallbackPayload.image_url;

    console.log("createCircle payload:", payload);

    let { data, error } = await supabase
      .from("circles")
      .insert(payload)
      .select("id")
      .single();

    if (isMissingCircleImageColumnError(error)) {
      console.warn(
        "circles.image_url is not available in Supabase yet; creating Circle without an image.",
      );
      const fallbackResult = await supabase
        .from("circles")
        .insert(fallbackPayload)
        .select("id")
        .single();
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) throw error;

    if (!data) throw new Error("Circle was created without returning an id.");

    console.log("Circle created:", data.id);
    return data.id;
  } catch (error) {
    console.error("Error creating circle:", error);
    throw error;
  }
};

export const getCircle = async (circleId: string): Promise<Circle | null> => {
  try {
    const { data, error } = await supabase
      .from("circles")
      .select("*")
      .eq("id", circleId)
      .maybeSingle();

    if (error) throw error;
    if (data) return rowToCircle(data as CircleRow);
    return null;
  } catch (error) {
    console.error("Error getting circle:", error);
    return null;
  }
};

export type CircleParticipationRole = "host" | "joiner";

export type { AppTabVisibility } from "./circle.helpers";

export const getAppTabVisibility = async (
  userId: string,
  options: { joinBrowsingActive?: boolean } = {},
): Promise<AppTabVisibility> => {
  const circle = await getLatestCircleForParticipant(userId);
  return resolveAppTabVisibility(
    circle,
    userId,
    options.joinBrowsingActive ?? false,
  );
};

/** @deprecated Prefer getAppTabVisibility — kept for existing imports. */
export const shouldHideSwipeTab = async (userId: string): Promise<boolean> => {
  const visibility = await getAppTabVisibility(userId);
  return !visibility.swipeTabVisible;
};

/** Circle the user hosts (forming) or has joined as a member. */
export const getUserCircleParticipation = async (
  userId: string,
): Promise<{ circle: Circle | null; role: CircleParticipationRole | null }> => {
  try {
    const { data: hostData, error: hostError } = await supabase
      .from("circles")
      .select("*")
      .eq("creator_id", userId)
      .eq("status", "forming")
      .order("created_at", { ascending: false })
      .limit(1);

    if (hostError) throw hostError;
    if (hostData && hostData.length > 0) {
      return {
        circle: rowToCircle(hostData[0] as CircleRow),
        role: "host",
      };
    }

    const participantCircle = await getLatestCircleForParticipant(userId);
    if (participantCircle?.members.includes(userId)) {
      return { circle: participantCircle, role: "joiner" };
    }

    return { circle: null, role: null };
  } catch (error) {
    console.error("Error getting user circle participation:", error);
    return { circle: null, role: null };
  }
};

export const getLatestCircleForParticipant = async (
  userId: string,
): Promise<Circle | null> => {
  try {
    const { data: creatorData, error: creatorError } = await supabase
      .from("circles")
      .select("*")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (creatorError) throw creatorError;
    if (creatorData && creatorData.length > 0) {
      return rowToCircle(creatorData[0] as CircleRow);
    }

    const { data: memberData, error: memberError } = await supabase
      .from("circles")
      .select("*")
      .contains("members", [userId])
      .order("created_at", { ascending: false })
      .limit(1);

    if (memberError) throw memberError;
    if (memberData && memberData.length > 0) {
      return rowToCircle(memberData[0] as CircleRow);
    }

    return null;
  } catch (error) {
    console.error("Error getting latest circle for participant:", error);
    return null;
  }
};

export const updateCircle = async (
  circleId: string,
  updates: Partial<Circle>,
): Promise<void> => {
  try {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.size !== undefined) dbUpdates.size = updates.size;
    if (updates.members !== undefined) dbUpdates.members = updates.members;
    if (updates.pendingSwipes !== undefined)
      dbUpdates.pending_swipes = updates.pendingSwipes;
    if (updates.filters !== undefined) {
      dbUpdates.filters = {
        age_range: updates.filters.ageRange,
        education_level: updates.filters.educationLevel,
        location_radius: updates.filters.locationRadius,
        interests: updates.filters.interests,
        vibe: updates.filters.vibe || "",
        gender_mix: updates.filters.genderMix || "Both",
        traits: updates.filters.traits || [],
      };
    }
    if (updates.meetupGoal !== undefined)
      dbUpdates.meetup_goal = updates.meetupGoal;
    if (updates.meetupTimeframe !== undefined)
      dbUpdates.meetup_timeframe = updates.meetupTimeframe;
    if (updates.meetupDays !== undefined)
      dbUpdates.meetup_days = updates.meetupDays;
    if (updates.meetupDeadline !== undefined)
      dbUpdates.meetup_deadline =
        updates.meetupDeadline instanceof Date
          ? updates.meetupDeadline.toISOString()
          : updates.meetupDeadline;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    let { error } = await supabase
      .from("circles")
      .update(dbUpdates)
      .eq("id", circleId);

    if (isMissingCircleImageColumnError(error)) {
      console.warn(
        "circles.image_url is not available in Supabase yet; saving Circle changes without the image.",
      );
      const fallbackUpdates = { ...dbUpdates };
      delete fallbackUpdates.image_url;
      const fallbackResult = await supabase
        .from("circles")
        .update(fallbackUpdates)
        .eq("id", circleId);
      error = fallbackResult.error;
    }

    if (error) throw error;
  } catch (error) {
    console.error("Error updating circle:", error);
    throw error;
  }
};

export const addMember = async (
  circleId: string,
  userId: string,
): Promise<void> => {
  try {
    // First get current members
    const { data: circle, error: fetchError } = await supabase
      .from("circles")
      .select("members, size")
      .eq("id", circleId)
      .single();

    if (fetchError) throw fetchError;

    // Check if already a member
    if (circle.members.includes(userId)) {
      console.log("User already a member");
      return;
    }

    // Check if circle is full
    if (circle.members.length >= circle.size) {
      throw new Error("Circle is full");
    }

    // Add member
    const newMembers = [...circle.members, userId];
    const { error } = await supabase
      .from("circles")
      .update({ members: newMembers })
      .eq("id", circleId);

    if (error) throw error;
  } catch (error) {
    console.error("Error adding member:", error);
    throw error;
  }
};

export const removeMember = async (
  circleId: string,
  userId: string,
): Promise<void> => {
  try {
    const { data: circle, error: fetchError } = await supabase
      .from("circles")
      .select("members")
      .eq("id", circleId)
      .single();

    if (fetchError) throw fetchError;

    const newMembers = circle.members.filter((id: string) => id !== userId);

    const { error } = await supabase
      .from("circles")
      .update({ members: newMembers })
      .eq("id", circleId);

    if (error) throw error;
  } catch (error) {
    console.error("Error removing member:", error);
    throw error;
  }
};

export const closeCircle = async (circleId: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc("close_circle", {
      p_circle_id: circleId,
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error closing circle:", error);
    throw error;
  }
};

export const addPendingJoiner = async (
  circleId: string,
  userId: string,
): Promise<void> => {
  try {
    const { error } = await supabase.from("circle_pending").insert({
      circle_id: circleId,
      user_id: userId,
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error adding pending joiner:", error);
    throw error;
  }
};

export const getPendingJoiners = async (
  circleId: string,
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("circle_pending")
      .select("user_id")
      .eq("circle_id", circleId);

    if (error) throw error;
    return data?.map((row) => row.user_id) ?? [];
  } catch (error) {
    console.error("Error getting pending joiners:", error);
    return [];
  }
};

export const removePendingJoiner = async (
  circleId: string,
  userId: string,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("circle_pending")
      .delete()
      .eq("circle_id", circleId)
      .eq("user_id", userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error removing pending joiner:", error);
    throw error;
  }
};

export const getCirclesForJoiner = async (filters: {
  ageRange?: [number, number];
  educationLevel?: string;
  interests?: Interest[];
}): Promise<Circle[]> => {
  try {
    let query = supabase.from("circles").select("*").eq("status", "forming");

    if (filters.ageRange) {
      query = query
        .gte("age_range", filters.ageRange[0])
        .lte("age_range", filters.ageRange[1]);
    }

    if (filters.educationLevel) {
      query = query.eq("education_level", filters.educationLevel);
    }

    if (filters.interests && filters.interests.length > 0) {
      query = query.contains("interests", filters.interests);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.map((row) => rowToCircle(row as CircleRow)) ?? [];
  } catch (error) {
    console.error("Error getting circles for joiner:", error);
    return [];
  }
};

export const getCirclesForUser = async (userId: string): Promise<Circle[]> => {
  try {
    const { data, error } = await supabase
      .from("circles")
      .select("*")
      .contains("members", [userId]);

    if (error) throw error;
    return data?.map((row) => rowToCircle(row as CircleRow)) ?? [];
  } catch (error) {
    console.error("Error getting circles for user:", error);
    return [];
  }
};

export const subscribeToCircle = (
  circleId: string,
  callback: (payload: unknown) => void,
): RealtimeChannel => {
  const channel = supabase
    .channel(`circle:${circleId}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "circles",
        filter: `id=eq.${circleId}`,
      },
      callback,
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "circle_members",
        filter: `circle_id=eq.${circleId}`,
      },
      callback,
    )
    .subscribe();

  return channel;
};
