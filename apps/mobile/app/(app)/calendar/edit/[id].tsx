import { View, Text } from 'react-native';
import { useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../../../src/theme/colors';
import { useCalendarStore } from '../../../../src/store/calendarStore';
import { useCalendar } from '../../../../src/hooks/useCalendar';
import { EventForm } from '../../../../src/components/calendar/EventForm';
import type { CreateEventPayload } from '../../../../src/store/calendarStore';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];
  const router = useRouter();
  const event = useCalendarStore((state) => state.events.find((e) => e.id === id));
  const { updateEvent } = useCalendar();

  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.textMuted, fontSize: 16 }}>Nie znaleziono wydarzenia</Text>
      </View>
    );
  }

  const initialValues: CreateEventPayload = {
    title: event.title,
    description: event.description,
    startTime: event.startTime,
    endTime: event.endTime,
    isAllDay: event.allDay,
    categoryId: event.categoryId,
    location: event.location,
    color: event.color,
    recurrenceRule: event.recurrenceRule,
    reminderMinutes: event.reminderMinutes,
  };

  const handleSubmit = async (payload: CreateEventPayload) => {
    await updateEvent(id, payload);
    router.back();
  };

  return (
    <EventForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Zapisz zmiany" />
  );
}
