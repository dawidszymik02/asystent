import { useMemo } from 'react';
import { startOfWeek, endOfWeek, isToday, isTomorrow, format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useCalendarStore } from '../store/calendarStore';
import { useAuthStore } from '../store/authStore';

export function useCockpit() {
  const { events } = useCalendarStore();
  const { session } = useAuthStore();

  const todayEvents = useMemo(() => {
    return events
      .filter(e => e.startTime != null && isToday(new Date(e.startTime)))
      .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());
  }, [events]);

  const allTomorrowEvents = useMemo(() => {
    return events
      .filter(e => e.startTime != null && isTomorrow(new Date(e.startTime)))
      .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());
  }, [events]);

  const tomorrowEvents = useMemo(() => allTomorrowEvents.slice(0, 3), [allTomorrowEvents]);
  const tomorrowTotal = allTomorrowEvents.length;

  const weekSummary = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date: dateStr,
        dayShort: format(date, 'EEEEEE', { locale: pl }),
        hasEvents: events.some(e => e.startTime != null && format(new Date(e.startTime), 'yyyy-MM-dd') === dateStr),
        isToday: isToday(date),
      };
    });
  }, [events]);

  const totalThisWeek = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    return events.filter(e => {
      if (!e.startTime) return false;
      const d = new Date(e.startTime);
      return d >= weekStart && d <= weekEnd;
    }).length;
  }, [events]);

  const fullName = session?.user?.user_metadata?.full_name;
  const firstName = fullName ? fullName.split(' ')[0] : 'tam';

  return { todayEvents, tomorrowEvents, tomorrowTotal, weekSummary, firstName, totalThisWeek };
}
