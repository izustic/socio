import Button from '@/src/components/ui/Button';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ProfileCompleteScreen() {
  const { draft, resetOnboarding } = useOnboarding();
  const { refreshProfile } = useAuth();

  const handleEnterApp = async () => {
    await refreshProfile();
    await resetOnboarding();
    router.replace('/(app)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.rings}>
        <View style={styles.outerRing} />
        <View style={styles.midRing} />
        <View style={styles.innerRing} />
      </View>

      <Text style={styles.title}>You&apos;re all set, {draft.name || 'friend'}!</Text>
      <Text style={styles.subtitle}>Time to find your Circle.</Text>

      <View style={styles.chips}>
        {draft.interests.slice(0, 3).map((interest) => (
          <View key={interest} style={styles.chip}>
            <Text style={styles.chipText}>{interest}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Button title="Find My Circle" onPress={handleEnterApp} style={styles.cta} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 96,
    paddingBottom: Spacing.xl,
  },
  rings: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  outerRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(34,34,34,0.25)',
  },
  midRing: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(34,34,34,0.25)',
  },
  innerRing: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(34,34,34,0.25)',
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  chips: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
  },
  chipText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
  },
  cta: {
    backgroundColor: Colors.white,
  },
});
