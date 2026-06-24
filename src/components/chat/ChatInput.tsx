import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import {
  Mic,
  Pause,
  Play,
  Plus,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ChatAttachment {
  id: string;
  uri: string;
  type: "image" | "video";
}

interface ReplyPreview {
  senderName: string;
  text: string;
  mediaType?: "image" | "video" | "audio" | null;
}

interface AudioPreview {
  uri: string;
  durationMillis?: number;
}

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onMediaPress: () => void;
  attachments?: ChatAttachment[];
  onRemoveAttachment?: (id: string) => void;
  replyTo?: ReplyPreview | null;
  onCancelReply?: () => void;
  audioPreview?: AudioPreview | null;
  isRecordingAudio?: boolean;
  recordingDurationMillis?: number;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onDiscardAudio?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function ChatInput({
  onSendMessage,
  onMediaPress,
  attachments = [],
  onRemoveAttachment,
  replyTo,
  onCancelReply,
  audioPreview,
  isRecordingAudio = false,
  recordingDurationMillis = 0,
  onStartRecording,
  onStopRecording,
  onDiscardAudio,
  placeholder = "Type a message...",
  disabled = false,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const previewSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      previewSoundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (audioPreview) return;
    previewSoundRef.current?.unloadAsync();
    previewSoundRef.current = null;
    setPreviewPlaying(false);
    setPreviewProgress(0);
  }, [audioPreview]);

  const formatDuration = (durationMillis = 0) => {
    const totalSeconds = Math.max(0, Math.round(durationMillis / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSend = () => {
    if ((text.trim() || attachments.length > 0 || audioPreview) && !disabled) {
      onSendMessage(text.trim());
      setText("");
    }
  };

  const handleAudioPress = () => {
    if (isRecordingAudio) {
      onStopRecording?.();
      return;
    }
    onStartRecording?.();
  };

  const handlePreviewPlay = async () => {
    if (!audioPreview || disabled) return;

    if (previewSoundRef.current) {
      const status = await previewSoundRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await previewSoundRef.current.pauseAsync();
          setPreviewPlaying(false);
          return;
        }

        if (
          status.positionMillis != null &&
          status.durationMillis != null &&
          status.positionMillis < status.durationMillis
        ) {
          await previewSoundRef.current.playAsync();
          setPreviewPlaying(true);
          return;
        }
      } else {
        await previewSoundRef.current.unloadAsync();
        previewSoundRef.current = null;
      }
    }

    await previewSoundRef.current?.unloadAsync();
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioPreview.uri },
      { shouldPlay: true, isLooping: false },
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;

      setPreviewPlaying(!!status.isPlaying);
      if (status.positionMillis != null && status.durationMillis != null) {
        setPreviewProgress(
          status.positionMillis / Math.max(status.durationMillis, 1),
        );
      }

      if (status.didJustFinish) {
        setPreviewPlaying(false);
        setPreviewProgress(0);
        sound.setPositionAsync(0);
      }
    });
    previewSoundRef.current = sound;
    setPreviewPlaying(true);
  };

  const canSend =
    (text.trim().length > 0 ||
      attachments.length > 0 ||
      Boolean(audioPreview)) &&
    !disabled;
  const audioButtonDisabled =
    disabled || attachments.length > 0 || Boolean(audioPreview);

  return (
    <View style={styles.container}>
      {replyTo && (
        <View style={styles.replyPreview}>
          <View style={styles.replyAccent} />
          <View style={styles.replyCopy}>
            <Text numberOfLines={1} style={styles.replySender}>
              {replyTo.senderName}
            </Text>
            <Text numberOfLines={1} style={styles.replyText}>
              {replyTo.mediaType
                ? `${replyTo.mediaType === "image" ? "Photo" : replyTo.mediaType === "video" ? "Video" : "Voice message"}${replyTo.text ? ` · ${replyTo.text}` : ""}`
                : replyTo.text}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cancelReplyButton}
            onPress={onCancelReply}
            disabled={disabled}
            accessibilityLabel="Cancel reply"
          >
            <X size={16} color={Colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      )}
      {attachments.length > 0 && (
        <View style={styles.attachmentTray}>
          {attachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentPreview}>
              <Image
                source={{ uri: attachment.uri }}
                style={styles.attachmentImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.removeAttachmentButton}
                onPress={() => onRemoveAttachment?.(attachment.id)}
                disabled={disabled}
                accessibilityLabel="Remove attachment"
              >
                <X size={14} color={Colors.white} strokeWidth={2.6} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      {isRecordingAudio && (
        <View style={styles.audioDraft}>
          <View style={styles.recordingDot} />
          <Text style={styles.audioDraftText}>Recording</Text>
          <Text style={styles.audioDuration}>
            {formatDuration(recordingDurationMillis)}
          </Text>
        </View>
      )}
      {audioPreview && !isRecordingAudio && (
        <View style={styles.audioDraft}>
          <TouchableOpacity
            style={styles.audioPreviewButton}
            onPress={handlePreviewPlay}
            disabled={disabled}
            accessibilityLabel={
              previewPlaying
                ? "Pause voice message preview"
                : "Play voice message preview"
            }
          >
            {previewPlaying ? (
              <Pause size={16} color={Colors.textPrimary} strokeWidth={2.2} />
            ) : (
              <Play
                size={16}
                color={Colors.textPrimary}
                fill={Colors.textPrimary}
                strokeWidth={2.2}
              />
            )}
          </TouchableOpacity>
          <View style={styles.audioPreviewBar}>
            <View
              style={[
                styles.audioPreviewFill,
                {
                  width: `${Math.max(8, Math.round(previewProgress * 100))}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.audioDuration}>
            {formatDuration(audioPreview.durationMillis)}
          </Text>
          <TouchableOpacity
            style={styles.discardAudioButton}
            onPress={onDiscardAudio}
            disabled={disabled}
            accessibilityLabel="Discard voice message"
          >
            <Trash2 size={17} color={Colors.danger} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputContainer}>
        {/* Media button */}
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={onMediaPress}
          disabled={disabled || isRecordingAudio || Boolean(audioPreview)}
        >
          <Plus
            size={24}
            color={
              disabled || isRecordingAudio || audioPreview
                ? Colors.textDisabled
                : Colors.primary
            }
            strokeWidth={2.4}
          />
        </TouchableOpacity>

        {/* Text input */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={Colors.textDisabled}
            multiline
            maxLength={500}
            editable={!disabled}
          />
        </View>

        {/* Audio button or Send button */}
        {!canSend ? (
          <TouchableOpacity
            style={[
              styles.audioButton,
              isRecordingAudio && styles.audioButtonRecording,
              disabled && styles.buttonDisabled,
            ]}
            onPress={handleAudioPress}
            disabled={audioButtonDisabled && !isRecordingAudio}
          >
            {isRecordingAudio ? (
              <Square
                size={20}
                color={disabled ? Colors.textDisabled : "#FF5252"}
                fill={disabled ? Colors.textDisabled : "#FF5252"}
                strokeWidth={2.4}
              />
            ) : (
              <Mic
                size={20}
                color={
                  audioButtonDisabled ? Colors.textDisabled : Colors.primary
                }
                strokeWidth={2.4}
              />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.sendButton,
              canSend ? styles.sendButtonActive : styles.buttonDisabled,
            ]}
            onPress={handleSend}
            disabled={!canSend}
          >
            <Send
              size={20}
              color={canSend ? "#fff" : Colors.textDisabled}
              strokeWidth={2.4}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Character count */}
      {text.length > 400 && (
        <Text
          style={[
            styles.characterCount,
            text.length >= 500 && styles.characterCountWarning,
          ]}
        >
          {text.length}/500
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
  },
  replyAccent: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  replyCopy: {
    flex: 1,
    minWidth: 0,
  },
  replySender: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  replyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  cancelReplyButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentTray: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  attachmentPreview: {
    width: 58,
    height: 58,
    borderRadius: Radius.sm,
    overflow: "hidden",
    backgroundColor: Colors.inputBg,
  },
  attachmentImage: {
    width: "100%",
    height: "100%",
  },
  audioDraft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
  },
  recordingDot: {
    width: 9,
    height: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.danger,
  },
  audioDraftText: {
    ...Typography.bodySmall,
    flex: 1,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  audioDuration: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  audioPreviewButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  audioPreviewBar: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    overflow: "hidden",
  },
  audioPreviewFill: {
    height: "100%",
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    width: "0%",
  },
  discardAudioButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  removeAttachmentButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  mediaButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    ...Typography.body,
    color: Colors.textPrimary,
    minHeight: 36,
    maxHeight: 80,
    textAlignVertical: "center",
  },
  audioButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  audioButtonRecording: {
    backgroundColor: "rgba(255, 82, 82, 0.1)",
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.inputBg,
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  characterCount: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "right",
    fontSize: 10,
  },
  characterCountWarning: {
    color: "#FF5252",
  },
});
