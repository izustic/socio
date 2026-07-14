import { NativeModules, Platform } from "react-native";
import { SupportedLanguage } from "@/src/services/LocalizationService";

export interface RegionInfo {
  country: string;
  locale: string;
  currency: string;
  timezone: string;
}

const DEFAULT_CURRENCY_BY_COUNTRY: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
  FR: "EUR",
  ES: "EUR",
  DE: "EUR",
  PT: "EUR",
  BR: "BRL",
  NG: "NGN",
  AE: "AED",
  SA: "SAR",
  EG: "EGP",
};

const getNativeLocale = (): string => {
  const settings = NativeModules.SettingsManager?.settings;
  const iosLocale = settings?.AppleLocale || settings?.AppleLanguages?.[0];
  const androidLocale = NativeModules.I18nManager?.localeIdentifier;
  return (Platform.OS === "ios" ? iosLocale : androidLocale) || Intl.DateTimeFormat().resolvedOptions().locale || "en-US";
};

const getCountryFromLocale = (locale: string): string => {
  const parts = locale.replace("_", "-").split("-");
  const region = parts.find((part) => part.length === 2 && part.toUpperCase() === part);
  return region || "US";
};

export const RegionService = {
  getRegionInfo(localeOverride?: string): RegionInfo {
    const locale = (localeOverride || getNativeLocale()).replace("_", "-");
    const country = getCountryFromLocale(locale);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const currency = DEFAULT_CURRENCY_BY_COUNTRY[country] || "USD";

    return { country, locale, currency, timezone };
  },

  getLocaleForLanguage(language: SupportedLanguage): string {
    const current = this.getRegionInfo().locale;
    return current.toLowerCase().startsWith(language) ? current : language;
  },
};
