import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, StatusBar, useColorScheme } from "react-native";
import {
  semanticColors,
  setActiveColorScheme,
} from "@/src/constants/theme";
import { ThemePreference, ThemeService } from "@/src/services/ThemeService";

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
  setActiveColorScheme(colorScheme);

  useEffect(() => {
    ThemeService.getPreference()
      .then(setPreferenceState)
      .catch((error) => {
        if (__DEV__) console.warn("[theme] Could not load theme preference", error);
      });
  }, []);

  useEffect(() => {
    Appearance.setColorScheme(preference === "system" ? null : colorScheme);
  }, [colorScheme, preference]);

  const setThemePreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    await ThemeService.setPreference(next);
  }, []);

  const value = useMemo(
    () => ({ preference, colorScheme, colors, setThemePreference }),
    [colors, colorScheme, preference, setThemePreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
      <React.Fragment key={colorScheme}>{children}</React.Fragment>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within a ThemeProvider");
  return value;
};
