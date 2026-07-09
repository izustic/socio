# Localization

Sociol uses a lightweight localization layer in `src/services/LocalizationService.ts`, exposed through `LocaleProvider` and `useLocale()`.

## Add a string

1. Add an English key to `localization/en.json`.
2. Use `const { t } = useLocale()` in UI and render `t("your.key")`.
3. Add interpolation with `{{name}}` placeholders and pass params: `t("profile.greeting", { name })`.

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

`RegionService` exposes country, locale, currency, and timezone for future regional pricing, legal notices, holidays, feature flags, onboarding, and localized AI content.

## Theme

Theme preference is managed by `ThemeProvider` and `ThemeService`. Screens should use semantic colors from `useTheme().colors` for new work and avoid hardcoded user-facing color decisions.

## Accessibility

React Native text should keep font scaling enabled unless there is a specific accessibility review exception. Use accessible labels for icon-only controls and `AccessibilityService` for reduced-motion and screen-reader-aware flows. New colors should come from semantic theme tokens and maintain contrast in both light and dark modes.

## Notifications and email

Notification text should be created from localization keys. Server-delivered notification payloads should include keys and params when possible so clients can render using the same resources. Email templates can use `renderLocalizedTemplate()` as a bridge until a server-side renderer shares the same resource files.
