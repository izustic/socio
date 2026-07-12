import {
  LocalizationService,
  translate,
} from "@/src/services/LocalizationService";
import { RegionService } from "@/src/services/RegionService";

export { useLocale } from "@/src/providers/LocaleProvider";
export { LocalizationService } from "@/src/services/LocalizationService";

export const tx = translate;

const activeFormatContext = () => {
  const locale = LocalizationService.getLocale(LocalizationService.getActiveLanguage());
  return { locale, timeZone: RegionService.getRegionInfo(locale).timezone };
};

export const formatLocalizedDate = (
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) => {
  const { locale, timeZone } = activeFormatContext();
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(new Date(value));
};

export const formatLocalizedTime = (
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { timeStyle: "short" },
) => {
  const { locale, timeZone } = activeFormatContext();
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(new Date(value));
};

export const formatLocalizedDateTime = (value: Date | string | number) => {
  const { locale, timeZone } = activeFormatContext();
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
};

const OPTION_TRANSLATION_KEYS: Record<string, string> = {
  Active: "options.active",
  Adventurous: "options.adventurous",
  Ambitious: "options.ambitious",
  Any: "options.any",
  Art: "options.art",
  Artsy: "options.artsy",
  "Bachelor's": "options.bachelors",
  Books: "options.books",
  Both: "options.both",
  banned: "options.banned",
  Coffee: "options.coffee",
  "Coffee ☕": "options.coffeeEmoji",
  Creative: "options.creative",
  "Deep thinker": "options.deepThinker",
  Dinner: "options.dinner",
  Extroverted: "options.extroverted",
  "Fake profile": "options.fakeProfile",
  Female: "options.female",
  Film: "options.film",
  "Finished college": "options.finishedCollege",
  Fitness: "options.fitness",
  Food: "options.food",
  "Food 🍜": "options.foodEmoji",
  Funny: "options.funny",
  Gaming: "options.gaming",
  Gym: "options.gym",
  "Gym 💪": "options.gymEmoji",
  Harassment: "options.harassment",
  "High School": "options.highSchool",
  "High school": "options.highSchool",
  "In college": "options.inCollege",
  "Inappropriate content": "options.inappropriateContent",
  Intellectual: "options.intellectual",
  Introverted: "options.introverted",
  "Laid-back": "options.laidBack",
  Loyal: "options.loyal",
  Male: "options.male",
  moderator: "options.moderator",
  "Master's": "options.masters",
  Music: "options.music",
  Nature: "options.nature",
  "Open-minded": "options.openMinded",
  Other: "options.other",
  Outdoors: "options.outdoors",
  Pets: "options.pets",
  PhD: "options.phd",
  Photo: "options.photo",
  Postgraduate: "options.postgraduate",
  pending: "options.pending",
  "Prefer not to say": "options.preferNotToSay",
  Spam: "options.spam",
  resolved: "options.resolved",
  Spontaneous: "options.spontaneous",
  Sports: "options.sports",
  Study: "options.study",
  "Study 📚": "options.studyEmoji",
  Tech: "options.tech",
  Theatre: "options.theatre",
  "Trade school": "options.tradeSchool",
  Travel: "options.travel",
  user: "options.user",
  admin: "options.admin",
  suspended: "options.suspended",
  "Unsafe behavior": "options.unsafeBehavior",
  Wellness: "options.wellness",
  Walk: "options.walk",
  "Walk 🚶": "options.walkEmoji",
  Workout: "options.workout",
};

export const optionLabel = (value: string) => {
  const key = OPTION_TRANSLATION_KEYS[value];
  return key ? tx(key) : value;
};

export type {
  LanguagePreference,
  SupportedLanguage,
  TranslationKey,
  TranslationParams,
} from "@/src/services/LocalizationService";
