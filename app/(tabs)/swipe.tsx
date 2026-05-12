import { Colors, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { getActiveCircleForUser } from "@/src/services/swipe";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SwipeTabScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasCircle, setHasCircle] = useState(false);

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

  useEffect(() => {
    if (!loading) {
      if (hasCircle) {
        router.replace("/circle/swipe-users");
      } else {
        router.replace("/circle/swipe-circles");
      }
    }
  }, [loading, hasCircle]);

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    </SafeAreaView>
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
