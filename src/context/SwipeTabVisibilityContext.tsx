import { useAuth } from "@/src/context/AuthContext";
import { getAppTabVisibility } from "@/src/services/circle";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface SwipeTabVisibilityContextType {
  swipeTabVisible: boolean;
  circleTabVisible: boolean;
  joinBrowsingActive: boolean;
  loading: boolean;
  refreshSwipeTabVisibility: (options?: {
    silent?: boolean;
  }) => Promise<void>;
  startJoinBrowsing: () => void;
  endJoinBrowsing: () => void;
}

const SwipeTabVisibilityContext =
  createContext<SwipeTabVisibilityContextType | undefined>(undefined);

export const SwipeTabVisibilityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, loading: authLoading } = useAuth();
  const [swipeTabVisible, setSwipeTabVisible] = useState(false);
  const [circleTabVisible, setCircleTabVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [joinBrowsingActive, setJoinBrowsingActive] = useState(false);

  const refreshSwipeTabVisibility = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (authLoading) return;

      if (!user) {
        setJoinBrowsingActive(false);
        setSwipeTabVisible(false);
        setCircleTabVisible(true);
        if (!silent) {
          setLoading(false);
        }
        return;
      }

      if (!silent) {
        setLoading(true);
      }
      try {
        const visibility = await getAppTabVisibility(user.id, {
          joinBrowsingActive,
        });
        setSwipeTabVisible(visibility.swipeTabVisible);
        setCircleTabVisible(visibility.circleTabVisible);
      } catch (error) {
        console.error("Error checking swipe tab visibility:", error);
        setSwipeTabVisible(joinBrowsingActive);
        setCircleTabVisible(!joinBrowsingActive);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [authLoading, joinBrowsingActive, user],
  );

  const startJoinBrowsing = useCallback(() => {
    setJoinBrowsingActive(true);
  }, []);

  const endJoinBrowsing = useCallback(() => {
    setJoinBrowsingActive(false);
  }, []);

  useEffect(() => {
    refreshSwipeTabVisibility();
  }, [refreshSwipeTabVisibility]);

  return (
    <SwipeTabVisibilityContext.Provider
      value={{
        swipeTabVisible,
        circleTabVisible,
        joinBrowsingActive,
        loading,
        refreshSwipeTabVisibility,
        startJoinBrowsing,
        endJoinBrowsing,
      }}
    >
      {children}
    </SwipeTabVisibilityContext.Provider>
  );
};

const defaultSwipeTabVisibility: SwipeTabVisibilityContextType = {
  swipeTabVisible: false,
  circleTabVisible: true,
  joinBrowsingActive: false,
  loading: false,
  refreshSwipeTabVisibility: async () => {},
  startJoinBrowsing: () => {},
  endJoinBrowsing: () => {},
};

export const useSwipeTabVisibility = () => {
  const context = useContext(SwipeTabVisibilityContext);
  return context ?? defaultSwipeTabVisibility;
};
