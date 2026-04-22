import Button from '@/src/components/ui/Button';
import { Colors, Spacing, Typography } from '@/src/constants/theme';
import { Link } from 'expo-router';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>This is a modal</Text>
        <Text style={styles.subtitle}>A clean and flat modal style.</Text>
      </View>
      <Link href="/" dismissTo asChild>
        <Button title="Go to home screen" />
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.screenPadding,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.h2,
  },
  subtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.sm,
  },
});
