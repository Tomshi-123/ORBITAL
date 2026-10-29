import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Page, PageHeader, Panel } from '../components/ui';
import { colors } from '../theme';

const STREAM_URL = 'https://www.youtube-nocookie.com/embed/21X5lGlDOfg?autoplay=1&mute=1&playsinline=1&rel=0';

export default function IssLiveScreen() {
  const [failed, setFailed] = useState(false);

  return (
    <Page style={styles.container}>
      <View style={styles.spaceWindowWrapper}>
        <PageHeader eyebrow="LIVE CAMERA" title="NASA ISS LIVE" action={{ icon: 'close', onPress: () => router.back() }} />

        <View style={styles.windowHeader}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE FEED</Text>
          </View>
          <Text style={styles.orbitText}>LOW EARTH ORBIT</Text>
        </View>

        <Panel style={styles.videoPanel}>
          <View style={styles.preview}>
            {failed ? (
              <View style={styles.offlineBox}>
                <Ionicons name="videocam-off-outline" size={28} color={colors.faint} />
                <Text style={styles.previewText}>SIGNAL LOST</Text>
              </View>
            ) : Platform.OS === 'web' ? (
              <iframe
                src={STREAM_URL}
                title="NASA ISS Live"
                referrerPolicy="strict-origin-when-cross-origin"
                onError={() => setFailed(true)}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <WebView
                style={styles.webview}
                source={{ uri: STREAM_URL, headers: { Referer: 'https://youtube.com' } }}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                onError={() => setFailed(true)}
                onHttpError={(event) => { if (event.nativeEvent.statusCode >= 400) setFailed(true); }}
              />
            )}
          </View>
        </Panel>

        <Panel style={styles.infoCard}>
          <View style={styles.titleRow}>
            <Ionicons name="planet-outline" size={18} color={colors.cyan} />
            <Text style={styles.cameraName}>NASA ISS LIVE</Text>
          </View>
          <Text style={styles.locationMeta}>Earth  ·  Low Earth orbit</Text>
          <Text style={styles.description}>
            Live Earth footage from cameras aboard the International Space Station, streamed by NASA. The feed can be interrupted when the station loses its communications link.
          </Text>
        </Panel>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: 'transparent' },
  spaceWindowWrapper: { flex: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 20, maxWidth: 600, alignSelf: 'center', width: '100%', gap: 10 },
  windowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 6, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.3)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  liveText: { color: '#22c55e', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  orbitText: { color: colors.faint, fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  videoPanel: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0A111A',
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  preview: { height: 240, backgroundColor: '#0A111A', overflow: 'hidden' },
  webview: { flex: 1, width: '100%', height: '100%', backgroundColor: '#0A111A' },
  offlineBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  previewText: { color: colors.faint, fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },
  infoCard: { marginTop: 6, padding: 16, backgroundColor: 'rgba(20, 42, 58, 0.4)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cameraName: { color: colors.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  locationMeta: { color: colors.cyan, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  description: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
});
