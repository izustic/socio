import { supabase } from './supabase';
import type { AuthError, User } from '@supabase/supabase-js';

const getAuthErrorMessage = (error: AuthError): { userMessage: string; suggestion?: string } => {
  const code = error?.code || 'unknown';
  const message = error?.message || 'An unknown error occurred';

  const errorMap: Record<string, { userMessage: string; suggestion?: string }> = {
    // Email/Password Errors
    'already_registered': {
      userMessage: 'This email is already registered',
      suggestion: 'Try signing in instead, or use a different email'
    },
    'invalid_email': {
      userMessage: 'Please enter a valid email address',
      suggestion: 'Check your email for typos'
    },
    'invalid_credentials': {
      userMessage: 'Incorrect password or email',
      suggestion: 'Try again or reset your password'
    },
    'user_not_found': {
      userMessage: 'No account found with this email',
      suggestion: 'Check your email or create an account'
    },
    // OAuth Errors
    'identity_provider': {
      userMessage: 'Email already used with different method',
      suggestion: 'Try the original sign-in method'
    },
    // Network/Validation
    'network_error': {
      userMessage: 'Network connection failed',
      suggestion: 'Check your internet connection'
    },
    'weak_password': {
      userMessage: 'Password is too weak',
      suggestion: 'Use at least 8 characters with numbers and symbols'
    },
    // Custom validation errors
    'password-too-short': {
      userMessage: 'Password is too short',
      suggestion: 'Use at least 6 characters'
    },
    'missing-fields': {
      userMessage: 'Please fill in all fields',
      suggestion: 'Complete the form to continue'
    }
  };

  return errorMap[code] || {
    userMessage: 'Something went wrong',
    suggestion: 'Please try again'
  };
};

export const signUpWithEmail = async (email: string, password: string) => {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    (error as any).code = 'missing-fields';
    throw error;
  }
  if (password.length < 6) {
    const error = new Error('Password must be at least 6 characters');
    (error as any).code = 'password-too-short';
    throw error;
  }
  try {
    console.log('Creating user with email:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: {
          display_name: email.split('@')[0],
        },
      },
    });

    if (error) {
      console.error('Sign up error:', error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw new Error(authError.userMessage);
    }

    console.log('Sign up successful:', data.user?.id);
    return data.user;
  } catch (error: any) {
    if (error.code) throw error;
    console.error('Sign up error:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    (error as any).code = 'missing-fields';
    throw error;
  }
  try {
    console.log('Signing in with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw new Error(authError.userMessage);
    }

    console.log('Sign in successful:', data.user?.id);
    return data.user!;
  } catch (error: any) {
    if (error.code) throw error;
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign in with Google using ID token from expo-auth-session
export const signInWithGoogleIdToken = async (idToken: string, accessToken?: string): Promise<User> => {
  try {
    console.log('Signing in with Google ID token');
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      access_token: accessToken,
    });

    if (error) {
      console.error('Google sign in error:', error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw new Error(authError.userMessage);
    }

    console.log('Google sign in successful:', data.user?.id);
    return data.user!;
  } catch (error: any) {
    if (error.code) throw error;
    console.error('Google sign in error:', error);
    throw error;
  }
};

// Legacy OAuth sign-in - initiates OAuth flow (returns URL for web, but for mobile we use ID token)
export const signInWithGoogle = async () => {
  try {
    console.log('Signing in with Google (OAuth)');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'demoapp://',
        scopes: 'profile email',
      },
    });

    if (error) {
      console.error('Google OAuth error:', error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw new Error(authError.userMessage);
    }

    return data;
  } catch (error: any) {
    if (error.code) throw error;
    console.error('Google OAuth error:', error);
    throw error;
  }
};

export const signUpWithFacebook = async (accessToken: string): Promise<User> => {
  try {
    console.log('Signing in with Facebook access token');
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'facebook',
      token: accessToken,
    });

    if (error) {
      console.error('Facebook sign in error:', error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw new Error(authError.userMessage);
    }

    console.log('Facebook sign in successful:', data.user?.id);
    return data.user!;
  } catch (error: any) {
    if (error.code) throw error;
    console.error('Facebook sign in error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    console.log('Signing out');
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error.code, error.message);
      throw error;
    }

    console.log('Sign out successful');
  } catch (error: any) {
    console.error('Sign out error:', error.code, error.message);
    throw error;
  }
};

export const sendOTP = async (phone: string) => {
  if (!phone) {
    const error = new Error('Phone number is required');
    (error as any).code = 'missing-fields';
    throw error;
  }
  try {
    console.log('Sending OTP to:', phone);
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      console.error('OTP send error:', error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw new Error(authError.userMessage);
    }

    console.log('OTP sent successfully');
    return data;
  } catch (error: any) {
    if (error.code) throw error;
    console.error('OTP send error:', error);
    throw error;
  }
};

export const verifyOTP = async (phone: string, token: string) => {
  if (!phone || !token) {
    const error = new Error('Phone number and token are required');
    (error as any).code = 'missing-fields';
    throw error;
  }
  try {
    console.log('Verifying OTP for:', phone);
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      console.error('OTP verify error:', error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw new Error(authError.userMessage);
    }

    console.log('OTP verified successfully');
    return data.user;
  } catch (error: any) {
    if (error.code) throw error;
    console.error('OTP verify error:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  if (!email) {
    const error = new Error('Email is required');
    (error as any).code = 'missing-fields';
    throw error;
  }
  try {
    console.log('Sending password reset to:', email);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined,
    });

    if (error) {
      console.error('Password reset error:', error.code, error.message);
      const authError = getAuthErrorMessage(error);
      throw new Error(authError.userMessage);
    }

    console.log('Password reset email sent');
    return data;
  } catch (error: any) {
    if (error.code) throw error;
    console.error('Password reset error:', error);
    throw error;
  }
};