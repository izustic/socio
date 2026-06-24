import { describe, expect, it } from "vitest";
import {
  buildCreateCirclePayload,
  rowToCircle,
} from "../src/services/circle.helpers";

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
});
