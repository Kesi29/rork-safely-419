import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { useSafelyStore } from '@/store';
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

export default function GuardianScreen() {
  const router = useRouter();
  const { addGuardian, userId, updateOnboardingProfile, onboardingProfile } = useSafelyStore();

  const [name, setName] = useState(onboardingProfile.guardianName || '');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(0);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const country = COUNTRY_CODES[selectedCountry];
  const isValid = name.trim().length >= 1 && phone.replace(/\D/g, '').length >= 7;

  const handlePhoneChange = useCallback((text: string) => {
    setPhone(formatPhoneUS(text));
  }, []);

  const handleContinue = useCallback(async () => {
    if (!isValid) return;

    setLoading(true);
    const digits = phone.replace(/\D/g, '');
    const fullPhone = `${country.dial}${digits}`;
    const trimName = name.trim();

    try {
      const guardian = {
        id: `guardian-${Date.now()}`,
        name: trimName,
        phone: fullPhone,
        relationship: 'Friend' as const,
        isPrimary: true,
        avatarColor: '#18A57D',
      };

      addGuardian(guardian);
      updateOnboardingProfile({
        guardianName: trimName,
        guardianPhone: fullPhone,
        onboardingStep: 6,
      });

      if (userId && !userId.startsWith('local-')) {
        await supabase.from('profiles').update({
          guardian_name: trimName,
          guardian_phone: fullPhone,
        }).eq('user_id', userId);
      }

      setConfirmed(true);
      setTimeout(() => {
        router.push('/onboarding/emergency-contact');
      }, 800);
    } catch (e) {
      console.log('GuardianScreen: Error', e);
      router.push('/onboarding/emergency-contact');
    } finally {
      setLoading(false);
    }
  }, [isValid, name, phone, country.dial, addGuardian, updateOnboardingProfile, userId, router]);

  const handleSkip = useCallback(() => {
    updateOnboardingProfile({ onboardingStep: 6 });
    router.push('/onboarding/emergency-contact');
  }, [updateOnboardingProfile, router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <OnboardingProgressBar step={6} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.title}>Who's your{'\n'}go-to person?</Text>
            <Text style={styles.subtitle}>
              This is who gets notified when you activate Safely. You can always change this later.
            </Text>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>GUARDIAN'S NAME</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Their name"
                placeholderTextColor="rgba(255,255,255,0.2)"
                autoCapitalize="words"
                testID="guardian-name-input"
              />

              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <View style={styles.phoneRow}>
                <TouchableOpacity
                  style={styles.countryBtn}
                  onPress={() => setShowCountryPicker(!showCountryPicker)}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={styles.countryDial}>{country.dial}</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="(555) 012-3456"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  keyboardType="phone-pad"
                  testID="guardian-phone-input"
                />
              </View>

              {showCountryPicker && (
                <View style={styles.countryList}>
                  {COUNTRY_CODES.map((c, idx) => (
                    <TouchableOpacity
                      key={c.code + c.dial}
                      style={[styles.countryRow, idx === selectedCountry && styles.countryRowActive]}
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
            </View>

            {confirmed && (
              <View style={styles.confirmBanner}>
                <Check size={16} color={Colors.green} />
                <Text style={styles.confirmText}>
                  {name.trim()} added as your guardian
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.faqBtn}
              onPress={() => setShowFaq(!showFaq)}
              activeOpacity={0.7}
            >
              <Text style={styles.faqBtnText}>Why do I need this?</Text>
              {showFaq ? (
                <ChevronUp size={16} color="rgba(255,255,255,0.4)" />
              ) : (
                <ChevronDown size={16} color="rgba(255,255,255,0.4)" />
              )}
            </TouchableOpacity>
            {showFaq && (
              <Text style={styles.faqText}>
                Your guardian receives a text when you start your journey home and when you arrive safely. They don't need the app — just their phone. If something goes wrong, they'll be the first to know.
              </Text>
            )}
          </ScrollView>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.button, (!isValid || loading || confirmed) && styles.buttonDisabled]}
              onPress={handleContinue}
              activeOpacity={0.85}
              disabled={!isValid || loading || confirmed}
              testID="add-guardian-btn"
            >
              {loading ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text style={[styles.buttonText, !isValid && styles.buttonTextDisabled]}>
                  Continue
                </Text>
              )}
            </TouchableOpacity>

            {!confirmed && (
              <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            )}
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
    fontWeight: '700' as const,
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 22,
    marginBottom: 28,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: fonts.body,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryDial: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.body,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    height: '100%',
  },
  countryList: {
    marginBottom: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  countryRowActive: {
    backgroundColor: 'rgba(24,165,125,0.15)',
  },
  countryRowFlag: {
    fontSize: 16,
  },
  countryRowCode: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    width: 28,
  },
  countryRowDial: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  confirmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(24,165,125,0.12)',
    borderRadius: 12,
  },
  confirmText: {
    fontSize: 14,
    color: Colors.green,
    fontFamily: fonts.bodyMedium,
    flex: 1,
  },
  faqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
  },
  faqBtnText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: 'rgba(255,255,255,0.4)',
  },
  faqText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.35)',
    lineHeight: 21,
    marginBottom: 8,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: '#0A0A0A',
  },
  buttonTextDisabled: {
    color: 'rgba(255,255,255,0.25)',
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
