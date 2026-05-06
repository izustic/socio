import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import {
    ONBOARDING_TRAITS,
    TRAIT_EMOJI,
} from '@/src/constants/onboarding';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { createUserProfile } from '@/src/services/user';
import { ProfileTrait } from '@/src/types';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
      Alert.alert('You are signed out', 'Please sign in again to continue.');
      return;
    }
    if (!draft.name.trim() || !draft.gender || draft.interests.length < 3) {
      Alert.alert('A few things are missing', 'Please finish the previous steps first.');
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

      await createUserProfile(user.id, profileData);
      setStep('profile-complete');
    } catch (error) {
      console.error('Error creating user profile:', error);
      Alert.alert('Could not save profile', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingLayout
      title="Last one. Promise."
      subtitle="Pick traits that describe you. Totally optional, but it helps a lot."
      stepNumber="09  PROFILE  TRAITS"
      primaryLabel={saving ? 'Saving...' : 'Complete Profile'}
      onPrimaryPress={handleSubmit}
      primaryDisabled={saving}
      secondaryLabel="Skip for now"
      onSecondaryPress={handleSubmit}
      onBackPress={() => setStep('profile-interests')}
    >
      <View style={styles.metaRow}>
        <Text style={styles.optional}>Optional</Text>
        <Text style={styles.count}>{draft.traits.length} picked</Text>
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
                {TRAIT_EMOJI[trait]} {trait}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#F7F4EB',
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
});
