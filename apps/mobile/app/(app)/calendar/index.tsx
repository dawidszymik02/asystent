import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, WeekCalendar, CalendarProvider } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { LocaleConfig } from 'react-native-calendars';
import { colors } from '../../../src/theme/colors';

LocaleConfig.locales['pl'] = {
  monthNames: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
    'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
  monthNamesShort: ['Sty','Lut','Mar','Kwi','Maj','Cze',
    'Lip','Sie','Wrz','Paź','Lis','Gru'],
  dayNames: ['Niedziela','Poniedziałek','Wtorek','Środa',
    'Czwartek','Piątek','Sobota'],
  dayNamesShort: ['Nd','Pn','Wt','Śr','Cz','Pt','Sb'],
};
LocaleConfig.defaultLocale = 'pl';
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
      if (!event.startTime) return;
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
    () => events.filter((e: CalendarEvent) => e.startTime != null && e.startTime.startsWith(selectedDate)),
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

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateToDate = (newDate: string) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
    setSelectedDate(newDate);
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) < 50) return;
      const current = new Date(selectedDate + 'T12:00:00');
      if (viewMode === 'day') {
        g.dx < 0 ? current.setDate(current.getDate() + 1) : current.setDate(current.getDate() - 1);
        animateToDate(format(current, 'yyyy-MM-dd'));
      }
      if (viewMode === 'month') {
        g.dx < 0 ? current.setMonth(current.getMonth() + 1) : current.setMonth(current.getMonth() - 1);
        const newDate = format(current, 'yyyy-MM-dd');
        animateToDate(newDate);
        fetchEvents(startOfMonth(current), endOfMonth(current));
      }
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
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
        <TouchableOpacity
          onPress={() => router.push('/(app)/calendar/reminders')}
          style={styles.bellBtn}
        >
          <Ionicons name="notifications-outline" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View>
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
          <View style={{ height: 85 }}>
            <CalendarProvider
              date={selectedDate}
              onDateChanged={(date) => animateToDate(date)}
              onMonthChange={handleMonthChange}
              theme={{ ...calendarTheme } as object}
              style={{ flex: 1 }}
            >
              <WeekCalendar
                markedDates={markedDates}
                theme={calendarTheme}
                firstDay={1}
              />
            </CalendarProvider>
          </View>
        )}

      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }} {...panResponder.panHandlers}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <FlatList
            style={{ flex: 1 }}
            data={dayEvents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={[styles.listHeaderDay, { color: theme.text }]}>
                  {format(new Date(selectedDate + 'T12:00:00'), 'EEEE', { locale: pl })}
                </Text>
                <Text style={[styles.listHeaderDate, { color: theme.textSecondary }]}>
                  {format(new Date(selectedDate + 'T12:00:00'), 'd MMMM yyyy', { locale: pl })}
                </Text>
              </View>
            }
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.textMuted }]}>
                {isLoading ? 'Ładowanie...' : 'Brak wydarzeń'}
              </Text>
            }
            renderItem={({ item }) => {
              if (!item.startTime) return null;
              return (
              <TouchableOpacity
                style={[styles.eventItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push(`/(app)/calendar/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.eventAccent, { backgroundColor: item.color ?? theme.accent }]} />
                <View style={styles.eventContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eventTitle, { color: theme.text }]}>{item.title}</Text>
                    {item.categoryName && (
                      <View style={[styles.categoryBadge, { backgroundColor: item.categoryColor ?? theme.accentSoft }]}>
                        <Text style={[styles.categoryBadgeText, { color: theme.text }]}>
                          {item.categoryName}
                        </Text>
                      </View>
                    )}
                  </View>
                  {!item.allDay && item.startTime && (
                    <Text style={[styles.eventTime, { color: theme.textSecondary }]}>
                      {format(parseISO(item.startTime), 'HH:mm')}
                      {item.endTime ? `\n${format(parseISO(item.endTime), 'HH:mm')}` : ''}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              );
            }}
          />
      </Animated.View>
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.accent }]}
        onPress={() => router.push(`/(app)/calendar/new?date=${selectedDate}`)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={theme.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  switcher: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
  },
  bellBtn: { padding: 8, marginLeft: 4 },
  switcherBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  switcherLabel: { fontSize: 13, fontWeight: '500' },
  divider: { height: 1, marginTop: 4 },
  list: { padding: 16, paddingBottom: 32 },
  listHeader: { paddingBottom: 12, paddingTop: 4 },
  listHeaderDay: { fontSize: 20, fontWeight: '700', textTransform: 'capitalize' },
  listHeaderDate: { fontSize: 13, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  eventItem: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  eventAccent: { width: 3 },
  eventContent: {
    flex: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventTitle: { fontSize: 15, fontWeight: '500' },
  eventTime: { fontSize: 12, textAlign: 'right', lineHeight: 18 },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '500' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
