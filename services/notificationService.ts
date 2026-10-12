import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'screamguard-alerts';

// Show notifications even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let configured = false;

/** Request notification permission and set up the Android channel. Idempotent. */
export async function ensureNotificationSetup(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'ScreamGuard Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF3B4E',
      sound: 'default',
    });
  }

  if (!configured) {
    const { status } = await Notifications.getPermissionsAsync();
    let granted = status === 'granted';
    if (!granted) {
      const res = await Notifications.requestPermissionsAsync();
      granted = res.status === 'granted';
    }
    configured = granted;
    return granted;
  }
  return true;
}

/** Fire a local notification immediately. */
async function notify(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      // On Android, target our MAX-importance channel; iOS uses null (immediate).
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
    });
  } catch {
    // Notifications are best-effort.
  }
}

export function notifyScreamDetected(seconds: number) {
  return notify(
    '⚠️ Scream detected',
    `Sending an emergency alert in ${seconds}s. Open the app to cancel.`,
  );
}

export function notifyAlertSent() {
  return notify('Alert sent', 'Your emergency contacts have been notified with your location.');
}

export function notifyAlertCancelled() {
  return notify('Alert cancelled', 'No emergency alert was sent.');
}
