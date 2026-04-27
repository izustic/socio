import { Interest, ProfileTrait, User } from '@/src/types';

export type OnboardingStep =
  | 'otp'
  | 'location-permission'
  | 'notifications-permission'
  | 'onboarding-intro'
  | 'profile-photo-name'
  | 'profile-age-gender'
  | 'profile-interests'
  | 'profile-traits'
  | 'profile-complete';

export const ONBOARDING_ROUTE_MAP: Record<OnboardingStep, string> = {
  otp: '/otp',
  'location-permission': '/location-permission',
  'notifications-permission': '/notifications-permission',
  'onboarding-intro': '/onboarding-intro',
  'profile-photo-name': '/profile-photo-name',
  'profile-age-gender': '/profile-age-gender',
  'profile-interests': '/profile-interests',
  'profile-traits': '/profile-traits',
  'profile-complete': '/profile-complete',
};

export const DEFAULT_ONBOARDING_STEP: OnboardingStep = 'location-permission';

export const getOnboardingRoute = (step: OnboardingStep) => ONBOARDING_ROUTE_MAP[step];

export const ONBOARDING_INTERESTS: Interest[] = [
  'Music',
  'Books',
  'Film',
  'Travel',
  'Fitness',
  'Food',
  'Gaming',
  'Art',
  'Wellness',
  'Photo',
  'Outdoors',
  'Tech',
  'Sports',
  'Coffee',
  'Nature',
  'Pets',
  'Theatre',
];

export const ONBOARDING_TRAITS: ProfileTrait[] = [
  'Introverted',
  'Extroverted',
  'Adventurous',
  'Laid-back',
  'Intellectual',
  'Funny',
  'Ambitious',
  'Creative',
  'Loyal',
  'Open-minded',
  'Active',
  'Artsy',
  'Deep thinker',
  'Spontaneous',
];

export const GENDER_OPTIONS: User['gender'][] = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say',
];

export const GENDER_EMOJI: Record<User['gender'], string> = {
  Male: '🧔',
  Female: '💁',
  'Non-binary': '🌈',
  'Prefer not to say': '✨',
};

export const INTEREST_EMOJI: Record<Interest, string> = {
  Music: '🎵',
  Travel: '✈️',
  Books: '📚',
  Gaming: '🎮',
  Fitness: '🏋️',
  Art: '🎨',
  Food: '🍜',
  Film: '🎬',
  Photo: '📸',
  Outdoors: '🌿',
  Tech: '💻',
  Sports: '⚽',
  Coffee: '☕',
  Nature: '🌱',
  Pets: '🐾',
  Wellness: '🧘',
  Theatre: '🎭',
};

export const TRAIT_EMOJI: Record<ProfileTrait, string> = {
  Introverted: '🌙',
  Extroverted: '💫',
  Adventurous: '🏔️',
  'Laid-back': '🛋️',
  Intellectual: '📘',
  Funny: '😂',
  Ambitious: '🚀',
  Creative: '💡',
  Loyal: '🤝',
  'Open-minded': '🌍',
  Active: '🏃',
  Artsy: '🖌️',
  'Deep thinker': '🧠',
  Spontaneous: '⚡',
};
