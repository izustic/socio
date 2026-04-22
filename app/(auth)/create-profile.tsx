import Avatar from '@/src/components/ui/Avatar';
import Button from '@/src/components/ui/Button';
import Chip from '@/src/components/ui/Chip';
import Input from '@/src/components/ui/Input';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { getLocationWithCity, requestLocationPermission } from '@/src/services/location';
import { createUserProfile } from '@/src/services/user';
import { Interest } from '@/src/types';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const interests: Interest[] = ['Music', 'Travel', 'Books', 'Gaming', 'Fitness', 'Art', 'Food', 'Film'];

export default function CreateProfile() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [education, setEducation] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number; city?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: Interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleGetLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required to get your location.');
      return;
    }
    const loc = await getLocationWithCity();
    if (loc) {
      setLocation(loc);
      if (!loc.city) {
        Alert.alert(
          'Location captured',
          'We got your location, but could not determine your city name right now.'
        );
      }
    } else {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!name || !age || !gender || selectedInterests.length === 0 || !location) {
      Alert.alert('Error', 'Please fill all fields and get your location.');
      return;
    }

    setLoading(true);
    try {
      await createUserProfile(user.uid, {
        name,
        age: parseInt(age),
        gender: gender as any,
        interests: selectedInterests,
        education,
        location,
        photoURL: '',
        bio,
        profileComplete: true,
      });
      router.replace('/(app)');
    } catch (error) {
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Create Your Profile</Text>
          <Text style={styles.subtitle}>Tell us about yourself</Text>

          <View style={styles.avatarSection}>
            <Avatar size="xl" placeholder />
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
            <Text style={styles.avatarLabel}>Add photo</Text>
          </View>

          <Text style={styles.fieldLabel}>NAME</Text>
          <Input placeholder="Name" value={name} onChangeText={setName} />

          <Text style={styles.fieldLabel}>AGE</Text>
          <Input placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />

          <Text style={styles.fieldLabel}>GENDER</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female', 'Other'].map((option) => (
              <TouchableOpacity
                key={option}
                activeOpacity={0.7}
                style={[
                  styles.genderOption,
                  gender === option && styles.genderOptionSelected,
                ]}
                onPress={() => setGender(option)}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === option && styles.genderTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>YOUR INTERESTS</Text>
          <View style={styles.interests}>
            {interests.map((interest) => (
              <Chip
                key={interest}
                label={interest}
                selected={selectedInterests.includes(interest)}
                onPress={() => toggleInterest(interest)}
              />
            ))}
          </View>

          <Text style={styles.fieldLabel}>EDUCATION</Text>
          <Input placeholder="Education" value={education} onChangeText={setEducation} />

          <Text style={styles.fieldLabel}>BIO</Text>
          <Input
            placeholder="Tell us about yourself"
            value={bio}
            onChangeText={setBio}
            multiline
            style={styles.bio}
          />

          <Button
            title={location ? `Location: ${location.city || 'Unknown'}` : 'Get My Location'}
            variant="outline"
            onPress={handleGetLocation}
            style={styles.locationButton}
          />

          <View style={styles.bottomSpace} />
        </ScrollView>
        <View style={styles.footer}>
          <Button
            title={loading ? 'Creating...' : 'Continue'}
            onPress={handleSubmit}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 24,
    right: '33%',
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 16,
  },
  avatarLabel: {
    ...Typography.bodySmall,
    marginTop: Spacing.sm,
  },
  fieldLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: Colors.primary,
  },
  genderText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  genderTextSelected: {
    color: Colors.textPrimary,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  bio: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  locationButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.inputBg,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.background,
  },
  bottomSpace: {
    height: Spacing.lg,
  },
});