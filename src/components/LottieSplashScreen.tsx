import { Colors, Typography } from '@/src/constants/theme';
import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import animationData from '../../assets/animations/logo_coalescence_animation.json';

interface LottieSplashScreenProps {
  minDurationMs?: number;
  onComplete?: () => void;
}

export default function LottieSplashScreen({
  minDurationMs = 3500,
  onComplete,
}: LottieSplashScreenProps) {
  const animationRef = useRef<LottieView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompleted = useRef(false); 
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const hasRenderableAnimation =
    Array.isArray((animationData as { layers?: unknown[] }).layers) &&
    (animationData as { layers?: unknown[] }).layers!.length > 0;

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (hasCompleted.current) return;
      hasCompleted.current = true;
      onCompleteRef.current?.(); 
    }, minDurationMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [minDurationMs]);

  // const hasRenderableAnimation =
  //   Array.isArray((animationData as { layers?: unknown[] }).layers) &&
  //   (animationData as { layers?: unknown[] }).layers!.length > 0;

  // useEffect(() => {
  //   timeoutRef.current = setTimeout(() => {
  //     onComplete?.();
  //   }, minDurationMs);

  //   return () => {
  //     if (timeoutRef.current) {
  //       clearTimeout(timeoutRef.current);
  //     }
  //   };
  // }, [minDurationMs, onComplete]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {hasRenderableAnimation ? (
        <LottieView
          ref={animationRef}
          source={animationData}
          autoPlay
          loop={false}
          style={styles.animation}
        />
      ) : (
        <Image
          source={require('../../assets/images/logo.png')}
          contentFit="contain"
          style={styles.animationFallback}
        />
      )}
      <Text style={styles.logoText}>sociol</Text>
      <Text style={styles.tagline}>The real social network</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  animation: {
    width: 160,
    height: 160,
  },
  animationFallback: {
    width: 160,
    height: 160,
  },
  logoText: {
    ...Typography.display,
    fontSize: 36,
    marginTop: 8,
  },
  tagline: {
    ...Typography.body,
    color: 'rgba(26,26,26,0.6)',
    marginTop: 8,
  },
});
