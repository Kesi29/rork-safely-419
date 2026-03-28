import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { useSafelyStore } from '@/store';
import { Guardian, Relationship } from '@/store/types';
import Avatar from '@/components/Avatar';
import Card from '@/components/Card';
import { api } from '@/constants/api';

const RELATIONSHIPS: Relationship[] = ['Partner', 'Parent', 'Friend', 'Sibling', 'Other'];
const AVATAR_COLORS = ['#18A57D', '#007AFF', '#FFB020', '#FF3B3B', '#9B59B6'];

export default function GuardianScreen() {
  const {
    guardians,
    addGuardian,
    updateGuardian,
    removeGuardian,
    userId,
  } = useSafelyStore();

  const [showModal, setShowModal] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('Friend');
  const [isPrimary, setIsPrimary] = useState(false);

  const openAddModal = useCallback(() => {
    setEditingGuardian(null);
    setName('');
    setPhone('');
    setEmail('');
    setRelationship('Friend');
    setIsPrimary(guardians.length === 0);
    setShowModal(true);
  }, [guardians.length]);

  const openEditModal = useCallback((guardian: Guardian) => {
    setEditingGuardian(guardian);
    setName(guardian.name);
    setPhone(guardian.phone);
    setEmail(guardian.email ?? '');
    setRelationship(guardian.relationship);
    setIsPrimary(guardian.isPrimary);
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Required', 'Name and phone number are required.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Required', 'Email address is required so your guardian can receive alerts.');
      return;
    }

    if (editingGuardian) {
      updateGuardian({
        ...editingGuardian,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        relationship,
        isPrimary,
      });
    } else {
      const newGuardian: Guardian = {
        id: `guardian-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        relationship,
        isPrimary,
        avatarColor: AVATAR_COLORS[guardians.length % AVATAR_COLORS.length],
      };
      addGuardian(newGuardian);
      try {
        void api.inviteGuardian({
          userId,
          guardianName: newGuardian.name,
          guardianPhone: newGuardian.phone,
          relationship: newGuardian.relationship,
        });
      } catch (e) {
        console.log('GuardianScreen: API inviteGuardian error', e);
      }
    }
    setShowModal(false);
  }, [name, phone, email, relationship, isPrimary, editingGuardian, guardians.length, addGuardian, updateGuardian, userId]);

  const handleRemove = useCallback((id: string, guardianName: string) => {
    Alert.alert(
      'Remove Guardian',
      `Remove ${guardianName} as your guardian?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeGuardian(id) },
      ]
    );
  }, [removeGuardian]);

  const renderGuardian = useCallback(({ item }: { item: Guardian }) => (
    <TouchableOpacity
      onPress={() => openEditModal(item)}
      onLongPress={() => handleRemove(item.id, item.name)}
      activeOpacity={0.7}
    >
      <Card style={styles.guardianCard}>
        <View style={styles.guardianRow}>
          <Avatar name={item.name} size={44} color={item.avatarColor} />
          <View style={styles.guardianInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.guardianName}>{item.name}</Text>
              {item.isPrimary && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>Primary</Text>
                </View>
              )}
            </View>
            <Text style={styles.guardianMeta}>{item.relationship} · {item.phone}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  ), [openEditModal, handleRemove]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Guardians</Text>
          {guardians.length < 3 && (
            <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
              <Plus size={18} color={Colors.green} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {guardians.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrapper}>
            <Shield size={48} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Add your first guardian</Text>
          <Text style={styles.emptySubtitle}>
            They'll receive a text when you're home safely
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
            <Plus size={18} color={Colors.textPrimary} />
            <Text style={styles.emptyButtonText}>Add Guardian</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={guardians}
          keyExtractor={(item) => item.id}
          renderItem={renderGuardian}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>Your Guardians</Text>
          }
          ListFooterComponent={
            <Text style={styles.infoText}>
              Your guardian gets SMS alerts — they don't need the Safely app. Swipe for options.
            </Text>
          }
        />
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editingGuardian ? 'Edit Guardian' : 'Add Guardian'}
            </Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Guardian's name"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="their@email.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Relationship</Text>
            <View style={styles.relPicker}>
              {RELATIONSHIPS.map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[styles.relPill, relationship === rel && styles.relPillActive]}
                  onPress={() => setRelationship(rel)}
                >
                  <Text style={[styles.relPillText, relationship === rel && styles.relPillTextActive]}>
                    {rel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.primaryRow}>
              <Text style={styles.primaryLabel}>Set as Primary</Text>
              <Switch
                value={isPrimary}
                onValueChange={setIsPrimary}
                trackColor={{ false: Colors.border, true: Colors.green }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>SAVE GUARDIAN</Text>
            </TouchableOpacity>

            <Text style={styles.consentText}>
              Your guardian will receive an email when you activate Safely
            </Text>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
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
    backgroundColor: Colors.backgroundSoft,
  },
  safeArea: {
    backgroundColor: Colors.backgroundSoft,
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
    fontSize: 28,
    color: Colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  listContent: {
    padding: 24,
    gap: 12,
  },
  guardianCard: {
    marginBottom: 0,
  },
  guardianRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guardianInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guardianName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  primaryBadge: {
    backgroundColor: Colors.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.greenDark,
  },
  guardianMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.green,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
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
  relPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  relPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  relPillActive: {
    backgroundColor: Colors.green,
  },
  relPillText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  relPillTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700' as const,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  primaryLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.green,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: 1,
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
  consentText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#BBBBBB',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
});
