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
import OnboardingProgressBar from '@/components/OnboardingProgressBar';

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
        <OnboardingProgressBar step={2} />
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
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.title}>What's your number?</Text>
            <Text style={styles.subtitle}>We'll send you a verification code. No spam, ever.</Text>

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
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="phone-pad"
                autoFocus
                testID="phone-input"
              />
            </View>

            {showCountryPicker && (
              <View style={styles.countryList}>
                {COUNTRY_CODES.map((c, idx) => (
                  <TouchableOpacity
                    key={c.code + c.dial}
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

            <Text style={styles.privacyNote}>
              Your number is only shared with your chosen guardians
            </Text>
          </ScrollView>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendCode}
              activeOpacity={0.85}
              disabled={loading}
              testID="send-code-btn"
            >
              {loading ? (
                <ActivityIndicator color="#0A0A0A" />
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
    backgroundColor: '#0A0A0A',
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
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
    marginBottom: 32,
    lineHeight: 22,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 4,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
    gap: 4,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryDial: {
    fontSize: 16,
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.body,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 0,
    height: '100%',
  },
  countryList: {
    marginTop: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  countryRowActive: {
    backgroundColor: 'rgba(24,165,125,0.15)',
  },
  countryRowFlag: {
    fontSize: 18,
  },
  countryRowCode: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    width: 30,
  },
  countryRowDial: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  errorText: {
    fontSize: 13,
    color: Colors.red,
    marginTop: 12,
    marginLeft: 4,
  },
  privacyNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 24,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  button: {
    backgroundColor: Colors.green,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: '#0A0A0A',
  },
  skipBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.4)',
  },
});
