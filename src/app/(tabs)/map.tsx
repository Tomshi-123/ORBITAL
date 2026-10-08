import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Globe3D } from '../../components/Globe3D';
import { FilterChips, Page, PageHeader, Panel, SightingRow } from '../../components/ui';
import { dataSource } from '../../services';
import { markerColor } from '../../services/uapAtlas';
import { colors } from '../../theme';
import type { Sighting } from '../../types';

export default function MapScreen() {
  const [reports, setReports] = useState<Sighting[]>([]);
  const [windowFilter, setWindowFilter] = useState('All');
  const [selected, setSelected] = useState<Sighting | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [shown, setShown] = useState(10);
  useEffect(() => { dataSource.getSightings().then(setReports); }, []);
  const days = windowFilter === '30 days' ? 30 : windowFilter === '1 year' ? 365 : Infinity;
  const cutoff = Date.now() - days * 86_400_000;
  const visible = reports.filter((report) => new Date(report.timestamp).getTime() >= cutoff);
  const markers = useMemo(() => visible.slice(0, 150).map((report) => ({ id: report.id, latitude: report.latitude, longitude: report.longitude, color: markerColor(report.timestamp) })), [visible]);
  return <Page scrollEnabled={scrollEnabled}>
    <PageHeader eyebrow="OBSERVATION NETWORK" title="Live map" subtitle="Reported observations from The UAP Atlas" action={{ icon: 'search-outline', onPress: () => router.push('/search') }} />
    <FilterChips items={['30 days', '1 year', 'All']} selected={windowFilter} onSelect={setWindowFilter} />
    <Panel style={styles.mapPanel}>
      <View style={styles.mapTop}><View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>UAP ATLAS</Text></View><Text style={styles.countText}>{visible.length} reports</Text></View>
      <View style={styles.mapArea}>
        <Globe3D
          markers={markers}
          selectedId={selected?.id}
          onSelect={(id) => setSelected(visible.find((report) => report.id === id) ?? null)}
          onInteractionChange={(active) => setScrollEnabled(!active)}
        />
        <View style={styles.mapLegend}><View style={[styles.legendDot, { backgroundColor: '#FF4D4F' }]} /><Text style={styles.legendText}>&lt;7d</Text><View style={[styles.legendDot, { backgroundColor: '#FFD23F' }]} /><Text style={styles.legendText}>&lt;30d</Text><View style={[styles.legendDot, { backgroundColor: '#3D8BFF' }]} /><Text style={styles.legendText}>older</Text></View>
      </View>
      <Text style={styles.mapFootnote}>Data: NUFORC via The UAP Atlas (city-level coordinates). Reports are unverified. Showing up to 150 newest markers.</Text>
    </Panel>
    {selected ? <Panel style={styles.selectedCard}>
      <View style={styles.selectedHeader}><View><Text style={styles.kicker}>SELECTED REPORT</Text><Text style={styles.selectedTitle}>{selected.location}</Text></View><TouchableOpacity onPress={() => setSelected(null)}><Ionicons name="close" size={19} color={colors.muted} /></TouchableOpacity></View>
      <Text style={styles.selectedDescription}>{selected.description}</Text><Text style={styles.selectedDescription}>{new Date(selected.timestamp).toLocaleDateString()}</Text>
      <TouchableOpacity onPress={() => router.push(`/sighting/${selected.id}`)} style={styles.detailLink}><Text style={styles.detailText}>Open full report</Text><Ionicons name="arrow-forward" size={14} color={colors.cyan} /></TouchableOpacity>
    </Panel> : null}
    <View style={styles.listHeader}><Text style={styles.sectionTitle}>Recent reports</Text><Text style={styles.sectionMeta}>Select a marker or report</Text></View>
    <Panel style={styles.rows}>{visible.slice(0, shown).map((report) => <SightingRow key={report.id} sighting={report} compact />)}</Panel>
    {visible.length > shown ? <TouchableOpacity onPress={() => setShown((count) => count + 10)} style={styles.showMore} activeOpacity={0.75}>
      <Text style={styles.detailText}>Show {Math.min(10, visible.length - shown)} more</Text><Ionicons name="chevron-down" size={14} color={colors.cyan} />
    </TouchableOpacity> : null}
  </Page>;
}

const styles = StyleSheet.create({
  mapPanel: { padding: 0, overflow: 'hidden' },
  mapTop: { padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.amber },
  liveText: { color: colors.amber, fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  countText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  mapArea: { height: 320, backgroundColor: '#08131E', overflow: 'hidden', justifyContent: 'center' },
  mapLegend: { position: 'absolute', bottom: 13, left: 14, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#08131E', padding: 8, borderRadius: 9 },
  legendDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: colors.blue },
  legendText: { color: colors.muted, fontSize: 9 },
  mapFootnote: { color: colors.faint, fontSize: 9, lineHeight: 14, padding: 13 },
  selectedCard: { gap: 10 },
  selectedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: colors.cyan, fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  selectedTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 5 },
  selectedDescription: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  detailLink: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  detailText: { color: colors.cyan, fontSize: 11, fontWeight: '700' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  sectionMeta: { color: colors.faint, fontSize: 9 },
  rows: { paddingTop: 4, paddingBottom: 4 },
  showMore: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
});
