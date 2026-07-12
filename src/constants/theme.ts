import { StyleSheet } from "react-native";
import {
  Colors,
  getActiveThemeColors,
  type ThemeColors,
} from "./ThemeColors";

export {
  Colors,
  getActiveThemeColors,
  semanticColors,
  setActiveColorScheme,
} from "./ThemeColors";
export type { ThemeColorScheme, ThemeColors } from "./ThemeColors";

export const createThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ThemeColors) => T,
): T => {
  let cachedColors: ThemeColors | null = null;
  let cachedStyles: T | null = null;

  const resolve = () => {
    const colors = getActiveThemeColors();
    if (cachedColors !== colors || !cachedStyles) {
      cachedColors = colors;
      cachedStyles = StyleSheet.create(factory(colors));
    }
    return cachedStyles;
  };

  return new Proxy({} as T, {
    get: (_target, property) => resolve()[property as keyof T],
    ownKeys: () => Reflect.ownKeys(resolve()),
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  });
};

export const Typography = {
  // Display — for hero moments (Welcome screen, Circle complete)
  get display() { return {
    fontSize: 40,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 46,
  }; },
  // Headings — screen titles
  get h1() { return {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  }; },
  get h2() { return {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  }; },
  get h3() { return {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  }; },
  // Body
  get body() { return {
    fontSize: 15,
    fontWeight: '400' as const,
    color: Colors.textPrimary,
    lineHeight: 22,
  }; },
  get bodySmall() { return {
    fontSize: 13,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    lineHeight: 18,
  }; },
  // Labels
  get label() { return {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    // textTransform: 'uppercase' as const,
  }; },
  // Button text
  get button() { return {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  }; },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenPadding: 24,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 100,
  full: 999,
};

export const Shadow = {
  // NO shadows — flat design only
  none: {},
};
