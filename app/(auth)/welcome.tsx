import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useOnboarding } from "@/src/context/OnboardingContext";
import {
  signInWithEmail,
  signInWithGoogleIdToken,
  signUpWithEmail,
  signUpWithFacebook,
} from "@/src/services/auth";
import { getUserProfile } from "@/src/services/user";
import { showErrorAlert } from "@/src/utils/errorHandling";
import { makeRedirectUri } from "expo-auth-session";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as Google from "expo-auth-session/providers/google";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

  const redirectUri = makeRedirectUri({ scheme: "socio" });

  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useAuthRequest({
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      scopes: ["profile", "email"],
      responseType: "id_token",
      redirectUri,
    });

  const [facebookRequest, facebookResponse, promptFacebookAsync] =
    Facebook.useAuthRequest({
      clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
      responseType: "token",
      scopes: ["public_profile", "email"],
      redirectUri,
    });

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
      seed?: { name?: string; photoURL?: string },
    ) => {
      const existingProfile = await getUserProfile(uid);
      if (existingProfile?.profileComplete) {
        router.replace("/(tabs)/home");
        return;
      }

      if (!existingProfile) {
        beginOnboarding(
          {
            contactHint,
            name: seed?.name || "",
            photoURL: seed?.photoURL || "",
          },
          "otp",
        );
        return;
      }
    },
    [beginOnboarding],
  );

  useEffect(() => {
    const processGoogleResponse = async () => {
      if (googleResponse?.type === "success" && googleResponse.authentication) {
        try {
          setLoading(true);
          const { idToken, accessToken } = googleResponse.authentication;
          if (!idToken) {
            throw new Error("No ID token received from Google");
          }
          const user = await signInWithGoogleIdToken(
            idToken,
            accessToken ?? undefined,
          );
          await continueIntoOnboarding(
            user.id,
            user.email || "your Google account",
            {
              name: (user.user_metadata?.display_name as string) || "",
              photoURL: (user.user_metadata?.avatar_url as string) || "",
            },
          );
        } catch (error: any) {
          console.error("Google sign in error:", error);
          const errorInfo = showErrorAlert(error, "Google Sign In");
          Alert.alert(errorInfo.title, errorInfo.message);
        } finally {
          setLoading(false);
        }
      }
    };
    processGoogleResponse();
  }, [googleResponse, continueIntoOnboarding]);

  useEffect(() => {
    const processFacebookResponse = async () => {
      if (
        facebookResponse?.type === "success" &&
        facebookResponse.authentication
      ) {
        try {
          setLoading(true);
          const { accessToken } = facebookResponse.authentication;
          const user = await signUpWithFacebook(accessToken);
          await continueIntoOnboarding(
            user.id,
            user.email || "your Facebook account",
            {
              name: (user.user_metadata?.display_name as string) || "",
              photoURL: (user.user_metadata?.avatar_url as string) || "",
            },
          );
        } catch (error: any) {
          console.error("Facebook sign in error:", error);
          const errorInfo = showErrorAlert(error, "Facebook Sign In");
          Alert.alert(errorInfo.title, errorInfo.message);
        } finally {
          setLoading(false);
        }
      }
    };
    processFacebookResponse();
  }, [facebookResponse, continueIntoOnboarding]);

  const handleEmailAuth = async () => {
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

      setShowEmailModal(false);
      setPassword("");
      await continueIntoOnboarding(user.id, email, {
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
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.socialButton,
            (!googleRequest || loading) && styles.disabled,
          ]}
          disabled={!googleRequest || loading}
          onPress={() => promptGoogleAsync()}
        >
          <Text style={styles.socialIcon}>G</Text>
          <Text style={styles.socialText}>Continue with Google</Text>
          <View style={styles.iconSpacer} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.socialButton,
            (!facebookRequest || loading) && styles.disabled,
          ]}
          disabled={!facebookRequest || loading}
          onPress={() => promptFacebookAsync()}
        >
          <Text style={[styles.socialIcon, styles.facebookIcon]}>f</Text>
          <Text style={styles.socialText}>Continue with Facebook</Text>
          <View style={styles.iconSpacer} />
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

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

        <Text style={styles.terms}>
          By continuing you agree to our Terms & Privacy.
        </Text>
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
  facebookIcon: {
    color: "#1877F2",
    fontSize: 18,
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
