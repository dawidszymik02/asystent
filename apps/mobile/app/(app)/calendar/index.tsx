import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { colors } from '../../../src/theme/colors';
import { useCalendar } from '../../../src/hooks/useCalendar';
import type { CalendarEvent } from '../../../src/store/calendarStore';

export default function CalendarScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const { events, isLoading, fetchEvents, fetchCategories } = useCalendar();

  useEffect(() => {
    const now = new Date();
    fetchEvents(startOfMonth(now), endOfMonth(now));
    fetchCategories();
  }, []);

  const markedDates = useMemo(() => {
    const marks: Record<string, object> = {};
    events.forEach((event: CalendarEvent) => {
      const dateKey = event.startTime.split('T')[0];
      marks[dateKey] = { marked: true, dotColor: theme.textSecondary };
    });
    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      selectedColor: theme.accent,
      selectedTextColor: theme.background,
    };
    return marks;
  }, [events, selectedDate, theme]);

  const dayEvents = useMemo(
    () => events.filter((e: CalendarEvent) => e.startTime.startsWith(selectedDate)),
    [events, selectedDate],
  );

  const handleMonthChange = (month: { year: number; month: number }) => {
    const from = new Date(month.year, month.month - 1, 1);
    fetchEvents(from, endOfMonth(from));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Calendar
        current={today}
        onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
        onMonthChange={handleMonthChange}
        markedDates={markedDates}
        theme={{
          backgroundColor: theme.background,
          calendarBackground: theme.background,
          dayTextColor: theme.text,
          textDisabledColor: theme.textMuted,
          monthTextColor: theme.text,
          arrowColor: theme.text,
          selectedDayBackgroundColor: theme.accent,
          selectedDayTextColor: theme.background,
          todayTextColor: theme.accent,
          dotColor: theme.accent,
          indicatorColor: theme.accent,
          textSectionTitleColor: theme.textSecondary,
        }}
      />
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      <FlatList
        data={dayEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.textMuted }]}>
            {isLoading ? 'Ładowanie...' : 'Brak wydarzeń'}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.eventItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push(`/(app)/calendar/${item.id}`)}
          >
            <Text style={[styles.eventTitle, { color: theme.text }]}>{item.title}</Text>
            {!item.allDay && (
              <Text style={[styles.eventTime, { color: theme.textSecondary }]}>
                {format(parseISO(item.startTime), 'HH:mm')}
                {' — '}
                {format(parseISO(item.endTime), 'HH:mm')}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  divider: { height: 1 },
  list: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  eventItem: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  eventTitle: { fontSize: 15, fontWeight: '500' },
  eventTime: { fontSize: 13, marginTop: 2 },
});
