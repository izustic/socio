import CircleChatRoute from "@/src/screens/circle/CircleChatScreen";
import CircleCompleteScreen from "@/src/screens/circle/CircleCompleteScreen";
import CircleProgressScreen from "@/src/screens/circle/CircleProgressScreen";
import NoCircleScreen from "@/src/screens/circle/NoCircleScreen";
import { createThemedStyles, Colors, Spacing } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useSwipeTabVisibility } from "@/src/context/SwipeTabVisibilityContext";
import { getLatestCircleForParticipant } from "@/src/services/circle";
import { Circle } from "@/src/types";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CircleView = "progress" | "complete" | "chat";

const isCircleView = (value: unknown): value is CircleView =>
  value === "progress" || value === "complete" || value === "chat";

export default function CircleTabScreen() {
  const { user, loading: authLoading } = useAuth();
  const { refreshSwipeTabVisibility, joinBrowsingActive } = useSwipeTabVisibility();
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
        void refreshSwipeTabVisibility({ silent: true });
      };

      loadCircle();

      return () => {
        active = false;
      };
    }, [authLoading, user, refreshSwipeTabVisibility]),
  );

  useFocusEffect(
    useCallback(() => {
      if (loading || authLoading || circle || !joinBrowsingActive) {
        return;
      }

      router.replace("/(tabs)/swipe");
    }, [loading, authLoading, circle, joinBrowsingActive]),
  );

  if (requestedView === "chat") {
    return <CircleChatRoute />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!circle) {
    if (joinBrowsingActive) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        </SafeAreaView>
      );
    }

    return <NoCircleScreen />;
  }

  if (requestedView === "complete") {
    return <CircleCompleteScreen />;
  }

  if (requestedView === "progress") {
    return <CircleProgressScreen />;
  }

  if (circle.status === "complete") {
    return <CircleCompleteScreen />;
  }

  return <CircleProgressScreen />;
}

const styles = createThemedStyles((Colors) => ({
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
}));
