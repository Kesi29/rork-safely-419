import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSafelyStore } from '@/store';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HOLD_DURATION = 3000;
const CIRCLE_SIZE = 88;
const STROKE_WIDTH = 4;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function SOSModal() {
  const router = useRouter();
  const { currentCoords, setSosCoords, setTrackingStatus } = useSafelyStore();

  const [isHolding, setIsHolding] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const triggerSOS = useCallback(() => {
    if (currentCoords) {
      setSosCoords(currentCoords);
    }
    setTrackingStatus('emergency');

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    router.dismiss();
    setTimeout(() => {
      router.replace('/tracking/emergency');
    }, 100);
  }, [currentCoords, setSosCoords, setTrackingStatus, router]);

  const startHold = useCallback(() => {
    setIsHolding(true);
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    });
    animRef.current = anim;

    anim.start(({ finished }) => {
      if (finished) {
        triggerSOS();
      }
    });
  }, [progressAnim, triggerSOS]);

  const endHold = useCallback(() => {
    setIsHolding(false);
    if (animRef.current) {
      animRef.current.stop();
    }
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Send SOS Alert?</Text>
        <Text style={styles.subtitle}>
          This will notify your guardian with your exact location and call 911
        </Text>

        <View style={styles.disclaimerBanner}>
          <Text style={styles.disclaimerText}>
            This will notify your guardian and attempt to call 911. Safely is not an emergency dispatch service. Call 911 directly if you cannot use this app.
          </Text>
        </View>

        <View style={styles.holdContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={startHold}
            onPressOut={endHold}
            style={styles.holdButton}
          >
            <View style={styles.holdCircle}>
              <AlertTriangle size={32} color="#FFFFFF" />
            </View>
            {Platform.OS !== 'web' ? (
              <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.progressRing}>
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke="rgba(255,59,59,0.2)"
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                />
                <AnimatedCircle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={RADIUS}
                  stroke={Colors.red}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeDasharray={`${CIRCUMFERENCE}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
                />
              </Svg>
            ) : (
              <View style={styles.progressRing}>
                <View style={[styles.webRing, isHolding && styles.webRingActive]} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.holdLabel}>Hold for 3 seconds</Text>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.dismiss()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700' as const,
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  holdContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  holdButton: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  holdCircle: {
    position: 'absolute',
    width: CIRCLE_SIZE - STROKE_WIDTH * 2,
    height: CIRCLE_SIZE - STROKE_WIDTH * 2,
    borderRadius: (CIRCLE_SIZE - STROKE_WIDTH * 2) / 2,
    backgroundColor: Colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  progressRing: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  webRing: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: STROKE_WIDTH,
    borderColor: 'rgba(255,59,59,0.2)',
  },
  webRingActive: {
    borderColor: Colors.red,
  },
  holdLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  disclaimerBanner: {
    backgroundColor: 'rgba(255,59,59,0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    marginHorizontal: 8,
  },
  disclaimerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#CC2020',
    textAlign: 'center',
    lineHeight: 18,
  },
});
