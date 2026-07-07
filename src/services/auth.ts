import type { User } from "@supabase/supabase-js";
import {
  createAuthInputError,
  getAuthErrorMessage,
} from "./auth.helpers";
import { supabase } from "./supabase";

export const EMAIL_ONBOARDING_VERIFIED_METADATA_KEY =
  "email_verified_for_onboarding";

export const isEmailPasswordUser = (user: User | null | undefined) => {
  if (!user) return false;
  const provider = user.app_metadata?.provider;
  const providers = user.app_metadata?.providers;

  return (
    provider === "email" ||
    (Array.isArray(providers) && providers.includes("email"))
  );
};

export const hasCompletedEmailOnboardingVerification = (
  user: User | null | undefined,
) =>
  Boolean(
    user?.user_metadata?.[EMAIL_ONBOARDING_VERIFIED_METADATA_KEY],
  );

export const requiresEmailOnboardingVerification = (
  user: User | null | undefined,
) =>
  isEmailPasswordUser(user) &&
  !hasCompletedEmailOnboardingVerification(user);

export const getFreshAuthUser = async (): Promise<User | null> => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.warn("Could not refresh auth user:", error.code, error.message);
    return null;
  }

  return data.user ?? null;
};

export const checkCurrentAuthUserExists = async () => {
  const { data, error } = await supabase.functions.invoke("auth-user-status");

  if (error) {
    console.warn("Could not check auth user status:", error.message);
    return true;
  }

  return Boolean(data?.exists);
};

export const clearLocalAuthSession = async () => {
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    console.warn("Could not clear local auth session:", error.code, error.message);
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  if (!email || !password) {
    throw createAuthInputError(
      "missing-fields",
      "Email and password are required",
    );
  }
  if (password.length < 6) {
    throw createAuthInputError(
      "password-too-short",
      "Password must be at least 6 characters",
    );
  }
  try {
    console.log("Creating user with email:", email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          display_name: email.split("@")[0],
        },
      },
    });

    if (error) {
      console.error("Sign up error:", error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw Object.assign(new Error(authError.userMessage), {
        code: error.code ?? "unknown",
        suggestion: authError.suggestion,
      });
    }

    console.log("Sign up successful:", data.user?.id);
    return data.user;
  } catch (error: any) {
    if (error.code) throw error;
    console.error("Sign up error:", error);
    throw error;
  }
};

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<User> => {
  if (!email || !password) {
    throw createAuthInputError(
      "missing-fields",
      "Email and password are required",
    );
  }
  try {
    console.log("Signing in with email:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw Object.assign(new Error(authError.userMessage), {
        code: error.code ?? "unknown",
        suggestion: authError.suggestion,
      });
    }

    console.log("Sign in successful:", data.user?.id);
    return data.user!;
  } catch (error: any) {
    if (error.code) throw error;
    console.error("Sign in error:", error);
    console.error("Sign in error JSON:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  }
};

export const signInWithGoogleIdToken = async (
  idToken: string,
  accessToken?: string,
  nonce?: string,
): Promise<User> => {
  try {
    console.log("Signing in with Google ID token");
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
      access_token: accessToken,
      nonce,
    });

    if (error) {
      console.error("Google sign in error:", error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw Object.assign(new Error(authError.userMessage), {
        code: error.code ?? "unknown",
        suggestion: authError.suggestion,
      });
    }

    console.log("Google sign in successful:", data.user?.id);
    return data.user!;
  } catch (error: any) {
    if (error.code) throw error;
    console.error("Google sign in error:", error);
    throw error;
  }
};

export const sendEmailVerificationCode = async (email: string) => {
  if (!email) {
    throw createAuthInputError("missing-fields", "Email is required");
  }

  try {
    console.log("Sending email verification code to:", email);
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      console.error("Email verification send error:", error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw Object.assign(new Error(authError.userMessage), {
        code: error.code ?? "unknown",
        suggestion: authError.suggestion,
      });
    }

    console.log("Email verification resend request accepted");
    return data;
  } catch (error: any) {
    if (error.code) throw error;
    console.error("Email verification send error:", error);
    throw error;
  }
};

export const verifyEmailVerificationCode = async (
  email: string,
  token: string,
): Promise<User> => {
  if (!email || !token) {
    throw createAuthInputError(
      "missing-fields",
      "Email and verification code are required",
    );
  }

  try {
    console.log("Verifying email code for:", email);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    if (error) {
      console.error("Email verification error:", error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw Object.assign(new Error(authError.userMessage), {
        code: error.code ?? "unknown",
        suggestion: authError.suggestion,
      });
    }

    if (!data.user) {
      throw new Error("We could not verify that code. Please try again.");
    }

    const { data: updatedData, error: updateError } =
      await supabase.auth.updateUser({
        data: {
          [EMAIL_ONBOARDING_VERIFIED_METADATA_KEY]: true,
          email_verified_for_onboarding_at: new Date().toISOString(),
        },
      });

    if (updateError) {
      console.error(
        "Email verification metadata update error:",
        updateError.code,
        updateError.message,
      );
      const authError = getAuthErrorMessage(updateError);
      throw Object.assign(new Error(authError.userMessage), {
        code: updateError.code ?? "unknown",
        suggestion: authError.suggestion,
      });
    }

    console.log("Email verified successfully");
    return updatedData.user ?? data.user;
  } catch (error: any) {
    if (error.code) throw error;
    console.error("Email verification error:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    console.log("Signing out");
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error.code, error.message);
      throw error;
    }

    console.log("Sign out successful");
  } catch (error: any) {
    console.error("Sign out error:", error.code, error.message);
    throw error;
  }
};

export const sendOTP = async (phone: string) => {
  if (!phone) {
    throw createAuthInputError("missing-fields", "Phone number is required");
  }
  try {
    console.log("Sending OTP to:", phone);
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      console.error("OTP send error:", error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw new Error(authError.userMessage);
    }

    console.log("OTP sent successfully");
    return data;
  } catch (error: any) {
    if (error.code) throw error;
    console.error("OTP send error:", error);
    throw error;
  }
};

export const verifyOTP = async (phone: string, token: string) => {
  if (!phone || !token) {
    throw createAuthInputError(
      "missing-fields",
      "Phone number and token are required",
    );
  }
  try {
    console.log("Verifying OTP for:", phone);
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    if (error) {
      console.error("OTP verify error:", error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw new Error(authError.userMessage);
    }

    console.log("OTP verified successfully");
    return data.user;
  } catch (error: any) {
    if (error.code) throw error;
    console.error("OTP verify error:", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  if (!email) {
    throw createAuthInputError("missing-fields", "Email is required");
  }
  try {
    console.log("Sending password reset to:", email);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined,
    });

    if (error) {
      console.error("Password reset error:", error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw new Error(authError.userMessage);
    }

    console.log("Password reset email sent");
    return data;
  } catch (error: any) {
    if (error.code) throw error;
    console.error("Password reset error:", error);
    throw error;
  }
};
