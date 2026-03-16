import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Play, Clock, AlertTriangle, Home as HomeIcon, Edit2, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { useSafelyStore } from '@/store';
import Card from '@/components/Card';
import Avatar from '@/components/Avatar';
import AddressSearch from '@/components/AddressSearch';

interface AddressResult {
  label: string;
  coords: {
    latitude: number;
    longitude: number;
  };
}

const ETA_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hr', value: 60 },
  { label: '1.5 hr', value: 90 },
  { label: '2 hr', value: 120 },
];

export default function SettingsScreen() {
  const router = useRouter();
  const {
    userName,
    homeAddress,
    connectedEvents,
    defaultEtaMinutes,
    setUserName,
    setHomeAddress,
    setDefaultEtaMinutes,
    addEvent,
    startSession,
    setTrackingStatus,
  } = useSafelyStore();

  const [editName, setEditName] = useState(userName);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<AddressResult | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventTime, setNewEventTime] = useState('');

  const handleNameSave = useCallback(() => {
    if (editName.trim()) {
      setUserName(editName.trim());
    }
  }, [editName, setUserName]);

  const handleEditAddress = useCallback(() => {
    setIsEditingAddress(true);
    setPendingAddress(null);
  }, []);

  const handleAddressSelected = useCallback((result: AddressResult) => {
    console.log('Settings: address selected:', result.label);
    setPendingAddress(result);
  }, []);

  const handleAddressClear = useCallback(() => {
    setPendingAddress(null);
  }, []);

  const handleSaveAddress = useCallback(() => {
    if (!pendingAddress) return;
    console.log('Settings: saving new home address:', pendingAddress.label);
    setHomeAddress({
      label: pendingAddress.label,
      coords: pendingAddress.coords,
    });
    setIsEditingAddress(false);
    setPendingAddress(null);
  }, [pendingAddress, setHomeAddress]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingAddress(false);
    setPendingAddress(null);
  }, []);

  const handleAddEvent = useCallback(() => {
    if (!newEventName.trim()) {
      Alert.alert('Required', 'Event name is required.');
      return;
    }
    addEvent({
      id: `event-${Date.now()}`,
      name: newEventName.trim(),
      endTime: newEventTime.trim() || '23:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setNewEventName('');
    setNewEventTime('');
    setShowAddEvent(false);
  }, [newEventName, newEventTime, addEvent]);

  const simulateJourney = useCallback(() => {
    startSession(2, 'Demo Journey');
    router.push('/tracking/active');
    setTimeout(() => {
      setTrackingStatus('arrived');
      router.replace('/tracking/arrived');
    }, 10000);
  }, [startSession, setTrackingStatus, router]);

  const simulateLate = useCallback(() => {
    startSession(0, 'Demo Late');
    setTrackingStatus('late');
    router.push('/tracking/late');
  }, [startSession, setTrackingStatus, router]);

  const simulateSOS = useCallback(() => {
    startSession(30, 'Demo SOS');
    setTrackingStatus('emergency');
    router.push('/tracking/emergency');
  }, [startSession, setTrackingStatus, router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>Profile</Text>
        <Card style={styles.card}>
          <View style={styles.profileRow}>
            <Avatar name={userName} size={44} color={Colors.green} />
            <View style={styles.profileInfo}>
              <TextInput
                style={styles.profileNameInput}
                value={editName}
                onChangeText={setEditName}
                onBlur={handleNameSave}
                placeholder="Your name"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.profileCaption}>Name used in guardian alerts</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>Home Address</Text>
        {!isEditingAddress ? (
          <Card style={styles.card}>
            <View style={styles.addressRow}>
              <View style={styles.addressIconCircle}>
                <MapPin size={16} color={Colors.green} />
              </View>
              <Text style={styles.addressLabel} numberOfLines={2}>
                {homeAddress.label}
              </Text>
              <TouchableOpacity onPress={handleEditAddress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Edit2 size={16} color={Colors.green} />
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <Card style={styles.editAddressCard}>
            <AddressSearch
              initialValue={homeAddress.label}
              onAddressSelected={handleAddressSelected}
              onClear={handleAddressClear}
              autoFocus
            />
            <View style={styles.editButtonRow}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !pendingAddress && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveAddress}
                disabled={!pendingAddress}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.saveButtonText,
                    !pendingAddress && styles.saveButtonTextDisabled,
                  ]}
                >
                  Save
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancelEdit} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        <Text style={styles.sectionLabel}>Default ETA</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.etaPillRow}
        >
          {ETA_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.etaPill,
                defaultEtaMinutes === opt.value && styles.etaPillActive,
              ]}
              onPress={() => setDefaultEtaMinutes(opt.value)}
            >
              <Text style={[
                styles.etaPillText,
                defaultEtaMinutes === opt.value && styles.etaPillTextActive,
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Connected Events</Text>
        <Card style={styles.card}>
          {connectedEvents.length === 0 ? (
            <Text style={styles.noEventsText}>No events connected yet</Text>
          ) : (
            connectedEvents.map((event, idx) => (
              <View key={event.id} style={[styles.eventRow, idx > 0 && styles.eventBorder]}>
                <View style={styles.eventIconCircle}>
                  <HomeIcon size={14} color={Colors.green} />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventMeta}>Partner</Text>
                </View>
                <View style={styles.demoBadge}>
                  <Text style={styles.demoBadgeText}>Demo</Text>
                </View>
              </View>
            ))
          )}
          <TouchableOpacity style={styles.addEventButton} onPress={() => setShowAddEvent(true)}>
            <Plus size={14} color={Colors.green} />
            <Text style={styles.addEventText}>Add Event</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionLabel}>Simulate</Text>
        <View style={styles.simSection}>
          <TouchableOpacity style={styles.simButton} onPress={simulateJourney}>
            <View style={styles.simIconCircle}>
              <Play size={14} color={Colors.green} />
            </View>
            <View style={styles.simInfo}>
              <Text style={styles.simButtonText}>Simulate Journey</Text>
              <Text style={styles.simButtonCaption}>90-second animated trip home</Text>
            </View>
            <Text style={styles.simArrow}>▶</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.simButton} onPress={simulateLate}>
            <View style={[styles.simIconCircle, { backgroundColor: Colors.amberLight }]}>
              <Clock size={14} color={Colors.amber} />
            </View>
            <View style={styles.simInfo}>
              <Text style={styles.simButtonText}>Simulate Late Arrival</Text>
              <Text style={styles.simButtonCaption}>Trigger late check-in flow</Text>
            </View>
            <Text style={[styles.simArrow, { color: Colors.amber }]}>▶</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.simButton} onPress={simulateSOS}>
            <View style={[styles.simIconCircle, { backgroundColor: Colors.redLight }]}>
              <AlertTriangle size={14} color={Colors.red} />
            </View>
            <View style={styles.simInfo}>
              <Text style={styles.simButtonText}>Simulate SOS</Text>
              <Text style={styles.simButtonCaption}>Trigger emergency sequence</Text>
            </View>
            <Text style={[styles.simArrow, { color: Colors.red }]}>▶</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal visible={showAddEvent} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Event</Text>

            <Text style={styles.inputLabel}>Event Name</Text>
            <TextInput
              style={styles.input}
              value={newEventName}
              onChangeText={setNewEventName}
              placeholder="e.g. Coachella 2026"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.inputLabel}>End Time</Text>
            <TextInput
              style={styles.input}
              value={newEventTime}
              onChangeText={setNewEventTime}
              placeholder="e.g. 23:00"
              placeholderTextColor={Colors.textMuted}
            />

            <TouchableOpacity style={styles.addEventConfirm} onPress={handleAddEvent}>
              <Text style={styles.addEventConfirmText}>ADD EVENT</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddEvent(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginTop: 24,
    marginBottom: 10,
  },
  card: {
    marginBottom: 0,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileNameInput: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    padding: 0,
  },
  profileCaption: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.textPrimary,
    flex: 1,
  },
  editAddressCard: {
    marginBottom: 0,
  },
  editButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: Colors.green,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.border,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  saveButtonTextDisabled: {
    color: Colors.textMuted,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  etaPillRow: {
    gap: 10,
    paddingBottom: 4,
  },
  etaPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  etaPillActive: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  etaPillText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  etaPillTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700' as const,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  eventBorder: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 12,
  },
  eventIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  eventMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  demoBadge: {
    backgroundColor: Colors.backgroundSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  demoBadgeText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  addEventText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.green,
  },
  noEventsText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
  simSection: {
    gap: 8,
  },
  simButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  simIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simInfo: {
    flex: 1,
  },
  simButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.green,
  },
  simButtonCaption: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  simArrow: {
    fontSize: 12,
    color: Colors.green,
  },
  bottomSpacer: {
    height: 40,
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
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.backgroundSoft,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 0.5,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  addEventConfirm: {
    backgroundColor: Colors.green,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  addEventConfirmText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  modalCancelBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
