import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';

export default function WelcomeScreen() {
  const router = useRouter();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslate = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(buttonOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(buttonTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [logoOpacity, logoScale, textOpacity, buttonOpacity, buttonTranslate]);

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('safely_terms_accepted_at', new Date().toISOString());
      await AsyncStorage.setItem('safely_terms_version', '2026-03');
    } catch (e) {
      console.log('WelcomeScreen: Error saving acceptance', e);
    }
    router.push('/onboarding/phone');
  };

  const handleSignIn = () => {
    router.push('/onboarding/phone');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.spacer} />

          <Animated.View style={[styles.logoSection, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <View style={styles.shieldWrapper}>
              <ShieldCheck size={80} color={Colors.green} strokeWidth={1.3} />
            </View>
            <Text style={styles.title}>Safely</Text>
          </Animated.View>

          <Animated.View style={[styles.taglineSection, { opacity: textOpacity }]}>
            <Text style={styles.tagline}>Get home safely, every time.</Text>
            <Text style={styles.subtext}>Share your journey with someone who cares.</Text>
          </Animated.View>

          <View style={styles.spacer} />
        </View>

        <Animated.View style={[styles.bottomSection, { opacity: buttonOpacity, transform: [{ translateY: buttonTranslate }] }]}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleGetStarted}
            activeOpacity={0.85}
            testID="welcome-get-started"
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={handleSignIn}
            activeOpacity={0.6}
          >
            <Text style={styles.linkText}>I already have an account</Text>
          </TouchableOpacity>
        </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  spacer: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
  },
  shieldWrapper: {
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 56,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  taglineSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  tagline: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
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
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: '#0A0A0A',
  },
  linkBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  linkText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.45)',
  },
});
