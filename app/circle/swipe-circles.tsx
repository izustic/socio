import Button from "@/src/components/ui/Button";
import Chip from "@/src/components/ui/Chip";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import {
    CircleCandidate,
    getCircleCandidates,
    JoinCircleFilters,
    submitCircleSwipe,
} from "@/src/services/swipe";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "../../src/components/ui/Toast";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SwipeCirclesScreen() {
  const { user, profile } = useAuth();
  const params = useLocalSearchParams<{
    distance?: string;
    ageMin?: string;
    ageMax?: string;
    genderMix?: string;
    educationLevel?: string;
    vibes?: string;
    interests?: string;
    traits?: string;
  }>();

  const [circles, setCircles] = useState<CircleCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [matchName, setMatchName] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState<{ circleName: string; userName: string } | null>(null);

  // Onboarding guide animation
  const [showGuide, setShowGuide] = useState(true);
  const guideOpacity = React.useRef(new Animated.Value(1)).current;

  // Overlay buttons fade animation
  const [showOverlayButtons, setShowOverlayButtons] = useState(true);
  const overlayOpacity = React.useRef(new Animated.Value(1)).current;

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

  // Parse filters from params
  const filters = useMemo((): JoinCircleFilters => {
    return {
      ageRange: [
        parseInt(params.ageMin || "18", 10),
        parseInt(params.ageMax || "50", 10),
      ],
      educationLevel: params.educationLevel || "Any",
      locationRadius: parseInt(params.distance || "25", 10),
      interests: params.interests ? (params.interests.split(",") as any) : [],
      vibe: params.vibes || undefined,
      genderMix: (params.genderMix as any) || "Both",
      traits: params.traits ? (params.traits.split(",") as any) : [],
    };
  }, [params]);

  const currentCircle = useMemo(
    () => circles[currentIndex] || null,
    [circles, currentIndex],
  );

  const loadCircles = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const candidates = await getCircleCandidates(user.id, profile, filters);
      setCircles(candidates);
    } catch (error: any) {
      Alert.alert(
        "Unable to load circles",
        error?.message || "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Onboarding guide animation - flash and fade
  useEffect(() => {
    if (!showGuide) return;

    // Flash animation: quick scale up then fade out
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

  useEffect(() => {
    loadCircles();
  }, [user?.id]);

  const handleSwipe = async (liked: boolean) => {
    if (!user || !currentCircle || swiping) return;
    setSwiping(true);
    try {
      const result = await submitCircleSwipe(currentCircle.id, user.id, liked);

      if (liked) {
        setToastData({ circleName: currentCircle.name, userName: profile?.name || 'You' });
        setShowToast(true);
      }

      if (result.addedToCircle) {
        setMatchName(currentCircle.name);
      }

      if (result.mutualMatch && result.addedToCircle) {
        Alert.alert(
          "Circle complete!",
          `You've joined ${currentCircle.name}! Opening your Circle tab.`,
        );
        router.replace("/circle/chat");
        return;
      }

      // Move to next circle
      setCurrentIndex((prev) => prev + 1);
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
          <Text style={styles.emptySubtitle}>Finding Circles near you...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>Sign in required</Text>
          <Text style={styles.emptySubtitle}>
            Please sign in to swipe on Circles.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // No circles available - show empty state
  if (!currentCircle) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.caughtUpCard}>
          <View style={styles.caughtUpIconWrap}>
            <Text style={styles.caughtUpIcon}>🔍</Text>
          </View>
          <Text style={styles.caughtUpTitle}>No Circles found</Text>
          <Text style={styles.caughtUpCopy}>
            No Circles match your preferences right now. Try adjusting your
            filters or check back later.
          </Text>
          <View style={styles.caughtUpButtons}>
            <Button
              title="Adjust filters"
              onPress={() => router.push("/circle/join-preferences")}
            />
            <Button
              title="Create a Circle"
              variant="outline"
              onPress={() => router.push("/circle/create")}
            />
          </View>
        </View>
        <Text style={styles.footerHint}>
          We'll notify you when new Circles are created near you
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
            <Text style={styles.guideTitle}>👆 Swipe to join</Text>
            <Text style={styles.guideText}>
              Swipe right on Circles you like. If a host likes you back, you'll
              be added to their Circle!
            </Text>
          </View>
        </Animated.View>
      )}

      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Find a Circle</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {circles.length - currentIndex} left
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${(currentIndex / circles.length) * 100}%` },
          ]}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.photoPlaceholder}>
          <Image 
            source={require("../../assets/images/circle-placeholder.png")} 
            style={styles.placeholderImage}
            defaultSource={require("../../assets/images/circle-placeholder.png")}
          />
        </View>
        
        {/* Overlay Action Buttons */}
        {showOverlayButtons && (
          <Animated.View style={[styles.overlayButtons, { opacity: overlayOpacity }]}>
            <View style={styles.overlaySkipButton}>
              <Text style={styles.overlayX}>✕</Text>
            </View>
            <View style={styles.overlayJoinButton}>
              <Text style={styles.overlayCheck}>✓</Text>
            </View>
          </Animated.View>
        )}

        <View style={styles.info}>
          <Text style={styles.name}>{currentCircle.name}</Text>
          
          {/* Distance with location icon */}
          <View style={styles.distanceRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.distance}>
              {currentCircle.distance ? `${currentCircle.distance.toFixed(1)} km away` : "2.4 km away"}
            </Text>
          </View>
          
          {/* Member count with user icon */}
          <View style={styles.memberCountRow}>
            <Text style={styles.userIcon}>👥</Text>
            <Text style={styles.memberCount}>
              {currentCircle.members.length}/{currentCircle.size} spots
            </Text>
          </View>
          
          <Text style={styles.ageRange}>
            Ages {currentCircle.filters.ageRange[0]}-{currentCircle.filters.ageRange[1]}
          </Text>
          <Text style={styles.bio}>
            {currentCircle.meetupGoal || "Looking to make new friends."}
          </Text>
          <View style={styles.chipsRow}>
            {(currentCircle.filters.interests || [])
              .slice(0, 3)
              .map((interest, idx) => (
                <Chip key={`${interest}-${idx}`} label={interest} />
              ))}
          </View>
          
          {/* Members section */}
          <View style={styles.membersSection}>
            <View style={styles.memberAvatars}>
              {/* Placeholder avatars - in real app would show actual member photos */}
              <View style={[styles.memberAvatar, { backgroundColor: Colors.primaryLight }]} />
              <View style={[styles.memberAvatar, { backgroundColor: Colors.inputBg, marginLeft: -8 }]} />
              <View style={[styles.memberAvatar, { backgroundColor: Colors.inputBg, marginLeft: -8 }]} />
              <Text style={styles.moreMembers}>+2</Text>
            </View>
            <Text style={styles.hostInfo}>Hosted by Marcus</Text>
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
            <Text style={styles.matchTitle}>You're in! 🎉</Text>
            <Text style={styles.matchSubtitle}>You've joined {matchName}</Text>
            <Button title="Continue" onPress={() => setMatchName(null)} />
          </View>
        </View>
      ) : null}

      {/* Toast Notification */}
      <Toast
        visible={showToast}
        type="request_sent"
        circleName={toastData?.circleName}
        userName={toastData?.userName}
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
  emptyTitle: {
    ...Typography.h2,
    textAlign: "center",
  },
  emptySubtitle: {
    ...Typography.bodySmall,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topTitle: {
    ...Typography.h3,
  },
  badge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  badgeText: {
    ...Typography.label,
    color: Colors.primaryDark,
    fontWeight: "600",
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
    justifyContent: "center",
    alignItems: "center",
  },
  circleEmoji: {
    fontSize: 80,
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
    marginTop: Spacing.xs,
  },
  actions: {
    marginTop: Spacing.lg,
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl,
  },
  skipButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.danger,
  },
  acceptButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  skipIcon: {
    fontSize: 28,
    color: Colors.danger,
  },
  acceptIcon: {
    fontSize: 28,
    color: Colors.white,
  },
  disabled: {
    opacity: 0.5,
  },
  caughtUpCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  caughtUpIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  caughtUpIcon: {
    fontSize: 36,
  },
  caughtUpTitle: {
    ...Typography.h2,
    textAlign: "center",
  },
  caughtUpCopy: {
    ...Typography.body,
    textAlign: "center",
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  caughtUpButtons: {
    width: "100%",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  footerHint: {
    ...Typography.label,
    textAlign: "center",
    marginTop: Spacing.lg,
    color: Colors.textSecondary,
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
  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  matchCard: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    alignItems: "center",
    width: SCREEN_WIDTH - Spacing.xl * 2,
  },
  matchTitle: {
    ...Typography.h1,
    color: Colors.primary,
  },
  matchSubtitle: {
    ...Typography.body,
    marginTop: Spacing.sm,
    textAlign: "center",
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
  overlayJoinButton: {
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
  // Image and icon styles
  placeholderImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  memberCountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  userIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  memberCount: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  // Circle info styles
  distance: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  ageRange: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  // Members section
  membersSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  memberAvatars: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  moreMembers: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  hostInfo: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
