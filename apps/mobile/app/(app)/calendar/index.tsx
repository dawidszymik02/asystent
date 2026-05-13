import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, WeekCalendar, CalendarProvider } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { colors } from '../../../src/theme/colors';
import { useCalendar } from '../../../src/hooks/useCalendar';
import type { CalendarEvent } from '../../../src/store/calendarStore';

type ViewMode = 'day' | 'week' | 'month';

const MODES: { key: ViewMode; label: string }[] = [
  { key: 'day', label: 'Dzień' },
  { key: 'week', label: 'Tydzień' },
  { key: 'month', label: 'Miesiąc' },
];

export default function CalendarScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const { events, isLoading, fetchEvents, fetchCategories } = useCalendar();

  useEffect(() => {
    const now = new Date();
    fetchEvents(startOfMonth(now), endOfMonth(now));
    fetchCategories();
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'month') {
      const date = new Date(selectedDate);
      fetchEvents(startOfMonth(date), endOfMonth(date));
    }
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, object> = {};
    events.forEach((event: CalendarEvent) => {
      const dateKey = event.startTime.split('T')[0];
      marks[dateKey] = { marked: true, dotColor: theme.accent };
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

  const calendarTheme = {
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
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.switcher, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {MODES.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.switcherBtn,
              viewMode === key && { backgroundColor: theme.text },
            ]}
            onPress={() => handleViewModeChange(key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.switcherLabel,
                { color: viewMode === key ? theme.background : theme.textSecondary },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === 'month' && (
        <Calendar
          current={selectedDate}
          onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
          onMonthChange={handleMonthChange}
          markedDates={markedDates}
          theme={calendarTheme}
        />
      )}

      {viewMode === 'week' && (
        <CalendarProvider
          date={selectedDate}
          onDateChanged={(date) => setSelectedDate(date)}
          onMonthChange={handleMonthChange}
          theme={{ ...calendarTheme } as object}
        >
          <WeekCalendar
            markedDates={markedDates}
            theme={calendarTheme}
            firstDay={1}
          />
        </CalendarProvider>
      )}

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <FlatList
        data={dayEvents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={[styles.dateHeader, { color: theme.textSecondary }]}>
            {format(new Date(selectedDate + 'T12:00:00'), 'd MMM yyyy')}
          </Text>
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.textMuted }]}>
            {isLoading ? 'Ładowanie...' : 'Brak wydarzeń'}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.eventItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push(`/(app)/calendar/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.eventAccent, { backgroundColor: item.color ?? theme.accent }]} />
            <View style={styles.eventContent}>
              <Text style={[styles.eventTitle, { color: theme.text }]}>{item.title}</Text>
              {!item.allDay && (
                <Text style={[styles.eventTime, { color: theme.textSecondary }]}>
                  {format(parseISO(item.startTime), 'HH:mm')}
                  {' — '}
                  {format(parseISO(item.endTime), 'HH:mm')}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  switcher: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
  },
  switcherBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  switcherLabel: { fontSize: 13, fontWeight: '500' },
  divider: { height: 1, marginTop: 4 },
  list: { padding: 16, paddingBottom: 32 },
  dateHeader: { fontSize: 13, fontWeight: '500', marginBottom: 12, textTransform: 'capitalize' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  eventItem: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  eventAccent: { width: 3 },
  eventContent: { flex: 1, padding: 14 },
  eventTitle: { fontSize: 15, fontWeight: '500' },
  eventTime: { fontSize: 13, marginTop: 2 },
});
