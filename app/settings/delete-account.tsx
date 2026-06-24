import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { deleteAccount } from "@/src/services/account";
import { updatePrivacySettings } from "@/src/services/settings";
import { router } from "expo-router";
import {
  AlertTriangle,
  ChevronLeft,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Trash2,
  Users,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
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

type DeleteStage = "warning" | "confirm" | "deleting" | "farewell";

const lossRows = [
  {
    Icon: Users,
    text: "Your active Circle and its members",
  },
  {
    Icon: MessageCircle,
    text: "All your chats and shared moments",
  },
  {
    Icon: ImageIcon,
    text: "Profile, photos and verification",
  },
  {
    Icon: Heart,
    text: "Every match and connection",
  },
];

export default function DeleteAccountScreen() {
  const { user, refreshProfile } = useAuth();
  const [stage, setStage] = useState<DeleteStage>("warning");
  const [confirmation, setConfirmation] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [pausing, setPausing] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const canDelete = confirmation === "DELETE";

  const spinStyle = useMemo(
    () => ({
      transform: [
        {
          rotate: spin.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
          }),
        },
      ],
    }),
    [spin],
  );

  useEffect(() => {
    if (stage !== "deleting") return;

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 0.82,
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 950,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinLoop.start();

    return () => {
      spinLoop.stop();
    };
  }, [progress, spin, stage]);

  const handlePauseInstead = async () => {
    if (!user || pausing) return;

    setPausing(true);
    try {
      await updatePrivacySettings(user.id, {
        showInCircleSwipes: false,
        privateProfile: true,
      });
      await refreshProfile();
      Alert.alert(
        "Profile paused",
        "You are hidden from Circle swipes and your profile is private.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      console.error("Error pausing profile:", error);
      Alert.alert("Could not pause profile", "Please try again.");
    } finally {
      setPausing(false);
    }
  };

  const handleDeleteForever = async () => {
    if (!canDelete) {
      setErrorText("Type DELETE exactly to continue.");
      return;
    }

    setErrorText(null);
    setStage("deleting");

    try {
      await deleteAccount(confirmation);
      Animated.timing(progress, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => setStage("farewell"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      setErrorText(message);
      setStage("confirm");
    }
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (stage === "farewell") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.farewellWrap}>
          <View style={styles.farewellCard}>
            <View style={styles.farewellIcon}>
              <Heart size={28} color={Colors.textPrimary} strokeWidth={2.1} />
            </View>
            <Text style={styles.farewellTitle}>Your account is gone</Text>
            <Text style={styles.farewellBody}>
              Thanks for spending time with Socio. The door&apos;s open whenever
              you&apos;d like to come back.
            </Text>
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.blackButton}
              onPress={() => router.replace("/(auth)/welcome")}
            >
              <Text style={styles.blackButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (stage === "deleting") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.farewellWrap}>
          <View style={styles.deletingCard}>
            <Animated.View style={[styles.deletingIcon, spinStyle]}>
              <Trash2 size={26} color={Colors.danger} strokeWidth={2.1} />
            </Animated.View>
            <Text style={styles.deletingTitle}>Closing your account...</Text>
            <Text style={styles.deletingBody}>
              Removing profile, chats and matches.
            </Text>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth }]}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.76}
            style={styles.backButton}
            onPress={() => (stage === "confirm" ? setStage("warning") : router.back())}
          >
            <ChevronLeft
              size={22}
              color={Colors.textPrimary}
              strokeWidth={2.3}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delete account</Text>
        </View>

        {stage === "warning" ? (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroIcon}>
              <Trash2 size={32} color={Colors.danger} strokeWidth={2.1} />
            </View>
            <Text style={styles.title}>We&apos;ll miss you</Text>
            <Text style={styles.subtitle}>
              Deleting your account is permanent. There&apos;s no way to bring it
              back.
            </Text>

            <View style={styles.lossCard}>
              <Text style={styles.lossLabel}>You&apos;ll lose</Text>
              {lossRows.map(({ Icon, text }) => (
                <View key={text} style={styles.lossRow}>
                  <Icon size={18} color={Colors.danger} strokeWidth={2.1} />
                  <Text style={styles.lossText}>{text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.pauseNudge}>
              <AlertTriangle
                size={18}
                color={Colors.warning}
                strokeWidth={2.1}
              />
              <Text style={styles.pauseText}>
                Just need a break? You can{" "}
                <Text style={styles.pauseStrong}>pause your profile instead</Text>{" "}
                and your Circle stays put.
              </Text>
            </View>

            <View style={styles.footerActions}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.secondaryButton}
                onPress={handlePauseInstead}
                disabled={pausing}
              >
                {pausing ? (
                  <ActivityIndicator size="small" color={Colors.textPrimary} />
                ) : (
                  <Text style={styles.secondaryButtonText}>
                    Pause my profile instead
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.dangerButton}
                onPress={() => setStage("confirm")}
              >
                <Text style={styles.dangerButtonText}>Continue to delete</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.confirmWrap}>
            <View style={styles.confirmCard}>
              <View style={styles.confirmHeader}>
                <View style={styles.confirmIcon}>
                  <AlertTriangle
                    size={17}
                    color={Colors.danger}
                    strokeWidth={2.1}
                  />
                </View>
                <Text style={styles.confirmTitle}>Type DELETE to confirm</Text>
              </View>
              <Text style={styles.confirmBody}>
                This action is permanent. Your Circle will be notified.
              </Text>
              <TextInput
                value={confirmation}
                onChangeText={(text) => {
                  setConfirmation(text);
                  setErrorText(null);
                }}
                autoFocus
                autoCapitalize="characters"
                placeholder="DELETE"
                placeholderTextColor="#8C8888"
                style={styles.confirmInput}
              />
              {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  activeOpacity={0.82}
                  style={styles.confirmCancel}
                  onPress={() => setStage("warning")}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.82}
                  style={[
                    styles.confirmDelete,
                    !canDelete && styles.confirmDeleteDisabled,
                  ]}
                  onPress={handleDeleteForever}
                >
                  <Text style={styles.confirmDeleteText}>Delete forever</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboard: {
    flex: 1,
  },
  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenPadding,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.h3,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
  },
  heroIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#FFE8E8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    marginTop: Spacing.lg,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    maxWidth: 300,
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  lossCard: {
    width: "100%",
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  lossLabel: {
    ...Typography.label,
    textTransform: "uppercase",
    color: Colors.textSecondary,
  },
  lossRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  lossText: {
    ...Typography.body,
    flex: 1,
    color: Colors.textPrimary,
  },
  pauseNudge: {
    width: "100%",
    flexDirection: "row",
    gap: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: "#FFF1EA",
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  pauseText: {
    ...Typography.bodySmall,
    flex: 1,
    color: Colors.textPrimary,
  },
  pauseStrong: {
    fontWeight: "800",
  },
  footerActions: {
    width: "100%",
    gap: Spacing.sm,
    marginTop: "auto",
    paddingTop: Spacing.xl,
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  dangerButton: {
    minHeight: 56,
    borderRadius: Radius.pill,
    backgroundColor: "#EF3434",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  confirmWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
  },
  confirmCard: {
    borderRadius: Radius.xl,
    backgroundColor: "#121212",
    padding: Spacing.lg,
  },
  confirmHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  confirmIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: "rgba(239, 52, 52, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTitle: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: "800",
  },
  confirmBody: {
    ...Typography.bodySmall,
    color: "#B8B3B3",
    marginTop: Spacing.md,
  },
  confirmInput: {
    minHeight: 48,
    borderRadius: Radius.md,
    backgroundColor: "#302D2D",
    color: Colors.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 4,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.danger,
    marginTop: Spacing.sm,
  },
  confirmActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  confirmCancel: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.pill,
    backgroundColor: "#302D2D",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmCancelText: {
    ...Typography.button,
    color: Colors.white,
  },
  confirmDelete: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.pill,
    backgroundColor: "#EF3434",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDeleteDisabled: {
    opacity: 0.55,
  },
  confirmDeleteText: {
    ...Typography.button,
    color: Colors.white,
  },
  farewellWrap: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.screenPadding,
  },
  deletingCard: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    padding: Spacing.xl,
  },
  deletingIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  deletingTitle: {
    ...Typography.h3,
    marginTop: Spacing.lg,
    color: Colors.textPrimary,
  },
  deletingBody: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    marginTop: Spacing.lg,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.full,
    backgroundColor: "#EF3434",
  },
  farewellCard: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    padding: Spacing.xl,
  },
  farewellIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  farewellTitle: {
    ...Typography.h3,
    marginTop: Spacing.lg,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  farewellBody: {
    ...Typography.body,
    maxWidth: 320,
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  blackButton: {
    minWidth: 96,
    minHeight: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  blackButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
});
