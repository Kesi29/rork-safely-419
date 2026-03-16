import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as Notifications.NotificationBehavior),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowSound: true,
        allowBadge: false,
      },
    });
    console.log('Notification permission status:', status);
    return status === 'granted';
  } catch (e) {
    console.log('requestNotificationPermissions error:', e);
    return false;
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  secondsFromNow: number,
  categoryIdentifier?: string
): Promise<string> {
  if (Platform.OS === 'web') return '';

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        categoryIdentifier,
      },
      trigger: secondsFromNow === 0
        ? null
        : { seconds: secondsFromNow, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
    });
    console.log('Scheduled notification:', id, title);
    return id;
  } catch (e) {
    console.log('scheduleLocalNotification error:', e);
    return '';
  }
}

export async function cancelNotification(id: string): Promise<void> {
  if (Platform.OS === 'web' || !id) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(id);
    console.log('Cancelled notification:', id);
  } catch (e) {
    console.log('cancelNotification error:', e);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (e) {
    console.log('cancelAllNotifications error:', e);
  }
}

export async function setupNotificationCategories(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.setNotificationCategoryAsync('LATE_CHECKIN', [
      {
        identifier: 'IM_OKAY',
        buttonTitle: "I'm Okay",
        options: { isDestructive: false, isAuthenticationRequired: false },
      },
      {
        identifier: 'I_NEED_HELP',
        buttonTitle: 'I Need Help',
        options: { isDestructive: false, isAuthenticationRequired: false, opensAppToForeground: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('SOS_ACTIVE', [
      {
        identifier: 'IM_SAFE',
        buttonTitle: "I'm Safe Now",
        options: { isDestructive: false, isAuthenticationRequired: false, opensAppToForeground: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('EVENT_END', [
      {
        identifier: 'TURN_ON_SAFELY',
        buttonTitle: 'Turn On Safely',
        options: { isDestructive: false, isAuthenticationRequired: false, opensAppToForeground: true },
      },
    ]);

    console.log('Notification categories set up');
  } catch (e) {
    console.log('setupNotificationCategories error:', e);
  }
}

export function setupNotificationResponseHandler(
  onLateCheckinOkay: () => void,
  onLateCheckinHelp: () => void,
  onSOSSafe: () => void,
  onTurnOnSafely: () => void
): () => void {
  if (Platform.OS === 'web') return () => {};

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const actionId = response.actionIdentifier;
    console.log('Notification response action:', actionId);
    if (actionId === 'IM_OKAY') onLateCheckinOkay();
    if (actionId === 'I_NEED_HELP') onLateCheckinHelp();
    if (actionId === 'IM_SAFE') onSOSSafe();
    if (actionId === 'TURN_ON_SAFELY') onTurnOnSafely();
  });

  return () => subscription.remove();
}

export async function updateTrackingNotification(
  guardianName: string,
  minutesRemaining: number,
  isLate: boolean
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.dismissAllNotificationsAsync();
    await scheduleLocalNotification(
      isLate ? 'You should be home by now' : 'Safely is ON',
      isLate
        ? `${guardianName} has been notified with your location`
        : `${guardianName} is watching over you \u00B7 ${minutesRemaining} min remaining`,
      0
    );
  } catch (e) {
    console.log('updateTrackingNotification error:', e);
  }
}
