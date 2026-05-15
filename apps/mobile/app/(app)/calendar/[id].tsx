import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { colors } from '../../../src/theme/colors';
import { useCalendarStore } from '../../../src/store/calendarStore';
import { useCalendar } from '../../../src/hooks/useCalendar';
import { Button } from '../../../src/components/ui/Button';
import { RECURRENCE_OPTIONS, DELETE_MODE_OPTIONS } from '../../../src/constants/recurrence';
import type { DeleteMode } from '../../../src/constants/recurrence';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];
  const router = useRouter();
  const event = useCalendarStore((state) => state.events.find((e) => e.id === id));
  const { deleteEvent } = useCalendar();
  const navigation = useNavigation();

  useEffect(() => {
    if (event?.title) navigation.setOptions({ title: event.title });
  }, [event?.title]);

  const doDelete = async (mode: DeleteMode, occurrenceDate?: string) => {
    try {
      await deleteEvent(id, mode, occurrenceDate);
      router.replace('/(app)/calendar');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nieznany błąd';
      Alert.alert('Błąd', msg);
    }
  };

  const handleDelete = () => {
    if (!event) return;

    const confirmDelete = () => {
      if (event.recurrenceRule) {
        if (Platform.OS === 'ios') {
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: [...DELETE_MODE_OPTIONS.map((o) => o.label), 'Anuluj'],
              destructiveButtonIndex: 2,
              cancelButtonIndex: 3,
            },
            (buttonIndex) => {
              if (buttonIndex < DELETE_MODE_OPTIONS.length) {
                doDelete(DELETE_MODE_OPTIONS[buttonIndex].value);
              }
            },
          );
        } else {
          Alert.alert('Usuń wydarzenie', 'Wybierz zakres usunięcia', [
            ...DELETE_MODE_OPTIONS.map((opt) => ({
              text: opt.label,
              onPress: () => doDelete(opt.value),
            })),
            { text: 'Anuluj', style: 'cancel' as const },
          ]);
        }
      } else {
        doDelete('all');
      }
    };

    Alert.alert('Usuń wydarzenie', 'Czy na pewno chcesz usunąć to wydarzenie?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: confirmDelete },
    ]);
  };

  if (!event) {
    return (
      <View style={[styles.notFoundContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.notFoundText, { color: theme.textMuted }]}>
          Nie znaleziono wydarzenia
        </Text>
        <Button title="Wróć" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  const recurrenceLabel = event.recurrenceRule
    ? RECURRENCE_OPTIONS.find((o) => o.value === event.recurrenceRule)?.label
    : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.accentBar, { backgroundColor: event.color ?? theme.accent }]} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{event.title}</Text>

        {event.allDay ? (
          <View style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.chipText, { color: theme.textSecondary }]}>Cały dzień</Text>
          </View>
        ) : (
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
            {format(parseISO(event.startTime), 'd MMM yyyy, HH:mm', { locale: pl })}
            {event.endTime ? ` – ${format(parseISO(event.endTime), 'HH:mm')}` : ''}
          </Text>
        )}

        {event.categoryName && (
          <View
            style={[
              styles.chip,
              { backgroundColor: event.categoryColor ?? theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.chipText, { color: theme.text }]}>{event.categoryName}</Text>
          </View>
        )}

        {event.location && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>{event.location}</Text>
          </View>
        )}

        {event.description && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Opis</Text>
            <Text style={[styles.descriptionText, { color: theme.text }]}>{event.description}</Text>
          </View>
        )}

        {recurrenceLabel && (
          <View style={styles.metaRow}>
            <Ionicons name="repeat-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>{recurrenceLabel}</Text>
          </View>
        )}

        <View style={[styles.actions, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push(`/(app)/calendar/edit/${id}`)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={18} color={theme.text} />
            <Text style={[styles.actionBtnText, { color: theme.text }]}>Edytuj</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.error }]}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={theme.error} />
            <Text style={[styles.actionBtnText, { color: theme.error }]}>Usuń</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  accentBar: { height: 4 },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  dateText: { fontSize: 15, marginBottom: 12 },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  chipText: { fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaText: { fontSize: 14, marginLeft: 8 },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '500', letterSpacing: 0.5, marginBottom: 4 },
  descriptionText: { fontSize: 15, lineHeight: 22 },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 15, fontWeight: '600' },
  notFoundContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundText: { fontSize: 16, marginBottom: 16 },
});
