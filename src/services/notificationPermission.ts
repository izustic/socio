import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type NotificationPermissionResult =
  | { status: 'granted' }
  | { status: 'denied'; canAskAgain: boolean };

const isGranted = (permissions: Notifications.NotificationPermissionsStatus) =>
  permissions.granted || permissions.status === 'granted';

export const requestNotificationPermissionStatus =
  async (): Promise<NotificationPermissionResult> => {
    if (Platform.OS === 'web') {
      return { status: 'denied', canAskAgain: false };
    }

    const existing = await Notifications.getPermissionsAsync();
    if (isGranted(existing)) {
      return { status: 'granted' };
    }

    if (existing.canAskAgain === false) {
      return { status: 'denied', canAskAgain: false };
    }

    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    if (isGranted(requested)) {
      return { status: 'granted' };
    }

    return {
      status: 'denied',
      canAskAgain: requested.canAskAgain ?? true,
    };
  };
