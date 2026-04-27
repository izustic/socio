import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import Input from '@/src/components/ui/Input';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfilePhotoNameScreen() {
  const { draft, mergeDraft, setStep } = useOnboarding();

  return (
    <OnboardingLayout
      title="Show who you are."
      subtitle="Add up to 5 photos or short videos. The first one is your main. For now, we’ll use your main profile photo if you signed in with one."
      stepNumber="06  PROFILE  PHOTO & NAME"
      primaryLabel="Continue"
      onPrimaryPress={() => {
        setStep('profile-age-gender');
        router.replace('/profile-age-gender');
      }}
      primaryDisabled={!draft.name.trim()}
      onBackPress={() => router.back()}
    >
      <View style={styles.mediaGrid}>
        <View style={[styles.mainTile, draft.photoURL ? styles.photoTile : null]}>
          {draft.photoURL ? (
            <Image source={{ uri: draft.photoURL }} style={styles.mainImage} contentFit="cover" />
          ) : (
            <Text style={styles.plus}>+</Text>
          )}
          <View style={styles.mainBadge}>
            <Text style={styles.mainBadgeText}>★ MAIN</Text>
          </View>
        </View>
        <View style={styles.sideColumn}>
          <View style={styles.smallTile}><Text style={styles.play}>▶</Text></View>
          <View style={styles.smallTile} />
        </View>
      </View>

      <View style={styles.bottomTiles}>
        <TouchableOpacity activeOpacity={0.8} style={styles.addTile}>
          <Text style={styles.plus}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={styles.addTile}>
          <Text style={styles.plus}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.helper}>Tap to add. Hold to reorder. Videos up to 15s.</Text>

      <View style={styles.section}>
        <Text style={styles.label}>WHAT DO PEOPLE CALL YOU?</Text>
        <Input
          placeholder="Alex"
          value={draft.name}
          onChangeText={(value) => mergeDraft({ name: value })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>SHORT BIO</Text>
        <Input
          placeholder="Sunday coffee, bookstore dates, easy conversation."
          value={draft.bio}
          onChangeText={(value) => mergeDraft({ bio: value })}
          multiline
          style={styles.bio}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  mediaGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mainTile: {
    flex: 1,
    height: 220,
    borderRadius: 24,
    backgroundColor: '#F8F3E8',
    borderWidth: 1,
    borderColor: '#F0E6D1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoTile: {
    borderColor: 'transparent',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mainBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sideColumn: {
    width: 100,
    gap: Spacing.sm,
  },
  smallTile: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#F8F3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTiles: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  addTile: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontSize: 28,
    fontWeight: '500',
    color: Colors.primaryDark,
  },
  play: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  helper: {
    ...Typography.bodySmall,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  section: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.label,
  },
  bio: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
