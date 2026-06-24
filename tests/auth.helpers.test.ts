import { describe, expect, it } from "vitest";
import {
  createAuthInputError,
  getAuthErrorMessage,
} from "../src/services/auth.helpers";

describe("auth.helpers", () => {
  it("maps known auth errors to user-facing copy", () => {
    expect(getAuthErrorMessage("invalid_email")).toEqual({
      userMessage: "Please enter a valid email address",
      suggestion: "Check your email for typos",
    });
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(getAuthErrorMessage({ code: "nope" })).toEqual({
      userMessage: "Something went wrong",
      suggestion: "Please try again",
    });
  });

  it("creates validation errors with a stable code", () => {
    const error = createAuthInputError("missing-fields", "Email is required");
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("missing-fields");
    expect(error.message).toBe("Email is required");
  });
});
