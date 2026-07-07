import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import {
  sendEmailVerificationCode,
  verifyEmailVerificationCode,
} from '@/src/services/auth';
import { showErrorAlert } from '@/src/utils/errorHandling';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 45;

const getSecondsUntilResend = (sentAt: number | null) => {
  if (!sentAt) return 0;
  const elapsedSeconds = Math.floor((Date.now() - sentAt) / 1000);
  return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsedSeconds);
};

export default function OtpScreen() {
  const { draft, mergeDraft, setStep } = useOnboarding();
  const [otp, setOtp] = useState(Array(CODE_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(
    getSecondsUntilResend(draft.emailVerificationCodeSentAt),
  );
  const sentInitialCode = useRef(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const email = draft.contactHint;
  const token = useMemo(() => otp.join(''), [otp]);
  const complete = token.length === CODE_LENGTH;

  useEffect(() => {
    if (!draft.emailVerificationRequired || draft.emailVerified) {
      setStep('location-permission');
    }
  }, [draft.emailVerificationRequired, draft.emailVerified, setStep]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown(getSecondsUntilResend(draft.emailVerificationCodeSentAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [draft.emailVerificationCodeSentAt]);

  useEffect(() => {
    if (
      sentInitialCode.current ||
      !draft.emailVerificationRequired ||
      draft.emailVerificationCodeSentAt ||
      !email
    ) {
      return;
    }

    sentInitialCode.current = true;
    sendEmailVerificationCode(email)
      .then(() => {
        mergeDraft({ emailVerificationCodeSentAt: Date.now() });
      })
      .catch((error) => {
        const errorAlert = showErrorAlert(error, 'Email verification');
        Alert.alert(errorAlert.title, errorAlert.message);
      });
  }, [
    draft.emailVerificationCodeSentAt,
    draft.emailVerificationRequired,
    email,
    mergeDraft,
  ]);

  const focusInput = (index: number) => {
    inputs.current[index]?.focus();
  };

  const setCodeFromText = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (!clean) {
      const next = [...otp];
      next[index] = '';
      setOtp(next);
      return;
    }

    const next = [...otp];
    clean
      .slice(0, CODE_LENGTH - index)
      .split('')
      .forEach((digit, offset) => {
        next[index + offset] = digit;
      });
    setOtp(next);

    const nextFocusIndex = Math.min(index + clean.length, CODE_LENGTH - 1);
    focusInput(nextFocusIndex);
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key !== 'Backspace' || otp[index] || index === 0) return;
    focusInput(index - 1);
  };

  const handleVerify = async () => {
    if (!email || !complete) return;

    setVerifying(true);
    try {
      await verifyEmailVerificationCode(email, token);
      mergeDraft({
        emailVerified: true,
        emailVerificationRequired: false,
      });
      setStep('location-permission');
    } catch (error) {
      const errorAlert = showErrorAlert(error, 'Email verification');
      Alert.alert(errorAlert.title, errorAlert.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) return;

    setResending(true);
    try {
      await sendEmailVerificationCode(email);
      setOtp(Array(CODE_LENGTH).fill(''));
      mergeDraft({ emailVerificationCodeSentAt: Date.now() });
      inputs.current[0]?.focus();
    } catch (error) {
      const errorAlert = showErrorAlert(error, 'Email verification');
      Alert.alert(errorAlert.title, errorAlert.message);
    } finally {
      setResending(false);
    }
  };

  const resendLabel =
    cooldown > 0
      ? `Resend in 0:${cooldown.toString().padStart(2, '0')}`
      : resending
        ? 'Sending...'
        : 'Resend code';

  return (
    <OnboardingLayout
      title="Verify your email"
      subtitle={`Enter the 6-digit code we sent to ${email || 'your email'}.`}
      stepNumber="02  EMAIL VERIFICATION"
      primaryLabel="Verify"
      onPrimaryPress={handleVerify}
      primaryDisabled={!complete || verifying || resending}
      primaryLoading={verifying}
      secondaryLabel={resendLabel}
      onSecondaryPress={handleResend}
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
            onChangeText={(value) => setCodeFromText(value, index)}
            onKeyPress={({ nativeEvent }) =>
              handleKeyPress(nativeEvent.key, index)
            }
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            textAlign="center"
          />
        ))}
      </View>
      <Text style={styles.caption}>
        Didn&apos;t get the code? Check spam, then resend when the timer ends.
      </Text>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  input: {
    width: 48,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: '#F7F4EB',
    fontSize: 26,
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
