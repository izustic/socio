import { translateActiveResource as tx } from "./TranslationService";

export interface AuthErrorInfo {
  userMessage: string;
  suggestion?: string;
}

export type AuthErrorLike = {
  code?: string | null;
  message?: string | null;
};

type AuthErrorTranslation = {
  userMessageKey: string;
  suggestionKey?: string;
};

const AUTH_ERROR_MAP: Record<string, AuthErrorTranslation> = {
  already_registered: {
    userMessageKey: "authErrors.alreadyRegistered",
    suggestionKey: "authErrors.alreadyRegisteredHint",
  },
  invalid_email: {
    userMessageKey: "authErrors.invalidEmail",
    suggestionKey: "authErrors.invalidEmailHint",
  },
  invalid_credentials: {
    userMessageKey: "authErrors.invalidCredentials",
    suggestionKey: "authErrors.invalidCredentialsHint",
  },
  user_not_found: {
    userMessageKey: "authErrors.userNotFound",
    suggestionKey: "authErrors.userNotFoundHint",
  },
  identity_provider: {
    userMessageKey: "authErrors.identityProvider",
    suggestionKey: "authErrors.identityProviderHint",
  },
  network_error: {
    userMessageKey: "authErrors.network",
    suggestionKey: "authErrors.networkHint",
  },
  email_not_confirmed: {
    userMessageKey: "authErrors.emailNotConfirmed",
    suggestionKey: "authErrors.emailNotConfirmedHint",
  },
  otp_expired: {
    userMessageKey: "authErrors.codeExpired",
    suggestionKey: "authErrors.codeExpiredHint",
  },
  token_expired: {
    userMessageKey: "authErrors.codeExpired",
    suggestionKey: "authErrors.codeExpiredHint",
  },
  invalid_otp: {
    userMessageKey: "authErrors.invalidCode",
    suggestionKey: "authErrors.invalidCodeHint",
  },
  otp_disabled: {
    userMessageKey: "authErrors.otpDisabled",
    suggestionKey: "authErrors.otpDisabledHint",
  },
  over_request_rate_limit: {
    userMessageKey: "authErrors.tooManyAttempts",
    suggestionKey: "authErrors.tooManyAttemptsHint",
  },
  over_email_send_rate_limit: {
    userMessageKey: "authErrors.tooManyEmails",
    suggestionKey: "authErrors.tooManyEmailsHint",
  },
  user_banned: {
    userMessageKey: "authErrors.userBanned",
    suggestionKey: "authErrors.userBannedHint",
  },
  signup_disabled: {
    userMessageKey: "authErrors.signupDisabled",
    suggestionKey: "authErrors.signupDisabledHint",
  },
  bad_json: {
    userMessageKey: "authErrors.serverUnavailable",
    suggestionKey: "authErrors.serverUnavailableHint",
  },
  weak_password: {
    userMessageKey: "authErrors.weakPassword",
    suggestionKey: "authErrors.weakPasswordHint",
  },
  "password-too-short": {
    userMessageKey: "authErrors.shortPassword",
    suggestionKey: "authErrors.shortPasswordHint",
  },
  "missing-fields": {
    userMessageKey: "authErrors.missingFields",
    suggestionKey: "authErrors.missingFieldsHint",
  },
};

export const getAuthErrorMessage = (
  error: AuthErrorLike | string | null | undefined,
): AuthErrorInfo => {
  const code = typeof error === "string" ? error : error?.code || "unknown";

  const mapped = AUTH_ERROR_MAP[code];
  return mapped
    ? {
        userMessage: tx(mapped.userMessageKey),
        suggestion: mapped.suggestionKey ? tx(mapped.suggestionKey) : undefined,
      }
    : {
        userMessage: tx("errors.somethingWentWrong"),
        suggestion: tx("authErrors.genericHint"),
      };
};

export const createAuthInputError = (code: string, message: string) => {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
};
