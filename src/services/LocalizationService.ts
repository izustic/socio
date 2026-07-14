import { I18nManager, NativeModules, Platform } from "react-native";
import en from "@/localization/en.json";
import {
  getActiveTranslationLanguage,
  setActiveTranslationLanguage,
  translateActiveResource,
  translateResource,
} from "./TranslationService";

export const SUPPORTED_LANGUAGES = ["en", "fr", "es", "pt", "de", "ar"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type LanguagePreference = SupportedLanguage | "system";
export type TextDirection = "ltr" | "rtl";
export type TranslationKey = keyof typeof en;
export type TranslationParams = Record<string, string | number | boolean | null | undefined>;

const LANGUAGE_STORAGE_KEY = "socio:languagePreference";
const RTL_LANGUAGES = new Set<SupportedLanguage>(["ar"]);

const normalizeLanguage = (value?: string | null): SupportedLanguage | null => {
  if (!value) return null;
  const normalized = value.toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)
    ? (normalized as SupportedLanguage)
    : null;
};

const getDeviceLocale = (): string => {
  const settings = NativeModules.SettingsManager?.settings;
  const iosLocale = settings?.AppleLocale || settings?.AppleLanguages?.[0];
  const androidLocale = NativeModules.I18nManager?.localeIdentifier;
  return (Platform.OS === "ios" ? iosLocale : androidLocale) || Intl.DateTimeFormat().resolvedOptions().locale || "en";
};

export const LocalizationService = {
  storageKey: LANGUAGE_STORAGE_KEY,

  getDeviceLocale,

  getDeviceLanguage(): SupportedLanguage {
    return normalizeLanguage(getDeviceLocale()) ?? "en";
  },

  resolveLanguage(preference: LanguagePreference | null | undefined): SupportedLanguage {
    if (preference && preference !== "system") return preference;
    return this.getDeviceLanguage();
  },

  getLocale(language: SupportedLanguage): string {
    const deviceLocale = getDeviceLocale();
    return normalizeLanguage(deviceLocale) === language ? deviceLocale.replace("_", "-") : language;
  },

  getDirection(language: SupportedLanguage): TextDirection {
    return RTL_LANGUAGES.has(language) ? "rtl" : "ltr";
  },

  isRTL(language: SupportedLanguage): boolean {
    return this.getDirection(language) === "rtl";
  },

  setActiveLanguage(language: SupportedLanguage) {
    setActiveTranslationLanguage(language);
  },

  getActiveLanguage(): SupportedLanguage {
    return getActiveTranslationLanguage() as SupportedLanguage;
  },

  translateActive(key: TranslationKey | string, params?: TranslationParams): string {
    return translateActiveResource(key, params);
  },

  applyDirection(language: SupportedLanguage) {
    const isRTL = this.isRTL(language);
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(isRTL);
    }
  },

  translate(language: SupportedLanguage, key: TranslationKey | string, params?: TranslationParams): string {
    return translateResource(language, key, params);
  },
};

export const translate = (key: TranslationKey | string, params?: TranslationParams) =>
  LocalizationService.translateActive(key, params);
