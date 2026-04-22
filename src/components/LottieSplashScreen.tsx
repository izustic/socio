import { Colors, Typography } from '@/src/constants/theme';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';

const MIN_SPLASH_DURATION_MS = 3500;

export default function LottieSplashScreen() {
  const animationRef = useRef<LottieView>(null);
  const mountedAtRef = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleAnimationFinish = () => {
    const elapsed = Date.now() - mountedAtRef.current;
    const remaining = Math.max(0, MIN_SPLASH_DURATION_MS - elapsed);

    if (remaining === 0) {
      router.replace('/(auth)/sign-up');
      return;
    }

    timeoutRef.current = setTimeout(() => {
      router.replace('/(auth)/sign-up');
    }, remaining);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LottieView
        ref={animationRef}
        source={require('../../assets/animations/logo_coalescence_animation.json')}
        autoPlay
        loop={false}
        onAnimationFinish={handleAnimationFinish}
        style={styles.animation}
      />
      <Text style={styles.logoText}>socio</Text>
      <Text style={styles.tagline}>Your circle starts here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  animation: {
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