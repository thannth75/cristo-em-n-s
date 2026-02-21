import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Calendar,
  BookOpen,
  Heart,
  MessageCircle,
  Award,
  MapPin,
  BarChart3,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

interface AttendanceData {
  user_id: string;
  full_name: string;
  city: string | null;
  state: string | null;
  total_attendances: number;
  events_attended: number;
  last_attendance: string | null;
}

interface EngagementData {
  user_id: string;
  full_name: string;
  city: string | null;
  state: string | null;
  posts_count: number;
  prayers_count: number;
  testimonies_count: number;
  study_chapters_completed: number;
  devotionals_completed: number;
  quizzes_completed: number;
}

interface MemberProfile {
  user_id: string;
  full_name: string;
  email: string;
  city: string | null;
  state: string | null;
  created_at: string;
  is_approved: boolean | null;
}

const DashboardLider = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLeader, isApproved, isLoading: authLoading } = useAuth();
  
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceData[]>([]);
  const [engagementStats, setEngagementStats] = useState<EngagementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (!isApproved) {
      navigate("/pending");
      return;
    }
    
    if (!isAdmin && !isLeader) {
      navigate("/dashboard");
      return;
    }
    
    fetchAllData();
  }, [authLoading, user, isApproved, isAdmin, isLeader, navigate]);

  const fetchAllData = async () => {
    setIsLoading(true);
    
    const [membersRes, attendanceRes, eventsRes, postsRes, prayersRes, devotionalsRes, achievementsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email, city, state, created_at, is_approved").eq("is_approved", true),
      supabase.from("attendance").select("user_id, checked_in_at, event_id"),
      supabase.from("events").select("id, title, event_date"),
      supabase.from("community_posts").select("user_id"),
      supabase.from("prayer_requests").select("user_id"),
      supabase.from("devotional_progress").select("user_id"),
      supabase.from("user_achievements").select("user_id"),
    ]);

    setMembers(membersRes.data || []);

    // Process attendance data
    const attendanceMap = new Map<string, { count: number; lastDate: string | null; eventsSet: Set<string> }>();
    (attendanceRes.data || []).forEach(a => {
      const existing = attendanceMap.get(a.user_id) || { count: 0, lastDate: null, eventsSet: new Set() };
      existing.count++;
      existing.eventsSet.add(a.event_id);
      if (!existing.lastDate || a.checked_in_at > existing.lastDate) {
        existing.lastDate = a.checked_in_at;
      }
      attendanceMap.set(a.user_id, existing);
    });

    // Build attendance stats
    const attStats: AttendanceData[] = (membersRes.data || []).map(m => {
      const att = attendanceMap.get(m.user_id);
      return {
        user_id: m.user_id,
        full_name: m.full_name,
        city: m.city,
        state: m.state,
        total_attendances: att?.count || 0,
        events_attended: att?.eventsSet.size || 0,
        last_attendance: att?.lastDate || null,
      };
    }).sort((a, b) => b.total_attendances - a.total_attendances);
    setAttendanceStats(attStats);

    // Build engagement stats
    const postCounts = new Map<string, number>();
    (postsRes.data || []).forEach(p => postCounts.set(p.user_id, (postCounts.get(p.user_id) || 0) + 1));
    
    const prayerCounts = new Map<string, number>();
    (prayersRes.data || []).forEach(p => prayerCounts.set(p.user_id, (prayerCounts.get(p.user_id) || 0) + 1));
    
    const devotionalCounts = new Map<string, number>();
    (devotionalsRes.data || []).forEach(d => devotionalCounts.set(d.user_id, (devotionalCounts.get(d.user_id) || 0) + 1));

    const achievementCounts = new Map<string, number>();
    (achievementsRes.data || []).forEach(a => achievementCounts.set(a.user_id, (achievementCounts.get(a.user_id) || 0) + 1));

    const engStats: EngagementData[] = (membersRes.data || []).map(m => ({
      user_id: m.user_id,
      full_name: m.full_name,
      city: m.city,
      state: m.state,
      posts_count: postCounts.get(m.user_id) || 0,
      prayers_count: prayerCounts.get(m.user_id) || 0,
      testimonies_count: 0,
      study_chapters_completed: 0,
      devotionals_completed: devotionalCounts.get(m.user_id) || 0,
      quizzes_completed: achievementCounts.get(m.user_id) || 0,
    })).sort((a, b) => 
      (b.posts_count + b.prayers_count + b.devotionals_completed) - 
      (a.posts_count + a.prayers_count + a.devotionals_completed)
    );
    setEngagementStats(engStats);

    setIsLoading(false);
  };

  // Get unique states and cities for filters
  const states = [...new Set(members.map(m => m.state).filter(Boolean))].sort();
  const cities = [...new Set(
    members
      .filter(m => stateFilter === "all" || m.state === stateFilter)
      .map(m => m.city)
      .filter(Boolean)
  )].sort();

  // Filter data
  const filteredMembers = members.filter(m => 
    (stateFilter === "all" || m.state === stateFilter) &&
    (cityFilter === "all" || m.city === cityFilter)
  );

  const filteredAttendance = attendanceStats.filter(a =>
    (stateFilter === "all" || a.state === stateFilter) &&
    (cityFilter === "all" || a.city === cityFilter)
  );

  const filteredEngagement = engagementStats.filter(e =>
    (stateFilter === "all" || e.state === stateFilter) &&
    (cityFilter === "all" || e.city === cityFilter)
  );

  // Summary stats
  const totalMembers = filteredMembers.length;
  const totalAttendances = filteredAttendance.reduce((sum, a) => sum + a.total_attendances, 0);
  const avgAttendance = totalMembers > 0 ? Math.round(totalAttendances / totalMembers) : 0;
  const activeThisMonth = filteredAttendance.filter(a => {
    if (!a.last_attendance) return false;
    const lastDate = new Date(a.last_attendance);
    const now = new Date();
    return (now.getTime() - lastDate.getTime()) < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const userName = profile?.full_name?.split(" ")[0] || "Líder";

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))' }}>
      <AppHeader userName={userName} />

      <main className="px-3 sm:px-4 py-4 sm:py-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Visão geral da comunidade</p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2"
        >
          <Select value={stateFilter} onValueChange={(v) => { setStateFilter(v); setCityFilter("all"); }}>
            <SelectTrigger className="w-full sm:w-48 rounded-xl">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Estados</SelectItem>
              {states.map(state => (
                <SelectItem key={state} value={state!}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-48 rounded-xl">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Cidades</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city!}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 sm:mb-6 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3"
        >
          <div className="rounded-2xl bg-card p-3 sm:p-4 shadow-md">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{totalMembers}</p>
                <p className="text-xs text-muted-foreground truncate">Membros</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl bg-card p-3 sm:p-4 shadow-md">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gold/20 shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{activeThisMonth}</p>
                <p className="text-xs text-muted-foreground truncate">Ativos (30d)</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl bg-card p-3 sm:p-4 shadow-md">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{totalAttendances}</p>
                <p className="text-xs text-muted-foreground truncate">Presenças</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl bg-card p-3 sm:p-4 shadow-md">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gold/20 shrink-0">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{avgAttendance}</p>
                <p className="text-xs text-muted-foreground truncate">Média</p>
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="attendance" className="text-xs sm:text-sm">Presença</TabsTrigger>
            <TabsTrigger value="engagement" className="text-xs sm:text-sm">Engajamento</TabsTrigger>
            <TabsTrigger value="growth" className="text-xs sm:text-sm">Crescimento</TabsTrigger>
          </TabsList>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <div className="space-y-3">
              <div className="rounded-2xl bg-primary/10 p-4 mb-4">
                <h3 className="font-semibold text-foreground mb-2">Histórico de Frequência</h3>
                <p className="text-sm text-muted-foreground">
                  Membros ordenados por número de presenças registradas
                </p>
              </div>

              {filteredAttendance.slice(0, 20).map((member, index) => (
                <motion.div
                  key={member.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="rounded-2xl bg-card p-4 shadow-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-serif text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{member.full_name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {member.city && <span>{member.city}</span>}
                        {member.state && <span>• {member.state}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{member.total_attendances}</p>
                      <p className="text-xs text-muted-foreground">presenças</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{member.events_attended} eventos únicos</span>
                    <span>Última: {formatDate(member.last_attendance)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement">
            <div className="space-y-3">
              <div className="rounded-2xl bg-gold/10 p-4 mb-4">
                <h3 className="font-semibold text-foreground mb-2">Engajamento na Comunidade</h3>
                <p className="text-sm text-muted-foreground">
                  Posts, orações, devocionais e participação ativa
                </p>
              </div>

              {filteredEngagement.slice(0, 20).map((member, index) => (
                <motion.div
                  key={member.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="rounded-2xl bg-card p-4 shadow-md"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 font-serif text-sm font-semibold text-gold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{member.full_name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {member.city && <span>{member.city}</span>}
                        {member.state && <span>• {member.state}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-xl bg-muted/50 p-2">
                      <MessageCircle className="h-4 w-4 mx-auto text-primary mb-1" />
                      <p className="text-sm font-bold text-foreground">{member.posts_count}</p>
                      <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-2">
                      <Heart className="h-4 w-4 mx-auto text-primary mb-1" />
                      <p className="text-sm font-bold text-foreground">{member.prayers_count}</p>
                      <p className="text-xs text-muted-foreground">Orações</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-2">
                      <BookOpen className="h-4 w-4 mx-auto text-primary mb-1" />
                      <p className="text-sm font-bold text-foreground">{member.devotionals_completed}</p>
                      <p className="text-xs text-muted-foreground">Devocionais</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-2">
                      <Award className="h-4 w-4 mx-auto text-gold mb-1" />
                      <p className="text-sm font-bold text-foreground">{member.quizzes_completed}</p>
                      <p className="text-xs text-muted-foreground">Conquistas</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Growth Tab */}
          <TabsContent value="growth">
            <div className="space-y-4">
              <div className="rounded-2xl bg-primary/10 p-4">
                <h3 className="font-semibold text-foreground mb-2">Crescimento Espiritual</h3>
                <p className="text-sm text-muted-foreground">
                  Acompanhamento do progresso nos estudos e devocionais
                </p>
              </div>

              {/* Location summary */}
              <div className="rounded-2xl bg-card p-4 shadow-md">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Distribuição por Localidade
                </h4>
                <div className="space-y-2">
                  {states.slice(0, 5).map(state => {
                    const stateMembers = members.filter(m => m.state === state);
                    const percent = Math.round((stateMembers.length / members.length) * 100);
                    return (
                      <div key={state}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground">{state}</span>
                          <span className="text-muted-foreground">{stateMembers.length} membros</span>
                        </div>
                        <Progress value={percent} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top performers */}
              <div className="rounded-2xl bg-card p-4 shadow-md">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-gold" />
                  Destaques do Mês
                </h4>
                <div className="space-y-3">
                  {filteredAttendance.slice(0, 3).map((member, index) => (
                    <div key={member.user_id} className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                        index === 0 ? "bg-gold/20 text-gold" : 
                        index === 1 ? "bg-muted text-muted-foreground" :
                        "bg-amber-900/20 text-amber-700"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{member.full_name}</p>
                        <p className="text-xs text-muted-foreground">{member.total_attendances} presenças</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default DashboardLider;
