import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BirthdayProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  birth_date: string;
  day: number;
}

export function useBirthdays() {
  const [birthdays, setBirthdays] = useState<BirthdayProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    setIsLoading(true);
    
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    // Fetch all approved profiles with birth dates
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, birth_date")
      .eq("is_approved", true)
      .not("birth_date", "is", null);

    if (error || !data) {
      setIsLoading(false);
      return;
    }

    // Filter for current month birthdays and extract day
    const monthBirthdays = data
      .filter(profile => {
        if (!profile.birth_date) return false;
        const birthMonth = new Date(profile.birth_date).getMonth() + 1;
        return birthMonth === currentMonth;
      })
      .map(profile => ({
        ...profile,
        day: new Date(profile.birth_date!).getDate(),
      }))
      .sort((a, b) => a.day - b.day);

    setBirthdays(monthBirthdays as BirthdayProfile[]);
    setIsLoading(false);
  };

  const getTodaysBirthdays = () => {
    const today = new Date().getDate();
    return birthdays.filter(b => b.day === today);
  };

  const getUpcomingBirthdays = () => {
    const today = new Date().getDate();
    return birthdays.filter(b => b.day > today).slice(0, 5);
  };

  return {
    birthdays,
    isLoading,
    getTodaysBirthdays,
    getUpcomingBirthdays,
    refetch: fetchBirthdays,
  };
}
