import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Countdown } from '../components/Countdown';
import { Badge, Page, PageHeader, Panel } from '../components/ui';
import { dataSource } from '../services';
import { launches as fallbackLaunches } from '../mock-data';
import type { Launch } from '../types';
import { colors } from '../theme';

export default function LaunchesScreen() {
  const [items, setItems] = useState<Launch[]>(fallbackLaunches);

  useEffect(() => {
    let active = true;
    dataSource.getLaunches().then((data) => {
      if (active && data.length > 0) {
        setItems(data);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const [next, ...rest] = items;
  return <Page>
    <PageHeader eyebrow="MISSION CONTROL" title="Launch schedule" subtitle="Upcoming rocket launches from The Space Devs." />
    {next ? (
      <Panel style={styles.nextPanel}>
        <View style={styles.nextHeader}>
          <Text style={styles.kicker}>NEXT UP</Text>
          <Badge tone="green">{next.status.toUpperCase()}</Badge>
        </View>
        <Text style={styles.mission} numberOfLines={2}>{next.mission}</Text>
        <Text style={styles.meta} numberOfLines={2}>{next.rocket}  ·  {next.provider}</Text>
        <View style={styles.rule} />
        <Countdown target={next.launchAt} />
        <View style={styles.details}>
          <Text style={[styles.meta, styles.detailLocation]} numberOfLines={2}>{next.location}</Text>
          <Text style={[styles.meta, styles.detailType]}>{next.missionType}</Text>
        </View>
      </Panel>
    ) : null}
    <Text style={styles.sectionTitle}>Upcoming missions</Text>
    {rest.map((launch) => <Panel key={launch.id} style={styles.launchCard}>
      <View style={styles.cardTop}>
        <View style={styles.missionIcon}><Text style={styles.rocketGlyph}>↑</Text></View>
        <View style={styles.cardCopy}>
          <Text style={styles.missionSmall} numberOfLines={1}>{launch.mission}</Text>
          <Text style={styles.meta} numberOfLines={1}>{launch.rocket} · {launch.provider}</Text>
        </View>
        <Badge tone="green">{launch.status.toUpperCase()}</Badge>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardLocation} numberOfLines={2}>{launch.location}</Text>
        <View style={styles.miniCount}><Countdown target={launch.launchAt} compact /></View>
      </View>
      <View style={styles.timeline}><Text style={styles.timelineDone}>ANNOUNCED</Text><View style={styles.timelineLine} /><Text style={styles.timelineFuture}>PREPARATION</Text><View style={styles.timelineLine} /><Text style={styles.timelineFuture}>LAUNCH</Text></View>
    </Panel>)}
    <Text style={styles.footnote}>Launch times and statuses provided by The Space Devs API (LL 2.3.0).</Text>
  </Page>;
}

const styles = StyleSheet.create({
  nextPanel: { gap: 11, backgroundColor: '#0E1B28', borderColor: '#274456', overflow: 'hidden' },
  nextHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: colors.cyan, fontSize: 9, letterSpacing: 1.4, fontWeight: '700' },
  mission: { color: colors.text, fontSize: 20, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  detailLocation: { flex: 1, marginRight: 10 },
  detailType: { textAlign: 'right', flexShrink: 0 },
  rule: { borderTopWidth: 1, borderColor: colors.border, marginVertical: 3 },
  details: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  launchCard: { gap: 12, paddingVertical: 15, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  missionIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#142A3C', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rocketGlyph: { color: colors.cyan, fontSize: 23, fontWeight: '300' },
  cardCopy: { flex: 1, gap: 4 },
  missionSmall: { color: colors.text, fontSize: 12, fontWeight: '600' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardLocation: { flex: 1, color: colors.muted, fontSize: 10, lineHeight: 15, marginRight: 6 },
  miniCount: { paddingVertical: 5, paddingHorizontal: 7, backgroundColor: colors.surfaceRaised, borderRadius: 12, flexShrink: 0 },
  timeline: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  timelineDone: { color: colors.cyan, fontSize: 7, fontWeight: '700' },
  timelineFuture: { color: colors.faint, fontSize: 7, fontWeight: '600' },
  timelineLine: { height: 1, flex: 1, backgroundColor: colors.border, marginHorizontal: 5 },
  footnote: { color: colors.faint, fontSize: 9, lineHeight: 14, textAlign: 'center' },
});
