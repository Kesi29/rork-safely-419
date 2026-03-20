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
import { supabase } from '@/lib/supabase';
import OnboardingProgressBar from '@/components/OnboardingProgressBar';

export default function EmailScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMagicLink = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('EmailScreen: Sending magic link to', trimmed);

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: 'safely://auth/callback',
        },
      });

      if (otpError) {
        console.log('EmailScreen: OTP error', otpError);
        setError(otpError.message || 'Failed to send magic link.');
        setLoading(false);
        return;
      }

      console.log('EmailScreen: Magic link sent successfully');
      router.push({
        pathname: '/onboarding/verify',
        params: { email: trimmed },
      });
    } catch (e) {
      console.log('EmailScreen: Error', e);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, router]);

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

            <Text style={styles.title}>What's your email?</Text>
            <Text style={styles.subtitle}>We'll send you a magic link to sign in. No passwords needed.</Text>

            <View style={styles.inputCard}>
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                }}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                testID="email-input"
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Text style={styles.privacyNote}>
              Your email is only used for authentication
            </Text>
          </ScrollView>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendMagicLink}
              activeOpacity={0.85}
              disabled={loading}
              testID="send-magic-link-btn"
            >
              {loading ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text style={styles.buttonText}>Send Magic Link</Text>
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
    paddingHorizontal: 16,
  },
  emailInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.body,
    color: '#FFFFFF',
    paddingVertical: 0,
    height: '100%',
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
