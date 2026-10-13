import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Globe3D, type GlobeMarker, type GlobePath } from '../../components/Globe3D';
import { FilterChips, Page, PageHeader, Panel, SightingRow } from '../../components/ui';
import { dataSource } from '../../services';
import { orbitGroundTrack } from '../../services/orbits';
import { getAuroraForecast, type AuroraCell } from '../../services/aurora';
import { getSatelliteTracks, propagateSatellites, type SatellitePosition, type SatelliteTrack } from '../../services/satellites';
import { getIssPosition, markerColor, type IssPosition } from '../../services/uapAtlas';
import { colors } from '../../theme';
import type { Launch, Sighting } from '../../types';

const LAUNCH_COLOR = '#B86BFF';
const SATELLITE_COLOR = '#B6FF3B';
const LAYERS = [
  { key: 'sightings', label: 'UAP sightings' },
  { key: 'iss', label: 'ISS' },
  { key: 'launches', label: 'Launch orbits' },
  { key: 'satellites', label: 'Satellites' },
  { key: 'aurora', label: 'Aurora' },
] as const;
type LayerKey = (typeof LAYERS)[number]['key'];

export default function MapScreen() {
  const { width } = useWindowDimensions();
  const globeSize = Math.max(280, Math.min(width - 24, 420));
  const [reports, setReports] = useState<Sighting[]>([]);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedLaunchId, setSelectedLaunchId] = useState<string | null>(null);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ sightings: true, iss: true, launches: true, satellites: true, aurora: true });
  const [auroraCells, setAuroraCells] = useState<AuroraCell[]>([]);
  const [satelliteTracks, setSatelliteTracks] = useState<SatelliteTrack[]>([]);
  const [satellites, setSatellites] = useState<SatellitePosition[]>([]);
  const [issPosition, setIssPosition] = useState<IssPosition | null>(null);
  const [issUnavailable, setIssUnavailable] = useState(false);
  const [windowFilter, setWindowFilter] = useState('All');
  const [selected, setSelected] = useState<Sighting | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [shown, setShown] = useState(10);
  useEffect(() => { dataSource.getSightings().then(setReports); }, []);
  useEffect(() => { dataSource.getLaunches().then(setLaunches).catch(() => setLaunches([])); }, []);
  useEffect(() => {
    let active = true;
    getSatelliteTracks((tracks) => { if (active) setSatelliteTracks(tracks); })
      .then((tracks) => { if (active) setSatelliteTracks(tracks); })
      .catch((error) => console.error('Failed to load satellites', error));
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!layers.satellites || satelliteTracks.length === 0) {
      setSatellites([]);
      return;
    }
    const update = () => setSatellites(propagateSatellites(satelliteTracks));
    update();
    const interval = setInterval(update, 2_000);
    return () => clearInterval(interval);
  }, [layers.satellites, satelliteTracks]);
  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;

    const updateIssPosition = async () => {
      try {
        const position = await getIssPosition();
        if (active) {
          setIssPosition(position);
          setIssUnavailable(false);
        }
      } catch (error) {
        console.error('Failed to update ISS position', error);
        if (active) {
          setIssPosition(null);
          setIssUnavailable(true);
        }
      } finally {
        if (active) {
          timeout = setTimeout(() => { void updateIssPosition(); }, 10_000);
        }
      }
    };

    void updateIssPosition();
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, []);
  const days = windowFilter === '30 days' ? 30 : windowFilter === '1 year' ? 365 : Infinity;
  const cutoff = Date.now() - days * 86_400_000;
  const visible = reports.filter((report) => new Date(report.timestamp).getTime() >= cutoff);
  const issNeeded = layers.iss || (layers.launches && launches.some((launch) => launch.station === 'ISS'));
  const markers = useMemo(() => {
    const list: GlobeMarker[] = [];
    if (layers.sightings) {
      list.push(...visible.slice(0, 150).map((report) => ({ id: report.id, latitude: report.latitude, longitude: report.longitude, color: markerColor(report.timestamp) })));
    }
    if (layers.launches) {
      const pads = launches.filter((launch) => launch.padLatitude != null && launch.padLongitude != null);
      list.push(...pads
        .sort((a, b) => Number(a.id === selectedLaunchId) - Number(b.id === selectedLaunchId))
        .map((launch) => ({ id: `launch:${launch.id}`, latitude: launch.padLatitude as number, longitude: launch.padLongitude as number, color: LAUNCH_COLOR })));
    }
    if (issNeeded && issPosition) list.push({ id: 'iss', ...issPosition, color: '#35D07F', label: 'ISS' });
    return list;
  }, [visible, launches, layers, issNeeded, issPosition, selectedLaunchId]);
  const paths = useMemo<GlobePath[]>(() => {
    if (!layers.launches) return [];
    return launches.flatMap((launch) => {
      const points = orbitGroundTrack(launch);
      return points ? [{ id: launch.id, points, color: LAUNCH_COLOR, highlighted: launch.id === selectedLaunchId }] : [];
    }).sort((a, b) => Number(a.highlighted) - Number(b.highlighted));
  }, [launches, layers.launches, selectedLaunchId]);
  const selectedLaunch = layers.launches ? launches.find((launch) => launch.id === selectedLaunchId) ?? null : null;
  const toggleLayer = (key: LayerKey) => setLayers((current) => ({ ...current, [key]: !current[key] }));
  const handleSelect = (id: string) => {
    if (id.startsWith('launch:')) {
      setSelectedLaunchId(id.slice('launch:'.length));
    } else if (id !== 'iss') {
      setSelected(visible.find((report) => report.id === id) ?? null);
    }
  };
  return <Page scrollEnabled={scrollEnabled}>
    <PageHeader eyebrow="OBSERVATION NETWORK" title="Live map" subtitle="Reported observations from The UAP Atlas" action={{ icon: 'search-outline', onPress: () => router.push('/search') }} />
    <View style={styles.layerRow}>
      {LAYERS.map(({ key, label }) => <TouchableOpacity key={key} onPress={() => toggleLayer(key)} style={styles.layerItem} activeOpacity={0.75} accessibilityRole="checkbox" accessibilityState={{ checked: layers[key] }}>
        <Ionicons name={layers[key] ? 'checkbox' : 'square-outline'} size={18} color={layers[key] ? colors.cyan : colors.muted} />
        <Text style={styles.layerText}>{label}</Text>
      </TouchableOpacity>)}
    </View>
    <FilterChips items={['30 days', '1 year', 'All']} selected={windowFilter} onSelect={setWindowFilter} />
    <Panel style={styles.mapPanel}>
      <View style={styles.mapTop}><View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>UAP ATLAS</Text></View><Text style={styles.countText}>{layers.sightings ? `${visible.length} reports` : 'Reports hidden'}</Text></View>
      <View style={styles.mapArea}>
        <Globe3D
          markers={markers}
          paths={paths}
          aurora={layers.aurora ? auroraCells : undefined}
          orbiters={satellites}
          orbiterColor={SATELLITE_COLOR}
          focusMarkerId="iss"
          selectedId={selectedLaunchId ? `launch:${selectedLaunchId}` : selected?.id}
          onSelect={handleSelect}
          onInteractionChange={(active) => setScrollEnabled(!active)}
          size={globeSize}
        />
      </View>
      <View style={styles.mapLegend}><View style={[styles.legendDot, { backgroundColor: '#FF4D4F' }]} /><Text style={styles.legendText}>&lt;7d</Text><View style={[styles.legendDot, { backgroundColor: '#FFD23F' }]} /><Text style={styles.legendText}>&lt;30d</Text><View style={[styles.legendDot, { backgroundColor: '#3D8BFF' }]} /><Text style={styles.legendText}>older</Text><View style={[styles.legendDot, { backgroundColor: LAUNCH_COLOR }]} /><Text style={styles.legendText}>launch</Text><View style={[styles.legendDot, { backgroundColor: SATELLITE_COLOR }]} /><Text style={styles.legendText}>satellite</Text><View style={[styles.legendDot, { backgroundColor: '#3DFF9A' }]} /><Text style={styles.legendText}>aurora</Text></View>
      <Text style={styles.mapFootnote}>
        Data: NUFORC via The UAP Atlas (city-level coordinates). Reports are unverified. Showing up to 150 newest markers.
        {issUnavailable ? ' ISS position is temporarily unavailable.' : ' ISS position updates every 10 seconds.'}
        {' '}Launch orbits are estimated from pad location and target orbit type.
        {satellites.length > 0 ? ` ${satellites.length} satellites shown (TLE data, SGP4-propagated, altitude exaggerated).` : ''}
        {layers.aurora && auroraCells.length > 0 ? ' Aurora: NOAA SWPC OVATION 30-minute forecast (green = likely, purple = very likely).' : ''}
      </Text>
    </Panel>
    {layers.launches && launches.some((launch) => launch.padLatitude != null) ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.launchChips}>
      {launches.filter((launch) => launch.padLatitude != null).map((launch) => <TouchableOpacity key={launch.id} onPress={() => setSelectedLaunchId(launch.id === selectedLaunchId ? null : launch.id)} style={[styles.launchChip, launch.id === selectedLaunchId && styles.launchChipSelected]}>
        <Text style={[styles.launchChipText, launch.id === selectedLaunchId && styles.launchChipTextSelected]} numberOfLines={1}>{launch.mission}</Text>
      </TouchableOpacity>)}
    </ScrollView> : null}
    {selectedLaunch ? <Panel style={styles.selectedCard}>
      <View style={styles.selectedHeader}><View style={styles.launchHeaderCopy}><Text style={styles.launchKicker}>UPCOMING LAUNCH</Text><Text style={styles.selectedTitle}>{selectedLaunch.mission}</Text></View><TouchableOpacity onPress={() => setSelectedLaunchId(null)}><Ionicons name="close" size={19} color={colors.muted} /></TouchableOpacity></View>
      <Text style={styles.selectedDescription}>{selectedLaunch.rocket} · {selectedLaunch.location}</Text>
      <Text style={styles.selectedDescription}>
        Likely orbit: {selectedLaunch.orbitName ?? 'Unknown'}
        {selectedLaunch.station ? ` · Destination: ${selectedLaunch.station === 'ISS' ? 'International Space Station' : 'Tiangong space station (position not shown)'}` : ''}
      </Text>
      <Text style={styles.selectedDescription}>{new Date(selectedLaunch.launchAt).toLocaleString()}</Text>
    </Panel> : null}
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
  mapPanel: { padding: 0, backgroundColor: 'transparent', borderWidth: 0 },
  layerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  layerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  layerText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  launchChips: { gap: 8 },
  launchChip: { maxWidth: 190, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  launchChipSelected: { backgroundColor: LAUNCH_COLOR, borderColor: LAUNCH_COLOR },
  launchChipText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  launchChipTextSelected: { color: '#0B1118' },
  launchKicker: { color: LAUNCH_COLOR, fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  launchHeaderCopy: { flex: 1, marginRight: 8 },
  mapTop: { padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.amber },
  liveText: { color: colors.amber, fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  countText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  mapArea: { justifyContent: 'center' },
  mapLegend: { marginTop: 14, paddingHorizontal: 14, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 7 },
  legendDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: colors.blue },
  legendText: { color: colors.muted, fontSize: 9 },
  mapFootnote: { color: colors.faint, fontSize: 9, lineHeight: 14, padding: 13, textAlign: 'center' },
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
