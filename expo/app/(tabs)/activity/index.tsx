import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { useSafelyStore } from '@/store';
import { SessionHistory } from '@/store/types';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';

export default function ActivityScreen() {
  const { sessionHistory } = useSafelyStore();

  const renderSession = ({ item }: { item: SessionHistory }) => (
    <Card style={styles.sessionCard}>
      <View style={styles.sessionRow}>
        <View style={styles.checkCircle}>
          <CheckCircle size={20} color="#FFFFFF" />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName}>{item.eventName}</Text>
          <Text style={styles.sessionMeta}>
            {item.date} · {item.duration} · {item.guardianName}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activity</Text>
        </View>
      </SafeAreaView>

      {sessionHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrapper}>
            <Shield size={48} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyText}>No sessions yet. Stay safe out there.</Text>
        </View>
      ) : (
        <FlatList
          data={sessionHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderSession}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSoft,
  },
  safeArea: {
    backgroundColor: Colors.backgroundSoft,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: Colors.textPrimary,
  },
  listContent: {
    padding: 24,
    gap: 12,
  },
  sessionCard: {
    marginBottom: 0,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  sessionMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
