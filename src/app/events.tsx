import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Page, PageHeader, Panel } from '../components/ui';
import { celestialEvents } from '../mock-data';
import { colors } from '../theme';

export default function EventsScreen() {
  return <Page>
    <PageHeader eyebrow="NIGHT SKY CALENDAR" title="Celestial events" subtitle="Dates and visibility are illustrative until an astronomy feed is connected." />
    {celestialEvents.map((event, index) => <Panel key={event.id} style={styles.eventCard}>
      <View style={styles.timeline}><View style={[styles.timelineDot, index === 0 && styles.firstDot]} />{index < celestialEvents.length - 1 ? <View style={styles.timelineLine} /> : null}</View>
      <View style={styles.eventCopy}>
        <View style={styles.eventHeader}><Badge tone={index % 3 === 0 ? 'blue' : 'muted'}>{event.kind.toUpperCase()}</Badge><Text style={styles.date}>{new Date(event.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text></View>
        <Text style={styles.eventName}>{event.name}</Text>
        <Text style={styles.eventDescription}>{event.description}</Text>
        <View style={styles.metaLine}><Ionicons name="location-outline" size={13} color={colors.cyan} /><Text style={styles.visibility}>{event.visibility}</Text></View>
      </View>
    </Panel>)}
    <Text style={styles.footnote}>Sample event dates use device time for preview. Verify local visibility and times before observing.</Text>
  </Page>;
}

const styles = StyleSheet.create({
  eventCard: { flexDirection: 'row', gap: 12, padding: 13 },
  timeline: { width: 13, alignItems: 'center' },
  timelineDot: { marginTop: 4, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.faint, zIndex: 1 },
  firstDot: { backgroundColor: colors.cyan },
  timelineLine: { position: 'absolute', top: 13, bottom: -18, width: 1, backgroundColor: colors.border },
  eventCopy: { flex: 1, gap: 7 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: colors.cyan, fontSize: 10, fontWeight: '700' },
  eventName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  eventDescription: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  visibility: { color: colors.faint, fontSize: 9 },
  footnote: { color: colors.faint, fontSize: 9, lineHeight: 14, textAlign: 'center' },
});
