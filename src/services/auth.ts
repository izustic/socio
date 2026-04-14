import {
    createUserWithEmailAndPassword,
    FacebookAuthProvider,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithCredential,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../firebase';

export const signUpWithEmail = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  try {
    console.log('Creating user with email:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Sign up successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign up error:', error.code, error.message);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  try {
    console.log('Signing in with email:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Sign in successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign in error:', error.code, error.message);
    throw error;
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
    throw error;
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
    throw error;
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