import { Platform } from 'react-native';
import { api } from './api';

type NotificationResponseLike = {
  notification: {
    request: {
      content: {
        data: Record<string, unknown>;
      };
    };
  };
};

type SubscriptionLike = {
  remove: () => void;
};

let notificationHandlerConfigured = false;

async function getNotificationsModule() {
  if (Platform.OS === 'web') return null;

  const Notifications = await import('expo-notifications');
  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

export async function registerPushToken(userId: string): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    if (!projectId) {
      console.warn('EXPO_PUBLIC_PROJECT_ID not set — push notifications disabled');
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    if (tokenData.data) {
      await api.updatePushToken(userId, tokenData.data);
    }
  } catch (err) {
    console.warn('Push token registration failed:', err);
  }
}

export function addNotificationResponseListener(
  handler: (response: NotificationResponseLike) => void
): SubscriptionLike {
  let active = true;
  let subscription: SubscriptionLike | null = null;

  void getNotificationsModule().then((Notifications) => {
    if (!active || !Notifications) return;
    subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handler(response as NotificationResponseLike);
    });
  });

  return {
    remove: () => {
      active = false;
      subscription?.remove();
    },
  };
}
