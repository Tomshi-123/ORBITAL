import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

function getParts(target: string) {
  const remaining = Math.max(0, new Date(target).getTime() - Date.now());
  const total = Math.floor(remaining / 1000);
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
    passed: remaining === 0,
  };
}

export function Countdown({ target, compact = false }: { target: string; compact?: boolean }) {
  const [parts, setParts] = useState(() => getParts(target));
  useEffect(() => {
    const timer = setInterval(() => setParts(getParts(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);
  const blocks = [['DAYS', parts.days], ['HRS', parts.hours], ['MIN', parts.minutes], ['SEC', parts.seconds]] as const;
  return <View style={styles.container}>
    {parts.passed ? <Text style={styles.passed}>LAUNCH WINDOW REACHED</Text> : blocks.map(([label, value]) => <View key={label} style={styles.unit}>
      <Text style={[styles.value, compact && styles.valueCompact]}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  unit: { alignItems: 'center', minWidth: 36 },
  value: { color: colors.text, fontSize: 25, fontVariant: ['tabular-nums'], fontWeight: '700', letterSpacing: -1 },
  valueCompact: { fontSize: 18 },
  label: { color: colors.faint, fontSize: 8, letterSpacing: 1, marginTop: 2 },
  passed: { color: colors.green, fontSize: 11, letterSpacing: 1, fontWeight: '700' },
});
