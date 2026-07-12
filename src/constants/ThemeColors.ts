export const semanticColors = {
  light: {
    primary: "#FFB60C",
    primaryDark: "#D98F00",
    primaryLight: "#FFF4DD",
    orange: "#FFB60C",
    background: "#FFFFFF",
    surface: "#FFFFFF",
    inputBg: "#F5F5F5",
    textPrimary: "#1A1A1A",
    textSecondary: "#6B6B6B",
    textDisabled: "#AAAAAA",
    divider: "#EFEFEF",
    placeholder: "#D4D4D4",
    border: "#E5E5E5",
    success: "#34C759",
    warning: "#FF9500",
    danger: "#FF3B30",
    successSurface: "#E9F8ED",
    warningSurface: "#FFF4DD",
    dangerSurface: "#FDEBEC",
    infoSurface: "#EEF2FF",
    white: "#FFFFFF",
    inverseText: "#FFFFFF",
  },
  dark: {
    primary: "#FFB60C",
    primaryDark: "#FFC94A",
    primaryLight: "#3A2A08",
    orange: "#FFB60C",
    background: "#111111",
    surface: "#1C1C1E",
    inputBg: "#2C2C2E",
    textPrimary: "#F5F5F7",
    textSecondary: "#C7C7CC",
    textDisabled: "#8E8E93",
    divider: "#2C2C2E",
    placeholder: "#636366",
    border: "#3A3A3C",
    success: "#30D158",
    warning: "#FF9F0A",
    danger: "#FF453A",
    successSurface: "#12351F",
    warningSurface: "#3A2A08",
    dangerSurface: "#3A1719",
    infoSurface: "#1E2440",
    white: "#FFFFFF",
    inverseText: "#111111",
  },
} as const;

export type ThemeColorScheme = keyof typeof semanticColors;
export type ThemeColors = {
  [Key in keyof typeof semanticColors.light]: string;
};

let activeColorScheme: ThemeColorScheme = "light";

export const setActiveColorScheme = (scheme: ThemeColorScheme) => {
  activeColorScheme = scheme;
};

export const getActiveThemeColors = (): ThemeColors =>
  semanticColors[activeColorScheme];

export const Colors = new Proxy({} as ThemeColors, {
  get: (_target, property: keyof ThemeColors) => getActiveThemeColors()[property],
  ownKeys: () => Reflect.ownKeys(getActiveThemeColors()),
  getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
});
