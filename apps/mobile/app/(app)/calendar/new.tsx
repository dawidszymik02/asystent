import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCalendar } from '../../../src/hooks/useCalendar';
import { EventForm } from '../../../src/components/calendar/EventForm';
import type { CreateEventPayload } from '../../../src/store/calendarStore';

export default function NewEventScreen() {
  const router = useRouter();
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
