import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import { EDUCATION_OPTIONS, GENDER_OPTIONS } from '@/src/constants/onboarding';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { ChevronDown, Mars, Venus } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { optionLabel, tx } from "@/src/utils/localization";

const GENDER_ICONS: Record<(typeof GENDER_OPTIONS)[number], LucideIcon> = {
  Male: Mars,
  Female: Venus,
};

export default function ProfileAgeGenderScreen() {
  const { draft, mergeDraft, setStep } = useOnboarding();
  const [educationOpen, setEducationOpen] = useState(false);

  return (
    <OnboardingLayout
      title={tx("app.auth.profileAgeGender.aLittleAboutYou")}
      subtitle={tx("app.auth.profileAgeGender.thisHelpsUsFindTheRightPeopleForYour")}
      stepNumber={tx("onboarding.step.profileDetails")}
      primaryLabel={tx("app.auth.profileAgeGender.continue")}
      onPrimaryPress={() => {
        setStep('profile-interests');
      }}
      primaryDisabled={!draft.gender || !draft.education}
      onBackPress={() => setStep('profile-photo-name')}
    >
      <View style={styles.section}>
        <Text style={styles.label}>{tx("app.auth.profileAgeGender.howOldAreYou")}</Text>
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
        <Text style={styles.label}>{tx("app.auth.profileAgeGender.gender")}</Text>
        <View style={styles.genderGrid}>
          {GENDER_OPTIONS.map((option) => {
            const selected = draft.gender === option;
            const GenderIcon = GENDER_ICONS[option];
            return (
              <TouchableOpacity
                key={option}
                activeOpacity={0.8}
                style={[styles.genderTile, selected && styles.genderTileSelected]}
                onPress={() => mergeDraft({ gender: option })}
              >
                <GenderIcon size={28} color={Colors.textPrimary} strokeWidth={2.2} />
                <Text style={[styles.genderText, selected && styles.genderTextSelected]}>
                  {optionLabel(option)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{tx("app.auth.profileAgeGender.education")}</Text>
        <TouchableOpacity
          activeOpacity={0.82}
          style={styles.selectButton}
          onPress={() => setEducationOpen(true)}
        >
          <Text style={[styles.selectText, !draft.education && styles.selectPlaceholder]}>
            {draft.education ? optionLabel(draft.education) : tx("app.auth.profileAgeGender.selectEducation")}
          </Text>
          <ChevronDown size={18} color={Colors.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={educationOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEducationOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setEducationOpen(false)}>
          <Pressable style={styles.menu} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.menuTitle}>{tx("app.auth.profileAgeGender.education2")}</Text>
            {EDUCATION_OPTIONS.map((option) => {
              const selected = draft.education === option;
              return (
                <TouchableOpacity
                  key={option}
                  activeOpacity={0.82}
                  style={[styles.menuItem, selected && styles.menuItemSelected]}
                  onPress={() => {
                    mergeDraft({ education: option });
                    setEducationOpen(false);
                  }}
                >
                  <Text style={[styles.menuItemText, selected && styles.menuItemTextSelected]}>
                    {optionLabel(option)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
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
  genderText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  genderTextSelected: {
    color: Colors.textPrimary,
  },
  selectButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#F7F4EB',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    ...Typography.body,
    fontWeight: '700',
  },
  selectPlaceholder: {
    color: Colors.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end',
    padding: Spacing.screenPadding,
  },
  menu: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.md,
    gap: 8,
  },
  menuTitle: {
    ...Typography.h2,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  menuItem: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: '#F7F4EB',
  },
  menuItemSelected: {
    backgroundColor: Colors.primary,
  },
  menuItemText: {
    ...Typography.body,
    fontWeight: '700',
  },
  menuItemTextSelected: {
    color: Colors.textPrimary,
  },
});
