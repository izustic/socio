import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function OtpScreen() {
  const { draft, mergeDraft, setStep } = useOnboarding();
  const [otp, setOtp] = useState(['4', '8', '2', '1']);
  const inputs = useRef<(TextInput | null)[]>([]);

  const complete = useMemo(() => otp.every((digit) => digit.trim().length === 1), [otp]);

  const handleChange = (value: string, index: number) => {
    const clean = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[index] = clean;
    setOtp(next);

    if (clean && index < inputs.current.length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleContinue = () => {
    mergeDraft({
      contactHint: draft.contactHint || 'your account',
    });
    setStep('location-permission');
  };

  return (
    <OnboardingLayout
      onBackPress={() => {}}
      title="Verify your account"
      subtitle={`We sent a 4-digit code to ${draft.contactHint || 'your account'}.`}
      stepNumber="02  OTP VERIFICATION"
      primaryLabel="Verify"
      onPrimaryPress={handleContinue}
      primaryDisabled={!complete}
      secondaryLabel="Resend in 0:23"
      onSecondaryPress={() => setOtp([])}
      centerContent
    >
      <View style={styles.row}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            style={[styles.input, digit ? styles.inputFilled : null]}
            value={digit}
            onChangeText={(value) => handleChange(value, index)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
          />
        ))}
      </View>
      <Text style={styles.caption}>Didn&apos;t get the code? Tap above to resend.</Text>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  input: {
    width: 68,
    height: 78,
    borderRadius: Radius.md,
    backgroundColor: '#F7F4EB',
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  inputFilled: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
  },
  caption: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
