import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "./usePushNotifications";

interface PrayerReminder {
  id: string;
  reminder_time: string;
  reminder_type: string;
  is_active: boolean;
}

const LAST_TRIGGERED_KEY = "prayer_reminder_last_triggered";

const getReminderTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    manha: "Oração da Manhã",
    tarde: "Oração da Tarde",
    noite: "Oração da Noite",
    personalizado: "Momento de Oração",
  };
  return types[type] || "Momento de Oração";
};

const getReminderMessage = (type: string): string => {
  const messages: Record<string, string> = {
    manha: "🌅 Bom dia! É hora de começar o dia com Deus em oração.",
    tarde: "☀️ Pause um momento e converse com Deus nesta tarde.",
    noite: "🌙 Encerre o dia em paz. Agradeça e entregue suas preocupações a Deus.",
    personalizado: "🙏 Este é seu momento reservado para oração. Deus está esperando você!",
  };
  return messages[type] || "🙏 É hora de orar! Reserve este momento para Deus.";
};

export function usePrayerReminderScheduler(userId: string | undefined) {
  const { isEnabled, sendLocalNotification } = usePushNotifications();
  const intervalRef = useRef<number | null>(null);
  const remindersRef = useRef<PrayerReminder[]>([]);

  const getLastTriggered = useCallback((): Record<string, string> => {
    try {
      const stored = localStorage.getItem(LAST_TRIGGERED_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  const setLastTriggered = useCallback((reminderId: string, date: string) => {
    const current = getLastTriggered();
    current[reminderId] = date;
    localStorage.setItem(LAST_TRIGGERED_KEY, JSON.stringify(current));
  }, [getLastTriggered]);

  const wasTriggeredToday = useCallback((reminderId: string): boolean => {
    const lastTriggered = getLastTriggered();
    const today = new Date().toISOString().split("T")[0];
    return lastTriggered[reminderId] === today;
  }, [getLastTriggered]);

  const checkAndTriggerReminders = useCallback(() => {
    if (!isEnabled || !userId) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const today = now.toISOString().split("T")[0];

    remindersRef.current.forEach((reminder) => {
      if (!reminder.is_active) return;

      const reminderTime = reminder.reminder_time.slice(0, 5);

      if (reminderTime === currentTime && !wasTriggeredToday(reminder.id)) {
        // Trigger notification
        sendLocalNotification(getReminderTypeLabel(reminder.reminder_type), {
          body: getReminderMessage(reminder.reminder_type),
          tag: `prayer-reminder-${reminder.id}`,
          requireInteraction: true,
        });

        // Mark as triggered today
        setLastTriggered(reminder.id, today);

        console.log(`[PrayerScheduler] Triggered reminder: ${reminder.id} at ${currentTime}`);
      }
    });
  }, [isEnabled, userId, wasTriggeredToday, sendLocalNotification, setLastTriggered]);

  const fetchReminders = useCallback(async () => {
    if (!userId) return;

    const { data } = await supabase
      .from("prayer_reminders")
      .select("id, reminder_time, reminder_type, is_active")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (data) {
      remindersRef.current = data;
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !isEnabled) return;

    // Initial fetch
    fetchReminders();

    // Set up real-time subscription for changes
    const channel = supabase
      .channel("prayer_reminders_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prayer_reminders",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchReminders();
        }
      )
      .subscribe();

    // Check every minute
    intervalRef.current = window.setInterval(() => {
      checkAndTriggerReminders();
    }, 60000); // Check every 60 seconds

    // Also check immediately
    checkAndTriggerReminders();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [userId, isEnabled, fetchReminders, checkAndTriggerReminders]);

  return {
    refreshReminders: fetchReminders,
  };
}
