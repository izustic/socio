import Button from '@/src/components/ui/Button';
import Input from '@/src/components/ui/Input';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { signInWithEmail, signUpWithEmail, signUpWithFacebook, signUpWithGoogle } from '@/src/services/auth';
import { makeRedirectUri } from 'expo-auth-session';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as Google from 'expo-auth-session/providers/google';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignUp() {
  const { user, profile, loading: authLoading } = useAuth();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectUri = makeRedirectUri({ scheme: 'demoapp' });

  // Google Auth
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    scopes: ['profile', 'email'],
    responseType: 'id_token',
    redirectUri,
  });

  // Facebook Auth
  const [facebookRequest, facebookResponse, promptFacebookAsync] = Facebook.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    responseType: 'token',
    scopes: ['public_profile', 'email'],
    redirectUri,
  });

  useEffect(() => {
    const processGoogleResponse = async () => {
      if (googleResponse?.type === 'success' && googleResponse.authentication) {
        try {
          setLoading(true);
          const { idToken, accessToken } = googleResponse.authentication;
          await signUpWithGoogle(idToken, accessToken);
        } catch (error: any) {
          console.error('Google sign in error:', error);
          Alert.alert('Google sign in failed', error.message || 'Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    processGoogleResponse();
  }, [googleResponse]);

  useEffect(() => {
    const processFacebookResponse = async () => {
      if (facebookResponse?.type === 'success' && facebookResponse.authentication) {
        try {
          setLoading(true);
          const { accessToken } = facebookResponse.authentication;
          await signUpWithFacebook(accessToken);
        } catch (error: any) {
          console.error('Facebook sign in error:', error);
          Alert.alert('Facebook sign in failed', error.message || 'Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    processFacebookResponse();
  }, [facebookResponse]);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      setShowEmailModal(false);
      setEmail('');
      setPassword('');
      // Auth state will handle navigation
    } catch (error: any) {
      console.error('Email auth error:', error);
      Alert.alert(
        'Error',
        error.message || 'Authentication failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleRequest) {
      Alert.alert('Google Auth', 'Google auth is not configured yet.');
      return;
    }

    try {
      await promptGoogleAsync();
    } catch (error: any) {
      console.error('Google prompt error:', error);
      Alert.alert('Error', 'Unable to open Google sign in.');
    }
  };

  const handleFacebookSignIn = async () => {
    if (!facebookRequest) {
      Alert.alert('Facebook Auth', 'Facebook auth is not configured yet.');
      return;
    }

    try {
      await promptFacebookAsync();
    } catch (error: any) {
      console.error('Facebook prompt error:', error);
      Alert.alert('Error', 'Unable to open Facebook sign in.');
    }
  };

  if (!authLoading && user && !profile?.profileComplete) {
    return <Redirect href="/(auth)/create-profile" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topSection}>
        <View style={styles.logoMark} />
        <Text style={styles.logo}>socio</Text>
        <Text style={styles.tagline}>Your circle starts here.</Text>
      </View>
      <View style={styles.bottomSection}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.socialButton, (loading || !googleRequest) && styles.disabled]}
          onPress={handleGoogleSignIn}
          disabled={loading || !googleRequest}
        >
          <Text style={styles.socialIcon}>G</Text>
          <Text style={styles.socialText}>Continue with Google</Text>
          <View style={styles.iconSpacer} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.socialButton, (loading || !facebookRequest) && styles.disabled]}
          onPress={handleFacebookSignIn}
          disabled={loading || !facebookRequest}
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
          activeOpacity={0.7}
          style={styles.loginRow}
          onPress={() => {
            setIsSignUp(false);
            setShowEmailModal(true);
          }}
        >
          <Text style={styles.loginText}>Already have an account? </Text>
          <Text style={styles.loginHighlight}>Log in</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showEmailModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowEmailModal(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
              <Text style={styles.modalTitle}>{isSignUp ? 'Create Account' : 'Login'}</Text>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View>
                <Input
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
              <Button
                title={loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
                onPress={handleEmailAuth}
                disabled={loading}
              />
              <Button
                title={isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                variant="ghost"
                onPress={() => setIsSignUp(!isSignUp)}
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
    backgroundColor: Colors.primary,
  },
  topSection: {
    flex: 0.45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMark: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(26,26,26,0.08)',
    marginBottom: Spacing.md,
  },
  logo: {
    ...Typography.display,
  },
  tagline: {
    ...Typography.body,
    color: 'rgba(26,26,26,0.6)',
    marginTop: Spacing.sm,
  },
  bottomSection: {
    flex: 0.55,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  socialButton: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  socialText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  socialIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    width: 20,
    textAlign: 'center',
  },
  facebookIcon: {
    color: '#1877F2',
  },
  iconSpacer: {
    width: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerText: {
    ...Typography.bodySmall,
    marginHorizontal: Spacing.md,
  },
  loginRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    ...Typography.bodySmall,
  },
  loginHighlight: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: Spacing.md,
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.textPrimary,
  },
  formContainer: {
    paddingHorizontal: Spacing.screenPadding,
  },
  formContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  passwordToggle: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  eyeIcon: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});