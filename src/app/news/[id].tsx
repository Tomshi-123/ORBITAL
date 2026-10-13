import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { colors } from '../../theme';

export default function NewsArticleScreen() {
  const { url } = useLocalSearchParams<{ id: string; url?: string }>();
  const [failed, setFailed] = useState(false);
  const articleUrl = Array.isArray(url) ? url[0] : url;
  const safeUrl = articleUrl?.startsWith('https://') ? articleUrl : null;

  return <View style={styles.screen}>
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back to space news">
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>ORBITAL · SPACE NEWS</Text>
        <Text style={styles.title}>Article</Text>
      </View>
      <Ionicons name="planet-outline" size={21} color={colors.cyan} />
    </View>
    {safeUrl && !failed ? <WebView
      source={{ uri: safeUrl }}
      style={styles.webView}
      originWhitelist={['https://*']}
      onError={() => setFailed(true)}
      onHttpError={(event) => { if (event.nativeEvent.statusCode >= 400) setFailed(true); }}
      startInLoadingState
      renderLoading={() => <View style={styles.message}><Text style={styles.messageText}>Loading article…</Text></View>}
    /> : <View style={styles.message}>
      <Ionicons name="cloud-offline-outline" size={28} color={colors.muted} />
      <Text style={styles.messageText}>{safeUrl ? 'This article could not be loaded.' : 'This article link is unavailable.'}</Text>
      <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>Back to Space news</Text></TouchableOpacity>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 74, paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.surfaceRaised },
  headerCopy: { flex: 1, gap: 3 },
  eyebrow: { color: colors.cyan, fontSize: 8, fontWeight: '700', letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  webView: { flex: 1, backgroundColor: colors.background },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  messageText: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  backText: { color: colors.cyan, fontSize: 12, fontWeight: '700' },
});
