import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  LanguagePreference,
  LocalizationService,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  TranslationKey,
  TranslationParams,
} from "@/src/services/LocalizationService";
import { RegionInfo, RegionService } from "@/src/services/RegionService";

interface LocaleContextValue {
  language: SupportedLanguage;
  languagePreference: LanguagePreference;
  locale: string;
  region: RegionInfo;
  isRTL: boolean;
  setLanguagePreference: (preference: LanguagePreference) => Promise<void>;
  t: (key: TranslationKey | string, params?: TranslationParams) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string, options?: Intl.NumberFormatOptions) => string;
  formatDistance: (value: number, unit?: "km" | "mi", compactPlusAt?: number) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [languagePreference, setPreferenceState] = useState<LanguagePreference>("system");
  const language = LocalizationService.resolveLanguage(languagePreference);
  const locale = LocalizationService.getLocale(language);
  const region = RegionService.getRegionInfo(locale);
  const isRTL = LocalizationService.isRTL(language);
  LocalizationService.setActiveLanguage(language);

  useEffect(() => {
    AsyncStorage.getItem(LocalizationService.storageKey)
      .then((value) => {
        if (value === "system" || SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)) {
          setPreferenceState((value as LanguagePreference) || "system");
        }
      })
      .catch((error) => {
        if (__DEV__) console.warn("[i18n] Could not load language preference", error);
      });
  }, []);

  useEffect(() => {
    LocalizationService.applyDirection(language);
  }, [language]);

  const setLanguagePreference = useCallback(async (preference: LanguagePreference) => {
    setPreferenceState(preference);
    await AsyncStorage.setItem(LocalizationService.storageKey, preference);
  }, []);

  const t = useCallback(
    (key: TranslationKey | string, params?: TranslationParams) =>
      LocalizationService.translate(language, key, params),
    [language],
  );

  const value = useMemo<LocaleContextValue>(() => ({
    language,
    languagePreference,
    locale,
    region,
    isRTL,
    setLanguagePreference,
    t,
    formatDate: (input, options) =>
      new Intl.DateTimeFormat(locale, {
        ...(options ? options : { dateStyle: "medium" }),
        timeZone: region.timezone,
      }).format(new Date(input)),
    formatTime: (input, options) =>
      new Intl.DateTimeFormat(locale, {
        ...(options ? options : { timeStyle: "short" }),
        timeZone: region.timezone,
      }).format(new Date(input)),
    formatNumber: (input, options) => new Intl.NumberFormat(locale, options).format(input),
    formatCurrency: (input, currency = region.currency, options) =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        ...options,
      }).format(input),
    formatDistance: (input, unit = "km", compactPlusAt) => {
      const rounded = Math.round(input);
      const key = compactPlusAt && rounded >= compactPlusAt ? `distance.${unit}Plus` : `distance.${unit}`;
      return t(key, { value: compactPlusAt && rounded >= compactPlusAt ? compactPlusAt : rounded });
    },
  }), [isRTL, language, languagePreference, locale, region, setLanguagePreference, t]);

  return (
    <LocaleContext.Provider value={value}>
      <React.Fragment key={language}>{children}</React.Fragment>
    </LocaleContext.Provider>
  );
}

export const useLocale = () => {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used within a LocaleProvider");
  return value;
};
