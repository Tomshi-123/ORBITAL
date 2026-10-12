import { StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Page, Panel } from '../../components/ui';
import { cameras } from '../../mock-data';
import { colors } from '../../theme';
import { WebView } from 'react-native-webview';

export default function CamerasScreen() {
  // Vi hämtar den första tillgängliga kameran direkt
  const activeCamera = cameras.find(c => c.available && c.source) || cameras[0];

  return (
    <Page style={styles.container}>
      {/* Huvudcontainer för fönstret ut i rymden */}
      <View style={styles.spaceWindowWrapper}>
        
        {/* Statusrad ovanför videon */}
        <View style={styles.windowHeader}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE FEED</Text>
          </View>
          <Text style={styles.orbitText}>LOW EARTH ORBIT</Text>
        </View>

        {/* Själva videofönstret */}
        <Panel style={styles.videoPanel}>
          <View style={styles.preview}>
            {activeCamera && activeCamera.source ? (
              Platform.OS === 'web' ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeCamera.source}?autoplay=1&mute=1&playsinline=1&rel=0`}
                  title={activeCamera.name}
                  referrerPolicy="strict-origin-when-cross-origin"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <WebView 
                  style={styles.webview}
                  source={{ 
                    uri: `https://www.youtube-nocookie.com/embed/${activeCamera.source}?autoplay=1&mute=1&playsinline=1&rel=0`,
                    headers: { 'Referer': 'https://youtube.com' }
                  }}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                />
              )
            ) : (
              <View style={styles.offlineBox}>
                <Ionicons name="videocam-off-outline" size={28} color={colors.faint} />
                <Text style={styles.previewText}>SIGNAL LOST</Text>
              </View>
            )}
          </View>
        </Panel>

        {/* Information om kameran / rymdstationen under videon */}
        <View style={styles.infoCard}>
          <View style={styles.titleRow}>
            <Ionicons name="planet-outline" size={18} color={colors.cyan} />
            <Text style={styles.cameraName}>{activeCamera.name}</Text>
          </View>
          <Text style={styles.locationMeta}>{activeCamera.category}  ·  {activeCamera.location}</Text>
          <Text style={styles.description}>
            Direktsändning från omloppsana. Följ jordens rotation och soluppgångar i realtid från den internationella rymdstationen.
          </Text>
        </View>

      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#050B14', // Extra djupt rymd-mörker
  },
  spaceWindowWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  windowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  liveText: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  orbitText: {
    color: colors.faint,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  videoPanel: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0A111A',
    // Ger en snygg "skugg-glöd" runt videofönstret
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  preview: { 
    height: 240, // Större och mer filmiskt fönster
    backgroundColor: '#0A111A', 
    overflow: 'hidden',
  },
  webview: { 
    flex: 1, 
    width: '100%', 
    height: '100%', 
    backgroundColor: '#0A111A' 
  },
  offlineBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  previewText: { 
    color: colors.faint, 
    fontSize: 9, 
    letterSpacing: 1.5, 
    fontWeight: '700' 
  },
  infoCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(20, 42, 58, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cameraName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  locationMeta: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  description: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
});