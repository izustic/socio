import ChatInput from "@/src/components/chat/ChatInput";
import MediaMessage from "@/src/components/chat/MediaMessage";
import MessageBubble from "@/src/components/chat/MessageBubble";
import { PollCreator, PollMessage } from "@/src/components/chat/PollComponents";

import type { PollData } from "@/src/components/chat/PollComponents";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useSwipeTabVisibility } from "@/src/context/SwipeTabVisibilityContext";
import {
  getCircle,
  getLatestCircleForParticipant,
  closeCircle,
  removeMember,
} from "@/src/services/circle";
import {
  getMessages,
  sendMessage,
  subscribeToMessages,
} from "@/src/services/messages";
import {
  addPollVote,
  createPoll,
  getPollById,
  getPollsByIds,
} from "@/src/services/polls";
import { uploadChatMedia } from "@/src/services/supabase";
import { Circle, Message } from "@/src/types";
import { hasMeetupDeadlineElapsed } from "@/src/utils/circleDeadline";
import { Audio, ResizeMode, Video } from "expo-av";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import {
  ChartBarBig,
  ChevronRight,
  ChevronLeft,
  Download,
  GalleryHorizontal,
  Info,
  LogOut,
  MoreHorizontal,
  Phone,
  Search,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  TextInput,
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
  mediaUrls: row.media_urls?.length
    ? row.media_urls
    : row.media_url
      ? [row.media_url]
      : [],
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

const getMessageSearchText = (message: Message) => {
  if (message.text.startsWith("__poll__:")) return "Poll";
  return [message.senderName, message.text, message.replyTo?.text]
    .filter(Boolean)
    .join(" ");
};

export default function CircleChatRoute() {
  const { user, profile } = useAuth();
  const { endJoinBrowsing, refreshSwipeTabVisibility } = useSwipeTabVisibility();
  const params = useLocalSearchParams<{ circleId?: string }>();
  const listRef = useRef<FlatList<Message>>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [pendingAudio, setPendingAudio] = useState<{
    uri: string;
    durationMillis?: number;
  } | null>(null);
  const [recordingDurationMillis, setRecordingDurationMillis] = useState(0);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const [openMedia, setOpenMedia] = useState<OpenMedia | null>(null);
  const [savingMedia, setSavingMedia] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachmentSheetVisible, setAttachmentSheetVisible] = useState(false);
  const subscribedCircleId = circle?.id;
  const [pollCreatorVisible, setPollCreatorVisible] = useState(false);
  const [polls, setPolls] = useState<Record<string, PollData>>({});
  const [chatMenuVisible, setChatMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(Date.now());

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return messages.slice(-12).reverse();

    return messages
      .filter((message) =>
        getMessageSearchText(message).toLowerCase().includes(query),
      )
      .reverse();
  }, [messages, searchQuery]);
  const canLeaveCircle = Boolean(
    circle &&
      user &&
      circle.creatorId !== user.id &&
      hasMeetupDeadlineElapsed(circle, now),
  );
  const canCloseCircle = Boolean(
    circle &&
      user &&
      circle.creatorId === user.id &&
      hasMeetupDeadlineElapsed(circle, now),
  );

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

      const pollId =
        incoming.pollId ??
        (incoming.text.startsWith("__poll__:")
          ? incoming.text.replace("__poll__:", "")
          : null);

      if (pollId) {
        void (async () => {
          const poll = await getPollById(pollId);
          if (poll) {
            setPolls((prev) => ({ ...prev, [poll.id]: poll }));
          }
        })();
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [subscribedCircleId]);

  useEffect(() => {
    const loadPollsForMessages = async () => {
      const messagePollIds = messages.reduce<string[]>((acc, message) => {
        const referencedPollId =
          message.pollId ??
          (message.text.startsWith("__poll__:")
            ? message.text.replace("__poll__:", "")
            : null);

        if (referencedPollId && !acc.includes(referencedPollId)) {
          acc.push(referencedPollId);
        }
        return acc;
      }, []);

      const missingPollIds = messagePollIds.filter((id) => !polls[id]);
      if (missingPollIds.length === 0) return;

      const loadedPolls = await getPollsByIds(missingPollIds);
      if (loadedPolls.length > 0) {
        setPolls((prev) => ({
          ...prev,
          ...Object.fromEntries(loadedPolls.map((poll) => [poll.id, poll])),
        }));
      }
    };

    if (messages.length > 0) {
      void loadPollsForMessages();
    }
  }, [messages, polls]);

  useEffect(() => {
    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (!circle) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [circle]);

  const handleSendMessage = async (text: string) => {
    if (!circle || !user || sending) return;
    if (!text.trim() && pendingAttachments.length === 0 && !pendingAudio)
      return;

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
          getDisplayName(
            profile?.name,
            user.user_metadata?.display_name,
            user.email,
          ),
          text,
          audioPath,
          "audio",
          [audioPath],
          replyTo,
        );
        setMessages((currentMessages) => {
          if (
            currentMessages.some((message) => message.id === sentMessage.id)
          ) {
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
          getDisplayName(
            profile?.name,
            user.user_metadata?.display_name,
            user.email,
          ),
          text,
          mediaPaths[0],
          "image",
          mediaPaths,
          replyTo,
        );
        setMessages((currentMessages) => {
          if (
            currentMessages.some((message) => message.id === sentMessage.id)
          ) {
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
        getDisplayName(
          profile?.name,
          user.user_metadata?.display_name,
          user.email,
        ),
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
  const handleCreatePoll = async (
    pollData: Omit<PollData, "id" | "createdAt">,
  ) => {
    if (!circle || !user || sending) return;

    setSending(true);
    try {
      const poll = await createPoll(circle.id, pollData);
      setPolls((prev) => ({ ...prev, [poll.id]: poll }));

      const sentMessage = await sendMessage(
        circle.id,
        user.id,
        getDisplayName(
          profile?.name,
          user.user_metadata?.display_name,
          user.email,
        ),
        `__poll__:${poll.id}`,
        undefined,
        undefined,
        undefined,
        replyTo,
        poll.id,
      );

      setMessages((curr) =>
        curr.some((m) => m.id === sentMessage.id)
          ? curr
          : [...curr, sentMessage],
      );
      setReplyTo(null);
    } catch (error) {
      console.error("Error creating poll:", error);
      Alert.alert("Poll not created", "Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVote = async (pollId: string, optionIds: string[]) => {
    if (!user) return;

    try {
      const updatedPoll = await addPollVote(pollId, optionIds, user.id);
      setPolls((prev) => ({ ...prev, [updatedPoll.id]: updatedPoll }));
    } catch (error) {
      console.error("Error submitting vote:", error);
      Alert.alert("Vote failed", "Please try again.");
    }
  };

  const openMediaPicker = async () => {
    if (!circle || !user || sending || recordingAudio || pendingAudio) return;
    if (pendingAttachments.length >= 10) {
      Alert.alert(
        "Limit reached",
        "Send or remove some images before adding more.",
      );
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

    setPendingAttachments((curr) => {
      const openSlots = Math.max(0, 10 - curr.length);
      return [
        ...curr,
        ...result.assets
          .filter((a) => a.type !== "video")
          .slice(0, openSlots)
          .map((a) => ({
            id: Crypto.randomUUID(),
            uri: a.uri,
            type: "image" as const,
          })),
      ];
    });
  };

  const handleMediaPress = () => {
    if (!circle || !user || sending || recordingAudio || pendingAudio) return;
    setAttachmentSheetVisible(true);
  };

  const closeAttachmentSheet = () => setAttachmentSheetVisible(false);

  const handleOpenPoll = () => {
    closeAttachmentSheet();
    setPollCreatorVisible(true);
  };

  const handleOpenGallery = async () => {
    closeAttachmentSheet();
    await openMediaPicker();
  };
  const handleStartRecording = async () => {
    if (
      sending ||
      recordingAudio ||
      pendingAudio ||
      pendingAttachments.length > 0
    )
      return;

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone needed",
          "Allow microphone access to record voice messages.",
        );
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
    const targetIndex = messages.findIndex(
      (message) => message.id === messageId,
    );

    if (targetIndex < 0) {
      Alert.alert(
        "Original message unavailable",
        "That message is not loaded in this chat.",
      );
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

  const jumpToMessage = (messageId: string) => {
    const targetIndex = messages.findIndex((message) => message.id === messageId);
    if (targetIndex < 0) return;

    setSearchVisible(false);
    setSearchQuery("");
    listRef.current?.scrollToIndex({
      index: targetIndex,
      animated: true,
      viewPosition: 0.45,
    });
    setHighlightedMessageId(messageId);
    setTimeout(() => setHighlightedMessageId(null), 1400);
  };

  const openConversationSearch = () => {
    setChatMenuVisible(false);
    setSearchVisible(true);
  };

  const openCircleInfo = () => {
    if (!circle) return;
    setChatMenuVisible(false);
    router.push({
      pathname: "/circle/info",
      params: {
        circleId: circle.id,
      },
    });
  };

  const confirmLeaveCircle = () => {
    if (!circle || !user || !canLeaveCircle) return;

    setChatMenuVisible(false);
    Alert.alert(
      "Leave Circle?",
      `You will leave ${circle.name} and lose access to its chat.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMember(circle.id, user.id);
              endJoinBrowsing();
              await refreshSwipeTabVisibility({ silent: true });
              router.replace("/(tabs)/home");
            } catch (error) {
              console.error("Error leaving circle:", error);
              Alert.alert("Could not leave Circle", "Please try again.");
            }
          },
        },
      ],
    );
  };

  const confirmCloseCircle = () => {
    if (!circle || !user || !canCloseCircle) return;

    setChatMenuVisible(false);
    Alert.alert(
      "Close Circle?",
      `This will delete ${circle.name} and remove everyone from the Circle. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Circle",
          style: "destructive",
          onPress: async () => {
            try {
              await closeCircle(circle.id);
              endJoinBrowsing();
              await refreshSwipeTabVisibility({ silent: true });
              router.replace("/(tabs)/home");
            } catch (error) {
              console.error("Error closing circle:", error);
              Alert.alert("Could not close Circle", "Please try again.");
            }
          },
        },
      ],
    );
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
        Alert.alert(
          "Permission needed",
          "Allow photo access to save this media.",
        );
        return;
      }

      const fileName = getMediaFileName(openMedia);
      const destination = `${FileSystem.cacheDirectory}${fileName}`;
      const downloaded = await FileSystem.downloadAsync(
        openMedia.uri,
        destination,
      );
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);
      Alert.alert(
        "Saved",
        openMedia.type === "image"
          ? "Photo saved to your library."
          : "Video saved to your library.",
      );
    } catch (error) {
      console.error("Error saving media:", error);
      Alert.alert("Could not save", "Please try again.");
    } finally {
      setSavingMedia(false);
    }
  };

  // const renderMessage = ({ item }: { item: Message }) => {
  //   const isOwn = item.senderId === user?.id;
  //   const highlighted = highlightedMessageId === item.id;
  //   const selectReply = () => {
  //     setReplyTo({
  //       messageId: item.id,
  //       senderName: item.senderName,
  //       text: getReplyText(item),
  //       mediaType: item.mediaType ?? null,
  //     });
  //   };

  //   if ((item.mediaUrls && item.mediaUrls.length > 0) || (item.mediaUrl && item.mediaType)) {
  //     return (
  //       <MediaMessage
  //         onLongPress={selectReply}
  //         onReplyPress={handleReplyPress}
  //         highlighted={highlighted}
  //         onImagePress={(uri) => setOpenMedia({ uri, type: "image" })}
  //         onVideoPress={(uri) => setOpenMedia({ uri, type: "video" })}
  //         message={{
  //           id: item.id,
  //           type: item.mediaType ?? "image",
  //           uri: item.mediaUrls?.[0] ?? item.mediaUrl ?? "",
  //           uris: item.mediaUrls?.length ? item.mediaUrls : item.mediaUrl ? [item.mediaUrl] : [],
  //           caption: item.text || undefined,
  //           senderId: item.senderId,
  //           senderName: item.senderName,
  //           timestamp: item.timestamp,
  //           isOwn,
  //           replyTo: item.replyTo,
  //         }}
  //       />
  //     );
  //   }

  //   return (
  //     <MessageBubble
  //       onLongPress={selectReply}
  //       onReplyPress={handleReplyPress}
  //       highlighted={highlighted}
  //       message={{
  //         id: item.id,
  //         text: item.text,
  //         senderId: item.senderId,
  //         senderName: item.senderName,
  //         timestamp: item.timestamp,
  //         isOwn,
  //         replyTo: item.replyTo,
  //       }}
  //     />
  //   );
  // };
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

    // poll message
    if (item.text.startsWith("__poll__:")) {
      const pollId = item.text.replace("__poll__:", "");
      const poll = polls[pollId];
      if (!poll) return null;
      return (
        <View
          style={[
            { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
            isOwn ? { alignItems: "flex-end" } : { alignItems: "flex-start" },
          ]}
        >
          <PollMessage
            poll={poll}
            currentUserId={user?.id ?? ""}
            onVote={handleVote}
            isOwn={isOwn}
          />
        </View>
      );
    }

    // existing media / text rendering unchanged below...
    if (
      (item.mediaUrls && item.mediaUrls.length > 0) ||
      (item.mediaUrl && item.mediaType)
    ) {
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
            uris: item.mediaUrls?.length
              ? item.mediaUrls
              : item.mediaUrl
                ? [item.mediaUrl]
                : [],
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
          <Text style={styles.emptyText}>
            Create or join a Circle to start chatting.
          </Text>
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
            <ChevronLeft
              size={24}
              color={Colors.textPrimary}
              strokeWidth={2.2}
            />
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
              onPress={() =>
                router.push({
                  pathname: "/circle/call",
                  params: {
                    circleId: circle?.id,
                    circleName: circle?.name,
                  },
                })
              }
            >
              <Phone size={20} color={Colors.textPrimary} strokeWidth={2.2} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.76}
              style={styles.iconButton}
              onPress={() => setChatMenuVisible(true)}
              accessibilityLabel="Open chat menu"
            >
              <MoreHorizontal
                size={22}
                color={Colors.textPrimary}
                strokeWidth={2.2}
              />
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
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
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
              currentAttachments.filter(
                (attachment) => attachment.id !== attachmentId,
              ),
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
          visible={chatMenuVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setChatMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setChatMenuVisible(false)}
          >
            <View style={styles.chatMenu}>
              <TouchableOpacity
                activeOpacity={0.76}
                style={styles.menuItem}
                onPress={openConversationSearch}
              >
                <Search size={20} color={Colors.textPrimary} strokeWidth={2.1} />
                <Text style={styles.menuText}>Search in conversation</Text>
                <ChevronRight
                  size={18}
                  color={Colors.textSecondary}
                  strokeWidth={2.1}
                />
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                activeOpacity={0.76}
                style={styles.menuItem}
                onPress={openCircleInfo}
              >
                <Info size={20} color={Colors.textPrimary} strokeWidth={2.1} />
                <Text style={styles.menuText}>Circle info</Text>
                <ChevronRight
                  size={18}
                  color={Colors.textSecondary}
                  strokeWidth={2.1}
                />
              </TouchableOpacity>
              {canLeaveCircle && (
                <>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity
                    activeOpacity={0.76}
                    style={styles.menuItem}
                    onPress={confirmLeaveCircle}
                  >
                    <LogOut
                      size={20}
                      color={Colors.danger}
                      strokeWidth={2.1}
                    />
                    <Text style={[styles.menuText, styles.menuTextDanger]}>
                      Leave Circle
                    </Text>
                    <ChevronRight
                      size={18}
                      color={Colors.textSecondary}
                      strokeWidth={2.1}
                    />
                  </TouchableOpacity>
                </>
              )}
              {canCloseCircle && (
                <>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity
                    activeOpacity={0.76}
                    style={styles.menuItem}
                    onPress={confirmCloseCircle}
                  >
                    <Trash2
                      size={20}
                      color={Colors.danger}
                      strokeWidth={2.1}
                    />
                    <Text style={[styles.menuText, styles.menuTextDanger]}>
                      Close Circle
                    </Text>
                    <ChevronRight
                      size={18}
                      color={Colors.textSecondary}
                      strokeWidth={2.1}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={searchVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => {
            setSearchVisible(false);
            setSearchQuery("");
          }}
        >
          <SafeAreaView style={styles.searchContainer}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.searchHeader}>
              <TouchableOpacity
                activeOpacity={0.76}
                style={styles.iconButton}
                onPress={() => {
                  setSearchVisible(false);
                  setSearchQuery("");
                }}
                accessibilityLabel="Close search"
              >
                <ChevronLeft
                  size={24}
                  color={Colors.textPrimary}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>
              <View style={styles.searchInputWrap}>
                <Search
                  size={18}
                  color={Colors.textSecondary}
                  strokeWidth={2.1}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search conversation"
                  placeholderTextColor={Colors.textDisabled}
                  autoFocus
                  style={styles.searchInput}
                  returnKeyType="search"
                />
              </View>
            </View>

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.searchResultsContent}
              ListHeaderComponent={
                <Text style={styles.searchCount}>
                  {searchQuery.trim()
                    ? `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`
                    : "Recent messages"}
                </Text>
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No messages found.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.76}
                  style={styles.searchResult}
                  onPress={() => jumpToMessage(item.id)}
                >
                  <View style={styles.searchResultCopy}>
                    <Text numberOfLines={1} style={styles.searchResultSender}>
                      {item.senderId === user?.id ? "You" : item.senderName}
                    </Text>
                    <Text numberOfLines={2} style={styles.searchResultText}>
                      {getReplyText(item)}
                    </Text>
                  </View>
                  <Text style={styles.searchResultDate}>
                    {item.timestamp.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </Modal>

        <Modal
          visible={attachmentSheetVisible}
          animationType="fade"
          transparent
          onRequestClose={closeAttachmentSheet}
        >
          <TouchableOpacity
            style={styles.attachmentSheetOverlay}
            activeOpacity={1}
            onPress={closeAttachmentSheet}
          >
            <View style={styles.attachmentSheetContainer}>
              <View style={styles.attachmentSheetHandle} />
              <Text style={styles.attachmentSheetTitle}>Add to message</Text>
              <TouchableOpacity
                activeOpacity={0.76}
                style={styles.attachmentOption}
                onPress={handleOpenGallery}
              >
                <View style={styles.attachmentOptionIcon}>
                  <GalleryHorizontal
                    size={22}
                    color={Colors.primary}
                    strokeWidth={2.2}
                  />
                </View>
                <Text style={styles.attachmentOptionText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.76}
                style={styles.attachmentOption}
                onPress={handleOpenPoll}
              >
                <View style={styles.attachmentOptionIcon}>
                  <ChartBarBig
                    size={22}
                    color={Colors.primary}
                    strokeWidth={2.2}
                  />
                </View>
                <Text style={styles.attachmentOptionText}>Poll</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

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
                style={[
                  styles.viewerButton,
                  savingMedia && styles.viewerButtonDisabled,
                ]}
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
        <PollCreator
          visible={pollCreatorVisible}
          onClose={() => setPollCreatorVisible(false)}
          onCreatePoll={handleCreatePoll}
          currentUserId={user?.id ?? ""}
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
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "flex-end",
    paddingTop: 84,
    paddingRight: Spacing.screenPadding,
  },
  chatMenu: {
    width: 240,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
    overflow: "hidden",
  },
  menuItem: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  menuText: {
    ...Typography.body,
    flex: 1,
    color: Colors.textPrimary,
  },
  menuTextDanger: {
    color: Colors.danger,
    fontWeight: "700",
  },
  menuDivider: {
    height: 1,
    marginLeft: 48,
    backgroundColor: Colors.divider,
  },
  searchContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  searchInputWrap: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    ...Typography.body,
    flex: 1,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  searchResultsContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  searchCount: {
    ...Typography.label,
    marginBottom: Spacing.sm,
    color: Colors.textSecondary,
  },
  searchResult: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  searchResultCopy: {
    flex: 1,
    minWidth: 0,
  },
  searchResultSender: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  searchResultText: {
    ...Typography.bodySmall,
    marginTop: 2,
    color: Colors.textSecondary,
  },
  searchResultDate: {
    ...Typography.bodySmall,
    color: Colors.textDisabled,
  },
  attachmentSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
  },
  attachmentSheetContainer: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  attachmentSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.inputBg,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  attachmentSheetTitle: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  attachmentOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    marginBottom: Spacing.sm,
  },
  attachmentOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.inputBg,
  },
  attachmentOptionText: {
    ...Typography.body,
    color: Colors.textPrimary,
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
