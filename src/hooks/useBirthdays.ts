import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BirthdayProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  birth_date: string;
  day: number;
  month: number;
}

/**
 * Parses a date string (ISO YYYY-MM-DD or DD/MM/YYYY) without timezone drift.
 */
function parseBirthDate(raw: string | null | undefined): { day: number; month: number } | null {
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return { month: +iso[2], day: +iso[3] };
  const dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) return { day: +dmy[1], month: +dmy[2] };
  return null;
}

export function useBirthdays() {
  const [birthdays, setBirthdays] = useState<BirthdayProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBirthdays = useCallback(async () => {
    setIsLoading(true);
    const currentMonth = new Date().getMonth() + 1;

    const { data, error } = await (supabase as any).rpc("get_community_birthdays");

    if (error || !data) {
      setIsLoading(false);
      return;
    }

    const monthBirthdays = (data as Array<{
      user_id: string;
      full_name: string;
      avatar_url: string | null;
      birth_day: number;
      birth_month: number;
    }>)
      .filter((p) => p.birth_month === currentMonth)
      .map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        birth_date: "",
        day: p.birth_day,
        month: p.birth_month,
      }) as BirthdayProfile)
      .sort((a, b) => a.day - b.day);

    setBirthdays(monthBirthdays);
    setIsLoading(false);
  }, []);


  useEffect(() => {
    fetchBirthdays();
  }, [fetchBirthdays]);

  const getTodaysBirthdays = useCallback(() => {
    const today = new Date().getDate();
    return birthdays.filter((b) => b.day === today);
  }, [birthdays]);

  const getUpcomingBirthdays = useCallback(() => {
    const today = new Date().getDate();
    return birthdays.filter((b) => b.day > today).slice(0, 5);
  }, [birthdays]);

  const getPastBirthdays = useCallback(() => {
    const today = new Date().getDate();
    return birthdays.filter((b) => b.day < today);
  }, [birthdays]);

  return {
    birthdays,
    isLoading,
    getTodaysBirthdays,
    getUpcomingBirthdays,
    getPastBirthdays,
    refetch: fetchBirthdays,
  };
}
