import AsyncStorage from "@react-native-async-storage/async-storage";

export type MeetupCategory = "All" | "Food" | "Games" | "Sports" | "Music" | "Outdoors";
export type MeetupPlanStep = "time" | "experience" | "review" | "scheduled";

export interface TimeOption {
  id: string;
  label: string;
  detail: string;
  votes: string[];
}

export interface MeetupExperience {
  id: string;
  title: string;
  category: Exclude<MeetupCategory, "All">;
  location: string;
  price: string;
  description: string;
  bookingUrl?: string;
  sponsored?: boolean;
  isPublic?: boolean;
  isCreatedByCircle?: boolean;
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

export const createInitialMeetupPlan = (): MeetupPlan => ({
  step: "time",
  timeOptions: [
    { id: "sat-11", label: "Saturday", detail: "11:00 AM", votes: [] },
    { id: "sat-15", label: "Saturday", detail: "3:00 PM", votes: [] },
    { id: "sun-11", label: "Sunday", detail: "11:00 AM", votes: [] },
  ],
  experiences: [
    {
      id: "board-game-night",
      title: "Board Game Night",
      category: "Games",
      location: "The Grid, Ikeja",
      price: "₦2,500 / person",
      description: "Strategy, laughs and friendly competition for small groups.",
      bookingUrl: "https://example.com/book/board-game-night",
      sponsored: true,
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
      description: "A relaxed table reserved for new circles to meet over coffee.",
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
  const stored = await AsyncStorage.getItem(keyForCircle(circleId));
  if (!stored) return createInitialMeetupPlan();
  try {
    return JSON.parse(stored) as MeetupPlan;
  } catch {
    return createInitialMeetupPlan();
  }
};

export const saveMeetupPlan = async (circleId: string, plan: MeetupPlan) => {
  await AsyncStorage.setItem(
    keyForCircle(circleId),
    JSON.stringify({ ...plan, updatedAt: new Date().toISOString() }),
  );
};
