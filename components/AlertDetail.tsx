import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, font, radius, spacing } from '../lib/theme';
import { reverseGeocode } from '../services/locationService';
import { Button } from './ui/Button';
import type { Alert as AlertType } from '../lib/types';

interface Props {
  alert: AlertType | null;
  onClose: () => void;
  onMarkFalseAlarm?: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  sent: { label: 'Sent', color: colors.blue, bg: colors.blueDim },
  delivered: { label: 'Delivered', color: colors.green, bg: colors.greenDim },
  acknowledged: { label: 'Acknowledged', color: colors.green, bg: colors.greenDim },
  false_alarm: { label: 'False alarm', color: colors.yellow, bg: colors.yellowDim },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AlertDetail({ alert, onClose, onMarkFalseAlarm }: Props) {
  const [address, setAddress] = useState<string | null>(null);
  const [loadingAddr, setLoadingAddr] = useState(false);

  useEffect(() => {
    if (!alert) return;
    // Prefer a stored address; otherwise resolve on-device.
    if (alert.address) {
      setAddress(alert.address);
      return;
    }
    let cancelled = false;
    setLoadingAddr(true);
    setAddress(null);
    reverseGeocode(alert.latitude, alert.longitude)
      .then((addr) => {
        if (!cancelled) setAddress(addr);
      })
      .finally(() => {
        if (!cancelled) setLoadingAddr(false);
      });
    return () => {
      cancelled = true;
    };
  }, [alert?.id]);

  if (!alert) return null;

  const status = STATUS_CONFIG[alert.status] ?? STATUS_CONFIG.sent;
  const confidence = Math.round(alert.confidence * 100);
  const coords = `${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}`;
  const mapsUrl = `https://maps.google.com/?q=${alert.latitude},${alert.longitude}`;

  const openMap = () => {
    Linking.openURL(mapsUrl).catch(() => {});
  };

  return (
    <Modal visible={!!alert} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.title}>Alert details</Text>
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
            <Text style={styles.datetime}>{formatDateTime(alert.created_at)}</Text>

            {/* Location */}
            <Text style={styles.sectionLabel}>LOCATION</Text>
            <View style={styles.locationCard}>
              <Text style={styles.pin}>📍</Text>
              <View style={{ flex: 1 }}>
                {loadingAddr ? (
                  <View style={styles.addrLoading}>
                    <ActivityIndicator size="small" color={colors.red} />
                    <Text style={styles.addrLoadingText}>Finding address…</Text>
                  </View>
                ) : (
                  <Text style={styles.address}>{address ?? 'Address unavailable'}</Text>
                )}
                <Text style={styles.coords}>{coords}</Text>
              </View>
            </View>

            <Button label="Open in Google Maps" onPress={openMap} style={styles.mapBtn} />

            {/* Detection meta */}
            <Text style={styles.sectionLabel}>DETECTION</Text>
            <View style={styles.metaCard}>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Confidence</Text>
                <Text style={styles.metaVal}>{confidence}%</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>SMS alert</Text>
                <Text style={styles.metaVal}>{alert.sms_sent ? 'Sent ✓' : 'Not sent'}</Text>
              </View>
              <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.metaKey}>Push alert</Text>
                <Text style={styles.metaVal}>{alert.push_sent ? 'Sent ✓' : 'Not sent'}</Text>
              </View>
            </View>

            {alert.status !== 'false_alarm' && onMarkFalseAlarm && (
              <Button
                label="Mark as false alarm"
                variant="ghost"
                onPress={() => {
                  onMarkFalseAlarm(alert.id);
                  onClose();
                }}
                style={styles.falseBtn}
              />
            )}
            <Button label="Close" variant="ghost" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    paddingTop: 16,
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: font.xs, fontWeight: '700' },
  datetime: {
    fontSize: font.sm,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  locationCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.base,
    marginBottom: 12,
  },
  pin: { fontSize: 18, marginTop: 1 },
  address: {
    fontSize: font.base,
    color: colors.textPrimary,
    fontWeight: '600',
    lineHeight: 22,
  },
  coords: {
    fontSize: font.xs,
    color: colors.textMuted,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  addrLoading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addrLoadingText: { fontSize: font.sm, color: colors.textMuted },
  mapBtn: { marginBottom: 28 },
  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.base,
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  metaKey: { fontSize: font.base, color: colors.textSecondary },
  metaVal: { fontSize: font.base, color: colors.textPrimary, fontWeight: '600' },
  falseBtn: { marginBottom: 10 },
});
