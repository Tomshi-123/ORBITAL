import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useContext, useEffect, useRef } from 'react';
import type { ComponentRef } from 'react';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { TouchGlowContext } from './TouchGlowContext';

const stars = [
  [7, 8, 2], [18, 17, 1], [31, 7, 1], [46, 14, 2], [63, 8, 1], [81, 16, 2], [93, 7, 1],
  [12, 31, 1], [27, 25, 2], [42, 35, 1], [57, 27, 1], [73, 37, 2], [88, 29, 1],
  [5, 51, 1], [21, 46, 1], [38, 54, 2], [53, 47, 1], [68, 56, 1], [84, 48, 2], [96, 58, 1],
  [14, 69, 2], [32, 75, 1], [49, 66, 1], [64, 78, 2], [78, 69, 1], [91, 81, 1],
  [8, 91, 1], [25, 86, 1], [43, 94, 2], [59, 88, 1], [75, 96, 1], [89, 90, 2],
  [3, 22, 1], [22, 5, 1], [37, 19, 1], [55, 5, 1], [70, 21, 1], [98, 36, 1],
  [10, 42, 1], [30, 43, 1], [47, 58, 1], [61, 40, 1], [77, 53, 1], [90, 63, 1],
  [2, 78, 1], [19, 97, 1], [35, 63, 1], [52, 83, 1], [69, 92, 1], [96, 97, 1],
] as const;

function TwinklingStar({ left, top, size, delay }: { left: number; top: number; size: number; delay: number }) {
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 0.95, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.22, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  return <Animated.View style={[styles.star, { left: `${left}%`, top: `${top}%`, width: size, height: size, opacity }]} />;
}

export function SpaceBackdrop() {
  const { width } = useWindowDimensions();
  const { setShootingStarPoint } = useContext(TouchGlowContext);
  const nebulaMotion = useRef(new Animated.Value(0)).current;
  const streakMotion = useRef(new Animated.Value(0)).current;
  const backdropRef = useRef<ComponentRef<typeof View>>(null);
  const backdropFrame = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const measureBackdrop = () => {
    backdropRef.current?.measureInWindow((x, y, frameWidth, height) => {
      backdropFrame.current = { x, y, width: frameWidth, height };
    });
  };

  useEffect(() => {
    const nebula = Animated.loop(Animated.sequence([
      Animated.timing(nebulaMotion, { toValue: 1, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(nebulaMotion, { toValue: 0, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const streak = Animated.loop(Animated.sequence([
      Animated.delay(3800),
      Animated.timing(streakMotion, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(streakMotion, { toValue: 0, duration: 1, useNativeDriver: true }),
    ]));
    nebula.start();
    streak.start();
    return () => {
      nebula.stop();
      streak.stop();
    };
  }, [nebulaMotion, streakMotion]);

  useEffect(() => {
    let lastUpdate = 0;
    const listener = streakMotion.addListener(({ value }) => {
      if (value < 0.08 || value > 0.95) {
        setShootingStarPoint(null);
        return;
      }

      const now = Date.now();
      if (now - lastUpdate < 32) return;
      lastUpdate = now;

      const frame = backdropFrame.current;
      if (!frame) return;

      const radians = 24 * Math.PI / 180;
      setShootingStarPoint({
        x: frame.x - frame.width * 0.25 + frame.width * 1.3 * value + 108 * Math.cos(radians),
        y: frame.y + frame.height * 0.18 + frame.width * 0.55 * value + 108 * Math.sin(radians),
      });
    });
    return () => streakMotion.removeListener(listener);
  }, [setShootingStarPoint, streakMotion]);

  return <View ref={backdropRef} onLayout={measureBackdrop} pointerEvents="none" style={StyleSheet.absoluteFill}>
    <LinearGradient
      colors={['#04050D', '#090C19', '#07121C']}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <Animated.View style={[
      styles.nebulaLayer,
      {
        opacity: nebulaMotion.interpolate({ inputRange: [0, 1], outputRange: [0.74, 1] }),
        transform: [
          { translateX: nebulaMotion.interpolate({ inputRange: [0, 1], outputRange: [-9, 9] }) },
          { translateY: nebulaMotion.interpolate({ inputRange: [0, 1], outputRange: [7, -7] }) },
          { scale: nebulaMotion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
        ],
      },
    ]}>
      <Svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="violet-nebula" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#9B5CFF" stopOpacity="0.35" />
            <Stop offset="48%" stopColor="#713EE8" stopOpacity="0.14" />
            <Stop offset="100%" stopColor="#713EE8" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="blue-nebula" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#438CFF" stopOpacity="0.28" />
            <Stop offset="55%" stopColor="#3574D2" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#3574D2" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="teal-nebula" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#36D6D0" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#36D6D0" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Ellipse cx="180" cy="210" rx="430" ry="360" fill="url(#violet-nebula)" />
        <Ellipse cx="850" cy="310" rx="390" ry="330" fill="url(#blue-nebula)" />
        <Ellipse cx="790" cy="850" rx="430" ry="350" fill="url(#teal-nebula)" />
        <Ellipse cx="190" cy="840" rx="370" ry="300" fill="url(#blue-nebula)" opacity="0.65" />
      </Svg>
    </Animated.View>
    {stars.map(([left, top, size], index) => (
      <View key={index} style={[styles.star, { left: `${left}%`, top: `${top}%`, width: size, height: size, opacity: size === 2 ? 0.82 : 0.46 }]} />
    ))}
    <TwinklingStar left={13} top={15} size={3} delay={0} />
    <TwinklingStar left={72} top={12} size={2} delay={600} />
    <TwinklingStar left={35} top={40} size={2} delay={1100} />
    <TwinklingStar left={89} top={48} size={3} delay={1800} />
    <TwinklingStar left={17} top={76} size={2} delay={2400} />
    <TwinklingStar left={58} top={88} size={2} delay={900} />
    <Animated.View style={[
      styles.shootingStar,
      {
        opacity: streakMotion.interpolate({ inputRange: [0, 0.12, 0.82, 1], outputRange: [0, 0.95, 0.78, 0] }),
        transform: [
          { translateX: streakMotion.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.25, width * 1.05] }) },
          { translateY: streakMotion.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.55] }) },
          { rotate: '24deg' },
        ],
      },
    ]} />
  </View>;
}

const styles = StyleSheet.create({
  nebulaLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  star: { position: 'absolute', borderRadius: 999, backgroundColor: '#E8F7FF', shadowColor: '#C6E8FF', shadowOpacity: 0.85, shadowRadius: 5, elevation: 0 },
  shootingStar: { position: 'absolute', left: '-25%', top: '18%', width: 108, height: 2, borderRadius: 2, backgroundColor: '#E6F7FF', shadowColor: '#A8D9FF', shadowOpacity: 1, shadowRadius: 12, elevation: 0 },
});
