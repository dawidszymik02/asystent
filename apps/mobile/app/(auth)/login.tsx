import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const signIn = useAuthStore((state) => state.signIn);
  const router = useRouter();
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Wprowadź email i hasło');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(app)');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Błąd logowania';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={[styles.logo, { color: theme.text }]}>Asystent</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Twój osobisty asystent
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Input
              label="Hasło"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
            />
            {error ? (
              <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
            ) : null}
            <Button
              title="Zaloguj się"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1 },
  inner: { flex: 1, paddingHorizontal: 32, justifyContent: 'center', minHeight: '100%' },
  header: { marginBottom: 56 },
  logo: { fontSize: 40, fontWeight: '700', letterSpacing: -1, marginBottom: 6 },
  subtitle: { fontSize: 15 },
  form: { width: '100%' },
  error: { fontSize: 13, marginBottom: 12, textAlign: 'center' },
  button: { marginTop: 8 },
});
