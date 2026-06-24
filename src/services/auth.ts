import type { User } from "@supabase/supabase-js";
import {
  createAuthInputError,
  getAuthErrorMessage,
} from "./auth.helpers";
import { supabase } from "./supabase";

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
      throw new Error(authError.userMessage);
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
      throw new Error(authError.userMessage);
    }

    console.log("Sign in successful:", data.user?.id);
    return data.user!;
  } catch (error: any) {
    if (error.code) throw error;
    console.error("Sign in error:", error);
    throw error;
  }
};

export const signInWithGoogleIdToken = async (
  idToken: string,
  accessToken?: string,
): Promise<User> => {
  try {
    console.log("Signing in with Google ID token");
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
      access_token: accessToken,
    });

    if (error) {
      console.error("Google sign in error:", error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw new Error(authError.userMessage);
    }

    console.log("Google sign in successful:", data.user?.id);
    return data.user!;
  } catch (error: any) {
    if (error.code) throw error;
    console.error("Google sign in error:", error);
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
