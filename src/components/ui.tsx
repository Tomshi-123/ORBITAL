import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Sighting } from '../types';
import { colors, radii } from '../theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Page({ children, scroll = true, scrollEnabled = true }: PropsWithChildren<{ scroll?: boolean; scrollEnabled?: boolean }>) {
  const content = scroll ? (
    <ScrollView scrollEnabled={scrollEnabled} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : <View style={styles.pageContent}>{children}</View>;
  return <SafeAreaView style={styles.safeArea} edges={['top']}>{content}</SafeAreaView>;
}

export function PageHeader({ eyebrow, title, subtitle, action }: {
  eyebrow?: string; title: string; subtitle?: string; action?: { icon: IconName; onPress: () => void };
}) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <TouchableOpacity onPress={action.onPress} style={styles.headerAction} accessibilityRole="button">
        <Ionicons name={action.icon} size={19} color={colors.text} />
      </TouchableOpacity> : null}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionTitle}>
    <Text style={styles.sectionText}>{title}</Text>
    {action ? <TouchableOpacity onPress={onAction}><Text style={styles.actionText}>{action}</Text></TouchableOpacity> : null}
  </View>;
}

export function Panel({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Badge({ children, tone = 'blue' }: PropsWithChildren<{ tone?: 'blue' | 'green' | 'amber' | 'red' | 'muted' }>) {
  const toneColor = tone === 'green' ? colors.green : tone === 'amber' ? colors.amber : tone === 'red' ? colors.red : tone === 'muted' ? colors.muted : colors.blue;
  return <View style={[styles.badge, { borderColor: `${toneColor}35`, backgroundColor: `${toneColor}12` }]}>
    <Text style={[styles.badgeText, { color: toneColor }]}>{children}</Text>
  </View>;
}

export function ActionButton({ label, onPress, icon, secondary = false }: {
  label: string; onPress: () => void; icon?: IconName; secondary?: boolean;
}) {
  return <TouchableOpacity onPress={onPress} style={[styles.button, secondary && styles.buttonSecondary]} activeOpacity={0.8}>
    {icon ? <Ionicons name={icon} color={secondary ? colors.text : colors.background} size={16} /> : null}
    <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
  </TouchableOpacity>;
}

export function StatCard({ label, value, caption, icon }: { label: string; value: string; caption: string; icon: IconName }) {
  return <Panel style={styles.statCard}>
    <View style={styles.statTop}>
      <Text style={styles.statLabel}>{label}</Text>
      <Ionicons name={icon} size={16} color={colors.cyan} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statCaption}>{caption}</Text>
  </Panel>;
}

export function SightingRow({ sighting, compact = false }: { sighting: Sighting; compact?: boolean }) {
  const tone = sighting.confidence === 'High' ? 'green' : sighting.confidence === 'Medium' ? 'amber' : 'muted';
  return <TouchableOpacity style={styles.sightingRow} activeOpacity={0.75} onPress={() => router.push(`/sighting/${sighting.id}`)}>
    <View style={styles.sightingDot} />
    <View style={styles.sightingCopy}>
      <Text style={styles.rowTitle} numberOfLines={1}>{sighting.location}</Text>
      <Text style={styles.rowMeta} numberOfLines={1}>{compact ? sighting.objectType : `${sighting.objectType}  ·  ${sighting.witnesses} witness${sighting.witnesses === 1 ? '' : 'es'}`}</Text>
    </View>
    <View style={styles.rowRight}>
      <Badge tone={tone}>{sighting.confidence}</Badge>
      <Text style={styles.timeText}>{new Date(sighting.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
    </View>
  </TouchableOpacity>;
}

export function FilterChips({ items, selected, onSelect }: { items: string[]; selected: string; onSelect: (item: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
    {items.map((item) => <TouchableOpacity key={item} onPress={() => onSelect(item)} style={[styles.chip, item === selected && styles.chipSelected]}>
      <Text style={[styles.chipText, item === selected && styles.chipTextSelected]}>{item}</Text>
    </TouchableOpacity>)}
  </ScrollView>;
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  pageContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28, gap: 20 },
  pageHeader: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerCopy: { flex: 1, gap: 5 },
  eyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '700', color: colors.cyan },
  pageTitle: { color: colors.text, fontSize: 27, lineHeight: 32, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  headerAction: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -8 },
  sectionText: { color: colors.text, fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  actionText: { color: colors.cyan, fontSize: 12, fontWeight: '600' },
  panel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 16 },
  badge: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 5, alignSelf: 'flex-start' },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  button: { minHeight: 44, paddingHorizontal: 15, borderRadius: 14, backgroundColor: colors.cyan, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  buttonSecondary: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised },
  buttonText: { fontSize: 12, fontWeight: '700', color: colors.background },
  buttonTextSecondary: { color: colors.text },
  statCard: { flex: 1, minWidth: 140, padding: 14, gap: 9 },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: '500' },
  statValue: { color: colors.text, fontSize: 24, lineHeight: 28, fontWeight: '700' },
  statCaption: { color: colors.faint, fontSize: 10 },
  sightingRow: { minHeight: 66, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
  sightingDot: { width: 8, height: 8, borderRadius: 5, backgroundColor: colors.cyan },
  sightingCopy: { flex: 1, gap: 5 },
  rowTitle: { color: colors.text, fontSize: 13, fontWeight: '600' },
  rowMeta: { color: colors.muted, fontSize: 10 },
  rowRight: { alignItems: 'flex-end', gap: 5 },
  timeText: { color: colors.faint, fontSize: 9 },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radii.pill },
  chipSelected: { backgroundColor: '#173344', borderColor: '#2B637A' },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: '500' },
  chipTextSelected: { color: colors.cyan },
  infoRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  infoLabel: { color: colors.muted, fontSize: 12 },
  infoValue: { color: colors.text, fontSize: 12, fontWeight: '500', textAlign: 'right', flexShrink: 1 },
});
