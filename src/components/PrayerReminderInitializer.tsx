import { useAuth } from "@/hooks/useAuth";
import { usePrayerReminderScheduler } from "@/hooks/usePrayerReminderScheduler";

/**
 * Mounts the local prayer reminder scheduler globally so notifications
 * fire on any page (not only LembretesOracao) while the app is open.
 * Server-side push (send-prayer-reminders edge function) handles the
 * case where the app is closed.
 */
const PrayerReminderInitializer = () => {
  const { user } = useAuth();
  usePrayerReminderScheduler(user?.id);
  return null;
};

export default PrayerReminderInitializer;
