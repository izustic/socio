import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { createThemedStyles, Radius, Spacing, Typography } from '@/src/constants/theme';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { optionLabel, tx } from "@/src/utils/localization";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const cardWidth = screenWidth - 40;
const cardHeight = cardWidth * 1.4;

interface ProfileCardProps {
  profile: {
    name: string;
    age: number;
    bio?: string;
    interests: string[];
    photoURL?: string;
    media?: { uri: string; type: 'image' | 'video' }[];
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
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + startX.value;
      translateY.value = event.translationY + startY.value;
      rotate.value = (translateX.value / screenWidth) * 30;
    })
    .onEnd(() => {
      const shouldLike = translateX.value > 100;
      const shouldPass = translateX.value < -100;
      const shouldSuperLike = translateY.value < -100;

      if (shouldLike) {
        translateX.value = withSpring(screenWidth * 1.5);
        onLike && runOnJS(onLike)();
      } else if (shouldPass) {
        translateX.value = withSpring(-screenWidth * 1.5);
        onPass && runOnJS(onPass)();
      } else if (shouldSuperLike) {
        translateY.value = withSpring(-screenHeight * 1.5);
        onSuperLike && runOnJS(onSuperLike)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotate.value = withSpring(0);
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
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.imageContainer}>
            {profile.photoURL ? (
              <Image
                source={{ uri: profile.photoURL }}
                style={styles.image}
                contentFit="cover"
              />
            ) : (
              <View style={styles.placeholder}>
                <Avatar uri={profile.photoURL} size={120} placeholder />
              </View>
            )}

            <Animated.View style={[styles.likeLabel, likeOpacity, styles.labelLeft]}>
              <Text style={styles.likeLabelText}>{tx("circle.ProfileCard.like")}</Text>
            </Animated.View>

            <Animated.View style={[styles.likeLabel, passOpacity, styles.labelRight]}>
              <Text style={[styles.likeLabelText, styles.passLabel]}>{tx("circle.ProfileCard.pass")}</Text>
            </Animated.View>

            <Animated.View style={[styles.likeLabel, superLikeOpacity, styles.labelTop]}>
              <Text style={[styles.likeLabelText, styles.superLikeLabel]}>{tx("circle.ProfileCard.super")}</Text>
            </Animated.View>
          </View>

          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.age}>{profile.age}</Text>
            </View>

            {profile.bio && (
              <Text style={styles.bio} numberOfLines={2}>
                {profile.bio}
              </Text>
            )}

            <View style={styles.interests}>
              {profile.interests.slice(0, 3).map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{optionLabel(interest)}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </GestureDetector>

      <View style={styles.buttons}>
        <Button
          title={tx("circle.ProfileCard.pass2")}
          variant="outline"
          onPress={() => {
            translateX.value = withSpring(-screenWidth * 1.5);
            onPass?.();
          }}
          style={styles.button}
        />
        <Button
          title={tx("circle.ProfileCard.superLike")}
          variant="primary"
          onPress={() => {
            translateY.value = withSpring(-screenHeight * 1.5);
            onSuperLike?.();
          }}
          style={styles.button}
        />
        <Button
          title={tx("circle.ProfileCard.like2")}
          variant="primary"
          onPress={() => {
            translateX.value = withSpring(screenWidth * 1.5);
            onLike?.();
          }}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = createThemedStyles((Colors) => ({
  container: {
    alignItems: 'center',
  },
  card: {
    width: cardWidth,
    height: cardHeight,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  name: {
    ...Typography.h2,
  },
  age: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  bio: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  interestTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  interestText: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
  },
  likeLabel: {
    position: 'absolute',
    top: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 3,
  },
  labelLeft: {
    left: Spacing.lg,
    borderColor: Colors.success,
    transform: [{ rotate: '-20deg' }],
  },
  labelRight: {
    right: Spacing.lg,
    borderColor: Colors.danger,
    transform: [{ rotate: '20deg' }],
  },
  labelTop: {
    top: Spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
    borderColor: Colors.primary,
    transform: [{ rotate: '0deg' }],
  },
  likeLabelText: {
    ...Typography.h3,
    color: Colors.success,
    fontWeight: '800',
  },
  passLabel: {
    color: Colors.danger,
  },
  superLikeLabel: {
    color: Colors.primary,
  },
  buttons: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  button: {
    minWidth: 80,
  },
}));
