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
  color?: string;
  location?: string;
  categoryName?: string;
  categoryColor?: string;
  reminderMinutes?: number;
}

export interface CalendarCategory {
  id: string;
  name: string;
  color: string;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  isAllDay?: boolean;
  categoryId?: string;
  location?: string;
  color?: string;
  recurrenceRule?: string;
  recurrenceEndDate?: string;
  reminderMinutes?: number;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {}

interface CalendarState {
  events: CalendarEvent[];
  categories: CalendarCategory[];
  isLoading: boolean;
  setEvents: (events: CalendarEvent[]) => void;
  setCategories: (categories: CalendarCategory[]) => void;
  setLoading: (isLoading: boolean) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEventById: (id: string, event: CalendarEvent) => void;
  removeEvent: (id: string) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  categories: [],
  isLoading: false,
  setEvents: (events) => set({ events }),
  setCategories: (categories) => set({ categories }),
  setLoading: (isLoading) => set({ isLoading }),
  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, event].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      ),
    })),
  updateEventById: (id, event) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? event : e)),
    })),
  removeEvent: (id) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    })),
}));
