import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { Mic, Plus, Send, Square, X } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';

interface ChatAttachment {
  id: string;
  uri: string;
  type: 'image' | 'video';
}

interface ReplyPreview {
  senderName: string;
  text: string;
  mediaType?: 'image' | 'video' | null;
}

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onMediaPress: () => void;
  attachments?: ChatAttachment[];
  onRemoveAttachment?: (id: string) => void;
  replyTo?: ReplyPreview | null;
  onCancelReply?: () => void;
  onAudioPress?: () => void;
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
  onAudioPress,
  placeholder = "Type a message...",
  disabled = false
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = () => {
    if ((text.trim() || attachments.length > 0) && !disabled) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleAudioPress = () => {
    if (onAudioPress) {
      setIsRecording(!isRecording);
      onAudioPress();
    }
  };

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled;

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
              {replyTo.mediaType ? `${replyTo.mediaType === 'image' ? 'Photo' : 'Video'}${replyTo.text ? ` · ${replyTo.text}` : ''}` : replyTo.text}
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
      <View style={styles.inputContainer}>
        {/* Media button */}
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={onMediaPress}
          disabled={disabled}
        >
          <Plus
            size={24} 
            color={disabled ? Colors.textDisabled : Colors.primary} 
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
              isRecording && styles.audioButtonRecording,
              disabled && styles.buttonDisabled
            ]}
            onPress={handleAudioPress}
            disabled={disabled || !onAudioPress}
          >
            {isRecording ? (
              <Square
                size={20}
                color={disabled ? Colors.textDisabled : '#FF5252'}
                fill={disabled ? Colors.textDisabled : '#FF5252'}
                strokeWidth={2.4}
              />
            ) : (
              <Mic
                size={20}
                color={disabled ? Colors.textDisabled : Colors.primary}
                strokeWidth={2.4}
              />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.sendButton,
              canSend ? styles.sendButtonActive : styles.buttonDisabled
            ]}
            onPress={handleSend}
            disabled={!canSend}
          >
            <Send
              size={20} 
              color={canSend ? '#fff' : Colors.textDisabled} 
              strokeWidth={2.4}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Character count */}
      {text.length > 400 && (
        <Text style={[
          styles.characterCount,
          text.length >= 500 && styles.characterCountWarning
        ]}>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
  },
  replyAccent: {
    width: 3,
    alignSelf: 'stretch',
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
    fontWeight: '700',
  },
  replyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  cancelReplyButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentTray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  attachmentPreview: {
    width: 58,
    height: 58,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.inputBg,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    ...Typography.body,
    color: Colors.textPrimary,
    minHeight: 36,
    maxHeight: 80,
    textAlignVertical: 'center',
  },
  audioButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButtonRecording: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'right',
    fontSize: 10,
  },
  characterCountWarning: {
    color: '#FF5252',
  },
});
