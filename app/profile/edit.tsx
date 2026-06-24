import {
  INTEREST_EMOJI,
  ONBOARDING_INTERESTS,
  ONBOARDING_TRAITS,
  TRAIT_EMOJI,
} from "@/src/constants/onboarding";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useLocation } from "@/src/hooks/useLocation";
import {
  pickProfileMedia,
  requestMediaLibraryPermission,
  uploadProfileMedia,
  UploadProgress,
} from "@/src/services/profileMedia";
import { updateUserProfile } from "@/src/services/user";
import { Interest, ProfileMedia, ProfileTrait, User } from "@/src/types";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  Check,
  ChevronLeft,
  Edit3,
  Minus,
  Play,
  Plus,
  Star,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SLOT_COUNT = 5;
const MIN_AGE = 18;
const MAX_AGE = 99;

type SlotState = {
  stage: UploadProgress["stage"];
  progress: number;
};

type EditableGender = User["gender"];

const GENDER_OPTIONS: {
  label: string;
  value: EditableGender;
  icon: string;
}[] = [
  { label: "Male", value: "Male", icon: "👨" },
  { label: "Female", value: "Female", icon: "👩" },
  { label: "Other", value: "Prefer not to say", icon: "🌈" },
];

const getMediaUri = (media?: ProfileMedia | null) =>
  media?.remoteUrl || media?.uri || "";

const compactMedia = (media: (ProfileMedia | null)[]) =>
  media.filter(Boolean) as ProfileMedia[];

export default function EditProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const {
    getCurrentLocation,
    address,
    loading: locationLoading,
  } = useLocation();
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [slotStates, setSlotStates] = useState<Record<number, SlotState>>({});
  const [name, setName] = useState(profile?.name ?? "");
  const [age, setAge] = useState(profile?.age || 26);
  const [gender, setGender] = useState<EditableGender>(
    profile?.gender || "Prefer not to say",
  );
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [interests, setInterests] = useState<Interest[]>(
    profile?.interests ?? [],
  );
  const [traits, setTraits] = useState<ProfileTrait[]>(profile?.traits ?? []);
  const [location, setLocation] = useState(profile?.location);
  const [mediaSlots, setMediaSlots] = useState<(ProfileMedia | null)[]>(
    Array.from({ length: SLOT_COUNT }, (_, index) => profile?.media?.[index] ?? null),
  );

  const isBusy = saving || Object.keys(slotStates).length > 0;
  const canSave = name.trim().length > 0 && !isBusy;
  const cityLabel = location?.city || "Location not set";

  const setSlotProgress = (slot: number, state: SlotState | null) => {
    setSlotStates((prev) => {
      if (!state) {
        const next = { ...prev };
        delete next[slot];
        return next;
      }

      return {
        ...prev,
        [slot]: state,
      };
    });
  };

  const replaceSlot = (slot: number, nextMedia: ProfileMedia | null) => {
    setMediaSlots((current) => {
      const next = [...current];
      next[slot] = nextMedia;
      return next;
    });
  };

  const handlePickMedia = async (slot: number) => {
    if (!user) {
      setErrorText("Please sign in again before uploading media.");
      Alert.alert("Not signed in", "Please sign in again before uploading media.");
      return;
    }

    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      setErrorText("Photo library access is required to add media.");
      Alert.alert("Permission needed", "Please allow photo library access to add media.");
      return;
    }

    const result = await pickProfileMedia();
    if (result.canceled || !result.assets?.length) return;

    try {
      setSlotProgress(slot, { stage: "picking", progress: 0 });
      const nextMedia = await uploadProfileMedia({
        userId: user.id,
        asset: result.assets[0],
        slot,
        onProgress: (progress) => setSlotProgress(slot, progress),
      });
      replaceSlot(slot, nextMedia);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not upload that file. Please try again.";
      setErrorText(message);
      Alert.alert("Upload failed", message);
    } finally {
      setSlotProgress(slot, null);
    }
  };

  const handleRemoveMedia = (slot: number) => {
    replaceSlot(slot, null);
  };

  const handleMakeMain = (slot: number) => {
    if (slot === 0 || !mediaSlots[slot]) return;

    setMediaSlots((current) => {
      const next = [...current];
      const selected = next[slot];
      next[slot] = next[0];
      next[0] = selected;
      return next;
    });
  };

  const toggleInterest = (interest: Interest) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  };

  const toggleTrait = (trait: ProfileTrait) => {
    setTraits((current) =>
      current.includes(trait)
        ? current.filter((item) => item !== trait)
        : [...current, trait],
    );
  };

  const handleChangeLocation = async () => {
    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
      setErrorText("Location access is required to update your location.");
      Alert.alert("Location unavailable", "Please allow location access and try again.");
      return;
    }

    setLocation({
      lat: currentLocation.coords.latitude,
      lng: currentLocation.coords.longitude,
      city: address || location?.city || "Current location",
    });
  };

  const handleSave = async () => {
    if (!user) {
      setErrorText("Please sign in again before saving your profile.");
      return;
    }
    if (!name.trim()) {
      setErrorText("Please add your name before saving.");
      return;
    }
    if (!canSave) return;

    setSaving(true);
    setErrorText(null);
    try {
      const nextMedia = compactMedia(mediaSlots);
      await updateUserProfile(user.id, {
        name: name.trim(),
        age,
        gender,
        bio: bio.trim(),
        interests,
        traits,
        media: nextMedia,
        photoURL: getMediaUri(nextMedia[0]) || profile?.photoURL || "",
        location,
      });
      await refreshProfile();
      router.back();
    } catch (error) {
      console.error("Error updating profile:", error);
      const message =
        error instanceof Error ? error.message : "Please try again.";
      setErrorText(message);
      Alert.alert("Could not save profile", message);
    } finally {
      setSaving(false);
    }
  };

  const renderMediaTile = (slot: number, large = false) => {
    const item = mediaSlots[slot];
    const slotState = slotStates[slot];
    const uri = getMediaUri(item);

    return (
      <TouchableOpacity
        key={slot}
        activeOpacity={0.84}
        style={[
          large ? styles.mainMediaTile : styles.smallMediaTile,
          !item && styles.emptyMediaTile,
        ]}
        onPress={() => handlePickMedia(slot)}
        onLongPress={() => handleMakeMain(slot)}
      >
        {item && uri ? (
          <>
            <Image source={{ uri }} style={styles.mediaImage} contentFit="cover" />
            {item.type === "video" ? (
              <View style={styles.playBadge}>
                <Play size={15} color={Colors.textPrimary} fill={Colors.textPrimary} />
              </View>
            ) : null}
          </>
        ) : (
          <Plus size={large ? 31 : 27} color={Colors.primary} strokeWidth={2.4} />
        )}

        {slot === 0 && item ? (
          <View style={styles.mainBadge}>
            <Star size={11} color={Colors.textPrimary} fill={Colors.textPrimary} />
            <Text style={styles.mainBadgeText}>MAIN</Text>
          </View>
        ) : null}

        {item ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.editMediaButton}
            onPress={() => handlePickMedia(slot)}
            onLongPress={() => handleRemoveMedia(slot)}
          >
            <Edit3 size={13} color={Colors.textPrimary} strokeWidth={2.1} />
          </TouchableOpacity>
        ) : null}

        {slotState ? (
          <View style={styles.progressOverlay}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.progressText}>
              {slotState.stage === "uploading" ? "Uploading" : "Preparing"}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(8, Math.round(slotState.progress * 100))}%` },
                ]}
              />
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.78}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            activeOpacity={0.78}
            disabled={!canSave}
            onPress={handleSave}
            style={styles.saveButton}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.primaryDark} />
            ) : (
              <Text style={[styles.saveText, !canSave && styles.saveDisabled]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {errorText ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errorText}</Text>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.label}>PHOTOS & VIDEOS</Text>
            <Text style={styles.helper}>Up to 5. The first is your main.</Text>
            <View style={styles.mediaLayout}>
              {renderMediaTile(0, true)}
              <View style={styles.sideMediaColumn}>
                {renderMediaTile(1)}
                {renderMediaTile(2)}
              </View>
            </View>
            <View style={styles.bottomMediaRow}>
              {renderMediaTile(3)}
              {renderMediaTile(4)}
            </View>
            <Text style={styles.mediaHint}>Tap to replace · Hold to make main · Hold pencil to remove</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>NAME</Text>
            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (errorText) setErrorText(null);
              }}
              placeholder="Your name"
              placeholderTextColor={Colors.textDisabled}
              style={styles.input}
            />
            {!name.trim() ? (
              <Text style={styles.fieldHint}>Your name is required to save changes.</Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>AGE</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.stepperButton}
                onPress={() => setAge((value) => Math.max(MIN_AGE, value - 1))}
              >
                <Minus size={22} color={Colors.textPrimary} strokeWidth={3} />
              </TouchableOpacity>
              <Text style={styles.ageValue}>{age}</Text>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.stepperButton}
                onPress={() => setAge((value) => Math.min(MAX_AGE, value + 1))}
              >
                <Plus size={22} color={Colors.textPrimary} strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>GENDER</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((option) => {
                const selected = gender === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.82}
                    style={[styles.genderTile, selected && styles.genderTileSelected]}
                    onPress={() => setGender(option.value)}
                  >
                    <Text style={styles.genderIcon}>{option.icon}</Text>
                    <Text style={styles.genderText}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>ABOUT YOU</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Coffee, slow Sundays, and good company."
              placeholderTextColor={Colors.textDisabled}
              multiline
              maxLength={180}
              style={[styles.input, styles.bioInput]}
            />
          </View>

          <PickerSection
            title="INTERESTS"
            count={`${interests.length} picked`}
            options={ONBOARDING_INTERESTS}
            selected={interests}
            emojiMap={INTEREST_EMOJI}
            onToggle={toggleInterest}
          />

          <PickerSection
            title="PERSONALITY"
            count={`${traits.length} picked`}
            options={ONBOARDING_TRAITS}
            selected={traits}
            emojiMap={TRAIT_EMOJI}
            onToggle={toggleTrait}
          />

          <View style={styles.section}>
            <Text style={styles.label}>LOCATION</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationText} numberOfLines={1}>
                {cityLabel}
              </Text>
              <TouchableOpacity
                activeOpacity={0.78}
                onPress={handleChangeLocation}
                disabled={locationLoading}
              >
                <Text style={styles.changeText}>
                  {locationLoading ? "Locating..." : "Change"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.84}
            disabled={!canSave}
            style={[styles.primarySave, !canSave && styles.primarySaveDisabled]}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <>
                <Check size={19} color={Colors.textPrimary} strokeWidth={2.4} />
                <Text style={styles.primarySaveText}>Save changes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PickerSection<T extends string>({
  title,
  count,
  options,
  selected,
  emojiMap,
  onToggle,
}: {
  title: string;
  count: string;
  options: readonly T[];
  selected: T[];
  emojiMap: Record<T, string>;
  onToggle: (value: T) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.label}>{title}</Text>
        <Text style={styles.countText}>{count}</Text>
      </View>
      <View style={styles.chipGrid}>
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.8}
              style={[styles.choiceChip, active && styles.choiceChipSelected]}
              onPress={() => onToggle(option)}
            >
              <Text style={[styles.choiceText, active && styles.choiceTextSelected]}>
                {emojiMap[option]} {option}
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
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
  },
  headerTitle: {
    ...Typography.h3,
    fontSize: 17,
    fontWeight: "800",
  },
  saveButton: {
    width: 54,
    minHeight: 42,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  saveText: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  saveDisabled: {
    color: Colors.textDisabled,
  },
  errorBanner: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FEF3F2",
  },
  errorBannerText: {
    ...Typography.bodySmall,
    color: "#B42318",
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: 42,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  helper: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 14,
  },
  fieldHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  mediaLayout: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  mainMediaTile: {
    flex: 1,
    height: 220,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#F8F2E5",
  },
  sideMediaColumn: {
    width: 106,
    gap: Spacing.sm,
  },
  smallMediaTile: {
    height: 106,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#F8F2E5",
  },
  bottomMediaRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  emptyMediaTile: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    backgroundColor: Colors.white,
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  playBadge: {
    position: "absolute",
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  mainBadge: {
    position: "absolute",
    top: 9,
    left: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  editMediaButton: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.82)",
    paddingHorizontal: 12,
  },
  progressText: {
    ...Typography.bodySmall,
    marginTop: 8,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  progressTrack: {
    width: "86%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: Colors.border,
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  mediaHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 10,
  },
  input: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: Colors.inputBg,
    color: Colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 10,
  },
  bioInput: {
    minHeight: 74,
    textAlignVertical: "top",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 34,
    marginTop: 12,
  },
  stepperButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
  },
  ageValue: {
    fontSize: 48,
    lineHeight: 58,
    fontWeight: "900",
    color: "#111111",
    minWidth: 70,
    textAlign: "center",
  },
  genderRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 10,
  },
  genderTile: {
    flex: 1,
    minHeight: 68,
    borderRadius: 16,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  genderTileSelected: {
    backgroundColor: Colors.primary,
  },
  genderIcon: {
    fontSize: 23,
  },
  genderText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  countText: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    minHeight: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  choiceChipSelected: {
    backgroundColor: Colors.primary,
  },
  choiceText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: "700",
  },
  choiceTextSelected: {
    color: Colors.textPrimary,
  },
  locationRow: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  locationText: {
    ...Typography.body,
    flex: 1,
    color: Colors.textPrimary,
  },
  changeText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: "700",
  },
  primarySave: {
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 34,
  },
  primarySaveDisabled: {
    opacity: 0.55,
  },
  primarySaveText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
});
