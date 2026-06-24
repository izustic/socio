import { describe, expect, it } from "vitest";
import {
  getMessageNotificationBody,
  inferMediaType,
  rowToMessage,
} from "../src/services/messages.helpers";

describe("messages.helpers", () => {
  it("infers media type from the url", () => {
    expect(inferMediaType("https://cdn.example.com/images/photo.png")).toBe(
      "image",
    );
    expect(inferMediaType("https://cdn.example.com/videos/clip.mp4")).toBe(
      "video",
    );
    expect(inferMediaType("https://cdn.example.com/audios/voice.m4a")).toBe(
      "audio",
    );
  });

  it("maps message rows into the app shape", () => {
    const message = rowToMessage({
      id: "msg-1",
      circle_id: "circle-1",
      sender_id: "user-1",
      sender_name: "Ari",
      text: "Hello",
      poll_id: null,
      media_url: "https://cdn.example.com/images/photo.png",
      media_urls: null,
      media_type: null,
      reply_to_message_id: "msg-0",
      reply_to_sender_name: "Sam",
      reply_to_text: "Earlier",
      reply_to_media_type: "image",
      created_at: "2026-06-24T12:00:00.000Z",
    });

    expect(message.mediaType).toBe("image");
    expect(message.mediaUrls).toEqual(["https://cdn.example.com/images/photo.png"]);
    expect(message.replyTo).toEqual({
      messageId: "msg-0",
      senderName: "Sam",
      text: "Earlier",
      mediaType: "image",
    });
  });

  it("builds message notification copy from content type", () => {
    expect(getMessageNotificationBody("Ari", "   " , "audio")).toBe(
      "Ari sent a voice message.",
    );
    expect(
      getMessageNotificationBody("Ari", "__poll__:keep-going", undefined, "poll-1"),
    ).toBe("Ari sent a poll.");
    expect(
      getMessageNotificationBody(
        "Ari",
        "This is a longer message that should remain intact when it fits.",
      ),
    ).toBe("This is a longer message that should remain intact when it fits.");
  });
});
