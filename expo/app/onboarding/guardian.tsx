import React, { useState, useCallback, useRef } from 'react';
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
import { ArrowLeft, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { useSafelyStore } from '@/store';
import { Relationship } from '@/store/types';
import { api } from '@/constants/api';

const RELATIONSHIPS: Relationship[] = ['Partner', 'Parent', 'Friend', 'Sibling', 'Other'];
const AVATAR_COLORS = ['#18A57D', '#007AFF', '#FFB020', '#FF3B3B', '#9B59B6'];

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

export default function OnboardingGuardianScreen() {
  const router = useRouter();
  const { addGuardian, guardians, userId, userName } = useSafelyStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('Partner');
  const [selectedCountry, setSelectedCountry] = useState(0);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const country = COUNTRY_CODES[selectedCountry];

  const isValid = name.trim().length >= 1 && phone.replace(/\D/g, '').length >= 7;

  const handlePhoneChange = useCallback((text: string) => {
    setPhone(formatPhoneUS(text));
  }, []);

  const handleAddGuardian = useCallback(async () => {
    if (!isValid) return;

    setLoading(true);

    const digits = phone.replace(/\D/g, '');
    const fullPhone = `${country.dial}${digits}`;

    const guardian = {
      id: `guardian-${Date.now()}`,
      name: name.trim(),
      phone: fullPhone,
      relationship,
      isPrimary: true,
      avatarColor: AVATAR_COLORS[guardians.length % AVATAR_COLORS.length],
    };

    addGuardian(guardian);

    try {
      await api.inviteGuardian({
        userId,
        guardianName: guardian.name,
        guardianPhone: guardian.phone,
        relationship: guardian.relationship,
        userName,
      });
      console.log('GuardianOnboarding: Invite sent');
    } catch (e) {
      console.log('GuardianOnboarding: API error', e);
    }

    setLoading(false);
    setConfirmed(true);

    confirmTimer.current = setTimeout(() => {
      router.push('/onboarding/home');
    }, 1500);
  }, [isValid, name, phone, relationship, country.dial, guardians.length, addGuardian, userId, userName, router]);

  const handleSkip = useCallback(() => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    router.push('/onboarding/home');
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
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft size={24} color={Colors.textPrimary} />
            </TouchableOpacity>

            <ProgressDots active={3} />

            <Text style={styles.title}>Who looks out{'\n'}for you?</Text>
            <Text style={styles.subtitle}>
              They'll get a text when you leave and when you arrive home safely. They don't need the app.
            </Text>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>NAME</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Guardian's name"
                placeholderTextColor={Colors.textMuted}
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
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                  testID="guardian-phone-input"
                />
              </View>

              {showCountryPicker && (
                <View style={styles.countryList}>
                  {COUNTRY_CODES.map((c, idx) => (
                    <TouchableOpacity
                      key={c.code}
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

              <Text style={styles.inputLabel}>RELATIONSHIP</Text>
              <View style={styles.relPicker}>
                {RELATIONSHIPS.map((rel) => (
                  <TouchableOpacity
                    key={rel}
                    style={[styles.relPill, relationship === rel && styles.relPillActive]}
                    onPress={() => setRelationship(rel)}
                  >
                    <Text style={[styles.relPillText, relationship === rel && styles.relPillTextActive]}>
                      {rel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {confirmed && (
              <View style={styles.confirmBanner}>
                <Check size={16} color={Colors.green} />
                <Text style={styles.confirmText}>
                  {name.trim()} will receive an invite shortly
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.button, (!isValid || loading || confirmed) && styles.buttonDisabled]}
              onPress={handleAddGuardian}
              activeOpacity={0.8}
              disabled={!isValid || loading || confirmed}
              testID="add-guardian-btn"
            >
              {loading ? (
                <ActivityIndicator color={Colors.textPrimary} />
              ) : (
                <Text style={[styles.buttonText, (!isValid && !confirmed) && styles.buttonTextDisabled]}>
                  Add Guardian
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
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#8A8A8A',
    lineHeight: 20,
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSoft,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: fonts.body,
    color: Colors.textPrimary,
    borderWidth: 0.5,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSoft,
    borderWidth: 0.5,
    borderColor: Colors.border,
    marginBottom: 16,
    overflow: 'hidden',
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
    fontSize: 18,
  },
  countryDial: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: Colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.body,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    height: '100%',
  },
  countryList: {
    marginBottom: 12,
    backgroundColor: Colors.backgroundSoft,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  countryRowActive: {
    backgroundColor: Colors.greenLight,
  },
  countryRowFlag: {
    fontSize: 16,
  },
  countryRowCode: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: Colors.textPrimary,
    width: 28,
  },
  countryRowDial: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  relPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  relPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  relPillActive: {
    backgroundColor: Colors.green,
  },
  relPillText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  relPillTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700' as const,
  },
  confirmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.greenLight,
    borderRadius: 12,
  },
  confirmText: {
    fontSize: 14,
    color: Colors.greenDark,
    fontFamily: fonts.bodyMedium,
    flex: 1,
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
    backgroundColor: Colors.border,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: Colors.textPrimary,
  },
  buttonTextDisabled: {
    color: Colors.textMuted,
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
