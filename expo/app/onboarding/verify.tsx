import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { supabase } from '@/lib/supabase';
import { useSafelyStore } from '@/store';
import OnboardingProgressBar from '@/components/OnboardingProgressBar';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; displayPhone: string }>();
  const { setUserId, setUserPhone, updateOnboardingProfile } = useSafelyStore();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(45);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  const shakeBoxes = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, easing: Easing.linear, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const verifyCode = useCallback(async (fullCode: string) => {
    if (!params.phone) return;

    setLoading(true);
    setError(null);

    try {
      console.log('VerifyScreen: Verifying OTP for', params.phone);
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: params.phone,
        token: fullCode,
        type: 'sms',
      });

      if (verifyError) {
        console.log('VerifyScreen: Verify error', verifyError);
        setError('Incorrect code — try again');
        shakeBoxes();
        setCode(Array(CODE_LENGTH).fill(''));
        setActiveIndex(0);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        setLoading(false);
        return;
      }

      if (data?.user) {
        console.log('VerifyScreen: Verified! User ID:', data.user.id);
        setUserId(data.user.id);
        setUserPhone(params.phone);
        updateOnboardingProfile({ onboardingStep: 3 });

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (profile?.onboarding_completed) {
          console.log('VerifyScreen: User already completed onboarding, going to home');
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

        router.push('/onboarding/name');
      } else {
        setError('Verification failed. Please try again.');
        shakeBoxes();
      }
    } catch (e) {
      console.log('VerifyScreen: Error', e);
      setError('Something went wrong. Please try again.');
      shakeBoxes();
    } finally {
      setLoading(false);
    }
  }, [params.phone, setUserId, setUserPhone, updateOnboardingProfile, router, shakeBoxes]);

  const handleDigitChange = useCallback((text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError(null);

    if (digit && index < CODE_LENGTH - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === CODE_LENGTH - 1) {
      const fullCode = newCode.join('');
      if (fullCode.length === CODE_LENGTH) {
        void verifyCode(fullCode);
      }
    }
  }, [code, verifyCode]);

  const handleKeyPress = useCallback((e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
  }, [code]);

  const handleResend = useCallback(async () => {
    if (resendTimer > 0 || !params.phone) return;

    try {
      console.log('VerifyScreen: Resending OTP to', params.phone);
      const { error: resendError } = await supabase.auth.signInWithOtp({ phone: params.phone });
      if (resendError) {
        setError(resendError.message);
      } else {
        setResendTimer(45);
        setError(null);
      }
    } catch (e) {
      console.log('VerifyScreen: Resend error', e);
    }
  }, [params.phone, resendTimer]);

  const maskedPhone = params.phone ? `****${params.phone.slice(-4)}` : '';

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <OnboardingProgressBar step={3} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.title}>Check your texts</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to {maskedPhone}
            </Text>

            <Animated.View style={[styles.codeRow, { transform: [{ translateX: shakeAnim }] }]}>
              {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { inputRefs.current[i] = ref; }}
                  style={[
                    styles.codeBox,
                    i === activeIndex && styles.codeBoxActive,
                    error ? styles.codeBoxError : null,
                    code[i] ? styles.codeBoxFilled : null,
                  ]}
                  value={code[i]}
                  onChangeText={(text) => handleDigitChange(text, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  testID={`otp-box-${i}`}
                />
              ))}
            </Animated.View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={Colors.green} size="small" />
                <Text style={styles.loadingText}>Verifying...</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleResend}
              disabled={resendTimer > 0}
              style={styles.resendBtn}
            >
              <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                {resendTimer > 0 ? `Resend in ${formatTimer(resendTimer)}` : 'Resend code'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  flex: {
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
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 40,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  codeBox: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    textAlign: 'center' as const,
    fontSize: 24,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  codeBoxActive: {
    borderColor: Colors.green,
    borderWidth: 2,
  },
  codeBoxFilled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  codeBoxError: {
    borderColor: Colors.red,
  },
  errorText: {
    fontSize: 13,
    color: Colors.red,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  resendBtn: {
    alignSelf: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: Colors.green,
    fontFamily: fonts.bodyMedium,
  },
  resendTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
});
