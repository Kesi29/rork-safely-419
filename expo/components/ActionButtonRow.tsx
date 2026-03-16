import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import Colors from '@/constants/colors';

interface ActionButtonRowProps {
  centerLabel: string;
  centerColor?: string;
  centerIcon?: React.ReactNode;
  onCenterPress?: () => void;
  leftIcon?: React.ReactNode;
  leftLabel?: string;
  onLeftPress?: () => void;
  rightIcon?: React.ReactNode;
  rightLabel?: string;
  onRightPress?: () => void;
  pulse?: boolean;
  centerIsDecorative?: boolean;
}

export default function ActionButtonRow({
  centerLabel,
  centerColor = Colors.green,
  centerIcon,
  onCenterPress,
  leftIcon,
  leftLabel,
  onLeftPress,
  rightIcon,
  rightLabel,
  onRightPress,
  pulse = false,
  centerIsDecorative = false,
}: ActionButtonRowProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (pulse) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [pulse, pulseAnim]);

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.sideButton} onPress={onLeftPress} activeOpacity={0.7}>
        {leftIcon}
        {leftLabel ? <Text style={styles.sideLabel}>{leftLabel}</Text> : null}
      </TouchableOpacity>

      <Animated.View style={[{ transform: [{ scale: pulse ? pulseAnim : 1 }] }]}>
        <TouchableOpacity
          style={[
            styles.centerButton,
            {
              backgroundColor: centerColor,
              shadowColor: centerColor,
            },
          ]}
          onPress={centerIsDecorative ? undefined : onCenterPress}
          activeOpacity={centerIsDecorative ? 1 : 0.8}
          disabled={centerIsDecorative}
        >
          {centerIcon || <Text style={styles.centerLabel}>{centerLabel}</Text>}
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity style={styles.sideButton} onPress={onRightPress} activeOpacity={0.7}>
        {rightIcon}
        {rightLabel ? <Text style={styles.sideLabel}>{rightLabel}</Text> : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  sideButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.buttonSecondaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  centerButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  centerLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
