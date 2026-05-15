import { useCallback } from 'react';
import { api } from '../lib/api';
import {
  CalendarEvent,
  CreateEventPayload,
  UpdateEventPayload,
  useCalendarStore,
} from '../store/calendarStore';
import type { DeleteMode } from '../constants/recurrence';
import { useNotifications } from './useNotifications';

export const useCalendar = () => {
  const { scheduleReminder, cancelReminder } = useNotifications();

  const {
    events,
    categories,
    isLoading,
    setEvents,
    setCategories,
    setLoading,
    addEvent,
    updateEventById,
    removeEvent,
  } = useCalendarStore();

  const fetchEvents = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    try {
      const response = await api.get('/calendar/events', {
        params: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
      });
      setEvents(response.data.data ?? []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setEvents]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/calendar/categories');
      setCategories(response.data.data ?? []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, [setCategories]);

  const createEvent = useCallback(async (payload: CreateEventPayload): Promise<CalendarEvent> => {
    const response = await api.post('/calendar/events', payload);
    const created: CalendarEvent = response.data.data;
    addEvent(created);
    await scheduleReminder(created);
    return created;
  }, [addEvent, scheduleReminder]);

  const updateEvent = useCallback(async (id: string, payload: UpdateEventPayload): Promise<CalendarEvent> => {
    const response = await api.put(`/calendar/events/${id}`, payload);
    const updated: CalendarEvent = response.data.data;
    updateEventById(id, updated);
    await cancelReminder(id);
    await scheduleReminder(updated);
    return updated;
  }, [updateEventById, cancelReminder, scheduleReminder]);

  const deleteEvent = useCallback(async (
    id: string,
    mode: DeleteMode,
    occurrenceDate?: string,
  ): Promise<void> => {
    const params: Record<string, string> = { deleteMode: mode };
    if (occurrenceDate !== undefined) {
      params.occurrenceDate = occurrenceDate;
    }
    await api.delete(`/calendar/events/${id}`, { params });
    removeEvent(id);
    await cancelReminder(id);
  }, [removeEvent, cancelReminder]);

  return {
    events,
    categories,
    isLoading,
    fetchEvents,
    fetchCategories,
    createEvent,
    updateEvent,
    deleteEvent,
  };
};
