import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK = 'safely-background-location';
const GEOFENCE_TASK = 'safely-geofence';
const HOME_GEOFENCE_ID = 'safely-home';

if (Platform.OS !== 'web') {
  TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
      if (error) {
        console.log('Background location task error:', error);
        return;
      }
      const locations = (data as any)?.locations;
      const location = locations?.[0];
      if (!location) return;

      const raw = await AsyncStorage.getItem('safely_active_session');
      if (!raw) return;
      const session = JSON.parse(raw);

      try {
        await fetch('https://safely-backend.vercel.app/api/sessions/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.sessionId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }),
        });
        console.log('Background location update sent');
      } catch (e) {
        console.log('Background location update failed silently:', e);
      }
    });

  TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }: any) => {
      if (error) {
        console.log('Geofence task error:', error);
        return;
      }
      const { eventType, region } = data as any;

      if (eventType === Location.GeofencingEventType.Enter && region?.identifier === HOME_GEOFENCE_ID) {
        const raw = await AsyncStorage.getItem('safely_active_session');
        if (!raw) return;
        const session = JSON.parse(raw);

        try {
          await fetch('https://safely-backend.vercel.app/api/sessions/arrive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: session.sessionId,
              userName: session.userName,
              guardianPhone: session.guardianPhone,
            }),
          });
          console.log('Geofence arrival notification sent');
        } catch (e) {
          console.log('Geofence arrive notification failed silently:', e);
        }
      }
    });
}

export async function requestLocationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  try {
    const { status: foreground } = await Location.requestForegroundPermissionsAsync();
    if (foreground !== 'granted') return false;

    const { status: background } = await Location.requestBackgroundPermissionsAsync();
    if (background !== 'granted') {
      console.log('Background location permission not granted');
      return true;
    }

    return true;
  } catch (e) {
    console.log('requestLocationPermissions error:', e);
    return false;
  }
}

export async function startBackgroundTracking(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
    if (!isRegistered) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 50,
        timeInterval: 30000,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Safely is ON',
          notificationBody: 'Tracking your journey home',
          notificationColor: '#18A57D',
        },
      });
      console.log('Background location tracking started');
    }
  } catch (e) {
    console.log('startBackgroundTracking error:', e);
  }
}

export async function registerHomeGeofence(
  latitude: number,
  longitude: number
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Location.startGeofencingAsync(GEOFENCE_TASK, [
      {
        identifier: HOME_GEOFENCE_ID,
        latitude,
        longitude,
        radius: 150,
        notifyOnEnter: true,
        notifyOnExit: false,
      },
    ]);
    console.log('Home geofence registered');
  } catch (e) {
    console.log('registerHomeGeofence error:', e);
  }
}

export async function stopAllTracking(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const locationRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK);
    if (locationRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
      console.log('Background location tracking stopped');
    }

    const geofenceRunning = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
    if (geofenceRunning) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
      console.log('Geofence monitoring stopped');
    }
  } catch (e) {
    console.log('stopAllTracking error:', e);
  }
}

export async function persistActiveSession(session: {
  sessionId: string;
  userName: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianName: string;
  eta: number;
  homeLatitude: number;
  homeLongitude: number;
  trackingStatus: string;
}): Promise<void> {
  try {
    await AsyncStorage.setItem('safely_active_session', JSON.stringify(session));
    console.log('Active session persisted to AsyncStorage');
  } catch (e) {
    console.log('persistActiveSession error:', e);
  }
}

export async function clearActiveSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem('safely_active_session');
    console.log('Active session cleared from AsyncStorage');
  } catch (e) {
    console.log('clearActiveSession error:', e);
  }
}
