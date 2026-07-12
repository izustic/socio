import { SafeAreaView } from "react-native-safe-area-context";
import AlertModal from "@/src/components/ui/AlertModal";
import Button from "@/src/components/ui/Button";
import Toast from "@/src/components/ui/Toast";
import { createThemedStyles,
  Colors,
  Radius,
  Spacing,
  Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useSwipeTabVisibility } from "@/src/context/SwipeTabVisibilityContext";
import { getCircle } from "@/src/services/circle";
import {
  getActiveCircleForUser,
  getSwipeCandidates,
  submitSwipe,
  SwipeCandidate,
  } from "@/src/services/swipe";
import { Circle } from "@/src/types";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Check,
  ChevronLeft,
  ChevronRight,
  X } from "lucide-react-native";
import React,
  { useCallback,
  useEffect,
  useMemo,
  useRef,
  useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  InteractionManager,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { optionLabel, tx } from "@/src/utils/localization";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const replaceAfterInteractions = (href: Parameters<typeof router.replace>[0]) => {
  InteractionManager.runAfterInteractions(() => {
    router.replace(href);
  });
};

export default function SwipeUsersScreen() {
  const { user, profile } = useAuth();
  const { refreshSwipeTabVisibility } = useSwipeTabVisibility();
  const [circle, setCircle] = useState<(Circle & { id: string }) | null>(null);
  const [candidates, setCandidates] = useState<SwipeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastUser, setToastUser] = useState<{
    name: string;
    age: number;
  } | null>(null);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    primaryLabel?: string;
    secondaryLabel?: string;
    imageUri?: string;
    detail?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
  });
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      options: Omit<typeof alertState, "visible" | "title" | "message"> = {},
    ) => {
      setAlertState({
        visible: true,
        title,
        message,
        ...options,
      });
    },
    [],
  );

  const closeAlert = () => {
    setAlertState((prev) => ({
      ...prev,
      visible: false,
      onConfirm: undefined,
      onCancel: undefined,
      imageUri: undefined,
      detail: undefined,
    }));
  };

  const handleAlertConfirm = () => {
    const callback = alertState.onConfirm;
    closeAlert();
    callback?.();
  };

  // Onboarding guide animation
  const [showGuide, setShowGuide] = useState(true);
  const guideOpacity = useRef(new Animated.Value(1)).current;

  // Overlay labels fade animation
  const [showOverlayLabels, setShowOverlayLabels] = useState(true);
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showOverlayLabels) {
      const timer = setTimeout(() => {
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setShowOverlayLabels(false);
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showOverlayLabels, overlayOpacity]);

  const currentCandidate = useMemo(() => candidates[0] || null, [candidates]);
  const progressText = useMemo(() => {
    if (!circle) return "0 / 0";
    return `${(circle.members || []).length} / ${circle.size}`;
  }, [circle]);
  const progressSubText = useMemo(() => {
    if (!circle) return "0 of 0 members";
    return `${(circle.members || []).length} of ${circle.size} members`;
  }, [circle]);
  const progressWidth = useMemo((): any => {
    if (!circle || !circle.size) return "0%";
    const ratio = Math.min(1, (circle.members || []).length / circle.size);
    return `${ratio * 100}%`;
  }, [circle]);

  const loadSwipeData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const activeCircle = await getActiveCircleForUser(user.id);
      if (!activeCircle) {
        replaceAfterInteractions("/(tabs)/home");
        return null;
      }

      const nextCandidates = await getSwipeCandidates({
        circle: activeCircle,
        currentUserId: user.id,
        currentUserProfile: profile,
      });
      setCircle(activeCircle);
      setCandidates(nextCandidates);
    } catch (error: any) {
      showAlert(tx("circle.SwipeUsersScreen.unableToLoadSwipes"), error?.message || tx("circle.SwipeUsersScreen.pleaseTryAgain"));
    } finally {
      setLoading(false);
    }
  }, [profile, showAlert, user]);

  useEffect(() => {
    loadSwipeData();
  }, [loadSwipeData]);

  // Onboarding guide animation - flash and fade
  useEffect(() => {
    if (!showGuide) return;

    const flashAnimation = Animated.sequence([
      Animated.timing(guideOpacity, {
        toValue: 0,
        duration: 3000,
        delay: 1500,
        useNativeDriver: true,
      }),
    ]);

    flashAnimation.start(() => {
      setShowGuide(false);
    });

    return () => {
      flashAnimation.stop();
    };
  }, [guideOpacity, showGuide]);

  const syncCircleAfterSwipe = async (circleId: string) => {
    const updatedCircle = await getCircle(circleId);
    if (updatedCircle) {
      setCircle({ ...updatedCircle, id: updatedCircle.id });
    }
    return updatedCircle;
  };

  const handleSwipe = async (liked: boolean) => {
    if (!user || !circle || !currentCandidate || swiping) return;
    const swipedCandidate = currentCandidate;
    const swipedCandidateName = swipedCandidate.name;
    const previousCandidates = candidates;
    setSwiping(true);
    setCandidates((prev) =>
      prev.filter((candidate) => candidate.uid !== swipedCandidate.uid),
    );
    setCurrentMediaIndex(0);

    try {
      const result = await submitSwipe(
        circle.id,
        user.id,
        swipedCandidate.uid,
        liked,
      );

      if (liked && (result.addedToCircle || result.circleComplete)) {
        await syncCircleAfterSwipe(circle.id);
      }

      await refreshSwipeTabVisibility({ silent: true });

      if (result.circleComplete) {
        showAlert(
          tx("circle.SwipeUsersScreen.circleComplete"),
          tx("circle.SwipeUsersScreen.yourCircleIsNowFullOpeningYourCircleTab"),
          {
            primaryLabel: tx("circle.SwipeUsersScreen.viewCircle"),
            onConfirm: () => {
              replaceAfterInteractions("/(tabs)/home?circleView=complete");
            },
          },
        );
        return;
      }

      if (liked && result.mutualMatch && result.addedToCircle) {
        showAlert(
          tx("circle.SwipeUsersScreen.value1HasJoinedYourCircle", { value1: swipedCandidateName }),
          tx("circle.SwipeUsersScreen.value1IsNowListedAsAMemberOfValue2", { value1: swipedCandidateName, value2: circle.name }),
          {
            primaryLabel: tx("circle.SwipeUsersScreen.viewCircle"),
            imageUri: swipedCandidate.photoURL || undefined,
            detail: tx("circle.SwipeUsersScreen.value1Value2", { value1: swipedCandidate.age, value2: swipedCandidate.bio || tx("circleSwipe.readyToMeet") }),
            onConfirm: () => {
              replaceAfterInteractions("/(tabs)/home?circleView=progress");
            },
          },
        );
        return;
      }

      if (liked) {
        setToastUser({
          name: swipedCandidate.name,
          age: swipedCandidate.age,
        });
        setShowToast(true);
      }

      if (!result.addedToCircle) {
        await syncCircleAfterSwipe(circle.id);
      }
    } catch (error: any) {
      setCandidates(previousCandidates);
      setCurrentMediaIndex(0);
      showAlert(tx("circle.SwipeUsersScreen.swipeFailed"), error?.message || tx("circle.SwipeUsersScreen.pleaseTryAgain"));
    } finally {
      setSwiping(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
          <Text style={styles.emptySubtitle}>{tx("circle.SwipeUsersScreen.findingYourBestMatches")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!circle) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar />
        <View style={styles.centerContent}>
          <View style={styles.emptyArtwork} />
          <Text style={styles.emptyTitle}>{tx("circle.SwipeUsersScreen.noActiveCircleYet")}</Text>
          <Text style={styles.emptySubtitle}>
            {tx("circle.SwipeUsersScreen.createACircleFirstThenComeBackToStart")}</Text>
          <View style={styles.emptyCtaWrap}>
            <Button
              title={tx("circle.SwipeUsersScreen.createCircle")}
              onPress={() => router.push("/circle/create")}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentCandidate) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar />
        {/* <View style={styles.topBar}>
          <Text style={styles.topTitle}>{circle.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{progressText}</Text>
          </View>
        </View>
        <Text style={styles.progressSub}>{progressSubText}</Text>
        <View style={styles.progressTrackTop}>
          <View style={[styles.progressFillTop, { width: progressWidth }]} />
        </View> */}
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>{circle.name}</Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>{progressText}</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>{progressSubText}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <View style={styles.caughtUpCard}>
          <View style={styles.caughtUpIconWrap}>
            <Text style={styles.caughtUpIcon}>◌</Text>
          </View>
          <Text style={styles.caughtUpTitle}>{tx("circle.SwipeUsersScreen.youReAllCaughtUp")}</Text>
          <Text style={styles.caughtUpCopy}>
            {tx("circle.SwipeUsersScreen.noMorePeopleMatchYourFiltersRightNowTry")}</Text>
          <View style={styles.caughtUpButtons}>
            <Button
              title={tx("circle.SwipeUsersScreen.adjustFilters")}
              onPress={() =>
                router.push({
                  pathname: "/circle/create-preferences",
                  params: { circleId: circle.id },
                })
              }
            />
            <Button
              title={tx("circle.SwipeUsersScreen.checkBackLater")}
              variant="outline"
              onPress={() => router.push("/(tabs)/home?circleView=chat")}
            />
          </View>
        </View>
        <Text style={styles.footerHint}>
          {tx("circle.SwipeUsersScreen.weLlNotifyYouWhenNewPeopleJoinNear")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />

      {/* Onboarding Guide Overlay */}
      {showGuide && (
        <Animated.View
          style={[styles.guideOverlay, { opacity: guideOpacity }]}
          pointerEvents="none"
        >
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>{tx("circle.SwipeUsersScreen.swipeToConnect")}</Text>
            <Text style={styles.guideText}>
              {tx("circle.SwipeUsersScreen.swipeRightOnPeopleYouDLikeInYour")}</Text>
          </View>
        </Animated.View>
      )}

      {/* Top Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>{circle.name}</Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>{progressText}</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>{progressSubText}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* Main Card with Image and Overlays */}
      <View style={styles.card}>
        {/* Card Image */}
        <Image
          source={
            currentCandidate.photoURL
              ? { uri: currentCandidate.photoURL }
              : require("../../../assets/images/circle-placeholder.png")
          }
          style={styles.cardImage}
        />
        {/* Media progress dots */}
        {(currentCandidate.media?.length || 1) > 1 && (
          <View style={styles.mediaDots}>
            {(currentCandidate.media || []).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.mediaDot,
                  i === currentMediaIndex && styles.mediaDotActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Navigation Arrows */}
        <TouchableOpacity
          style={styles.navArrowLeft}
          onPress={() =>
            setCurrentMediaIndex(Math.max(0, currentMediaIndex - 1))
          }
        >
          <ChevronLeft size={24} color="rgba(0,0,0,0.4)" strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navArrowRight}
          onPress={() =>
            setCurrentMediaIndex(
              Math.min(
                (currentCandidate.media?.length || 1) - 1,
                currentMediaIndex + 1,
              ),
            )
          }
        >
          <ChevronRight size={24} color="rgba(0,0,0,0.4)" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Animated ADD Label (Left) */}
        {showOverlayLabels && (
          <Animated.View style={[styles.addLabel, { opacity: overlayOpacity }]}>
            <Text style={styles.addLabelText}>{tx("circle.SwipeUsersScreen.add")}</Text>
          </Animated.View>
        )}

        {/* Animated SKIP Label (Right) */}
        {showOverlayLabels && (
          <Animated.View
            style={[styles.skipLabel, { opacity: overlayOpacity }]}
          >
            <Text style={styles.skipLabelText}>{tx("circle.SwipeUsersScreen.skip")}</Text>
          </Animated.View>
        )}

        {/* Bottom Gradient Overlay with User Info */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.75)"]}
          style={styles.cardOverlay}
        >
          <Text style={styles.userName}>
            {currentCandidate.name}, {currentCandidate.age}
          </Text>
          <Text style={styles.userBio}>
            {currentCandidate.bio || tx("circle.SwipeUsersScreen.lookingToMakeMeaningfulFriendships")}
          </Text>
          <View style={styles.interestChipsRow}>
            {(currentCandidate.interests || [])
              .slice(0, 3)
              .map((interest, idx) => (
                <View key={`${interest}-${idx}`} style={styles.interestChip}>
                  <Text style={styles.interestChipText}>{optionLabel(interest)}</Text>
                </View>
              ))}
          </View>
        </LinearGradient>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.skipButton, swiping && styles.disabled]}
          onPress={() => handleSwipe(false)}
          disabled={swiping}
        >
          <X size={28} color={Colors.textSecondary} strokeWidth={2.5} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.addButton, swiping && styles.disabled]}
          onPress={() => handleSwipe(true)}
          disabled={swiping}
        >
          <Check size={32} color={Colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Toast Notification */}
      <Toast
        visible={showToast}
        type="match_started"
        userName={toastUser?.name}
        userAge={toastUser?.age}
        statusText={tx("circle.SwipeUsersScreen.waitingForThisPersonToSwipeOnYourCircle")}
        onDismiss={() => setShowToast(false)}
      />

      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        primaryLabel={alertState.primaryLabel}
        secondaryLabel={alertState.secondaryLabel}
        imageUri={alertState.imageUri}
        detail={alertState.detail}
        onConfirm={handleAlertConfirm}
        onCancel={alertState.onCancel ?? closeAlert}
      />
    </SafeAreaView>
  );
}

const styles = createThemedStyles((Colors) => ({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.screenPadding,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  emptyArtwork: {
    width: 180,
    height: 180,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h2,
    textAlign: "center",
  },
  emptySubtitle: {
    ...Typography.bodySmall,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  emptyCtaWrap: {
    width: "100%",
    marginTop: Spacing.xl,
  },

  /* Header Section */
  headerContainer: {
    marginBottom: Spacing.md,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    flex: 1,
  },
  badgePill: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  badgeText: {
    ...Typography.label,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },

  /* Progress Bar */
  progressTrack: {
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },

  /* Main Card */
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    position: "relative",
    marginBottom: Spacing.lg,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  /* Navigation Arrows */
  navArrowLeft: {
    position: "absolute",
    left: Spacing.md,
    top: "50%",
    transform: [{ translateY: -12 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  navArrowRight: {
    position: "absolute",
    right: Spacing.md,
    top: "50%",
    transform: [{ translateY: -12 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  /* Animated Labels */
  addLabel: {
    position: "absolute",
    left: Spacing.md,
    top: "45%",
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
    transform: [{ rotate: "-10deg" }],
    zIndex: 20,
  },
  addLabelText: {
    ...Typography.label,
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  skipLabel: {
    position: "absolute",
    right: Spacing.md,
    top: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
    transform: [{ rotate: "10deg" }],
    zIndex: 20,
  },
  skipLabelText: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: "700",
    fontSize: 14,
  },

  /* Card Bottom Gradient Overlay */
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 8,
  },
  userName: {
    ...Typography.h2,
    color: Colors.white,
    fontSize: 22,
  },
  userBio: {
    ...Typography.bodySmall,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
  },
  interestChipsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  interestChip: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  interestChipText: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontSize: 11,
  },

  /* Action Buttons */
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
    marginBottom: Spacing.md,
  },
  skipButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  skipButtonIcon: {
    fontSize: 28,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  addButtonIcon: {
    fontSize: 32,
    color: Colors.white,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },

  /* Empty State */
  caughtUpCard: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  caughtUpIconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  caughtUpIcon: {
    ...Typography.h1,
    lineHeight: 34,
  },
  caughtUpTitle: {
    ...Typography.h2,
    textAlign: "center",
  },
  caughtUpCopy: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  caughtUpButtons: {
    width: "100%",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  footerHint: {
    ...Typography.bodySmall,
    textAlign: "center",
    marginTop: Spacing.md,
  },

  /* Match Overlay */
  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  matchCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    alignItems: "center",
    width: SCREEN_WIDTH - Spacing.xl * 2,
  },
  matchTitle: {
    ...Typography.h1,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  matchSubtitle: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  mediaDots: {
    position: "absolute",
    top: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    zIndex: 10,
  },
  mediaDot: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  mediaDotActive: {
    backgroundColor: Colors.surface,
  },

  /* Guide Overlay */
  guideOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: "center",
  },
  guideCard: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
    maxWidth: SCREEN_WIDTH - Spacing.xl * 2,
  },
  guideTitle: {
    ...Typography.h3,
    color: Colors.white,
    textAlign: "center",
  },
  guideText: {
    ...Typography.bodySmall,
    color: Colors.white,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
}));
