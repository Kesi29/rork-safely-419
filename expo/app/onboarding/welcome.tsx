import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';

export default function WelcomeScreen() {
  const router = useRouter();

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
            style={styles.button}
            onPress={() => router.push('/onboarding/phone')}
            activeOpacity={0.8}
            testID="welcome-get-started"
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>

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
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: Colors.textPrimary,
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
