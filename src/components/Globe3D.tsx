import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';

type LonLat = [number, number];

export type GlobeMarker = { id: string; latitude: number; longitude: number; color?: string; label?: string };

export type GlobePath = { id: string; points: LonLat[]; color: string; highlighted?: boolean };

type Props = {
  markers: GlobeMarker[];
  paths?: GlobePath[];
  orbiters?: { latitude: number; longitude: number }[];
  orbiterColor?: string;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onInteractionChange?: (active: boolean) => void;
  focusMarkerId?: string;
  size?: number;
};

const LAND: LonLat[][] = [
  [[-168, 66], [-140, 70], [-95, 72], [-80, 73], [-62, 60], [-55, 50], [-67, 44], [-76, 35], [-81, 25], [-90, 30], [-97, 26], [-97, 21], [-87, 21], [-88, 16], [-83, 10], [-77, 8], [-86, 12], [-95, 16], [-105, 20], [-110, 24], [-117, 32], [-124, 40], [-125, 49], [-135, 58], [-152, 59], [-165, 55]],
  [[-77, 8], [-62, 10], [-50, 0], [-35, -6], [-40, -22], [-48, -28], [-58, -38], [-65, -42], [-68, -52], [-72, -50], [-74, -40], [-71, -18], [-81, -5], [-80, 0]],
  [[-10, 36], [-9, 43], [-2, 48], [5, 52], [10, 56], [5, 62], [15, 70], [30, 71], [60, 69], [100, 77], [140, 72], [180, 68], [170, 60], [160, 55], [140, 52], [135, 43], [122, 40], [122, 30], [110, 20], [105, 10], [100, 13], [103, 1], [98, 8], [92, 20], [80, 15], [77, 8], [72, 20], [67, 25], [57, 25], [58, 20], [52, 16], [43, 13], [35, 28], [34, 31], [36, 36], [27, 37], [24, 38], [20, 40], [16, 38], [12, 44], [3, 43], [-5, 36]],
  [[-17, 21], [-6, 36], [10, 37], [32, 31], [43, 12], [51, 12], [40, -3], [40, -15], [35, -25], [20, -35], [12, -17], [9, -1], [9, 4], [-8, 4], [-17, 14]],
  [[114, -22], [130, -12], [142, -11], [153, -26], [147, -38], [135, -35], [115, -34]],
  [[-55, 60], [-20, 70], [-20, 82], [-60, 82], [-70, 76]],
];

const rad = (deg: number) => (deg * Math.PI) / 180;

function densify(poly: LonLat[]): LonLat[] {
  const out: LonLat[] = [];
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / 4));
    for (let s = 0; s < steps; s += 1) out.push([a[0] + ((b[0] - a[0]) * s) / steps, a[1] + ((b[1] - a[1]) * s) / steps]);
  });
  return out;
}

const LAND_DENSE = LAND.map(densify);

function project(lon: number, lat: number, lon0: number, lat0: number) {
  const dl = rad(lon - lon0);
  const phi = rad(lat);
  const p0 = rad(lat0);
  return {
    x: Math.cos(phi) * Math.sin(dl),
    y: Math.cos(p0) * Math.sin(phi) - Math.sin(p0) * Math.cos(phi) * Math.cos(dl),
    z: Math.sin(p0) * Math.sin(phi) + Math.cos(p0) * Math.cos(phi) * Math.cos(dl),
  };
}

export function Globe3D({ markers, paths = [], orbiters = [], orbiterColor = '#B6FF3B', selectedId, onSelect, onInteractionChange, focusMarkerId, size = 300 }: Props) {
  const [rotation, setRotation] = useState({ lon: 10, lat: 20 });
  const hasFocusedMarker = useRef(false);
  const start = useRef(rotation);
  const current = useRef(rotation);
  current.current = rotation;
  const callbacks = useRef({ onInteractionChange });
  callbacks.current = { onInteractionChange };

  useEffect(() => {
    if (!focusMarkerId || hasFocusedMarker.current) return;
    const marker = markers.find((item) => item.id === focusMarkerId);
    if (marker) {
      setRotation({ lon: marker.longitude, lat: marker.latitude });
      hasFocusedMarker.current = true;
    }
  }, [focusMarkerId, markers]);

  const r = size / 2 - 16;
  const c = size / 2;

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 4,
    onPanResponderGrant: () => { start.current = current.current; callbacks.current.onInteractionChange?.(true); },
    onPanResponderMove: (_, g) => {
      const k = 90 / r;
      setRotation({
        lon: start.current.lon - g.dx * k,
        lat: Math.max(-80, Math.min(80, start.current.lat + g.dy * k)),
      });
    },
    onPanResponderRelease: () => callbacks.current.onInteractionChange?.(false),
    onPanResponderTerminate: () => callbacks.current.onInteractionChange?.(false),
    onPanResponderTerminationRequest: () => false,
  }), [r]);

  const { lon, lat } = rotation;

  const landPaths = LAND_DENSE.map((poly) => {
    const pts = poly.map(([lo, la]) => {
      const p = project(lo, la, lon, lat);
      if (p.z >= 0) return p;
      const len = Math.hypot(p.x, p.y) || 1;
      return { x: p.x / len, y: p.y / len, z: p.z };
    });
    if (pts.every((p) => p.z < 0)) return null;
    return `${pts.map((p, i) => `${i ? 'L' : 'M'}${(c + p.x * r).toFixed(1)} ${(c - p.y * r).toFixed(1)}`).join(' ')}Z`;
  }).filter(Boolean) as string[];

  const grid: string[] = [];
  const addLine = (pts: LonLat[]) => {
    let d = '';
    let pen = false;
    pts.forEach(([lo, la]) => {
      const p = project(lo, la, lon, lat);
      if (p.z < 0) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${(c + p.x * r).toFixed(1)} ${(c - p.y * r).toFixed(1)} `;
      pen = true;
    });
    if (d) grid.push(d);
  };
  for (let lo = -180; lo < 180; lo += 30) addLine(Array.from({ length: 37 }, (_, i) => [lo, -90 + i * 5] as LonLat));
  for (let la = -60; la <= 60; la += 30) addLine(Array.from({ length: 73 }, (_, i) => [-180 + i * 5, la] as LonLat));

  const orbiterDots = useMemo(() => {
    // Drawn slightly outside the globe radius so satellites appear to hover above the atmosphere.
    const lift = 1.07;
    return orbiters.flatMap((s, i) => {
      const p = project(s.longitude, s.latitude, lon, lat);
      if (p.z < 0 && Math.hypot(p.x, p.y) * lift <= 1) return [];
      return [{ key: i, x: c + p.x * r * lift, y: c - p.y * r * lift }];
    });
  }, [orbiters, lon, lat, c, r]);

  const orbitPaths = paths.map((path) => {
    let d = '';
    let pen = false;
    path.points.forEach(([lo, la]) => {
      const p = project(lo, la, lon, lat);
      if (p.z < 0) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${(c + p.x * r).toFixed(1)} ${(c - p.y * r).toFixed(1)} `;
      pen = true;
    });
    return { ...path, d };
  }).filter((path) => path.d);

  return (
    <View {...pan.panHandlers} style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="ocean" cx="40%" cy="35%" r="75%">
            <Stop offset="0" stopColor="#14354A" />
            <Stop offset="1" stopColor="#06101A" />
          </RadialGradient>
        </Defs>
        <Circle cx={c} cy={c} r={r} fill="url(#ocean)" stroke="#2D6984" strokeWidth={1} />
        {landPaths.map((d, i) => <Path key={i} d={d} fill="#1B3A4A" stroke="#2F5A70" strokeWidth={0.8} />)}
        {grid.map((d, i) => <Path key={`g${i}`} d={d} stroke="#1E4258" strokeWidth={0.5} fill="none" opacity={0.7} />)}
        {orbitPaths.map((path) => (
          <Path
            key={`o${path.id}`}
            d={path.d}
            stroke={path.color}
            strokeWidth={path.highlighted ? 2 : 1}
            strokeDasharray={path.highlighted ? undefined : '4 3'}
            opacity={path.highlighted ? 1 : 0.55}
            fill="none"
          />
        ))}
        {orbiterDots.map((dot) => <Circle key={`s${dot.key}`} cx={dot.x} cy={dot.y} r={1.6} fill={orbiterColor} />)}
                {markers.map((m) => {
                  const p = project(m.longitude, m.latitude, lon, lat);
          if (p.z <= 0.05) return null;
          const selected = m.id === selectedId;
          const x = c + p.x * r;
          const y = c - p.y * r;
          return (
            <Fragment key={m.id}>
              <Circle
                cx={x}
                cy={y}
                r={selected ? 7 : (m.label ? 4 : 5)}
                fill={m.color ?? colors.blue}
                stroke={selected ? '#FFFFFF' : '#D5F4FF'}
                strokeWidth={selected ? 2 : 1}
                onPress={() => onSelect?.(m.id)}
              />
              {m.label ? (
                <SvgText
                  x={x + 7}
                  y={y + 3}
                  fill={m.color ?? colors.text}
                  fontSize={9}
                  fontWeight="700"
                >
                  {m.label}
                </SvgText>
              ) : null}
            </Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
