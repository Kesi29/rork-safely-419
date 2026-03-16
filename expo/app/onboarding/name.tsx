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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { useSafelyStore } from '@/store';
import { supabase } from '@/lib/supabase';

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

export default function NameScreen() {
  const router = useRouter();
  const { setUserName, userId, userPhone } = useSafelyStore();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length >= 2;

  const handleContinue = useCallback(async () => {
    if (!isValid) return;

    setLoading(true);
    const trimmedName = name.trim();

    try {
      setUserName(trimmedName);

      if (userId && !userId.startsWith('local-')) {
        console.log('NameScreen: Upserting user to Supabase', userId);
        const { error } = await supabase.from('users').upsert({
          id: userId,
          phone: userPhone,
          name: trimmedName,
        });
        if (error) {
          console.log('NameScreen: Supabase upsert error', error);
        }
      }

      router.push('/onboarding/guardian');
    } catch (e) {
      console.log('NameScreen: Error', e);
      router.push('/onboarding/guardian');
    } finally {
      setLoading(false);
    }
  }, [name, isValid, userId, userPhone, setUserName, router]);

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

            <ProgressDots active={2} />

            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.subtitle}>
              This is how your guardian will know it's you.
            </Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="First name"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
              autoFocus
              autoCorrect={false}
              testID="name-input"
            />
          </View>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
              onPress={handleContinue}
              activeOpacity={0.8}
              disabled={!isValid || loading}
              testID="name-continue-btn"
            >
              {loading ? (
                <ActivityIndicator color={Colors.textPrimary} />
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
  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 0.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: fonts.body,
    color: Colors.textPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
});
