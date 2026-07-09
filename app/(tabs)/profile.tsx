import { SafeAreaView } from "react-native-safe-area-context";
import {
  Colors,
  Radius,
  Spacing,
  Typography } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { useLocale } from '@/src/providers/LocaleProvider';
import { router } from 'expo-router';
import { signOut } from '@/src/services/auth';
import { Bell,
  ChevronRight,
  Database,
  FileText,
  Flag,
  Languages,
  LogOut,
  Pencil,
  Scale,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  UserCog } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useState } from 'react';

export default function ProfileScreen() {
  const { user, profile, role } = useAuth();
  const { t } = useLocale();
  const [logoutVisible, setLogoutVisible] = useState(false);

  const displayName = profile?.name || (user?.user_metadata?.display_name as string) || t('profile.yourProfile');
  const ageLabel = profile?.age ? `, ${profile.age}` : '';
  const city = profile?.location?.city || t('profile.locationNotSet');
  const avatarUri =
    profile?.photoURL ||
    profile?.media?.find((item) => item.remoteUrl || item.uri)?.remoteUrl ||
    profile?.media?.find((item) => item.remoteUrl || item.uri)?.uri ||
    (user?.user_metadata?.avatar_url as string) ||
    undefined;
  const interests = profile?.interests?.length ? profile.interests : [t('profile.addInterests')];
  const traits = profile?.traits?.length ? profile.traits : [t('profile.addTraits')];
  const canModerate = role?.role === "moderator" || role?.role === "admin";
  const isAdmin = role?.role === "admin";
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const handleLogout = async () => {
    setLogoutVisible(false);
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>

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
            <Text style={styles.editText}>{t('profile.edit')}</Text>
          </TouchableOpacity>
        </View>

        <ProfileSection title={t('profile.interests')} values={interests} />
        <ProfileSection title={t('profile.traits')} values={traits} />

        {canModerate ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.staffTools')}</Text>
            <View style={styles.staffCard}>
              {isAdmin ? (
                <SettingsRow
                  icon={ShieldCheck}
                  title={t('profile.adminDashboard')}
                  rightText={t('profile.admin')}
                  onPress={() => router.push("/admin/dashboard")}
                />
              ) : null}
              <SettingsRow
                icon={UserCog}
                title={t('profile.moderationQueue')}
                rightText={isAdmin ? t('profile.reports') : t('profile.moderator')}
                onPress={() => router.push("/moderator/dashboard")}
              />
              <View style={styles.staffNoteRow}>
                <Flag size={17} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.staffNoteText}>
                  {t('profile.staffNote')}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.title')}</Text>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon={Bell}
              title={t('settings.notifications')}
              rightText={profile?.notificationsEnabled ? t('common.on') : t('common.off')}
              onPress={() => router.push("/settings/notifications")}
            />
            <SettingsRow
              icon={Languages}
              title={t('settings.appearanceLanguage')}
              onPress={() => router.push("/settings/appearance")}
            />
            <SettingsRow
              icon={Shield}
              title={t('settings.privacySafety')}
              onPress={() => router.push("/settings/privacy-safety")}
            />
            <SettingsRow icon={LogOut} title={t('profile.logout')} onPress={() => setLogoutVisible(true)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.legal')}</Text>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon={FileText}
              title={t('legal.privacyPolicy')}
              onPress={() => router.push("/legal/privacy")}
            />
            <SettingsRow
              icon={Scale}
              title={t('legal.termsOfUse')}
              onPress={() => router.push("/legal/terms")}
            />
            <SettingsRow
              icon={Database}
              title={t('legal.dataCompliance')}
              onPress={() => router.push("/legal/data-compliance")}
            />
            <SettingsRow
              icon={Trash2}
              title={t('settings.deleteAccount')}
              danger
              onPress={() => router.push("/settings/delete-account")}
            />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutDialog}>
            <View style={styles.logoutIconWrap}>
              <LogOut size={31} color={Colors.textPrimary} strokeWidth={2.1} />
            </View>
            <Text style={styles.logoutTitle}>{t('profile.logoutTitle')}</Text>
            <Text style={styles.logoutMessage}>
              {t('profile.logoutMessage')}
            </Text>
            <View style={styles.logoutActions}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={[styles.logoutButton, styles.cancelButton]}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                style={[styles.logoutButton, styles.confirmButton]}
                onPress={handleLogout}
              >
                <Text style={styles.confirmText}>{t('profile.logout')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

type SettingsIcon = LucideIcon;

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
  staffCard: {
    overflow: 'hidden',
    borderRadius: Radius.lg,
    backgroundColor: Colors.inputBg,
  },
  staffNoteRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primaryLight,
  },
  staffNoteText: {
    ...Typography.bodySmall,
    flex: 1,
    color: Colors.textSecondary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  logoutDialog: {
    width: '100%',
    maxWidth: 432,
    borderRadius: 30,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  logoutIconWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoutTitle: {
    ...Typography.h2,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  logoutMessage: {
    ...Typography.body,
    maxWidth: 322,
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
  },
  logoutActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.lg,
  },
  logoutButton: {
    flex: 1,
    height: 60,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.white,
  },
  confirmButton: {
    backgroundColor: Colors.textPrimary,
  },
  cancelText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  confirmText: {
    ...Typography.button,
    color: Colors.white,
  },
});
