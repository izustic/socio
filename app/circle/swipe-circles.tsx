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
import { getUserProfile } from "@/src/services/user";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Check, MapPin, Users, X } from "lucide-react-native";
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
  const [toastData, setToastData] = useState<{
    circleName: string;
    userName: string;
  } | null>(null);
  const [memberProfiles, setMemberProfiles] = useState<any[]>([]);
  const [hostProfile, setHostProfile] = useState<any>(null);

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

  // Fetch member profiles and host profile when current circle changes
  useEffect(() => {
    const fetchCircleMembers = async () => {
      if (circles.length > 0 && currentIndex < circles.length) {
        const currentCircle = circles[currentIndex];

        // Fetch host profile
        const host = await getUserProfile(currentCircle.creatorId);
        setHostProfile(host);

        // Fetch member profiles (excluding host)
        const memberIds = currentCircle.members.filter(
          (id) => id !== currentCircle.creatorId,
        );
        if (memberIds.length > 0) {
          const profiles = await Promise.all(
            memberIds.map((id) => getUserProfile(id)),
          );
          setMemberProfiles(profiles.filter(Boolean));
        } else {
          setMemberProfiles([]);
        }
      }
    };

    fetchCircleMembers();
  }, [circles, currentIndex]);

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
        setToastData({
          circleName: currentCircle.name,
          userName: profile?.name || "You",
        });
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
          {/* <Text style={styles.badgeText}>
            {circles.length - currentIndex} left
          </Text> */}
          <Users size={13} color={Colors.textPrimary} />
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
        {/* Full-bleed photo */}
        <Image
          source={
            currentCircle.imageUrl
              ? { uri: currentCircle.imageUrl }
              : require("../../assets/images/circle-placeholder.png")
          }
          style={styles.cardImage}
        />

        {/* Top-left: spots badge */}
        {/* <View style={styles.spotsBadge}>
    <Text style={styles.spotsBadgeText}>👥 {currentCircle.members.length} / {currentCircle.size} spots</Text>
  </View> */}
        <View style={styles.spotsBadge}>
          <Users size={13} color={Colors.textPrimary} />
          <Text style={styles.spotsBadgeText}>
            {currentCircle.members.length} / {currentCircle.size} spots
          </Text>
        </View>

        {/* Top-left: JOIN label (bottom-left of top area) */}
        {showOverlayButtons && (
          <Animated.View
            style={[styles.joinLabel, { opacity: overlayOpacity }]}
          >
            <Text style={styles.joinLabelText}>JOIN ✓</Text>
          </Animated.View>
        )}
        {/* Top-right: SKIP label */}
        {showOverlayButtons && (
          <Animated.View
            style={[styles.skipLabel, { opacity: overlayOpacity }]}
          >
            <Text style={styles.skipLabelText}>SKIP ✕</Text>
          </Animated.View>
        )}
        {/* Bottom overlay: circle info */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.75)"]}
          style={styles.cardOverlay}
        >
          <Text style={styles.overlayName}>{currentCircle.name}</Text>
          {/* <View style={styles.overlayMeta}>
      <Text style={styles.overlayMetaText}>📍 {currentCircle.distance?.toFixed(1)} km away</Text>
      <Text style={styles.overlayMetaText}> · Ages {currentCircle.filters.ageRange[0]}-{currentCircle.filters.ageRange[1]}</Text>
    </View> */}
          <View style={styles.overlayMeta}>
            <MapPin size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.overlayMetaText}>
              {currentCircle.distance?.toFixed(1)} km away
            </Text>
            <Text style={styles.overlayMetaText}>
              · Ages {currentCircle.filters.ageRange[0]}-
              {currentCircle.filters.ageRange[1]}
            </Text>
          </View>
          <Text style={styles.overlayBio}>{currentCircle.meetupGoal}</Text>
          <View style={styles.overlayAvatarRow}>
            {memberProfiles.length > 0 ? (
              <>
                {/* Show up to 3 member avatars */}
                {memberProfiles.slice(0, 3).map((profile, idx) => (
                  <Image
                    key={profile.id}
                    source={{ uri: profile.photoURL }}
                    style={styles.memberAvatar}
                  />
                ))}
                {/* Show remaining count if there are more than 3 members */}
                {memberProfiles.length > 3 && (
                  <Text style={styles.overlayHostText}>
                    +{memberProfiles.length - 3} Hosted by{" "}
                    {hostProfile?.name || "Unknown"}
                  </Text>
                )}
                {/* If there are 3 or fewer members, just show host name */}
                {memberProfiles.length <= 3 && (
                  <Text style={styles.overlayHostText}>
                    Hosted by {hostProfile?.name || "Unknown"}
                  </Text>
                )}
              </>
            ) : (
              /* If no members yet, just show host name */
              <Text style={styles.overlayHostText}>
                Hosted by {hostProfile?.name || "Unknown"}
              </Text>
            )}
          </View>
          <View style={styles.chipsRow}>
            {currentCircle.filters.interests?.slice(0, 3).map((i, idx) => (
              <Chip key={idx} label={i} selected />
            ))}
          </View>
        </LinearGradient>
      </View>

      {/* <View style={styles.card}>
        <View style={styles.photoPlaceholder}>
          <Image 
            source={require("../../assets/images/circle-placeholder.png")} 
            style={styles.placeholderImage}
            defaultSource={require("../../assets/images/circle-placeholder.png")}
          />
        </View>
        
     
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
          
        
          <View style={styles.distanceRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.distance}>
              {currentCircle.distance ? `${currentCircle.distance.toFixed(1)} km away` : "2.4 km away"}
            </Text>
          </View>
          
         
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
          
          
          <View style={styles.membersSection}>
            <View style={styles.memberAvatars}>
             
              <View style={[styles.memberAvatar, { backgroundColor: Colors.primaryLight }]} />
              <View style={[styles.memberAvatar, { backgroundColor: Colors.inputBg, marginLeft: -8 }]} />
              <View style={[styles.memberAvatar, { backgroundColor: Colors.inputBg, marginLeft: -8 }]} />
              <Text style={styles.moreMembers}>+2</Text>
            </View>
            <Text style={styles.hostInfo}>Hosted by Marcus</Text>
          </View>
        </View>
      </View> */}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => handleSwipe(false)}
        >
          <X size={28} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleSwipe(true)}
        >
          <Check size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        {/* <TouchableOpacity
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
        </TouchableOpacity> */}
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
  // card: {
  //   flex: 1,
  //   borderRadius: 24,
  //   overflow: "hidden",
  //   backgroundColor: Colors.white,
  // },
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
    backgroundColor: Colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
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
  // memberAvatar: {
  //   width: 24,
  //   height: 24,
  //   borderRadius: Radius.full,
  //   borderWidth: 2,
  //   borderColor: Colors.white,
  // },
  moreMembers: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  hostInfo: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.white,
    position: "relative",
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 6,
  },
  overlayName: {
    ...Typography.h2,
    color: Colors.white,
  },
  overlayMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  overlayMetaText: {
    ...Typography.bodySmall,
    color: "rgba(255,255,255,0.85)",
  },
  overlayBio: {
    ...Typography.bodySmall,
    color: "rgba(255,255,255,0.8)",
  },
  overlayAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  overlayHostText: {
    ...Typography.bodySmall,
    color: "rgba(255,255,255,0.85)",
    marginLeft: 4,
  },
  memberAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.white,
    marginLeft: -6,
  },
  spotsBadge: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  spotsBadgeText: {
    ...Typography.label,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  joinLabel: {
    position: "absolute",
    top: 50,
    left: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
    transform: [{ rotate: "-8deg" }],
  },
  joinLabelText: {
    ...Typography.label,
    color: Colors.white,
    fontWeight: "700",
  },
  skipLabel: {
    position: "absolute",
    top: 50,
    right: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
    transform: [{ rotate: "8deg" }],
  },
  skipLabelText: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: "700",
  },
});
