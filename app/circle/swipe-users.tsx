import Button from "@/src/components/ui/Button";
import Chip from "@/src/components/ui/Chip";
import Toast from "@/src/components/ui/Toast";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import {
    getActiveCircleForUser,
    getSwipeCandidates,
    submitSwipe,
    SwipeCandidate,
} from "@/src/services/swipe";
import { Circle } from "@/src/types";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SwipeUsersScreen() {
  const { user, profile } = useAuth();
  const [circle, setCircle] = useState<(Circle & { id: string }) | null>(null);
  const [candidates, setCandidates] = useState<SwipeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [matchName, setMatchName] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastUser, setToastUser] = useState<{ name: string; age: number } | null>(null);

  // Onboarding guide animation
  const [showGuide, setShowGuide] = useState(true);
  const guideOpacity = useRef(new Animated.Value(1)).current;

  // Overlay buttons fade animation
  const [showOverlayButtons, setShowOverlayButtons] = useState(true);
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showOverlayButtons) {
      const timer = setTimeout(() => {
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setShowOverlayButtons(false);
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showOverlayButtons, overlayOpacity]);

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

  const loadSwipeData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const activeCircle = await getActiveCircleForUser(user.id);
      if (!activeCircle) {
        router.replace("/(tabs)/home");
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
      Alert.alert(
        "Unable to load swipes",
        error?.message || "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSwipeData();
  }, [user?.id]);

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
  }, [showGuide]);

  const handleSwipe = async (liked: boolean) => {
    if (!user || !circle || !currentCandidate || swiping) return;
    setSwiping(true);
    try {
      const result = await submitSwipe(
        circle.id,
        user.id,
        currentCandidate.uid,
        liked,
      );
      const swipedCandidateName = currentCandidate.name;

      if (liked) {
        setToastUser({ name: currentCandidate.name, age: currentCandidate.age });
        setShowToast(true);
      }

      if (result.mutualMatch) {
        setMatchName(swipedCandidateName);
      }

      if (result.circleComplete) {
        Alert.alert(
          "Circle complete!",
          "Your circle is now full. Opening your Circle tab.",
        );
        router.replace("/circle/chat");
        return;
      }

      await loadSwipeData();
    } catch (error: any) {
      Alert.alert("Swipe failed", error?.message || "Please try again.");
    } finally {
      setSwiping(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
          <Text style={styles.emptySubtitle}>Finding your best matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!circle) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContent}>
          <View style={styles.emptyArtwork} />
          <Text style={styles.emptyTitle}>No active circle yet</Text>
          <Text style={styles.emptySubtitle}>
            Create a circle first, then come back to start swiping.
          </Text>
          <View style={styles.emptyCtaWrap}>
            <Button
              title="Create Circle"
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
        <StatusBar barStyle="dark-content" />
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>{circle.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{progressText}</Text>
          </View>
        </View>
        <Text style={styles.progressSub}>{progressSubText}</Text>
        <View style={styles.progressTrackTop}>
          <View style={[styles.progressFillTop, { width: progressWidth }]} />
        </View>

        <View style={styles.caughtUpCard}>
          <View style={styles.caughtUpIconWrap}>
            <Text style={styles.caughtUpIcon}>◌</Text>
          </View>
          <Text style={styles.caughtUpTitle}>You&apos;re all caught up</Text>
          <Text style={styles.caughtUpCopy}>
            No more people match your filters right now. Try widening your
            radius or adjusting interests to see more.
          </Text>
          <View style={styles.caughtUpButtons}>
            <Button
              title="Adjust filters"
              onPress={() => router.push("/circle/create-preferences")}
            />
            <Button
              title="Check back later"
              variant="outline"
              onPress={() => router.push("/circle/chat")}
            />
          </View>
        </View>
        <Text style={styles.footerHint}>
          We&apos;ll notify you when new people join near you
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Onboarding Guide Overlay */}
      {showGuide && (
        <Animated.View
          style={[styles.guideOverlay, { opacity: guideOpacity }]}
          pointerEvents="none"
        >
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>👆 Swipe to connect</Text>
            <Text style={styles.guideText}>
              Swipe right on people you'd like in your Circle. If they also like
              you, they'll be added!
            </Text>
          </View>
        </Animated.View>
      )}

      <View style={styles.topBar}>
        <Text style={styles.topTitle}>{circle.name}</Text>
        <Text style={styles.topTitle}>{progressText}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <View style={styles.card}>
        <View style={styles.photoPlaceholder} />
        
        {/* Overlay Action Buttons */}
        {showOverlayButtons && (
          <Animated.View style={[styles.overlayButtons, { opacity: overlayOpacity }]}>
            <View style={styles.overlaySkipButton}>
              <Text style={styles.overlayX}>✕</Text>
            </View>
            <View style={styles.overlayAddButton}>
              <Text style={styles.overlayCheck}>✓</Text>
            </View>
          </Animated.View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>
            {currentCandidate.name}, {currentCandidate.age}
          </Text>
          <Text style={styles.bio}>
            {currentCandidate.bio || "Looking to make meaningful friendships."}
          </Text>
          <View style={styles.chipsRow}>
            {(currentCandidate.interests || [])
              .slice(0, 3)
              .map((interest, idx) => (
                <Chip
                  key={`${interest}-${idx}`}
                  label={interest}
                  selected={idx === 0}
                />
              ))}
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.skipButton, swiping && styles.disabled]}
          onPress={() => handleSwipe(false)}
          disabled={swiping}
        >
          <Text style={styles.skipIcon}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.acceptButton, swiping && styles.disabled]}
          onPress={() => handleSwipe(true)}
          disabled={swiping}
        >
          <Text style={styles.acceptIcon}>✓</Text>
        </TouchableOpacity>
      </View>

      {matchName ? (
        <View style={styles.matchOverlay}>
          <View style={styles.matchCard}>
            <Text style={styles.matchTitle}>It&apos;s a match! 🎉</Text>
            <Text style={styles.matchSubtitle}>
              You and {matchName} both swiped right.
            </Text>
            <Button title="Continue" onPress={() => setMatchName(null)} />
          </View>
        </View>
      ) : null}

      {/* Toast Notification */}
      <Toast
        visible={showToast}
        type="match_started"
        userName={toastUser?.name}
        userAge={toastUser?.age}
        onDismiss={() => setShowToast(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.screenPadding,
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topTitle: {
    ...Typography.h3,
  },
  progressTrack: {
    marginTop: Spacing.md,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  progressFill: {
    width: "40%",
    height: "100%",
    backgroundColor: Colors.primary,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.white,
  },
  photoPlaceholder: {
    height: "55%",
    backgroundColor: Colors.primaryLight,
  },
  info: {
    padding: 20,
    gap: Spacing.sm,
  },
  name: {
    ...Typography.h2,
  },
  bio: {
    ...Typography.bodySmall,
  },
  chipsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actions: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
  },
  skipButton: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButton: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  skipIcon: {
    ...Typography.h2,
    color: Colors.textSecondary,
  },
  acceptIcon: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  disabled: {
    opacity: 0.5,
  },
  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  matchCard: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  matchTitle: {
    ...Typography.h2,
    textAlign: "center",
  },
  matchSubtitle: {
    ...Typography.bodySmall,
    textAlign: "center",
  },
  badge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    ...Typography.h3,
  },
  progressSub: {
    ...Typography.bodySmall,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  progressTrackTop: {
    marginTop: Spacing.sm,
    height: 5,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.pill,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  progressFillTop: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  caughtUpCard: {
    flex: 1,
    backgroundColor: "#F3F3F5",
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
  // Onboarding guide styles
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
  // Overlay button styles
  overlayButtons: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: "column",
    gap: Spacing.sm,
  },
  overlaySkipButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayX: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  overlayAddButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayCheck: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
});
