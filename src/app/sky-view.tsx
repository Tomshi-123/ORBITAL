import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Page, PageHeader, Panel } from '../components/ui';
import { colors } from '../theme';

const objects = [
  { name: 'SIRIUS', kind: 'Star', detail: 'Brightest star in Canis Major', magnitude: '−1.46', x: '20%', y: '33%' },
  { name: 'ORION', kind: 'Constellation', detail: 'Prominent winter constellation', magnitude: 'Visible', x: '59%', y: '47%' },
  { name: 'JUPITER', kind: 'Planet', detail: 'Visible in the evening sky', magnitude: '−2.1', x: '72%', y: '23%' },
  { name: 'VEGA', kind: 'Star', detail: 'Part of the Summer Triangle', magnitude: '0.03', x: '38%', y: '68%' },
];

export default function SkyViewScreen() {
  const [heading, setHeading] = useState(210);
  const [mode, setMode] = useState<'Manual sky map' | 'Aligned preview'>('Manual sky map');
  return <Page>
    <PageHeader eyebrow="NIGHT-SKY GUIDE" title="Sky view" subtitle="A manual sky-map preview. Sensor alignment can be connected later." />
    <Panel style={styles.permission}><View style={styles.permissionIcon}><Ionicons name="compass-outline" size={21} color={colors.cyan} /></View><View style={styles.permissionCopy}><Text style={styles.permissionTitle}>Start in manual mode</Text><Text style={styles.permissionText}>Location, compass, orientation and camera permissions are not requested in this mock preview.</Text></View></Panel>
    <View style={styles.controls}><Badge tone="blue">{mode.toUpperCase()}</Badge><TouchableOpacity onPress={() => setMode(mode === 'Manual sky map' ? 'Aligned preview' : 'Manual sky map')}><Text style={styles.toggleText}>Switch mode</Text></TouchableOpacity></View>
    <View style={styles.sky}>
      <View style={styles.horizon} />
      <Text style={styles.direction}>{heading}°  ·  {heading < 90 || heading >= 270 ? 'NORTH' : heading < 180 ? 'EAST' : 'SOUTH'}</Text>
      {objects.map((object) => <TouchableOpacity key={object.name} style={[styles.star, { left: object.x as `${number}%`, top: object.y as `${number}%` }]} onPress={() => setMode('Aligned preview')}>
        <View style={object.kind === 'Constellation' ? styles.constellationMark : styles.starMark} />
        <Text style={styles.starName}>{object.name}</Text>
        <Text style={styles.starKind}>{object.kind}</Text>
      </TouchableOpacity>)}
      <View style={styles.skyActions}>
        <TouchableOpacity style={styles.directionButton} onPress={() => setHeading((heading + 15) % 360)}><Ionicons name="chevron-back" size={19} color={colors.text} /></TouchableOpacity>
        <Text style={styles.manualNote}>DRAG / ADJUST DIRECTION</Text>
        <TouchableOpacity style={styles.directionButton} onPress={() => setHeading((heading + 345) % 360)}><Ionicons name="chevron-forward" size={19} color={colors.text} /></TouchableOpacity>
      </View>
    </View>
    <Text style={styles.section}>Visible above the horizon</Text>
    {objects.map((object) => <Panel key={object.name} style={styles.objectCard}>
      <View style={styles.objectSymbol}><Ionicons name={object.kind === 'Planet' ? 'planet-outline' : 'star-outline'} size={18} color={colors.cyan} /></View>
      <View style={styles.objectCopy}><Text style={styles.objectName}>{object.name}</Text><Text style={styles.objectDetails}>{object.kind} · {object.detail}</Text></View>
      <Text style={styles.magnitude}>{object.magnitude}</Text>
    </Panel>)}
    <Text style={styles.footnote}>Object positions and visibility are illustrative. Connect an astronomy data source and device sensors for real alignment.</Text>
  </Page>;
}

const styles = StyleSheet.create({
  permission: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  permissionIcon: { width: 41, height: 41, borderRadius: 14, backgroundColor: '#142B3A', alignItems: 'center', justifyContent: 'center' },
  permissionCopy: { flex: 1, gap: 4 },
  permissionTitle: { color: colors.text, fontSize: 12, fontWeight: '600' },
  permissionText: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleText: { color: colors.cyan, fontSize: 11, fontWeight: '600' },
  sky: { height: 360, borderRadius: 23, borderWidth: 1, borderColor: '#203849', backgroundColor: '#07121F', overflow: 'hidden' },
  horizon: { position: 'absolute', left: -45, right: -45, bottom: -90, height: 185, borderTopWidth: 1, borderColor: '#315D68', borderRadius: 190, backgroundColor: '#0B2025' },
  direction: { color: '#8CA8B6', fontSize: 9, letterSpacing: 1.4, fontWeight: '700', position: 'absolute', top: 15, left: 16 },
  star: { position: 'absolute', alignItems: 'center', gap: 4 },
  starMark: { width: 7, height: 7, borderRadius: 5, backgroundColor: '#D8F3FF', shadowColor: colors.cyan, shadowOpacity: 0.8, shadowRadius: 8 },
  constellationMark: { width: 9, height: 9, borderRadius: 5, borderWidth: 1, borderColor: colors.violet, backgroundColor: '#7C72B8' },
  starName: { color: colors.text, fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  starKind: { color: colors.muted, fontSize: 8 },
  skyActions: { position: 'absolute', left: 12, right: 12, bottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  directionButton: { width: 36, height: 36, borderRadius: 14, backgroundColor: '#1B3040', alignItems: 'center', justifyContent: 'center' },
  manualNote: { color: colors.muted, fontSize: 8, letterSpacing: 1.1 },
  section: { color: colors.text, fontSize: 16, fontWeight: '600' },
  objectCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  objectSymbol: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#142A3A', alignItems: 'center', justifyContent: 'center' },
  objectCopy: { flex: 1, gap: 4 },
  objectName: { color: colors.text, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  objectDetails: { color: colors.muted, fontSize: 9 },
  magnitude: { color: colors.cyan, fontSize: 10, fontWeight: '600' },
  footnote: { color: colors.faint, fontSize: 9, lineHeight: 14, textAlign: 'center' },
});
