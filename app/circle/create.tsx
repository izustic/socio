import { SafeAreaView } from "react-native-safe-area-context";
import {
  Colors,
  Radius,
  Spacing,
  Typography } from '@/src/constants/theme';
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from 'expo-router';
import { ChevronLeft,
  ImagePlus,
  MapPin } from 'lucide-react-native';
import { useState } from 'react';
import {
  GestureResponderEvent,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const SIZE_OPTIONS = [3, 4, 5, 6, 7, 8];
const MEETUP_GOALS = ['Coffee', 'Study', 'Gym', 'Walk', 'Dinner'];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default function CreateCircleBasicsScreen() {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [vibe, setVibe] = useState('');
  const [size, setSize] = useState(5);
  const [radius, setRadius] = useState(8);
  const [radiusUnit, setRadiusUnit] = useState<'km' | 'mi'>('km');
  const [meetupGoal, setMeetupGoal] = useState('Coffee');
  const [meetupDays, setMeetupDays] = useState(3);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [dayTrackWidth, setDayTrackWidth] = useState(0);

  const handleRadiusPress = (event: GestureResponderEvent) => {
    if (!trackWidth) return;
    const ratio = clamp(event.nativeEvent.locationX / trackWidth, 0, 1);
    setRadius(Math.round(1 + ratio * 24));
  };

  const handleMeetupDaysPress = (event: GestureResponderEvent) => {
    if (!dayTrackWidth) return;
    const ratio = clamp(event.nativeEvent.locationX / dayTrackWidth, 0, 1);
    setMeetupDays(Math.round(3 + ratio * 7));
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
      presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    if (!name.trim()) {
      setNameError("Please name your Circle to continue.");
      return;
    }
    setNameError(null);
    router.push({
      pathname: '/circle/create-preferences',
        params: {
          name: name.trim(),
          vibe: vibe.trim(),
          size: String(size),
          radius: String(radius),
          radiusUnit,
          meetupGoal,
        meetupDays: String(meetupDays),
        imageUri: imageUri ?? "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.82} style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Circle</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressActive} />
        <View style={styles.progressInactive} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.stepLabel}>STEP 1 OF 2 · BASICS</Text>
        <Text style={styles.title}>Set up your Circle</Text>
        <Text style={styles.subtitle}>Name it, size it, pick where and what.</Text>

        <View style={styles.section}>
          <Text style={styles.label}>PHOTO</Text>
          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.imagePicker}
            onPress={handlePickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.circleImage} />
            ) : (
              <View style={styles.imageEmpty}>
                <ImagePlus size={28} color={Colors.textPrimary} strokeWidth={2.1} />
                <Text style={styles.imageTitle}>Add a Circle photo</Text>
                <Text style={styles.imageHint}>This appears on swipe cards.</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (nameError && value.trim()) setNameError(null);
            }}
            placeholder="Sunday Coffee Crew"
            placeholderTextColor={Colors.textDisabled}
            style={styles.input}
            autoCapitalize="words"
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>VIBE</Text>
          <TextInput
            value={vibe}
            onChangeText={setVibe}
            placeholder="Easygoing brunches, late-night talks, and zero pressure."
            placeholderTextColor={Colors.textDisabled}
            style={[styles.input, styles.multilineInput]}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>SIZE</Text>
          <View style={styles.sizeRow}>
            {SIZE_OPTIONS.map((option) => {
              const selected = size === option;
              return (
                <TouchableOpacity
                  key={option}
                  activeOpacity={0.82}
                  style={[styles.sizeChip, selected && styles.selectedChip]}
                  onPress={() => setSize(option)}
                >
                  <Text style={[styles.sizeText, selected && styles.selectedText]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.inlineLabel}>
              <MapPin size={14} color={Colors.textSecondary} strokeWidth={2.2} />
              <Text style={styles.label}>RADIUS</Text>
            </View>
            <Text style={styles.valueLabel}>{radius} {radiusUnit}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.sliderTrack}
            onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
            onPress={handleRadiusPress}
          >
            <View style={[styles.sliderFill, { width: `${((radius - 1) / 24) * 100}%` }]} />
            <View style={[styles.sliderThumb, { left: `${((radius - 1) / 24) * 100}%` }]} />
          </TouchableOpacity>
          <View style={styles.radiusMeta}>
            <Text style={styles.helperText}>Only people in range will be shown</Text>
            <View style={styles.segment}>
              {(['km', 'mi'] as const).map((unit) => {
                const selected = radiusUnit === unit;
                return (
                  <TouchableOpacity
                    key={unit}
                    activeOpacity={0.82}
                    style={[styles.segmentItem, selected && styles.segmentSelected]}
                    onPress={() => setRadiusUnit(unit)}
                  >
                    <Text style={[styles.segmentText, selected && styles.selectedText]}>{unit}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>MEETUP GOAL</Text>
          <View style={styles.goalGrid}>
            {MEETUP_GOALS.map((goal) => {
              const selected = meetupGoal === goal;
              return (
                <TouchableOpacity
                  key={goal}
                  activeOpacity={0.82}
                  style={[styles.goalChip, selected && styles.selectedChip]}
                  onPress={() => setMeetupGoal(goal)}
                >
                  <Text style={[styles.chipText, selected && styles.selectedText]}>{goal}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>DAY TO MEET</Text>
            <Text style={styles.valueLabel}>
              Within {meetupDays} {meetupDays === 1 ? 'day' : 'days'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.sliderTrack}
            onLayout={(event) => setDayTrackWidth(event.nativeEvent.layout.width)}
            onPress={handleMeetupDaysPress}
          >
            <View style={[styles.sliderFill, { width: `${((meetupDays - 3) / 7) * 100}%` }]} />
            <View style={[styles.sliderThumb, { left: `${((meetupDays - 3) / 7) * 100}%` }]} />
          </TouchableOpacity>
          <View style={styles.radiusMeta}>
            <Text style={styles.helperText}>3 days</Text>
            <Text style={styles.helperText}>10 days</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.88}
          disabled={!name.trim()}
          style={[styles.primaryButton, !name.trim() && styles.disabledButton]}
          onPress={handleNext}
        >
          <Text style={[styles.primaryButtonText, !name.trim() && styles.disabledButtonText]}>
            Next: Who you&apos;re looking for
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    minHeight: 62,
    paddingHorizontal: Spacing.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.screenPadding,
  },
  progressActive: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  progressInactive: {
    flex: 1,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: '#F5F5F5',
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 26,
  },
  stepLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  title: {
    ...Typography.h1,
    fontSize: 27,
    lineHeight: 32,
    marginTop: -16,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: -22,
  },
  section: {
    gap: 12,
  },
  imagePicker: {
    height: 176,
    borderRadius: 16,
    backgroundColor: "#F6F6F6",
    overflow: "hidden",
  },
  circleImage: {
    width: "100%",
    height: "100%",
  },
  imageEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  imageTitle: {
    ...Typography.body,
    fontWeight: "800",
  },
  imageHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    ...Typography.label,
  },
  valueLabel: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  input: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: '#F4F4F4',
    paddingHorizontal: 20,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  multilineInput: {
    minHeight: 88,
    paddingTop: 16,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedChip: {
    backgroundColor: Colors.primary,
  },
  sizeText: {
    ...Typography.body,
    fontWeight: '800',
  },
  selectedText: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  sliderTrack: {
    height: 24,
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  radiusMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helperText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  errorText: {
    ...Typography.bodySmall,
    color: "#B42318",
    marginTop: 6,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: Radius.full,
    padding: 3,
  },
  segmentItem: {
    minWidth: 34,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalChip: {
    minHeight: 36,
    paddingHorizontal: 17,
    borderRadius: Radius.full,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 8,
    paddingBottom: 22,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  disabledButton: {
    backgroundColor: '#F0F0F0',
  },
  disabledButtonText: {
    color: Colors.textDisabled,
  },
});
