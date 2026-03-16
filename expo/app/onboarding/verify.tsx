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

const CODE_LENGTH = 6;

function ProgressDots({ active }: { active: number }) {
  return (
    <View style={dotStyles.row}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[dotStyles.dot, i < active && dotStyles.dotActive]} />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
  dotActive: { backgroundColor: Colors.green },
});

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; displayPhone: string }>();
  const { setUserId, setUserPhone } = useSafelyStore();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);

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
  }, [params.phone, setUserId, setUserPhone, router, shakeBoxes]);

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
        setResendTimer(30);
        setError(null);
      }
    } catch (e) {
      console.log('VerifyScreen: Resend error', e);
    }
  }, [params.phone, resendTimer]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
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
              <ArrowLeft size={24} color={Colors.textPrimary} />
            </TouchableOpacity>

            <ProgressDots active={1} />

            <Text style={styles.title}>Enter your code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to {params.displayPhone ?? params.phone}
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
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
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
    backgroundColor: Colors.background,
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
    paddingTop: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#8A8A8A',
    marginBottom: 32,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: fonts.bodyBold,
    color: Colors.textPrimary,
  },
  codeBoxActive: {
    borderColor: Colors.green,
    borderWidth: 2,
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
    color: Colors.textSecondary,
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
    color: '#8A8A8A',
  },
});
