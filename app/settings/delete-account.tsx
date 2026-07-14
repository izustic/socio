import { SafeAreaView } from "react-native-safe-area-context";
import { createThemedStyles,
  Colors,
  Radius,
  Spacing,
  Typography } from "@/src/constants/theme";
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
import React,
  { useEffect,
  useMemo,
  useRef,
  useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { tx } from "@/src/utils/localization";

type DeleteStage = "warning" | "confirm" | "deleting" | "farewell";

const lossRows = [
  {
    Icon: Users,
    textKey: "accountDeletion.activeCircle",
  },
  {
    Icon: MessageCircle,
    textKey: "accountDeletion.chats",
  },
  {
    Icon: ImageIcon,
    textKey: "accountDeletion.profile",
  },
  {
    Icon: Heart,
    textKey: "accountDeletion.matches",
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
        tx("app.settings.deleteAccount.profilePaused"),
        tx("app.settings.deleteAccount.youAreHiddenFromCircleSwipesAndYourProfile"),
        [{ text: tx("app.settings.deleteAccount.ok"), onPress: () => router.back() }],
      );
    } catch (error) {
      console.error("Error pausing profile:", error);
      Alert.alert(tx("app.settings.deleteAccount.couldNotPauseProfile"), tx("app.settings.deleteAccount.pleaseTryAgain"));
    } finally {
      setPausing(false);
    }
  };

  const handleDeleteForever = async () => {
    if (!canDelete) {
      setErrorText(tx("app.settings.deleteAccount.typeDeleteExactlyToContinue"));
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
        error instanceof Error ? error.message : tx("common.retry");
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
        <StatusBar />
        <View style={styles.farewellWrap}>
          <View style={styles.farewellCard}>
            <View style={styles.farewellIcon}>
              <Heart size={28} color={Colors.textPrimary} strokeWidth={2.1} />
            </View>
            <Text style={styles.farewellTitle}>{tx("app.settings.deleteAccount.yourAccountIsGone")}</Text>
            <Text style={styles.farewellBody}>
              {tx("app.settings.deleteAccount.thanksForSpendingTimeWithSociolTheDoorS")}</Text>
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.blackButton}
              onPress={() => router.replace("/(auth)/welcome")}
            >
              <Text style={styles.blackButtonText}>{tx("app.settings.deleteAccount.close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (stage === "deleting") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar />
        <View style={styles.farewellWrap}>
          <View style={styles.deletingCard}>
            <Animated.View style={[styles.deletingIcon, spinStyle]}>
              <Trash2 size={26} color={Colors.danger} strokeWidth={2.1} />
            </Animated.View>
            <Text style={styles.deletingTitle}>{tx("app.settings.deleteAccount.closingYourAccount")}</Text>
            <Text style={styles.deletingBody}>
              {tx("app.settings.deleteAccount.removingProfileChatsAndMatches")}</Text>
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
      <StatusBar />
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
          <Text style={styles.headerTitle}>{tx("app.settings.deleteAccount.deleteAccount")}</Text>
        </View>

        {stage === "warning" ? (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroIcon}>
              <Trash2 size={32} color={Colors.danger} strokeWidth={2.1} />
            </View>
            <Text style={styles.title}>{tx("app.settings.deleteAccount.weLlMissYou")}</Text>
            <Text style={styles.subtitle}>
              {tx("app.settings.deleteAccount.deletingYourAccountIsPermanentThereSNoWay")}</Text>

            <View style={styles.lossCard}>
              <Text style={styles.lossLabel}>{tx("app.settings.deleteAccount.youLlLose")}</Text>
              {lossRows.map(({ Icon, textKey }) => (
                <View key={textKey} style={styles.lossRow}>
                  <Icon size={18} color={Colors.danger} strokeWidth={2.1} />
                  <Text style={styles.lossText}>{tx(textKey)}</Text>
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
                {tx("app.settings.deleteAccount.justNeedABreakYouCan")}{" "}
                <Text style={styles.pauseStrong}>{tx("app.settings.deleteAccount.pauseYourProfileInstead")}</Text>{" "}
                {tx("app.settings.deleteAccount.andYourCircleStaysPut")}</Text>
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
                    {tx("app.settings.deleteAccount.pauseMyProfileInstead")}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                style={styles.dangerButton}
                onPress={() => setStage("confirm")}
              >
                <Text style={styles.dangerButtonText}>{tx("app.settings.deleteAccount.continueToDelete")}</Text>
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
                <Text style={styles.confirmTitle}>{tx("app.settings.deleteAccount.typeDeleteToConfirm")}</Text>
              </View>
              <Text style={styles.confirmBody}>
                {tx("app.settings.deleteAccount.thisActionIsPermanentYourCircleWillBeNotified")}</Text>
              <TextInput
                value={confirmation}
                onChangeText={(text) => {
                  setConfirmation(text);
                  setErrorText(null);
                }}
                autoFocus
                autoCapitalize="characters"
                placeholder={tx("app.settings.deleteAccount.delete")}
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
                  <Text style={styles.confirmCancelText}>{tx("app.settings.deleteAccount.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.82}
                  style={[
                    styles.confirmDelete,
                    !canDelete && styles.confirmDeleteDisabled,
                  ]}
                  onPress={handleDeleteForever}
                >
                  <Text style={styles.confirmDeleteText}>{tx("app.settings.deleteAccount.deleteForever")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = createThemedStyles((Colors) => ({
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
    backgroundColor: Colors.dangerSurface,
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
    backgroundColor: Colors.warningSurface,
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
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.surface,
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
}));
