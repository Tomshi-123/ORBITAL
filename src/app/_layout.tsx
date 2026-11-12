import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { colors } from '../theme';

function RootNavigator() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const onLoginScreen = segments[0] === 'login';

  useEffect(() => {
    if (loading) return;
    if (!session && !onLoginScreen) router.replace('/login');
    if (session && onLoginScreen) router.replace('/(tabs)');
  }, [loading, onLoginScreen, router, session]);

  if (loading) return <View style={styles.loading}>
    <ActivityIndicator color={colors.cyan} />
    <Text style={styles.loadingText}>Restoring your session…</Text>
  </View>;

  return <Stack screenOptions={{
    headerShown: false,
    contentStyle: { backgroundColor: colors.background },
    animation: 'slide_from_right',
    animationDuration: 380,
  }} />;
}

export default function RootLayout() {
  return <AuthProvider>
    <StatusBar style="light" />
    <RootNavigator />
  </AuthProvider>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background },
  loadingText: { color: colors.muted, fontSize: 12 },
});
