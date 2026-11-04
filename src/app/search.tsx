import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Page, PageHeader, Panel } from '../components/ui';
import { dataSource } from '../services';
import type { CelestialEvent, Launch } from '../types';
import { colors } from '../theme';

type Result = { id: string; title: string; detail: string; kind: string; route: string };

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Data source unavailable.';
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [launchesList, setLaunchesList] = useState<Launch[]>([]);
  const [events, setEvents] = useState<CelestialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const errors: string[] = [];
    Promise.all([
      dataSource.getLaunches()
        .then((items) => { if (active) setLaunchesList(items); })
        .catch((error: unknown) => { errors.push(`Launches: ${errorText(error)}`); }),
      dataSource.getCelestialEvents()
        .then((items) => { if (active) setEvents(items); })
        .catch((error: unknown) => { errors.push(`Sky events: ${errorText(error)}`); }),
    ]).finally(() => {
      if (active) {
        setLoadErrors(errors);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const results = useMemo<Result[]>(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return [
      ...launchesList.filter((item) => `${item.mission} ${item.rocket} ${item.provider}`.toLowerCase().includes(needle)).map((item) => ({ id: item.id, title: item.mission, detail: `${item.rocket} · ${item.provider}`, kind: 'Launch', route: '/map' })),
      ...events.filter((item) => `${item.name} ${item.kind} ${item.visibility}`.toLowerCase().includes(needle)).map((item) => ({ id: item.id, title: item.name, detail: item.visibility, kind: 'Sky event', route: '/events' })),
    ];
  }, [query, launchesList, events]);

  return <Page>
    <PageHeader eyebrow="DISCOVERY" title="Search" subtitle="Search launches and sky events." />
    <View style={styles.searchBox}><Ionicons name="search-outline" size={19} color={colors.cyan} /><TextInput autoFocus placeholder="Try “Jupiter”, “Phoenix” or “launch”" placeholderTextColor={colors.faint} value={query} onChangeText={setQuery} style={styles.input} returnKeyType="search" /><TouchableOpacity onPress={() => setQuery('')}><Ionicons name="close-circle" size={17} color={colors.faint} /></TouchableOpacity></View>
    {!query.trim() ? <Panel style={styles.empty}>
      <Ionicons name="sparkles-outline" size={24} color={colors.cyan} />
      <Text style={styles.emptyTitle}>Search current data</Text>
      <Text style={styles.emptyText}>Launch schedules come from live data sources. Sky events are calculated from astronomical ephemerides.</Text>
    </Panel> : null}
    {loading && query.trim() ? <Panel style={styles.empty}><Text style={styles.emptyText}>Loading live data…</Text></Panel> : null}
    {!loading && query.trim() && results.length > 0 ? <ScrollView keyboardShouldPersistTaps="handled">
      <Text style={styles.resultCount}>{results.length} RESULTS</Text>
      {results.map((result) => <TouchableOpacity key={`${result.kind}-${result.id}`} onPress={() => router.push(result.route)} activeOpacity={0.75}>
        <Panel style={styles.result}><View style={styles.resultCopy}><Text style={styles.resultTitle}>{result.title}</Text><Text style={styles.resultDetail}>{result.detail}</Text></View><Badge tone="blue">{result.kind.toUpperCase()}</Badge></Panel>
      </TouchableOpacity>)}
    </ScrollView> : null}
    {!loading && query.trim() && results.length === 0 ? <Panel style={styles.empty}>
      <Text style={styles.emptyTitle}>No matching results</Text>
      <Text style={styles.emptyText}>Try a different mission or object name.</Text>
    </Panel> : null}
    {loadErrors.map((message) => <Panel key={message} style={styles.error}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.red} />
      <Text style={styles.errorText}>{message}</Text>
    </Panel>)}
  </Page>;
}

const styles = StyleSheet.create({
  searchBox: { height: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, color: colors.text, fontSize: 12, paddingVertical: 0 },
  empty: { minHeight: 165, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  emptyTitle: { color: colors.text, fontSize: 13, fontWeight: '600' },
  emptyText: { color: colors.muted, fontSize: 10, textAlign: 'center', lineHeight: 15, maxWidth: 260 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  errorText: { flex: 1, color: colors.red, fontSize: 10, lineHeight: 15 },
  resultCount: { color: colors.faint, fontSize: 9, letterSpacing: 1, fontWeight: '700', paddingVertical: 10 },
  result: { marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 13 },
  resultCopy: { flex: 1, gap: 5 },
  resultTitle: { color: colors.text, fontSize: 12, fontWeight: '600' },
  resultDetail: { color: colors.muted, fontSize: 9 },
});
