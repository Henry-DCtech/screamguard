import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useMonitoringStore } from '../../stores/monitoringStore';
import { useAuthStore } from '../../stores/authStore';
import { MonitoringOrb } from '../../components/MonitoringOrb';
import { AlertCountdown } from '../../components/AlertCountdown';
import { useScreamMonitor } from '../../hooks/useScreamMonitor';
import { hasBackend } from '../../lib/constants';
import type { DistressLabel } from '../../services/inferenceService';
import { colors, font, radius, spacing } from '../../lib/theme';
import { useKeepAwake } from 'expo-keep-awake';
import { Platform } from 'react-native';

// only keep awake on phone, not web
if (Platform.OS !== 'web') {
  useKeepAwake();
}

/** Human-readable names for the model's three classes. */
const CLASS_LABELS: Record<DistressLabel, string> = {
  scream: 'Scream',
  dialect_distress: 'Dialect distress',
  non_distress: 'Non-distress',
};

function LevelMeter({ level }: { level: number }) {
  const BARS = 24;
  const lit = Math.round(level * BARS);
  return (
    <View style={styles.meter}>
      {Array.from({ length: BARS }).map((_, i) => {
        const on = i < lit;
        const hot = i > BARS * 0.78;
        return (
          <View
            key={i}
            style={[
              styles.meterBar,
              on && (hot ? styles.meterBarHot : styles.meterBarOn),
            ]}
          />
        );
      })}
    </View>
  );
}

function StatCard({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const {
    isActive,
    toggle,
    todayAlertCount,
    lastDetectionAt,
    setTodayCount,
    level,
    status,
    statusMessage,
    countdownActive,
    lastWindow,
  } = useMonitoringStore();
  const { profile } = useAuthStore();
  const { countdownRemaining, cancelPending } = useScreamMonitor();

  useEffect(() => {
    const fetchTodayCount = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      if (count != null) setTodayCount(count);
    };
    fetchTodayCount();
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  const formatLastDetection = () => {
    if (!lastDetectionAt) return '—';
    const d = new Date(lastDetectionAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hey, {firstName}</Text>
            <Text style={styles.headerSub}>
              {isActive ? 'Your device is protected' : 'Monitoring is paused'}
            </Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: isActive ? colors.green : colors.surfaceHigh }]} />
        </View>

        {/* Orb */}
        <View style={styles.orbContainer}>
          <MonitoringOrb active={isActive} />
        </View>

        {/* Live audio level meter */}
        {isActive && (
          <View style={styles.meterBlock}>
            <LevelMeter level={level} />
            <Text style={styles.meterCaption}>
              {status === 'dispatching'
                ? 'Sending alert…'
                : status === 'starting'
                  ? 'Starting microphone…'
                  : hasBackend
                    ? 'AI scream detection active'
                    : 'Listening (loudness mode)'}
            </Text>

            {/* Live diagnostic readout */}
            {lastWindow && (
              <View style={styles.diagBox}>
                <View style={styles.diagRow}>
                  <Text style={styles.diagLabel}>Loudness</Text>
                  <Text style={styles.diagValue}>{Math.round(lastWindow.peakDb)} dB</Text>
                </View>
                <View style={styles.diagRow}>
                  <Text style={styles.diagLabel}>Last check</Text>
                  <Text style={styles.diagValue}>
                    {lastWindow.mode === 'quiet'
                      ? 'too quiet — not sent'
                      : lastWindow.mode === 'cloud-failed'
                        ? '⚠ backend offline'
                        : lastWindow.score != null
                          ? `${lastWindow.mode === 'cloud' ? 'AI' : 'loud'} ${(lastWindow.score * 100).toFixed(0)}%`
                          : '—'}
                  </Text>
                </View>
                {lastWindow.label && (
                  <View style={styles.diagRow}>
                    <Text style={styles.diagLabel}>Class</Text>
                    <Text style={styles.diagValue}>{CLASS_LABELS[lastWindow.label]}</Text>
                  </View>
                )}
                <View style={styles.diagRow}>
                  <Text style={styles.diagLabel}>Match streak</Text>
                  <Text style={[styles.diagValue, lastWindow.hit && { color: colors.green }]}>
                    {lastWindow.streak} / {useMonitoringStore.getState().settings.consecutiveDetections}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Error / status message */}
        {statusMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{statusMessage}</Text>
          </View>
        )}

        {/* Toggle button */}
        <TouchableOpacity
          onPress={toggle}
          activeOpacity={0.8}
          style={[
            styles.toggleBtn,
            isActive ? styles.toggleBtnActive : styles.toggleBtnInactive,
          ]}
        >
          <Text
            style={[
              styles.toggleBtnText,
              isActive ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive,
            ]}
          >
            {isActive ? 'Pause Monitoring' : 'Start Monitoring'}
          </Text>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard value={String(todayAlertCount)} label="Today's alerts" accent={todayAlertCount > 0} />
          <StatCard value={formatLastDetection()} label="Last detection" />
        </View>

        {/* Info banner */}
        {!isActive && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerIcon}>💡</Text>
            <Text style={styles.infoBannerText}>
              Keep monitoring active so ScreamGuard can protect you in the background.
            </Text>
          </View>
        )}
      </ScrollView>

      <AlertCountdown
        visible={countdownActive}
        remaining={countdownRemaining}
        onCancel={cancelPending}
      />
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
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 44,
  },
  greeting: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: font.sm,
    color: colors.textMuted,
    marginTop: 3,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  orbContainer: {
    marginBottom: 24,
  },
  meterBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  meter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 28,
  },
  meterBar: {
    width: 5,
    height: '55%',
    borderRadius: 2,
    backgroundColor: colors.surfaceHigh,
  },
  meterBarOn: {
    height: '100%',
    backgroundColor: colors.green,
  },
  meterBarHot: {
    height: '100%',
    backgroundColor: colors.red,
  },
  meterCaption: {
    fontSize: font.xs,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  diagBox: {
    width: '100%',
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    gap: 6,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagLabel: {
    fontSize: font.xs,
    color: colors.textMuted,
  },
  diagValue: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  errorBanner: {
    width: '100%',
    backgroundColor: colors.redDim,
    borderColor: colors.redMid,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: 16,
  },
  errorText: {
    fontSize: font.sm,
    color: colors.red,
    textAlign: 'center',
  },
  toggleBtn: {
    width: '100%',
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 1.5,
  },
  toggleBtnActive: {
    backgroundColor: colors.greenDim,
    borderColor: colors.greenMid,
  },
  toggleBtnInactive: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  toggleBtnText: {
    fontSize: font.base,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  toggleBtnTextActive: {
    color: colors.green,
  },
  toggleBtnTextInactive: {
    color: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 4,
  },
  statCardAccent: {
    borderColor: colors.redMid,
    backgroundColor: colors.redDim,
  },
  statValue: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  statValueAccent: {
    color: colors.red,
  },
  statLabel: {
    fontSize: font.xs,
    color: colors.textMuted,
  },
  infoBanner: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'flex-start',
  },
  infoBannerIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  infoBannerText: {
    flex: 1,
    fontSize: font.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
