import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import {
  env,
  getMissingRequiredEnvVars } from "@/src/config/env";
import { Colors,
  Radius,
  Spacing,
  Typography } from "@/src/constants/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import { getFirstIncompleteOnboardingStep } from "@/src/constants/onboarding";
import {
  sendEmailVerificationCode,
  signInWithEmail,
  signInWithGoogleIdToken,
  signUpWithEmail,
  } from "@/src/services/auth";
import { getUserProfile } from "@/src/services/user";
import { showErrorAlert } from "@/src/utils/errorHandling";
import { Image } from "expo-image";
import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import { useCallback,
  useEffect,
  useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import type { OnboardingDraft } from "@/src/context/OnboardingContext";

export default function SignUp() {
  const { beginOnboarding } = useOnboarding();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const googleWebClientId = env.googleWebClientId;
  const googleIosClientId = env.googleIosClientId;
  const canUseGoogleSignIn = Boolean(googleWebClientId) && Platform.OS !== "web";

  const ensureAuthConfigured = () => {
    const missing = getMissingRequiredEnvVars();
    if (missing.length === 0) {
      return true;
    }

    Alert.alert(
      "App not configured",
      `This build is missing: ${missing.join(", ")}.\n\n` +
        "Local dev reads these from .env. EAS builds need the same values set as project environment variables (`eas env:create` or Expo dashboard).",
    );
    return false;
  };

  useEffect(() => {
    if (!canUseGoogleSignIn || !googleWebClientId) {
      return;
    }

    GoogleSignin.configure({
      webClientId: googleWebClientId,
      iosClientId: googleIosClientId || undefined,
      scopes: ["profile", "email"],
    });
  }, [canUseGoogleSignIn, googleWebClientId, googleIosClientId]);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
  };

  const continueIntoOnboarding = useCallback(
    async (
      uid: string,
      contactHint: string,
      seed?: Partial<OnboardingDraft>,
    ) => {
      const existingProfile = await getUserProfile(uid);
      if (existingProfile?.profileComplete) {
        router.replace("/(tabs)/home");
        return;
      }

      const nextDraft: OnboardingDraft = existingProfile
        ? {
            contactHint,
            emailVerificationRequired:
              seed?.emailVerificationRequired ?? false,
            emailVerified: seed?.emailVerified ?? false,
            emailVerificationCodeSentAt:
              seed?.emailVerificationCodeSentAt ?? null,
            name: existingProfile.name || seed?.name || "",
            bio: existingProfile.bio || "",
            age: existingProfile.age || 24,
            gender: existingProfile.gender || null,
            media: existingProfile.media || [],
            interests: existingProfile.interests || [],
            traits: existingProfile.traits || [],
            education: existingProfile.education || "",
            photoURL: existingProfile.photoURL || seed?.photoURL || "",
            location: existingProfile.location || null,
            locationEnabled: Boolean(existingProfile.locationEnabled),
            locationPermissionResolved: Boolean(existingProfile.locationEnabled),
            notificationsEnabled:
              existingProfile.notificationsEnabled ?? false,
            notificationsPermissionResolved: Boolean(
              existingProfile.notificationsEnabled,
            ),
          }
        : {
            contactHint,
            emailVerificationRequired:
              seed?.emailVerificationRequired ?? false,
            emailVerified: seed?.emailVerified ?? false,
            emailVerificationCodeSentAt:
              seed?.emailVerificationCodeSentAt ?? null,
            name: seed?.name || "",
            bio: "",
            age: 24,
            gender: null,
            media: [],
            interests: [],
            traits: [],
            education: "",
            photoURL: seed?.photoURL || "",
            location: null,
            locationEnabled: false,
            locationPermissionResolved: false,
            notificationsEnabled: false,
            notificationsPermissionResolved: false,
          };

      beginOnboarding(
        nextDraft,
        getFirstIncompleteOnboardingStep(nextDraft),
      );
    },
    [beginOnboarding],
  );

  const handleGoogleSignIn = async () => {
    if (!canUseGoogleSignIn || !googleWebClientId) {
      Alert.alert(
        "Google Sign In",
        "Google sign-in is not configured for this build. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to the web OAuth client ID.",
      );
      return;
    }

    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const nonce = Platform.OS === "ios" ? Crypto.randomUUID() : undefined;
      const googleNonce = nonce
        ? await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            nonce,
          )
        : undefined;
      const response = await GoogleSignin.signIn(
        googleNonce ? { nonce: googleNonce } : undefined,
      );
      if (!isSuccessResponse(response)) {
        return;
      }

      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken || response.data.idToken;
      if (!idToken) {
        throw new Error("No ID token received from Google");
      }

      if (!ensureAuthConfigured()) {
        return;
      }

      const user = await signInWithGoogleIdToken(
        idToken,
        tokens.accessToken,
        nonce,
      );
      await continueIntoOnboarding(
        user.id,
        user.email || "your Google account",
        {
          emailVerificationRequired: false,
          emailVerified: true,
          name: (user.user_metadata?.display_name as string) || "",
          photoURL: (user.user_metadata?.avatar_url as string) || "",
        },
      );
    } catch (error: any) {
      if (
        isErrorWithCode(error) &&
        error.code === statusCodes.SIGN_IN_CANCELLED
      ) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error ?? "");
      const isDeveloperError =
        errorMessage.includes("DEVELOPER_ERROR") ||
        (isErrorWithCode(error) && error.code === "10");

      if (isDeveloperError) {
        Alert.alert(
          "Google Sign-In not configured for this build",
          "EAS builds are signed with a different certificate than local dev. " +
            "Add the EAS keystore SHA-1 to Google Cloud Console:\n\n" +
            "1. Run: eas credentials -p android\n" +
            "2. Open Credentials → Android OAuth client\n" +
            "3. Create a client for package com.izustic.socio with that SHA-1\n" +
            "4. Keep EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as the Web client ID\n\n" +
            "Changes apply without rebuilding — wait a few minutes, then try again.",
        );
        return;
      }

      console.error("Google sign in error:", error);
      const errorInfo = showErrorAlert(error, "Google Sign In");
      Alert.alert(errorInfo.title, errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!ensureAuthConfigured()) {
      return;
    }

    clearErrors();

    // Validate inputs first
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    try {
      const user = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);

      if (!user) {
        throw new Error("Authentication failed");
      }

      const emailConfirmedAt =
        user.email_confirmed_at || user.confirmed_at || null;
      const requiresEmailVerification = isSignUp || !emailConfirmedAt;
      let codeSentAt: number | null = null;

      if (requiresEmailVerification) {
        await sendEmailVerificationCode(email);
        codeSentAt = Date.now();
      }

      setShowEmailModal(false);
      setPassword("");
      await continueIntoOnboarding(user.id, email, {
        emailVerificationRequired: requiresEmailVerification,
        emailVerified: !requiresEmailVerification,
        emailVerificationCodeSentAt: codeSentAt,
        name: (user.user_metadata?.display_name as string) || "",
      });
    } catch (error: any) {
      console.error("Email auth error:", error);
      const errorAlert = showErrorAlert(
        error,
        isSignUp ? "Sign Up" : "Sign In",
      );
      Alert.alert(errorAlert.title, errorAlert.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.hero}>
        <View style={styles.logoBadge}>
          <Image
            source={require("../../assets/images/logo-black.png")}
            contentFit="contain"
            style={styles.logo}
          />
        </View>
        <Text style={styles.title}>One Circle. Real friendships.</Text>
        <Text style={styles.subtitle}>
          Form one meaningful friend group through shared interests and
          real-life meetups.
        </Text>
      </View>

      <View style={styles.actions}>
        {canUseGoogleSignIn ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.socialButton, loading && styles.disabled]}
            disabled={loading}
            onPress={handleGoogleSignIn}
          >
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialText}>Continue with Google</Text>
            <View style={styles.iconSpacer} />
          </TouchableOpacity>
        ) : null}

        {canUseGoogleSignIn ? (
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
        ) : null}

        <Button
          title="Sign up with Email"
          variant="ghost"
          onPress={() => {
            setIsSignUp(true);
            setShowEmailModal(true);
          }}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.loginRow}
          onPress={() => {
            setIsSignUp(false);
            setShowEmailModal(true);
          }}
        >
          <Text style={styles.loginText}>Already have an account? </Text>
          <Text style={styles.loginAccent}>Log in</Text>
        </TouchableOpacity>

        <LegalConsentText />
      </View>

      <Modal visible={showEmailModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modal}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowEmailModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>
                {isSignUp ? "Create your account" : "Welcome back"}
              </Text>
              <Text style={styles.modalSubtitle}>
                {isSignUp
                  ? "We will use this to set up your Circle."
                  : "Pick up where you left off."}
              </Text>

              <View>
                <Input
                  placeholder="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) validateEmail(text);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}
              </View>

              <View>
                <Input
                  placeholder="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) validatePassword(text);
                  }}
                  secureTextEntry={!showPassword}
                />
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title={
                  loading ? "Please wait..." : isSignUp ? "Continue" : "Log in"
                }
                onPress={handleEmailAuth}
                disabled={loading}
              />

              <LegalConsentText compact />

              <Button
                title={
                  isSignUp
                    ? "Already have an account? Log in"
                    : "Don't have an account? Sign up"
                }
                variant="ghost"
                onPress={() => setIsSignUp((prev) => !prev)}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function LegalConsentText({ compact = false }: { compact?: boolean }) {
  return (
    <Text style={[styles.terms, compact && styles.termsCompact]}>
      By continuing, you agree to Sociol&apos;s{" "}
      <Text
        style={styles.termsLink}
        onPress={() => router.push("/legal/terms")}
      >
        Terms of Use
      </Text>
      {" "}and acknowledge the{" "}
      <Text
        style={styles.termsLink}
        onPress={() => router.push("/legal/privacy")}
      >
        Privacy Policy
      </Text>
      .
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
  },
  hero: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 36,
    paddingHorizontal: 28,
    paddingVertical: 36,
    minHeight: 320,
    justifyContent: "flex-end",
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.32)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 38,
    height: 38,
  },
  title: {
    ...Typography.h1,
    fontSize: 40,
    lineHeight: 42,
    maxWidth: 260,
  },
  subtitle: {
    ...Typography.body,
    marginTop: Spacing.md,
    maxWidth: 250,
  },
  actions: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.md,
  },
  socialButton: {
    backgroundColor: "#F6F3EC",
    borderRadius: Radius.pill,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  socialIcon: {
    width: 20,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: "#DB4437",
  },
  socialText: {
    ...Typography.button,
    flex: 1,
    textAlign: "center",
  },
  iconSpacer: {
    width: 20,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    ...Typography.bodySmall,
  },
  loginAccent: {
    ...Typography.bodySmall,
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  terms: {
    ...Typography.bodySmall,
    textAlign: "center",
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
  },
  termsCompact: {
    marginTop: 0,
  },
  termsLink: {
    color: Colors.primaryDark,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17,17,17,0.24)",
  },
  modal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "80%",
  },
  closeButton: {
    alignSelf: "flex-end",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    marginRight: Spacing.md,
  },
  closeText: {
    ...Typography.h3,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: {
    ...Typography.h2,
  },
  modalSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  passwordToggle: {
    position: "absolute",
    right: 16,
    top: 14,
  },
  passwordToggleText: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  disabled: {
    opacity: 0.5,
  },
  errorText: {
    ...Typography.bodySmall,
    color: "#DB4437",
    marginTop: 4,
  },
});
