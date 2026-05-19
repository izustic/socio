import {
  EDUCATION_OPTIONS,
  INTEREST_EMOJI,
  JOIN_MEETUP_VIBES,
  JOIN_MEETUP_VIBE_EMOJI,
  JoinMeetupVibe,
  ONBOARDING_INTERESTS,
  ONBOARDING_TRAITS,
  TRAIT_EMOJI,
} from "@/src/constants/onboarding";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { Interest, ProfileTrait } from "@/src/types";
import { router } from "expo-router";
import {
  ChevronDown,
  ChevronLeft,
  Mars,
  Venus,
  VenusAndMars,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useState } from "react";
import {
  GestureResponderEvent,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type GenderMix = "Male" | "Female" | "Both";

const GENDER_OPTIONS: { label: GenderMix; Icon: LucideIcon }[] = [
  { label: "Male", Icon: Mars },
  { label: "Female", Icon: Venus },
  { label: "Both", Icon: VenusAndMars },
];

const MIN_AGE = 18;
const MAX_AGE = 50;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export default function JoinCirclePreferencesScreen() {
  const [distance, setDistance] = useState(12);
  const [distTrackWidth, setDistTrackWidth] = useState(0);

  const [ageRange, setAgeRange] = useState<[number, number]>([23, 30]);
  const [ageTrackWidth, setAgeTrackWidth] = useState(0);

  const [genderMix, setGenderMix] = useState<GenderMix>("Both");
  const [educationLevel, setEducationLevel] = useState<string>("Any");
  const [educationOpen, setEducationOpen] = useState(false);

  const [selectedVibes, setSelectedVibes] = useState<JoinMeetupVibe[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<ProfileTrait[]>([]);

  const distFillWidth = clamp(((distance - 1) / (50 - 1)) * 100, 0, 100);

  const handleDistPress = (event: GestureResponderEvent) => {
    if (!distTrackWidth) return;
    const ratio = clamp(event.nativeEvent.locationX / distTrackWidth, 0, 1);
    const value = Math.round(1 + ratio * (50 - 1));
    setDistance(value);
  };

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

  const toggleVibe = (vibe: JoinMeetupVibe) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe)
        ? prev.filter((item) => item !== vibe)
        : [...prev, vibe],
    );
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

  const handleShowCircles = () => {
    router.replace({
      pathname: "/(tabs)/swipe",
      params: {
        distance,
        ageMin: ageRange[0],
        ageMax: ageRange[1],
        genderMix,
        educationLevel,
        vibes: selectedVibes.join(","),
        interests: selectedInterests.join(","),
        traits: selectedTraits.join(","),
      },
    });
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
        <Text style={styles.headerTitle}>Join a Circle</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.stepLabel}>FIND YOUR FIT</Text>
        <Text style={styles.title}>What kind of Circle?</Text>
        <Text style={styles.subtitle}>
          We&apos;ll only show Circles that match these preferences.
        </Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>DISTANCE</Text>
            <Text style={styles.valueLabel}>
              {distance} {distance >= 50 ? "km+" : "km"}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.ageTrack}
            onLayout={(event) =>
              setDistTrackWidth(event.nativeEvent.layout.width)
            }
            onPress={handleDistPress}
          >
            <View
              style={[
                styles.ageFill,
                { left: "0%", width: `${distFillWidth}%` },
              ]}
            />
            <View style={[styles.ageThumb, { left: `${distFillWidth}%` }]} />
          </TouchableOpacity>
          <View style={styles.ageLabels}>
            <Text style={styles.helperText}>1 km</Text>
            <Text style={styles.helperText}>50+ km</Text>
          </View>
        </View>

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
          <Text style={styles.label}>GENDER MIX</Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((option) => {
              const selected = genderMix === option.label;
              const GenderIcon = option.Icon;
              return (
                <TouchableOpacity
                  key={option.label}
                  activeOpacity={0.82}
                  style={[styles.genderTile, selected && styles.selectedChip]}
                  onPress={() => setGenderMix(option.label)}
                >
                  <GenderIcon size={24} color={Colors.textPrimary} strokeWidth={2.2} />
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
            <ChevronDown
              size={18}
              color={Colors.textPrimary}
              strokeWidth={2.2}
            />
          </TouchableOpacity>
        </View>

        <ChipSection
          title="MEETUP VIBE"
          countLabel={
            selectedVibes.length > 0 ? `${selectedVibes.length} picked` : ""
          }
          items={JOIN_MEETUP_VIBES as unknown as JoinMeetupVibe[]}
          selectedItems={selectedVibes}
          emojiMap={JOIN_MEETUP_VIBE_EMOJI}
          onToggle={toggleVibe}
        />

        <ChipSection
          title="INTERESTS"
          countLabel={
            selectedInterests.length > 0
              ? `${selectedInterests.length} picked`
              : ""
          }
          items={ONBOARDING_INTERESTS}
          selectedItems={selectedInterests}
          emojiMap={INTEREST_EMOJI}
          onToggle={toggleInterest}
        />

        <ChipSection
          title="PERSONALITY"
          countLabel={
            selectedTraits.length > 0 ? `${selectedTraits.length} picked` : ""
          }
          items={ONBOARDING_TRAITS}
          selectedItems={selectedTraits}
          emojiMap={TRAIT_EMOJI}
          onToggle={toggleTrait}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.primaryButton}
          onPress={handleShowCircles}
        >
          <Text style={styles.primaryButtonText}>Show me Circles</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={educationOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEducationOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setEducationOpen(false)}
        >
          <Pressable
            style={styles.menu}
            onPress={(event) => event.stopPropagation()}
          >
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
                  <Text
                    style={[
                      styles.menuItemText,
                      selected && styles.menuItemTextSelected,
                    ]}
                  >
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
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 30,
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
    backgroundColor: "#F6F6F6",
    borderRadius: Radius.full,
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
    paddingTop: 12,
    paddingBottom: 22,
    backgroundColor: Colors.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
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
