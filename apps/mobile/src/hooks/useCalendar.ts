import { useCallback } from 'react';
import { api } from '../lib/api';
import { useCalendarStore } from '../store/calendarStore';

export const useCalendar = () => {
  const { events, categories, isLoading, setEvents, setCategories, setLoading } = useCalendarStore();

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

  return { events, categories, isLoading, fetchEvents, fetchCategories };
};
