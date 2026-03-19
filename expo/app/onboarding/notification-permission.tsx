import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { requestNotificationPermissions } from '@/hooks/useNotifications';
import { useSafelyStore } from '@/store';
import OnboardingProgressBar from '@/components/OnboardingProgressBar';

const bullets = [
  'Get reminded when your event ends',
  'Receive a check-in if you\'re running late',
  'Confirm when your guardian is notified',
];

export default function NotificationPermissionScreen() {
  const router = useRouter();
  const { updateOnboardingProfile } = useSafelyStore();

  const handleContinue = async () => {
    try {
      await requestNotificationPermissions();
    } catch (e) {
      console.log('NotificationPermission: Error requesting permissions', e);
    }
    updateOnboardingProfile({ onboardingStep: 8 });
    router.push('/onboarding/location-permission');
  };

  const handleSkip = () => {
    Alert.alert(
      'Notifications Recommended',
      'Without notifications, you won\'t receive late check-in alerts or event reminders. You can enable them later in Settings.',
      [
        {
          text: 'Continue Without',
          onPress: () => {
            updateOnboardingProfile({ onboardingStep: 8 });
            router.push('/onboarding/location-permission');
          },
        },
        { text: 'Go Back', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <OnboardingProgressBar step={8} />
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <Bell size={36} color={Colors.green} strokeWidth={1.5} />
            </View>
          </View>

          <Text style={styles.title}>Stay in the loop</Text>
          <Text style={styles.subtitle}>
            We notify you when your event is ending so you can activate Safely before you leave.
          </Text>

          <View style={styles.bullets}>
            {bullets.map((text) => (
              <View key={text} style={styles.bulletRow}>
                <View style={styles.checkCircle}>
                  <Check size={14} color={Colors.green} />
                </View>
                <Text style={styles.bulletText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Enable Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.6}>
            <Text style={styles.skipText}>Not now</Text>
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
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  iconWrapper: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(24,165,125,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  bullets: {
    alignSelf: 'stretch',
    gap: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(24,165,125,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
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
  skipBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  skipText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.4)',
  },
});
