import { EducationLevel, Interest, ProfileTrait, User } from '@/src/types';
import type { OnboardingDraft } from '@/src/context/OnboardingContext';

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
  otp: '/(auth)/otp',
  'location-permission': '/(auth)/location-permission',
  'notifications-permission': '/(auth)/notifications-permission',
  'onboarding-intro': '/(auth)/onboarding-intro',
  'profile-photo-name': '/(auth)/profile-photo-name',
  'profile-age-gender': '/(auth)/profile-age-gender',
  'profile-interests': '/(auth)/profile-interests',
  'profile-traits': '/(auth)/profile-traits',
  'profile-complete': '/(auth)/profile-complete',
};

export const ONBOARDING_PATHNAME_MAP: Record<OnboardingStep, string> = {
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

export const ONBOARDING_STEP_ORDER: OnboardingStep[] = [
  'otp',
  'location-permission',
  'notifications-permission',
  'onboarding-intro',
  'profile-photo-name',
  'profile-age-gender',
  'profile-interests',
  'profile-traits',
  'profile-complete',
];

export const getOnboardingRoute = (step: OnboardingStep) => ONBOARDING_ROUTE_MAP[step];
export const getOnboardingPathname = (step: OnboardingStep) => ONBOARDING_PATHNAME_MAP[step];

export const getFirstIncompleteOnboardingStep = (draft: OnboardingDraft): OnboardingStep => {
  if (!draft.locationPermissionResolved) return 'location-permission';
  if (!draft.notificationsPermissionResolved) return 'notifications-permission';
  if (!draft.name.trim()) return 'profile-photo-name';
  if (!draft.gender || !draft.education) return 'profile-age-gender';
  if (draft.interests.length < 3) return 'profile-interests';
  return 'profile-traits';
};

export const getSafeOnboardingStep = (
  requestedStep: OnboardingStep,
  draft: OnboardingDraft,
): OnboardingStep => {
  const firstIncompleteStep = getFirstIncompleteOnboardingStep(draft);
  const requestedIndex = ONBOARDING_STEP_ORDER.indexOf(requestedStep);
  const incompleteIndex = ONBOARDING_STEP_ORDER.indexOf(firstIncompleteStep);

  if (requestedStep === 'profile-complete') return requestedStep;
  return requestedIndex <= incompleteIndex ? requestedStep : firstIncompleteStep;
};

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

export const EDUCATION_OPTIONS: EducationLevel[] = [
  'High school',
  'In college',
  'Finished college',
  'Postgraduate',
  'Trade school',
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
