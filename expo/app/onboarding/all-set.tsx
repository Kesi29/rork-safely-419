import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, QrCode, Play, Home } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { useSafelyStore } from '@/store';
import { supabase } from '@/lib/supabase';
import OnboardingProgressBar from '@/components/OnboardingProgressBar';

const CONFETTI_COLORS = [Colors.green, '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F'];
const CONFETTI_COUNT = 24;

function ConfettiPiece({ index }: { index: number }) {
  const translateY = useRef(new Animated.Value(-60)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 300;
    const randomDelay = Math.random() * 600;
    const randomDuration = 1200 + Math.random() * 800;

    Animated.sequence([
      Animated.delay(randomDelay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 500 + Math.random() * 200,
          duration: randomDuration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: randomX,
          duration: randomDuration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 3 + Math.random() * 5,
          duration: randomDuration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: randomDuration,
          delay: randomDuration * 0.5,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [translateY, translateX, opacity, rotate]);

  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = 10 + (index / CONFETTI_COUNT) * 80;
  const size = 6 + Math.random() * 6;

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: `${left}%` as any,
          width: size,
          height: size * (1 + Math.random()),
          backgroundColor: color,
          borderRadius: size > 8 ? size / 2 : 2,
          opacity,
          transform: [
            { translateY },
            { translateX },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 8],
                outputRange: ['0deg', '2880deg'],
              }),
            },
          ],
        },
      ]}
    />
  );
}

const HOW_IT_WORKS = [
  { icon: QrCode, step: '1', text: 'Scan a QR code at your event' },
  { icon: Play, step: '2', text: 'Tap "Start Safely" when you leave' },
  { icon: Home, step: '3', text: 'Your guardian watches until you\'re home' },
];

export default function AllSetScreen() {
  const router = useRouter();
  const { onboardingProfile, completeOnboarding, userId } = useSafelyStore();

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, contentOpacity]);

  const handleFinish = async () => {
    try {
      completeOnboarding();

      if (userId && !userId.startsWith('local-')) {
        await supabase.from('profiles').update({
          onboarding_completed: true,
        }).eq('user_id', userId);
      }
    } catch (e) {
      console.log('AllSet: Error completing onboarding', e);
    }

    router.replace('/(tabs)/(home)');
  };

  const firstName = onboardingProfile.firstName || 'there';

  return (
    <View style={styles.container}>
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <OnboardingProgressBar step={10} />
        <View style={styles.content}>
          <Animated.View style={[styles.heroSection, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.shieldCircle}>
              <ShieldCheck size={44} color={Colors.green} strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>You're all set,{'\n'}{firstName}!</Text>
          </Animated.View>

          <Animated.View style={[styles.summarySection, { opacity: contentOpacity }]}>
            {onboardingProfile.guardianName ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Guardian</Text>
                <Text style={styles.summaryValue}>{onboardingProfile.guardianName}</Text>
              </View>
            ) : null}
            {onboardingProfile.emergencyName ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Emergency contact</Text>
                <Text style={styles.summaryValue}>{onboardingProfile.emergencyName}</Text>
              </View>
            ) : null}
          </Animated.View>

          <Animated.View style={[styles.howItWorks, { opacity: contentOpacity }]}>
            <Text style={styles.howTitle}>How it works</Text>
            {HOW_IT_WORKS.map((item) => (
              <View key={item.step} style={styles.stepRow}>
                <View style={styles.stepNumberCircle}>
                  <Text style={styles.stepNumber}>{item.step}</Text>
                </View>
                <Text style={styles.stepText}>{item.text}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleFinish}
            activeOpacity={0.85}
            testID="finish-onboarding-btn"
          >
            <Text style={styles.buttonText}>Go to Safely</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  shieldCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(24,165,125,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: '700' as const,
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
  },
  summarySection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
  },
  summaryValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  howItWorks: {
    gap: 16,
  },
  howTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(24,165,125,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: Colors.green,
  },
  stepText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  button: {
    backgroundColor: Colors.green,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: '#0A0A0A',
  },
});
