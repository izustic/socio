import {
    DEFAULT_ONBOARDING_STEP,
    OnboardingStep,
} from '@/src/constants/onboarding';
import { LocationData } from '@/src/services/location';
import { EducationLevel, Interest, ProfileMedia, ProfileTrait, User } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'socio:onboarding';

export interface OnboardingDraft {
  contactHint: string;
  emailVerificationRequired: boolean;
  emailVerified: boolean;
  emailVerificationCodeSentAt: number | null;
  name: string;
  bio: string;
  age: number;
  gender: User['gender'] | null;
  media: ProfileMedia[];
  interests: Interest[];
  traits: ProfileTrait[];
  education: EducationLevel | '';
  photoURL: string;
  location: LocationData | null;
  locationEnabled: boolean;
  locationPermissionResolved: boolean;
  notificationsEnabled: boolean;
  notificationsPermissionResolved: boolean;
}

interface OnboardingContextType {
  currentStep: OnboardingStep;
  draft: OnboardingDraft;
  loading: boolean;
  emailVerificationSessionActive: boolean;
  setStep: (step: OnboardingStep) => void;
  mergeDraft: (patch: Partial<OnboardingDraft>) => void;
  beginOnboarding: (seed?: Partial<OnboardingDraft>, step?: OnboardingStep) => void;
  resetOnboarding: () => Promise<void>;
}

const defaultDraft: OnboardingDraft = {
  contactHint: '',
  emailVerificationRequired: false,
  emailVerified: false,
  emailVerificationCodeSentAt: null,
  name: '',
  bio: '',
  age: 24,
  gender: null,
  media: [],
  interests: [],
  traits: [],
  education: '',
  photoURL: '',
  location: null,
  locationEnabled: false,
  locationPermissionResolved: false,
  notificationsEnabled: false,
  notificationsPermissionResolved: false,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(DEFAULT_ONBOARDING_STEP);
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);
  const [loading, setLoading] = useState(true);
  const [
    emailVerificationSessionActive,
    setEmailVerificationSessionActive,
  ] = useState(false);
  const currentStepRef = useRef(currentStep);
  const draftRef = useRef(draft);

  const persistState = useCallback((nextStep: OnboardingStep, nextDraft: OnboardingDraft) => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentStep: nextStep,
        draft: nextDraft,
      })
    ).catch((error) => {
      console.error('Failed to persist onboarding state:', error);
    });
  }, []);

  useEffect(() => {
    const loadState = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            currentStep?: OnboardingStep;
            draft?: OnboardingDraft;
          };
          if (parsed.currentStep) {
            currentStepRef.current = parsed.currentStep;
            setCurrentStep(parsed.currentStep);
          }
          if (parsed.draft) {
            const nextDraft = {
              ...defaultDraft,
              ...parsed.draft,
            };
            draftRef.current = nextDraft;
            setDraft(nextDraft);
          }
        }
      } catch (error) {
        console.error('Failed to load onboarding state:', error);
      } finally {
        setLoading(false);
      }
    };

    loadState();
  }, []);

  useEffect(() => {
    if (loading) return;

    persistState(currentStep, draft);
  }, [currentStep, draft, loading, persistState]);

  const setStep = useCallback((step: OnboardingStep) => {
    currentStepRef.current = step;
    setCurrentStep(step);
    persistState(step, draftRef.current);
  }, [persistState]);

  const mergeDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    if (patch.emailVerificationRequired === true) {
      setEmailVerificationSessionActive(true);
    }
    setDraft((prev) => {
      const nextDraft = { ...prev, ...patch };
      draftRef.current = nextDraft;
      persistState(currentStepRef.current, nextDraft);
      return nextDraft;
    });
  }, [persistState]);

  const beginOnboarding = useCallback((seed: Partial<OnboardingDraft> = {}, step: OnboardingStep = 'otp') => {
    const nextDraft = {
      ...defaultDraft,
      ...seed,
    };
    setEmailVerificationSessionActive(Boolean(nextDraft.emailVerificationRequired));
    draftRef.current = nextDraft;
    currentStepRef.current = step;
    setDraft(nextDraft);
    setCurrentStep(step);
    persistState(step, nextDraft);
  }, [persistState]);

  const resetOnboarding = useCallback(async () => {
    draftRef.current = defaultDraft;
    currentStepRef.current = DEFAULT_ONBOARDING_STEP;
    setDraft(defaultDraft);
    setCurrentStep(DEFAULT_ONBOARDING_STEP);
    setEmailVerificationSessionActive(false);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<OnboardingContextType>(() => ({
    currentStep,
    draft,
    loading,
    emailVerificationSessionActive,
    setStep,
    mergeDraft,
    beginOnboarding,
    resetOnboarding,
  }), [
    currentStep,
    draft,
    loading,
    emailVerificationSessionActive,
    setStep,
    mergeDraft,
    beginOnboarding,
    resetOnboarding,
  ]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
