import { useContext, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { TouchGlowContext } from './TouchGlowContext';

type Frame = { x: number; y: number; width: number; height: number };
type Glow = { x: number; y: number; opacity: number };

export function Panel({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { point } = useContext(TouchGlowContext);
  const panelRef = useRef<View>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!point || !panelRef.current) {
      setFrame(null);
      return;
    }

    panelRef.current.measureInWindow((x, y, width, height) => setFrame({ x, y, width, height }));
  }, [point, size]);

  const glow = getEdgeGlow(point, frame);

  return <View
    ref={panelRef}
    onLayout={(event) => setSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    })}
    style={[styles.panel, style]}
  >
    {children}
    {glow && size.width > 0 && size.height > 0 ? (
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} viewBox={`0 0 ${size.width} ${size.height}`}>
        <Defs>
          <RadialGradient
            id="touch-edge-glow"
            cx={glow.x}
            cy={glow.y}
            r={88}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#A5F3FC" stopOpacity={0.95 * glow.opacity} />
            <Stop offset="0.38" stopColor="#A5F3FC" stopOpacity={0.54 * glow.opacity} />
            <Stop offset="1" stopColor="#A5F3FC" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Path
          d={`M 16 1 H ${size.width - 16} Q ${size.width - 1} 1 ${size.width - 1} 16 V ${size.height - 16} Q ${size.width - 1} ${size.height - 1} ${size.width - 16} ${size.height - 1} H 16 Q 1 ${size.height - 1} 1 ${size.height - 16} V 16 Q 1 1 16 1`}
          fill="none"
          stroke="url(#touch-edge-glow)"
          strokeWidth={2}
        />
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
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 6,
  },
});
