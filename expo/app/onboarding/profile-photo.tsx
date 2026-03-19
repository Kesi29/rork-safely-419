import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { useSafelyStore } from '@/store';
import { supabase } from '@/lib/supabase';
import OnboardingProgressBar from '@/components/OnboardingProgressBar';

export default function ProfilePhotoScreen() {
  const router = useRouter();
  const { userId, onboardingProfile, updateOnboardingProfile } = useSafelyStore();

  const [imageUri, setImageUri] = useState<string | null>(onboardingProfile.avatarUrl);
  const [uploading, setUploading] = useState(false);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        console.log('ProfilePhoto: Image selected');
      }
    } catch (e) {
      console.log('ProfilePhoto: Image picker error', e);
    }
  }, []);

  const handleContinue = useCallback(async () => {
    setUploading(true);

    try {
      if (imageUri && userId && !userId.startsWith('local-') && !imageUri.startsWith('http')) {
        console.log('ProfilePhoto: Uploading image to Supabase storage');
        const ext = imageUri.split('.').pop() ?? 'jpg';
        const fileName = `${userId}/avatar.${ext}`;

        if (Platform.OS !== 'web') {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, blob, { upsert: true, contentType: `image/${ext}` });

          if (uploadError) {
            console.log('ProfilePhoto: Upload error', uploadError);
          } else {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            if (urlData?.publicUrl) {
              updateOnboardingProfile({ avatarUrl: urlData.publicUrl });
              await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('user_id', userId);
            }
          }
        }
      }

      updateOnboardingProfile({ onboardingStep: 5 });
      router.push('/onboarding/guardian');
    } catch (e) {
      console.log('ProfilePhoto: Error', e);
      router.push('/onboarding/guardian');
    } finally {
      setUploading(false);
    }
  }, [imageUri, userId, updateOnboardingProfile, router]);

  const handleSkip = useCallback(() => {
    updateOnboardingProfile({ onboardingStep: 5 });
    router.push('/onboarding/guardian');
  }, [updateOnboardingProfile, router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <OnboardingProgressBar step={5} />
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.title}>Add a photo</Text>
          <Text style={styles.subtitle}>
            So your guardian knows it's you. This is optional.
          </Text>

          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarCircle} onPress={pickImage} activeOpacity={0.8}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={48} color="rgba(255,255,255,0.3)" strokeWidth={1.2} />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Camera size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={pickImage} style={styles.changeBtn}>
              <Text style={styles.changeBtnText}>
                {imageUri ? 'Change photo' : 'Choose from library'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.button, uploading && styles.buttonLoading]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>

          {!imageUri && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          )}
        </View>
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
    marginBottom: 48,
    lineHeight: 22,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0A0A0A',
  },
  changeBtn: {
    marginTop: 16,
    paddingVertical: 8,
  },
  changeBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: Colors.green,
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
  buttonLoading: {
    opacity: 0.8,
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
