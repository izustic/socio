import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 40;
const cardHeight = cardWidth * 1.4;

interface ProfileCardProps {
  profile: {
    name: string;
    age: number;
    bio?: string;
    interests: string[];
    photoURL?: string;
    media?: Array<{ uri: string; type: 'image' | 'video' }>;
  };
  onLike?: () => void;
  onPass?: () => void;
  onSuperLike?: () => void;
}

export default function ProfileCard({ 
  profile, 
  onLike, 
  onPass, 
  onSuperLike 
}: ProfileCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = event.translationX + context.startX;
      translateY.value = event.translationY + context.startY;
      rotate.value = (translateX.value / screenWidth) * 30;
    },
    onEnd: (event) => {
      const shouldLike = translateX.value > 100;
      const shouldPass = translateX.value < -100;
      const shouldSuperLike = translateY.value < -100;

      if (shouldLike) {
        translateX.value = withSpring(screenWidth * 1.5);
        runOnJS(onLike)();
      } else if (shouldPass) {
        translateX.value = withSpring(-screenWidth * 1.5);
        runOnJS(onPass)();
      } else if (shouldSuperLike) {
        translateY.value = withSpring(-screenHeight * 1.5);
        runOnJS(onSuperLike)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    }
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` }
    ],
  }));

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(translateX.value / 200, 0), 1),
  }));

  const passOpacity = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(-translateX.value / 200, 0), 1),
  }));

  const superLikeOpacity = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(-translateY.value / 200, 0), 1),
  }));

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Media */}
          <View style={styles.mediaContainer}>
            {profile.media && profile.media.length > 0 ? (
              <Image
                source={{ uri: profile.media[0].uri }}
                style={styles.media}
                contentFit="cover"
              />
            ) : (
              <Avatar 
                uri={profile.photoURL} 
                size={cardWidth}
                style={styles.avatarPlaceholder}
              />
            )}
            
            {/* Overlay indicators */}
            <Animated.View style={[styles.likeIndicator, likeOpacity]}>
              <Text style={styles.indicatorText}>LIKE</Text>
            </Animated.View>
            
            <Animated.View style={[styles.passIndicator, passOpacity]}>
              <Text style={styles.indicatorText}>PASS</Text>
            </Animated.View>
            
            <Animated.View style={[styles.superLikeIndicator, superLikeOpacity]}>
              <Text style={styles.indicatorText}>SUPER</Text>
            </Animated.View>
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.name}>
              {profile.name}, {profile.age}
            </Text>
            
            {profile.bio && (
              <Text style={styles.bio} numberOfLines={2}>
                {profile.bio}
              </Text>
            )}
            
            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.interests}>
                {profile.interests.slice(0, 3).map((interest, index) => (
                  <View key={index} style={styles.interestChip}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: cardWidth,
    height: cardHeight,
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  mediaContainer: {
    flex: 1,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  likeIndicator: {
    position: 'absolute',
    top: 40,
    left: 40,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    transform: [{ rotate: '-30deg' }],
  },
  passIndicator: {
    position: 'absolute',
    top: 40,
    right: 40,
    backgroundColor: '#FF5252',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    transform: [{ rotate: '30deg' }],
  },
  superLikeIndicator: {
    position: 'absolute',
    top: 60,
    left: '50%',
    marginLeft: -40,
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  indicatorText: {
    ...Typography.button,
    color: '#fff',
    fontWeight: '700',
  },
  info: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  name: {
    ...Typography.h2,
    fontWeight: '700',
  },
  bio: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  interestChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  interestText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
});
