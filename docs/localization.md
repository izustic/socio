# Localization

Sociol uses a lightweight localization layer in `src/services/LocalizationService.ts`, exposed through `LocaleProvider` and `useLocale()`.

## Add a string

1. Add an English key to `localization/en.json`.
2. Use `const { t } = useLocale()` in locale-aware screens, or `tx("your.key")` from `src/utils/localization.ts` in shared components and callbacks.
3. Add interpolation with `{{name}}` placeholders and pass params: `t("profile.greeting", { name })`.

Run `npm run lint:i18n` before committing. It reports likely hardcoded JSX, accessibility labels, alerts, validation errors, and other display copy.

Persisted enum values must remain stable. Display interests, traits, education, gender, roles, statuses, and other stored options through `optionLabel(value)` rather than translating the stored value itself. Add new option mappings to `OPTION_TRANSLATION_KEYS` and English strings to `en.json`.

English is the fallback language. Missing keys fall back gracefully and log a warning in development.

## Add a language

1. Add a JSON file in `localization/`.
2. Add the language code to `SUPPORTED_LANGUAGES` and `resources` in `LocalizationService`.
3. Add the display label key to `en.json`.
4. If the language is RTL, add it to `RTL_LANGUAGES`.

## Formatting

Use `useLocale()` helpers for user-facing formats:

- `formatDate(date)`
- `formatTime(date)`
- `formatNumber(value)`
- `formatCurrency(value)`
- `formatDistance(value, "km" | "mi")`

Shared components that cannot use hooks can use `formatLocalizedDate`, `formatLocalizedTime`, and `formatLocalizedDateTime` from `src/utils/localization.ts`. Do not combine `dateStyle` or `timeStyle` with explicit date/time fields in the same `Intl.DateTimeFormat` options object.

`RegionService` exposes country, locale, currency, and timezone for future regional pricing, legal notices, holidays, feature flags, onboarding, and localized AI content.

## Theme

Theme preference is managed by `ThemeProvider` and `ThemeService`. Screens should use semantic colors from `useTheme().colors` for new work and avoid hardcoded user-facing color decisions.

## Accessibility

React Native text should keep font scaling enabled unless there is a specific accessibility review exception. Use accessible labels for icon-only controls and `AccessibilityService` for reduced-motion and screen-reader-aware flows. New colors should come from semantic theme tokens and maintain contrast in both light and dark modes.

## Notifications and email

Notification text must be created from localization keys. Server-delivered notification payloads include `titleKey`, `bodyKey`, and interpolation params so clients can render from the same resources. Avoid storing already-localized notification copy as the only source of truth.

Email templates use `renderLocalizedTemplate(language, subjectKey, bodyKey, params)`. Add email subject/body keys to the same resource files; do not embed final copy in the template code.
