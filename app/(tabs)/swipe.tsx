import { SafeAreaView } from "react-native-safe-area-context";
import {
  Colors,
  Spacing,
  Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useSwipeTabVisibility } from "@/src/context/SwipeTabVisibilityContext";
import SwipeCirclesScreen from "@/src/screens/circle/SwipeCirclesScreen";
import SwipeUsersScreen from "@/src/screens/circle/SwipeUsersScreen";
import { getUserCircleParticipation } from "@/src/services/circle";
import { JoinCircleFilters } from "@/src/services/swipe";
import { router,
  useLocalSearchParams } from "expo-router";
import React,
  { useEffect,
  useMemo,
  useRef,
  useState } from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SwipeTabScreen() {
  const { user } = useAuth();
  const { swipeTabVisible, loading: tabVisibilityLoading } =
    useSwipeTabVisibility();
  const [loading, setLoading] = useState(true);
  const [participationRole, setParticipationRole] = useState<
    "host" | "joiner" | null
  >(null);
  const hasResolvedInitialVisibility = useRef(false);
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

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { role } = await getUserCircleParticipation(user.id);
        setParticipationRole(role);
      } catch (error) {
        console.error("Error checking circle status:", error);
        setParticipationRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [user, swipeTabVisible]);

  useEffect(() => {
    if (tabVisibilityLoading || loading) return;

    if (!hasResolvedInitialVisibility.current) {
      hasResolvedInitialVisibility.current = true;
      if (!swipeTabVisible) {
        router.replace("/(tabs)/home");
      }
      return;
    }

    if (!swipeTabVisible) {
      router.replace("/(tabs)/home");
    }
  }, [swipeTabVisible, tabVisibilityLoading, loading]);

  if (loading || tabVisibilityLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding your matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (participationRole === "host") {
    return <SwipeUsersScreen />;
  }

  return <SwipeCirclesScreen filters={filters} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
});
