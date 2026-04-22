import Button from '@/src/components/ui/Button';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function OTP() {
  const [otp, setOtp] = useState(['', '', '', '']);

  const handleChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto focus next
    if (value && index < 3) {
      // Focus next input
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <TouchableOpacity activeOpacity={0.7} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Verify Your Account</Text>
      <Text style={styles.subtitle}>Enter the 4-digit code we sent you</Text>
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            style={[styles.otpInput, digit ? styles.activeInput : null]}
            value={digit}
            onChangeText={(value) => handleChange(value, index)}
            keyboardType="numeric"
            maxLength={1}
          />
        ))}
      </View>
      <View style={styles.resendRow}>
        <Text style={styles.resendCopy}>Didn&apos;t receive a code? </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.resendText}>Resend</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomCta}>
        <Button title="Continue" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.screenPadding,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  backText: {
    ...Typography.h3,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodySmall,
    marginBottom: Spacing.xl,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  otpInput: {
    width: 64,
    height: 64,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  activeInput: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  resendCopy: {
    ...Typography.bodySmall,
  },
  resendText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  bottomCta: {
    marginTop: 'auto',
    paddingBottom: Spacing.md,
  },
});