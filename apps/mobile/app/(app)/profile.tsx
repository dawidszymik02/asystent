import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { colors } from '../../src/theme/colors';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/authStore';

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];
  const { user, signOut } = useAuthStore();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email}</Text>
      <Button title="Wyloguj się" variant="secondary" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
  email: { fontSize: 14, marginBottom: 40 },
});
