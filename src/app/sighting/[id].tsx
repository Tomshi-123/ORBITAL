import { useLocalSearchParams, router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, InfoRow, Page, PageHeader, Panel } from '../../components/ui';
import { useEffect, useState } from 'react';
import { dataSource } from '../../services';
import type { Sighting } from '../../types';
import { colors } from '../../theme';

export default function SightingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<Sighting | null | undefined>(undefined);
  useEffect(() => { dataSource.getSightings().then((list) => setReport(list.find((item) => item.id === id) ?? null)); }, [id]);
  if (report === undefined) return <Page><PageHeader title="Loading" action={{ icon: 'close', onPress: () => router.back() }} /></Page>;
  if (!report) return <Page><PageHeader title="Report unavailable" subtitle="This report could not be found." action={{ icon: 'close', onPress: () => router.back() }} /></Page>;
  const tone = report.confidence === 'High' ? 'green' : report.confidence === 'Medium' ? 'amber' : 'muted';
  return <Page>
    <PageHeader eyebrow="REPORTED OBSERVATION" title="Report details" action={{ icon: 'close', onPress: () => router.back() }} />
    <Panel style={styles.hero}><View style={styles.heroTop}><Badge tone={tone}>{report.confidence.toUpperCase()} CONFIDENCE</Badge><Text style={styles.sample}>UAP ATLAS</Text></View><Text style={styles.location}>{report.location}</Text><Text style={styles.country}>{report.country}</Text><View style={styles.locationMap}><View style={styles.target}><View style={styles.targetCore} /></View><Text style={styles.mapCaption}>{report.latitude.toFixed(2)}°, {report.longitude.toFixed(2)}°</Text></View></Panel>
    <Panel style={styles.details}>
      <InfoRow label="Reported object" value={report.objectType} />
      <InfoRow label="Reported at" value={new Date(report.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} />
      <InfoRow label="Duration" value={report.duration} />
      <InfoRow label="Source" value={report.source} />
      <InfoRow label="Source reliability" value="Not independently assessed" />
    </Panel>
    <Panel style={styles.description}><Text style={styles.label}>REPORT DESCRIPTION</Text><Text style={styles.body}>{report.description}</Text><Text style={styles.reportedBy}>Original report: {report.source}</Text></Panel>
    <View style={styles.notice}><Ionicons name="information-circle-outline" size={18} color={colors.amber} /><Text style={styles.noticeText}>A submitted sighting is not confirmation of an unknown craft or phenomenon.</Text></View>
  </Page>;
}

const styles = StyleSheet.create({
  hero: { gap: 8, padding: 17, backgroundColor: '#0D1C29' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sample: { color: colors.faint, fontSize: 8, letterSpacing: 1, fontWeight: '700' },
  location: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 3 },
  country: { color: colors.muted, fontSize: 11 },
  locationMap: { height: 116, borderRadius: 16, marginTop: 8, backgroundColor: '#091520', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  target: { height: 37, width: 37, borderRadius: 20, borderWidth: 1, borderColor: `${colors.cyan}70`, alignItems: 'center', justifyContent: 'center' },
  targetCore: { height: 7, width: 7, borderRadius: 4, backgroundColor: colors.cyan },
  mapCaption: { color: colors.muted, fontSize: 9, marginTop: 8 },
  details: { paddingTop: 4, paddingBottom: 4 },
  description: { gap: 9 },
  label: { color: colors.cyan, fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  body: { color: colors.text, fontSize: 12, lineHeight: 19 },
  reportedBy: { color: colors.faint, fontSize: 9, lineHeight: 14 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingHorizontal: 4 },
  noticeText: { flex: 1, color: colors.amber, fontSize: 9, lineHeight: 14 },
});
