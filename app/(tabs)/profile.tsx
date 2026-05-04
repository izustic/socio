import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { auth } from '@/src/services/firebase';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Bell, ChevronRight, LogOut, Pencil, Shield, Trash2, User } from 'lucide-react-native';
import { Alert, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const fallbackInterests = ['Add interests'];
const fallbackTraits = ['Add traits'];

export default function ProfileScreen() {
  const { user, profile } = useAuth();

  const displayName = profile?.name || user?.displayName || 'Your profile';
  const ageLabel = profile?.age ? `, ${profile.age}` : '';
  const city = profile?.location?.city || 'Location not set';
  const avatarUri =
    profile?.photoURL ||
    profile?.media?.find((item) => item.remoteUrl || item.uri)?.remoteUrl ||
    profile?.media?.find((item) => item.remoteUrl || item.uri)?.uri ||
    user?.photoURL ||
    undefined;
  const interests = profile?.interests?.length ? profile.interests : fallbackInterests;
  const traits = profile?.traits?.length ? profile.traits : fallbackTraits;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await signOut(auth);
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.hero}>
          <View style={styles.avatarShell}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                {initials ? (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                ) : (
                  <User size={38} color={Colors.primaryDark} strokeWidth={2.1} />
                )}
              </View>
            )}
          </View>

          <Text style={styles.name}>{displayName}{ageLabel}</Text>
          <Text style={styles.location}>{city}</Text>

          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.editButton}
            onPress={() => router.push('/profile/edit')}
          >
            <Pencil size={17} color={Colors.textPrimary} strokeWidth={2.2} />
            <Text style={styles.editText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        <ProfileSection title="Interests" values={interests} />
        <ProfileSection title="Traits" values={traits} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <SettingsRow icon={Bell} title="Notifications" rightText="On" />
            <SettingsRow icon={Shield} title="Privacy & safety" />
            <SettingsRow icon={LogOut} title="Log out" onPress={handleLogout} />
            <SettingsRow icon={Trash2} title="Delete account" danger />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileSection({ title, values }: { title: string; values: string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chips}>
        {values.map((value) => (
          <View key={value} style={styles.chip}>
            <Text style={styles.chipText}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type SettingsIcon = typeof Bell;

function SettingsRow({
  icon: Icon,
  title,
  rightText,
  danger = false,
  onPress,
}: {
  icon: SettingsIcon;
  title: string;
  rightText?: string;
  danger?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.72 : 1}
      style={styles.settingsRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <Icon size={21} color={danger ? Colors.danger : Colors.textPrimary} strokeWidth={2} />
      <Text style={[styles.settingsTitle, danger && styles.dangerText]}>{title}</Text>
      <View style={styles.settingsRight}>
        {rightText ? <Text style={styles.settingsValue}>{rightText}</Text> : null}
        <ChevronRight size={19} color={Colors.textSecondary} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: 112,
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  hero: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: 38,
  },
  avatarShell: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  avatarPlaceholder: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...Typography.h1,
    color: Colors.primaryDark,
  },
  name: {
    ...Typography.h1,
    fontSize: 30,
    lineHeight: 37,
    textAlign: 'center',
  },
  location: {
    ...Typography.body,
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 17,
  },
  editButton: {
    minWidth: 174,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  editText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    minHeight: 45,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  chipText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  settingsCard: {
    overflow: 'hidden',
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
  },
  settingsRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  settingsTitle: {
    ...Typography.body,
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  settingsValue: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  dangerText: {
    color: Colors.danger,
  },
});
