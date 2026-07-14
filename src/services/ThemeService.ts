import AsyncStorage from "@react-native-async-storage/async-storage";
import { ColorSchemeName } from "react-native";

export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "socio:themePreference";

export const ThemeService = {
  async getPreference(): Promise<ThemePreference> {
    const value = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" || value === "system" ? value : "system";
  },

  async setPreference(preference: ThemePreference): Promise<void> {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
  },

  resolve(preference: ThemePreference, systemScheme: ColorSchemeName): "light" | "dark" {
    if (preference !== "system") return preference;
    return systemScheme === "dark" ? "dark" : "light";
  },
};
