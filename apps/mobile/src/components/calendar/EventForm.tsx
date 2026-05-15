import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useColorScheme } from 'react-native';
import { format, addHours } from 'date-fns';
import { colors } from '../../theme/colors';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCalendar } from '../../hooks/useCalendar';
import type { CreateEventPayload } from '../../store/calendarStore';
import { RECURRENCE_OPTIONS } from '../../constants/recurrence';

const COLOR_OPTIONS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#FFFFFF',
] as const;

interface EventFormProps {
  initialValues?: Partial<CreateEventPayload>;
  onSubmit: (payload: CreateEventPayload) => Promise<void>;
  submitLabel: string;
}

type DatePickerField = 'startDate' | 'startTime' | 'endDate' | 'endTime' | 'recurrenceEndDate' | 'reminderDate' | 'reminderTime';
type CategoryOption = { id: string | null; name: string; color: string };

export const EventForm: React.FC<EventFormProps> = ({ initialValues, onSubmit, submitLabel }) => {
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];
  const { categories } = useCalendar();

  const initStart = initialValues?.startTime ? new Date(initialValues.startTime) : new Date();
  const initEnd = initialValues?.endTime ? new Date(initialValues.endTime) : addHours(initStart, 1);
  const initReminderBase = initialValues?.reminderMinutes != null
    ? new Date(initStart.getTime() - initialValues.reminderMinutes * 60 * 1000)
    : new Date(initStart.getTime() - 24 * 60 * 60 * 1000);

  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [isAllDay, setIsAllDay] = useState(initialValues?.isAllDay ?? false);
  const [startDate, setStartDate] = useState<Date>(initStart);
  const [endDate, setEndDate] = useState<Date>(initEnd);
  const [categoryId, setCategoryId] = useState<string | null>(initialValues?.categoryId ?? null);
  const [color, setColor] = useState<string | undefined>(initialValues?.color);
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(
    initialValues?.recurrenceRule ?? null,
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(
    initialValues?.recurrenceEndDate ? new Date(initialValues.recurrenceEndDate) : null,
  );
  const [hasEndTime, setHasEndTime] = useState(!!initialValues?.endTime);
  const [hasReminder, setHasReminder] = useState(true);
  const [reminderDate, setReminderDate] = useState<Date>(initReminderBase);
  const [reminderTime, setReminderTime] = useState<Date>(initReminderBase);
  const [pickerField, setPickerField] = useState<DatePickerField | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions: CategoryOption[] = [{ id: null, name: 'Brak', color: theme.accent }, ...categories];

  const openPicker = (field: DatePickerField) => {
    if (Platform.OS === 'ios') {
      setPickerField(prev => (prev === field ? null : field));
    } else {
      setPickerField(field);
    }
  };

  const getPickerValue = (): Date => {
    switch (pickerField) {
      case 'startDate':
      case 'startTime':
        return startDate;
      case 'endDate':
      case 'endTime':
        return endDate;
      case 'recurrenceEndDate':
        return recurrenceEndDate ?? new Date();
      case 'reminderDate':
      case 'reminderTime':
        return reminderDate;
      default:
        return new Date();
    }
  };

  const handleDateChange = (_e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setPickerField(null);
    if (!date) return;

    switch (pickerField) {
      case 'startDate': {
        const next = new Date(startDate);
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setStartDate(next);
        if (endDate < next) {
          const alignedEnd = new Date(endDate);
          alignedEnd.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
          setEndDate(alignedEnd);
        }
        const newReminder1 = new Date(next.getTime() - 24 * 60 * 60 * 1000);
        setReminderDate(newReminder1);
        setReminderTime(newReminder1);
        break;
      }
      case 'startTime': {
        const next = new Date(startDate);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        setStartDate(next);
        if (endDate < next) {
          const alignedEnd = new Date(endDate);
          alignedEnd.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
          setEndDate(alignedEnd);
        }
        const newReminder2 = new Date(next.getTime() - 24 * 60 * 60 * 1000);
        setReminderDate(newReminder2);
        setReminderTime(newReminder2);
        break;
      }
      case 'endDate': {
        const next = new Date(endDate);
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setEndDate(next);
        break;
      }
      case 'endTime': {
        const next = new Date(endDate);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        setEndDate(next);
        break;
      }
      case 'recurrenceEndDate':
        setRecurrenceEndDate(date);
        break;
      case 'reminderDate': {
        const next = new Date(reminderDate);
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setReminderDate(next);
        break;
      }
      case 'reminderTime': {
        const next = new Date(reminderDate);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        setReminderDate(next);
        setReminderTime(next);
        break;
      }
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Błąd', 'Tytuł nie może być pusty');
      return;
    }
    if (hasEndTime && !isAllDay && endDate <= startDate) {
      Alert.alert('Błąd', 'Czas zakończenia musi być po czasie rozpoczęcia');
      return;
    }

    let reminderMinutes: number | undefined = undefined;
    if (hasReminder) {
      const reminderDateTime = new Date(reminderDate);
      reminderDateTime.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0);
      const diffMs = new Date(startDate).getTime() - reminderDateTime.getTime();
      const diffMinutes = Math.round(diffMs / 60000);
      if (diffMinutes > 0) reminderMinutes = diffMinutes;
    }

    const payload: CreateEventPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: startDate.toISOString(),
      endTime: hasEndTime && !isAllDay ? endDate.toISOString() : undefined,
      isAllDay,
      categoryId: categoryId ?? undefined,
      color,
      recurrenceRule: recurrenceRule ?? undefined,
      recurrenceEndDate: recurrenceEndDate?.toISOString() ?? undefined,
      reminderMinutes,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nieznany błąd';
      Alert.alert('Błąd', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const pickerMode: 'date' | 'time' =
    pickerField === 'startTime' || pickerField === 'endTime' || pickerField === 'reminderTime' ? 'time' : 'date';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[styles.flex, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Tytuł"
          value={title}
          onChangeText={setTitle}
          placeholder="Nazwa wydarzenia"
        />

        <Input
          label="Opis"
          value={description}
          onChangeText={setDescription}
          placeholder="Opcjonalny opis"
          multiline
          numberOfLines={3}
          style={styles.multilineInput}
        />

        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.text }]}>Całodniowe</Text>
          <Switch
            value={isAllDay}
            onValueChange={setIsAllDay}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor={theme.background}
          />
        </View>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Data i godzina startu</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.dateBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => openPicker('startDate')}
          >
            <Text style={{ color: theme.text }}>{format(startDate, 'd MMM yyyy')}</Text>
          </TouchableOpacity>
          {!isAllDay && (
            <TouchableOpacity
              style={[styles.timeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => openPicker('startTime')}
            >
              <Text style={{ color: theme.text }}>{format(startDate, 'HH:mm')}</Text>
            </TouchableOpacity>
          )}
        </View>
        {(pickerField === 'startDate' || pickerField === 'startTime') && (
          <DateTimePicker
            value={getPickerValue()}
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handleDateChange}
          />
        )}

        {!isAllDay && (
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>Ustaw godzinę zakończenia</Text>
            <Switch
              value={hasEndTime}
              onValueChange={(val) => {
                setHasEndTime(val);
                if (val) setEndDate(addHours(startDate, 1));
              }}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={theme.background}
            />
          </View>
        )}

        {!isAllDay && hasEndTime && (
          <>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 8 }]}>
              Data i godzina końca
            </Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.dateBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => openPicker('endDate')}
              >
                <Text style={{ color: theme.text }}>{format(endDate, 'd MMM yyyy')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => openPicker('endTime')}
              >
                <Text style={{ color: theme.text }}>{format(endDate, 'HH:mm')}</Text>
              </TouchableOpacity>
            </View>
            {(pickerField === 'endDate' || pickerField === 'endTime') && (
              <DateTimePicker
                value={getPickerValue()}
                mode={pickerMode}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleDateChange}
              />
            )}
          </>
        )}

        <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 8 }]}>Kategoria</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroll}
        >
          {categoryOptions.map((cat) => {
            const isActive = categoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id ?? 'none'}
                style={[
                  styles.chip,
                  isActive
                    ? { backgroundColor: theme.accent, borderColor: theme.accent }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text style={[styles.chipText, { color: isActive ? theme.background : theme.text }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 8 }]}>Kolor</Text>
        <View style={styles.colorRow}>
          {COLOR_OPTIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorCircle,
                { backgroundColor: c },
                { borderWidth: 2, borderColor: color === c ? theme.text : 'transparent' },
              ]}
              onPress={() => setColor(color === c ? undefined : c)}
            />
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 8 }]}>Powtarzanie</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroll}
        >
          {RECURRENCE_OPTIONS.map((opt) => {
            const isActive = recurrenceRule === opt.value;
            return (
              <TouchableOpacity
                key={opt.value ?? 'none'}
                style={[
                  styles.chip,
                  isActive
                    ? { backgroundColor: theme.accent, borderColor: theme.accent }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => setRecurrenceRule(opt.value)}
              >
                <Text style={[styles.chipText, { color: isActive ? theme.background : theme.text }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {recurrenceRule !== null && (
          <>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 8 }]}>
              Powtarzaj do
            </Text>
            <TouchableOpacity
              style={[styles.recEndBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => openPicker('recurrenceEndDate')}
            >
              <Text style={{ color: theme.text }}>
                {recurrenceEndDate ? format(recurrenceEndDate, 'd MMM yyyy') : 'Nieokreślony koniec'}
              </Text>
            </TouchableOpacity>
            {pickerField === 'recurrenceEndDate' && (
              <DateTimePicker
                value={getPickerValue()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleDateChange}
              />
            )}
          </>
        )}

        <View style={[styles.toggleRow, { marginTop: 16 }]}>
          <Text style={[styles.toggleLabel, { color: theme.text }]}>Przypomnienie</Text>
          <Switch
            value={hasReminder}
            onValueChange={setHasReminder}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor={theme.background}
          />
        </View>

        {hasReminder && (
          <>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.dateBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => openPicker('reminderDate')}
              >
                <Text style={{ color: theme.text }}>{format(reminderDate, 'd MMM yyyy')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => openPicker('reminderTime')}
              >
                <Text style={{ color: theme.text }}>{format(reminderDate, 'HH:mm')}</Text>
              </TouchableOpacity>
            </View>
            {(pickerField === 'reminderDate' || pickerField === 'reminderTime') && (
              <DateTimePicker
                value={getPickerValue()}
                mode={pickerMode}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleDateChange}
              />
            )}
          </>
        )}

        <View style={styles.submitContainer}>
          <Button title={submitLabel} onPress={handleSubmit} loading={submitting} variant="primary" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  multilineInput: { height: 80, textAlignVertical: 'top' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: { fontSize: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8, letterSpacing: 0.2 },
  dateRow: { flexDirection: 'row', marginBottom: 8 },
  dateBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  timeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 72,
  },
  chipScroll: { marginBottom: 8 },
  chipRow: { paddingRight: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: { fontSize: 13 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  colorCircle: { width: 32, height: 32, borderRadius: 16, marginRight: 10, marginBottom: 8 },
  recEndBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  submitContainer: { marginTop: 24 },
});
