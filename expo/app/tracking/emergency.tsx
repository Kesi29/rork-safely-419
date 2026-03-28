import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafelyStore } from '../../store';
import { supabase } from '../../lib/supabase';

export default function EmergencyScreen() {
  const router = useRouter();
  const primaryGuardian = useSafelyStore((s) => s.primaryGuardian);
  const activeSessionId = useSafelyStore((s) => s.activeSessionId);

  const handleCancelSOS = () => {
    Alert.alert('Are you sure?', 'Confirm you are safe', [
      {
        text: 'Yes, I am safe',
        onPress: async () => {
          if (activeSessionId) {
            await supabase
              .from('sessions')
              .update({ status: 'active' })
              .eq('id', activeSessionId);
          }
          router.replace('/tracking/active');
        },
      },
      { text: 'Stay on SOS', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SOS ACTIVE</Text>
      {primaryGuardian?.name ? (
        <Text style={styles.notified}>
          {primaryGuardian.name} has been notified with your location
        </Text>
      ) : null}
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSOS}>
        <Text style={styles.cancelText}>Cancel SOS — I'm Safe</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  notified: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 48,
    opacity: 0.9,
  },
  cancelButton: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  cancelText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
