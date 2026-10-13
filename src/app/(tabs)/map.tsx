import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Countdown } from '../../components/Countdown';
import { Globe3D, type GlobeMarker, type GlobePath } from '../../components/Globe3D';
import { FilterChips, Page, PageHeader, Panel, SightingRow } from '../../components/ui';
import { dataSource } from '../../services';
import { orbitGroundTrack } from '../../services/orbits';
import { getAsteroids, type Asteroid } from '../../services/asteroids';
import { getAuroraForecast, type AuroraCell } from '../../services/aurora';
import { getSatelliteTracks, propagateSatellites, type SatellitePosition, type SatelliteTrack } from '../../services/satellites';
import { getIssPosition, type IssPosition } from '../../services/uapAtlas';
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
  { key: 'moon', label: 'Moon' },
  { key: 'asteroids', label: 'Asteroids' },
] as const;
const TABS = ['UAP reports', 'Coming launches', 'Incoming asteroids'];
type LayerKey = (typeof LAYERS)[number]['key'];

export default function MapScreen() {
  const { width } = useWindowDimensions();
  const globeSize = Math.max(280, Math.min(width - 24, 420));
  const [reports, setReports] = useState<Sighting[]>([]);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedLaunchId, setSelectedLaunchId] = useState<string | null>(null);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ sightings: true, iss: true, launches: true, satellites: true, aurora: true, moon: true, asteroids: true });
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [auroraCells, setAuroraCells] = useState<AuroraCell[]>([]);
  const [satelliteTracks, setSatelliteTracks] = useState<SatelliteTrack[]>([]);
  const [satellites, setSatellites] = useState<SatellitePosition[]>([]);
  const [issPosition, setIssPosition] = useState<IssPosition | null>(null);
  const [issUnavailable, setIssUnavailable] = useState(false);
  const [selected, setSelected] = useState<Sighting | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [shown, setShown] = useState(10);
  const [tab, setTab] = useState(TABS[0]);
  const [clockNow, setClockNow] = useState(Date.now());
  useEffect(() => { dataSource.getSightings().then(setReports); }, []);
  useEffect(() => { dataSource.getLaunches().then(setLaunches).catch(() => setLaunches([])); }, []);
  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    getAuroraForecast().then((forecast) => { if (active) setAuroraCells(forecast.cells); }).catch((error) => console.error('Failed to load aurora', error));
    getAsteroids().then((items) => { if (active) setAsteroids(items); }).catch((error) => console.error('Failed to load asteroids', error));
    return () => { active = false; };
  }, []);
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
  const visible = reports;
  const visibleLaunches = useMemo(() => launches.filter((launch) => {
    const launchTime = new Date(launch.launchAt).getTime();
    return !Number.isFinite(launchTime) || launchTime >= clockNow - 60 * 60 * 1000;
  }), [launches, clockNow]);
  const issNeeded = layers.iss || (layers.launches && visibleLaunches.some((launch) => launch.station === 'ISS'));
  const markers = useMemo(() => {
    const list: GlobeMarker[] = [];
    if (layers.sightings) {
      list.push(...visible.slice(0, 150).map((report) => ({ id: report.id, latitude: report.latitude, longitude: report.longitude, color: '#3D8BFF' })));
    }
    if (layers.launches) {
      const pads = visibleLaunches.filter((launch) => launch.padLatitude != null && launch.padLongitude != null);
      list.push(...pads
        .sort((a, b) => Number(a.id === selectedLaunchId) - Number(b.id === selectedLaunchId))
        .map((launch) => ({ id: `launch:${launch.id}`, latitude: launch.padLatitude as number, longitude: launch.padLongitude as number, color: LAUNCH_COLOR })));
    }
    if (issNeeded && issPosition) list.push({ id: 'iss', ...issPosition, color: '#35D07F', label: 'ISS' });
    return list;
  }, [visible, visibleLaunches, layers, issNeeded, issPosition, selectedLaunchId]);
  const paths = useMemo<GlobePath[]>(() => {
    if (!layers.launches) return [];
    return visibleLaunches.flatMap((launch) => {
      const points = orbitGroundTrack(launch);
      return points ? [{ id: launch.id, points, color: LAUNCH_COLOR, highlighted: launch.id === selectedLaunchId }] : [];
    }).sort((a, b) => Number(a.highlighted) - Number(b.highlighted));
  }, [visibleLaunches, layers.launches, selectedLaunchId]);
  const toggleLayer = (key: LayerKey) => setLayers((current) => ({ ...current, [key]: !current[key] }));
  const handleSelect = (id: string) => {
    if (id.startsWith('launch:')) {
      setSelectedLaunchId(id.slice('launch:'.length));
    } else if (id !== 'iss') {
      setSelected(visible.find((report) => report.id === id) ?? null);
    }
  };
  return <Page scrollEnabled={scrollEnabled}>
    <PageHeader eyebrow="OBSERVATION NETWORK" title="Live map" subtitle="Above us, right now." action={{ icon: 'search-outline', onPress: () => router.push('/search') }} />
    <View style={styles.layerRow}>
      {LAYERS.map(({ key, label }) => <TouchableOpacity key={key} onPress={() => toggleLayer(key)} style={styles.layerItem} activeOpacity={0.75} accessibilityRole="checkbox" accessibilityState={{ checked: layers[key] }}>
        <Ionicons name={layers[key] ? 'checkbox' : 'square-outline'} size={18} color={layers[key] ? colors.cyan : colors.muted} />
        <Text style={styles.layerText}>{label}</Text>
      </TouchableOpacity>)}
    </View>
    <Panel style={styles.mapPanel}>
      <View style={styles.mapArea}>
        <Globe3D
          markers={markers}
          paths={paths}
          aurora={layers.aurora ? auroraCells : undefined}
          orbiters={satellites}
          orbiterColor={SATELLITE_COLOR}
          zoomable
          showMoon={layers.moon}
          asteroids={layers.asteroids ? asteroids : undefined}
          focusMarkerId="iss"
          selectedId={selectedLaunchId ? `launch:${selectedLaunchId}` : selected?.id}
          onSelect={handleSelect}
          onInteractionChange={(active) => setScrollEnabled(!active)}
          size={globeSize}
        />
      </View>
      <View style={styles.mapLegend}><View style={[styles.legendDot, { backgroundColor: '#3D8BFF' }]} /><Text style={styles.legendText}>UAP report</Text><View style={[styles.legendDot, { backgroundColor: LAUNCH_COLOR }]} /><Text style={styles.legendText}>launch</Text><View style={[styles.legendDot, { backgroundColor: SATELLITE_COLOR }]} /><Text style={styles.legendText}>satellite</Text><View style={[styles.legendDot, { backgroundColor: '#3DFF9A' }]} /><Text style={styles.legendText}>aurora</Text><View style={[styles.legendDot, { backgroundColor: '#FF2D2D' }]} /><Text style={styles.legendText}>asteroid</Text></View>
      <Text style={styles.mapFootnote}>
        Data: NUFORC via The UAP Atlas (city-level coordinates). Reports are unverified. Showing up to 150 newest markers.
        {issUnavailable ? ' ISS position is temporarily unavailable.' : ' ISS position updates every 10 seconds.'}
        {' '}Launch orbits are estimated from pad location and target orbit type.
        {satellites.length > 0 ? ` ${satellites.length} satellites shown (TLE data, SGP4-propagated, altitude exaggerated).` : ''}
        {layers.aurora && auroraCells.length > 0 ? ' Aurora: NOAA SWPC OVATION 30-minute forecast (green = likely, purple = very likely).' : ''}
      </Text>
    </Panel>
    {selected ? <Panel style={styles.selectedCard}>
      <View style={styles.selectedHeader}><View><Text style={styles.kicker}>SELECTED REPORT</Text><Text style={styles.selectedTitle}>{selected.location}</Text></View><TouchableOpacity onPress={() => setSelected(null)}><Ionicons name="close" size={19} color={colors.muted} /></TouchableOpacity></View>
      <Text style={styles.selectedDescription}>{selected.description}</Text><Text style={styles.selectedDescription}>{new Date(selected.timestamp).toLocaleDateString()}</Text>
      <TouchableOpacity onPress={() => router.push(`/sighting/${selected.id}`)} style={styles.detailLink}><Text style={styles.detailText}>Open full report</Text><Ionicons name="arrow-forward" size={14} color={colors.cyan} /></TouchableOpacity>
    </Panel> : null}
    <FilterChips items={TABS} selected={tab} onSelect={setTab} />
    {tab === TABS[1] ? <Panel style={styles.infoList}>
      {visibleLaunches.length === 0 ? <Text style={styles.selectedDescription}>No upcoming launches loaded.</Text> : visibleLaunches.map((launch, index) => <TouchableOpacity key={launch.id} onPress={() => setSelectedLaunchId(launch.id === selectedLaunchId ? null : launch.id)} activeOpacity={0.75} style={styles.infoRow}>
        <View style={styles.launchRowTop}>
          <Text style={styles.selectedTitle}>{launch.mission}</Text>
          {index === 0 ? <Text style={styles.nextBadge}>NEXT</Text> : null}
        </View>
        <Text style={styles.selectedDescription}>{launch.rocket} · {launch.location}</Text>
        <Text style={styles.selectedDescription}>{new Date(launch.launchAt).toLocaleString()} · Orbit: {launch.orbitName ?? 'Unknown'}{launch.station ? ` · To ${launch.station}` : ''}</Text>
        <View style={styles.launchCountdown}><Countdown target={launch.launchAt} compact /></View>
      </TouchableOpacity>)}
    </Panel> : null}
    {tab === TABS[2] ? <Panel style={styles.infoList}>
      {asteroids.length === 0 ? <Text style={styles.selectedDescription}>No asteroid data loaded (NASA NeoWs).</Text> : asteroids.map((a) => <View key={a.id} style={styles.infoRow}>
        <Text style={styles.selectedTitle}>{a.name}{a.hazardous ? ' · potentially hazardous' : ''}</Text>
        <Text style={styles.selectedDescription}>Closest approach {new Date(a.approachMs).toLocaleString()} at {a.missLd.toFixed(1)} lunar distances ({Math.round(a.missLd * 384400).toLocaleString()} km)</Text>
        <Text style={styles.selectedDescription}>Speed {(a.speedLdPerDay * 384400 / 86400).toFixed(1)} km/s · diameter up to {Math.round(a.diameterM)} m</Text>
      </View>)}
    </Panel> : null}
    {tab === TABS[0] ? <View style={styles.listHeader}><Text style={styles.sectionTitle}>UAP reports</Text><Text style={styles.sectionMeta}>Select a marker or report</Text></View> : null}
    {tab === TABS[0] ? <Panel style={styles.rows}>{visible.slice(0, shown).map((report) => <SightingRow key={report.id} sighting={report} compact />)}</Panel> : null}
    {tab === TABS[0] && visible.length > shown ? <TouchableOpacity onPress={() => setShown((count) => count + 10)} style={styles.showMore} activeOpacity={0.75}>
      <Text style={styles.detailText}>Show {Math.min(10, visible.length - shown)} more</Text><Ionicons name="chevron-down" size={14} color={colors.cyan} />
    </TouchableOpacity> : null}
  </Page>;
}

const styles = StyleSheet.create({
  mapPanel: { padding: 0, backgroundColor: 'transparent', borderWidth: 0 },
  layerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  layerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  layerText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  launchRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nextBadge: { color: LAUNCH_COLOR, fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  launchCountdown: { marginTop: 6, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 6, borderRadius: 10, backgroundColor: colors.surfaceRaised },
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
  infoList: { gap: 12 },
  infoRow: { gap: 4 },
  rows: { paddingTop: 4, paddingBottom: 4 },
  showMore: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
});
