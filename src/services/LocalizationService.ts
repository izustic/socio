import { I18nManager, NativeModules, Platform } from "react-native";
import en from "@/localization/en.json";
import fr from "@/localization/fr.json";
import es from "@/localization/es.json";
import de from "@/localization/de.json";
import pt from "@/localization/pt.json";
import ar from "@/localization/ar.json";

export const SUPPORTED_LANGUAGES = ["en", "fr", "es", "pt", "de", "ar"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type LanguagePreference = SupportedLanguage | "system";
export type TextDirection = "ltr" | "rtl";
export type TranslationKey = keyof typeof en;
export type TranslationParams = Record<string, string | number | boolean | null | undefined>;

const resources: Record<SupportedLanguage, Record<string, string>> = {
  en,
  fr,
  es,
  pt,
  de,
  ar,
};

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

const interpolate = (template: string, params?: TranslationParams): string => {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = params[key];
    return value === null || value === undefined ? "" : String(value);
  });
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

  applyDirection(language: SupportedLanguage) {
    const isRTL = this.isRTL(language);
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(isRTL);
    }
  },

  translate(language: SupportedLanguage, key: TranslationKey | string, params?: TranslationParams): string {
    const value = resources[language]?.[key] ?? resources.en[key];
    if (!value) {
      if (__DEV__) console.warn(`[i18n] Missing translation key: ${key}`);
      return key;
    }
    if (__DEV__ && language !== "en" && !resources[language]?.[key]) {
      console.warn(`[i18n] Missing ${language} translation for "${key}", falling back to English.`);
    }
    return interpolate(value, params);
  },
};
