import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import {
  env,
  getMissingRequiredEnvVars } from "@/src/config/env";
import { createThemedStyles, Radius,
  Spacing,
  Typography } from "@/src/constants/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import { getFirstIncompleteOnboardingStep } from "@/src/constants/onboarding";
import {
  requiresEmailOnboardingVerification,
  sendEmailVerificationCode,
  signInWithEmail,
  signInWithGoogleIdToken,
  signUpOrSignInWithEmail,
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
import { tx } from "@/src/utils/localization";
import { useTheme } from "@/src/providers/ThemeProvider";
import { Mail } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";

export default function SignUp() {
  const { colorScheme } = useTheme();
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
      tx("app.auth.welcome.appNotConfigured"),
      tx("app.auth.welcome.thisBuildIsMissingValue1", { value1: missing.join(", ") }) +
        tx("app.auth.welcome.localDevReadsTheseFromEnvEasBuildsNeed"),
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
      setEmailError(tx("validation.emailRequired"));
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError(tx("validation.emailInvalid"));
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError(tx("validation.passwordRequired"));
      return false;
    }
    if (password.length < 6) {
      setPasswordError(tx("validation.passwordLength"));
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
        tx("app.auth.welcome.googleSignIn"),
        tx("app.auth.welcome.googleSignInIsNotConfiguredForThisBuild"),
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
        user.email || tx("auth.yourGoogleAccount"),
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
          tx("app.auth.welcome.googleSignInNotConfiguredForThisBuild"),
          tx("app.auth.welcome.easBuildsAreSignedWithADifferentCertificateThan") +
            tx("app.auth.welcome.addTheEasKeystoreSha1ToGoogleCloud") +
            tx("app.auth.welcome.1RunEasCredentialsPAndroid") +
            tx("app.auth.welcome.2OpenCredentialsAndroidOauthClient") +
            tx("app.auth.welcome.3CreateAClientForPackageComIzusticSocio") +
            tx("app.auth.welcome.4KeepExpoPublicGoogleWebClientIdAs") +
            tx("app.auth.welcome.changesApplyWithoutRebuildingWaitAFewMinutesThen"),
        );
        return;
      }

      console.error("Google sign in error:", error);
      const errorInfo = showErrorAlert(error, tx("auth.googleSignIn"));
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
      const signupResult = isSignUp
        ? await signUpOrSignInWithEmail(email, password)
        : null;
      const user = signupResult?.user ?? await signInWithEmail(email, password);

      if (!user) {
        throw new Error("Authentication failed");
      }

      const authenticationMode = signupResult?.mode ?? "signed-in";
      const requiresEmailVerification =
        authenticationMode !== "signed-in" ||
        requiresEmailOnboardingVerification(user);

      if (
        authenticationMode !== "signed-up" &&
        requiresEmailVerification
      ) {
        await sendEmailVerificationCode(email);
      }

      setShowEmailModal(false);
      setPassword("");
      await continueIntoOnboarding(user.id, email, {
        emailVerificationRequired: requiresEmailVerification,
        emailVerified: !requiresEmailVerification,
        emailVerificationCodeSentAt: requiresEmailVerification
          ? Date.now()
          : null,
        name: (user.user_metadata?.display_name as string) || "",
      });
    } catch (error: any) {
      console.error("Email auth error:", error);
      const errorAlert = showErrorAlert(
        error,
        isSignUp ? tx("auth.signUp") : tx("auth.signIn"),
      );
      Alert.alert(errorAlert.title, errorAlert.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <View style={[styles.hero, colorScheme === "dark" && styles.heroDark]}>
        <View style={[styles.logoBadge, colorScheme === "dark" && styles.logoBadgeDark]}>
          <Image
            source={require("../../assets/images/logo-black.png")}
            contentFit="contain"
            style={styles.logo}
          />
        </View>
        <Text style={[styles.title, colorScheme === "dark" && styles.titleDark]}>{tx("app.auth.welcome.oneCircleRealFriendships")}</Text>
        <Text style={[styles.subtitle, colorScheme === "dark" && styles.subtitleDark]}>
          {tx("app.auth.welcome.formOneMeaningfulFriendGroupThroughSharedInterestsAnd")}</Text>
      </View>

      <View style={styles.actions}>
        {canUseGoogleSignIn ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.socialButton, loading && styles.disabled]}
            disabled={loading}
            onPress={handleGoogleSignIn}
          >
            <GoogleIcon />
            <Text
              style={[
                styles.socialText,
                colorScheme === "dark" && styles.socialTextDark,
              ]}
            >
              {tx("app.auth.welcome.continueWithGoogle")}
            </Text>
            <View style={styles.iconSpacer} />
          </TouchableOpacity>
        ) : null}

        {canUseGoogleSignIn ? (
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{tx("app.auth.welcome.or")}</Text>
            <View style={styles.dividerLine} />
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.emailButton}
          onPress={() => {
            setIsSignUp(true);
            setShowEmailModal(true);
          }}
        >
          <Mail color={styles.emailButtonText.color} size={20} strokeWidth={1.8} />
          <Text style={styles.emailButtonText}>
            {tx("app.auth.welcome.signUpWithEmail")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.loginRow}
          onPress={() => {
            setIsSignUp(false);
            setShowEmailModal(true);
          }}
        >
          <Text style={styles.loginText}>{tx("app.auth.welcome.alreadyHaveAnAccount")} </Text>
          <Text style={styles.loginAccent}>{tx("app.auth.welcome.logIn")}</Text>
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
                {isSignUp ? tx("app.auth.welcome.createYourAccount") : tx("app.auth.welcome.welcomeBack")}
              </Text>
              <Text style={styles.modalSubtitle}>
                {isSignUp
                  ? tx("app.auth.welcome.weWillUseThisToSetUpYourCircle")
                  : tx("app.auth.welcome.pickUpWhereYouLeftOff")}
              </Text>

              <View>
                <Input
                  placeholder={tx("app.auth.welcome.email")}
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
                  placeholder={tx("app.auth.welcome.password")}
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
                    {showPassword ? tx("app.auth.welcome.hide") : tx("app.auth.welcome.show")}
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title={
                  loading ? tx("app.auth.welcome.pleaseWait") : isSignUp ? tx("app.auth.welcome.continue") : tx("app.auth.welcome.logIn")
                }
                onPress={handleEmailAuth}
                disabled={loading}
              />

              <LegalConsentText compact />

              <Button
                title={
                  isSignUp
                    ? tx("app.auth.welcome.alreadyHaveAnAccountLogIn")
                    : tx("app.auth.welcome.donTHaveAnAccountSignUp")
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

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 18 18" accessibilityLabel="Google">
      <Path
        fill="#4285F4"
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.715v2.258h2.909c1.702-1.567 2.684-3.874 2.684-6.614Z"
      />
      <Path
        fill="#34A853"
        d="M9 18c2.43 0 4.468-.806 5.956-2.181l-2.909-2.258c-.806.54-1.835.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A8.998 8.998 0 0 0 9 18Z"
      />
      <Path
        fill="#FBBC05"
        d="M3.963 10.706A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.168.281-1.706V4.962H.956A8.997 8.997 0 0 0 0 9c0 1.452.347 2.827.956 4.038l3.007-2.332Z"
      />
      <Path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.507.454 3.441 1.346l2.581-2.581C13.464.892 11.426 0 9 0A8.998 8.998 0 0 0 .956 4.962l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z"
      />
    </Svg>
  );
}

function LegalConsentText({ compact = false }: { compact?: boolean }) {
  return (
    <Text style={[styles.terms, compact && styles.termsCompact]}>
      {tx("app.auth.welcome.byContinuingYouAgreeToSociolS")}{" "}
      <Text
        style={styles.termsLink}
        onPress={() => router.push("/legal/terms")}
      >
        {tx("app.auth.welcome.termsOfUse")}</Text>
      {" "}{tx("app.auth.welcome.andAcknowledgeThe")}{" "}
      <Text
        style={styles.termsLink}
        onPress={() => router.push("/legal/privacy")}
      >
        {tx("app.auth.welcome.privacyPolicy")}</Text>
      .
    </Text>
  );
}

const styles = createThemedStyles((Colors) => ({
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
  heroDark: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: "#5A4210",
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
  logoBadgeDark: {
    backgroundColor: Colors.primary,
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
  titleDark: {
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    marginTop: Spacing.md,
    maxWidth: 250,
  },
  subtitleDark: {
    color: Colors.textSecondary,
  },
  actions: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.lg,
  },
  socialButton: {
    minHeight: 52,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  socialText: {
    ...Typography.button,
    flex: 1,
    textAlign: "center",
  },
  socialTextDark: {
    color: "#FFFFFF",
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
  emailButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emailButtonText: {
    ...Typography.button,
    color: Colors.primaryDark,
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
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.danger,
    marginTop: 4,
  },
}));
