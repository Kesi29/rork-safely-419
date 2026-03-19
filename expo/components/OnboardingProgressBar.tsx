import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Colors from '@/constants/colors';

const TOTAL_STEPS = 10;

interface OnboardingProgressBarProps {
  step: number;
}

export default function OnboardingProgressBar({ step }: OnboardingProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: (step / TOTAL_STEPS) * 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [step, widthAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  track: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.green,
    borderRadius: 2,
  },
});
