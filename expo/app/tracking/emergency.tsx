import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { useSafelyStore } from '@/store';
import Avatar from '@/components/Avatar';
import Card from '@/components/Card';
import { sendGuardianSMS, formatGuardianMessage } from '@/utils/sms';
import { api } from '@/constants/api';

export default function EmergencyScreen() {
  const router = useRouter();
  const { primaryGuardian, userName, currentCoords, setTrackingStatus, userId, activeSessionId } = useSafelyStore();

  const [cancelStep, setCancelStep] = useState(0);
  const smsSentRef = useRef(false);
  const ring1 = useRef(new Animated.Value(0.6)).current;
  const ring2 = useRef(new Animated.Value(0.4)).current;
  const ring3 = useRef(new Animated.Value(0.2)).current;
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const scale3 = useRef(new Animated.Value(1)).current;

  const sentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  useEffect(() => {
    if (!smsSentRef.current && primaryGuardian && primaryGuardian.phone) {
      smsSentRef.current = true;
      const locationStr = currentCoords ? `https://maps.google.com/?q=${currentCoords.latitude},${currentCoords.longitude}` : '';
      const msg = formatGuardianMessage('sos', {
        userName,
        guardianName: primaryGuardian.name,
        time: sentTime,
        location: locationStr,
      });
      console.log('EmergencyScreen: Sending SOS SMS to', primaryGuardian.phone);
      void sendGuardianSMS(primaryGuardian.phone, msg);
      try {
        void api.sos({
          userId,
          sessionId: activeSessionId,
          guardianPhone: primaryGuardian.phone,
          guardianName: primaryGuardian.name,
          userName,
          coords: currentCoords,
          time: sentTime,
        });
      } catch (e) {
        console.log('EmergencyScreen: API sos error', e);
      }
    }
  }, [primaryGuardian, userName, currentCoords, sentTime, userId, activeSessionId]);

  useEffect(() => {
    const createRingAnim = (opacity: Animated.Value, scale: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, { toValue: 2.4, duration: 2000, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );

    createRingAnim(ring1, scale1, 0).start();
    createRingAnim(ring2, scale2, 600).start();
    createRingAnim(ring3, scale3, 1200).start();
  }, [ring1, ring2, ring3, scale1, scale2, scale3]);

  const handleCall911 = useCallback(() => {
    Linking.openURL('tel:911').catch(() => {
      console.log('Cannot open phone app');
    });
  }, []);

  const handleCancelSOS = useCallback(() => {
    if (cancelStep === 0) {
      setCancelStep(1);
    } else {
      setTrackingStatus('active');
      router.replace('/tracking/active');
    }
  }, [cancelStep, setTrackingStatus, router]);

  return (
    <View style={styles.container}>
      <View style={styles.redTint} />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Safely</Text>
          <View style={styles.sosBadge}>
            <Text style={styles.sosBadgeText}>SOS ACTIVE</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.pulseContainer}>
            <Animated.View style={[styles.ring, { opacity: ring1, transform: [{ scale: scale1 }] }]} />
            <Animated.View style={[styles.ring, { opacity: ring2, transform: [{ scale: scale2 }] }]} />
            <Animated.View style={[styles.ring, { opacity: ring3, transform: [{ scale: scale3 }] }]} />
            <View style={styles.innerCircle} />
          </View>

          <Text style={styles.title}>SOS Activated</Text>
          <Text style={styles.subtitle}>
            {primaryGuardian?.name ?? 'Your guardian'} has been notified with your location
          </Text>
          <Text style={styles.sentTime}>Sent at {sentTime}</Text>

          {primaryGuardian && (
            <Card style={styles.notifCard}>
              <View style={styles.notifRow}>
                <Avatar name={primaryGuardian.name} size={40} color={primaryGuardian.avatarColor} />
                <View style={styles.notifInfo}>
                  <Text style={styles.notifTitle}>SMS sent to {primaryGuardian.name}</Text>
                  <Text style={styles.notifMeta}>Location shared at {sentTime}</Text>
                </View>
                <CheckCircle size={22} color={Colors.green} />
              </View>
            </Card>
          )}
        </View>

        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.call911Button} onPress={handleCall911}>
            <Phone size={20} color="#FFFFFF" />
            <Text style={styles.call911Text}>Call 911 Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelSOSButton} onPress={handleCancelSOS}>
            <Text style={styles.cancelSOSText}>
              {cancelStep === 0 ? "I'm Safe — Cancel SOS" : 'Tap again to confirm you\'re safe'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  redTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 59, 59, 0.04)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    position: 'relative',
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: Colors.textPrimary,
  },
  sosBadge: {
    position: 'absolute',
    right: 24,
    backgroundColor: Colors.redLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sosBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.red,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  pulseContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  ring: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.red,
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.red,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  sentTime: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 32,
  },
  notifCard: {
    width: '100%',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  notifMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomButtons: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  call911Button: {
    backgroundColor: Colors.red,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  call911Text: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  cancelSOSButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelSOSText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.red,
  },
});
