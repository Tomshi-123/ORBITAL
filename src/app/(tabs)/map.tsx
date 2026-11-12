import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Countdown } from '../../components/Countdown';
import { Globe3D, type GlobeMarker, type GlobePath, type GlobeSpaceBody } from '../../components/Globe3D';
import { FilterChips, Page, PageHeader, Panel, SectionTitle } from '../../components/ui';
import { dataSource } from '../../services';
import { addSavedLaunch, getSavedLaunchIds, removeSavedLaunch } from '../../services/auth';
import { orbitGroundTrack } from '../../services/orbits';
import { getAsteroids, asteroidPoint, asteroidTrack, type Asteroid } from '../../services/asteroids';
import { getAuroraForecast, type AuroraCell } from '../../services/aurora';
import { getSatelliteTracks, propagateSatellites, type SatellitePosition, type SatelliteTrack } from '../../services/satellites';
import { getMoonPoint } from '../../services/sky';
import { getIssPosition, type IssPosition } from '../../services/atlas';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';
import type { Launch } from '../../types';

const LAUNCH_COLOR = '#B86BFF';
const SATELLITE_COLOR = '#B6FF3B';
const ASTEROID_COLOR = '#FF8A3D';
const LAUNCH_REFRESH_MS = 5 * 60_000;
const FORECAST_REFRESH_MS = 20 * 60_000;
const TLE_REFRESH_MS = 60 * 60_000;
const LAYERS = [
  { key: 'iss', label: 'ISS' },
  { key: 'moon', label: 'Moon' },
  { key: 'asteroids', label: 'Asteroids' },
  { key: 'launches', label: 'Launch orbits' },
  { key: 'satellites', label: 'Satellites' },
  { key: 'aurora', label: 'Aurora' },
] as const;
const TABS = ['Coming launches', 'Incoming asteroids'];
type LayerKey = (typeof LAYERS)[number]['key'];

function LaunchCard({ launch, isTracked, busy, onSelect, onToggleTracked }: {
  launch: Launch;
  isTracked: boolean;
  busy: boolean;
  onSelect: () => void;
  onToggleTracked: () => void;
}) {
  return <Panel style={styles.launchCard}>
    <TouchableOpacity onPress={onSelect} activeOpacity={0.75} style={styles.launchDetails}>
      <View style={styles.launchRowTop}>
        <Text style={styles.selectedTitle}>{launch.mission}</Text>
        {launch.status === 'Scheduled' ? <Text style={styles.nextBadge}>{launch.status.toUpperCase()}</Text> : null}
      </View>
      <Text style={styles.selectedDescription}>{launch.rocket} · {launch.location}</Text>
      <Text style={styles.selectedDescription}>{launch.launchAt ? new Date(launch.launchAt).toLocaleString() : 'NET to be determined'} · Orbit: {launch.orbitName ?? 'Unknown'}{launch.station ? ` · To ${launch.station}` : ''}</Text>
      {launch.launchAt ? <View style={styles.launchCountdown}><Countdown target={launch.launchAt} compact /></View> : null}
    </TouchableOpacity>
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${isTracked ? 'Untrack' : 'Track'} ${launch.mission}`}
      disabled={busy}
      onPress={onToggleTracked}
      activeOpacity={0.8}
      style={[styles.trackButton, isTracked && styles.untrackButton, busy && styles.trackButtonBusy]}
    >
      <Ionicons name={isTracked ? 'checkmark-circle-outline' : 'bookmark-outline'} size={16} color={isTracked ? colors.text : colors.background} />
      <Text style={[styles.trackButtonText, isTracked && styles.untrackButtonText]}>{busy ? 'SAVING…' : isTracked ? 'UNTRACK LAUNCH' : 'TRACK LAUNCH'}</Text>
    </TouchableOpacity>
  </Panel>;
}

export default function MapScreen() {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const globeSize = Math.max(280, Math.min(width - 24, 420));
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [launchesUnavailable, setLaunchesUnavailable] = useState(false);
  const [trackedLaunchIds, setTrackedLaunchIds] = useState<string[]>([]);
  const [trackedLaunchesError, setTrackedLaunchesError] = useState<string | null>(null);
  const [pendingLaunchId, setPendingLaunchId] = useState<string | null>(null);
  const [selectedLaunchId, setSelectedLaunchId] = useState<string | null>(null);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ iss: true, moon: true, asteroids: true, launches: true, satellites: true, aurora: true });
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [asteroidsUnavailable, setAsteroidsUnavailable] = useState(false);
  const [auroraCells, setAuroraCells] = useState<AuroraCell[]>([]);
  const [auroraUnavailable, setAuroraUnavailable] = useState(false);
  const [satelliteTracks, setSatelliteTracks] = useState<SatelliteTrack[]>([]);
  const [satellitesUnavailable, setSatellitesUnavailable] = useState(false);
  const [satellites, setSatellites] = useState<SatellitePosition[]>([]);
  const [issPosition, setIssPosition] = useState<IssPosition | null>(null);
  const [issUnavailable, setIssUnavailable] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [tab, setTab] = useState(TABS[0]);
  const [clockNow, setClockNow] = useState(Date.now());
  useEffect(() => {
    if (!session) return;
    let active = true;
    getSavedLaunchIds(session.token)
      .then((ids) => {
        if (active) {
          setTrackedLaunchIds(ids);
          setTrackedLaunchesError(null);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to load tracked launches', error);
        if (active) setTrackedLaunchesError(error instanceof Error ? error.message : 'Could not load tracked launches.');
      });
    return () => { active = false; };
  }, [session]);
  useEffect(() => {
    let active = true;
    const loadLaunches = () => {
      dataSource.getLaunches()
        .then((items) => {
          if (active) {
            setLaunches(items);
            setLaunchesUnavailable(false);
          }
        })
        .catch((error) => {
          console.error('Failed to load launch schedule', error);
          if (active) setLaunchesUnavailable(true);
        });
    };
    loadLaunches();
    const timer = setInterval(loadLaunches, LAUNCH_REFRESH_MS);
    return () => { active = false; clearInterval(timer); };
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    const loadForecast = () => {
      getAuroraForecast()
        .then((forecast) => {
          if (active) {
            setAuroraCells(forecast.cells);
            setAuroraUnavailable(false);
          }
        })
        .catch((error) => {
          console.error('Failed to load aurora', error);
          if (active) setAuroraUnavailable(true);
        });
      getAsteroids()
        .then((items) => {
          if (active) {
            setAsteroids(items);
            setAsteroidsUnavailable(false);
          }
        })
        .catch((error) => {
          console.error('Failed to load asteroids', error);
          if (active) setAsteroidsUnavailable(true);
        });
    };
    loadForecast();
    const timer = setInterval(loadForecast, FORECAST_REFRESH_MS);
    return () => { active = false; clearInterval(timer); };
  }, []);
  useEffect(() => {
    let active = true;
    const loadSatelliteTracks = () => {
      getSatelliteTracks((tracks) => { if (active) setSatelliteTracks(tracks); })
        .then((tracks) => {
          if (active) {
            setSatelliteTracks(tracks);
            setSatellitesUnavailable(false);
          }
        })
        .catch((error) => {
          console.error('Failed to load satellites', error);
          if (active) setSatellitesUnavailable(true);
        });
    };
    loadSatelliteTracks();
    const timer = setInterval(loadSatelliteTracks, TLE_REFRESH_MS);
    return () => { active = false; clearInterval(timer); };
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
  const visibleLaunches = useMemo(() => launches.filter((launch) => {
    if (!launch.launchAt) return true;
    const launchTime = new Date(launch.launchAt).getTime();
    return !Number.isFinite(launchTime) || launchTime >= clockNow - 60 * 60 * 1000;
  }), [launches, clockNow]);
  const trackedLaunches = useMemo(
    () => trackedLaunchIds.flatMap((id) => {
      const launch = visibleLaunches.find((item) => item.id === id);
      return launch ? [launch] : [];
    }),
    [trackedLaunchIds, visibleLaunches],
  );
  const untrackedLaunches = useMemo(
    () => visibleLaunches.filter((launch) => !trackedLaunchIds.includes(launch.id)),
    [visibleLaunches, trackedLaunchIds],
  );
  const issNeeded = layers.iss || (layers.launches && visibleLaunches.some((launch) => launch.station === 'ISS'));
  const markers = useMemo(() => {
    const list: GlobeMarker[] = [];
    if (layers.launches) {
      const pads = visibleLaunches.filter((launch) => launch.padLatitude != null && launch.padLongitude != null);
      list.push(...pads
        .sort((a, b) => Number(a.id === selectedLaunchId) - Number(b.id === selectedLaunchId))
        .map((launch) => ({ id: `launch:${launch.id}`, latitude: launch.padLatitude as number, longitude: launch.padLongitude as number, color: LAUNCH_COLOR })));
    }
    if (issNeeded && issPosition) list.push({ id: 'iss', ...issPosition, color: '#35D07F', label: 'ISS' });
    return list;
  }, [visibleLaunches, layers, issNeeded, issPosition, selectedLaunchId]);
  const spaceBodies = useMemo<GlobeSpaceBody[]>(() => {
    const now = new Date(clockNow);
    const bodies: GlobeSpaceBody[] = [];
    if (layers.moon) bodies.push({ id: 'moon', label: 'Moon', color: '#E8E8F0', ...getMoonPoint(now) });
    if (layers.asteroids) {
      asteroids.forEach((asteroid) => {
        if (asteroid.orbit) bodies.push({ id: `asteroid:${asteroid.id}`, label: asteroid.name, color: ASTEROID_COLOR, ...asteroidPoint(asteroid.orbit, now), path: asteroidTrack(asteroid.orbit, now) });
      });
    }
    return bodies;
  }, [layers.moon, layers.asteroids, asteroids, clockNow]);
  const paths = useMemo<GlobePath[]>(() => {
    if (!layers.launches) return [];
    return visibleLaunches.flatMap((launch) => {
      const points = orbitGroundTrack(launch);
      return points ? [{ id: launch.id, points, color: LAUNCH_COLOR, highlighted: launch.id === selectedLaunchId }] : [];
    }).sort((a, b) => Number(a.highlighted) - Number(b.highlighted));
  }, [visibleLaunches, layers.launches, selectedLaunchId]);
  const toggleLayer = (key: LayerKey) => setLayers((current) => ({ ...current, [key]: !current[key] }));
  const toggleTrackedLaunch = async (launchId: string) => {
    if (!session || pendingLaunchId) return;
    setPendingLaunchId(launchId);
    setTrackedLaunchesError(null);
    try {
      if (trackedLaunchIds.includes(launchId)) {
        await removeSavedLaunch(session.token, launchId);
        setTrackedLaunchIds((ids) => ids.filter((id) => id !== launchId));
      } else {
        await addSavedLaunch(session.token, launchId);
        setTrackedLaunchIds((ids) => [launchId, ...ids]);
      }
    } catch (error) {
      console.error('Failed to update tracked launch', error);
      setTrackedLaunchesError(error instanceof Error ? error.message : 'Could not update tracked launch.');
    } finally {
      setPendingLaunchId(null);
    }
  };
  const handleSelect = (id: string) => {
    if (id.startsWith('launch:')) {
      setSelectedLaunchId(id.slice('launch:'.length));
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
          spaceBodies={spaceBodies}
          zoomable
          focusMarkerId="iss"
          selectedId={selectedLaunchId ? `launch:${selectedLaunchId}` : undefined}
          onSelect={handleSelect}
          onInteractionChange={(active) => setScrollEnabled(!active)}
          size={globeSize}
        />
      </View>
      <View style={styles.mapLegend}><View style={[styles.legendDot, { backgroundColor: ASTEROID_COLOR }]} /><Text style={styles.legendText}>asteroid</Text><View style={[styles.legendDot, { backgroundColor: LAUNCH_COLOR }]} /><Text style={styles.legendText}>launch</Text><View style={[styles.legendDot, { backgroundColor: SATELLITE_COLOR }]} /><Text style={styles.legendText}>satellite</Text><View style={[styles.legendDot, { backgroundColor: '#3DFF9A' }]} /><Text style={styles.legendText}>aurora</Text></View>
      <Text style={styles.mapFootnote}>
        {issUnavailable ? ' ISS position is temporarily unavailable.' : ' ISS position updates every 10 seconds.'}
        {' '}Launch orbits are estimated from pad location and target orbit type. Zoom out to see the Moon and asteroids at their real distance from Earth; dashed lines show each asteroid's calculated path relative to Earth (±10 days, two-body estimate).
        {satellites.length > 0 ? ` ${satellites.length} satellites shown (TLE data, SGP4-propagated, altitude exaggerated).` : ''}
        {satellitesUnavailable ? ' Satellite TLE data is temporarily unavailable.' : ''}
        {layers.aurora && auroraCells.length > 0 ? ' Aurora: NOAA SWPC OVATION 30-minute forecast (green = likely, purple = very likely).' : ''}
        {layers.aurora && auroraUnavailable ? ' NOAA aurora forecast is temporarily unavailable.' : ''}
      </Text>
    </Panel>
    {launchesUnavailable && layers.launches ? <Panel style={styles.dataNotice}>
      <Text style={styles.dataNoticeText}>Launch schedule is temporarily unavailable.</Text>
    </Panel> : null}
    <FilterChips items={TABS} selected={tab} onSelect={setTab} />
    {tab === TABS[0] ? <>
      <SectionTitle title="TRACKED LAUNCHES" />
      {trackedLaunchesError ? <Panel style={styles.dataNotice}>
        <Text style={styles.dataNoticeText}>Tracked launches unavailable: {trackedLaunchesError}</Text>
      </Panel> : null}
      {trackedLaunches.length === 0 ? <Panel style={styles.emptyCard}>
        <Text style={styles.selectedDescription}>No upcoming launches tracked yet.</Text>
      </Panel> : trackedLaunches.map((launch) => <LaunchCard
        key={`tracked:${launch.id}`}
        launch={launch}
        isTracked
        busy={pendingLaunchId === launch.id}
        onSelect={() => setSelectedLaunchId(launch.id === selectedLaunchId ? null : launch.id)}
        onToggleTracked={() => { void toggleTrackedLaunch(launch.id); }}
      />)}
      <SectionTitle title="UPCOMING LAUNCHES" />
      {untrackedLaunches.length === 0 ? <Panel style={styles.emptyCard}>
        <Text style={styles.selectedDescription}>{launchesUnavailable ? 'Launch schedule is temporarily unavailable.' : 'No upcoming launches reported by the provider.'}</Text>
      </Panel> : untrackedLaunches.map((launch) => <LaunchCard
        key={launch.id}
        launch={launch}
        isTracked={false}
        busy={pendingLaunchId === launch.id}
        onSelect={() => setSelectedLaunchId(launch.id === selectedLaunchId ? null : launch.id)}
        onToggleTracked={() => { void toggleTrackedLaunch(launch.id); }}
      />)}
    </> : null}
    {tab === TABS[1] ? <Panel style={styles.infoList}>
      {asteroidsUnavailable ? <Text style={styles.selectedDescription}>NASA NeoWs is temporarily unavailable.</Text> : asteroids.length === 0 ? <Text style={styles.selectedDescription}>No close approaches reported for this period by NASA NeoWs.</Text> : asteroids.map((a) => <View key={a.id} style={styles.infoRow}>
        <Text style={styles.selectedTitle}>{a.name}{a.hazardous ? ' · potentially hazardous' : ''}</Text>
        <Text style={styles.selectedDescription}>Closest approach {new Date(a.approachMs).toLocaleString()} at {a.missLd.toFixed(1)} lunar distances ({Math.round(a.missLd * 384400).toLocaleString()} km)</Text>
        <Text style={styles.selectedDescription}>Speed {(a.speedLdPerDay * 384400 / 86400).toFixed(1)} km/s · diameter up to {Math.round(a.diameterM)} m</Text>
      </View>)}
    </Panel> : null}
  </Page>;
}

const styles = StyleSheet.create({
  mapPanel: { padding: 0, backgroundColor: 'transparent', borderWidth: 0 },
  layerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  layerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  layerText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  launchRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  launchCard: { gap: 12 },
  launchDetails: { gap: 4 },
  trackButton: { minHeight: 40, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.cyan },
  untrackButton: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised },
  trackButtonBusy: { opacity: 0.65 },
  trackButtonText: { color: colors.background, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  untrackButtonText: { color: colors.text },
  emptyCard: { alignItems: 'center' },
  nextBadge: { color: LAUNCH_COLOR, fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  launchCountdown: { marginTop: 6, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 6, borderRadius: 10, backgroundColor: colors.surfaceRaised },
  mapArea: { justifyContent: 'center' },
  mapLegend: { marginTop: 14, paddingHorizontal: 14, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 7 },
  legendDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: colors.blue },
  legendText: { color: colors.muted, fontSize: 9 },
  mapFootnote: { color: colors.faint, fontSize: 9, lineHeight: 14, padding: 13, textAlign: 'center' },
  dataNotice: { padding: 12 },
  dataNoticeText: { color: colors.amber, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  selectedTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 5 },
  selectedDescription: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  infoList: { gap: 12 },
  infoRow: { gap: 4 },
});
