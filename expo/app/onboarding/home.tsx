import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { useSafelyStore } from '@/store';
import { supabase } from '@/lib/supabase';
import AddressSearch from '@/components/AddressSearch';

interface AddressResult {
  label: string;
  coords: {
    latitude: number;
    longitude: number;
  };
}

export default function OnboardingHomeScreen() {
  const router = useRouter();
  const { setHomeAddress, setHasOnboarded, primaryGuardian, userId } = useSafelyStore();

  const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddressSelected = useCallback((result: AddressResult) => {
    console.log('OnboardingHome: Address selected:', result.label);
    setSelectedAddress(result);
  }, []);

  const handleClear = useCallback(() => {
    setSelectedAddress(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selectedAddress) return;

    setLoading(true);

    try {
      setHomeAddress({
        label: selectedAddress.label,
        coords: selectedAddress.coords,
      });

      if (userId && !userId.startsWith('local-')) {
        console.log('OnboardingHome: Updating Supabase with home address');
        const { error } = await supabase.from('users').update({
          home_address: selectedAddress.label,
          home_latitude: selectedAddress.coords.latitude,
          home_longitude: selectedAddress.coords.longitude,
        }).eq('id', userId);

        if (error) {
          console.log('OnboardingHome: Supabase update error', error);
        }
      }

      setHasOnboarded(true);
      router.replace('/(tabs)/(home)');
    } catch (e) {
      console.log('OnboardingHome: Error', e);
      setHasOnboarded(true);
      router.replace('/(tabs)/(home)');
    } finally {
      setLoading(false);
    }
  }, [selectedAddress, setHomeAddress, setHasOnboarded, userId, router]);

  const isConfirmEnabled = selectedAddress !== null && !loading;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
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

            <Text style={styles.title}>Where's home?</Text>
            <Text style={styles.subtitle}>
              We'll notify {primaryGuardian?.name ?? 'your guardian'} when you arrive here.
            </Text>

            <View style={styles.searchSection}>
              <AddressSearch
                onAddressSelected={handleAddressSelected}
                onClear={handleClear}
                autoFocus
              />
            </View>
          </ScrollView>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.button, !isConfirmEnabled && styles.buttonDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              disabled={!isConfirmEnabled}
              testID="home-confirm-btn"
            >
              {loading ? (
                <ActivityIndicator color={Colors.textPrimary} />
              ) : (
                <Text style={[styles.buttonText, !isConfirmEnabled && styles.buttonTextDisabled]}>
                  This is Home
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
  scrollContent: {
    flexGrow: 1,
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
    lineHeight: 20,
    marginBottom: 24,
  },
  searchSection: {
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
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
