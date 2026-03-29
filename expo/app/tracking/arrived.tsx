import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSafelyStore } from '@/store';

export default function ArrivedScreen() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const {
    primaryGuardian,
    endSession,
  } = useSafelyStore();

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 12,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handleEndSession = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    endSession();
    router.replace('/(tabs)/(home)');
  }, [endSession, router]);

  const arrivalTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        </Animated.View>

        <Text style={styles.title}>You made it home!</Text>

        <Text style={styles.notifiedText}>
          {primaryGuardian?.name ?? 'Your guardian'} has been notified ✓
        </Text>

        <Text style={styles.timeText}>
          Arrived at {arrivalTime}
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {primaryGuardian?.name?.[0] || '?'}
                </Text>
              </View>
              <View>
                <Text style={styles.guardianName}>
                  {primaryGuardian?.name ?? 'Guardian'}
                </Text>
                <Text style={styles.guardianRole}>
                  Guardian · Watched over you
                </Text>
              </View>
            </View>
            <ShieldCheck size={22} color={Colors.green} />
          </View>
        </View>
      </View>

      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndSession}
          activeOpacity={0.85}
        >
          <Text style={styles.endButtonText}>End Session</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#00E87A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E87A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  checkIcon: {
    fontSize: 42,
    color: '#0A0A0A',
    fontWeight: '700' as const,
  },
  title: {
    fontWeight: '700' as const,
    fontSize: 32,
    color: '#0A0A0A',
    textAlign: 'center',
    marginTop: 28,
    marginBottom: 8,
  },
  notifiedText: {
    fontSize: 16,
    color: '#00E87A',
    textAlign: 'center',
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FAFAF8',
    borderRadius: 20,
    padding: 20,
    marginTop: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F0F0EE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00E87A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0A0A0A',
  },
  guardianName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0A0A0A',
  },
  guardianRole: {
    fontSize: 13,
    color: '#8A8A8A',
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  endButton: {
    backgroundColor: '#00E87A',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E87A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  endButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#0A0A0A',
  },
});
