import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';

interface DualSliderProps {
  min: number;
  max: number;
  minDistance?: number;
  initialValue?: [number, number];
  onValueChange: (values: [number, number]) => void;
  height?: number;
}

export default function DualSlider({
  min,
  max,
  minDistance = 1,
  initialValue = [min, max],
  onValueChange,
  height = 40
}: DualSliderProps) {
  const [values, setValues] = useState(initialValue);
  const containerWidth = useSharedValue(0);

  const leftThumbX = useSharedValue(0);
  const rightThumbX = useSharedValue(0);

  const getPositionFromValue = (value: number, width: number) => {
    return ((value - min) / (max - min)) * width;
  };

  const getValueFromPosition = (position: number, width: number) => {
    return min + (position / width) * (max - min);
  };

  const leftPanGesture = Gesture.Pan()
    .onStart(() => {
      // Initialize position
    })
    .onUpdate((event) => {
      const newPosition = Math.max(0, Math.min(event.translationX + leftThumbX.value, containerWidth.value));
      const newLeftValue = getValueFromPosition(newPosition, containerWidth.value);
      const rightValue = getValueFromPosition(rightThumbX.value, containerWidth.value);

      if (newLeftValue <= rightValue - minDistance) {
        leftThumbX.value = newPosition;
      }
    })
    .onEnd(() => {
      const leftValue = getValueFromPosition(leftThumbX.value, containerWidth.value);
      const rightValue = getValueFromPosition(rightThumbX.value, containerWidth.value);
      const newValues: [number, number] = [
        Math.round(leftValue),
        Math.round(rightValue)
      ];
      setValues(newValues);
      onValueChange(newValues);
    });

  const rightPanGesture = Gesture.Pan()
    .onStart(() => {
      // Initialize position
    })
    .onUpdate((event) => {
      const newPosition = Math.max(0, Math.min(event.translationX + rightThumbX.value, containerWidth.value));
      const leftValue = getValueFromPosition(leftThumbX.value, containerWidth.value);
      const newRightValue = getValueFromPosition(newPosition, containerWidth.value);

      if (newRightValue >= leftValue + minDistance) {
        rightThumbX.value = newPosition;
      }
    })
    .onEnd(() => {
      const leftValue = getValueFromPosition(leftThumbX.value, containerWidth.value);
      const rightValue = getValueFromPosition(rightThumbX.value, containerWidth.value);
      const newValues: [number, number] = [
        Math.round(leftValue),
        Math.round(rightValue)
      ];
      setValues(newValues);
      onValueChange(newValues);
    });

  const leftThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftThumbX.value }],
  }));

  const rightThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightThumbX.value }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    left: leftThumbX.value,
    width: rightThumbX.value - leftThumbX.value,
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    containerWidth.value = event.nativeEvent.layout.width;
    leftThumbX.value = getPositionFromValue(values[0], containerWidth.value);
    rightThumbX.value = getPositionFromValue(values[1], containerWidth.value);
  };

  return (
    <View style={[styles.container, { height }]}>
      <View
        style={styles.track}
        onLayout={handleLayout}
      >
        <Animated.View style={[styles.activeTrack, trackStyle]} />

        <GestureDetector gesture={leftPanGesture}>
          <Animated.View style={[styles.thumb, leftThumbStyle]} />
        </GestureDetector>

        <GestureDetector gesture={rightPanGesture}>
          <Animated.View style={[styles.thumb, rightThumbStyle]} />
        </GestureDetector>
      </View>

      <View style={styles.labels}>
        <Text style={styles.label}>{values[0]}</Text>
        <Text style={styles.label}>{values[1]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  track: {
    height: 4,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.pill,
    position: 'relative' as const,
  },
  activeTrack: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    position: 'absolute' as const,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    position: 'absolute' as const,
    top: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});