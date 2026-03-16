import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { supabase } from '@/lib/supabase';

interface CountryCode {
  flag: string;
  code: string;
  dial: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { flag: '🇺🇸', code: 'US', dial: '+1' },
  { flag: '🇬🇧', code: 'GB', dial: '+44' },
  { flag: '🇨🇦', code: 'CA', dial: '+1' },
  { flag: '🇦🇺', code: 'AU', dial: '+61' },
  { flag: '🇲🇽', code: 'MX', dial: '+52' },
];

function formatPhoneUS(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

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

export default function PhoneScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(0);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const country = COUNTRY_CODES[selectedCountry];

  const handlePhoneChange = useCallback((text: string) => {
    const formatted = formatPhoneUS(text);
    setPhone(formatted);
    setError(null);
  }, []);

  const getFullPhone = useCallback(() => {
    const digits = phone.replace(/\D/g, '');
    return `${country.dial}${digits}`;
  }, [phone, country.dial]);

  const handleSendCode = useCallback(async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullPhone = getFullPhone();
      console.log('PhoneScreen: Sending OTP to', fullPhone);

      const { error: otpError } = await supabase.auth.signInWithOtp({ phone: fullPhone });

      if (otpError) {
        console.log('PhoneScreen: OTP error', otpError);
        setError(otpError.message || 'Failed to send verification code.');
        setLoading(false);
        return;
      }

      console.log('PhoneScreen: OTP sent successfully');
      router.push({
        pathname: '/onboarding/verify',
        params: { phone: fullPhone, displayPhone: `${country.flag} ${country.dial} ${phone}` },
      });
    } catch (e) {
      console.log('PhoneScreen: Error', e);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [phone, getFullPhone, router, country]);

  const handleSkip = useCallback(() => {
    router.push('/onboarding/name');
  }, [router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft size={24} color={Colors.textPrimary} />
            </TouchableOpacity>

            <ProgressDots active={1} />

            <Text style={styles.title}>What's your number?</Text>
            <Text style={styles.subtitle}>We'll send you a code to verify it's you.</Text>

            <View style={styles.inputCard}>
              <TouchableOpacity
                style={styles.countryBtn}
                onPress={() => setShowCountryPicker(!showCountryPicker)}
              >
                <Text style={styles.countryFlag}>{country.flag}</Text>
                <Text style={styles.countryDial}>{country.dial}</Text>
              </TouchableOpacity>
              <TextInput
                ref={inputRef}
                style={styles.phoneInput}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="(555) 012-3456"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                autoFocus
                testID="phone-input"
              />
            </View>

            {showCountryPicker && (
              <View style={styles.countryList}>
                {COUNTRY_CODES.map((c, idx) => (
                  <TouchableOpacity
                    key={c.code}
                    style={[
                      styles.countryRow,
                      idx === selectedCountry && styles.countryRowActive,
                    ]}
                    onPress={() => {
                      setSelectedCountry(idx);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={styles.countryRowFlag}>{c.flag}</Text>
                    <Text style={styles.countryRowCode}>{c.code}</Text>
                    <Text style={styles.countryRowDial}>{c.dial}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
          </ScrollView>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendCode}
              activeOpacity={0.8}
              disabled={loading}
              testID="send-code-btn"
            >
              {loading ? (
                <ActivityIndicator color={Colors.textPrimary} />
              ) : (
                <Text style={styles.buttonText}>Send Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip for now</Text>
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
  scrollContent: {
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
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 0.5,
    borderColor: Colors.border,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    borderRightWidth: 0.5,
    borderRightColor: Colors.border,
    gap: 4,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryDial: {
    fontSize: 16,
    fontFamily: fonts.bodyMedium,
    color: Colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.body,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 0,
    height: '100%',
  },
  countryList: {
    marginTop: 8,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  countryRowActive: {
    backgroundColor: Colors.greenLight,
  },
  countryRowFlag: {
    fontSize: 18,
  },
  countryRowCode: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: Colors.textPrimary,
    width: 30,
  },
  countryRowDial: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 13,
    color: Colors.red,
    marginTop: 12,
    marginLeft: 4,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  button: {
    backgroundColor: Colors.green,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
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
  },
  skipText: {
    fontSize: 14,
    color: '#8A8A8A',
  },
});
