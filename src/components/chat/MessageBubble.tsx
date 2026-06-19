import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import Avatar from '../ui/Avatar';

interface MessageBubbleProps {
  message: {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    timestamp: Date;
    isOwn: boolean;
    replyTo?: {
      messageId: string;
      senderName: string;
      text: string;
      mediaType?: 'image' | 'video' | 'audio' | null;
    } | null;
  };
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onLongPress?: () => void;
  onReplyPress?: (messageId: string) => void;
  highlighted?: boolean;
}

export default function MessageBubble({ 
  message, 
  showAvatar = true,
  showTimestamp = true,
  onLongPress,
  onReplyPress,
  highlighted = false
}: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[
      styles.container,
      message.isOwn ? styles.ownContainer : styles.otherContainer
    ]}>
      {!message.isOwn && showAvatar && (
        <Avatar
          uri={message.senderPhoto}
          size={32}
          style={styles.avatar}
        />
      )}
      
      <View style={styles.content}>
        {!message.isOwn && (
          <Text style={styles.senderName}>{message.senderName}</Text>
        )}
        
        <TouchableOpacity
          activeOpacity={0.82}
          onLongPress={onLongPress}
          delayLongPress={240}
          style={[
            styles.bubble,
            message.replyTo && styles.replyBubble,
            highlighted && styles.highlightedBubble,
            message.isOwn ? styles.ownBubble : styles.otherBubble,
          ]}>
          {message.replyTo && (
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={() => onReplyPress?.(message.replyTo!.messageId)}
              style={[
              styles.replySnippet,
              message.isOwn ? styles.ownReplySnippet : styles.otherReplySnippet,
            ]}>
              <View style={[
                styles.replyAccent,
                message.isOwn ? styles.ownReplyAccent : styles.otherReplyAccent,
              ]} />
              <View style={styles.replyCopy}>
                <Text numberOfLines={1} style={[
                  styles.replySender,
                  message.isOwn ? styles.ownReplySender : styles.otherReplySender,
                ]}>
                  {message.replyTo.senderName}
                </Text>
                <Text numberOfLines={1} style={[
                  styles.replyText,
                  message.isOwn ? styles.ownReplyText : styles.otherReplyText,
                ]}>
                  {message.replyTo.mediaType
                    ? `${message.replyTo.mediaType === 'image' ? 'Photo' : message.replyTo.mediaType === 'video' ? 'Video' : 'Voice message'}${message.replyTo.text ? ` · ${message.replyTo.text}` : ''}`
                    : message.replyTo.text}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <Text style={[
            styles.text,
            message.isOwn ? styles.ownText : styles.otherText
          ]}>
            {message.text}
          </Text>
        </TouchableOpacity>
        
        {showTimestamp && (
          <Text style={[
            styles.timestamp,
            message.isOwn ? styles.ownTimestamp : styles.otherTimestamp
          ]}>
            {formatTime(message.timestamp)}
          </Text>
        )}
      </View>
      
      {message.isOwn && showAvatar && (
        <View style={styles.avatarSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  replySnippet: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  ownReplySnippet: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  otherReplySnippet: {
    backgroundColor: Colors.white,
  },
  replyAccent: {
    width: 3,
    borderRadius: Radius.full,
  },
  ownReplyAccent: {
    backgroundColor: Colors.white,
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
    fontWeight: '700',
  },
  ownReplySender: {
    color: Colors.white,
  },
  otherReplySender: {
    color: Colors.primaryDark,
  },
  replyText: {
    ...Typography.bodySmall,
  },
  ownReplyText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  otherReplyText: {
    color: Colors.textSecondary,
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginRight: Spacing.sm,
  },
  avatarSpacer: {
    width: 32,
  },
  content: {
    maxWidth: '82%',
    gap: 2,
  },
  bubble: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
  },
  replyBubble: {
    minWidth: 238,
  },
  highlightedBubble: {
    borderWidth: 2,
    borderColor: Colors.primaryDark,
  },
  ownBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.sm,
  },
  otherBubble: {
    backgroundColor: Colors.inputBg,
    borderBottomLeftRadius: Radius.sm,
  },
  text: {
    ...Typography.body,
    lineHeight: 18,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: Colors.textPrimary,
  },
  senderName: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    marginBottom: 2,
  },
  timestamp: {
    ...Typography.bodySmall,
    fontSize: 10,
  },
  ownTimestamp: {
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  otherTimestamp: {
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
});
