import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onMediaPress: () => void;
  onAudioPress?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function ChatInput({ 
  onSendMessage, 
  onMediaPress, 
  onAudioPress,
  placeholder = "Type a message...",
  disabled = false
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = () => {
    if (text.trim() && !disabled) {
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

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {/* Media button */}
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={onMediaPress}
          disabled={disabled}
        >
          <Ionicons 
            name="add" 
            size={24} 
            color={disabled ? Colors.textDisabled : Colors.primary} 
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
        {text.trim().length === 0 ? (
          <TouchableOpacity
            style={[
              styles.audioButton,
              isRecording && styles.audioButtonRecording,
              disabled && styles.buttonDisabled
            ]}
            onPress={handleAudioPress}
            disabled={disabled || !onAudioPress}
          >
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={20} 
              color={disabled ? Colors.textDisabled : (isRecording ? '#FF5252' : Colors.primary)} 
            />
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
            <Ionicons 
              name="send" 
              size={20} 
              color={canSend ? '#fff' : Colors.textDisabled} 
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
