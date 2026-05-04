import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../types';
import { db } from './firebase';

export const createUserProfile = async (userId: string, profileData: Omit<User, 'uid' | 'createdAt'>) => {
  try {
    const userDoc = doc(db, 'users', userId);
    await setDoc(userDoc, {
      ...profileData,
      uid: userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = doc(db, 'users', userId);
    const docSnap = await getDoc(userDoc);
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};