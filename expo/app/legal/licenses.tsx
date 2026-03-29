import React, { useCallback } from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ExternalLink } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface LicenseItem {
  name: string;
  license: string;
  url: string;
}

const licenses: LicenseItem[] = [
  { name: 'React Native', license: 'MIT', url: 'https://github.com/facebook/react-native' },
  { name: 'Expo', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Supabase', license: 'Apache 2.0', url: 'https://github.com/supabase/supabase' },
  { name: 'React Navigation', license: 'MIT', url: 'https://github.com/react-navigation/react-navigation' },
  { name: 'Zustand', license: 'MIT', url: 'https://github.com/pmndrs/zustand' },
  { name: 'React Native Maps', license: 'MIT', url: 'https://github.com/react-native-maps/react-native-maps' },
  { name: 'Expo Location', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Notifications', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'React Native Gesture Handler', license: 'MIT', url: 'https://github.com/software-mansion/react-native-gesture-handler' },
  { name: 'DM Sans Font', license: 'OFL', url: 'https://fonts.google.com/specimen/DM+Sans' },
  { name: 'Playfair Display Font', license: 'OFL', url: 'https://fonts.google.com/specimen/Playfair+Display' },
  { name: 'Lucide Icons', license: 'ISC', url: 'https://github.com/lucide-icons/lucide' },
];

export default function LicensesScreen() {
  const router = useRouter();

  const openUrl = useCallback((url: string) => {
    Linking.openURL(url).catch((e) => console.log('LicensesScreen: Failed to open URL', e));
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Open Source Licenses</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {licenses.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.row}
            onPress={() => openUrl(item.url)}
            activeOpacity={0.7}
          >
            <View style={styles.rowInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.licenseType}>{item.license}</Text>
            </View>
            <ExternalLink size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSafe: {
    backgroundColor: Colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontWeight: '700' as const,
    fontSize: 20,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  rowInfo: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  licenseType: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
