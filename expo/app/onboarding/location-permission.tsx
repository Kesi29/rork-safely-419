import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { requestLocationPermissions } from '@/hooks/useBackgroundLocation';
import { useSafelyStore } from '@/store';
import OnboardingProgressBar from '@/components/OnboardingProgressBar';

const bullets = [
  { text: 'Only active when YOU turn it on', key: 'active' },
  { text: 'Automatically stops when you arrive home', key: 'stops' },
  { text: 'Your data is never sold', key: 'sold' },
];

export default function LocationPermissionScreen() {
  const router = useRouter();
  const { updateOnboardingProfile } = useSafelyStore();

  const handleContinue = async () => {
    try {
      await requestLocationPermissions();
    } catch (e) {
      console.log('LocationPermission: Error requesting permissions', e);
    }
    updateOnboardingProfile({ onboardingStep: 9 });
    router.push('/onboarding/all-set');
  };

  const handleSkip = () => {
    Alert.alert(
      'Location Required',
      'Safely cannot track your journey or notify your guardian without location access. You can enable it later in Settings.',
      [
        {
          text: 'Continue Anyway',
          onPress: () => {
            updateOnboardingProfile({ onboardingStep: 9 });
            router.push('/onboarding/all-set');
          },
        },
        { text: 'Go Back', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <OnboardingProgressBar step={9} />
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
              <MapPin size={36} color={Colors.green} strokeWidth={1.5} />
            </View>
          </View>

          <Text style={styles.title}>Safely needs{'\n'}your location</Text>
          <Text style={styles.subtitle}>
            Your location is only shared with your guardian while Safely is active. We never track you in the background without your permission.
          </Text>

          <View style={styles.bullets}>
            {bullets.map((item) => (
              <View key={item.key} style={styles.bulletRow}>
                <View style={styles.checkCircle}>
                  <Check size={14} color={Colors.green} />
                </View>
                <Text style={styles.bulletText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Enable Location</Text>
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
    fontWeight: '700' as const,
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
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
