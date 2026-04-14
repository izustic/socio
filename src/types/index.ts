export interface User {
  uid: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';
  interests: Interest[];
  education: string;
  location: { lat: number; lng: number };
  photoURL: string;
  bio?: string;
  profileComplete: boolean;
  createdAt: Date;
}

export type Interest =
  | 'Music' | 'Travel' | 'Books' | 'Gaming'
  | 'Fitness' | 'Art' | 'Food' | 'Film';

export type CircleStatus = 'forming' | 'complete';

export interface Circle {
  id: string;
  name: string;
  creatorId: string;
  size: number;
  members: string[];
  pendingSwipes: Record<string, string[]>;
  filters: CircleFilters;
  status: CircleStatus;
  createdAt: Date;
}

export interface CircleFilters {
  ageRange: [number, number];
  educationLevel: string;
  locationRadius: number;
  interests: Interest[];
  vibe?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}