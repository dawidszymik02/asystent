import { useEffect } from 'react';
import { TouchableOpacity, Text, useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCalendar } from '../../../src/hooks/useCalendar';
import { EventForm } from '../../../src/components/calendar/EventForm';
import type { CreateEventPayload } from '../../../src/store/calendarStore';
import { colors } from '../../../src/theme/colors';

export default function NewEventScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 16 }}>
          <Text style={{ fontSize: 16, color: theme.textSecondary }}>Anuluj</Text>
        </TouchableOpacity>
      ),
    });
  }, []);
  const params = useLocalSearchParams<{ date?: string }>();
  const { createEvent } = useCalendar();

  const initialValues: Partial<CreateEventPayload> = {
    startTime: params.date
      ? new Date(params.date + 'T09:00:00').toISOString()
      : new Date().toISOString(),
  };

  const handleSubmit = async (payload: CreateEventPayload) => {
    await createEvent(payload);
    router.back();
  };

  return (
    <EventForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Utwórz wydarzenie" />
  );
}
