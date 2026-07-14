import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

export type MeetupCategory =
  "All" | "Food" | "Games" | "Sports" | "Music" | "Outdoors";
export type MeetupPlanStep = "time" | "experience" | "review" | "scheduled";

export interface TimeOption {
  id: string;
  label: string;
  detail: string;
  votes: string[];
  startsAt?: string;
}

export interface MeetupExperience {
  id: string;
  title: string;
  category: Exclude<MeetupCategory, "All">;
  location: string;
  coordinates?: { lat: number; lng: number };
  media?: {
    path: string;
    type: "image" | "video";
    durationMs?: number | null;
  }[];
  price: string;
  description: string;
  bookingUrl?: string;
  sponsored?: boolean;
  isPublic?: boolean;
  isCreatedByCircle?: boolean;
  isCommunityEvent?: boolean;
  creatorId?: string;
  organizerType?: "user" | "organization";
  organizationId?: string;
  capacity?: number;
  status?: "pending" | "approved" | "rejected" | "cancelled" | "removed";
  startsAt?: string;
  votes: string[];
  expiresAt?: string;
  availableTimeIds?: string[];
}

export interface MeetupPlan {
  step: MeetupPlanStep;
  timeOptions: TimeOption[];
  selectedTimeId?: string;
  experiences: MeetupExperience[];
  selectedExperienceId?: string;
  confirmedMemberIds: string[];
  updatedAt: string;
}

const keyForCircle = (circleId: string) => `socio:meetup-plan:${circleId}`;

const nextWeekdayAt = (weekday: number, hour: number) => {
  const value = new Date();
  value.setHours(hour, 0, 0, 0);
  let days = (weekday - value.getDay() + 7) % 7;
  if (days === 0 && value.getTime() <= Date.now()) days = 7;
  value.setDate(value.getDate() + days);
  return value.toISOString();
};

export const createInitialMeetupPlan = (): MeetupPlan => ({
  step: "time",
  timeOptions: [
    {
      id: "sat-11",
      label: "Saturday",
      detail: "11:00 AM",
      votes: [],
      startsAt: nextWeekdayAt(6, 11),
    },
    {
      id: "sat-15",
      label: "Saturday",
      detail: "3:00 PM",
      votes: [],
      startsAt: nextWeekdayAt(6, 15),
    },
    {
      id: "sun-11",
      label: "Sunday",
      detail: "11:00 AM",
      votes: [],
      startsAt: nextWeekdayAt(0, 11),
    },
  ],
  experiences: [
    {
      id: "board-game-night",
      title: "Board Game Night",
      category: "Games",
      location: "The Grid, Ikeja",
      price: "₦2,500 / person",
      description:
        "Strategy, laughs and friendly competition for small groups.",
      bookingUrl: "https://example.com/book/board-game-night",
      isPublic: true,
      votes: [],
      availableTimeIds: ["sat-15"],
    },
    {
      id: "coffee-connect",
      title: "Coffee & Connect",
      category: "Food",
      location: "Cafe Neo, GRA Ikeja",
      price: "Free entry",
      description:
        "A relaxed table reserved for new circles to meet over coffee.",
      isPublic: true,
      votes: [],
      availableTimeIds: ["sat-11", "sat-15", "sun-11"],
    },
    {
      id: "paint-sip",
      title: "Paint & Sip",
      category: "Music",
      location: "Art House, Lekki",
      price: "₦8,000 / person",
      description: "A guided painting session with music and refreshments.",
      bookingUrl: "https://example.com/book/paint-and-sip",
      isPublic: true,
      votes: [],
      availableTimeIds: ["sat-15"],
    },
    {
      id: "sunset-walk",
      title: "Sunset Park Walk",
      category: "Outdoors",
      location: "Ndubuisi Kanu Park, Ikeja",
      price: "Free",
      description: "An easy outdoor walk with room to talk and unwind.",
      isPublic: true,
      votes: [],
      availableTimeIds: ["sat-15", "sun-11"],
    },
  ],
  confirmedMemberIds: [],
  updatedAt: new Date().toISOString(),
});

export const loadMeetupPlan = async (circleId: string): Promise<MeetupPlan> => {
  const { data, error } = await supabase
    .from("circle_meetup_plans")
    .select("plan")
    .eq("circle_id", circleId)
    .maybeSingle();

  if (!error && data?.plan) {
    const sharedPlan = data.plan as MeetupPlan;
    await AsyncStorage.setItem(
      keyForCircle(circleId),
      JSON.stringify(sharedPlan),
    );
    return sharedPlan;
  }

  if (error && error.code !== "42P01" && error.code !== "PGRST205") {
    console.warn("Could not load shared meetup plan:", error);
  }

  const stored = await AsyncStorage.getItem(keyForCircle(circleId));
  if (!stored) return createInitialMeetupPlan();
  try {
    return JSON.parse(stored) as MeetupPlan;
  } catch {
    return createInitialMeetupPlan();
  }
};

export const saveMeetupPlan = async (circleId: string, plan: MeetupPlan) => {
  const savedPlan = { ...plan, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(keyForCircle(circleId), JSON.stringify(savedPlan));

  const { error } = await supabase.from("circle_meetup_plans").upsert(
    {
      circle_id: circleId,
      plan: savedPlan,
      updated_at: savedPlan.updatedAt,
    },
    { onConflict: "circle_id" },
  );

  if (error && error.code !== "42P01" && error.code !== "PGRST205") {
    console.warn("Could not save shared meetup plan:", error);
  }
};

export const hasMeetupPlanningStarted = (plan: MeetupPlan) =>
  Boolean(
    plan.selectedTimeId ||
    plan.selectedExperienceId ||
    plan.confirmedMemberIds.length ||
    plan.step !== "time",
  );

/** Returns the first planning stage this member still needs to complete. */
export const getMeetupStepForMember = (
  plan: MeetupPlan,
  memberId: string,
  memberCount: number,
): MeetupPlanStep => {
  if (plan.step === "scheduled") return "scheduled";

  const selectedTime = plan.timeOptions.find(
    (option) => option.id === plan.selectedTimeId,
  );
  const memberVotedForTime = Boolean(selectedTime?.votes.includes(memberId));
  const timeVoteComplete = Boolean(
    selectedTime && selectedTime.votes.length >= memberCount,
  );
  if (!selectedTime || !memberVotedForTime || !timeVoteComplete) return "time";

  const selectedExperience = plan.experiences.find(
    (experience) => experience.id === plan.selectedExperienceId,
  );
  const memberVotedForExperience = Boolean(
    selectedExperience?.votes.includes(memberId),
  );
  const experienceVoteComplete = Boolean(
    selectedExperience && selectedExperience.votes.length >= memberCount,
  );
  if (
    !selectedExperience ||
    !memberVotedForExperience ||
    !experienceVoteComplete
  ) {
    return "experience";
  }

  if (!plan.confirmedMemberIds.includes(memberId)) return "review";
  return "scheduled";
};
