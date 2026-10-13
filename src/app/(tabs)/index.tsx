import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Page, PageHeader, Panel } from '../../components/ui';
import { getSpaceNews, type SpaceNewsArticle } from '../../services/spaceNews';
import { colors } from '../../theme';

export default function OverviewScreen() {
  const [news, setNews] = useState<SpaceNewsArticle[]>([]);

  useEffect(() => {
    let active = true;
    getSpaceNews()
      .then((articles) => { if (active) setNews(articles); })
      .catch((error) => console.error('Failed to load space news', error));
    return () => {
      active = false;
    };
  }, []);

  return <Page>
    <PageHeader eyebrow="ORBITAL / OBSERVATORY" title="Above us, right now." subtitle="A clearer view of the moving sky." action={{ icon: 'search-outline', onPress: () => router.push('/search') }} />
    <View style={styles.hero}>
      <View style={styles.heroOrbits}><View style={styles.orbitOne} /><View style={styles.orbitTwo} /><View style={styles.heroCore}><Ionicons name="newspaper-outline" size={33} color={colors.cyan} /></View></View>
      <View style={styles.heroCopy}>
        <Text style={styles.heroKicker}>SPACEFLIGHT NEWS</Text>
        <Text style={styles.heroTitle}>Daily space headlines.</Text>
        <Text style={styles.heroBody}>Fresh mission and astronomy news from Spaceflight News API.</Text>
        <TouchableOpacity style={styles.heroLink} onPress={() => router.push('/map')}>
          <Text style={styles.heroLinkText}>Open live map</Text><Ionicons name="arrow-forward" size={15} color={colors.cyan} />
        </TouchableOpacity>
      </View>
    </View>
    <View style={styles.newsHeading}>
      <View style={styles.newsHeadingIcon}><Ionicons name="planet-outline" size={21} color={colors.cyan} /></View>
      <View style={styles.newsHeadingCopy}>
        <Text style={styles.newsEyebrow}>ORBITAL DISPATCH · {String(news.length).padStart(2, '0')} STORIES</Text>
        <Text style={styles.newsHeadingTitle}>Space news</Text>
      </View>
      <View style={styles.newsSignal}><View style={styles.newsSignalDot} /><Text style={styles.newsSignalText}>LIVE</Text></View>
    </View>
    <View style={styles.newsList}>
      {news.map((article) => <TouchableOpacity key={article.id} activeOpacity={0.8} onPress={() => router.push({ pathname: '/news/[id]', params: { id: String(article.id), url: article.url } })}>
        <Panel style={styles.storyPanel}>
          {article.imageUrl ? <Image source={{ uri: article.imageUrl }} style={styles.storyImage} /> : <View style={styles.storyArtwork}><Ionicons name="planet-outline" size={28} color={colors.cyan} /></View>}
          <Text style={styles.storySource}>{article.site.toUpperCase()}</Text>
          <Text style={styles.storyTitle} numberOfLines={2}>{article.title}</Text>
          <Text style={styles.storySummary} numberOfLines={3}>{article.summary}</Text>
          <View style={styles.readLink}><Text style={styles.heroLinkText}>Read in app</Text><Ionicons name="arrow-forward" size={13} color={colors.cyan} /></View>
        </Panel>
      </TouchableOpacity>)}
    </View>

    <Text style={styles.disclaimer}>Spaceflight news · Tap a story to read it without leaving ORBITAL.</Text>
  </Page>;
}

const styles = StyleSheet.create({
  hero: { minHeight: 230, borderRadius: 24, overflow: 'hidden', backgroundColor: '#0C1B2A', borderWidth: 1, borderColor: '#1D3548', flexDirection: 'row', alignItems: 'center', padding: 18 },
  heroCopy: { flex: 1, zIndex: 1 },
  heroKicker: { color: colors.cyan, fontSize: 9, fontWeight: '700', letterSpacing: 1.7 },
  heroTitle: { color: colors.text, fontSize: 25, lineHeight: 31, fontWeight: '700', marginTop: 13, letterSpacing: -0.6 },
  heroBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 8, maxWidth: 220 },
  heroLink: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 16 },
  heroLinkText: { color: colors.cyan, fontSize: 11, fontWeight: '700' },
  heroOrbits: { position: 'absolute', right: -56, top: -5, width: 225, height: 255, alignItems: 'center', justifyContent: 'center', opacity: 0.75 },
  orbitOne: { position: 'absolute', width: 160, height: 160, borderRadius: 90, borderWidth: 1, borderColor: '#31546A', transform: [{ rotate: '-26deg' }, { scaleX: 1.5 }] },
  orbitTwo: { position: 'absolute', width: 130, height: 130, borderRadius: 70, borderWidth: 1, borderColor: '#31546A', transform: [{ rotate: '28deg' }, { scaleX: 1.6 }] },
  heroCore: { width: 93, height: 93, borderRadius: 48, borderWidth: 1, borderColor: '#2B7084', backgroundColor: '#103248', justifyContent: 'center', alignItems: 'center', shadowColor: colors.cyan, shadowOpacity: 0.3, shadowRadius: 20 },
  newsHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  newsHeadingIcon: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, borderColor: '#2B7084', backgroundColor: '#103248', alignItems: 'center', justifyContent: 'center' },
  newsHeadingCopy: { flex: 1, gap: 3 },
  newsEyebrow: { color: colors.cyan, fontSize: 8, fontWeight: '700', letterSpacing: 1.5 },
  newsHeadingTitle: { color: colors.text, fontSize: 25, lineHeight: 29, fontWeight: '700', letterSpacing: -0.6 },
  newsSignal: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#35D07F45', backgroundColor: '#35D07F12' },
  newsSignalDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green },
  newsSignalText: { color: colors.green, fontSize: 8, letterSpacing: 1, fontWeight: '700' },
  newsList: { gap: 10 },
  storyPanel: { gap: 9, overflow: 'hidden' },
  storyImage: { height: 150, margin: -16, marginBottom: 2, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  storyArtwork: { height: 110, margin: -16, marginBottom: 2, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#10273A', justifyContent: 'center', alignItems: 'center' },
  storySource: { color: '#89B8CC', fontSize: 8, letterSpacing: 1.3, fontWeight: '700' },
  storyTitle: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  storySummary: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  readLink: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 2 },
  disclaimer: { color: colors.faint, fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 12 },
});
