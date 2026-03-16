import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import Avatar from './Avatar';
import Colors from '@/constants/colors';

interface GuardianToastProps {
  guardianName: string;
  message: string;
  borderColor?: string;
  visible: boolean;
  onDismiss: () => void;
}

export default function GuardianToast({ guardianName, message, borderColor = Colors.green, visible, onDismiss }: GuardianToastProps) {
  const translateY = useRef(new Animated.Value(200)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: 200,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(200);
    }
  }, [visible, translateY, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.inner}>
        <Avatar name={guardianName} size={44} />
        <View style={styles.content}>
          <Text style={styles.title}>SMS sent to {guardianName}</Text>
          <View style={[styles.bubble, { borderLeftColor: borderColor }]}>
            <Text style={styles.message}>{message}</Text>
          </View>
        </View>
        <CheckCircle size={22} color={Colors.green} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  inner: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  bubble: {
    backgroundColor: Colors.border,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
