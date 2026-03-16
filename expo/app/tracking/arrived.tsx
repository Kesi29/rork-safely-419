import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { useSafelyStore } from '@/store';
import Card from '@/components/Card';
import GuardianToast from '@/components/GuardianToast';
import { sendGuardianSMS, formatGuardianMessage } from '@/utils/sms';
import { api } from '@/constants/api';

export default function ArrivedScreen() {
  const router = useRouter();
  const { userName, primaryGuardian, session, endSession, userId, activeSessionId } = useSafelyStore();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = React.useState(true);

  const arrivalTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const activatedAt = session.activatedAt ? new Date(session.activatedAt) : null;
  const duration = activatedAt
    ? (() => {
        const diff = Date.now() - activatedAt.getTime();
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        const rem = mins % 60;
        return hrs > 0 ? `${hrs} hr ${rem} min` : `${rem} min`;
      })()
    : '—';

  useEffect(() => {
    if (primaryGuardian && primaryGuardian.phone) {
      const msg = formatGuardianMessage('arrived', {
        userName,
        guardianName: primaryGuardian.name,
        time: arrivalTime,
      });
      console.log('ArrivedScreen: Sending arrived SMS to', primaryGuardian.phone);
      void sendGuardianSMS(primaryGuardian.phone, msg);
      try {
        void api.arrive({
          userId,
          sessionId: activeSessionId,
          guardianPhone: primaryGuardian.phone,
          guardianName: primaryGuardian.name,
          userName,
          arrivalTime,
        });
      } catch (e) {
        console.log('ArrivedScreen: API arrive error', e);
      }
    }
  }, [primaryGuardian, userName, arrivalTime, userId, activeSessionId]);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 12,
      stiffness: 180,
      useNativeDriver: true,
    }).start();

    Animated.timing(bgOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, bgOpacity]);

  const handleEndSession = () => {
    endSession();
    router.replace('/(tabs)/(home)');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.greenWash, { opacity: bgOpacity }]} />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
            <Check size={40} color="#FFFFFF" strokeWidth={3} />
          </Animated.View>

          <Text style={styles.title}>You made it home!</Text>
          <Text style={styles.subtitle}>
            {primaryGuardian?.name ?? 'Your guardian'} has been notified ✓
          </Text>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TONIGHT'S JOURNEY</Text>
            <Text style={styles.summaryDuration}>{duration}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryMeta}>
                Departed: {session.eventName ?? 'Night Out'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryMeta}>Arrived: {arrivalTime}</Text>
            </View>
          </Card>

          <View style={styles.bottomSection}>
            <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
              <Text style={styles.endButtonText}>END SESSION</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <GuardianToast
        guardianName={primaryGuardian?.name ?? 'Guardian'}
        message={`${userName} arrived home safely at ${arrivalTime} 🏠`}
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
  greenWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 232, 122, 0.06)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
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
    color: Colors.green,
    textAlign: 'center',
    marginBottom: 32,
  },
  summaryCard: {
    width: '100%',
    marginBottom: 32,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  summaryDuration: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  summaryRow: {
    marginBottom: 4,
  },
  summaryMeta: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  bottomSection: {
    width: '100%',
    marginTop: 'auto' as const,
    paddingBottom: 16,
  },
  endButton: {
    backgroundColor: Colors.green,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
