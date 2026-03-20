import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home as HomeIcon, X, Moon } from 'lucide-react-native';
import SafeMap, { SafeMarker, SafePolyline } from '@/components/SafeMap';
import * as Location from 'expo-location';
import Colors from '@/constants/colors';
import { useSafelyStore } from '@/store';
import Avatar from '@/components/Avatar';
import Card from '@/components/Card';
import SOSButton from '@/components/SOSButton';
import GuardianToast from '@/components/GuardianToast';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import { stopAllTracking, clearActiveSession } from '@/hooks/useBackgroundLocation';
import { cancelNotification } from '@/hooks/useNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

function haversineDistance(a: {latitude: number; longitude: number}, b: {latitude: number; longitude: number}): number {
  const R = 6371000;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(a.latitude * Math.PI / 180) * Math.cos(b.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export default function ActiveTrackingScreen() {
  const router = useRouter();
  const {
    userName,
    primaryGuardian,
    session,
    homeAddress,
    currentCoords,
    trackingStatus,
    setTrackingStatus,
    setCurrentCoords,
    endSession,
    activeSessionId,
  } = useSafelyStore();

  useEffect(() => {
    if (!activeSessionId) {
      console.log('ActiveTracking: No sessionId, redirecting to home');
      router.replace('/(tabs)/(home)');
    }
  }, [activeSessionId, router]);

  if (!activeSessionId) return null;

  const [minutesLeft, setMinutesLeft] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [statusMessage, setStatusMessage] = useState("You're on your way 🏠");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [hasGpsLock, setHasGpsLock] = useState(false);
  const [initialCoords, setInitialCoords] = useState<{latitude: number; longitude: number} | null>(null);
  const trackingStartTime = useRef(Date.now()).current;
  const hasNavigatedAway = useRef(false);

  const dotOpacity = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<any>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [dotOpacity]);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        if (Platform.OS === 'web') {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const coords = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                setCurrentCoords(coords);
                setInitialCoords(coords);
                setHasGpsLock(true);
                console.log('ActiveTracking: Web GPS lock acquired');
              },
              (err) => console.log('ActiveTracking: Web geolocation error', err),
              { enableHighAccuracy: true }
            );
            navigator.geolocation.watchPosition(
              (position) => {
                setCurrentCoords({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              },
              (err) => console.log('ActiveTracking: Web geolocation watch error', err),
              { enableHighAccuracy: true }
            );
          }
          return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('ActiveTracking: Location permission denied');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        console.log('ActiveTracking: Initial location', loc.coords.latitude, loc.coords.longitude);
        const initCoords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setCurrentCoords(initCoords);
        setInitialCoords(initCoords);
        setHasGpsLock(true);
        console.log('ActiveTracking: GPS lock acquired');

        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 20,
            timeInterval: 5000,
          },
          (location) => {
            console.log('ActiveTracking: Location update', location.coords.latitude, location.coords.longitude);
            const newCoords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setCurrentCoords(newCoords);
          }
        );
      } catch (e) {
        console.log('ActiveTracking: Location error', e);
      }
    };

    void startTracking();
    return () => {
      if (sub) sub.remove();
    };
  }, [setCurrentCoords]);

  useEffect(() => {
    if (Platform.OS !== 'web' && currentCoords && homeAddress.coords && mapRef.current) {
      try {
        const coords = [
          { latitude: currentCoords.latitude, longitude: currentCoords.longitude },
          { latitude: homeAddress.coords.latitude, longitude: homeAddress.coords.longitude },
        ];
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 180, right: 60, bottom: 200, left: 60 },
          animated: true,
        });
      } catch (e) {
        console.log('ActiveTracking: fitToCoordinates error', e);
      }
    }
  }, [currentCoords, homeAddress.coords]);

  const sendArrivalEmail = useCallback(async () => {
    const guardianEmail = primaryGuardian?.email;
    if (!guardianEmail) {
      console.log('ActiveTracking: No guardian email, skipping arrival email');
      return;
    }
    try {
      console.log('ActiveTracking: Sending arrival email to', guardianEmail);
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Safely <onboarding@resend.dev>',
          to: guardianEmail,
          subject: `${userName} made it home safely \u2713`,
          html: `
            <div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:32px;">
              <h2 style="color:#00E87A;">${userName} made it home safely! \uD83C\uDF89</h2>
              <p style="color:#8A8A8A;">They arrived at ${new Date().toLocaleTimeString()}</p>
              <p style="color:#BBBBBB;font-size:12px;margin-top:32px;">Powered by Safely</p>
            </div>
          `,
        }),
      });
      console.log('ActiveTracking: Arrival email sent');
    } catch (e) {
      console.log('ActiveTracking: Arrival email error', e);
    }
  }, [primaryGuardian, userName]);

  const updateSessionArrived = useCallback(async () => {
    if (!activeSessionId) return;
    try {
      await supabase
        .from('sessions')
        .update({
          status: 'arrived',
          arrived_at: new Date().toISOString(),
        })
        .eq('id', activeSessionId);
      console.log('ActiveTracking: Session updated to arrived in Supabase');
    } catch (e) {
      console.log('ActiveTracking: Supabase session update error', e);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (!currentCoords || !homeAddress.coords || trackingStatus !== 'active') return;
    if (!hasGpsLock) {
      console.log('ActiveTracking: Skipping distance check - no GPS lock yet');
      return;
    }
    const elapsed = Date.now() - trackingStartTime;
    if (elapsed < 10000) {
      console.log('ActiveTracking: Skipping distance check - too early, elapsed:', elapsed, 'ms');
      return;
    }
    if (hasNavigatedAway.current) return;

    if (initialCoords) {
      const movedFromStart = haversineDistance(currentCoords, initialCoords);
      if (movedFromStart < 5) {
        console.log('ActiveTracking: User hasnt moved from start position yet, distance from start:', Math.round(movedFromStart), 'm');
        return;
      }
    }

    const distance = haversineDistance(currentCoords, homeAddress.coords);
    console.log('ActiveTracking: Distance to home:', Math.round(distance), 'm');
    if (distance < 150) {
      console.log('ActiveTracking: Within 150m of home, triggering arrival');
      hasNavigatedAway.current = true;
      setTrackingStatus('arrived');
      setToastMessage(`${userName} arrived home safely at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} \uD83C\uDFE0`);
      setShowToast(true);
      void sendArrivalEmail();
      void updateSessionArrived();
      setTimeout(() => {
        router.replace('/tracking/arrived');
      }, 500);
    }
  }, [currentCoords, homeAddress.coords, trackingStatus, setTrackingStatus, userName, router, hasGpsLock, trackingStartTime, initialCoords, sendArrivalEmail, updateSessionArrived]);

  useEffect(() => {
    if (!session.eta) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const etaTime = new Date(session.eta!).getTime();
      const diff = etaTime - now;
      const totalSecs = Math.max(0, Math.ceil(diff / 1000));
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      setMinutesLeft(mins);
      setSecondsLeft(secs);

      const totalMins = session.etaMinutes;
      const elapsed = totalMins - mins;
      const pct = totalMins > 0 ? elapsed / totalMins : 0;

      if (totalSecs <= 0) {
        setStatusMessage("You should be home by now\u2026");
        if (trackingStatus === 'active') {
          const lateThreshold = etaTime + 15 * 60000;
          if (now > lateThreshold) {
            setTrackingStatus('late');
            router.replace('/tracking/late');
          }
        }
      } else if (mins < 10) {
        setStatusMessage("Nearly home! \uD83C\uDFC3");
      } else if (pct > 0.5) {
        setStatusMessage("Keep going, almost there!");
      } else {
        setStatusMessage("You're on your way \uD83C\uDFE0");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.eta, session.etaMinutes, trackingStatus, setTrackingStatus, router]);

  const cleanupTracking = useCallback(async () => {
    try {
      await stopAllTracking();
      await clearActiveSession();
      const lateNotifId = await AsyncStorage.getItem('safely_late_notif_id');
      if (lateNotifId) {
        await cancelNotification(lateNotifId);
        await AsyncStorage.removeItem('safely_late_notif_id');
      }
    } catch (e) {
      console.log('ActiveTracking: cleanupTracking error', e);
    }
  }, []);

  const handleImHome = useCallback(() => {
    setTrackingStatus('arrived');
    setToastMessage(`${userName} arrived home safely at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} \uD83C\uDFE0`);
    setShowToast(true);
    void cleanupTracking();
    void sendArrivalEmail();
    void updateSessionArrived();
    setTimeout(() => {
      router.replace('/tracking/arrived');
    }, 500);
  }, [setTrackingStatus, userName, router, cleanupTracking, sendArrivalEmail, updateSessionArrived]);

  const handleStayingOver = useCallback(() => {
    Alert.alert(
      'Staying Over?',
      `${primaryGuardian?.name ?? 'Your guardian'} will be notified that you're safe.`,
      [
        { text: 'Keep Tracking', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setTrackingStatus('arrived');
            setToastMessage(`${userName} is staying over safely \u2713`);
            setShowToast(true);
            void cleanupTracking();
            void sendArrivalEmail();
            void updateSessionArrived();
            setTimeout(() => {
              router.replace('/tracking/arrived');
            }, 500);
          },
        },
      ]
    );
  }, [primaryGuardian, setTrackingStatus, userName, router, cleanupTracking, sendArrivalEmail, updateSessionArrived]);

  const handleClose = useCallback(() => {
    Alert.alert(
      'Cancel Tracking?',
      `${primaryGuardian?.name ?? 'Your guardian'} will be notified that you cancelled.`,
      [
        { text: 'Keep Tracking', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            void cleanupTracking();
            endSession();
            router.replace('/(tabs)/(home)');
          },
        },
      ]
    );
  }, [primaryGuardian, endSession, router, cleanupTracking]);

  const handleSOS = useCallback(() => {
    router.push('/sos-modal');
  }, [router]);

  const routeCoords = currentCoords && homeAddress.coords ? [
    { latitude: currentCoords.latitude, longitude: currentCoords.longitude },
    { latitude: homeAddress.coords.latitude, longitude: homeAddress.coords.longitude },
  ] : [];

  const timerDisplay = `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <View style={styles.mapFull}>
        <SafeMap
          mapRef={mapRef}
          style={StyleSheet.absoluteFillObject}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          fallbackLabel="Tracking active..."
          fallbackCoords={currentCoords ?? undefined}
        >
          {homeAddress.coords && (
            <SafeMarker coordinate={homeAddress.coords} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.markerContainer}>
                <View style={styles.homeMarker}>
                  <Text style={styles.homeMarkerIcon}>{'\uD83D\uDD12'}</Text>
                </View>
                <Text style={styles.markerLabel}>Home</Text>
              </View>
            </SafeMarker>
          )}
          {currentCoords && (
            <SafeMarker coordinate={currentCoords} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.markerContainer}>
                <View style={styles.userMarker}>
                  <View style={styles.userMarkerInner} />
                </View>
                <Text style={styles.markerLabel}>You</Text>
              </View>
            </SafeMarker>
          )}
          {routeCoords.length === 2 && (
            <SafePolyline
              coordinates={routeCoords}
              strokeColor={Colors.green}
              strokeWidth={4}
            />
          )}
        </SafeMap>
      </View>

      <SafeAreaView edges={['top']} style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.topRow}>
          <View style={styles.statusPill}>
            <Animated.View style={[styles.statusDot, { opacity: dotOpacity }]} />
            <Text style={styles.statusText}>Safely is ON</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoRow}>
          {primaryGuardian && (
            <Card style={styles.guardianPill}>
              <View style={styles.guardianPillInner}>
                <Avatar
                  name={primaryGuardian.name}
                  size={30}
                  color={primaryGuardian.avatarColor}
                />
                <View style={styles.guardianPillText}>
                  <Text style={styles.guardianPillName}>{primaryGuardian.name}</Text>
                  <Text style={styles.guardianPillStatus}>Watching over you {'\u2713'}</Text>
                </View>
              </View>
            </Card>
          )}
          <Card style={styles.timerCard}>
            <Text style={styles.timerValue}>{timerDisplay}</Text>
            <Text style={styles.timerLabel}>until home</Text>
          </Card>
        </View>
      </SafeAreaView>

      <SOSButton onPress={handleSOS} />

      <SafeAreaView edges={['bottom']} style={styles.bottomOverlay} pointerEvents="box-none">
        <View style={styles.bottomPanel}>
          <Text style={styles.statusMessage}>{statusMessage}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleImHome}>
              <HomeIcon size={18} color={Colors.green} />
              <Text style={styles.actionBtnTextGreen}>I'm Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleStayingOver}>
              <Moon size={18} color={Colors.textSecondary} />
              <Text style={styles.actionBtnText}>Staying Over</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <GuardianToast
        guardianName={primaryGuardian?.name ?? 'Guardian'}
        message={toastMessage}
        visible={showToast}
        onDismiss={() => setShowToast(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapFull: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    alignItems: 'center',
  },
  homeMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  homeMarkerIcon: {
    fontSize: 16,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 232, 122, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.green,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  markerLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    marginTop: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  guardianPill: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
  },
  guardianPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guardianPillText: {
    flex: 1,
  },
  guardianPillName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  guardianPillStatus: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  timerCard: {
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  timerValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  timerLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomPanel: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  statusMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnTextGreen: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.green,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
});
