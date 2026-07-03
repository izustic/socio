import { describe, expect, it } from "vitest";
import {
  buildCreateCirclePayload,
  resolveAppTabVisibility,
  rowToCircle,
} from "../src/services/circle.helpers";
import type { Circle } from "../src/types";

const sampleCircle = (overrides: Partial<Circle> = {}): Circle => ({
  id: "circle-1",
  name: "Sunday Crew",
  creatorId: "host-1",
  size: 5,
  members: ["host-1"],
  pendingSwipes: {},
  filters: {
    ageRange: [22, 32],
    educationLevel: "Any",
    locationRadius: 8,
    interests: ["Music"],
  },
  status: "forming",
  createdAt: new Date("2026-06-24T12:00:00.000Z"),
  ...overrides,
});

describe("circle.helpers", () => {
  it("builds a create payload with circle defaults applied", () => {
    const payload = buildCreateCirclePayload("circle-1", {
      name: "Sunday Crew",
      creatorId: "user-1",
      size: 5,
      ageRange: [22, 32],
      educationLevel: "Any",
      locationRadius: 8,
      interests: ["Music", "Books", "Film"],
      vibe: "easygoing",
      meetupGoal: "Coffee",
      meetupDays: 14,
      meetupDeadline: new Date("2026-06-30T12:00:00.000Z"),
      genderMix: "Both",
      traits: ["Introverted"],
    });

    expect(payload).toMatchObject({
      id: "circle-1",
      creator_id: "user-1",
      members: ["user-1"],
      pending_swipes: {},
      skipped_swipes: {},
      meetup_goal: "Coffee",
      meetup_timeframe: "Within 10 days",
      meetup_days: 10,
      status: "forming",
      filters: {
        age_range: [22, 32],
        education_level: "Any",
        location_radius: 8,
        interests: ["Music", "Books", "Film"],
        vibe: "easygoing",
        gender_mix: "Both",
        traits: ["Introverted"],
      },
    });
    expect(payload.meetup_deadline).toBe("2026-06-30T12:00:00.000Z");
  });

  it("maps a circle row into the app shape", () => {
    const circle = rowToCircle({
      id: "circle-2",
      name: "Study Group",
      creator_id: "user-2",
      size: 4,
      members: ["user-2", 3],
      pending_swipes: { userX: ["userY"] },
      filters: {
        ageRange: [20, 30],
        educationLevel: "Any",
        locationRadius: 10,
        interests: ["Books"],
        gender_mix: "Both",
      },
      meetup_goal: "Study",
      meetup_timeframe: "Within 3 days",
      meetup_days: 3,
      meetup_deadline: "2026-06-27T12:00:00.000Z",
      status: "complete",
      created_at: "2026-06-24T12:00:00.000Z",
    });

    expect(circle.creatorId).toBe("user-2");
    expect(circle.members).toEqual(["user-2", "3"]);
    expect(circle.meetupDeadline?.toISOString()).toBe(
      "2026-06-27T12:00:00.000Z",
    );
    expect(circle.createdAt.toISOString()).toBe("2026-06-24T12:00:00.000Z");
  });

  describe("resolveAppTabVisibility", () => {
    it("hides swipe after onboarding when user has no circle", () => {
      expect(resolveAppTabVisibility(null, "user-1")).toEqual({
        circleTabVisible: true,
        swipeTabVisible: false,
      });
    });

    it("shows swipe and hides circle tab while join browsing", () => {
      expect(resolveAppTabVisibility(null, "user-1", true)).toEqual({
        circleTabVisible: false,
        swipeTabVisible: true,
      });
    });

    it("shows both tabs for a host filling a forming circle", () => {
      expect(resolveAppTabVisibility(sampleCircle(), "host-1")).toEqual({
        circleTabVisible: true,
        swipeTabVisible: true,
      });
    });

    it("hides swipe for a matched joiner in a forming circle", () => {
      expect(
        resolveAppTabVisibility(
          sampleCircle({ members: ["host-1", "joiner-1"] }),
          "joiner-1",
        ),
      ).toEqual({
        circleTabVisible: true,
        swipeTabVisible: false,
      });
    });

    it("hides swipe when the host circle is complete", () => {
      expect(
        resolveAppTabVisibility(
          sampleCircle({ status: "complete", members: ["host-1", "user-2"] }),
          "host-1",
        ),
      ).toEqual({
        circleTabVisible: true,
        swipeTabVisible: false,
      });
    });

    it("hides swipe when the host circle is full while forming", () => {
      expect(
        resolveAppTabVisibility(
          sampleCircle({
            size: 2,
            members: ["host-1", "user-2"],
          }),
          "host-1",
        ),
      ).toEqual({
        circleTabVisible: true,
        swipeTabVisible: false,
      });
    });

    it("returns onboarding tabs after leaving or closing a circle", () => {
      expect(resolveAppTabVisibility(null, "user-1", false)).toEqual({
        circleTabVisible: true,
        swipeTabVisible: false,
      });
    });
  });
});
