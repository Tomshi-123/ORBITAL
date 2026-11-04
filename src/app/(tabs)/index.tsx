import { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Page, PageHeader, Panel } from '../../components/ui';
import { getSpaceNews, type SpaceNewsArticle } from '../../services/spaceNews';
import { colors } from '../../theme';

function newsRows(articles: SpaceNewsArticle[]) {
  const rows: SpaceNewsArticle[][] = [];
  let offset = 0;
  let rowSize = 3;

  while (offset < articles.length) {
    rows.push(articles.slice(offset, offset + rowSize));
    offset += rowSize;
    rowSize = rowSize === 3 ? 2 : 3;
  }

  return rows;
}

function publishedTime(article: SpaceNewsArticle) {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - Date.parse(article.publishedAt)) / 60_000));
  if (!Number.isFinite(elapsedMinutes)) return article.site;
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  if (elapsedMinutes < 1_440) return `${Math.floor(elapsedMinutes / 60)}h ago`;
  return `${Math.floor(elapsedMinutes / 1_440)}d ago`;
}

function StoryCard({ article, featured = false, rowSize = 2 }: {
  article: SpaceNewsArticle;
  featured?: boolean;
  rowSize?: number;
}) {
  const openArticle = () => router.push({
    pathname: '/news/[id]',
    params: { id: String(article.id), url: article.url },
  });

  return <TouchableOpacity
    style={featured ? styles.featuredButton : styles.storyButton}
    activeOpacity={0.88}
    onPress={openArticle}
    accessibilityRole="button"
    accessibilityLabel={`${article.title}, ${article.site}`}
  >
    <Panel style={[styles.storyPanel, featured ? styles.featuredPanel : rowSize === 3 ? styles.triplePanel : styles.doublePanel]}>
      {article.imageUrl ? (
        <ImageBackground source={{ uri: article.imageUrl }} style={StyleSheet.absoluteFill} imageStyle={styles.storyImage} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.storyArtwork]}>
          <Ionicons name="planet-outline" size={featured ? 46 : 30} color="rgba(165, 243, 252, 0.72)" />
        </View>
      )}
      <LinearGradient
        colors={featured
          ? ['rgba(3, 8, 15, 0.02)', 'rgba(3, 8, 15, 0.3)', 'rgba(3, 8, 15, 0.94)']
          : ['rgba(3, 8, 15, 0.1)', 'rgba(3, 8, 15, 0.82)']}
        locations={featured ? [0, 0.42, 1] : [0.12, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardTopline}>
          <Text numberOfLines={1} style={[styles.storySource, featured && styles.featuredSource]}>{article.site.toUpperCase()}</Text>
          {featured ? (
            <View style={styles.featuredTag}>
              <View style={styles.featuredDot} />
              <Text style={styles.featuredTagText}>TOP STORY</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.storyCopy}>
          <Text numberOfLines={featured ? 2 : 3} style={[styles.storyTitle, featured && styles.featuredTitle]}>
            {article.title}
          </Text>
          {featured ? <Text numberOfLines={2} style={styles.storySummary}>{article.summary}</Text> : null}
          <View style={styles.storyFooter}>
            <Text style={styles.storyTime}>{publishedTime(article)}</Text>
            {featured ? <Ionicons name="arrow-forward" size={15} color={colors.cyan} /> : null}
          </View>
        </View>
      </View>
    </Panel>
  </TouchableOpacity>;
}

export default function OverviewScreen() {
  const [news, setNews] = useState<SpaceNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getSpaceNews()
      .then((articles) => { if (active) setNews(articles); })
      .catch((loadError: unknown) => {
        console.error('Failed to load space news', loadError);
        if (active) {
          setNews([]);
          setError(loadError instanceof Error ? loadError.message : 'Space news is temporarily unavailable.');
        }
      })
      .finally(() => { if (active) setLoading(false); });
    const timer = setInterval(() => setRefresh((value) => value + 1), 15 * 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [refresh]);

  const featuredArticle = news[0];
  const rows = newsRows(news.slice(1));

  return <Page>
    <PageHeader
      eyebrow="ORBITAL / DISPATCH"
      title="Space news"
      subtitle="The latest from beyond our atmosphere."
      action={{ icon: 'search-outline', onPress: () => router.push('/search') }}
    />
    {loading && !featuredArticle ? <Panel style={styles.newsState}>
      <ActivityIndicator color={colors.cyan} />
      <Text style={styles.newsStateText}>Loading current space news…</Text>
    </Panel> : null}
    {error && !featuredArticle ? <Panel style={styles.newsState}>
      <Text style={styles.newsStateText}>{error}</Text>
      <TouchableOpacity onPress={() => setRefresh((value) => value + 1)} accessibilityRole="button">
        <Text style={styles.retryText}>RETRY</Text>
      </TouchableOpacity>
    </Panel> : null}
    {!loading && !error && !featuredArticle ? <Panel style={styles.newsState}>
      <Text style={styles.newsStateText}>No articles are currently available from the news provider.</Text>
    </Panel> : null}
    {featuredArticle ? <StoryCard article={featuredArticle} featured /> : null}
    {rows.map((row, rowIndex) => (
      <View key={`news-row-${rowIndex}`} style={styles.newsRow}>
        {row.map((article) => <StoryCard key={article.id} article={article} rowSize={row.length} />)}
      </View>
    ))}
    <Text style={styles.disclaimer}>Spaceflight News API · Tap a story to read it without leaving ORBITAL.</Text>
  </Page>;
}

const styles = StyleSheet.create({
  featuredButton: { width: '100%' },
  storyButton: { flex: 1, minWidth: 0 },
  storyPanel: { padding: 0, overflow: 'hidden', borderRadius: 16, borderColor: 'rgba(210, 237, 255, 0.2)' },
  featuredPanel: { height: 198, borderRadius: 20 },
  triplePanel: { height: 140 },
  doublePanel: { height: 126 },
  storyImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  storyArtwork: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#13263B' },
  cardContent: { flex: 1, justifyContent: 'space-between', padding: 12 },
  cardTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  storySource: { color: 'rgba(238, 247, 255, 0.8)', fontSize: 8, fontWeight: '800', letterSpacing: 1, flexShrink: 1 },
  featuredSource: { fontSize: 9, color: 'rgba(238, 247, 255, 0.92)' },
  featuredTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(16, 185, 179, 0.84)' },
  featuredDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#D6FFFA' },
  featuredTagText: { color: '#E8FFFC', fontSize: 7, fontWeight: '800', letterSpacing: 0.5 },
  storyCopy: { gap: 5 },
  storyTitle: { color: '#F5FAFF', fontSize: 11, lineHeight: 14, fontWeight: '800', textShadowColor: 'rgba(0, 0, 0, 0.6)', textShadowRadius: 8 },
  featuredTitle: { fontSize: 21, lineHeight: 24, letterSpacing: -0.3 },
  storySummary: { color: 'rgba(238, 247, 255, 0.82)', fontSize: 10, lineHeight: 14 },
  storyFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  storyTime: { color: 'rgba(233, 243, 255, 0.7)', fontSize: 8, fontWeight: '600' },
  newsRow: { flexDirection: 'row', gap: 9 },
  disclaimer: { color: colors.faint, fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 12 },
  newsState: { minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 },
  newsStateText: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  retryText: { color: colors.cyan, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
});
