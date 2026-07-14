import { supabase } from "./supabase";
import type { MeetupExperience, MeetupCategory } from "./meetupPlanning";

export type CommunityEventStatus =
  "pending" | "approved" | "rejected" | "cancelled" | "removed";

type PublishInput = {
  circleId: string;
  title: string;
  category: Exclude<MeetupCategory, "All">;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  startsAt: string;
  bookingUrl?: string;
  priceLabel?: string;
  capacity?: number;
  media: NonNullable<MeetupExperience["media"]>;
};

const toExperience = (row: any): MeetupExperience => ({
  id: String(row.id),
  title: row.title,
  category: row.category,
  location: row.location_name,
  coordinates:
    row.latitude != null && row.longitude != null
      ? { lat: row.latitude, lng: row.longitude }
      : undefined,
  media: Array.isArray(row.media) ? row.media : [],
  price: row.price_label || "Free",
  description: row.description || "",
  bookingUrl: row.booking_url || undefined,
  isPublic: true,
  isCommunityEvent: true,
  creatorId: row.owner_id,
  organizerType: row.organizer_type || "user",
  organizationId: row.organization_id || undefined,
  capacity: row.capacity ?? undefined,
  status: row.status,
  startsAt: row.starts_at,
  expiresAt: row.ends_at || row.starts_at,
  votes: [],
});

export async function publishCommunityEvent(
  input: PublishInput,
): Promise<MeetupExperience> {
  const { data, error } = await supabase.rpc("publish_community_event", {
    p_circle_id: input.circleId,
    p_title: input.title,
    p_category: input.category,
    p_description: input.description,
    p_location_name: input.location,
    p_latitude: input.latitude ?? null,
    p_longitude: input.longitude ?? null,
    p_starts_at: input.startsAt,
    p_booking_url: input.bookingUrl ?? null,
    p_price_label: input.priceLabel || "Free",
    p_capacity: input.capacity ?? null,
    p_media: input.media,
  });
  if (error) throw error;
  return toExperience(data);
}

export async function getCommunityEvents(
  startsAt?: string,
): Promise<MeetupExperience[]> {
  let query = supabase
    .from("community_events")
    .select("*")
    .eq("status", "approved")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(50);
  if (startsAt) {
    const target = new Date(startsAt);
    const from = new Date(target.getTime() - 4 * 60 * 60 * 1000);
    const to = new Date(target.getTime() + 4 * 60 * 60 * 1000);
    query = query
      .gte("starts_at", from.toISOString())
      .lte("starts_at", to.toISOString());
  }
  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  return (data ?? []).map(toExperience);
}

export async function hasUsedMonthlyPublicEvent(): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("community_events")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", auth.user.id)
    .gte("created_at", start.toISOString())
    .not("status", "in", '("rejected","cancelled","removed")');
  if (error) return false;
  return (count ?? 0) > 0;
}

export async function reportCommunityEvent(eventId: string, reason: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in required");
  const { error } = await supabase
    .from("community_event_reports")
    .insert({ event_id: eventId, reporter_id: auth.user.id, reason });
  if (error) throw error;
}

export async function cancelCommunityEvent(eventId: string) {
  const { error } = await supabase.rpc("cancel_community_event", {
    p_event_id: eventId,
  });
  if (error) throw error;
}

export async function getPendingCommunityEvents(): Promise<MeetupExperience[]> {
  const { data, error } = await supabase
    .from("community_events")
    .select("*")
    .eq("status", "pending")
    .order("created_at")
    .limit(100);
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  return (data ?? []).map(toExperience);
}

export async function reviewCommunityEvent(
  eventId: string,
  decision: "approved" | "rejected",
  note?: string,
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in required");
  const { error } = await supabase
    .from("community_events")
    .update({
      status: decision,
      moderation_note: note ?? null,
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);
  if (error) throw error;
}
