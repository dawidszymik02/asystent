import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { colors } from '../../src/theme/colors';

export default function CockpitScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.label, { color: theme.textMuted }]}>Kokpit — wkrótce</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16 },
});
