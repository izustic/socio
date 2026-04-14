import { colors } from '@/src/constants/colors';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

export default function LottieSplashScreen() {
  const animationRef = useRef<LottieView>(null);

  const handleAnimationFinish = () => {
    router.replace('/(auth)/sign-up');
  };

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        source={require('../../assets/animations/logo_coalescence_animation.json')}
        autoPlay
        loop={false}
        onAnimationFinish={handleAnimationFinish}
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  animation: {
    width: 200,
    height: 200,
  },
});