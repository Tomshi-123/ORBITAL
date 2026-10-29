import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Page, PageHeader, Panel, SectionTitle, StatCard } from '../../components/ui';
import { getMissionControl, REFRESH_MS, type MissionControlData } from '../../services/missions';
import { colors } from '../../theme';

type SectionKey = keyof MissionControlData['errors'];

function SectionState({ error, empty, emptyText, onRetry }: { error?: string; empty: boolean; emptyText: string; onRetry: () => void }) {
  if (error) {
    return <Panel style={styles.stateCard}>
      <Ionicons name="cloud-offline-outline" size={22} color={colors.red} />
      <Text style={styles.stateTitle}>DATA LINK UNAVAILABLE</Text>
      <Text style={styles.stateText}>{error}</Text>
      <TouchableOpacity onPress={onRetry} accessibilityRole="button"><Text style={styles.retryText}>RETRY</Text></TouchableOpacity>
    </Panel>;
  }
  if (empty) return <Panel style={styles.stateCard}><Text style={styles.stateText}>{emptyText}</Text></Panel>;
  return null;
}

function Field({ label, value }: { label: string; value: string }) {
  return <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value}</Text>
  </View>;
}

export default function ActiveMissionsScreen() {
  const [data, setData] = useState<MissionControlData | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const result = await getMissionControl();
    if (mounted.current) {
      setData(result);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    const timer = setInterval(() => { void load(); }, REFRESH_MS);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [load]);

  const retry = () => { setLoading(true); void load(); };
  const err = (key: SectionKey) => data?.errors[key];
  const crafts = data?.people ? Object.entries(data.people.byCraft).map(([craft, count]) => `${craft} ${count}`).join(' · ') : '';
  const occupiedStations = data?.stations?.filter((station) => station.occupied).length;

  return <Page>
    <PageHeader eyebrow="MISSION CONTROL" title="ACTIVE MISSIONS" subtitle="Live overview of human spaceflight operations." />

    {loading && !data ? <Panel style={styles.stateCard}>
      <ActivityIndicator color={colors.cyan} />
      <Text style={styles.stateText}>ESTABLISHING DATA LINK…</Text>
    </Panel> : null}

    {data ? <>
      <View style={styles.statRow}>
        <StatCard label="People In Space" value={data.people ? String(data.people.total) : '—'} caption={err('people') ?? (crafts || 'Currently in orbit')} icon="people-outline" />
        <StatCard label="Active Stations" value={occupiedStations != null ? String(occupiedStations) : '—'} caption={err('stations') ? 'Unavailable' : 'Occupied'} icon="business-outline" />
        <StatCard label="Active Spacecraft" value={data.spacecraft ? String(data.spacecraft.length) : '—'} caption={err('spacecraft') ? 'Unavailable' : 'Currently in orbit'} icon="rocket-outline" />
      </View>

      <SectionTitle title="CURRENT CREWS" />
      <SectionState error={err('missions')} empty={data.missions?.length === 0} emptyText="No active crewed missions reported." onRetry={retry} />
      {data.missions?.map((mission) => <Panel key={mission.id} style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{mission.name}</Text>
          <Badge tone="green">{mission.status.toUpperCase()}</Badge>
        </View>
        <Field label="CREW" value={`${mission.crewCount}`} />
        <Field label="DESTINATION" value={mission.destination} />
        <Field label="SPACECRAFT" value={mission.spacecraft.length ? mission.spacecraft.join(', ') : 'Not available'} />
        <View style={styles.crewList}>
          {mission.crew.map((member) => <Text key={member.id} style={styles.crewMember}>
            {member.name} <Text style={styles.crewRole}>· {member.role}</Text>
          </Text>)}
        </View>
      </Panel>)}

      <SectionTitle title="ACTIVE SPACECRAFT" />
      <SectionState error={err('spacecraft')} empty={data.spacecraft?.length === 0} emptyText="No spacecraft currently in space." onRetry={retry} />
      {data.spacecraft?.map((craft) => <Panel key={craft.id} style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{craft.name}</Text>
          <Badge tone={craft.status === 'Active' ? 'green' : 'muted'}>{craft.status.toUpperCase()}</Badge>
        </View>
        <Field label="TYPE" value={craft.type} />
        <Field label="AGENCY" value={craft.agency} />
        <Field label="CURRENT MISSION" value={craft.mission} />
        {craft.timeInSpace ? <Field label="TIME IN SPACE" value={craft.timeInSpace} /> : null}
      </Panel>)}

      <SectionTitle title="ACTIVE STATIONS" />
      <SectionState error={err('stations')} empty={data.stations?.length === 0} emptyText="No operational stations reported." onRetry={retry} />
      {data.stations?.map((station) => <Panel key={station.id} style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{station.name}</Text>
          <Badge tone="green">{station.status.toUpperCase()}</Badge>
        </View>
        <Field label="ORBIT" value={station.orbit} />
        <Field label="CREW" value={station.occupied ? String(station.crewCount) : 'Unoccupied'} />
      </Panel>)}
    </> : null}

    <TouchableOpacity onPress={() => router.push('/iss-live')} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Live camera">
      <Panel style={styles.cameraCard}>
        <View style={styles.cameraIcon}><Ionicons name="videocam-outline" size={22} color={colors.cyan} /></View>
        <View style={styles.cameraCopy}>
          <Text style={styles.cardTitle}>LIVE CAMERA</Text>
          <Text style={styles.stateText}>Watch live Earth footage from cameras aboard the International Space Station.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.cyan} />
      </Panel>
    </TouchableOpacity>

    {data ? <Text style={styles.footnote}>
      Sources: Open Notify and Launch Library 2. Refreshes every 5 minutes · Last update {new Date(data.updatedAt).toLocaleTimeString()}
    </Text> : null}
  </Page>;
}

const styles = StyleSheet.create({
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { gap: 9 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700', letterSpacing: 0.4 },
  field: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  fieldLabel: { color: colors.faint, fontSize: 9, fontWeight: '700', letterSpacing: 1.1, paddingTop: 2 },
  fieldValue: { flexShrink: 1, color: colors.text, fontSize: 12, fontWeight: '500', textAlign: 'right' },
  crewList: { gap: 4, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  crewMember: { color: colors.text, fontSize: 11 },
  crewRole: { color: colors.muted },
  stateCard: { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18 },
  stateTitle: { color: colors.red, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  stateText: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  retryText: { color: colors.cyan, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  cameraCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(20, 42, 58, 0.4)' },
  cameraIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#142B3A', alignItems: 'center', justifyContent: 'center' },
  cameraCopy: { flex: 1, gap: 4 },
  footnote: { color: colors.faint, fontSize: 9, lineHeight: 14, textAlign: 'center' },
});
