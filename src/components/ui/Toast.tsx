import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ToastProps {
  visible: boolean;
  type: 'match_started' | 'request_sent';
  userName?: string;
  userAge?: number;
  circleName?: string;
  isHost?: boolean;
  statusText?: string;
  onDismiss?: () => void;
}

export default function Toast({
  visible,
  type,
  userName,
  userAge,
  circleName,
  isHost = false,
  statusText,
  onDismiss,
}: ToastProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  if (!visible) return null;

  const isMatchStarted = type === 'match_started';
  const title = isMatchStarted ? 'MATCH STARTED' : 'REQUEST SENT';
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.toast}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✓</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Image
                source={{ uri: 'https://via.placeholder.com/60' }}
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            {isMatchStarted ? (
              <>
                <Text style={styles.profileName}>
                  {userName}, {userAge}
                </Text>
                <Text style={styles.profileStatus}>
                  added to shortlist
                </Text>
                <Text style={styles.profileDescription}>
                  {userName} still needs to swipe right on your Circle to join.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.profileName}>{circleName}</Text>
                <Text style={styles.profileStatus}>
                  {userName} (host) needs to swipe right on you to lock your spot.
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Status Footer */}
        <View style={styles.statusFooter}>
          <View style={styles.statusContainer}>
            <Text style={styles.clockIcon}>⏰</Text>
            <Text style={styles.statusText}>
              {statusText ?? (isMatchStarted ? `Waiting on ${userName}` : 'Waiting on host')}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Status bar height + padding
    left: Spacing.screenPadding,
    right: Spacing.screenPadding,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  icon: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  profileSection: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  avatarContainer: {
    marginRight: Spacing.sm,
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  checkmark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  checkmarkText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  profileStatus: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  profileDescription: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  statusFooter: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  statusText: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
