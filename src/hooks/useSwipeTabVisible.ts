import { useAuth } from "@/src/context/AuthContext";
import { shouldHideSwipeTab } from "@/src/services/circle";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export const useSwipeTabVisible = () => {
  const { user, loading: authLoading } = useAuth();
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setVisible(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const hide = await shouldHideSwipeTab(user.id);
      setVisible(!hide);
    } catch (error) {
      console.error("Error checking swipe tab visibility:", error);
      setVisible(true);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { swipeTabVisible: visible, loading };
};
