import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

type BadgeStatus = 'active' | 'late' | 'emergency' | 'arrived' | 'upcoming' | 'completed' | 'cancelled';

const config: Record<BadgeStatus, { bg: string; text: string; label: string }> = {
  active: { bg: Colors.greenLight, text: Colors.greenDark, label: 'Active' },
  late: { bg: Colors.amberLight, text: Colors.amberDark, label: 'Late' },
  emergency: { bg: Colors.redLight, text: Colors.redDark, label: 'SOS Active' },
  arrived: { bg: Colors.greenLight, text: Colors.greenDark, label: 'Safe' },
  upcoming: { bg: Colors.blueLight, text: '#0066CC', label: 'Upcoming' },
  completed: { bg: 'rgba(0,0,0,0.06)', text: Colors.textSecondary, label: 'Completed' },
  cancelled: { bg: 'rgba(0,0,0,0.06)', text: Colors.textSecondary, label: 'Cancelled' },
};

interface StatusBadgeProps {
  status: BadgeStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status] ?? config.completed;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  text: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
});
