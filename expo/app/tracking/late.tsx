import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, Clock, Home as HomeIcon } from 'lucide-react-native';
import SafeMap from '@/components/SafeMap';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { useSafelyStore } from '@/store';
import Avatar from '@/components/Avatar';
import Card from '@/components/Card';
import ActionButtonRow from '@/components/ActionButtonRow';
import SOSButton from '@/components/SOSButton';
import GuardianToast from '@/components/GuardianToast';
import { sendGuardianSMS, formatGuardianMessage } from '@/utils/sms';
import { api } from '@/constants/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ETA_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hr', value: 60 },
];

export default function LateScreen() {
  const router = useRouter();
  const {
    userName,
    primaryGuardian,
    currentCoords,
    session,
    startSession,
    setTrackingStatus,
    userId,
    activeSessionId,
  } = useSafelyStore();

  const [showToast, setShowToast] = useState(true);
  const [showEtaModal, setShowEtaModal] = useState(false);
  const [selectedEta, setSelectedEta] = useState(30);
  const smsSentRef = React.useRef(false);

  const lastSeenTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  React.useEffect(() => {
    if (!smsSentRef.current && primaryGuardian && primaryGuardian.phone) {
      smsSentRef.current = true;
      const msg = formatGuardianMessage('late', {
        userName,
        guardianName: primaryGuardian.name,
        time: lastSeenTime,
      });
      console.log('LateScreen: Sending late SMS to', primaryGuardian.phone);
      void sendGuardianSMS(primaryGuardian.phone, msg);
      try {
        void api.late({
          userId,
          sessionId: activeSessionId,
          guardianPhone: primaryGuardian.phone,
          guardianName: primaryGuardian.name,
          userName,
          coords: currentCoords,
          time: lastSeenTime,
        });
      } catch (e) {
        console.log('LateScreen: API late error', e);
      }
    }
  }, [primaryGuardian, userName, lastSeenTime, userId, activeSessionId, currentCoords]);

  const handleUpdateEta = useCallback(() => {
    startSession(selectedEta, session.eventName);
    setTrackingStatus('active');
    setShowEtaModal(false);
    router.replace('/tracking/active');
  }, [selectedEta, session.eventName, startSession, setTrackingStatus, router]);

  const handleSOS = useCallback(() => {
    router.push('/sos-modal');
  }, [router]);

  const mapRegion = currentCoords ? {
    latitude: currentCoords.latitude,
    longitude: currentCoords.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  } : {
    latitude: 34.0522,
    longitude: -118.2437,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Avatar name={userName} size={36} color={Colors.amber} />
          <Text style={styles.headerTitle}>Safely</Text>
          <View style={styles.onIndicator}>
            <View style={styles.amberDot} />
            <Text style={styles.amberText}>LATE</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.alertCardWrapper}>
          <Card style={styles.alertCard}>
            <View style={styles.alertRow}>
              <AlertTriangle size={24} color={Colors.amber} />
              <View style={styles.alertInfo}>
                <Text style={styles.alertTitle}>You haven't made it home yet</Text>
                <Text style={styles.alertSubtitle}>
                  {primaryGuardian?.name ?? 'Your guardian'} has been notified with your last known location
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.mapContainer}>
          <SafeMap
            style={styles.map}
            initialRegion={mapRegion}
            showsUserLocation
            showsMyLocationButton={false}
            fallbackLabel="Last known location"
            fallbackCoords={currentCoords ?? undefined}
          />
        </View>

        <View style={styles.actionSection}>
          <ActionButtonRow
            centerLabel=""
            centerColor={Colors.amberLight}
            centerIcon={<Clock size={28} color={Colors.amber} />}
            centerIsDecorative
            leftIcon={
              <View style={styles.actionSideInner}>
                <HomeIcon size={18} color={Colors.amberDark} />
              </View>
            }
            leftLabel="Update ETA"
            onLeftPress={() => setShowEtaModal(true)}
            rightIcon={
              <View style={[styles.actionSideInner, { backgroundColor: Colors.redLight }]}>
                <AlertTriangle size={18} color={Colors.red} />
              </View>
            }
            rightLabel="SOS"
            onRightPress={handleSOS}
          />
        </View>
      </View>

      <SOSButton onPress={handleSOS} />

      <GuardianToast
        guardianName={primaryGuardian?.name ?? 'Guardian'}
        message={`${userName} hasn't arrived home. Last seen at ${lastSeenTime}.`}
        borderColor={Colors.amber}
        visible={showToast}
        onDismiss={() => setShowToast(false)}
      />

      <Modal visible={showEtaModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Update your ETA</Text>
            <Text style={styles.modalSubtitle}>How much more time do you need?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.etaPillRow}>
              {ETA_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.etaPill, selectedEta === opt.value && styles.etaPillActive]}
                  onPress={() => setSelectedEta(opt.value)}
                >
                  <Text style={[styles.etaPillText, selectedEta === opt.value && styles.etaPillTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.confirmButton} onPress={handleUpdateEta}>
              <Text style={styles.confirmButtonText}>UPDATE ETA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEtaModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: Colors.textPrimary,
  },
  onIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.amber,
  },
  amberText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.amber,
  },
  content: {
    flex: 1,
  },
  alertCardWrapper: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  alertCard: {
    borderColor: Colors.amber,
    backgroundColor: 'rgba(255,176,32,0.06)',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  alertSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  mapContainer: {
    marginBottom: 16,
  },
  map: {
    height: SCREEN_HEIGHT * 0.32,
    width: '100%',
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  actionSideInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  etaPillRow: {
    gap: 10,
    paddingBottom: 20,
  },
  etaPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  etaPillActive: {
    backgroundColor: Colors.amber,
  },
  etaPillText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  etaPillTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700' as const,
  },
  confirmButton: {
    backgroundColor: Colors.amber,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cancelBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
