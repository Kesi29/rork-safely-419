import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

interface SOSButtonProps {
  onPress: () => void;
  onHoldComplete?: () => void;
}

export default function SOSButton({ onPress, onHoldComplete }: SOSButtonProps) {
  const pulseAnim = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.15,
          duration: 750,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.45,
          duration: 750,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={() => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          onHoldComplete?.();
        }}
        delayLongPress={3000}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.button, { shadowOpacity: pulseAnim }]}>
          <AlertTriangle size={26} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
      <Text style={styles.label}>SOS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 130,
    right: 24,
    alignItems: 'center',
    zIndex: 100,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    color: Colors.red,
    fontSize: 11,
    fontWeight: '700' as const,
    marginTop: 4,
  },
});
