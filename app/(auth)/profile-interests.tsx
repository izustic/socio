import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import {
  INTEREST_EMOJI,
  ONBOARDING_INTERESTS,
} from '@/src/constants/onboarding';
import { createThemedStyles, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { Interest } from '@/src/types';
import { Text, TouchableOpacity, View } from 'react-native';
import { optionLabel, tx } from "@/src/utils/localization";

export default function ProfileInterestsScreen() {
  const { draft, mergeDraft, setStep } = useOnboarding();

  const toggleInterest = (interest: Interest) => {
    const exists = draft.interests.includes(interest);
    mergeDraft({
      interests: exists
        ? draft.interests.filter((item) => item !== interest)
        : [...draft.interests, interest],
    });
  };

  return (
    <OnboardingLayout
      title={tx("app.auth.profileInterests.whatAreYouInto")}
      subtitle={tx("app.auth.profileInterests.pickThingsYouGenuinelyLoveThisIsHowWe")}
      stepNumber={tx("onboarding.step.interests")}
      primaryLabel={tx("app.auth.profileInterests.continue")}
      onPrimaryPress={() => {
        setStep('profile-traits');
      }}
      primaryDisabled={draft.interests.length < 3}
      onBackPress={() => setStep('profile-age-gender')}
    >
      <View style={styles.metaRow}>
        <Text style={styles.pickHint}>{tx("app.auth.profileInterests.pickAtLeast3")}</Text>
        <Text style={styles.count}>{draft.interests.length} {tx("app.auth.profileInterests.selected")}</Text>
      </View>

      <View style={styles.grid}>
        {ONBOARDING_INTERESTS.map((interest) => {
          const selected = draft.interests.includes(interest);
          return (
            <TouchableOpacity
              key={interest}
              activeOpacity={0.8}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleInterest(interest)}
            >
              <Text style={styles.chipText}>
                {INTEREST_EMOJI[interest]} {optionLabel(interest)}
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
  pickHint: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
    fontWeight: '700',
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
