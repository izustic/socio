import { LocalizationService, SupportedLanguage, TranslationKey, TranslationParams } from "@/src/services/LocalizationService";

export const renderLocalizedTemplate = (
  language: SupportedLanguage,
  subjectKey: TranslationKey | string,
  bodyKey: TranslationKey | string,
  params?: TranslationParams,
) => ({
  subject: LocalizationService.translate(language, subjectKey, params),
  body: LocalizationService.translate(language, bodyKey, params),
});
