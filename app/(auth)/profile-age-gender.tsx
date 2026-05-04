import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import { GENDER_EMOJI, GENDER_OPTIONS } from '@/src/constants/onboarding';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileAgeGenderScreen() {
  const { draft, mergeDraft, setStep } = useOnboarding();

  return (
    <OnboardingLayout
      title="A little about you."
      subtitle="This helps us find the right people for your Circle."
      stepNumber="07  PROFILE  AGE & GENDER"
      primaryLabel="Continue"
      onPrimaryPress={() => {
        setStep('profile-interests');
      }}
      primaryDisabled={!draft.gender}
      onBackPress={() => setStep('profile-photo-name')}
    >
      <View style={styles.section}>
        <Text style={styles.label}>HOW OLD ARE YOU?</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.stepperButton}
            onPress={() => mergeDraft({ age: Math.max(18, draft.age - 1) })}
          >
            <Text style={styles.stepperSymbol}>−</Text>
          </TouchableOpacity>
          <Text style={styles.ageValue}>{draft.age}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.stepperButton}
            onPress={() => mergeDraft({ age: Math.min(99, draft.age + 1) })}
          >
            <Text style={styles.stepperSymbol}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>GENDER</Text>
        <View style={styles.genderGrid}>
          {GENDER_OPTIONS.map((option) => {
            const selected = draft.gender === option;
            return (
              <TouchableOpacity
                key={option}
                activeOpacity={0.8}
                style={[styles.genderTile, selected && styles.genderTileSelected]}
                onPress={() => mergeDraft({ gender: option })}
              >
                <Text style={styles.genderEmoji}>{GENDER_EMOJI[option]}</Text>
                <Text style={[styles.genderText, selected && styles.genderTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  label: {
    ...Typography.label,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: '#F4F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSymbol: {
    fontSize: 24,
    color: Colors.textPrimary,
  },
  ageValue: {
    ...Typography.h1,
    fontSize: 54,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  genderTile: {
    flexBasis: '47%',
    backgroundColor: '#F7F4EB',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 8,
  },
  genderTileSelected: {
    backgroundColor: Colors.primary,
  },
  genderEmoji: {
    fontSize: 28,
  },
  genderText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  genderTextSelected: {
    color: Colors.textPrimary,
  },
});
