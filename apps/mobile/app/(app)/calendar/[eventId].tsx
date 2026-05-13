import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/theme/colors';
import { useCalendarStore } from '../../../src/store/calendarStore';

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];
  const router = useRouter();
  const event = useCalendarStore((state) => state.events.find((e) => e.id === eventId));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>

      {event ? (
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>{event.title}</Text>
          {event.description ? (
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {event.description}
            </Text>
          ) : null}
          <View style={[styles.meta, { borderColor: theme.border }]}>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Początek</Text>
            <Text style={[styles.metaValue, { color: theme.text }]}>{event.startTime}</Text>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Koniec</Text>
            <Text style={[styles.metaValue, { color: theme.text }]}>{event.endTime}</Text>
          </View>
        </View>
      ) : (
        <Text style={[styles.notFound, { color: theme.textMuted }]}>
          Nie znaleziono wydarzenia
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  back: { paddingVertical: 8, paddingHorizontal: 4, marginBottom: 16, alignSelf: 'flex-start' },
  content: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  meta: { borderTopWidth: 1, paddingTop: 16 },
  metaLabel: { fontSize: 12, fontWeight: '500', letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { fontSize: 15, marginBottom: 12 },
  notFound: { fontSize: 16, textAlign: 'center', marginTop: 80 },
});
