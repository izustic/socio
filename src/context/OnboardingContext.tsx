import {
    DEFAULT_ONBOARDING_STEP,
    OnboardingStep,
} from '@/src/constants/onboarding';
import { LocationData } from '@/src/services/location';
import { Interest, ProfileMedia, ProfileTrait, User } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'socio:onboarding';

export interface OnboardingDraft {
  contactHint: string;
  name: string;
  bio: string;
  age: number;
  gender: User['gender'] | null;
  media: ProfileMedia[];
  interests: Interest[];
  traits: ProfileTrait[];
  education: string;
  photoURL: string;
  location: LocationData | null;
  locationEnabled: boolean;
  notificationsEnabled: boolean;
}

interface OnboardingContextType {
  currentStep: OnboardingStep;
  draft: OnboardingDraft;
  loading: boolean;
  setStep: (step: OnboardingStep) => void;
  mergeDraft: (patch: Partial<OnboardingDraft>) => void;
  beginOnboarding: (seed?: Partial<OnboardingDraft>, step?: OnboardingStep) => void;
  resetOnboarding: () => Promise<void>;
}

const defaultDraft: OnboardingDraft = {
  contactHint: '',
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
  notificationsEnabled: false,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(DEFAULT_ONBOARDING_STEP);
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadState = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            currentStep?: OnboardingStep;
            draft?: OnboardingDraft;
          };
          if (parsed.currentStep) setCurrentStep(parsed.currentStep);
          if (parsed.draft) {
            setDraft({
              ...defaultDraft,
              ...parsed.draft,
            });
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

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentStep,
        draft,
      })
    ).catch((error) => {
      console.error('Failed to persist onboarding state:', error);
    });
  }, [currentStep, draft, loading]);

  const setStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
  }, []);

  const mergeDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const beginOnboarding = useCallback((seed: Partial<OnboardingDraft> = {}, step: OnboardingStep = 'otp') => {
    setDraft({
      ...defaultDraft,
      ...seed,
    });
    setCurrentStep(step);
  }, []);

  const resetOnboarding = useCallback(async () => {
    setDraft(defaultDraft);
    setCurrentStep(DEFAULT_ONBOARDING_STEP);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<OnboardingContextType>(() => ({
    currentStep,
    draft,
    loading,
    setStep,
    mergeDraft,
    beginOnboarding,
    resetOnboarding,
  }), [currentStep, draft, loading, setStep, mergeDraft, beginOnboarding, resetOnboarding]);

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
