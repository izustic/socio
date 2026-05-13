import {
  INTEREST_EMOJI,
  ONBOARDING_INTERESTS,
  ONBOARDING_TRAITS,
  TRAIT_EMOJI,
  EDUCATION_OPTIONS,
} from "@/src/constants/onboarding";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { createCircle } from "@/src/services/circle";
import { Interest, ProfileTrait } from "@/src/types";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronDown } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Alert,
  GestureResponderEvent,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from "react-native";

type GenderMix = "Male" | "Female" | "Both";

const GENDER_OPTIONS: { label: GenderMix; icon: string }[] = [
  { label: "Male", icon: "👨" },
  { label: "Female", icon: "👩" },
  { label: "Both", icon: "🌈" },
];

const MIN_AGE = 18;
const MAX_AGE = 50;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const asString = (value: string | string[] | undefined, fallback = "") =>
  Array.isArray(value) ? (value[0] ?? fallback) : (value ?? fallback);

export default function CreateCirclePreferencesScreen() {
  const params = useLocalSearchParams<{
    name?: string;
    size?: string;
    radius?: string;
    radiusUnit?: string;
    meetupGoal?: string;
  }>();
  const { user, profile } = useAuth();
  const [ageRange, setAgeRange] = useState<[number, number]>([22, 32]);
  const [ageTrackWidth, setAgeTrackWidth] = useState(0);
  const [genderMix, setGenderMix] = useState<GenderMix>("Both");
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>(
    () =>
      (profile?.interests?.slice(0, 3) as Interest[]) || [
        "Music",
        "Books",
        "Film",
      ],
  );
  const [selectedTraits, setSelectedTraits] = useState<ProfileTrait[]>(
    () =>
      (profile?.traits?.slice(0, 2) as ProfileTrait[]) || [
        "Introverted",
        "Extroverted",
      ],
  );
  const [saving, setSaving] = useState(false);
  const [educationLevel, setEducationLevel] = useState<string>("Any");
  const [educationOpen, setEducationOpen] = useState(false);

  const circleBasics = useMemo(
    () => ({
      name: asString(params.name),
      size: Number(asString(params.size, "5")),
      radius: Number(asString(params.radius, "8")),
      radiusUnit: asString(params.radiusUnit, "km"),
      meetupGoal: asString(params.meetupGoal, "Coffee"),
    }),
    [
      params.name,
      params.radius,
      params.radiusUnit,
      params.size,
      params.meetupGoal,
    ],
  );

  const ageFillLeft = ((ageRange[0] - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100;
  const ageFillWidth =
    ((ageRange[1] - ageRange[0]) / (MAX_AGE - MIN_AGE)) * 100;

  const handleAgePress = (event: GestureResponderEvent) => {
    if (!ageTrackWidth) return;
    const ratio = clamp(event.nativeEvent.locationX / ageTrackWidth, 0, 1);
    const value = Math.round(MIN_AGE + ratio * (MAX_AGE - MIN_AGE));
    const distanceToMin = Math.abs(value - ageRange[0]);
    const distanceToMax = Math.abs(value - ageRange[1]);

    if (distanceToMin <= distanceToMax) {
      setAgeRange([clamp(value, MIN_AGE, ageRange[1] - 1), ageRange[1]]);
    } else {
      setAgeRange([ageRange[0], clamp(value, ageRange[0] + 1, MAX_AGE)]);
    }
  };

  const toggleInterest = (interest: Interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest],
    );
  };

  const toggleTrait = (trait: ProfileTrait) => {
    setSelectedTraits((prev) =>
      prev.includes(trait)
        ? prev.filter((item) => item !== trait)
        : [...prev, trait],
    );
  };

  const handleCreateCircle = async () => {
    if (!user) {
      Alert.alert(
        "You are signed out",
        "Please sign in again to create a Circle.",
      );
      return;
    }
    if (!circleBasics.name) {
      Alert.alert(
        "Circle details missing",
        "Please go back and name your Circle.",
      );
      return;
    }
    if (selectedInterests.length < 3) {
      Alert.alert(
        "Pick at least 3 interests",
        "This helps us find people who fit your Circle.",
      );
      return;
    }

    setSaving(true);
    try {
      const circleId = await createCircle({
        name: circleBasics.name,
        creatorId: user.id,
        size: circleBasics.size,
        ageRange,
        educationLevel,
        locationRadius: circleBasics.radius,
        interests: selectedInterests,
        traits: selectedTraits,
        genderMix,
        vibe: circleBasics.meetupGoal,
        meetupGoal: circleBasics.meetupGoal,
        meetupTimeframe: "Within 3 days",
      });

      router.replace({
        pathname: "/circle/swipe-users",
        params: { circleId },
      });
    } catch (error: any) {
      Alert.alert(
        "Unable to create Circle",
        error?.message || "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.82}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Circle</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressActive} />
        <View style={styles.progressActive} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.stepLabel}>
          STEP 2 OF 2 · WHO YOU&apos;RE LOOKING FOR
        </Text>
        <Text style={styles.title}>Match preferences</Text>
        <Text style={styles.subtitle}>
          We&apos;ll only show people who fit your Circle.
        </Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>AGE RANGE</Text>
            <Text style={styles.valueLabel}>
              {ageRange[0]}–{ageRange[1]}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.ageTrack}
            onLayout={(event) =>
              setAgeTrackWidth(event.nativeEvent.layout.width)
            }
            onPress={handleAgePress}
          >
            <View
              style={[
                styles.ageFill,
                { left: `${ageFillLeft}%`, width: `${ageFillWidth}%` },
              ]}
            />
            <View style={[styles.ageThumb, { left: `${ageFillLeft}%` }]} />
            <View
              style={[
                styles.ageThumb,
                { left: `${ageFillLeft + ageFillWidth}%` },
              ]}
            />
          </TouchableOpacity>
          <View style={styles.ageLabels}>
            <Text style={styles.helperText}>18</Text>
            <Text style={styles.helperText}>50+</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>GENDER</Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((option) => {
              const selected = genderMix === option.label;
              return (
                <TouchableOpacity
                  key={option.label}
                  activeOpacity={0.82}
                  style={[styles.genderTile, selected && styles.selectedChip]}
                  onPress={() => setGenderMix(option.label)}
                >
                  <Text style={styles.genderIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.genderLabel,
                      selected && styles.selectedText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>EDUCATION</Text>
          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.selectButton}
            onPress={() => setEducationOpen(true)}
          >
            <Text style={styles.selectText}>{educationLevel}</Text>
            <ChevronDown size={18} color={Colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <ChipSection
          title="INTERESTS"
          countLabel={`${selectedInterests.length} picked`}
          items={ONBOARDING_INTERESTS}
          selectedItems={selectedInterests}
          emojiMap={INTEREST_EMOJI}
          onToggle={toggleInterest}
        />

        <ChipSection
          title="PERSONALITY"
          countLabel={`${selectedTraits.length} picked`}
          items={ONBOARDING_TRAITS}
          selectedItems={selectedTraits}
          emojiMap={TRAIT_EMOJI}
          onToggle={toggleTrait}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.88}
          disabled={saving || selectedInterests.length < 3}
          style={[
            styles.primaryButton,
            (saving || selectedInterests.length < 3) && styles.disabledButton,
          ]}
          onPress={handleCreateCircle}
        >
          <Text
            style={[
              styles.primaryButtonText,
              (saving || selectedInterests.length < 3) &&
                styles.disabledButtonText,
            ]}
          >
            {saving ? "Creating..." : "Create Circle"}
          </Text>
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
            <Text style={styles.menuTitle}>Education</Text>
            {["Any", ...EDUCATION_OPTIONS].map((option) => {
              const selected = educationLevel === option;
              return (
                <TouchableOpacity
                  key={option}
                  activeOpacity={0.82}
                  style={[styles.menuItem, selected && styles.menuItemSelected]}
                  onPress={() => {
                    setEducationLevel(option);
                    setEducationOpen(false);
                  }}
                >
                  <Text style={[styles.menuItemText, selected && styles.menuItemTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function ChipSection<T extends string>({
  title,
  countLabel,
  items,
  selectedItems,
  emojiMap,
  onToggle,
}: {
  title: string;
  countLabel: string;
  items: T[];
  selectedItems: T[];
  emojiMap: Record<T, string>;
  onToggle: (item: T) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.label}>{title}</Text>
        <Text style={styles.countLabel}>{countLabel}</Text>
      </View>
      <View style={styles.chipGrid}>
        {items.map((item) => {
          const selected = selectedItems.includes(item);
          return (
            <TouchableOpacity
              key={item}
              activeOpacity={0.82}
              style={[styles.filterChip, selected && styles.selectedChip]}
              onPress={() => onToggle(item)}
            >
              <Text style={[styles.chipText, selected && styles.selectedText]}>
                {emojiMap[item]} {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    minHeight: 62,
    paddingHorizontal: Spacing.screenPadding,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: Spacing.screenPadding,
  },
  progressActive: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 26,
  },
  stepLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  title: {
    ...Typography.h1,
    fontSize: 27,
    lineHeight: 32,
    marginTop: -16,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: -22,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    ...Typography.label,
  },
  valueLabel: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  ageTrack: {
    height: 24,
    justifyContent: "center",
  },
  ageFill: {
    position: "absolute",
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  ageThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  ageLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -8,
  },
  helperText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderTile: {
    flex: 1,
    minHeight: 68,
    borderRadius: 16,
    backgroundColor: "#F6F6F6",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  genderIcon: {
    fontSize: 22,
  },
  genderLabel: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  selectedChip: {
    backgroundColor: Colors.primary,
  },
  selectedText: {
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  countLabel: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
    fontWeight: "800",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: "#F6F6F6",
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    ...Typography.bodySmall,
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 8,
    paddingBottom: 22,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  disabledButton: {
    backgroundColor: "#F0F0F0",
  },
  disabledButtonText: {
    color: Colors.textDisabled,
  },
  selectButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#F6F6F6",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    ...Typography.body,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "flex-end",
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
    justifyContent: "center",
    backgroundColor: "#F6F6F6",
  },
  menuItemSelected: {
    backgroundColor: Colors.primary,
  },
  menuItemText: {
    ...Typography.body,
    fontWeight: "700",
  },
  menuItemTextSelected: {
    color: Colors.textPrimary,
  },
});
