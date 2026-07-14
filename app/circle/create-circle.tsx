import AlertModal from "@/src/components/ui/AlertModal";
import Button from "@/src/components/ui/Button";
import Chip from "@/src/components/ui/Chip";
import Input from "@/src/components/ui/Input";
import { createThemedStyles, Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useSwipeTabVisibility } from "@/src/context/SwipeTabVisibilityContext";
import { createCircle } from "@/src/services/circle";
import { Interest } from "@/src/types";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { ImagePlus } from "lucide-react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { optionLabel, tx } from "@/src/utils/localization";

const educationOptions = [
  "Any",
  "High School",
  "Bachelor's",
  "Master's",
  "PhD",
];
const interests = [
  "Music",
  "Travel",
  "Books",
  "Gaming",
  "Fitness",
  "Art",
  "Food",
  "Film",
];
const goals = ["Coffee ☕", "Study 📚", "Gym 💪", "Food 🍜", "Walk 🚶"];

type AlertState = {
  visible: boolean;
  title: string;
  message: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

export default function CreateCircleScreen() {
  const { user } = useAuth();
  const { refreshSwipeTabVisibility } = useSwipeTabVisibility();
  const [circleName, setCircleName] = useState("");
  const [vibe, setVibe] = useState("");
  const [size, setSize] = useState(5);
  const [education, setEducation] = useState("Any");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState("Coffee ☕");
  const [meetupDays, setMeetupDays] = useState(3);
  const [dayTrackWidth, setDayTrackWidth] = useState(0);
  const [circleImageUri, setCircleImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  const handleConfirm = () => {
    const callback = alertState.onConfirm;
    closeAlert();
    callback?.();
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const handleMeetupDaysPress = (event: any) => {
    if (!dayTrackWidth) return;
    const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / dayTrackWidth));
    setMeetupDays(Math.round(3 + ratio * 7));
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert(
        tx("app.circle.createCircle.photoAccessNeeded"),
        tx("app.circle.createCircle.pleaseAllowPhotoAccessToAddACircleImage"),
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

  const handleCreateCircle = async () => {
    if (!user) {
      showAlert(tx("app.circle.createCircle.notSignedIn"), tx("app.circle.createCircle.pleaseSignInAgainToCreateACircle"));
      return;
    }
    if (!circleName.trim()) {
      showAlert(tx("app.circle.createCircle.missingCircleName"), tx("app.circle.createCircle.pleaseEnterACircleName"));
      return;
    }
    if (selectedInterests.length === 0) {
      showAlert(tx("app.circle.createCircle.addInterests"), tx("app.circle.createCircle.pleaseChooseAtLeastOneInterest"));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: circleName.trim(),
        creatorId: user.id,
        size,
        ageRange: [18, 28] as [number, number],
        educationLevel: education,
        locationRadius: 10,
        interests: selectedInterests as Interest[],
        vibe: vibe.trim(),
        meetupGoal: selectedGoal,
        meetupDays,
        meetupTimeframe: `Within ${meetupDays} days`,
        circleImageUri: circleImageUri || undefined,
      };
      console.log("create circle payload:", payload);

      await createCircle(payload);

      await refreshSwipeTabVisibility({ silent: true });
      router.replace("/(tabs)/swipe");
    } catch (error: any) {
      showAlert(
        tx("app.circle.createCircle.unableToCreateCircle"),
        error?.message || tx("app.circle.createCircle.pleaseTryAgain"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <View style={styles.header}>
        <Text style={styles.title}>{tx("app.circle.createCircle.createACircle")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>{tx("app.circle.createCircle.photo")}</Text>
          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.imagePicker}
            onPress={handlePickImage}
          >
            {circleImageUri ? (
              <Image
                source={{ uri: circleImageUri }}
                style={styles.circleImage}
              />
            ) : (
              <View style={styles.imageEmpty}>
                <ImagePlus
                  size={28}
                  color={Colors.textPrimary}
                  strokeWidth={2.1}
                />
                <Text style={styles.imageTitle}>{tx("app.circle.createCircle.addACirclePhoto")}</Text>
                <Text style={styles.imageHint}>{tx("app.circle.createCircle.thisAppearsOnSwipeCards")}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{tx("app.circle.createCircle.circleName")}</Text>
          <Input
            placeholder={tx("app.circle.createCircle.circleName2")}
            value={circleName}
            onChangeText={setCircleName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{tx("app.circle.createCircle.vibeDescription")}</Text>
          <Input
            placeholder={tx("app.circle.createCircle.tellPeopleAboutYourCircleVibe")}
            value={vibe}
            onChangeText={setVibe}
            multiline
            style={styles.multilineInput}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{tx("app.circle.createCircle.circleSize")}</Text>
          <View style={styles.sizeRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.sizeButton}
              onPress={() => setSize((prev) => Math.max(3, prev - 1))}
            >
              <Text style={styles.sizeButtonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.sizeValueWrap}>
              <Text style={styles.sizeValue}>{size}</Text>
              <Text style={styles.sizePeople}>{tx("app.circle.createCircle.people")}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.sizeButton}
              onPress={() => setSize((prev) => Math.min(8, prev + 1))}
            >
              <Text style={styles.sizeButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{tx("app.circle.createCircle.educationLevel")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalChips}
          >
            {educationOptions.map((option) => (
              <Chip
                key={option}
                label={optionLabel(option)}
                selected={education === option}
                onPress={() => setEducation(option)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{tx("app.circle.createCircle.interests")}</Text>
          <View style={styles.grid}>
            {interests.map((interest) => (
              <Chip
                key={interest}
                label={optionLabel(interest)}
                selected={selectedInterests.includes(interest)}
                onPress={() => toggleInterest(interest)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{tx("app.circle.createCircle.meetupGoal")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalChips}
          >
            {goals.map((goal) => (
              <Chip
                key={goal}
                label={optionLabel(goal)}
                selected={selectedGoal === goal}
                onPress={() => setSelectedGoal(goal)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>{tx("app.circle.createCircle.dayToMeet")}</Text>
            <Text style={styles.valueLabel}>{tx("circleCreate.withinDays", { count: meetupDays })}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.dayTrack}
            onLayout={(event) => setDayTrackWidth(event.nativeEvent.layout.width)}
            onPress={handleMeetupDaysPress}
          >
            <View style={[styles.dayFill, { width: `${((meetupDays - 3) / 7) * 100}%` }]} />
            <View style={[styles.dayThumb, { left: `${((meetupDays - 3) / 7) * 100}%` }]} />
          </TouchableOpacity>
          <View style={styles.dayMeta}>
            <Text style={styles.helperText}>{tx("app.circle.createCircle.3Days")}</Text>
            <Text style={styles.helperText}>{tx("app.circle.createCircle.10Days")}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? tx("app.circle.createCircle.creating") : tx("app.circle.createCircle.createCircle")}
          onPress={handleCreateCircle}
          disabled={loading}
        />
      </View>

      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        primaryLabel={alertState.primaryLabel}
        secondaryLabel={alertState.secondaryLabel}
        onConfirm={handleConfirm}
        onCancel={alertState.onCancel ?? closeAlert}
      />
    </SafeAreaView>
  );
}

const styles = createThemedStyles((Colors) => ({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    ...Typography.h1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
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
    fontWeight: "700",
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sizeButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeButtonText: {
    ...Typography.h2,
    lineHeight: 28,
  },
  sizeValueWrap: {
    alignItems: "center",
  },
  sizeValue: {
    ...Typography.h2,
    color: Colors.primary,
  },
  sizePeople: {
    ...Typography.bodySmall,
  },
  horizontalChips: {
    gap: Spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  dayTrack: {
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    justifyContent: "center",
  },
  dayFill: {
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  dayThumb: {
    position: "absolute",
    width: 22,
    height: 22,
    marginLeft: -11,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  dayMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  helperText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.background,
  },
}));
