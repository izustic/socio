import { Colors, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import {
  getActiveCircleForUser,
  JoinCircleFilters,
} from "@/src/services/swipe";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SwipeCirclesScreen from "../circle/swipe-circles";
import SwipeUsersScreen from "../circle/swipe-users";

export default function SwipeTabScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasCircle, setHasCircle] = useState(false);
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
        const activeCircle = await getActiveCircleForUser(user.id);
        setHasCircle(!!activeCircle);
      } catch (error) {
        console.error("Error checking circle status:", error);
        setHasCircle(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [user]);

  if (loading) {
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

  return hasCircle ? (
    <SwipeUsersScreen />
  ) : (
    <SwipeCirclesScreen filters={filters} />
  );
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
