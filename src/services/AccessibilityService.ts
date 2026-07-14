import { AccessibilityInfo } from "react-native";

export interface AccessibilityPreferences {
  reduceMotionEnabled: boolean;
  screenReaderEnabled: boolean;
}

export const AccessibilityService = {
  async getPreferences(): Promise<AccessibilityPreferences> {
    const [reduceMotionEnabled, screenReaderEnabled] = await Promise.all([
      AccessibilityInfo.isReduceMotionEnabled(),
      AccessibilityInfo.isScreenReaderEnabled(),
    ]);

    return { reduceMotionEnabled, screenReaderEnabled };
  },

  onReduceMotionChanged(callback: (enabled: boolean) => void) {
    return AccessibilityInfo.addEventListener("reduceMotionChanged", callback);
  },

  onScreenReaderChanged(callback: (enabled: boolean) => void) {
    return AccessibilityInfo.addEventListener("screenReaderChanged", callback);
  },
};
