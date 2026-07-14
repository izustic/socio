import { afterEach, describe, expect, it } from "vitest";
import {
  Colors,
  semanticColors,
  setActiveColorScheme,
} from "../src/constants/ThemeColors";

describe("theme colors", () => {
  afterEach(() => setActiveColorScheme("light"));

  it("switches semantic values when dark mode is selected", () => {
    setActiveColorScheme("light");
    expect(Colors.background).toBe(semanticColors.light.background);
    expect(Colors.textPrimary).toBe(semanticColors.light.textPrimary);

    setActiveColorScheme("dark");
    expect(Colors.background).toBe(semanticColors.dark.background);
    expect(Colors.surface).toBe(semanticColors.dark.surface);
    expect(Colors.textPrimary).toBe(semanticColors.dark.textPrimary);
  });

  it("keeps accent colors while changing semantic surfaces", () => {
    setActiveColorScheme("light");
    const primary = Colors.primary;
    const lightSurface = Colors.inputBg;

    setActiveColorScheme("dark");
    expect(Colors.primary).toBe(primary);
    expect(Colors.inputBg).not.toBe(lightSurface);
  });
});
