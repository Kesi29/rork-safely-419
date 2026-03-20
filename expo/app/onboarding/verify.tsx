import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { supabase } from '@/lib/supabase';
import { useSafelyStore } from '@/store';
import OnboardingProgressBar from '@/components/OnboardingProgressBar';

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const { setUserId, updateOnboardingProfile } = useSafelyStore();

  useEffect(() => {
    console.log('VerifyScreen: Polling for session, email:', params.email);
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log('VerifyScreen: Session found!', data.session.user.id);
          clearInterval(interval);
          setUserId(data.session.user.id);
          updateOnboardingProfile({ onboardingStep: 3 });

          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', data.session.user.id)
              .single();

            if (profile?.onboarding_completed) {
              console.log('VerifyScreen: User already completed onboarding');
              useSafelyStore.getState().setHasOnboarded(true);
              router.replace('/(tabs)/(home)');
              return;
            }

            if (profile) {
              console.log('VerifyScreen: Resuming onboarding from existing profile');
              updateOnboardingProfile({
                firstName: profile.first_name ?? '',
                lastName: profile.last_name ?? '',
                avatarUrl: profile.avatar_url ?? null,
                guardianName: profile.guardian_name ?? '',
                guardianPhone: profile.guardian_phone ?? '',
                emergencyName: profile.emergency_name ?? '',
                emergencyPhone: profile.emergency_phone ?? '',
              });
            }
          } catch (e) {
            console.log('VerifyScreen: Profile fetch error', e);
          }

          router.replace('/onboarding/name');
        }
      } catch (e) {
        console.log('VerifyScreen: Poll error', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [params.email, setUserId, updateOnboardingProfile, router]);

  const handleOpenEmail = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('message://').catch(() => {
        console.log('VerifyScreen: Could not open Mail app');
      });
    } else if (Platform.OS === 'android') {
      Linking.openURL('mailto:').catch(() => {
        console.log('VerifyScreen: Could not open email app');
      });
    } else {
      Linking.openURL('https://mail.google.com').catch(() => {
        console.log('VerifyScreen: Could not open email in browser');
      });
    }
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <OnboardingProgressBar step={3} />
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.iconWrapper}>
            <Mail size={48} color={Colors.green} strokeWidth={1.5} />
          </View>

          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a magic link to{'\n'}
            <Text style={styles.emailHighlight}>{params.email || 'your email'}</Text>
          </Text>

          <Text style={styles.instructions}>
            Tap the link in the email to sign in. It may take a moment to arrive.
          </Text>

          <TouchableOpacity
            style={styles.openEmailBtn}
            onPress={handleOpenEmail}
            activeOpacity={0.85}
          >
            <Mail size={20} color="#0A0A0A" />
            <Text style={styles.openEmailBtnText}>Open Email App</Text>
          </TouchableOpacity>

          <View style={styles.waitingRow}>
            <View style={styles.waitingDot} />
            <Text style={styles.waitingText}>Waiting for you to tap the link...</Text>
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
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
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  emailHighlight: {
    color: Colors.green,
    fontFamily: fonts.bodyMedium,
  },
  instructions: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  openEmailBtn: {
    backgroundColor: Colors.green,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },
  openEmailBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: '#0A0A0A',
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waitingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
    opacity: 0.6,
  },
  waitingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: fonts.body,
  },
});
