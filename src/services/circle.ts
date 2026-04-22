import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { Interest } from '../types';

interface CreateCircleInput {
  name: string;
  creatorId: string;
  size: number;
  ageRange: [number, number];
  educationLevel: string;
  locationRadius: number;
  interests: Interest[];
  vibe?: string;
  meetupGoal?: string;
}

export const createCircle = async (input: CreateCircleInput): Promise<string> => {
  try {
    const circleRef = await addDoc(collection(db, 'circles'), {
      name: input.name,
      creatorId: input.creatorId,
      size: input.size,
      members: [input.creatorId],
      pendingSwipes: {},
      filters: {
        ageRange: input.ageRange,
        educationLevel: input.educationLevel,
        locationRadius: input.locationRadius,
        interests: input.interests,
        vibe: input.vibe || '',
      },
      meetupGoal: input.meetupGoal || '',
      status: 'forming',
      createdAt: new Date(),
    });

    return circleRef.id;
  } catch (error) {
    console.error('Error creating circle:', error);
    throw error;
  }
};
