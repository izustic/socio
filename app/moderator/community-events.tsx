import Button from "@/src/components/ui/Button";
import {
  Colors,
  Radius,
  Spacing,
  Typography,
  createThemedStyles,
} from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import {
  getPendingCommunityEvents,
  reviewCommunityEvent,
} from "@/src/services/publicEvents";
import type { MeetupExperience } from "@/src/services/meetupPlanning";
import { router, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CommunityEventModerationScreen() {
  const { role } = useAuth();
  const [events, setEvents] = useState<MeetupExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    void getPendingCommunityEvents()
      .then(setEvents)
      .catch(() => Alert.alert("Couldn’t load events", "Please try again."))
      .finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);
  const decide = async (
    event: MeetupExperience,
    decision: "approved" | "rejected",
  ) => {
    try {
      await reviewCommunityEvent(event.id, decision);
      setEvents((current) => current.filter((item) => item.id !== event.id));
    } catch {
      Alert.alert("Review wasn’t saved", "Please try again.");
    }
  };
  if (role?.role === "user")
    return (
      <SafeAreaView style={styles.center}>
        <ShieldCheck size={38} color={Colors.primaryDark} />
        <Text style={styles.title}>Moderation access only</Text>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={21} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.kicker}>SAFETY REVIEW</Text>
          <Text style={styles.title}>Community events</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : events.length === 0 ? (
          <View style={styles.center}>
            <ShieldCheck size={42} color={Colors.success} />
            <Text style={styles.title}>You’re all caught up</Text>
            <Text style={styles.body}>
              New public events will appear here before they enter discovery.
            </Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.card}>
              <View style={styles.badge}>
                <Sparkles size={12} color={Colors.primaryDark} />
                <Text style={styles.badgeText}>Community event</Text>
              </View>
              <Text style={styles.cardTitle}>{event.title}</Text>
              <Text style={styles.body}>{event.description}</Text>
              <View style={styles.meta}>
                <CalendarDays size={16} color={Colors.textSecondary} />
                <Text style={styles.body}>
                  {event.startsAt
                    ? new Date(event.startsAt).toLocaleString()
                    : "Time unavailable"}
                </Text>
              </View>
              <View style={styles.meta}>
                <MapPin size={16} color={Colors.textSecondary} />
                <Text style={styles.body}>{event.location}</Text>
              </View>
              <View style={styles.actions}>
                <View style={styles.action}>
                  <Button
                    title="Reject"
                    variant="outline"
                    onPress={() => void decide(event, "rejected")}
                  />
                </View>
                <View style={styles.action}>
                  <Button
                    title="Approve"
                    onPress={() => void decide(event, "approved")}
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = createThemedStyles((Colors) => ({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: { ...Typography.label, color: Colors.primaryDark, fontSize: 10 },
  title: { ...Typography.h2 },
  content: { padding: Spacing.lg, gap: 12 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: Spacing.xl,
  },
  body: { ...Typography.bodySmall },
  card: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    gap: 9,
  },
  cardTitle: { ...Typography.h3 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: Colors.warningSurface,
    borderRadius: Radius.pill,
  },
  badgeText: { ...Typography.label, color: Colors.primaryDark, fontSize: 9 },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  action: { flex: 1 },
}));
