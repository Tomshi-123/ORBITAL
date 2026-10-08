import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { Globe3D, type GlobeMarker } from './Globe3D';
import { Panel } from './ui';

export function GlobePreview({ markers, onInteractionChange }: { markers: GlobeMarker[]; onInteractionChange?: (active: boolean) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return <Panel style={styles.panel}>
    <View style={styles.topLine}>
      <View><Text style={styles.kicker}>GLOBAL ACTIVITY</Text><Text style={styles.title}>Live observation map</Text></View>
      <View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>SAMPLE DATA</Text></View>
    </View>
    <View style={styles.mapStage}>
      <Globe3D markers={markers} selectedId={selectedId} onSelect={setSelectedId} onInteractionChange={onInteractionChange} size={230} />
      <TouchableOpacity style={styles.mapHint} onPress={() => router.push('/map')}><Text style={styles.mapHintText}>OPEN LIVE MAP</Text><Ionicons name="arrow-forward" size={13} color={colors.cyan} /></TouchableOpacity>
    </View>
    <View style={styles.legend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.blue }]} /><Text style={styles.legendText}>Drag to rotate</Text></View><Text style={styles.legendText}>30 sample reports</Text></View>
  </Panel>;
}
const styles = StyleSheet.create({
  panel: { padding: 0, overflow: 'hidden' },
  topLine: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: 9, color: colors.muted, letterSpacing: 1.5, fontWeight: '700' },
  title: { marginTop: 6, fontSize: 14, color: colors.text, fontWeight: '600' },
  live: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  liveDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: colors.amber },
  liveText: { color: colors.amber, fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  mapStage: { height: 250, backgroundColor: '#07101A', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  grid: { ...StyleSheet.absoluteFill, opacity: 0.2, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#17405A' },
  globe: { width: 190, height: 190, borderRadius: 100, backgroundColor: '#102A3C', borderWidth: 1, borderColor: '#2D6984', overflow: 'hidden', shadowColor: colors.cyan, shadowOpacity: 0.18, shadowRadius: 25, elevation: 8 },
  latitude: { position: 'absolute', width: 190, height: 74, top: 57, borderWidth: 1, borderColor: '#2A5668', borderRadius: 100 },
  longitude: { position: 'absolute', height: 190, width: 82, left: 53, borderWidth: 1, borderColor: '#2A5668', borderRadius: 100 },
  land: { position: 'absolute', backgroundColor: '#245342', opacity: 0.85 },
  landOne: { width: 46, height: 65, left: 40, top: 27, borderRadius: 25, transform: [{ rotate: '-32deg' }] },
  landTwo: { width: 30, height: 75, left: 82, top: 91, borderRadius: 20, transform: [{ rotate: '19deg' }] },
  landThree: { width: 52, height: 32, left: 112, top: 59, borderRadius: 16, transform: [{ rotate: '-18deg' }] },
  mapPoint: { position: 'absolute', width: 7, height: 7, borderRadius: 5, backgroundColor: colors.blue, borderWidth: 1, borderColor: '#D6F5FF' },
  hotPoint: { backgroundColor: colors.amber, width: 9, height: 9 },
  mapHint: { position: 'absolute', right: 15, bottom: 14, flexDirection: 'row', gap: 7, alignItems: 'center' },
  mapHintText: { color: colors.cyan, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  legend: { paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 6, height: 6, borderRadius: 4 },
  legendText: { color: colors.muted, fontSize: 10 },
});
