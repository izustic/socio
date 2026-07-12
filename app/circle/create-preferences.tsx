import { SafeAreaView } from "react-native-safe-area-context";
import AlertModal from "@/src/components/ui/AlertModal";
import RangeSlider from "@/src/components/ui/RangeSlider";
import {
  EDUCATION_OPTIONS,
  INTEREST_EMOJI,
  ONBOARDING_INTERESTS,
  ONBOARDING_TRAITS,
  TRAIT_EMOJI,
  } from "@/src/constants/onboarding";
import { createThemedStyles, Colors,
  Radius,
  Spacing,
  Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useSwipeTabVisibility } from "@/src/context/SwipeTabVisibilityContext";
import { createCircle, getCircle, updateCircle } from "@/src/services/circle";
import { uploadCircleImage } from "@/src/services/supabase";
import { Interest,
  ProfileTrait } from "@/src/types";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router,
  useLocalSearchParams } from "expo-router";
import {
  ChevronDown,
  ChevronLeft,
  ImagePlus,
  Mars,
  Venus,
  VenusAndMars,
  } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useEffect,
  useMemo,
  useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { optionLabel, tx } from "@/src/utils/localization";

type GenderMix = "Male" | "Female" | "Both";

const GENDER_OPTIONS: { label: GenderMix; Icon: LucideIcon }[] = [
  { label: "Male", Icon: Mars },
  { label: "Female", Icon: Venus },
  { label: "Both", Icon: VenusAndMars },
];

const MIN_AGE = 18;
const MAX_AGE = 50;

type AlertState = {
  visible: boolean;
  title: string;
  message: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

const asString = (value: string | string[] | undefined, fallback = "") =>
  Array.isArray(value) ? (value[0] ?? fallback) : (value ?? fallback);

export default function CreateCirclePreferencesScreen() {
  const params = useLocalSearchParams<{
    name?: string;
    vibe?: string;
    size?: string;
    radius?: string;
    radiusUnit?: string;
    meetupGoal?: string;
    meetupDays?: string;
    imageUri?: string;
    circleId?: string;
  }>();
  const { user, profile } = useAuth();
  const { refreshSwipeTabVisibility } = useSwipeTabVisibility();
  const [ageRange, setAgeRange] = useState<[number, number]>([22, 32]);
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
  const [loadingCircle, setLoadingCircle] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [educationLevel, setEducationLevel] = useState<string>("Any");
  const [educationOpen, setEducationOpen] = useState(false);
  const [circleImageUri, setCircleImageUri] = useState<string | null>(
    () => asString(params.imageUri) || null,
  );
  const [editFilterBase, setEditFilterBase] = useState<{
    locationRadius: number;
    vibe?: string;
  } | null>(null);
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
  });

  const showAlert = (
    title: string,
    message: string,
    options: Omit<AlertState, "visible" | "title" | "message"> = {},
  ) => {
    setAlertState({
      visible: true,
      title,
      message,
      ...options,
    });
  };

  const closeAlert = () => {
    setAlertState((prev) => ({
      ...prev,
      visible: false,
      onConfirm: undefined,
      onCancel: undefined,
    }));
  };

  const handleAlertConfirm = () => {
    const callback = alertState.onConfirm;
    closeAlert();
    callback?.();
  };

  const circleBasics = useMemo(
    () => ({
      circleId: asString(params.circleId),
      name: asString(params.name),
      vibe: asString(params.vibe),
      size: Number(asString(params.size, "5")),
      radius: Number(asString(params.radius, "8")),
      radiusUnit: asString(params.radiusUnit, "km"),
      meetupGoal: asString(params.meetupGoal, "Coffee"),
      meetupDays: Number(asString(params.meetupDays, "3")),
      imageUri: asString(params.imageUri),
    }),
    [
      params.circleId,
      params.imageUri,
      params.meetupDays,
      params.name,
      params.vibe,
      params.radius,
      params.radiusUnit,
      params.size,
      params.meetupGoal,
    ],
  );

  const isEditMode = Boolean(circleBasics.circleId);

  useEffect(() => {
    if (!circleBasics.imageUri) return;
    setCircleImageUri(circleBasics.imageUri);
  }, [circleBasics.imageUri]);

  useEffect(() => {
    if (!circleBasics.circleId) return;

    let active = true;
    const loadCircle = async () => {
      setLoadingCircle(true);
      try {
        const circle = await getCircle(circleBasics.circleId);
        if (!active || !circle) return;

        setAgeRange(circle.filters.ageRange);
        setGenderMix(circle.filters.genderMix || "Both");
        setSelectedInterests(circle.filters.interests || []);
        setSelectedTraits(circle.filters.traits || []);
        setEducationLevel(circle.filters.educationLevel || "Any");
        setCircleImageUri(circle.imageUrl || null);
        setEditFilterBase({
          locationRadius: circle.filters.locationRadius,
          vibe: circle.filters.vibe,
        });
      } catch (error: any) {
        if (!active) return;
        setErrorText(error?.message || tx("app.circle.createPreferences.weCouldNotLoadThisCircle"));
      } finally {
        if (active) setLoadingCircle(false);
      }
    };

    loadCircle();
    return () => {
      active = false;
    };
  }, [circleBasics.circleId]);

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

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert(
        tx("app.circle.createPreferences.photoAccessNeeded"),
        tx("app.circle.createPreferences.pleaseAllowPhotoAccessToAddACircleImage"),
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
      presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setCircleImageUri(result.assets[0].uri);
    }
  };

  const handleSaveCircle = async () => {
    if (!user) {
      setErrorText(tx("app.circle.createPreferences.pleaseSignInAgainBeforeCreatingACircle"));
      showAlert(
        tx("app.circle.createPreferences.youAreSignedOut"),
        tx("app.circle.createPreferences.pleaseSignInAgainToCreateACircle"),
      );
      return;
    }
    if (!isEditMode && !circleBasics.name) {
      setErrorText(tx("app.circle.createPreferences.pleaseGoBackAndNameYourCircle"));
      showAlert(
        tx("app.circle.createPreferences.circleDetailsMissing"),
        tx("app.circle.createPreferences.pleaseGoBackAndNameYourCircle"),
      );
      return;
    }
    if (selectedInterests.length < 3) {
      setErrorText(tx("app.circle.createPreferences.pickAtLeast3InterestsToContinue"));
      showAlert(
        tx("app.circle.createPreferences.pickAtLeast3Interests"),
        tx("app.circle.createPreferences.thisHelpsUsFindPeopleWhoFitYourCircle"),
      );
      return;
    }

    setSaving(true);
    setErrorText(null);
    try {
      if (isEditMode) {
        const imageUrl =
          circleImageUri && !circleImageUri.startsWith("http")
            ? await uploadCircleImage(user.id, circleBasics.circleId, circleImageUri)
            : circleImageUri;

        await updateCircle(circleBasics.circleId, {
          filters: {
            ageRange,
            educationLevel,
            locationRadius:
              editFilterBase?.locationRadius ?? circleBasics.radius,
            interests: selectedInterests,
            traits: selectedTraits,
            genderMix,
            vibe: editFilterBase?.vibe ?? circleBasics.vibe,
          },
          imageUrl: imageUrl ?? null,
        });
      } else {
        await createCircle({
          name: circleBasics.name,
          creatorId: user.id,
          size: circleBasics.size,
          ageRange,
          educationLevel,
          locationRadius: circleBasics.radius,
          interests: selectedInterests,
          traits: selectedTraits,
          genderMix,
          vibe: circleBasics.vibe,
          meetupGoal: circleBasics.meetupGoal,
          meetupDays: circleBasics.meetupDays,
          meetupTimeframe: `Within ${circleBasics.meetupDays} days`,
          circleImageUri: circleImageUri || undefined,
        });
      }

      await refreshSwipeTabVisibility({ silent: true });
      router.replace(isEditMode ? "/(tabs)/swipe" : "/(tabs)/swipe");
    } catch (error: any) {
      setErrorText(error?.message || tx("app.circle.createPreferences.weCouldNotSaveYourCircle"));
      showAlert(
        isEditMode ? tx("app.circle.createPreferences.unableToSaveCircle") : tx("app.circle.createPreferences.unableToCreateCircle"),
        error?.message || tx("app.circle.createPreferences.pleaseTryAgain"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.82}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? tx("app.circle.createPreferences.editCircle") : tx("app.circle.createPreferences.newCircle")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {!isEditMode ? (
        <View style={styles.progressRow}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
        </View>
      ) : null}

      {loadingCircle ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
        </View>
      ) : (
      <>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.stepLabel}>
          {isEditMode ? tx("app.circle.createPreferences.editCircle2") : tx("app.circle.createPreferences.step2Of2WhoYouReLookingFor")}
        </Text>
        <Text style={styles.title}>
          {isEditMode ? tx("app.circle.createPreferences.tuneYourCircle") : tx("app.circle.createPreferences.matchPreferences")}
        </Text>
        <Text style={styles.subtitle}>
          {isEditMode
            ? tx("app.circle.createPreferences.updateYourPhotoAndFiltersToFindMorePeople")
            : tx("app.circle.createPreferences.weLlOnlyShowPeopleWhoFitYourCircle")}
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>{tx("app.circle.createPreferences.photo")}</Text>
          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.imagePicker}
            onPress={handlePickImage}
          >
            {circleImageUri ? (
              <Image source={{ uri: circleImageUri }} style={styles.circleImage} />
            ) : (
              <View style={styles.imageEmpty}>
                <ImagePlus size={28} color={Colors.textPrimary} strokeWidth={2.1} />
                <Text style={styles.imageTitle}>{tx("app.circle.createPreferences.addACirclePhoto")}</Text>
                <Text style={styles.imageHint}>{tx("app.circle.createPreferences.thisAppearsOnSwipeCards")}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>{tx("app.circle.createPreferences.ageRange")}</Text>
            <Text style={styles.valueLabel}>
              {ageRange[0]}–{ageRange[1]}
            </Text>
          </View>
          <RangeSlider
            value={ageRange}
            min={MIN_AGE}
            max={MAX_AGE}
            minDistance={1}
            onValueChange={setAgeRange}
            style={styles.ageTrack}
          />
          <View style={styles.ageLabels}>
            <Text style={styles.helperText}>18</Text>
            <Text style={styles.helperText}>50+</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{tx("app.circle.createPreferences.gender")}</Text>
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
                    {optionLabel(option.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{tx("app.circle.createPreferences.education")}</Text>
          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.selectButton}
            onPress={() => setEducationOpen(true)}
          >
            <Text style={styles.selectText}>{optionLabel(educationLevel)}</Text>
            <ChevronDown
              size={18}
              color={Colors.textPrimary}
              strokeWidth={2.2}
            />
          </TouchableOpacity>
        </View>

        <ChipSection
          title={tx("app.circle.createPreferences.interests")}
          countLabel={tx("options.pickedCount", { count: selectedInterests.length })}
          items={ONBOARDING_INTERESTS}
          selectedItems={selectedInterests}
          emojiMap={INTEREST_EMOJI}
          onToggle={toggleInterest}
        />

        <ChipSection
          title={tx("app.circle.createPreferences.personality")}
          countLabel={tx("options.pickedCount", { count: selectedTraits.length })}
          items={ONBOARDING_TRAITS}
          selectedItems={selectedTraits}
          emojiMap={TRAIT_EMOJI}
          onToggle={toggleTrait}
        />

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.88}
          disabled={saving || selectedInterests.length < 3}
          style={[
            styles.primaryButton,
            (saving || selectedInterests.length < 3) && styles.disabledButton,
          ]}
          onPress={handleSaveCircle}
        >
          <Text
            style={[
              styles.primaryButtonText,
              (saving || selectedInterests.length < 3) &&
                styles.disabledButtonText,
            ]}
          >
            {saving
              ? isEditMode
                ? tx("app.circle.createPreferences.saving")
                : tx("app.circle.createPreferences.creating")
              : isEditMode
                ? tx("app.circle.createPreferences.saveChanges")
                : tx("app.circle.createPreferences.createCircle")}
          </Text>
        </TouchableOpacity>
      </View>
      </>
      )}

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
            <Text style={styles.menuTitle}>{tx("app.circle.createPreferences.education2")}</Text>
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
                    {optionLabel(option)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        primaryLabel={alertState.primaryLabel}
        secondaryLabel={alertState.secondaryLabel}
        onConfirm={handleAlertConfirm}
        onCancel={alertState.onCancel ?? closeAlert}
      />
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
                {emojiMap[item]} {optionLabel(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = createThemedStyles((Colors) => ({
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
    backgroundColor: Colors.inputBg,
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
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  imagePicker: {
    height: 176,
    borderRadius: 16,
    backgroundColor: Colors.inputBg,
    overflow: "hidden",
  },
  circleImage: {
    width: "100%",
    height: "100%",
  },
  imageEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  imageTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  imageHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
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
  errorText: {
    ...Typography.bodySmall,
    color: "#B42318",
    marginTop: -10,
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
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
    backgroundColor: Colors.inputBg,
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
    backgroundColor: Colors.inputBg,
  },
  disabledButtonText: {
    color: Colors.textDisabled,
  },
  selectButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: Colors.inputBg,
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
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.inputBg,
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
}));
