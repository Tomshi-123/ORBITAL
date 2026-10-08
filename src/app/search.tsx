import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Page, PageHeader, Panel } from '../components/ui';
import { celestialEvents, launches, sightings } from '../mock-data';
import { colors } from '../theme';

type Result = { id: string; title: string; detail: string; kind: string; route: string };

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const results = useMemo<Result[]>(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return [
      ...sightings.filter((item) => `${item.location} ${item.country} ${item.objectType} ${item.description}`.toLowerCase().includes(needle)).map((item) => ({ id: item.id, title: item.location, detail: item.objectType, kind: 'Sighting', route: `/sighting/${item.id}` })),
      ...launches.filter((item) => `${item.mission} ${item.rocket} ${item.provider}`.toLowerCase().includes(needle)).map((item) => ({ id: item.id, title: item.mission, detail: `${item.rocket} · ${item.provider}`, kind: 'Launch', route: '/launches' })),
      ...celestialEvents.filter((item) => `${item.name} ${item.kind} ${item.visibility}`.toLowerCase().includes(needle)).map((item) => ({ id: item.id, title: item.name, detail: item.visibility, kind: 'Sky event', route: '/events' })),
    ];
  }, [query]);
  return <Page>
    <PageHeader eyebrow="DISCOVERY" title="Search" subtitle="Search reports, missions and sky events." />
    <View style={styles.searchBox}><Ionicons name="search-outline" size={19} color={colors.cyan} /><TextInput autoFocus placeholder="Try “Jupiter”, “Phoenix” or “launch”" placeholderTextColor={colors.faint} value={query} onChangeText={setQuery} style={styles.input} returnKeyType="search" /><TouchableOpacity onPress={() => setQuery('')}><Ionicons name="close-circle" size={17} color={colors.faint} /></TouchableOpacity></View>
    {!query.trim() ? <Panel style={styles.empty}><Ionicons name="sparkles-outline" size={24} color={colors.cyan} /><Text style={styles.emptyTitle}>Search the orbital index</Text><Text style={styles.emptyText}>Results are powered by local sample data. Connect providers in the service layer later.</Text></Panel> : results.length ? <ScrollView keyboardShouldPersistTaps="handled">
      <Text style={styles.resultCount}>{results.length} RESULTS</Text>
      {results.map((result) => <TouchableOpacity key={`${result.kind}-${result.id}`} onPress={() => router.push(result.route)} activeOpacity={0.75}>
        <Panel style={styles.result}><View style={styles.resultCopy}><Text style={styles.resultTitle}>{result.title}</Text><Text style={styles.resultDetail}>{result.detail}</Text></View><Badge tone="blue">{result.kind.toUpperCase()}</Badge></Panel>
      </TouchableOpacity>)}
    </ScrollView> : <Panel style={styles.empty}><Text style={styles.emptyTitle}>No matching results</Text><Text style={styles.emptyText}>Try a different location, mission or object name.</Text></Panel>}
  </Page>;
}

const styles = StyleSheet.create({
  searchBox: { height: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, color: colors.text, fontSize: 12, paddingVertical: 0 },
  empty: { minHeight: 165, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  emptyTitle: { color: colors.text, fontSize: 13, fontWeight: '600' },
  emptyText: { color: colors.muted, fontSize: 10, textAlign: 'center', lineHeight: 15, maxWidth: 260 },
  resultCount: { color: colors.faint, fontSize: 9, letterSpacing: 1, fontWeight: '700', paddingVertical: 10 },
  result: { marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 13 },
  resultCopy: { flex: 1, gap: 5 },
  resultTitle: { color: colors.text, fontSize: 12, fontWeight: '600' },
  resultDetail: { color: colors.muted, fontSize: 9 },
});
