import { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { colors } from '../../../src/theme/colors';
import { useCalendarStore, type CalendarEvent } from '../../../src/store/calendarStore';

type ReminderItem = CalendarEvent & { reminderTime: Date };

function formatOffset(minutes: number): string {
  if (minutes < 60) return `${minutes} min przed`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} godz. przed`;
  return `${Math.round(minutes / 1440)} dni przed`;
}

export default function RemindersScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];
  const router = useRouter();
  const events = useCalendarStore((s) => s.events);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const withReminder: ReminderItem[] = events
      .filter((e): e is CalendarEvent & { reminderMinutes: number } => e.reminderMinutes != null)
      .map((e) => ({
        ...e,
        reminderTime: new Date(new Date(e.startTime).getTime() - e.reminderMinutes * 60 * 1000),
      }))
      .sort((a, b) => a.reminderTime.getTime() - b.reminderTime.getTime());

    return {
      upcoming: withReminder.filter((e) => e.reminderTime >= now),
      past: withReminder.filter((e) => e.reminderTime < now),
    };
  }, [events]);

  const sections = [
    { title: 'Nadchodzące', data: upcoming },
    { title: 'Minione', data: past },
  ].filter((s) => s.data.length > 0);

  const isEmpty = upcoming.length === 0 && past.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      {isEmpty ? (
        <Text style={[styles.empty, { color: theme.textMuted }]}>Brak przypomnień</Text>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push(`/(app)/calendar/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.accent, { backgroundColor: item.color ?? theme.accent }]} />
              <View style={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.time, { color: theme.textSecondary }]}>
                  {format(item.reminderTime, 'd MMM yyyy, HH:mm')}
                </Text>
                <Text style={[styles.offset, { color: theme.textMuted }]}>
                  {formatOffset(item.reminderMinutes)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 32 },
  empty: { flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 14 },
  sectionHeader: { fontSize: 13, fontWeight: '600', paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accent: { width: 4 },
  content: { flex: 1, padding: 14 },
  title: { fontSize: 15, fontWeight: '600' },
  time: { fontSize: 13, marginTop: 2 },
  offset: { fontSize: 12, marginTop: 2 },
});
