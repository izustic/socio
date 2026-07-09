import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { ThemePreference, ThemeService } from "@/src/services/ThemeService";

export const semanticColors = {
  light: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceMuted: "#F5F5F5",
    textPrimary: "#1A1A1A",
    textSecondary: "#6B6B6B",
    textDisabled: "#AAAAAA",
    border: "#E5E5E5",
    divider: "#EFEFEF",
    primary: "#FFB60C",
    primaryDark: "#D98F00",
    primaryLight: "#FFF4DD",
    success: "#34C759",
    warning: "#FF9500",
    danger: "#FF3B30",
    inverseText: "#FFFFFF",
  },
  dark: {
    background: "#111111",
    surface: "#1C1C1E",
    surfaceMuted: "#2C2C2E",
    textPrimary: "#F5F5F7",
    textSecondary: "#C7C7CC",
    textDisabled: "#8E8E93",
    border: "#3A3A3C",
    divider: "#2C2C2E",
    primary: "#FFB60C",
    primaryDark: "#FFC94A",
    primaryLight: "#3A2A08",
    success: "#30D158",
    warning: "#FF9F0A",
    danger: "#FF453A",
    inverseText: "#111111",
  },
} as const;

interface ThemeContextValue {
  preference: ThemePreference;
  colorScheme: "light" | "dark";
  colors: (typeof semanticColors)[keyof typeof semanticColors];
  setThemePreference: (preference: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const colorScheme = ThemeService.resolve(preference, systemScheme);
  const colors = semanticColors[colorScheme];

  useEffect(() => {
    ThemeService.getPreference()
      .then(setPreferenceState)
      .catch((error) => {
        if (__DEV__) console.warn("[theme] Could not load theme preference", error);
      });
  }, []);

  const setThemePreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    await ThemeService.setPreference(next);
  }, []);

  const value = useMemo(
    () => ({ preference, colorScheme, colors, setThemePreference }),
    [colors, colorScheme, preference, setThemePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within a ThemeProvider");
  return value;
};
