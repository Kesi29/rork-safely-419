import React, { useState, useCallback } from 'react';
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
import { useSafelyStore } from '@/store';
import { supabase } from '@/lib/supabase';
import OnboardingProgressBar from '@/components/OnboardingProgressBar';

export default function NameScreen() {
  const router = useRouter();
  const { setUserName, userId, userPhone, onboardingProfile, updateOnboardingProfile } = useSafelyStore();

  const [firstName, setFirstName] = useState(onboardingProfile.firstName || '');
  const [lastName, setLastName] = useState(onboardingProfile.lastName || '');
  const [loading, setLoading] = useState(false);

  const isValid = firstName.trim().length >= 1 && lastName.trim().length >= 1;

  const handleContinue = useCallback(async () => {
    if (!isValid) return;

    setLoading(true);
    const trimFirst = firstName.trim();
    const trimLast = lastName.trim();
    const fullName = `${trimFirst} ${trimLast}`;

    try {
      setUserName(fullName);
      updateOnboardingProfile({
        firstName: trimFirst,
        lastName: trimLast,
        onboardingStep: 4,
      });

      if (userId && !userId.startsWith('local-')) {
        console.log('NameScreen: Upserting profile to Supabase', userId);
        const { error } = await supabase.from('profiles').upsert({
          user_id: userId,
          phone: userPhone,
          first_name: trimFirst,
          last_name: trimLast,
        }, { onConflict: 'user_id' });
        if (error) {
          console.log('NameScreen: Supabase upsert error', error);
        }
      }

      router.push('/onboarding/profile-photo');
    } catch (e) {
      console.log('NameScreen: Error', e);
      router.push('/onboarding/profile-photo');
    } finally {
      setLoading(false);
    }
  }, [firstName, lastName, isValid, userId, userPhone, setUserName, updateOnboardingProfile, router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <OnboardingProgressBar step={4} />
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

            <Text style={styles.title}>What should we{'\n'}call you?</Text>
            <Text style={styles.subtitle}>
              Your guardian will see this when you activate Safely.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>FIRST NAME</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor="rgba(255,255,255,0.25)"
                autoCapitalize="words"
                autoFocus
                autoCorrect={false}
                testID="first-name-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>LAST NAME</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor="rgba(255,255,255,0.25)"
                autoCapitalize="words"
                autoCorrect={false}
                testID="last-name-input"
              />
            </View>
          </ScrollView>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
              onPress={handleContinue}
              activeOpacity={0.85}
              disabled={!isValid || loading}
              testID="name-continue-btn"
            >
              {loading ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text style={[styles.buttonText, !isValid && styles.buttonTextDisabled]}>
                  Continue
                </Text>
              )}
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
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    fontSize: 17,
    fontFamily: fonts.body,
    color: '#FFFFFF',
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
});
