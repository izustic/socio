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
import { Audio, Video, ResizeMode } from "expo-av";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Download, MoreHorizontal, Phone, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PendingAttachment = {
  id: string;
  uri: string;
  type: "image";
};

type ReplyTarget = {
  messageId: string;
  senderName: string;
  text: string;
  mediaType?: "image" | "video" | "audio" | null;
};

type OpenMedia = {
  uri: string;
  type: "image" | "video";
};

type MessageRow = {
  id: string;
  circle_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  media_url: string | null;
  media_urls?: string[] | null;
  media_type?: "image" | "video" | "audio" | null;
  reply_to_message_id?: string | null;
  reply_to_sender_name?: string | null;
  reply_to_text?: string | null;
  reply_to_media_type?: "image" | "video" | "audio" | null;
  created_at: string;
};

const inferMediaType = (
  mediaUrl: string | null | undefined,
): "image" | "video" | "audio" | null => {
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
    normalized.includes("/audios/") ||
    normalized.endsWith(".m4a") ||
    normalized.endsWith(".mp3") ||
    normalized.endsWith(".aac")
  ) {
    return "audio";
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
  mediaUrls: row.media_urls?.length ? row.media_urls : row.media_url ? [row.media_url] : [],
  mediaType: row.media_type ?? inferMediaType(row.media_url),
  replyTo: row.reply_to_message_id
    ? {
        messageId: row.reply_to_message_id,
        senderName: row.reply_to_sender_name ?? "Someone",
        text: row.reply_to_text ?? "",
        mediaType: row.reply_to_media_type ?? null,
      }
    : null,
  timestamp: new Date(row.created_at),
});

const getReplyText = (message: Message) => {
  if (message.text.trim()) return message.text.trim();
  if (message.mediaType === "image") {
    const count = message.mediaUrls?.length ?? (message.mediaUrl ? 1 : 0);
    return count > 1 ? `${count} photos` : "Photo";
  }
  if (message.mediaType === "video") return "Video";
  if (message.mediaType === "audio") return "Voice message";
  return "Message";
};

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
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [pendingAudio, setPendingAudio] = useState<{ uri: string; durationMillis?: number } | null>(null);
  const [recordingDurationMillis, setRecordingDurationMillis] = useState(0);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [openMedia, setOpenMedia] = useState<OpenMedia | null>(null);
  const [savingMedia, setSavingMedia] = useState(false);
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

  useEffect(() => {
    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
    };
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!circle || !user || sending) return;
    if (!text.trim() && pendingAttachments.length === 0 && !pendingAudio) return;

    setSending(true);
    try {
      if (pendingAudio) {
        const audioPath = await uploadChatMedia(
          circle.id,
          Crypto.randomUUID(),
          pendingAudio.uri,
          "audio",
        );

        const sentMessage = await sendMessage(
          circle.id,
          user.id,
          getDisplayName(profile?.name, user.user_metadata?.display_name, user.email),
          text,
          audioPath,
          "audio",
          [audioPath],
          replyTo,
        );
        setMessages((currentMessages) => {
          if (currentMessages.some((message) => message.id === sentMessage.id)) {
            return currentMessages;
          }
          return [...currentMessages, sentMessage];
        });
        setPendingAudio(null);
        setReplyTo(null);
        return;
      }

      if (pendingAttachments.length > 0) {
        const mediaPaths = await Promise.all(
          pendingAttachments.map((attachment, index) =>
            uploadChatMedia(
              circle.id,
              `${Crypto.randomUUID()}-${index}`,
              attachment.uri,
              attachment.type,
            ),
          ),
        );

        const sentMessage = await sendMessage(
          circle.id,
          user.id,
          getDisplayName(profile?.name, user.user_metadata?.display_name, user.email),
          text,
          mediaPaths[0],
          "image",
          mediaPaths,
          replyTo,
        );
        setMessages((currentMessages) => {
          if (currentMessages.some((message) => message.id === sentMessage.id)) {
            return currentMessages;
          }
          return [...currentMessages, sentMessage];
        });
        setPendingAttachments([]);
        setReplyTo(null);
        return;
      }

      const sentMessage = await sendMessage(
        circle.id,
        user.id,
        getDisplayName(profile?.name, user.user_metadata?.display_name, user.email),
        text,
        undefined,
        undefined,
        undefined,
        replyTo,
      );
      setMessages((currentMessages) => {
        if (currentMessages.some((message) => message.id === sentMessage.id)) {
          return currentMessages;
        }
        return [...currentMessages, sentMessage];
      });
      setReplyTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Message not sent", "Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleMediaPress = async () => {
    if (!circle || !user || sending || recordingAudio || pendingAudio) return;
    if (pendingAttachments.length >= 10) {
      Alert.alert("Limit reached", "Send or remove some images before adding more.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Media access needed", "Allow photo access to share media.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 10 - pendingAttachments.length),
      orderedSelection: true,
    });

    if (result.canceled || !result.assets?.length) return;

    setPendingAttachments((currentAttachments) => {
      const openSlots = Math.max(0, 10 - currentAttachments.length);
      const selectedAttachments = result.assets
        .filter((asset) => asset.type !== "video")
        .slice(0, openSlots)
        .map((asset) => ({
          id: Crypto.randomUUID(),
          uri: asset.uri,
          type: "image" as const,
        }));

      return [...currentAttachments, ...selectedAttachments];
    });
  };

  const handleStartRecording = async () => {
    if (sending || recordingAudio || pendingAudio || pendingAttachments.length > 0) return;

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Microphone needed", "Allow microphone access to record voice messages.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording) {
            setRecordingDurationMillis(status.durationMillis ?? 0);
          }
        },
        250,
      );

      recordingRef.current = recording;
      setRecordingDurationMillis(0);
      setRecordingAudio(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      Alert.alert("Could not record", "Please try again.");
      setRecordingAudio(false);
      recordingRef.current = null;
    }
  };

  const handleStopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      const recording = recordingRef.current;
      recordingRef.current = null;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      setRecordingAudio(false);
      setPendingAudio(
        uri
          ? {
              uri,
              durationMillis: status.durationMillis ?? recordingDurationMillis,
            }
          : null,
      );
    } catch (error) {
      console.error("Error stopping recording:", error);
      Alert.alert("Recording failed", "Please try recording again.");
      setRecordingAudio(false);
      recordingRef.current = null;
    }
  };

  const handleDiscardAudio = () => {
    setPendingAudio(null);
    setRecordingDurationMillis(0);
  };

  const handleReplyPress = (messageId: string) => {
    const targetIndex = messages.findIndex((message) => message.id === messageId);

    if (targetIndex < 0) {
      Alert.alert("Original message unavailable", "That message is not loaded in this chat.");
      return;
    }

    listRef.current?.scrollToIndex({
      index: targetIndex,
      animated: true,
      viewPosition: 0.45,
    });
    setHighlightedMessageId(messageId);
    setTimeout(() => setHighlightedMessageId(null), 1400);
  };

  const getMediaFileName = (media: OpenMedia) => {
    const urlPath = media.uri.split("?")[0];
    const existingName = urlPath.split("/").pop();
    if (existingName && existingName.includes(".")) return existingName;

    const extension = media.type === "image" ? "jpg" : "mp4";
    return `socio-${Date.now()}.${extension}`;
  };

  const handleSaveOpenMedia = async () => {
    if (!openMedia || savingMedia) return;

    setSavingMedia(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Allow photo access to save this media.");
        return;
      }

      const fileName = getMediaFileName(openMedia);
      const destination = `${FileSystem.cacheDirectory}${fileName}`;
      const downloaded = await FileSystem.downloadAsync(openMedia.uri, destination);
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);
      Alert.alert("Saved", openMedia.type === "image" ? "Photo saved to your library." : "Video saved to your library.");
    } catch (error) {
      console.error("Error saving media:", error);
      Alert.alert("Could not save", "Please try again.");
    } finally {
      setSavingMedia(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
    const highlighted = highlightedMessageId === item.id;
    const selectReply = () => {
      setReplyTo({
        messageId: item.id,
        senderName: item.senderName,
        text: getReplyText(item),
        mediaType: item.mediaType ?? null,
      });
    };

    if ((item.mediaUrls && item.mediaUrls.length > 0) || (item.mediaUrl && item.mediaType)) {
      return (
        <MediaMessage
          onLongPress={selectReply}
          onReplyPress={handleReplyPress}
          highlighted={highlighted}
          onImagePress={(uri) => setOpenMedia({ uri, type: "image" })}
          onVideoPress={(uri) => setOpenMedia({ uri, type: "video" })}
          message={{
            id: item.id,
            type: item.mediaType ?? "image",
            uri: item.mediaUrls?.[0] ?? item.mediaUrl ?? "",
            uris: item.mediaUrls?.length ? item.mediaUrls : item.mediaUrl ? [item.mediaUrl] : [],
            caption: item.text || undefined,
            senderId: item.senderId,
            senderName: item.senderName,
            timestamp: item.timestamp,
            isOwn,
            replyTo: item.replyTo,
          }}
        />
      );
    }

    return (
      <MessageBubble
        onLongPress={selectReply}
        onReplyPress={handleReplyPress}
        highlighted={highlighted}
        message={{
          id: item.id,
          text: item.text,
          senderId: item.senderId,
          senderName: item.senderName,
          timestamp: item.timestamp,
          isOwn,
          replyTo: item.replyTo,
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
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({
              offset: Math.max(0, info.averageItemLength * info.index),
              animated: true,
            });
            setTimeout(() => {
              listRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.45,
              });
            }, 250);
          }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <ChatInput
          disabled={sending}
          placeholder="Message Circle..."
          attachments={pendingAttachments}
          audioPreview={pendingAudio}
          isRecordingAudio={recordingAudio}
          recordingDurationMillis={recordingDurationMillis}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onRemoveAttachment={(attachmentId) => {
            setPendingAttachments((currentAttachments) =>
              currentAttachments.filter((attachment) => attachment.id !== attachmentId),
            );
          }}
          onMediaPress={handleMediaPress}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onDiscardAudio={handleDiscardAudio}
          onSendMessage={(text) => {
            void handleSendMessage(text);
          }}
        />

        <Modal
          visible={Boolean(openMedia)}
          animationType="fade"
          transparent={false}
          onRequestClose={() => setOpenMedia(null)}
        >
          <SafeAreaView style={styles.mediaViewer}>
            <StatusBar barStyle="light-content" />
            <View style={styles.mediaViewerHeader}>
              <TouchableOpacity
                activeOpacity={0.76}
                style={styles.viewerButton}
                onPress={() => setOpenMedia(null)}
                accessibilityLabel="Close media viewer"
              >
                <X size={24} color={Colors.white} strokeWidth={2.3} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.76}
                style={[styles.viewerButton, savingMedia && styles.viewerButtonDisabled]}
                onPress={handleSaveOpenMedia}
                disabled={savingMedia}
                accessibilityLabel="Save media"
              >
                {savingMedia ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Download size={22} color={Colors.white} strokeWidth={2.3} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.mediaViewerBody}>
              {openMedia?.type === "image" ? (
                <Image
                  source={{ uri: openMedia.uri }}
                  style={styles.fullImage}
                  contentFit="contain"
                />
              ) : openMedia?.type === "video" ? (
                <Video
                  source={{ uri: openMedia.uri }}
                  style={styles.fullVideo}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  shouldPlay
                />
              ) : null}
            </View>
          </SafeAreaView>
        </Modal>
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
  mediaViewer: {
    flex: 1,
    backgroundColor: "#000",
  },
  mediaViewerHeader: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
  },
  viewerButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  viewerButtonDisabled: {
    opacity: 0.6,
  },
  mediaViewerBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  fullVideo: {
    width: "100%",
    height: "100%",
  },
});
