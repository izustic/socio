import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  };
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

export default function MessageBubble({ 
  message, 
  showAvatar = true,
  showTimestamp = true
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
        
        <View style={[
          styles.bubble,
          message.isOwn ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.text,
            message.isOwn ? styles.ownText : styles.otherText
          ]}>
            {message.text}
          </Text>
        </View>
        
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
    maxWidth: '70%',
    gap: 2,
  },
  bubble: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
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
