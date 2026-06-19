import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { getSignedChatMediaUrls } from "@/src/services/supabase";
import { Audio, ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import { Mic, Pause, Play } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Avatar from "../ui/Avatar";

interface MediaMessageProps {
  message: {
    id: string;
    type: "image" | "video" | "audio";
    uri: string;
    uris?: string[];
    caption?: string;
    duration?: number;
    size?: number;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    timestamp: Date;
    isOwn: boolean;
    replyTo?: {
      messageId: string;
      senderName: string;
      text: string;
      mediaType?: "image" | "video" | "audio" | null;
    } | null;
  };
  showAvatar?: boolean;
  onLongPress?: () => void;
  onReplyPress?: (messageId: string) => void;
  highlighted?: boolean;
  onImagePress?: (uri: string) => void;
  onVideoPress?: (uri: string) => void;
  onAudioPress?: (uri: string) => void;
}

export default function MediaMessage({
  message,
  showAvatar = true,
  onLongPress,
  onReplyPress,
  highlighted = false,
  onImagePress,
  onVideoPress,
  onAudioPress,
}: MediaMessageProps) {
  const [videoStatus, setVideoStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioSound, setAudioSound] = useState<Audio.Sound | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const sourceUris = useMemo(
    () =>
      (message.uris && message.uris.length > 0
        ? message.uris
        : [message.uri]
      ).filter(Boolean),
    [message.uri, message.uris],
  );
  const [resolvedUris, setResolvedUris] = useState(sourceUris);

  useEffect(() => {
    let active = true;

    const resolveMedia = async () => {
      const signedUrls = await getSignedChatMediaUrls(sourceUris);
      if (active) setResolvedUris(signedUrls);
    };

    resolveMedia();

    return () => {
      active = false;
    };
  }, [sourceUris]);

  useEffect(() => {
    return () => {
      audioSound?.unloadAsync();
    };
  }, [audioSound]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderImageContent = () => {
    const images = resolvedUris.length > 0 ? resolvedUris : sourceUris;
    const visibleImages = images.slice(0, 4);
    const overflowCount = Math.max(images.length - visibleImages.length, 0);
    const isGrid = images.length > 1;

    return (
      <View style={styles.mediaContainer}>
        <View style={[styles.imageGrid, !isGrid && styles.singleImageGrid]}>
          {visibleImages.map((uri, index) => (
            <TouchableOpacity
              key={`${uri}-${index}`}
              style={[
                styles.imageCell,
                !isGrid && styles.singleImageCell,
                isGrid &&
                  images.length === 3 &&
                  index === 0 &&
                  styles.largeGridCell,
              ]}
              onPress={() => onImagePress?.(uri)}
              onLongPress={onLongPress}
              delayLongPress={240}
              activeOpacity={0.86}
            >
              <Image
                source={{ uri }}
                style={styles.image}
                contentFit="cover"
                transition={120}
              />
              {overflowCount > 0 && index === visibleImages.length - 1 && (
                <View style={styles.overflowOverlay}>
                  <Text style={styles.overflowText}>+{overflowCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        {message.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>{message.caption}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderVideoContent = () => (
    <TouchableOpacity
      style={styles.mediaContainer}
      onPress={() => onVideoPress?.(resolvedUris[0] ?? message.uri)}
      onLongPress={onLongPress}
      delayLongPress={240}
      activeOpacity={0.8}
    >
      <Video
        source={{ uri: resolvedUris[0] ?? message.uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping
        onReadyForDisplay={() => setVideoStatus("ready")}
        onError={() => setVideoStatus("error")}
      />
      <View style={styles.videoOverlay}>
        <View style={styles.playButton}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
        {videoStatus === "error" && (
          <Text style={styles.videoError}>Unable to preview</Text>
        )}
        {message.duration && (
          <Text style={styles.duration}>
            {formatDuration(message.duration)}
          </Text>
        )}
      </View>
      {message.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>{message.caption}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAudioContent = () => (
    <TouchableOpacity
      style={styles.audioContainer}
      onPress={async () => {
        const audioUri = resolvedUris[0] ?? message.uri;
        onAudioPress?.(audioUri);

        if (audioSound && audioPlaying) {
          await audioSound.pauseAsync();
          setAudioPlaying(false);
          return;
        }

        if (audioSound) {
          await audioSound.playAsync();
          setAudioPlaying(true);
          return;
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true, isLooping: false },
        );
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) {
            return;
          }

          setAudioPlaying(!!status.isPlaying);

          if (status.durationMillis && status.positionMillis != null) {
            setAudioProgress(
              status.positionMillis / Math.max(status.durationMillis, 1),
            );
          }

          if (status.didJustFinish) {
            setAudioPlaying(false);
            setAudioProgress(0);
            sound.setPositionAsync(0);
          }
        });
        setAudioSound(sound);
        setAudioPlaying(true);
      }}
      onLongPress={onLongPress}
      delayLongPress={240}
      activeOpacity={0.8}
    >
      <View style={styles.audioContent}>
        <View style={styles.audioIcon}>
          <Mic size={18} color={Colors.white} strokeWidth={2.4} />
        </View>
        <View style={styles.audioInfo}>
          {/* <Text style={styles.audioType}>Voice message</Text> */}
          <View style={styles.audioWave}>
            {Array.from({ length: 18 }).map((_, index) => {
              const activeIndex = Math.max(
                audioPlaying ? 1 : 0,
                Math.round(audioProgress * 18),
              );
              const isActive = index < activeIndex;

              return (
                <View
                  key={index}
                  style={[
                    styles.audioWaveBar,
                    { height: 7 + ((index * 7) % 18) },
                    isActive && styles.audioWaveBarActive,
                  ]}
                />
              );
            })}
          </View>
          {message.duration && (
            <Text style={styles.audioDuration}>
              {formatDuration(message.duration)}
            </Text>
          )}
          {message.size && (
            <Text style={styles.audioSize}>{formatFileSize(message.size)}</Text>
          )}
        </View>
        <View style={styles.audioPlayButton}>
          {audioPlaying ? (
            <Pause
              size={14}
              color={Colors.white}
              fill={Colors.white}
              strokeWidth={2.4}
            />
          ) : (
            <Play
              size={14}
              color={Colors.white}
              fill={Colors.white}
              strokeWidth={2.4}
            />
          )}
        </View>
      </View>
      {message.caption && (
        <Text style={styles.audioCaption}>{message.caption}</Text>
      )}
    </TouchableOpacity>
  );

  const mediaContent = () => {
    switch (message.type) {
      case "image":
        return renderImageContent();
      case "video":
        return renderVideoContent();
      case "audio":
        return renderAudioContent();
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        message.isOwn ? styles.ownContainer : styles.otherContainer,
      ]}
      activeOpacity={0.9}
      onLongPress={onLongPress}
      delayLongPress={240}
    >
      {!message.isOwn && showAvatar && (
        <Avatar uri={message.senderPhoto} size={32} style={styles.avatar} />
      )}

      <View style={styles.content}>
        {!message.isOwn && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}

        <View
          style={[
            styles.mediaWrapper,
            highlighted && styles.highlightedWrapper,
            message.isOwn ? styles.ownWrapper : styles.otherWrapper,
          ]}
        >
          {message.replyTo && (
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={() => onReplyPress?.(message.replyTo!.messageId)}
              style={[
                styles.replySnippet,
                message.isOwn
                  ? styles.ownReplySnippet
                  : styles.otherReplySnippet,
              ]}
            >
              <View
                style={[
                  styles.replyAccent,
                  message.isOwn
                    ? styles.ownReplyAccent
                    : styles.otherReplyAccent,
                ]}
              />
              <View style={styles.replyCopy}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.replySender,
                    message.isOwn
                      ? styles.ownReplySender
                      : styles.otherReplySender,
                  ]}
                >
                  {message.replyTo.senderName}
                </Text>
                <Text numberOfLines={1} style={styles.replyText}>
                  {message.replyTo.mediaType
                    ? `${message.replyTo.mediaType === "image" ? "Photo" : message.replyTo.mediaType === "video" ? "Video" : "Voice message"}${message.replyTo.text ? ` · ${message.replyTo.text}` : ""}`
                    : message.replyTo.text}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          {mediaContent()}
        </View>
      </View>

      {message.isOwn && showAvatar && <View style={styles.avatarSpacer} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ownContainer: {
    justifyContent: "flex-end",
  },
  otherContainer: {
    justifyContent: "flex-start",
  },
  avatar: {
    marginRight: Spacing.sm,
  },
  avatarSpacer: {
    width: 32,
  },
  content: {
    maxWidth: "80%",
    gap: 2,
  },
  senderName: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    marginBottom: 2,
  },
  mediaWrapper: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    minWidth: 220,
  },
  highlightedWrapper: {
    borderWidth: 2,
    borderColor: Colors.primaryDark,
  },
  ownWrapper: {
    backgroundColor: "transparent",
  },
  otherWrapper: {
    backgroundColor: "transparent",
  },
  replySnippet: {
    flexDirection: "row",
    gap: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: 2,
  },
  ownReplySnippet: {
    backgroundColor: Colors.primaryLight,
  },
  otherReplySnippet: {
    backgroundColor: Colors.inputBg,
  },
  replyAccent: {
    width: 3,
    borderRadius: Radius.full,
  },
  ownReplyAccent: {
    backgroundColor: Colors.primary,
  },
  otherReplyAccent: {
    backgroundColor: Colors.primary,
  },
  replyCopy: {
    flex: 1,
    minWidth: 0,
  },
  replySender: {
    ...Typography.bodySmall,
    fontWeight: "700",
  },
  ownReplySender: {
    color: Colors.primaryDark,
  },
  otherReplySender: {
    color: Colors.primaryDark,
  },
  replyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  mediaContainer: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: Colors.inputBg,
  },
  imageGrid: {
    width: 220,
    minHeight: 200,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  singleImageGrid: {
    height: 220,
  },
  imageCell: {
    width: 109,
    height: 99,
    overflow: "hidden",
    backgroundColor: Colors.placeholder,
  },
  singleImageCell: {
    width: 220,
    height: 220,
  },
  largeGridCell: {
    width: 220,
    height: 120,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overflowOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.46)",
  },
  overflowText: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: "800",
  },
  video: {
    width: 200,
    height: 200,
    borderRadius: Radius.lg,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Radius.lg,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  playIcon: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  videoError: {
    position: "absolute",
    bottom: 28,
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  duration: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "600",
  },
  captionContainer: {
    backgroundColor: Colors.inputBg,
    padding: Spacing.sm,
  },
  caption: {
    color: Colors.textPrimary,
    fontSize: 12,
  },
  audioContainer: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    minWidth: 200,
    gap: Spacing.sm,
  },
  audioContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  audioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  audioInfo: {
    flex: 1,
    gap: 2,
  },
  audioType: {
    ...Typography.body,
    fontWeight: "600",
  },
  audioWave: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginVertical: 2,
  },
  audioWaveBar: {
    width: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.textDisabled,
  },
  audioWaveBarActive: {
    backgroundColor: Colors.primary,
  },
  audioDuration: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  audioSize: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  audioPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  audioPlayIcon: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  audioCaption: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
