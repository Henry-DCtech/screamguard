import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, font, radius, spacing, avatarColor } from '../lib/theme';
import type { Contact } from '../lib/types';

interface Props {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContactCard({ contact, onEdit, onDelete }: Props) {
  const initials = contact.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const bgColor = avatarColor(contact.name);

  const handleMore = () => {
    Alert.alert(contact.name, undefined, [
      { text: 'Edit', onPress: onEdit },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: bgColor + '22' }]}>
        <Text style={[styles.initials, { color: bgColor }]}>{initials}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{contact.name}</Text>
          {contact.is_primary && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryText}>Primary</Text>
            </View>
          )}
        </View>
        <Text style={styles.phone}>{contact.phone_number}</Text>
        {contact.relationship ? (
          <Text style={styles.relationship}>{contact.relationship}</Text>
        ) : null}
      </View>

      <TouchableOpacity onPress={handleMore} style={styles.more} hitSlop={12}>
        <Text style={styles.moreIcon}>⋯</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 13,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: font.base,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: font.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  primaryBadge: {
    backgroundColor: colors.redDim,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  primaryText: {
    fontSize: font.xs,
    color: colors.red,
    fontWeight: '600',
  },
  phone: {
    fontSize: font.sm,
    color: colors.textSecondary,
  },
  relationship: {
    fontSize: font.xs,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  more: {
    padding: 6,
  },
  moreIcon: {
    fontSize: 20,
    color: colors.textMuted,
    letterSpacing: -2,
  },
});
