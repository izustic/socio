export interface AuthErrorInfo {
  userMessage: string;
  suggestion?: string;
}

export type AuthErrorLike = {
  code?: string | null;
  message?: string | null;
};

const AUTH_ERROR_MAP: Record<string, AuthErrorInfo> = {
  already_registered: {
    userMessage: "This email is already registered",
    suggestion: "Try signing in instead, or use a different email",
  },
  invalid_email: {
    userMessage: "Please enter a valid email address",
    suggestion: "Check your email for typos",
  },
  invalid_credentials: {
    userMessage: "Incorrect password or email",
    suggestion: "Try again or reset your password",
  },
  user_not_found: {
    userMessage: "No account found with this email",
    suggestion: "Check your email or create an account",
  },
  identity_provider: {
    userMessage: "Email already used with different method",
    suggestion: "Try the original sign-in method",
  },
  network_error: {
    userMessage: "Network connection failed",
    suggestion: "Check your internet connection",
  },
  weak_password: {
    userMessage: "Password is too weak",
    suggestion: "Use at least 8 characters with numbers and symbols",
  },
  "password-too-short": {
    userMessage: "Password is too short",
    suggestion: "Use at least 6 characters",
  },
  "missing-fields": {
    userMessage: "Please fill in all fields",
    suggestion: "Complete the form to continue",
  },
};

export const getAuthErrorMessage = (
  error: AuthErrorLike | string | null | undefined,
): AuthErrorInfo => {
  const code = typeof error === "string" ? error : error?.code || "unknown";

  return AUTH_ERROR_MAP[code] || {
    userMessage: "Something went wrong",
    suggestion: "Please try again",
  };
};

export const createAuthInputError = (code: string, message: string) => {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
};
