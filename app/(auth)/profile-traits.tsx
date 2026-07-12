import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import {
    getFirstIncompleteOnboardingStep,
    ONBOARDING_TRAITS,
    TRAIT_EMOJI,
} from '@/src/constants/onboarding';
import { createThemedStyles, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { createUserProfile } from '@/src/services/user';
import { ProfileTrait } from '@/src/types';
import { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { optionLabel, tx } from "@/src/utils/localization";

export default function ProfileTraitsScreen() {
  const { user } = useAuth();
  const { draft, mergeDraft, setStep } = useOnboarding();
  const [saving, setSaving] = useState(false);

  const toggleTrait = (trait: ProfileTrait) => {
    const exists = draft.traits.includes(trait);
    mergeDraft({
      traits: exists
        ? draft.traits.filter((item) => item !== trait)
        : [...draft.traits, trait],
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert(tx("app.auth.profileTraits.youAreSignedOut"), tx("app.auth.profileTraits.pleaseSignInAgainToContinue"));
      return;
    }
    const nextRequiredStep = getFirstIncompleteOnboardingStep(draft);
    if (nextRequiredStep !== 'profile-traits') {
      Alert.alert(tx("app.auth.profileTraits.aFewThingsAreMissing"), tx("app.auth.profileTraits.pleaseFinishThePreviousStepsFirst"));
      setStep(nextRequiredStep);
      return;
    }

    setSaving(true);
    try {
      const profileData: any = {
        name: draft.name.trim(),
        age: draft.age,
        gender: draft.gender,
        media: draft.media,
        interests: draft.interests,
        traits: draft.traits,
        education: draft.education,
        photoURL: draft.media[0]?.remoteUrl || draft.photoURL,
        bio: draft.bio.trim(),
        notificationsEnabled: draft.notificationsEnabled,
        locationEnabled: draft.locationEnabled,
        profileComplete: true,
      };

      // Only include location if it exists
      if (draft.location) {
        profileData.location = draft.location;
      }

      if (__DEV__) {
        console.log('Creating user profile payload:', {
          userId: user.id,
          profileData,
        });
      }

      await createUserProfile(user.id, profileData, user.email);
      setStep('profile-complete');
    } catch (error) {
      console.error('Error creating user profile:', error);
      Alert.alert(tx("app.auth.profileTraits.couldNotSaveProfile"), tx("app.auth.profileTraits.pleaseTryAgain"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingLayout
      title={tx("app.auth.profileTraits.lastOnePromise")}
      subtitle={tx("app.auth.profileTraits.pickTraitsThatDescribeYouTotallyOptionalButIt")}
      stepNumber={tx("onboarding.step.traits")}
      primaryLabel={saving ? tx("app.auth.profileTraits.saving") : tx("app.auth.profileTraits.completeProfile")}
      onPrimaryPress={handleSubmit}
      primaryDisabled={saving}
      secondaryLabel={tx("app.auth.profileTraits.skipForNow")}
      onSecondaryPress={handleSubmit}
      onBackPress={() => setStep('profile-interests')}
    >
      <View style={styles.metaRow}>
        <Text style={styles.optional}>{tx("app.auth.profileTraits.optional")}</Text>
        <Text style={styles.count}>{draft.traits.length} {tx("app.auth.profileTraits.picked")}</Text>
      </View>

      <View style={styles.grid}>
        {ONBOARDING_TRAITS.map((trait) => {
          const selected = draft.traits.includes(trait);
          return (
            <TouchableOpacity
              key={trait}
              activeOpacity={0.8}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleTrait(trait)}
            >
              <Text style={styles.chipText}>
                {TRAIT_EMOJI[trait]} {optionLabel(trait)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

const styles = createThemedStyles((Colors) => ({
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optional: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  count: {
    ...Typography.bodySmall,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
}));
