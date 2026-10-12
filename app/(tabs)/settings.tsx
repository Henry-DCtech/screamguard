import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useMonitoringStore } from '../../stores/monitoringStore';
import { colors, font, radius, spacing, avatarColor } from '../../lib/theme';
import type { DeviceSettings } from '../../lib/types';

function SettingRow({
  label,
  value,
  onPress,
  danger,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      style={styles.settingRow}
    >
      <Text style={[styles.settingLabel, danger && styles.dangerLabel]}>{label}</Text>
      {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      {onPress && !danger && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const COOLDOWN_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
];

export default function SettingsScreen() {
  const { profile, signOut } = useAuthStore();
  const [settings, setSettings] = useState<DeviceSettings | null>(null);
  const [sensitivity, setSensitivity] = useState(0.85);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('device_settings').select('*').single();
      if (data) {
        setSettings(data);
        setSensitivity(data.sensitivity);
      }
    };
    fetch();
  }, []);

  const syncMonitor = useMonitoringStore((s) => s.setSettings);

  const updateSetting = async (patch: Partial<DeviceSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...patch };
    setSettings(updated);
    // Keep the live monitor in sync with the new preferences.
    syncMonitor({
      ...(patch.sensitivity != null ? { sensitivity: patch.sensitivity } : {}),
      ...(patch.consecutive_detections != null
        ? { consecutiveDetections: patch.consecutive_detections }
        : {}),
      ...(patch.cooldown_seconds != null ? { cooldownSeconds: patch.cooldown_seconds } : {}),
    });
    await supabase.from('device_settings').update(patch).eq('id', settings.id);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const avatarBg = avatarColor(profile?.full_name ?? 'A');

  const sensitivityLabel =
    sensitivity < 0.75 ? 'Low' : sensitivity < 0.88 ? 'Medium' : 'High';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={[styles.profileAvatar, { backgroundColor: avatarBg + '22' }]}>
            <Text style={[styles.profileInitials, { color: avatarBg }]}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name ?? '—'}</Text>
            <Text style={styles.profilePhone}>{profile?.phone_number ?? '—'}</Text>
          </View>
        </View>

        {/* Detection settings */}
        {settings && (
          <Section title="Detection">
            {/* Sensitivity */}
            <View style={styles.sliderBlock}>
              <View style={styles.sliderHeader}>
                <Text style={styles.settingLabel}>Sensitivity</Text>
                <View style={styles.sensitivityBadge}>
                  <Text style={styles.sensitivityBadgeText}>{sensitivityLabel}</Text>
                </View>
              </View>
              <Text style={styles.sliderHint}>
                {Math.round(sensitivity * 100)}% confidence threshold
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0.60}
                maximumValue={0.95}
                step={0.05}
                value={sensitivity}
                onValueChange={setSensitivity}
                onSlidingComplete={(v) => updateSetting({ sensitivity: v })}
                minimumTrackTintColor={colors.red}
                maximumTrackTintColor={colors.surfaceHigh}
                thumbTintColor={colors.red}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>Fewer alerts</Text>
                <Text style={styles.sliderLabelText}>More alerts</Text>
              </View>
            </View>

            {/* Consecutive detections */}
            <View style={[styles.settingRow, { alignItems: 'flex-start', paddingVertical: 14 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Consecutive detections</Text>
                <Text style={styles.settingHint}>
                  Require N detections in a row before alerting
                </Text>
              </View>
              <View style={styles.stepperRow}>
                {[1, 2, 3].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => updateSetting({ consecutive_detections: n })}
                    style={[
                      styles.stepperBtn,
                      settings.consecutive_detections === n && styles.stepperBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepperText,
                        settings.consecutive_detections === n && styles.stepperTextActive,
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cooldown */}
            <View style={[styles.settingRow, { alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Alert cooldown</Text>
                <Text style={styles.settingHint}>Minimum gap between alerts</Text>
              </View>
              <View style={styles.stepperRow}>
                {COOLDOWN_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => updateSetting({ cooldown_seconds: opt.value })}
                    style={[
                      styles.stepperBtn,
                      settings.cooldown_seconds === opt.value && styles.stepperBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepperText,
                        settings.cooldown_seconds === opt.value && styles.stepperTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Section>
        )}

        {/* Account */}
        <Section title="Account">
          <TouchableOpacity onPress={handleSignOut} style={[styles.settingRow, { borderBottomWidth: 0 }]} activeOpacity={0.7}>
            <Text style={styles.dangerLabel}>Sign Out</Text>
          </TouchableOpacity>
        </Section>

        <Text style={styles.version}>ScreamGuard v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 0,
  },
  pageTitle: {
    fontSize: font.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 14,
    marginBottom: 28,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: font.lg,
    fontWeight: '700',
  },
  profileInfo: {
    gap: 3,
  },
  profileName: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  profilePhone: {
    fontSize: font.sm,
    color: colors.textMuted,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  settingLabel: {
    fontSize: font.base,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingValue: {
    fontSize: font.base,
    color: colors.textMuted,
  },
  settingHint: {
    fontSize: font.xs,
    color: colors.textMuted,
    marginTop: 3,
  },
  chevron: {
    fontSize: 18,
    color: colors.textMuted,
    marginLeft: 6,
  },
  dangerLabel: {
    fontSize: font.base,
    fontWeight: '600',
    color: colors.red,
  },
  sliderBlock: {
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sensitivityBadge: {
    backgroundColor: colors.redDim,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sensitivityBadgeText: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.red,
  },
  sliderHint: {
    fontSize: font.xs,
    color: colors.textMuted,
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 36,
    marginHorizontal: -4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderLabelText: {
    fontSize: font.xs,
    color: colors.textMuted,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepperBtn: {
    width: 38,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnActive: {
    backgroundColor: colors.redDim,
    borderWidth: 1,
    borderColor: colors.redMid,
  },
  stepperText: {
    fontSize: font.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  stepperTextActive: {
    color: colors.red,
  },
  version: {
    fontSize: font.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
