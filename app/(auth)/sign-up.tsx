import { colors } from '@/src/constants/colors';
import { signInWithEmail, signUpWithEmail, signUpWithFacebook, signUpWithGoogle } from '@/src/services/auth';
import * as AuthSession from 'expo-auth-session';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as Google from 'expo-auth-session/providers/google';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignUp() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Google Auth
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    scopes: ['profile', 'email'],
    responseType: 'id_token',
  });

  // Facebook Auth
  const [facebookRequest, facebookResponse, promptFacebookAsync] = Facebook.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    responseType: 'token',
    scopes: ['public_profile', 'email'],
    redirectUri: AuthSession.makeRedirectUri(),
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

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.logo}>socio</Text>
        <Text style={styles.tagline}>Your circle starts here.</Text>
      </View>
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.button, (loading || !googleRequest) && styles.disabled]}
          onPress={handleGoogleSignIn}
          disabled={loading || !googleRequest}
        >
          <Text style={styles.buttonText}>Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, (loading || !facebookRequest) && styles.disabled]}
          onPress={handleFacebookSignIn}
          disabled={loading || !facebookRequest}
        >
          <Text style={styles.buttonText}>Continue with Facebook</Text>
        </TouchableOpacity>
        <Text style={styles.divider}>or</Text>
        <TouchableOpacity
          style={styles.link}
          onPress={() => {
            setIsSignUp(true);
            setShowEmailModal(true);
          }}
        >
          <Text style={styles.linkText}>Sign up with Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.link}
          onPress={() => {
            setIsSignUp(false);
            setShowEmailModal(true);
          }}
        >
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showEmailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => setShowEmailModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.modalTitle}>
                {isSignUp ? 'Create Account' : 'Login'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholderTextColor={colors.textSecondary}
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabled]}
                onPress={handleEmailAuth}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsSignUp(!isSignUp)}
                style={styles.toggleButton}
              >
                <Text style={styles.toggleText}>
                  {isSignUp
                    ? 'Already have an account? Login'
                    : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  topSection: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
  },
  bottomSection: {
    flex: 2,
    padding: 20,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 25,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    textAlign: 'center',
    marginVertical: 20,
    color: colors.textSecondary,
  },
  link: {
    alignItems: 'center',
    marginBottom: 10,
  },
  linkText: {
    color: colors.primary,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 15,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  formContainer: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: colors.textPrimary,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 8,
    marginBottom: 15,
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  passwordToggle: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  disabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
  },
});