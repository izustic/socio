import { Colors, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import {
  AppNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
  subscribeToNotifications,
} from "@/src/services/notifications";
import { router, useFocusEffect } from "expo-router";
import {
  CheckCircle2,
  Clock3,
  Heart,
  MessageCircle,
  Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const formatTime = (createdAt: string) => {
  const created = new Date(createdAt);
  const diffMs = Date.now() - created.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d`;

  return created.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const getNotificationStyle = (type: AppNotification["type"]) => {
  switch (type) {
    case "circle_complete":
      return {
        icon: CheckCircle2,
        iconColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
      };
    case "circle_almost_full":
      return {
        icon: Users,
        iconColor: Colors.textPrimary,
        backgroundColor: "#F7F7F7",
      };
    case "circle_accepted":
    case "circle_invite":
      return {
        icon: Heart,
        iconColor: "#FF6B2C",
        backgroundColor: "#FFF1EA",
      };
    case "message":
      return {
        icon: MessageCircle,
        iconColor: Colors.textPrimary,
        backgroundColor: "#F7F7F7",
      };
    case "system":
    default:
      return {
        icon: Clock3,
        iconColor: Colors.textPrimary,
        backgroundColor: "#F7F7F7",
      };
  }
};

const getNotificationRoute = (notification: AppNotification) => {
  const circleId =
    typeof notification.data?.circleId === "string"
      ? notification.data.circleId
      : undefined;

  switch (notification.type) {
    case "circle_complete":
      return circleId
        ? `/(tabs)/home?circleView=complete&circleId=${circleId}`
        : "/(tabs)/home?circleView=complete";
    case "message":
      return circleId
        ? `/(tabs)/home?circleView=chat&circleId=${circleId}`
        : "/(tabs)/home?circleView=chat";
    case "circle_invite":
      return "/(tabs)/swipe";
    case "circle_accepted":
    case "circle_almost_full":
      return circleId
        ? `/(tabs)/home?circleView=progress&circleId=${circleId}`
        : "/(tabs)/home?circleView=progress";
    default:
      return null;
  }
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const loadNotifications = useCallback(
    async (showRefresh = false) => {
      if (!user) {
        setNotifications([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const nextNotifications = await getNotifications(user.id);
      setNotifications(nextNotifications);
      setLoading(false);
      setRefreshing(false);
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  useEffect(() => {
    if (!user) return;

    const channel = subscribeToNotifications(user.id, (payload) => {
      if (payload.eventType === "INSERT" && payload.new) {
        const incoming = payload.new;
        setNotifications((current) => {
          if (current.some((item) => item.id === incoming.id)) {
            return current;
          }
          return [incoming, ...current].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        });
        return;
      }

      if (payload.eventType === "UPDATE" && payload.new) {
        const updated = payload.new;
        setNotifications((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        return;
      }

      if (payload.eventType === "DELETE" && payload.old?.id) {
        const deletedId = payload.old.id;
        setNotifications((current) =>
          current.filter((item) => item.id !== deletedId),
        );
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const handleMarkAll = async () => {
    if (!user || unreadCount === 0) return;

    const previous = notifications;
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );

    try {
      await markAllAsRead(user.id);
    } catch {
      setNotifications(previous);
    }
  };

  const handlePressNotification = async (notification: AppNotification) => {
    if (!notification.read) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );
      markAsRead(notification.id).catch(() => {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, read: false } : item,
          ),
        );
      });
    }

    const route = getNotificationRoute(notification);
    if (route) {
      router.push(route as any);
    }
  };

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const style = getNotificationStyle(item.type);
    const Icon = style.icon;

    return (
      <TouchableOpacity
        style={styles.notificationRow}
        activeOpacity={0.74}
        onPress={() => handlePressNotification(item)}
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: style.backgroundColor },
          ]}
        >
          <Icon size={20} color={style.iconColor} strokeWidth={2.2} />
        </View>

        <View style={styles.notificationCopy}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.body}
          </Text>
        </View>

        <View style={styles.meta}>
          <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={unreadCount === 0}
          onPress={handleMarkAll}
          style={styles.markAllButton}
        >
          <Text
            style={[
              styles.markAllText,
              unreadCount === 0 && styles.markAllDisabled,
            ]}
          >
            Mark all
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.emptyContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={Colors.primary}
              onRefresh={() => loadNotifications(true)}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Clock3 size={22} color={Colors.textPrimary} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle}>No alerts yet</Text>
              <Text style={styles.emptyText}>
                Circle updates, matches, and messages will show up here.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 46,
    paddingTop: 58,
    paddingBottom: 28,
  },
  title: {
    ...Typography.h2,
    fontSize: 22,
    fontWeight: "800",
    color: "#111111",
  },
  markAllButton: {
    minHeight: 32,
    justifyContent: "center",
  },
  markAllText: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  markAllDisabled: {
    color: Colors.textDisabled,
  },
  listContent: {
    paddingHorizontal: 46,
    paddingBottom: 120,
  },
  notificationRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 72,
    paddingVertical: 10,
  },
  iconCircle: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginRight: 12,
    width: 44,
  },
  notificationCopy: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  notificationTitle: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  notificationBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 1,
  },
  meta: {
    alignItems: "flex-end",
    alignSelf: "stretch",
    justifyContent: "center",
    marginLeft: 10,
    minWidth: 42,
  },
  timeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  unreadDot: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    height: 7,
    marginTop: 8,
    width: 7,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingBottom: 80,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginBottom: Spacing.md,
    width: 48,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    maxWidth: 260,
    textAlign: "center",
  },
});
