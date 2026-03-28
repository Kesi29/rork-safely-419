import { useEffect } from 'react';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function ArrivedScreen() {
  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const t = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#00E87A', fontSize: 32 }}>You made it home! 🎉</Text>
    </View>
  );
}
