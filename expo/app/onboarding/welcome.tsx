import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';

export default function WelcomeScreen() {
  const router = useRouter();
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('safely_terms_accepted_at', new Date().toISOString());
      await AsyncStorage.setItem('safely_terms_version', '2026-03');
      await AsyncStorage.setItem('safely_age_confirmed', 'true');
    } catch (e) {
      console.log('WelcomeScreen: Error saving acceptance', e);
    }
    router.push('/onboarding/phone');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.spacer} />

          <Text style={styles.title}>Safely</Text>
          <Text style={styles.subtitle}>Get home safe.</Text>

          <View style={styles.iconWrapper}>
            <ShieldCheck size={72} color={Colors.green} strokeWidth={1.5} />
          </View>

          <View style={styles.spacer} />
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.ageRow}
            onPress={() => setAgeConfirmed(!ageConfirmed)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              ageConfirmed && styles.checkboxChecked,
            ]}>
              {ageConfirmed && <Check size={13} color="#FFFFFF" />}
            </View>
            <Text style={styles.ageText}>I confirm that I am 18 years of age or older</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !ageConfirmed && styles.buttonDisabled]}
            onPress={handleGetStarted}
            activeOpacity={0.8}
            disabled={!ageConfirmed}
            testID="welcome-get-started"
          >
            <Text style={[styles.buttonText, !ageConfirmed && styles.buttonTextDisabled]}>Get Started</Text>
          </TouchableOpacity>

          <View style={styles.legalTextWrapper}>
            <Text style={styles.legalText}>
              By continuing you agree to our{' '}
              <Text
                style={styles.legalLink}
                onPress={() => router.push('/legal/terms')}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                style={styles.legalLink}
                onPress={() => router.push('/legal/privacy')}
              >
                Privacy Policy
              </Text>
              . Safely is not an emergency service.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.push('/onboarding/phone')}
            activeOpacity={0.6}
          >
            <Text style={styles.linkText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  spacer: {
    flex: 1,
  },
  iconWrapper: {
    marginTop: 48,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 52,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 22,
    color: '#8A8A8A',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#BBBBBB',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    borderColor: Colors.green,
    backgroundColor: Colors.green,
  },
  ageText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#8A8A8A',
    flex: 1,
  },
  button: {
    backgroundColor: Colors.green,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
    shadowOpacity: 0,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: Colors.textPrimary,
  },
  buttonTextDisabled: {
    color: Colors.textMuted,
  },
  legalTextWrapper: {
    paddingHorizontal: 8,
    marginTop: 16,
  },
  legalText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#BBBBBB',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: Colors.green,
    textDecorationLine: 'underline' as const,
  },
  linkBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  linkText: {
    fontSize: 14,
    color: '#8A8A8A',
  },
});
