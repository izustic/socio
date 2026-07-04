export interface ProfileMedia {
  id: string;
  uri: string;
  remoteUrl: string;
  type: "image" | "video";
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  durationMs?: number | null;
}

export interface User {
  uid: string;
  id?: string; // Supabase uses 'id', 'uid' is for backward compatibility
  name: string;
  age: number;
  gender: "Male" | "Female" | "Non-binary" | "Prefer not to say";
  interests: Interest[];
  traits?: ProfileTrait[];
  media?: ProfileMedia[];
  education: EducationLevel | "";
  location?: { lat: number; lng: number; city?: string };
  photoURL: string;
  bio?: string;
  notificationsEnabled?: boolean;
  locationEnabled?: boolean;
  freeExits?: number;
  profileComplete: boolean;
  createdAt: Date;
}

export type Interest =
  | "Music"
  | "Travel"
  | "Books"
  | "Gaming"
  | "Fitness"
  | "Art"
  | "Food"
  | "Film"
  | "Photo"
  | "Outdoors"
  | "Tech"
  | "Sports"
  | "Coffee"
  | "Nature"
  | "Pets"
  | "Wellness"
  | "Theatre";

export type EducationLevel =
  | "High school"
  | "In college"
  | "Finished college"
  | "Postgraduate"
  | "Trade school"
  | "Prefer not to say";

export type ProfileTrait =
  | "Introverted"
  | "Extroverted"
  | "Adventurous"
  | "Laid-back"
  | "Intellectual"
  | "Funny"
  | "Ambitious"
  | "Creative"
  | "Loyal"
  | "Open-minded"
  | "Active"
  | "Artsy"
  | "Deep thinker"
  | "Spontaneous";

export type CircleStatus = "forming" | "complete";

export interface Circle {
  id: string;
  name: string;
  creatorId: string;
  size: number;
  members: string[];
  pendingSwipes: Record<string, string[]>;
  filters: CircleFilters;
  meetupGoal?: string;
  meetupTimeframe?: string;
  meetupDays?: number;
  meetupDeadline?: Date | null;
  imageUrl?: string | null;
  status: CircleStatus;
  createdAt: Date;
}

export interface CircleFilters {
  ageRange: [number, number];
  educationLevel: string;
  locationRadius: number;
  interests: Interest[];
  vibe?: string;
  genderMix?: "Male" | "Female" | "Both";
  traits?: ProfileTrait[];
}

export interface Message {
  id: string;
  circleId?: string;
  senderId: string;
  senderName: string;
  text: string;
  pollId?: string | null;
  mediaUrl?: string | null;
  mediaUrls?: string[];
  mediaType?: "image" | "video" | "audio" | null;
  replyTo?: {
    messageId: string;
    senderName: string;
    text: string;
    mediaType?: "image" | "video" | "audio" | null;
  } | null;
  timestamp: Date;
}
