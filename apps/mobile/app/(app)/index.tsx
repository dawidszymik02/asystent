import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TextInput } from 'react-native';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, parseISO, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { colors } from '../../src/theme/colors';
import { useCockpit } from '../../src/hooks/useCockpit';
import { useCalendar } from '../../src/hooks/useCalendar';
import { useTasks } from '../../src/hooks/useTasks';

const QUOTES = [
  { text: 'Każdy dzień to nowa szansa, żeby zmienić swoje życie.', author: 'Nieznany' },
  { text: 'Sukces to suma małych wysiłków powtarzanych dzień po dniu.', author: 'R. Collier' },
  { text: 'Nie czekaj na idealny moment. Weź moment i uczyń go idealnym.', author: 'Nieznany' },
  { text: 'Działaj tak, jakby nie można było ponieść porażki.', author: 'W. Churchill' },
  { text: 'Jedynym sposobem na wykonanie dobrej pracy jest kochać to, co się robi.', author: 'Steve Jobs' },
  { text: 'Cel bez planu to tylko marzenie.', author: 'A. de Saint-Exupéry' },
  { text: 'Małe kroki każdego dnia prowadzą do wielkich zmian.', author: 'Nieznany' },
];

const getDailyQuote = () => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
};

const NOTE_KEY = 'cockpit:quick_note';

export default function CockpitScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];
  const { todayEvents, tomorrowEvents, tomorrowTotal, firstName } = useCockpit();
  const { fetchEvents } = useCalendar();
  const { tasks, fetchTasks, toggleComplete } = useTasks();
  const [taskView, setTaskView] = useState<'day' | 'week'>('day');

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) =>
      format(addDays(weekStart, i), 'yyyy-MM-dd')
    ), []);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    fetchEvents(start, end);
  }, []);

  useEffect(() => {
    weekDates.forEach((d) => fetchTasks(d));
  }, []);

  const visibleTasks = useMemo(() => {
    if (taskView === 'day') {
      return tasks.filter((t) => t.date === today);
    }
    return tasks.filter((t) => weekDates.includes(t.date));
  }, [tasks, taskView, today, weekDates]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const [note, setNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const quote = getDailyQuote();

  useEffect(() => {
    AsyncStorage.getItem(NOTE_KEY).then((val) => { if (val) setNote(val); });
  }, []);

  const saveNote = useCallback(async () => {
    await AsyncStorage.setItem(NOTE_KEY, note);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }, [note]);

  const cardStyle = {
    backgroundColor: theme.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Nagłówek */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
            <Text style={{ fontSize: 13, color: theme.textMuted, textTransform: 'capitalize' }}>
              {format(new Date(), 'EEEE, d MMMM', { locale: pl })}
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, marginTop: 4 }}>
              {`Cześć, ${firstName}!`}
            </Text>
            <Text style={[styles.quoteText, { color: theme.textMuted }]}>
              „{quote.text}"
            </Text>
            <Text style={[styles.quoteAuthor, { color: theme.textMuted }]}>
              — {quote.author}
            </Text>
          </View>

          {/* Karta: Dziś */}
          <View style={cardStyle}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={18} color={theme.accent} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Dziś</Text>
              <Text style={[styles.cardCount, { color: theme.textMuted }]}>
                {todayEvents.length} wydarzeń
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            {todayEvents.length === 0 ? (
              <Text style={{ color: theme.textMuted, textAlign: 'center', paddingVertical: 8 }}>
                Brak wydarzeń na dziś
              </Text>
            ) : (
              todayEvents.map(event => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventRow}
                  onPress={() => router.push(`/(app)/calendar/${event.id}`)}
                >
                  <View style={[styles.eventDot, { backgroundColor: (event as any).color ?? theme.accent }]} />
                  <Text style={{ flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500', color: theme.text }}>
                    {event.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>
                    {event.startTime ? format(parseISO(event.startTime), 'HH:mm') : ''}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 10,
                padding: 10,
                alignItems: 'center',
                flexDirection: 'row',
                gap: 8,
                marginTop: 8,
              }}
              onPress={() => router.push('/(app)/calendar/new')}
            >
              <Ionicons name="add-outline" size={18} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary }}>Dodaj wydarzenie</Text>
            </TouchableOpacity>
          </View>

          {/* Karta: Jutro */}
          <View style={cardStyle}>
            <View style={styles.cardHeader}>
              <Ionicons name="chevron-forward-outline" size={18} color={theme.accent} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Jutro</Text>
              <Text style={[styles.cardCount, { color: theme.textMuted }]}>
                {tomorrowTotal} wydarzeń
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            {tomorrowEvents.length === 0 ? (
              <Text style={{ color: theme.textMuted, textAlign: 'center', paddingVertical: 8 }}>
                Brak wydarzeń na jutro
              </Text>
            ) : (
              tomorrowEvents.map(event => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventRow}
                  onPress={() => router.push(`/(app)/calendar/${event.id}`)}
                >
                  <View style={[styles.eventDot, { backgroundColor: (event as any).color ?? theme.accent }]} />
                  <Text style={{ flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500', color: theme.text }}>
                    {event.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: theme.textMuted }}>
                    {event.startTime ? format(parseISO(event.startTime), 'HH:mm') : ''}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            {tomorrowTotal > 3 && (
              <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>
                +{tomorrowTotal - 3} więcej
              </Text>
            )}
          </View>

          {/* Karta: Zadania */}
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle-outline" size={18} color={theme.textMuted} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Zadania</Text>
              <Text style={[styles.cardCount, { color: theme.textMuted }]}>
                {visibleTasks.filter(t => t.completed).length}/{visibleTasks.length}
              </Text>
            </View>

            <View style={[styles.taskSwitcher, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {(['day', 'week'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.taskSwitcherBtn,
                    taskView === mode && { backgroundColor: theme.text }]}
                  onPress={() => setTaskView(mode)}
                >
                  <Text style={[styles.taskSwitcherLabel,
                    { color: taskView === mode ? theme.background : theme.textSecondary }]}>
                    {mode === 'day' ? 'Dziś' : 'Tydzień'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border, marginTop: 12 }]} />

            {visibleTasks.length === 0 ? (
              <Text style={[styles.empty, { color: theme.textMuted }]}>Brak zadań</Text>
            ) : (
              visibleTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskRow, { borderBottomColor: theme.border }]}
                  onPress={() => toggleComplete(task.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.taskCheckbox,
                    { borderColor: task.completed ? theme.accent : theme.border,
                      backgroundColor: task.completed ? theme.accent : 'transparent' }]}>
                    {task.completed && (
                      <Ionicons name="checkmark" size={12} color={theme.background} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle,
                      { color: task.completed ? theme.textMuted : theme.text },
                      task.completed && { textDecorationLine: 'line-through' }]}>
                      {task.title}
                    </Text>
                    {taskView === 'week' && (
                      <Text style={[styles.taskDate, { color: theme.textMuted }]}>
                        {format(new Date(task.date + 'T12:00:00'), 'EEEE', { locale: pl })}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>


          {/* Karta: Szybka notatka */}
          <View style={cardStyle}>
            <View style={styles.cardHeader}>
              <Ionicons name="create-outline" size={18} color={theme.accent} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Szybka notatka</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <TextInput
              value={note}
              onChangeText={(t) => { setNote(t); setNoteSaved(false); }}
              placeholder="Napisz coś..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: theme.background,
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                color: theme.text,
                minHeight: 90,
                textAlignVertical: 'top',
              }}
            />
            <TouchableOpacity
              onPress={saveNote}
              style={{
                marginTop: 8,
                alignSelf: 'flex-end',
                backgroundColor: noteSaved ? theme.accent : theme.surface,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: noteSaved ? theme.background : theme.text, fontSize: 13, fontWeight: '600' }}>
                {noteSaved ? '✓ Zapisano' : 'Zapisz'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Karta: Moduły */}
          <View style={[cardStyle, { marginBottom: 32 }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="grid-outline" size={18} color={theme.accent} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Moduły</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.push('/(app)/calendar')}
                style={{
                  flex: 1,
                  backgroundColor: theme.accent,
                  borderRadius: 12,
                  padding: 14,
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="calendar-outline" size={24} color={theme.background} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: theme.background }}>Kalendarz</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, backgroundColor: theme.surface, borderRadius: 12, padding: 14, alignItems: 'center', gap: 8, opacity: 0.5 }}>
                <Ionicons name="briefcase-outline" size={24} color={theme.textMuted} />
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Praca</Text>
                <Text style={{ fontSize: 10, color: theme.textMuted }}>Wkrótce</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: theme.surface, borderRadius: 12, padding: 14, alignItems: 'center', gap: 8, opacity: 0.5 }}>
                <Ionicons name="barbell-outline" size={24} color={theme.textMuted} />
                <Text style={{ fontSize: 13, color: theme.textMuted }}>Treningi</Text>
                <Text style={{ fontSize: 10, color: theme.textMuted }}>Wkrótce</Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, marginHorizontal: 16, marginBottom: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600' },
  cardCount: { fontSize: 13 },
  divider: { height: 1, marginVertical: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  taskSwitcher: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    marginTop: 12,
    marginBottom: 0,
  },
  taskSwitcherBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  taskSwitcherLabel: { fontSize: 13, fontWeight: '500' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: { fontSize: 15 },
  taskDate: { fontSize: 12, marginTop: 2 },
  empty: { textAlign: 'center', paddingVertical: 12, fontSize: 14 },
  quoteText: { fontSize: 13, fontStyle: 'italic', marginTop: 12, lineHeight: 20 },
  quoteAuthor: { fontSize: 12, marginTop: 4 },
});
