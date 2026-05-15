import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { colors } from '../../../src/theme/colors';

export default function CalendarLayout() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ title: 'Nowe wydarzenie' }} />
      <Stack.Screen name="[id]" options={{ title: 'Szczegóły' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Edytuj wydarzenie' }} />
      <Stack.Screen name="reminders" options={{ title: 'Przypomnienia' }} />
    </Stack>
  );
}
