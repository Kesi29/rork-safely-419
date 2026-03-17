import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import SafeMap, { SafeMarker } from '@/components/SafeMap';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { useSafelyStore } from '@/store';
import Avatar from '@/components/Avatar';
import Card from '@/components/Card';
import { api } from '@/constants/api';
import { supabase } from '@/lib/supabase';
import { persistActiveSession } from '@/hooks/useBackgroundLocation';
import { startBackgroundTracking, registerHomeGeofence } from '@/hooks/useBackgroundLocation';
import { scheduleLocalNotification } from '@/hooks/useNotifications';
import EventWelcomeSheet from '@/components/EventWelcomeSheet';

const ORB_SIZE = 140;
const _SCREEN_WIDTH = Dimensions.get('window').width;

const ETA_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hr', value: 60 },
  { label: '1.5 hr', value: 90 },
  { label: '2 hr', value: 120 },
];

const NOISE_DOTS = Array.from({ length: 40 }, (_, i) => {
  const angle = (i / 40) * Math.PI * 2 + i * 1.3;
  const dist = 8 + ((i * 11) % 58);
  const cx = ORB_SIZE / 2 + Math.cos(angle) * dist;
  const cy = ORB_SIZE / 2 + Math.sin(angle) * dist;
  return {
    key: `n${i}`,
    left: Math.max(2, Math.min(ORB_SIZE - 2, cx)),
    top: Math.max(2, Math.min(ORB_SIZE - 2, cy)),
    size: 1 + (i % 3) * 0.8,
    opacity: 0.04 + (i % 5) * 0.015,
    isLight: i % 3 !== 0,
  };
});

export default function HomeScreen() {
  const router = useRouter();
  const [showEtaModal, setShowEtaModal] = useState(false);
  const mapRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.35)).current;

  const {
    primaryGuardian,
    currentCoords,
    homeAddress,
    connectedEvents,
    hasOnboarded,
    isInitialized,
    defaultEtaMinutes,
    startSession,
    setCurrentCoords,
    userId,
    setActiveSessionId,
    showEventWelcome,
    clearEventWelcome,
  } = useSafelyStore();

  const [selectedEta, setSelectedEta] = useState(defaultEtaMinutes);
  const [showGuardianSheet, setShowGuardianSheet] = useState(false);
  const [showSafetyBanner, setShowSafetyBanner] = useState(false);
  const haloAnim = useRef(new Animated.Value(0.12)).current;
  const haloScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setSelectedEta(defaultEtaMinutes);
  }, [defaultEtaMinutes]);

  useEffect(() => {
    AsyncStorage.getItem('safely_safety_banner_dismissed').then((val) => {
      if (!val) setShowSafetyBanner(true);
    }).catch(() => {});
  }, []);

  const dismissBanner = useCallback(async () => {
    try {
      await AsyncStorage.setItem('safely_safety_banner_dismissed', 'true');
    } catch (e) {
      console.log('HomeScreen: Error dismissing banner', e);
    }
    setShowSafetyBanner(false);
  }, []);

  useEffect(() => {
    if (isInitialized && !hasOnboarded) {
      router.replace('/onboarding/welcome');
    }
  }, [isInitialized, hasOnboarded, router]);

  useEffect(() => {
    if (!isInitialized || !hasOnboarded || !primaryGuardian) return;

    const checkGuardianConfirmation = async () => {
      try {
        const seen: string | null = await AsyncStorage.getItem('hasSeenGuardianConfirmation');
        if (!seen) {
          setShowGuardianSheet(true);
        }
      } catch (e) {
        console.log('HomeScreen: Guardian confirmation check error', e);
      }
    };

    void checkGuardianConfirmation();
  }, [isInitialized, hasOnboarded, primaryGuardian]);

  useEffect(() => {
    if (!userId || userId.startsWith('local-')) return;

    console.log('HomeScreen: Subscribing to guardian realtime updates');
    const channel = supabase
      .channel('guardian-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'guardians',
        filter: `user_id=eq.${userId}`,
      }, (payload: any) => {
        console.log('HomeScreen: Guardian update received', payload);
        if (payload.new?.status === 'confirmed' && payload.new?.name) {
          const { updateGuardian, guardians: currentGuardians } = useSafelyStore.getState();
          const match = currentGuardians.find((g) => g.phone === payload.new.phone);
          if (match) {
            updateGuardian({ ...match, avatarColor: match.avatarColor });
          }
        }
      })
      .subscribe();

    return () => {
      console.log('HomeScreen: Unsubscribing from guardian realtime');
      void supabase.removeChannel(channel);
    };
  }, [userId]);



  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.25,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    glow.start();

    const halo = Animated.loop(
      Animated.sequence([
        Animated.timing(haloAnim, {
          toValue: 0.22,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloAnim, {
          toValue: 0.08,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    halo.start();

    const haloScale = Animated.loop(
      Animated.sequence([
        Animated.timing(haloScaleAnim, {
          toValue: 1.08,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloScaleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    haloScale.start();

    return () => {
      pulse.stop();
      glow.stop();
      halo.stop();
      haloScale.stop();
    };
  }, [pulseAnim, glowAnim, haloAnim, haloScaleAnim]);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      try {
        if (Platform.OS === 'web') {
          console.log('HomeScreen: Using web geolocation');
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log('HomeScreen: Web location', position.coords.latitude, position.coords.longitude);
                setCurrentCoords({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              },
              (err) => console.log('HomeScreen: Web geolocation error', err),
              { enableHighAccuracy: false, timeout: 10000 }
            );
          }
          return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('HomeScreen: Location permission denied');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        console.log('HomeScreen: Got location', loc.coords.latitude, loc.coords.longitude);
        setCurrentCoords({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 50 },
          (location) => {
            setCurrentCoords({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
      } catch (e) {
        console.log('HomeScreen: Location error', e);
      }
    };

    void startLocationTracking();
    return () => {
      if (sub) sub.remove();
    };
  }, [setCurrentCoords]);

  const handleStartSafely = useCallback(async () => {
    if (!primaryGuardian) {
      Alert.alert(
        'Add a Guardian First',
        'You need at least one guardian before activating Safely. Add someone who can look out for you.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Guardian', onPress: () => router.push('/(tabs)/guardian') },
        ]
      );
      return;
    }

    if (!homeAddress.coords || !homeAddress.label) {
      Alert.alert(
        'Set Your Home Address',
        "Safely needs your home address to know when you've arrived safely.",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Set Address', onPress: () => router.push('/(tabs)/settings') },
        ]
      );
      return;
    }

    if (Platform.OS !== 'web') {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Access Required',
          'Safely needs location access to protect you. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openURL('app-settings:') },
          ]
        );
        return;
      }

      try {
        const Battery = await import('expo-battery');
        const batteryLevel = await Battery.getBatteryLevelAsync();
        if (batteryLevel >= 0 && batteryLevel < 0.20) {
          Alert.alert(
            'Low Battery Warning',
            `Your battery is at ${Math.round(batteryLevel * 100)}%. Background location tracking may stop if your phone dies. Consider charging before activating Safely.`,
            [
              { text: 'Cancel' },
              { text: 'Activate Anyway', onPress: () => setShowEtaModal(true) },
            ]
          );
          return;
        }
      } catch (e) {
        console.log('HomeScreen: Battery check failed, continuing', e);
      }
    }

    setShowEtaModal(true);
  }, [primaryGuardian, homeAddress, router]);

  const handleConfirmEta = useCallback(async () => {
    const etaDate = new Date(Date.now() + selectedEta * 60000);
    if (etaDate.getTime() < Date.now()) {
      Alert.alert(
        'Invalid Time',
        'Your expected arrival time has already passed. Please select a future time.',
        [{ text: 'OK' }]
      );
      return;
    }

    const eventName = connectedEvents[0]?.name ?? null;
    const sessionId = `session-${Date.now()}`;
    setActiveSessionId(sessionId);
    startSession(selectedEta, eventName);
    setShowEtaModal(false);

    try {
      await persistActiveSession({
        sessionId,
        userName: useSafelyStore.getState().userName,
        guardianPhone: primaryGuardian?.phone ?? '',
        guardianName: primaryGuardian?.name ?? '',
        eta: etaDate.getTime(),
        homeLatitude: homeAddress.coords.latitude,
        homeLongitude: homeAddress.coords.longitude,
        trackingStatus: 'active',
      });
    } catch (e) {
      console.log('HomeScreen: persistActiveSession error', e);
    }

    try {
      await startBackgroundTracking();
    } catch (e) {
      console.log('HomeScreen: startBackgroundTracking error', e);
    }

    try {
      await registerHomeGeofence(
        homeAddress.coords.latitude,
        homeAddress.coords.longitude
      );
    } catch (e) {
      console.log('HomeScreen: registerHomeGeofence error', e);
    }

    try {
      const msUntilLate = etaDate.getTime() - Date.now() + (15 * 60 * 1000);
      const lateNotifId = await scheduleLocalNotification(
        `Are you okay, ${useSafelyStore.getState().userName}?`,
        "You haven't made it home yet. Tap to check in.",
        Math.floor(msUntilLate / 1000),
        'LATE_CHECKIN'
      );
      if (lateNotifId) {
        await AsyncStorage.setItem('safely_late_notif_id', lateNotifId);
      }
    } catch (e) {
      console.log('HomeScreen: scheduleLocalNotification error', e);
    }

    try {
      void api.startSession({
        userId,
        sessionId,
        guardianPhone: primaryGuardian?.phone,
        guardianName: primaryGuardian?.name,
        userName: useSafelyStore.getState().userName,
        eventName,
        etaMinutes: selectedEta,
        homeCoords: homeAddress.coords,
      });
    } catch (e) {
      console.log('HomeScreen: API startSession error', e);
      Alert.alert(
        'Connection Issue',
        "We couldn't notify your guardian right now due to a network issue. Your journey is still being tracked locally. Please check your connection.",
        [{ text: 'OK' }]
      );
    }
    setTimeout(() => {
      router.push('/tracking/active');
    }, 50);
  }, [selectedEta, connectedEvents, startSession, router, userId, setActiveSessionId, primaryGuardian, homeAddress]);

  const mapRegion = currentCoords ? {
    latitude: currentCoords.latitude,
    longitude: currentCoords.longitude,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  } : {
    latitude: 34.0522,
    longitude: -118.2437,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };

  const etaTime = new Date(Date.now() + selectedEta * 60000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <View style={styles.mapFull}>
        <SafeMap
          mapRef={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={mapRegion}
          showsUserLocation
          followsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          fallbackLabel="Map loading..."
          fallbackCoords={currentCoords ?? undefined}
        >
          {homeAddress.coords && (
            <SafeMarker coordinate={homeAddress.coords}>
              <View style={styles.homePin}>
                <Text style={styles.homePinIcon}>🏠</Text>
              </View>
            </SafeMarker>
          )}
        </SafeMap>
      </View>

      <SafeAreaView edges={['top']} style={styles.overlay} pointerEvents="box-none">


        {showSafetyBanner && (
          <View style={styles.safetyBannerWrapper}>
            <View style={styles.safetyBanner}>
              <Text style={styles.safetyBannerTitle}>Important Safety Notice</Text>
              <Text style={styles.safetyBannerText}>
                Safely is not an emergency service. Always call 911 in a life-threatening emergency. Notification delivery is not guaranteed.
              </Text>
              <TouchableOpacity onPress={dismissBanner} style={styles.safetyBannerBtn}>
                <Text style={styles.safetyBannerBtnText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {primaryGuardian && (
          <View style={styles.guardianCardWrapper}>
            <Card style={styles.guardianCard}>
              <View style={styles.guardianRow}>
                <Avatar
                  name={primaryGuardian.name}
                  size={36}
                  color={primaryGuardian.avatarColor}
                />
                <View style={styles.guardianInfo}>
                  <Text style={styles.guardianName}>
                    {primaryGuardian.name} · {primaryGuardian.relationship}
                  </Text>
                  <Text style={styles.guardianMeta}>Ready to watch over you</Text>
                </View>
                <View style={styles.readyDot} />
              </View>
            </Card>
          </View>
        )}
      </SafeAreaView>

      <View style={styles.bottomOverlay} pointerEvents="box-none">
        <View style={styles.actionRow}>
          <View style={styles.orbContainer}>
            <Animated.View style={[
              styles.orbHaloOuter,
              { opacity: haloAnim, transform: [{ scale: haloScaleAnim }] },
            ]} />
            <Animated.View style={[styles.orbHaloInner, { opacity: haloAnim }]} />
            <Animated.View style={[styles.orbWrapper, { transform: [{ scale: pulseAnim }] }]}>
              <TouchableOpacity
                onPress={handleStartSafely}
                activeOpacity={0.85}
                style={styles.orbTouchable}
              >
                <Animated.View style={[styles.orbGlow, { shadowOpacity: glowAnim }]} />
                <LinearGradient
                  colors={['#4ECBA3', '#18A57D', '#0E8C68', '#0B7A5A']}
                  start={{ x: 0.3, y: 0 }}
                  end={{ x: 0.7, y: 1 }}
                  style={styles.orbGradient}
                >
                  <View style={styles.orbSheen} />
                  <View style={styles.orbHighlight} />
                  {NOISE_DOTS.map((dot) => (
                    <View
                      key={dot.key}
                      style={{
                        position: 'absolute' as const,
                        left: dot.left,
                        top: dot.top,
                        width: dot.size,
                        height: dot.size,
                        borderRadius: dot.size / 2,
                        backgroundColor: dot.isLight
                          ? `rgba(255,255,255,${dot.opacity})`
                          : `rgba(0,0,0,${dot.opacity * 0.5})`,
                      }}
                    />
                  ))}
                  <Text style={styles.orbTextStart}>START</Text>
                  <Text style={styles.orbTextSafely}>SAFELY</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
        <Text style={styles.bottomCaption}>Tap when you're heading home</Text>
      </View>

      <Modal visible={showEtaModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBlock}>
                <Text style={styles.modalTitle}>When do you expect{'\n'}to be home?</Text>
                <Text style={styles.modalSubtitle}>
                  Your guardian will be notified if you're not home in time
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowEtaModal(false)}
              >
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.etaPillRow}
            >
              {ETA_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.etaPill,
                    selectedEta === opt.value && styles.etaPillActive,
                  ]}
                  onPress={() => setSelectedEta(opt.value)}
                >
                  <Text style={[
                    styles.etaPillText,
                    selectedEta === opt.value && styles.etaPillTextActive,
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.etaNotice}>
              <Text style={styles.etaNoticeIcon}>🔔</Text>
              <Text style={styles.etaNoticeText}>
                We'll check in with {primaryGuardian?.name ?? 'your guardian'} by{' '}
                <Text style={styles.etaTimeHighlight}>{etaTime}</Text>
              </Text>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmEta}>
              <Text style={styles.confirmButtonText}>Start Safely</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showGuardianSheet} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.guardianSheetContent}>
            <View style={styles.modalHandle} />
            <View style={styles.guardianSheetAvatar}>
              <Text style={styles.guardianSheetInitials}>
                {primaryGuardian?.name?.charAt(0)?.toUpperCase() ?? 'G'}
              </Text>
            </View>
            <Text style={styles.guardianSheetTitle}>
              {primaryGuardian?.name ?? 'Your guardian'} will receive a confirmation text shortly
            </Text>
            <Text style={styles.guardianSheetDesc}>
              Once they confirm, you'll see a green checkmark on their card
            </Text>
            <TouchableOpacity
              style={styles.guardianSheetBtn}
              onPress={async () => {
                setShowGuardianSheet(false);
                try {
                  await AsyncStorage.setItem('hasSeenGuardianConfirmation', 'true');
                } catch (e) {
                  console.log('HomeScreen: Error saving guardian confirmation flag', e);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.guardianSheetBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <EventWelcomeSheet
        event={showEventWelcome}
        onDismiss={clearEventWelcome}
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
  homePin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  homePinIcon: {
    fontSize: 18,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: Colors.textPrimary,
  },
  guardianCardWrapper: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  guardianCard: {
    padding: 12,
    borderRadius: 14,
  },
  guardianRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guardianInfo: {
    flex: 1,
    marginLeft: 10,
  },
  guardianName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  guardianMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  readyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.green,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 105,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },

  orbContainer: {
    width: ORB_SIZE + 40,
    height: ORB_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbHaloOuter: {
    position: 'absolute',
    width: ORB_SIZE + 36,
    height: ORB_SIZE + 36,
    borderRadius: (ORB_SIZE + 36) / 2,
    backgroundColor: 'rgba(0, 232, 122, 0.08)',
  },
  orbHaloInner: {
    position: 'absolute',
    width: ORB_SIZE + 18,
    height: ORB_SIZE + 18,
    borderRadius: (ORB_SIZE + 18) / 2,
    backgroundColor: 'rgba(0, 232, 122, 0.12)',
  },
  orbWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbTouchable: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlow: {
    position: 'absolute',
    width: ORB_SIZE + 10,
    height: ORB_SIZE + 10,
    borderRadius: (ORB_SIZE + 10) / 2,
    backgroundColor: 'transparent',
    shadowColor: '#18A57D',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 25,
    elevation: 20,
  },
  orbGradient: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#00C060',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },
  orbSheen: {
    position: 'absolute',
    top: -ORB_SIZE * 0.15,
    left: -ORB_SIZE * 0.1,
    width: ORB_SIZE * 1.2,
    height: ORB_SIZE * 0.65,
    borderRadius: ORB_SIZE * 0.6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ rotate: '-8deg' }],
  },
  orbHighlight: {
    position: 'absolute',
    top: 10,
    left: ORB_SIZE * 0.2,
    width: ORB_SIZE * 0.45,
    height: ORB_SIZE * 0.25,
    borderRadius: ORB_SIZE * 0.2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    transform: [{ rotate: '-12deg' }],
  },
  orbTextStart: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#0A0A0A',
    letterSpacing: 3,
    marginBottom: 0,
    textTransform: 'uppercase' as const,
  },
  orbTextSafely: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#0A0A0A',
    letterSpacing: 1,
    marginTop: -2,
  },
  bottomCaption: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitleBlock: {
    flex: 1,
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    lineHeight: 28,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.backgroundSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  etaPillRow: {
    gap: 10,
    paddingBottom: 20,
  },
  etaPill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  etaPillActive: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  etaPillText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  etaPillTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700' as const,
  },
  etaNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  etaNoticeIcon: {
    fontSize: 16,
  },
  etaNoticeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  etaTimeHighlight: {
    color: Colors.textPrimary,
    fontWeight: '700' as const,
  },
  confirmButton: {
    backgroundColor: Colors.green,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  guardianSheetContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: 'center',
  },
  guardianSheetAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  guardianSheetInitials: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  guardianSheetTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  guardianSheetDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  guardianSheetBtn: {
    backgroundColor: Colors.green,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  guardianSheetBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  safetyBannerWrapper: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  safetyBanner: {
    backgroundColor: '#FFF8EC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.30)',
    padding: 14,
  },
  safetyBannerTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#C68000',
    marginBottom: 4,
  },
  safetyBannerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#8A6000',
    lineHeight: 18,
  },
  safetyBannerBtn: {
    marginTop: 8,
  },
  safetyBannerBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#C68000',
  },
});
