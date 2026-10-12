import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, font, radius, spacing } from '../lib/theme';
import type { Alert as AlertType } from '../lib/types';

interface Props {
  alert: AlertType;
  onPress?: () => void;
}

const STATUS_CONFIG = {
  sent: { label: 'Sent', color: colors.blue, bg: colors.blueDim },
  delivered: { label: 'Delivered', color: colors.green, bg: colors.greenDim },
  acknowledged: { label: 'Acknowledged', color: colors.green, bg: colors.greenDim },
  false_alarm: { label: 'False alarm', color: colors.yellow, bg: colors.yellowDim },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function AlertItem({ alert, onPress }: Props) {
  const status = STATUS_CONFIG[alert.status] ?? STATUS_CONFIG.sent;
  const confidence = Math.round(alert.confidence * 100);

  return (
    <View style={styles.item}>
      <View style={styles.timeCol}>
        <Text style={styles.time}>{formatTime(alert.created_at)}</Text>
        <View style={[styles.dot, { backgroundColor: status.color }]} />
        <View style={styles.line} />
      </View>

      <TouchableOpacity
        style={styles.content}
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.topRow}>
          <View style={[styles.confidenceBadge, { backgroundColor: colors.surfaceHigh }]}>
            <Text style={styles.confidenceText}>{confidence}%</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <Text style={styles.address} numberOfLines={2}>
          {alert.address ?? `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`}
        </Text>

        <View style={styles.deliveryRow}>
          {alert.sms_sent && (
            <Text style={styles.deliveryTag}>SMS ✓</Text>
          )}
          {alert.push_sent && (
            <Text style={styles.deliveryTag}>Push ✓</Text>
          )}
        </View>

        {onPress && <Text style={styles.tapHint}>Tap for location & details ›</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: 14,
    paddingBottom: 20,
  },
  timeCol: {
    alignItems: 'center',
    width: 42,
    paddingTop: 2,
  },
  time: {
    fontSize: font.xs,
    color: colors.textMuted,
    marginBottom: 6,
    textAlign: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  line: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.borderSubtle,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 7,
  },
  topRow: {
    flexDirection: 'row',
    gap: 8,
  },
  confidenceBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  confidenceText: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: font.xs,
    fontWeight: '600',
  },
  address: {
    fontSize: font.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  deliveryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  deliveryTag: {
    fontSize: font.xs,
    color: colors.textMuted,
  },
  tapHint: {
    fontSize: font.xs,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
});
