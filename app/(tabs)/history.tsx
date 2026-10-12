import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { AlertItem } from '../../components/AlertItem';
import { AlertDetail } from '../../components/AlertDetail';
import { colors, font, spacing, radius } from '../../lib/theme';
import type { Alert as AlertType } from '../../lib/types';

type Filter = 'all' | 'confirmed' | 'false_alarm';

function groupByDate(alerts: AlertType[]): { title: string; data: AlertType[] }[] {
  const map = new Map<string, AlertType[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  for (const a of alerts) {
    const d = new Date(a.created_at);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(a);
  }

  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'false_alarm', label: 'False alarms' },
];

export default function HistoryScreen() {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<AlertType | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setAlerts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const markFalseAlarm = async (id: string) => {
    await supabase.from('alerts').update({ status: 'false_alarm' }).eq('id', id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'false_alarm' } : a)),
    );
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'confirmed') return a.status !== 'false_alarm';
    if (filter === 'false_alarm') return a.status === 'false_alarm';
    return true;
  });

  const sections = groupByDate(filtered);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Alert History</Text>
        <Text style={styles.subtitle}>{alerts.length} total alerts</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            activeOpacity={0.75}
          >
            <Text
              style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.red} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🕐</Text>
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.emptyBody}>
            When ScreamGuard detects a scream, the alert will appear here.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertItem alert={item} onPress={() => setSelected(item)} />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AlertDetail
        alert={selected}
        onClose={() => setSelected(null)}
        onMarkFalseAlarm={markFalseAlarm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: 3,
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
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  filterTab: {
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  filterTabActive: {
    backgroundColor: colors.redDim,
    borderColor: colors.redMid,
  },
  filterLabel: {
    fontSize: font.sm,
    fontWeight: '500',
    color: colors.textMuted,
  },
  filterLabelActive: {
    color: colors.red,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionHeader: {
    paddingBottom: 12,
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: font.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: 20,
    paddingBottom: 40,
  },
});
