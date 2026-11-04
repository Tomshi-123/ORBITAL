import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Page, PageHeader, Panel } from '../components/ui';
import { getCurrentCoordinates, type Coordinates } from '../services/location';
import { getSkyObjects } from '../services/sky';
import type { SkyObject } from '../services/sky';
import { colors } from '../theme';

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to determine your location.';
}

function magnitudeText(magnitude: number) {
  return `MAG ${magnitude.toFixed(1)}`;
}

function SkyMarker({ object }: { object: SkyObject }) {
  return <View style={[
    styles.marker,
    {
      left: `${(object.azimuth / 360) * 100}%`,
      top: `${100 - (object.altitude / 90) * 100}%`,
    },
  ]}>
    <View style={styles.starMark} />
    <Text style={styles.starName}>{object.name.toUpperCase()}</Text>
  </View>;
}

export default function SkyViewScreen() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const loadLocation = useCallback(async () => {
    setLoading(true);
    setLocationError(null);
    try {
      setCoordinates(await getCurrentCoordinates());
    } catch (error) {
      setLocationError(errorText(error));
      setCoordinates(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLocation();
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [loadLocation]);

  const objects = useMemo(
    () => coordinates ? getSkyObjects(coordinates, new Date(now)) : [],
    [coordinates, now],
  );

  return <Page>
    <PageHeader
      eyebrow="NIGHT-SKY GUIDE"
      title="Sky view"
      subtitle="Current calculated positions for your location. North is at the top of the chart."
    />
    {loading ? <Panel style={styles.stateCard}>
      <ActivityIndicator color={colors.cyan} />
      <Text style={styles.stateText}>Requesting location…</Text>
    </Panel> : null}
    {locationError ? <Panel style={styles.stateCard}>
      <View style={styles.permissionIcon}><Ionicons name="location-outline" size={21} color={colors.cyan} /></View>
      <Text style={styles.permissionTitle}>Location unavailable</Text>
      <Text style={styles.stateText}>{locationError}</Text>
      <TouchableOpacity onPress={() => { void loadLocation(); }} accessibilityRole="button">
        <Text style={styles.retryText}>TRY AGAIN</Text>
      </TouchableOpacity>
    </Panel> : null}
    {coordinates ? <>
      <View style={styles.controls}>
        <Badge tone="green">EPHEMERIS · LIVE TIME</Badge>
        <Text style={styles.updated}>UPDATED {new Date(now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
      </View>
      <Panel style={styles.locationPanel}>
        <Ionicons name="location-outline" size={16} color={colors.cyan} />
        <Text style={styles.locationText}>
          {coordinates.latitude.toFixed(2)}°, {coordinates.longitude.toFixed(2)}°
        </Text>
      </Panel>
      <View style={styles.sky}>
        <Text style={[styles.direction, { left: '50%', top: 12 }]}>N</Text>
        <Text style={[styles.direction, { right: 12, top: '50%' }]}>E</Text>
        <Text style={[styles.direction, { left: '50%', bottom: 12 }]}>S</Text>
        <Text style={[styles.direction, { left: 12, top: '50%' }]}>W</Text>
        <View style={styles.horizon} />
        {objects.map((object) => <SkyMarker key={object.id} object={object} />)}
      </View>
      <Text style={styles.section}>Above the astronomical horizon</Text>
      {objects.length === 0 ? <Panel style={styles.stateCard}>
        <Text style={styles.stateText}>No catalogued planets or bright stars are above the horizon at this time.</Text>
      </Panel> : objects.map((object) => <Panel key={object.id} style={styles.objectCard}>
        <View style={styles.objectSymbol}>
          <Ionicons name={object.kind === 'Planet' || object.kind === 'Natural satellite' ? 'planet-outline' : 'star-outline'} size={18} color={colors.cyan} />
        </View>
        <View style={styles.objectCopy}>
          <Text style={styles.objectName}>{object.name.toUpperCase()}</Text>
          <Text style={styles.objectDetails}>{object.kind} · {object.detail} · Az {object.azimuth.toFixed(0)}° / Alt {object.altitude.toFixed(0)}°</Text>
        </View>
        <Text style={styles.magnitude}>{magnitudeText(object.magnitude)}</Text>
      </Panel>)}
      <Text style={styles.footnote}>Positions use your device location and current time. They are astronomical calculations, not a weather or naked-eye visibility forecast; clouds, daylight, light pollution and obstructions are not included.</Text>
    </> : null}
  </Page>;
}

const styles = StyleSheet.create({
  stateCard: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 },
  stateText: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  retryText: { color: colors.cyan, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  permissionIcon: { width: 41, height: 41, borderRadius: 14, backgroundColor: '#142B3A', alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { color: colors.text, fontSize: 12, fontWeight: '600' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  updated: { color: colors.faint, fontSize: 8, fontWeight: '700', letterSpacing: 0.6 },
  locationPanel: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11 },
  locationText: { color: colors.muted, fontSize: 10 },
  sky: { height: 360, borderRadius: 23, borderWidth: 1, borderColor: '#203849', backgroundColor: '#07121F', overflow: 'hidden' },
  horizon: { position: 'absolute', left: -45, right: -45, bottom: -90, height: 185, borderTopWidth: 1, borderColor: '#315D68', borderRadius: 190, backgroundColor: '#0B2025' },
  direction: { position: 'absolute', zIndex: 2, color: '#8CA8B6', fontSize: 8, fontWeight: '700', transform: [{ translateX: -4 }] },
  marker: { position: 'absolute', alignItems: 'center', gap: 4, transform: [{ translateX: -18 }, { translateY: -10 }] },
  starMark: { width: 7, height: 7, borderRadius: 5, backgroundColor: '#D8F3FF', shadowColor: colors.cyan, shadowOpacity: 0.8, shadowRadius: 8 },
  starName: { color: colors.text, fontSize: 8, fontWeight: '700', letterSpacing: 0.6 },
  section: { color: colors.text, fontSize: 16, fontWeight: '600' },
  objectCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  objectSymbol: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#142A3A', alignItems: 'center', justifyContent: 'center' },
  objectCopy: { flex: 1, gap: 4 },
  objectName: { color: colors.text, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  objectDetails: { color: colors.muted, fontSize: 9, lineHeight: 14 },
  magnitude: { color: colors.cyan, fontSize: 9, fontWeight: '600' },
  footnote: { color: colors.faint, fontSize: 9, lineHeight: 14, textAlign: 'center' },
});
