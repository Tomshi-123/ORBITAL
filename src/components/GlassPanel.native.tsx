import { useContext, useEffect, useRef, useState } from 'react';
import type { ComponentRef, PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { TouchGlowContext } from './TouchGlowContext';

type Frame = { x: number; y: number; width: number; height: number };
type Glow = { x: number; y: number; opacity: number };

export function Panel({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { point, shootingStarPoint } = useContext(TouchGlowContext);
  const panelRef = useRef<ComponentRef<typeof View>>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if ((!point && !shootingStarPoint) || !panelRef.current) {
      setFrame(null);
      return;
    }

    panelRef.current.measureInWindow((x, y, width, height) => setFrame({ x, y, width, height }));
  }, [point, shootingStarPoint, size]);

  const glow = getEdgeGlow(point, frame);
  const shootingStarGlow = getEdgeGlow(shootingStarPoint, frame);

  return <View
    ref={panelRef}
    onLayout={(event) => setSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    })}
    style={[styles.panel, style]}
  >
    <LinearGradient
      pointerEvents="none"
      colors={['rgba(204, 220, 255, 0.075)', 'rgba(204, 220, 255, 0.018)', 'transparent']}
      locations={[0, 0.35, 1]}
      start={{ x: 0.12, y: 0 }}
      end={{ x: 0.86, y: 1 }}
      style={styles.sheen}
    />
    {children}
    {(glow || shootingStarGlow) && size.width > 0 && size.height > 0 ? (
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox={`0 0 ${size.width} ${size.height}`}>
        <Defs>
          <RadialGradient
            id="touch-edge-glow"
            cx={glow?.x ?? 0}
            cy={glow?.y ?? 0}
            r={88}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#A5F3FC" stopOpacity={0.95 * (glow?.opacity ?? 0)} />
            <Stop offset="0.38" stopColor="#A5F3FC" stopOpacity={0.54 * (glow?.opacity ?? 0)} />
            <Stop offset="1" stopColor="#A5F3FC" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id="star-edge-glow"
            cx={shootingStarGlow?.x ?? 0}
            cy={shootingStarGlow?.y ?? 0}
            r={88}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#E8F7FF" stopOpacity={shootingStarGlow?.opacity ?? 0} />
            <Stop offset="0.38" stopColor="#8FCBFF" stopOpacity={0.72 * (shootingStarGlow?.opacity ?? 0)} />
            <Stop offset="1" stopColor="#8FCBFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {glow ? <Path
          d={`M 16 1 H ${size.width - 16} Q ${size.width - 1} 1 ${size.width - 1} 16 V ${size.height - 16} Q ${size.width - 1} ${size.height - 1} ${size.width - 16} ${size.height - 1} H 16 Q 1 ${size.height - 1} 1 ${size.height - 16} V 16 Q 1 1 16 1`}
          fill="none"
          stroke="url(#touch-edge-glow)"
          strokeWidth={2}
        /> : null}
        {shootingStarGlow ? <Path
          d={`M 16 1 H ${size.width - 16} Q ${size.width - 1} 1 ${size.width - 1} 16 V ${size.height - 16} Q ${size.width - 1} ${size.height - 1} ${size.width - 16} ${size.height - 1} H 16 Q 1 ${size.height - 1} 1 ${size.height - 16} V 16 Q 1 1 16 1`}
          fill="none"
          stroke="url(#star-edge-glow)"
          strokeWidth={3}
        /> : null}
      </Svg>
    ) : null}
  </View>;
}

function getEdgeGlow(point: { x: number; y: number } | null, frame: Frame | null): Glow | null {
  if (!point || !frame || frame.width === 0 || frame.height === 0) return null;

  const x = point.x - frame.x;
  const y = point.y - frame.y;
  const edgeX = Math.max(0, Math.min(x, frame.width));
  const edgeY = Math.max(0, Math.min(y, frame.height));
  const distance = Math.hypot(x - edgeX, y - edgeY);
  if (distance > 88) return null;

  return {
    x: edgeX,
    y: edgeY,
    opacity: 1 - distance / 88,
  };
}

const styles = StyleSheet.create({
  panel: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 18, 34, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(177, 197, 255, 0.14)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#5D58B7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 8,
  },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: 82 },
});
