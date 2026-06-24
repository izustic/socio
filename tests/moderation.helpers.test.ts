import { describe, expect, it } from "vitest";
import {
  buildModerationLogMetadata,
  getModerationActionForStatus,
  toModerationReport,
  toModerationUserSummary,
} from "../src/services/moderation.helpers";

describe("moderation.helpers", () => {
  it("maps a user row into a moderation summary", () => {
    expect(
      toModerationUserSummary({
        id: "user-1",
        display_name: "Jordan",
        email: "jordan@example.com",
        photo_url: "",
        role: "moderator",
        status: "active",
        suspended_until: null,
        profile_complete: true,
        created_at: "2026-06-24T12:00:00.000Z",
        age: 28,
        gender: "Female",
        interests: ["Music", 4],
        traits: ["Kind"],
      }),
    ).toMatchObject({
      id: "user-1",
      displayName: "Jordan",
      role: "moderator",
      interests: ["Music", "4"],
      traits: ["Kind"],
      reportCount: 0,
    });
  });

  it("maps a report row into the app shape", () => {
    expect(
      toModerationReport({
        id: "report-1",
        reporter_id: "user-1",
        reported_user_id: "user-2",
        circle_id: null,
        message_id: "msg-1",
        reason: "harassment",
        details: "details",
        status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2026-06-24T12:00:00.000Z",
      }),
    ).toMatchObject({
      id: "report-1",
      messageId: "msg-1",
      status: "pending",
    });
  });

  it("builds moderation log metadata only when there is content", () => {
    expect(buildModerationLogMetadata({})).toBeNull();
    expect(buildModerationLogMetadata({ reason: "spam" })).toEqual({
      reason: "spam",
    });
  });

  it("maps status transitions to moderation actions", () => {
    expect(getModerationActionForStatus("active")).toBe("user_reactivated");
    expect(getModerationActionForStatus("suspended")).toBe("user_suspended");
    expect(getModerationActionForStatus("banned")).toBe("user_banned");
  });
});
