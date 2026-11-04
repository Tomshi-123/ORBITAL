import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Page, PageHeader, Panel } from '../components/ui';
import { dataSource } from '../services';
import { getCurrentCoordinates, type Coordinates } from '../services/location';
import type { CelestialEvent } from '../types';
import { colors } from '../theme';

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to load astronomical data.';
}

export default function EventsScreen() {
  const [events, setEvents] = useState<CelestialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    let coordinates: Coordinates | undefined;
    try {
      coordinates = await getCurrentCoordinates();
      setLocationNotice(null);
    } catch (locationError) {
      setLocationNotice(errorText(locationError));
    }

    try {
      setEvents(await dataSource.getCelestialEvents(coordinates));
    } catch (eventError) {
      setError(errorText(eventError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  return <Page>
    <PageHeader
      eyebrow="NIGHT SKY CALENDAR"
      title="Celestial events"
      subtitle="Upcoming Moon phases, eclipses and seasonal markers calculated from astronomical ephemerides."
    />
    {loading ? <Panel style={styles.stateCard}>
      <ActivityIndicator color={colors.cyan} />
      <Text style={styles.stateText}>Calculating upcoming events…</Text>
    </Panel> : null}
    {error ? <Panel style={styles.stateCard}>
      <Text style={styles.stateText}>{error}</Text>
      <TouchableOpacity onPress={() => { void loadEvents(); }} accessibilityRole="button">
        <Text style={styles.retryText}>RETRY</Text>
      </TouchableOpacity>
    </Panel> : null}
    {locationNotice ? <Panel style={styles.locationNotice}>
      <Ionicons name="location-outline" size={16} color={colors.amber} />
      <Text style={styles.noticeText}>{locationNotice} Showing global event times and visibility information.</Text>
    </Panel> : null}
    {!loading && !error && events.length === 0 ? <Panel style={styles.stateCard}>
      <Text style={styles.stateText}>No upcoming events in the calculation window.</Text>
    </Panel> : null}
    {events.map((event, index) => <Panel key={event.id} style={styles.eventCard}>
      <View style={styles.timeline}>
        <View style={[styles.timelineDot, index === 0 && styles.firstDot]} />
        {index < events.length - 1 ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={styles.eventCopy}>
        <View style={styles.eventHeader}>
          <Badge tone={event.kind === 'Solar eclipse' || event.kind === 'Lunar eclipse' ? 'blue' : 'muted'}>{event.kind.toUpperCase()}</Badge>
          <Text style={styles.date}>{new Date(event.date).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}</Text>
        </View>
        <Text style={styles.eventName}>{event.name}</Text>
        <Text style={styles.eventDescription}>{event.description}</Text>
        <View style={styles.metaLine}>
          <Ionicons name="location-outline" size={13} color={colors.cyan} />
          <Text style={styles.visibility}>{event.visibility}</Text>
        </View>
      </View>
    </Panel>)}
    <Text style={styles.footnote}>Times are calculated in UTC and converted to your device time. Actual viewing depends on local horizon and weather.</Text>
  </Page>;
}

const styles = StyleSheet.create({
  eventCard: { flexDirection: 'row', gap: 12, padding: 13 },
  timeline: { width: 13, alignItems: 'center' },
  timelineDot: { marginTop: 4, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.faint, zIndex: 1 },
  firstDot: { backgroundColor: colors.cyan },
  timelineLine: { position: 'absolute', top: 13, bottom: -18, width: 1, backgroundColor: colors.border },
  eventCopy: { flex: 1, gap: 7 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  date: { color: colors.cyan, fontSize: 9, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  eventName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  eventDescription: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  visibility: { color: colors.faint, fontSize: 9, flex: 1 },
  footnote: { color: colors.faint, fontSize: 9, lineHeight: 14, textAlign: 'center' },
  stateCard: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 },
  stateText: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  retryText: { color: colors.cyan, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  locationNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  noticeText: { flex: 1, color: colors.amber, fontSize: 10, lineHeight: 15 },
});
