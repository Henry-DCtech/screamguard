import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { ContactCard } from '../../components/ContactCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors, font, radius, spacing } from '../../lib/theme';
import type { Contact } from '../../lib/types';

const MAX = 5;

const BLANK = {
  name: '',
  phone_number: '',
  relationship: '',
  is_primary: false,
};

export default function ContactsScreen() {
  const { session } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const fetchContacts = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('emergency_contacts')
      .select('*')
      .order('created_at');
    setContacts(data ?? []);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK);
    setModalOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone_number: c.phone_number,
      relationship: c.relationship ?? '',
      is_primary: c.is_primary,
    });
    setModalOpen(true);
  };

  const handleDelete = (c: Contact) => {
    Alert.alert('Remove Contact', `Remove ${c.name} from your emergency contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('emergency_contacts').delete().eq('id', c.id);
          fetchContacts();
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone_number) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      phone_number: form.phone_number.trim(),
      relationship: form.relationship.trim() || null,
      is_primary: form.is_primary,
    };

    if (editing) {
      await supabase.from('emergency_contacts').update(payload).eq('id', editing.id);
    } else {
      await supabase
        .from('emergency_contacts')
        .insert({ ...payload, user_id: session?.user.id });
    }

    setSaving(false);
    setModalOpen(false);
    fetchContacts();
  };

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const canAdd = contacts.length < MAX;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Contacts</Text>
          <Text style={styles.subtitle}>
            {contacts.length} of {MAX} added
          </Text>
        </View>
        {canAdd && (
          <TouchableOpacity onPress={openAdd} style={styles.addBtn} activeOpacity={0.75}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {!loading && contacts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No contacts yet</Text>
          <Text style={styles.emptyBody}>
            Add emergency contacts who should receive an alert if a scream is detected.
          </Text>
          <Button label="Add first contact" onPress={openAdd} style={styles.emptyBtn} />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ContactCard
              contact={item}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalOpen(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetTitle}>{editing ? 'Edit Contact' : 'New Contact'}</Text>

              <Input
                label="Full name"
                value={form.name}
                onChangeText={set('name')}
                placeholder="Mum, Best Friend…"
                autoCapitalize="words"
              />
              <Input
                label="Phone number"
                value={form.phone_number}
                onChangeText={set('phone_number')}
                placeholder="+234 801 234 5678"
                keyboardType="phone-pad"
              />
              <Input
                label="Relationship (optional)"
                value={form.relationship}
                onChangeText={set('relationship')}
                placeholder="Parent, Friend, Partner…"
                autoCapitalize="words"
              />

              {/* Primary toggle */}
              <TouchableOpacity
                onPress={() => setForm((f) => ({ ...f, is_primary: !f.is_primary }))}
                style={styles.primaryToggle}
                activeOpacity={0.75}
              >
                <View>
                  <Text style={styles.primaryToggleLabel}>Set as primary contact</Text>
                  <Text style={styles.primaryToggleSub}>Alerts this person first</Text>
                </View>
                <View
                  style={[
                    styles.togglePill,
                    form.is_primary && styles.togglePillOn,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      form.is_primary && styles.toggleThumbOn,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              <Button
                label={editing ? 'Save Changes' : 'Add Contact'}
                onPress={handleSave}
                loading={saving}
                style={styles.saveBtn}
              />
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setModalOpen(false)}
                style={styles.cancelBtn}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  title: {
    fontSize: font.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: font.sm,
    color: colors.textMuted,
    marginTop: 3,
  },
  addBtn: {
    backgroundColor: colors.red,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addBtnText: {
    fontSize: font.sm,
    fontWeight: '700',
    color: colors.white,
  },
  list: {
    padding: spacing.xl,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 10,
    width: 200,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    paddingTop: 16,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  primaryToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 24,
  },
  primaryToggleLabel: {
    fontSize: font.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  primaryToggleSub: {
    fontSize: font.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  togglePill: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceHigh,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  togglePillOn: {
    backgroundColor: colors.red,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textMuted,
  },
  toggleThumbOn: {
    backgroundColor: colors.white,
    alignSelf: 'flex-end',
  },
  saveBtn: {
    marginBottom: 10,
  },
  cancelBtn: {},
});
