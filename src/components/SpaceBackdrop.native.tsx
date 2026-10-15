import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

const stars = [
  [7, 8, 2], [18, 17, 1], [31, 7, 1], [46, 14, 2], [63, 8, 1], [81, 16, 2], [93, 7, 1],
  [12, 31, 1], [27, 25, 2], [42, 35, 1], [57, 27, 1], [73, 37, 2], [88, 29, 1],
  [5, 51, 1], [21, 46, 1], [38, 54, 2], [53, 47, 1], [68, 56, 1], [84, 48, 2], [96, 58, 1],
  [14, 69, 2], [32, 75, 1], [49, 66, 1], [64, 78, 2], [78, 69, 1], [91, 81, 1],
  [8, 91, 1], [25, 86, 1], [43, 94, 2], [59, 88, 1], [75, 96, 1], [89, 90, 2],
] as const;

export function SpaceBackdrop() {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <LinearGradient
      colors={['#05070E', '#0B0F19']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <View style={[styles.nebula, styles.purpleNebula]} />
    <View style={[styles.nebula, styles.blueNebula]} />
    {stars.map(([left, top, size], index) => (
      <View key={index} style={[styles.star, { left: `${left}%`, top: `${top}%`, width: size, height: size, opacity: size === 2 ? 0.72 : 0.48 }]} />
    ))}
  </View>;
}

const styles = StyleSheet.create({
  nebula: { position: 'absolute', width: '70%', aspectRatio: 1, borderRadius: 999, opacity: 0.13 },
  purpleNebula: { top: '-12%', left: '-20%', backgroundColor: '#4B327C', shadowColor: '#4B327C', shadowOpacity: 0.8, shadowRadius: 100, elevation: 0 },
  blueNebula: { right: '-28%', bottom: '-18%', backgroundColor: '#164C63', shadowColor: '#164C63', shadowOpacity: 0.8, shadowRadius: 100, elevation: 0 },
  star: { position: 'absolute', borderRadius: 999, backgroundColor: '#D9F6FF' },
});
