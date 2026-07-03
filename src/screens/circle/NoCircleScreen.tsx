import { SafeAreaView } from "react-native-safe-area-context";
import {
  Colors,
  Radius,
  Spacing,
  Typography } from '@/src/constants/theme';
import { router } from 'expo-router';
import { Plus,
  Search } from 'lucide-react-native';
import { Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function NoCircleScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <View style={styles.mark}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>You don&apos;t have{'\n'}a Circle yet</Text>
          <Text style={styles.description}>
            Start your own Circle, or join one created by someone who shares your vibe.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.86}
            style={[styles.actionCard, styles.primaryCard]}
            onPress={() => router.push('/circle/create')}
          >
            <View style={[styles.iconBadge, styles.primaryIconBadge]}>
              <Plus size={23} color={Colors.textPrimary} strokeWidth={2.4} />
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.primaryActionTitle}>Create a Circle</Text>
              <Text style={styles.primaryActionText}>You set the vibe. Others swipe to join.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.86}
            style={[styles.actionCard, styles.secondaryCard]}
            onPress={() => router.push('/circle/join-preferences')}
          >
            <View style={[styles.iconBadge, styles.secondaryIconBadge]}>
              <Search size={23} color={Colors.textPrimary} strokeWidth={2.4} />
            </View>
            <View style={styles.actionCopy}>
              <Text style={styles.secondaryActionTitle}>Join a Circle</Text>
              <Text style={styles.secondaryActionText}>
                Tell us who you&apos;d vibe with. We&apos;ll show matching Circles.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>One active Circle at a time</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 88,
    paddingBottom: 36,
  },
  mark: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  logo: {
    width: 54,
    height: 54,
  },
  copy: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    ...Typography.h1,
    fontSize: 28,
    lineHeight: 35,
    textAlign: 'center',
    color: '#111111',
  },
  description: {
    ...Typography.body,
    maxWidth: 300,
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 23,
  },
  actions: {
    width: '100%',
    maxWidth: 360,
    gap: 12,
    marginTop: 'auto',
  },
  actionCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: 14,
  },
  primaryCard: {
    backgroundColor: Colors.primary,
  },
  secondaryCard: {
    backgroundColor: '#F7F7F7',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryIconBadge: {
    backgroundColor: 'rgba(217, 143, 0, 0.22)',
  },
  secondaryIconBadge: {
    backgroundColor: Colors.white,
  },
  actionCopy: {
    flex: 1,
    gap: 3,
  },
  primaryActionTitle: {
    ...Typography.h3,
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },
  primaryActionText: {
    ...Typography.bodySmall,
    color: 'rgba(17, 17, 17, 0.68)',
  },
  secondaryActionTitle: {
    ...Typography.h3,
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },
  secondaryActionText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  footer: {
    ...Typography.bodySmall,
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
