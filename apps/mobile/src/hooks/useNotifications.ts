import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { isToday, isTomorrow, format } from 'date-fns';
import type { CalendarEvent } from '../store/calendarStore';

const REMINDER_KEY_PREFIX = 'reminders:';

export const useNotifications = () => {
  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Przypomnienia',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  };

  const scheduleReminder = async (event: CalendarEvent): Promise<string | null> => {
    console.log('[Reminder] scheduleReminder called', event.id, event.reminderMinutes);
    if (!event.startTime || event.reminderMinutes == null) {
      return null;
    }

    const startTime = new Date(event.startTime);
    const reminderTime = new Date(startTime.getTime() - event.reminderMinutes * 60 * 1000);
    console.log('[Reminder] reminderTime:', reminderTime, 'now:', new Date(), 'isPast:', reminderTime <= new Date());

    if (reminderTime <= new Date()) {
      console.log('[Reminder] skipping - time in past');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: event.title,
        body: isToday(reminderTime)
            ? `Dziś o ${format(reminderTime, 'HH:mm')}`
            : isTomorrow(reminderTime)
            ? `Jutro o ${format(reminderTime, 'HH:mm')}`
            : `${format(reminderTime, 'd MMM yyyy')} o ${format(reminderTime, 'HH:mm')}`,
        data: { eventId: event.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      },
    });
    console.log('[Reminder] scheduled with id:', notificationId);

    await AsyncStorage.setItem(`${REMINDER_KEY_PREFIX}${event.id}`, notificationId);
    return notificationId;
  };

  const cancelReminder = async (eventId: string): Promise<void> => {
    const key = `${REMINDER_KEY_PREFIX}${eventId}`;
    const notificationId = await AsyncStorage.getItem(key);
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(key);
    }
  };

  const cancelAllReminders = async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const allKeys = await AsyncStorage.getAllKeys();
    const reminderKeys = allKeys.filter((k) => k.startsWith(REMINDER_KEY_PREFIX));
    await AsyncStorage.multiRemove(reminderKeys);
  };

  return { requestPermissions, scheduleReminder, cancelReminder, cancelAllReminders };
};
