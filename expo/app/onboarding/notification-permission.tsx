import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronLeft, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { requestNotificationPermissions } from '@/hooks/useNotifications';

const bullets = [
  'Get reminded when your event ends',
  'Receive a check-in if you\'re running late',
  'Confirm when your guardian is notified',
];

export default function NotificationPermissionScreen() {
  const router = useRouter();

  const handleContinue = async () => {
    try {
      await requestNotificationPermissions();
    } catch (e) {
      console.log('NotificationPermission: Error requesting permissions', e);
    }
    router.push('/onboarding/name');
  };

  const handleSkip = () => {
    Alert.alert(
      'Notifications Recommended',
      'Without notifications, you won\'t receive late check-in alerts or event reminders. You can enable them later in Settings.',
      [
        {
          text: 'Continue Without',
          onPress: () => router.push('/onboarding/name'),
        },
        { text: 'Go Back', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <Bell size={64} color={Colors.green} strokeWidth={1.5} />
          </View>

          <Text style={styles.title}>Stay in the loop</Text>
          <Text style={styles.subtitle}>
            Safely sends you timely notifications to keep you informed during your journey.
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
          <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.8}>
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
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconWrapper: {
    marginBottom: 32,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
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
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  button: {
    backgroundColor: Colors.green,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: Colors.textPrimary,
  },
  skipBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
