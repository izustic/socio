import { useAuth } from "@/src/context/AuthContext";
import { shouldHideSwipeTab } from "@/src/services/circle";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface SwipeTabVisibilityContextType {
  swipeTabVisible: boolean;
  loading: boolean;
  refreshSwipeTabVisibility: (options?: {
    silent?: boolean;
  }) => Promise<void>;
}

const SwipeTabVisibilityContext =
  createContext<SwipeTabVisibilityContextType | undefined>(undefined);

export const SwipeTabVisibilityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, loading: authLoading } = useAuth();
  const [swipeTabVisible, setSwipeTabVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  const refreshSwipeTabVisibility = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

    if (authLoading) return;

    if (!user) {
      setSwipeTabVisible(true);
      if (!silent) {
        setLoading(false);
      }
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    try {
      const hide = await shouldHideSwipeTab(user.id);
      setSwipeTabVisible(!hide);
    } catch (error) {
      console.error("Error checking swipe tab visibility:", error);
      setSwipeTabVisible(true);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
    },
    [authLoading, user],
  );

  useEffect(() => {
    refreshSwipeTabVisibility();
  }, [refreshSwipeTabVisibility]);

  return (
    <SwipeTabVisibilityContext.Provider
      value={{ swipeTabVisible, loading, refreshSwipeTabVisibility }}
    >
      {children}
    </SwipeTabVisibilityContext.Provider>
  );
};

const defaultSwipeTabVisibility: SwipeTabVisibilityContextType = {
  swipeTabVisible: true,
  loading: false,
  refreshSwipeTabVisibility: async () => {},
};

export const useSwipeTabVisibility = () => {
  const context = useContext(SwipeTabVisibilityContext);
  return context ?? defaultSwipeTabVisibility;
};
