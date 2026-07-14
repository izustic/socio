import {
  getAuthErrorMessage as getSupabaseAuthErrorMessage,
  type AuthErrorInfo,
} from "@/src/services/auth.helpers";
import { translateActiveResource } from "@/src/services/TranslationService";

export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
  suggestion?: string;
}

type ErrorWithCode = {
  code?: string;
  message?: string;
  suggestion?: string;
};

const toAuthError = (
  code: string,
  message: string,
  mapped: AuthErrorInfo,
): AuthError => ({
  code,
  message,
  userMessage: mapped.userMessage,
  suggestion: mapped.suggestion,
});

export const getAuthErrorMessage = (error: unknown): AuthError => {
  const errorLike = error as ErrorWithCode | null | undefined;
  const code = errorLike?.code || "unknown";
  const message =
    (error instanceof Error ? error.message : errorLike?.message) ||
    translateActiveResource("errors.unknown");

  if (errorLike?.code) {
    const mapped = getSupabaseAuthErrorMessage(errorLike);
    if (mapped.userMessage !== translateActiveResource("errors.somethingWentWrong")) {
      return toAuthError(code, message, mapped);
    }
  }

  if (message && message !== translateActiveResource("errors.unknown")) {
    return {
      code,
      message,
      userMessage: message,
      suggestion: errorLike?.suggestion,
    };
  }

  const fallback = getSupabaseAuthErrorMessage(code);
  return toAuthError(code, message, fallback);
};

export const showErrorAlert = (
  error: unknown,
  context: string = translateActiveResource("errors.authentication"),
) => {
  const authError = getAuthErrorMessage(error);

  console.error(`${context} error:`, {
    code: authError.code,
    message: authError.message,
    originalError: error,
  });

  return {
    title: authError.userMessage,
    message: authError.suggestion
      ? translateActiveResource("errors.hint", { suggestion: authError.suggestion })
      : undefined,
    code: authError.code,
  };
};
