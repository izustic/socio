import CircleChatRoute from "@/src/screens/circle/CircleChatScreen";
import CircleCompleteScreen from "@/src/screens/circle/CircleCompleteScreen";
import CircleProgressScreen from "@/src/screens/circle/CircleProgressScreen";
import NoCircleScreen from "@/src/screens/circle/NoCircleScreen";
import { Colors, Spacing } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { getLatestCircleForParticipant } from "@/src/services/circle";
import { Circle } from "@/src/types";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CircleView = "progress" | "complete" | "chat";

const isCircleView = (value: unknown): value is CircleView =>
  value === "progress" || value === "complete" || value === "chat";

export default function CircleTabScreen() {
  const { user, loading: authLoading } = useAuth();
  const params = useLocalSearchParams<{ circleView?: string }>();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [loading, setLoading] = useState(true);
  const requestedView = isCircleView(params.circleView)
    ? params.circleView
    : null;

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadCircle = async () => {
        if (authLoading) return;

        if (!user) {
          if (active) {
            setCircle(null);
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        const latestCircle = await getLatestCircleForParticipant(user.id);
        if (!active) return;

        setCircle(latestCircle);
        setLoading(false);
      };

      loadCircle();

      return () => {
        active = false;
      };
    }, [authLoading, user, params.circleView]),
  );

  if (requestedView === "chat") {
    return <CircleChatRoute />;
  }

  if (requestedView === "complete") {
    return <CircleCompleteScreen />;
  }

  if (requestedView === "progress") {
    return <CircleProgressScreen />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!circle) {
    return <NoCircleScreen />;
  }

  if (circle.status === "complete") {
    return <CircleCompleteScreen />;
  }

  return <CircleProgressScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.screenPadding,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
