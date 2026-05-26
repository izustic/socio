import ChatInput from "@/src/components/chat/ChatInput";
import MediaMessage from "@/src/components/chat/MediaMessage";
import MessageBubble from "@/src/components/chat/MessageBubble";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import {
  getCircle,
  getLatestCircleForParticipant,
} from "@/src/services/circle";
import {
  getMessages,
  sendMessage,
  subscribeToMessages,
} from "@/src/services/messages";
import { uploadChatMedia } from "@/src/services/supabase";
import { Circle, Message } from "@/src/types";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, MoreHorizontal, Phone } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MessageRow = {
  id: string;
  circle_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  media_url: string | null;
  media_type?: "image" | "video" | null;
  created_at: string;
};

const inferMediaType = (
  mediaUrl: string | null | undefined,
): "image" | "video" | null => {
  if (!mediaUrl) return null;
  const normalized = mediaUrl.toLowerCase();
  if (
    normalized.includes("/videos/") ||
    normalized.endsWith(".mp4") ||
    normalized.endsWith(".mov")
  ) {
    return "video";
  }
  if (
    normalized.includes("/images/") ||
    normalized.endsWith(".jpg") ||
    normalized.endsWith(".jpeg") ||
    normalized.endsWith(".png") ||
    normalized.endsWith(".webp")
  ) {
    return "image";
  }
  return null;
};

const rowToMessage = (row: MessageRow): Message => ({
  id: row.id,
  circleId: row.circle_id,
  senderId: row.sender_id,
  senderName: row.sender_name,
  text: row.text,
  mediaUrl: row.media_url,
  mediaType: row.media_type ?? inferMediaType(row.media_url),
  timestamp: new Date(row.created_at),
});

const getDisplayName = (
  profileName?: string,
  metadataName?: unknown,
  email?: string,
) => {
  if (profileName) return profileName;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }
  return email?.split("@")[0] || "Someone";
};

export default function CircleChatRoute() {
  const { user, profile } = useAuth();
  const params = useLocalSearchParams<{ circleId?: string }>();
  const listRef = useRef<FlatList<Message>>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const subscribedCircleId = circle?.id;

  useEffect(() => {
    let active = true;

    const loadCircle = async () => {
      if (!user) return;

      setLoading(true);
      const targetCircle = params.circleId
        ? await getCircle(String(params.circleId))
        : await getLatestCircleForParticipant(user.id);

      if (!active) return;
      setCircle(targetCircle);
      setLoading(false);
    };

    loadCircle();

    return () => {
      active = false;
    };
  }, [params.circleId, user]);

  useEffect(() => {
    let active = true;

    const loadMessages = async () => {
      if (!circle) {
        setMessages([]);
        return;
      }

      const history = await getMessages(circle.id);
      if (active) {
        setMessages(history);
      }
    };

    loadMessages();

    return () => {
      active = false;
    };
  }, [circle]);

  useEffect(() => {
    if (!subscribedCircleId) return;

    const channel = subscribeToMessages(subscribedCircleId, (payload) => {
      const incoming = rowToMessage(payload.new);
      setMessages((currentMessages) => {
        if (currentMessages.some((message) => message.id === incoming.id)) {
          return currentMessages;
        }
        return [...currentMessages, incoming];
      });
    });

    return () => {
      channel.unsubscribe();
    };
  }, [subscribedCircleId]);

  const handleSendMessage = async (text: string) => {
    if (!circle || !user || sending) return;

    setSending(true);
    try {
      const sentMessage = await sendMessage(
        circle.id,
        user.id,
        getDisplayName(profile?.name, user.user_metadata?.display_name, user.email),
        text,
      );
      setMessages((currentMessages) => {
        if (currentMessages.some((message) => message.id === sentMessage.id)) {
          return currentMessages;
        }
        return [...currentMessages, sentMessage];
      });
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Message not sent", "Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleMediaPress = async () => {
    if (!circle || !user || sending) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Media access needed", "Allow photo access to share media.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mediaType = asset.type === "video" ? "video" : "image";

    setSending(true);
    try {
      const mediaId = Crypto.randomUUID();
      const mediaUrl = await uploadChatMedia(circle.id, mediaId, asset.uri, mediaType);

      const sentMessage = await sendMessage(
        circle.id,
        user.id,
        getDisplayName(profile?.name, user.user_metadata?.display_name, user.email),
        "",
        mediaUrl,
        mediaType,
      );
      setMessages((currentMessages) => {
        if (currentMessages.some((message) => message.id === sentMessage.id)) {
          return currentMessages;
        }
        return [...currentMessages, sentMessage];
      });
    } catch (error) {
      console.error("Error sending media:", error);
      Alert.alert("Media not sent", "Please try a smaller file or choose another one.");
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;

    if (item.mediaUrl && item.mediaType) {
      return (
        <MediaMessage
          message={{
            id: item.id,
            type: item.mediaType,
            uri: item.mediaUrl,
            caption: item.text || undefined,
            senderId: item.senderId,
            senderName: item.senderName,
            timestamp: item.timestamp,
            isOwn,
          }}
        />
      );
    }

    return (
      <MessageBubble
        message={{
          id: item.id,
          text: item.text,
          senderId: item.senderId,
          senderName: item.senderName,
          timestamp: item.timestamp,
          isOwn,
        }}
      />
    );
  };

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
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <Text style={styles.title}>No active Circle</Text>
          <Text style={styles.emptyText}>Create or join a Circle to start chatting.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardView}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.76}
            style={styles.iconButton}
            onPress={() => router.replace("/(tabs)/home")}
            accessibilityLabel="Back to Circle"
          >
            <ChevronLeft size={24} color={Colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.title}>
              {circle.name}
            </Text>
            <Text style={styles.headerSubtitle}>
              {circle.members.length} members
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.76}
              style={styles.iconButton}
              onPress={() => router.push("/circle/call")}
            >
              <Phone size={20} color={Colors.textPrimary} strokeWidth={2.2} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.76} style={styles.iconButton}>
              <MoreHorizontal size={22} color={Colors.textPrimary} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContent}
          ListHeaderComponent={<Text style={styles.dayLabel}>Today</Text>}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Start the conversation.</Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <ChatInput
          disabled={sending}
          placeholder="Message Circle..."
          onMediaPress={handleMediaPress}
          onSendMessage={(text) => {
            void handleSendMessage(text);
          }}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.screenPadding,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.inputBg,
  },
  messagesContent: {
    flexGrow: 1,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  dayLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.screenPadding,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
