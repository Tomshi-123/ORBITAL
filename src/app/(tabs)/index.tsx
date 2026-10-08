import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Countdown } from '../../components/Countdown';
import { GlobePreview } from '../../components/GlobePreview';
import { ActionButton, Badge, Page, PageHeader, Panel, SectionTitle, SightingRow, StatCard } from '../../components/ui';
import { dataSource } from '../../services';
import { colors } from '../../theme';
import { markerColor } from '../../services/uapAtlas';
import type { Launch, Sighting } from '../../types';

export default function OverviewScreen() {
  const [recent, setRecent] = useState<Sighting[]>([]);
  const [allReports, setAllReports] = useState<Sighting[]>([]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [topLaunch, setTopLaunch] = useState<Launch | null>(null);

  const globeMarkers = useMemo(() => allReports.slice(0, 100).map((r) => ({ id: r.id, latitude: r.latitude, longitude: r.longitude, color: markerColor(r.timestamp) })), [allReports]);
  useEffect(() => {
    let active = true;
    Promise.all([dataSource.getSightings(), dataSource.getLaunches()]).then(([reports, upcoming]) => {
      if (!active) return;
      setRecent(reports.slice(0, 3));
      setAllReports(reports);
      setTopLaunch(upcoming[0] ?? null);
    });
    return () => { active = false; };
  }, []);

  return <Page scrollEnabled={scrollEnabled}>
    <PageHeader eyebrow="ORBITAL / OBSERVATORY" title="Above us, right now." subtitle="A clearer view of the moving sky." action={{ icon: 'search-outline', onPress: () => router.push('/search') }} />
    <View style={styles.hero}>
      <View style={styles.heroOrbits}><View style={styles.orbitOne} /><View style={styles.orbitTwo} /><View style={styles.heroCore}><Ionicons name="planet-outline" size={37} color={colors.cyan} /></View></View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroKicker}>THE SKY IS ALWAYS MOVING</Text>
        <Text style={styles.heroTitle}>Explore what's{'\n'}happening above us.</Text>
        <Text style={styles.heroBody}>Space, launches and reported observations — in one place.</Text>
        <TouchableOpacity style={styles.heroLink} onPress={() => router.push('/map')}>
          <Text style={styles.heroLinkText}>Explore live map</Text><Ionicons name="arrow-forward" size={15} color={colors.cyan} />
        </TouchableOpacity>
      </View>
    </View>
    <View style={styles.stats}>
      <StatCard label="Reports · 24H" value={String(allReports.filter((r) => Date.now() - new Date(r.timestamp).getTime() < 86_400_000).length)} caption="UAP Atlas" icon="radio-outline" />
      <StatCard label="Upcoming launches" value="08" caption="Demo schedule" icon="rocket-outline" />
    </View>
    <GlobePreview markers={globeMarkers} onInteractionChange={(active) => setScrollEnabled(!active)} />
    {topLaunch ? <Panel style={styles.launchPanel}>
      <View style={styles.launchHeader}><View><Text style={styles.smallLabel}>NEXT LAUNCH · SAMPLE SCHEDULE</Text><Text style={styles.launchName}>{topLaunch.mission}</Text></View><Badge tone="green">SCHEDULED</Badge></View>
      <Text style={styles.launchMeta}>{topLaunch.rocket}  ·  {topLaunch.location}</Text>
      <View style={styles.countdownWrap}><Countdown target={topLaunch.launchAt} compact /></View>
      <ActionButton label="View launch schedule" icon="arrow-forward" secondary onPress={() => router.push('/launches')} />
    </Panel> : null}
    <View style={styles.sectionHead}><SectionTitle title="Latest reports" action="All reports" onAction={() => router.push('/map')} /></View>
    <Panel style={styles.listPanel}>{recent.map((item) => <SightingRow key={item.id} sighting={item} />)}</Panel>
    <Text style={styles.disclaimer}>Reports are submitted observations, not independently confirmed events. Data: NUFORC via The UAP Atlas.</Text>
  </Page>;
}

const styles = StyleSheet.create({
  hero: { minHeight: 255, borderRadius: 24, overflow: 'hidden', backgroundColor: '#0C1B2A', borderWidth: 1, borderColor: '#1D3548', flexDirection: 'row', alignItems: 'center', padding: 18 },
  heroCopy: { flex: 1, zIndex: 1 },
  heroKicker: { color: colors.cyan, fontSize: 9, fontWeight: '700', letterSpacing: 1.7 },
  heroTitle: { color: colors.text, fontSize: 25, lineHeight: 31, fontWeight: '700', marginTop: 13, letterSpacing: -0.6 },
  heroBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 8, maxWidth: 205 },
  heroLink: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 16 },
  heroLinkText: { color: colors.cyan, fontSize: 11, fontWeight: '700' },
  heroOrbits: { position: 'absolute', right: -56, top: -5, width: 225, height: 255, alignItems: 'center', justifyContent: 'center', opacity: 0.75 },
  orbitOne: { position: 'absolute', width: 160, height: 160, borderRadius: 90, borderWidth: 1, borderColor: '#31546A', transform: [{ rotate: '-26deg' }, { scaleX: 1.5 }] },
  orbitTwo: { position: 'absolute', width: 130, height: 130, borderRadius: 70, borderWidth: 1, borderColor: '#31546A', transform: [{ rotate: '28deg' }, { scaleX: 1.6 }] },
  heroCore: { width: 93, height: 93, borderRadius: 48, borderWidth: 1, borderColor: '#2B7084', backgroundColor: '#103248', justifyContent: 'center', alignItems: 'center', shadowColor: colors.cyan, shadowOpacity: 0.3, shadowRadius: 20 },
  stats: { flexDirection: 'row', gap: 10 },
  launchPanel: { gap: 11 },
  launchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  smallLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  launchName: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 5 },
  launchMeta: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  countdownWrap: { paddingVertical: 5 },
  sectionHead: { marginTop: 0 },
  listPanel: { paddingTop: 4, paddingBottom: 4 },
  storyPanel: { gap: 9 },
  storyArtwork: { height: 104, margin: -16, marginBottom: 4, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#10273A', justifyContent: 'center', alignItems: 'center', gap: 7 },
  storySource: { color: '#89B8CC', fontSize: 8, letterSpacing: 1.3, fontWeight: '700' },
  storyTitle: { color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  readLink: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 4 },
  disclaimer: { color: colors.faint, fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 12 },
});
