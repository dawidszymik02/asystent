import { create } from 'zustand';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  categoryId?: string;
  recurrenceRule?: string;
  recurrenceParentId?: string;
  occurrenceDate?: string;
}

export interface CalendarCategory {
  id: string;
  name: string;
  color: string;
}

interface CalendarState {
  events: CalendarEvent[];
  categories: CalendarCategory[];
  isLoading: boolean;
  setEvents: (events: CalendarEvent[]) => void;
  setCategories: (categories: CalendarCategory[]) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  categories: [],
  isLoading: false,
  setEvents: (events) => set({ events }),
  setCategories: (categories) => set({ categories }),
  setLoading: (isLoading) => set({ isLoading }),
}));
