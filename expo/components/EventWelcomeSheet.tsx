import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { ConnectedEvent } from '@/store/types';

interface EventWelcomeSheetProps {
  event: ConnectedEvent | null;
  onDismiss: () => void;
}

export default function EventWelcomeSheet({ event, onDismiss }: EventWelcomeSheetProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (event) {
      const checkSeen = async () => {
        try {
          const seenEvents = await AsyncStorage.getItem('safely_seen_event_welcomes');
          const seen: string[] = seenEvents ? JSON.parse(seenEvents) : [];
          if (seen.includes(event.id)) {
            console.log('EventWelcomeSheet: Already seen event', event.id);
            onDismiss();
            return;
          }
        } catch (e) {
          console.log('EventWelcomeSheet: Error checking seen events', e);
        }

        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      };
      void checkSeen();
    }
  }, [event, scaleAnim, opacityAnim, onDismiss]);

  const handleDismiss = async () => {
    if (event) {
      try {
        const seenEvents = await AsyncStorage.getItem('safely_seen_event_welcomes');
        const seen: string[] = seenEvents ? JSON.parse(seenEvents) : [];
        if (!seen.includes(event.id)) {
          seen.push(event.id);
          await AsyncStorage.setItem('safely_seen_event_welcomes', JSON.stringify(seen));
        }
      } catch (e) {
        console.log('EventWelcomeSheet: Error saving seen event', e);
      }
    }
    onDismiss();
  };

  if (!event) return null;

  const formattedEndTime = event.endTime
    ? (() => {
        const [h, m] = event.endTime.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return event.endTime;
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      })()
    : '';

  return (
    <Modal visible={!!event} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.sheet,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Calendar size={28} color={Colors.green} />
            </View>
          </View>

          <Text style={styles.title}>{event.name}</Text>

          <Text style={styles.checkedIn}>You're checked in!</Text>

          {formattedEndTime ? (
            <Text style={styles.description}>
              We'll remind you to turn on Safely when the event ends at{' '}
              <Text style={styles.timeHighlight}>{formattedEndTime}</Text>
            </Text>
          ) : (
            <Text style={styles.description}>
              We'll remind you to turn on Safely when it's time to head home.
            </Text>
          )}

          {event.partnerSlug && (
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerText}>
                Partnered event
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleDismiss}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700' as const,
    fontSize: 24,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  checkedIn: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.green,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  timeHighlight: {
    color: Colors.textPrimary,
    fontWeight: '700' as const,
  },
  partnerBadge: {
    backgroundColor: Colors.greenLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  partnerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.green,
  },
  button: {
    backgroundColor: Colors.green,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
});
