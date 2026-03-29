import React, { useCallback } from 'react';
import { ScrollView, Text, View, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { fonts } from '@/constants/typography';
import Colors from '@/constants/colors';

interface AboutItem {
  label: string;
  value: string;
  isLink?: boolean;
  isEmail?: boolean;
}

const aboutItems: AboutItem[] = [
  { label: 'Version', value: '1.0.0' },
  { label: 'Build', value: '1' },
  { label: 'Support', value: 'support@getsafely.app', isLink: true, isEmail: true },
  { label: 'Privacy', value: 'privacy@getsafely.app', isLink: true, isEmail: true },
  { label: 'Legal', value: 'legal@getsafely.app', isLink: true, isEmail: true },
  { label: 'Website', value: 'getsafely.app', isLink: true },
];

export default function AboutScreen() {
  const router = useRouter();

  const handlePress = useCallback((item: AboutItem) => {
    if (!item.isLink) return;
    if (item.isEmail) {
      Linking.openURL(`mailto:${item.value}`).catch((e) => console.log('AboutScreen: Failed to open email', e));
    } else {
      Linking.openURL(`https://${item.value}`).catch((e) => console.log('AboutScreen: Failed to open URL', e));
    }
  }, []);

  const handleFeedback = useCallback(() => {
    Linking.openURL('mailto:support@getsafely.app?subject=Safely App Feedback&body=App version: 1.0.0\nDevice: iOS\n\nFeedback:\n').catch((e) => console.log('AboutScreen: Failed to open feedback', e));
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About Safely</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Text style={styles.appName}>Safely</Text>
          <Text style={styles.tagline}>Get home safe.</Text>
        </View>

        <View style={styles.card}>
          {aboutItems.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.row, idx > 0 && styles.rowBorder]}
              onPress={() => handlePress(item)}
              disabled={!item.isLink}
              activeOpacity={item.isLink ? 0.7 : 1}
            >
              <Text style={styles.rowLabel}>{item.label}</Text>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, item.isLink && styles.rowValueLink]}>
                  {item.value}
                </Text>
                {item.isLink && <ChevronRight size={14} color={Colors.textMuted} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.feedbackButton} onPress={handleFeedback} activeOpacity={0.8}>
          <Text style={styles.feedbackText}>Send Feedback</Text>
        </TouchableOpacity>

        <Text style={styles.copyright}>Made with care in California</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSoft,
  },
  headerSafe: {
    backgroundColor: Colors.backgroundSoft,
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
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  appName: {
    fontWeight: '700' as const,
    fontSize: 36,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  rowLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  rowValueLink: {
    color: Colors.green,
  },
  feedbackButton: {
    marginTop: 24,
    backgroundColor: Colors.green,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  copyright: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});
