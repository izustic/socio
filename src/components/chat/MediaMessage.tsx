import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import Avatar from '../ui/Avatar';
import MessageBubble from './MessageBubble';

interface MediaMessageProps {
  message: {
    id: string;
    type: 'image' | 'video' | 'audio';
    uri: string;
    caption?: string;
    duration?: number;
    size?: number;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    timestamp: Date;
    isOwn: boolean;
  };
  showAvatar?: boolean;
  onImagePress?: (uri: string) => void;
  onVideoPress?: (uri: string) => void;
  onAudioPress?: (uri: string) => void;
}

export default function MediaMessage({ 
  message, 
  showAvatar = true,
  onImagePress,
  onVideoPress,
  onAudioPress
}: MediaMessageProps) {
  const [videoStatus, setVideoStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderImageContent = () => (
    <TouchableOpacity
      style={styles.mediaContainer}
      onPress={() => onImagePress?.(message.uri)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: message.uri }}
        style={styles.image}
        contentFit="cover"
      />
      {message.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>{message.caption}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderVideoContent = () => (
    <TouchableOpacity
      style={styles.mediaContainer}
      onPress={() => onVideoPress?.(message.uri)}
      activeOpacity={0.8}
    >
      <Video
        source={{ uri: message.uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping
        onReadyForDisplay={() => setVideoStatus('ready')}
        onError={() => setVideoStatus('error')}
      />
      <View style={styles.videoOverlay}>
        <View style={styles.playButton}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
        {message.duration && (
          <Text style={styles.duration}>{formatDuration(message.duration)}</Text>
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
      onPress={() => onAudioPress?.(message.uri)}
      activeOpacity={0.8}
    >
      <View style={styles.audioContent}>
        <View style={styles.audioIcon}>
          <Text style={styles.audioIconText}>🎵</Text>
        </View>
        <View style={styles.audioInfo}>
          <Text style={styles.audioType}>Audio Message</Text>
          {message.duration && (
            <Text style={styles.audioDuration}>{formatDuration(message.duration)}</Text>
          )}
          {message.size && (
            <Text style={styles.audioSize}>{formatFileSize(message.size)}</Text>
          )}
        </View>
        <View style={styles.audioPlayButton}>
          <Text style={styles.audioPlayIcon}>▶</Text>
        </View>
      </View>
      {message.caption && (
        <Text style={styles.audioCaption}>{message.caption}</Text>
      )}
    </TouchableOpacity>
  );

  const mediaContent = () => {
    switch (message.type) {
      case 'image':
        return renderImageContent();
      case 'video':
        return renderVideoContent();
      case 'audio':
        return renderAudioContent();
      default:
        return null;
    }
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
          styles.mediaWrapper,
          message.isOwn ? styles.ownWrapper : styles.otherWrapper
        ]}>
          {mediaContent()}
        </View>
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
    maxWidth: '80%',
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
    overflow: 'hidden',
  },
  ownWrapper: {
    backgroundColor: 'transparent',
  },
  otherWrapper: {
    backgroundColor: 'transparent',
  },
  mediaContainer: {
    position: 'relative',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: Radius.lg,
  },
  video: {
    width: 200,
    height: 200,
    borderRadius: Radius.lg,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  duration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: Spacing.sm,
  },
  caption: {
    color: '#fff',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  audioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioIconText: {
    fontSize: 16,
  },
  audioInfo: {
    flex: 1,
    gap: 2,
  },
  audioType: {
    ...Typography.body,
    fontWeight: '600',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPlayIcon: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  audioCaption: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
