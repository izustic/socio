import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { getAuthErrorMessage } from '../utils/errorHandling';
import { auth } from './firebase';

export const signUpWithEmail = async (email: string, password: string) => {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    (error as any).code = 'auth/missing-fields';
    throw error;
  }
  if (password.length < 6) {
    const error = new Error('Password must be at least 6 characters');
    (error as any).code = 'auth/password-too-short';
    throw error;
  }
  try {
    console.log('Creating user with email:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Sign up successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign up error:', error.code, error.message);
    // Re-throw with enhanced error info
    const authError = getAuthErrorMessage(error);
    throw new Error(authError.userMessage);
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!email || !password) {
    const error = new Error('Email and password are required');
    (error as any).code = 'auth/missing-fields';
    throw error;
  }
  try {
    console.log('Signing in with email:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Sign in successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign in error:', error.code, error.message);
    const authError = getAuthErrorMessage(error);
    throw new Error(authError.userMessage);
  }
};

export const signUpWithGoogle = async (
  googleIdToken?: string | null,
  googleAccessToken?: string | null
) => {
  if (!googleIdToken && !googleAccessToken) {
    throw new Error('Google token is required for sign in');
  }

  try {
    console.log('Signing in with Google');
    const credential = GoogleAuthProvider.credential(
      googleIdToken || undefined,
      googleAccessToken || undefined
    );
    const userCredential = await signInWithCredential(auth, credential);
    console.log('Google sign in successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('Google sign in error:', error.code, error.message);
    const authError = getAuthErrorMessage(error);
    throw new Error(authError.userMessage);
  }
};

export const signUpWithFacebook = async (facebookToken: string) => {
  try {
    console.log('Signing in with Facebook');
    const credential = FacebookAuthProvider.credential(facebookToken);
    const userCredential = await signInWithCredential(auth, credential);
    console.log('Facebook sign in successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('Facebook sign in error:', error.code, error.message);
    const authError = getAuthErrorMessage(error);
    throw new Error(authError.userMessage);
  }
};

export const signOut = async () => {
  try {
    console.log('Signing out');
    await firebaseSignOut(auth);
    console.log('Sign out successful');
  } catch (error: any) {
    console.error('Sign out error:', error.code, error.message);
    throw error;
  }
};