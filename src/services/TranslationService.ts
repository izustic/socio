import en from "../../localization/en.json";
import fr from "../../localization/fr.json";
import es from "../../localization/es.json";
import de from "../../localization/de.json";
import pt from "../../localization/pt.json";
import ar from "../../localization/ar.json";

type Params = Record<string, string | number | boolean | null | undefined>;

const resources: Record<string, Record<string, string>> = { en, fr, es, pt, de, ar };
let activeLanguage = "en";

const interpolate = (template: string, params?: Params) => {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = params[key];
    return value === null || value === undefined ? "" : String(value);
  });
};

const isDevelopment = () =>
  typeof __DEV__ !== "undefined" && __DEV__;

export const setActiveTranslationLanguage = (language: string) => {
  activeLanguage = language;
};

export const getActiveTranslationLanguage = () => activeLanguage;

export const translateResource = (
  language: string,
  key: string,
  params?: Params,
) => {
  const value = resources[language]?.[key] ?? resources.en[key];
  if (!value) {
    if (isDevelopment()) console.warn(`[i18n] Missing translation key: ${key}`);
    return key;
  }
  if (isDevelopment() && language !== "en" && !resources[language]?.[key]) {
    console.warn(`[i18n] Missing ${language} translation for "${key}", falling back to English.`);
  }
  return interpolate(value, params);
};

export const translateActiveResource = (key: string, params?: Params) =>
  translateResource(activeLanguage, key, params);
