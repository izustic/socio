import { db } from '../../firebase';
import {
  Circle,
  Interest,
  User,
} from '../types';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';

export interface SwipeCandidate extends User {
  uid: string;
}

interface CandidateParams {
  circle: Circle;
  currentUserId: string;
  currentUserProfile: User | null;
}

const toMillis = (value: any): number => {
  if (!value) return 0;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  return 0;
};

const getDistanceKm = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getActiveCircleForUser = async (userId: string): Promise<(Circle & { id: string }) | null> => {
  const circlesQuery = query(
    collection(db, 'circles'),
    where('creatorId', '==', userId),
    where('status', '==', 'forming')
  );
  const snapshot = await getDocs(circlesQuery);
  if (snapshot.empty) return null;

  const circles = snapshot.docs.map((circleDoc) => {
    const data = circleDoc.data() as Omit<Circle, 'id'> & { createdAt?: any };
    return {
      ...data,
      id: circleDoc.id,
      createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(toMillis(data.createdAt)),
    } as Circle & { id: string };
  });

  circles.sort((a, b) => toMillis((b as any).createdAt) - toMillis((a as any).createdAt));
  return circles[0] || null;
};

export const getCircleById = async (circleId: string): Promise<(Circle & { id: string }) | null> => {
  const circleRef = doc(db, 'circles', circleId);
  const snap = await getDoc(circleRef);
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<Circle, 'id'> & { createdAt?: any };
  return {
    ...data,
    id: snap.id,
    createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(toMillis(data.createdAt)),
  } as Circle & { id: string };
};

export const getLatestCircleForUser = async (
  userId: string
): Promise<(Circle & { id: string }) | null> => {
  const circlesQuery = query(collection(db, 'circles'), where('creatorId', '==', userId));
  const snapshot = await getDocs(circlesQuery);
  if (snapshot.empty) return null;

  const circles = snapshot.docs.map((circleDoc) => {
    const data = circleDoc.data() as Omit<Circle, 'id'> & { createdAt?: any };
    return {
      ...data,
      id: circleDoc.id,
      createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(toMillis(data.createdAt)),
    } as Circle & { id: string };
  });

  circles.sort((a, b) => toMillis((b as any).createdAt) - toMillis((a as any).createdAt));
  return circles[0] || null;
};

export const getUsersByIds = async (userIds: string[]): Promise<SwipeCandidate[]> => {
  if (userIds.length === 0) return [];
  const userDocs = await Promise.all(userIds.map((uid) => getDoc(doc(db, 'users', uid))));
  return userDocs
    .filter((snap) => snap.exists())
    .map((snap) => ({ ...(snap.data() as User), uid: snap.id }));
};

export const getSwipeCandidates = async ({
  circle,
  currentUserId,
  currentUserProfile,
}: CandidateParams): Promise<SwipeCandidate[]> => {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const swipedByCurrent = new Set(circle.pendingSwipes?.[currentUserId] || []);
  const skippedByCurrent = new Set((circle as any).skippedSwipes?.[currentUserId] || []);
  const memberSet = new Set(circle.members || []);

  return usersSnapshot.docs
    .map((userDoc) => ({ ...(userDoc.data() as User), uid: userDoc.id }))
    .filter((candidate) => {
      if (candidate.uid === currentUserId) return false;
      if (memberSet.has(candidate.uid)) return false;
      if (swipedByCurrent.has(candidate.uid)) return false;
      if (skippedByCurrent.has(candidate.uid)) return false;

      const [minAge, maxAge] = circle.filters.ageRange;
      if (typeof candidate.age !== 'number' || candidate.age < minAge || candidate.age > maxAge) return false;

      if (circle.filters.educationLevel !== 'Any' && candidate.education !== circle.filters.educationLevel) {
        return false;
      }

      const requiredInterests = new Set<Interest>(circle.filters.interests || []);
      const candidateInterests = candidate.interests || [];
      const hasSharedInterest = candidateInterests.some((i) => requiredInterests.has(i));
      if (!hasSharedInterest) return false;

      if (currentUserProfile?.location && candidate.location) {
        const distance = getDistanceKm(currentUserProfile.location, candidate.location);
        if (distance > (circle.filters.locationRadius || 10)) return false;
      }

      return true;
    });
};

export const submitSwipe = async (
  circleId: string,
  currentUserId: string,
  targetUserId: string,
  liked: boolean
): Promise<{ mutualMatch: boolean; circleComplete: boolean }> => {
  const circleRef = doc(db, 'circles', circleId);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(circleRef);
    if (!snap.exists()) {
      throw new Error('Circle not found.');
    }

    const circle = snap.data() as Circle & {
      pendingSwipes?: Record<string, string[]>;
      skippedSwipes?: Record<string, string[]>;
    };

    const pendingSwipes = { ...(circle.pendingSwipes || {}) };
    const skippedSwipes = { ...(circle.skippedSwipes || {}) };
    const members = [...(circle.members || [])];
    const size = circle.size || 5;

    const upsertUserArray = (obj: Record<string, string[]>, uid: string, value: string) => {
      const current = new Set(obj[uid] || []);
      current.add(value);
      obj[uid] = Array.from(current);
    };

    let mutualMatch = false;
    if (liked) {
      upsertUserArray(pendingSwipes, currentUserId, targetUserId);
      const targetSwipes = new Set(pendingSwipes[targetUserId] || []);
      mutualMatch = targetSwipes.has(currentUserId);

      if (mutualMatch && !members.includes(targetUserId)) {
        members.push(targetUserId);
      }
    } else {
      upsertUserArray(skippedSwipes, currentUserId, targetUserId);
    }

    const circleComplete = members.length >= size;

    tx.update(circleRef, {
      pendingSwipes,
      skippedSwipes,
      members,
      status: circleComplete ? 'complete' : 'forming',
    });

    return { mutualMatch, circleComplete };
  });
};
