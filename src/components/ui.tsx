import { useId, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SpaceBackdrop } from './SpaceBackdrop';
import { Panel } from './GlassPanel';
import { TouchGlowContext } from './TouchGlowContext';
import { colors, radii } from '../theme';

export { Panel };

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Page({ children, scroll = true, scrollEnabled = true, style }: PropsWithChildren<{ scroll?: boolean; scrollEnabled?: boolean; style?: StyleProp<ViewStyle> }>) {
  const pageId = useId();
  const [touchPoint, setTouchPoint] = useState<{ x: number; y: number } | null>(null);
  const [shootingStarPoint, setShootingStarPoint] = useState<{ x: number; y: number } | null>(null);
  const updateTouchPoint = (event: { nativeEvent: { pageX: number; pageY: number } }) => {
    setTouchPoint({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
  };
  const finishTouch = (event: { nativeEvent: { touches: ArrayLike<{ pageX: number; pageY: number }> } }) => {
    const remainingTouch = event.nativeEvent.touches[0];
    setTouchPoint(remainingTouch ? { x: remainingTouch.pageX, y: remainingTouch.pageY } : null);
  };
  const content = scroll ? (
    <ScrollView scrollEnabled={scrollEnabled} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : <View style={styles.pageContent}>{children}</View>;
  return <TouchGlowContext.Provider value={{ pageId, point: touchPoint, setPoint: setTouchPoint, shootingStarPoint, setShootingStarPoint }}>
    <View
      nativeID={`orbital-page-${pageId}`}
      style={styles.touchRoot}
      onTouchStart={updateTouchPoint}
      onTouchMove={updateTouchPoint}
      onTouchEnd={finishTouch}
      onTouchCancel={() => setTouchPoint(null)}
    >
      <SafeAreaView style={[styles.safeArea, style]} edges={['top']}>
        <SpaceBackdrop />
        {content}
      </SafeAreaView>
    </View>
  </TouchGlowContext.Provider>;
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
  touchRoot: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  pageContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, gap: 22 },
  pageHeader: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  headerCopy: { flex: 1, gap: 6 },
  eyebrow: { fontSize: 9, letterSpacing: 2.4, fontWeight: '800', color: colors.cyan },
  pageTitle: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.7, textShadowColor: 'rgba(126, 112, 255, 0.18)', textShadowRadius: 16 },
  subtitle: { color: '#A8B5C9', fontSize: 13, lineHeight: 19 },
  headerAction: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(26, 35, 57, 0.76)', borderColor: 'rgba(158, 183, 255, 0.18)', borderWidth: 1, shadowColor: '#657BEF', shadowOpacity: 0.18, shadowRadius: 14, elevation: 5 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -8 },
  sectionText: { color: '#E8EEFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.15 },
  actionText: { color: colors.cyan, fontSize: 12, fontWeight: '600' },
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
  chips: { gap: 8, paddingVertical: 2 },
  chip: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: 'rgba(14, 21, 36, 0.78)', borderColor: 'rgba(145, 164, 213, 0.15)', borderWidth: 1, borderRadius: radii.pill },
  chipSelected: { backgroundColor: 'rgba(55, 96, 123, 0.34)', borderColor: 'rgba(101, 216, 232, 0.56)' },
  chipText: { color: colors.muted, fontSize: 11, fontWeight: '500' },
  chipTextSelected: { color: colors.cyan },
  infoRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  infoLabel: { color: colors.muted, fontSize: 12 },
  infoValue: { color: colors.text, fontSize: 12, fontWeight: '500', textAlign: 'right', flexShrink: 1 },
});
