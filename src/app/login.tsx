import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Page, PageHeader, Panel } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export default function LoginScreen() {
  const { signIn, restoreError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn(username.trim(), password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return <Page>
    <PageHeader eyebrow="ORBITAL ACCOUNT" title="Welcome back" subtitle="Sign in to track launches across your devices." />
    <Panel style={styles.panel}>
      <View style={styles.icon}><Ionicons name="planet-outline" size={25} color={colors.cyan} /></View>
      <Text style={styles.heading}>SIGN IN / CREATE ACCOUNT</Text>
      <Text style={styles.description}>Your first sign-in creates your account. Use the same username and password next time.</Text>
      <View style={styles.field}>
        <Text style={styles.label}>USERNAME</Text>
        <TextInput
          accessibilityLabel="Username"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setUsername}
          placeholder="Your username"
          placeholderTextColor={colors.faint}
          style={styles.input}
          value={username}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          accessibilityLabel="Password"
          autoCapitalize="none"
          onChangeText={setPassword}
          onSubmitEditing={() => { void submit(); }}
          placeholder="At least 12 characters"
          placeholderTextColor={colors.faint}
          secureTextEntry
          style={styles.input}
          value={password}
        />
      </View>
      {restoreError ? <Text style={styles.error}>Saved login could not be restored: {restoreError}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        accessibilityRole="button"
        disabled={busy}
        onPress={() => { void submit(); }}
        style={[styles.button, busy && styles.buttonBusy]}
      >
        {busy ? <ActivityIndicator color={colors.background} /> : <Text style={styles.buttonText}>CONTINUE</Text>}
      </TouchableOpacity>
      <Text style={styles.note}>Usernames: 3–32 letters, numbers or underscores. Passwords: 12–128 characters.</Text>
    </Panel>
  </Page>;
}

const styles = StyleSheet.create({
  panel: { gap: 16 },
  icon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#142B3A' },
  heading: { color: colors.text, fontSize: 13, fontWeight: '700', letterSpacing: 1.1 },
  description: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  field: { gap: 7 },
  label: { color: colors.faint, fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  input: { minHeight: 48, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, color: colors.text, fontSize: 14 },
  error: { color: colors.red, fontSize: 11, lineHeight: 16 },
  button: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan },
  buttonBusy: { opacity: 0.7 },
  buttonText: { color: colors.background, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  note: { color: colors.faint, fontSize: 10, lineHeight: 15 },
});
