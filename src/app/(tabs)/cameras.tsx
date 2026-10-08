import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Page, PageHeader, Panel } from '../../components/ui';
import { cameras } from '../../mock-data';
import { colors } from '../../theme';

export default function CamerasScreen() {
  return <Page>
    <PageHeader eyebrow="OBSERVATORIES & STREAMS" title="Live cam" subtitle="Curated source slots ready for verified livestream URLs." />
    <Panel style={styles.emptyState}><View style={styles.emptyIcon}><Ionicons name="videocam-outline" size={23} color={colors.cyan} /></View><Text style={styles.emptyTitle}>No live streams connected</Text><Text style={styles.emptyText}>This foundation avoids broken embeds. Add a stream URL and attribution through the camera data source when ready.</Text></Panel>
    <Text style={styles.sectionTitle}>Camera sources</Text>
    {cameras.map((camera) => <Panel key={camera.id} style={styles.cameraCard}>
      <View style={styles.preview}><Ionicons name="videocam-off-outline" size={21} color={colors.faint} /><Text style={styles.previewText}>PREVIEW UNAVAILABLE</Text></View>
      <View style={styles.cardBody}><View style={styles.nameRow}><Text style={styles.cameraName}>{camera.name}</Text><View style={styles.offline}><View style={styles.offlineDot} /><Text style={styles.offlineText}>OFFLINE</Text></View></View><Text style={styles.meta}>{camera.category}  ·  {camera.location}</Text><Text style={styles.source}>Source slot: {camera.source}</Text></View>
    </Panel>)}
  </Page>;
}

const styles = StyleSheet.create({
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 21 },
  emptyIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#142A3A', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
  emptyText: { color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: 'center', maxWidth: 280 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  cameraCard: { padding: 0, overflow: 'hidden' },
  preview: { height: 120, backgroundColor: '#0A111A', alignItems: 'center', justifyContent: 'center', gap: 8, borderBottomWidth: 1, borderColor: colors.border },
  previewText: { color: colors.faint, fontSize: 8, letterSpacing: 1.3, fontWeight: '700' },
  cardBody: { padding: 13, gap: 6 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cameraName: { color: colors.text, fontSize: 12, fontWeight: '600', flex: 1 },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  offlineDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.faint },
  offlineText: { color: colors.faint, fontSize: 8, letterSpacing: 0.7, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 9 },
  source: { color: colors.faint, fontSize: 9 },
});
