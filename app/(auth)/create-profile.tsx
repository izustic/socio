import { colors } from '@/src/constants/colors';
import { useAuth } from '@/src/context/AuthContext';
import { getLocationWithCity, requestLocationPermission } from '@/src/services/location';
import { createUserProfile } from '@/src/services/user';
import { Interest } from '@/src/types';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Your Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Gender"
        value={gender}
        onChangeText={setGender}
      />
      <Text style={styles.label}>Interests</Text>
      <View style={styles.interests}>
        {interests.map(interest => (
          <TouchableOpacity
            key={interest}
            style={[
              styles.interestChip,
              selectedInterests.includes(interest) && styles.selectedChip,
            ]}
            onPress={() => toggleInterest(interest)}
          >
            <Text style={styles.chipText}>{interest}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Education"
        value={education}
        onChangeText={setEducation}
      />
      <TextInput
        style={[styles.input, styles.bio]}
        placeholder="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
      />
      <TouchableOpacity style={styles.locationButton} onPress={handleGetLocation}>
        <Text style={styles.locationButtonText}>
          {location ? `Location: ${location.city || 'Unknown'}` : 'Get My Location'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Continue'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  bio: {
    height: 80,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  interestChip: {
    backgroundColor: colors.backgroundCard,
    padding: 10,
    borderRadius: 20,
    margin: 5,
  },
  selectedChip: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  locationButton: {
    backgroundColor: colors.backgroundCard,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  locationButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
  },
});