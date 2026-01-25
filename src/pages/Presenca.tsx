import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Calendar, Check, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

interface Event {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  event_id: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  is_approved: boolean | null;
}

const Presenca = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isAdmin, isLeader, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [members, setMembers] = useState<Profile[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isApproved) {
        navigate("/pending");
      }
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (isApproved) {
      fetchEvents();
      if (isAdmin || isLeader) {
        fetchMembers();
      }
    }
  }, [isApproved, isAdmin, isLeader]);

  useEffect(() => {
    if (selectedEvent) {
      fetchAttendance(selectedEvent);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title, event_date, start_time")
      .order("event_date", { ascending: false })
      .limit(20);

    setEvents(data || []);
    if (data && data.length > 0) {
      setSelectedEvent(data[0].id);
    }
    setIsLoading(false);
  };

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, is_approved")
      .eq("is_approved", true)
      .order("full_name");

    setMembers(data || []);
  };

  const fetchAttendance = async (eventId: string) => {
    const { data } = await supabase
      .from("attendance")
      .select("id, user_id, event_id")
      .eq("event_id", eventId);

    setAttendance(data || []);
  };

  const toggleAttendance = async (memberId: string) => {
    const existing = attendance.find(
      (a) => a.user_id === memberId && a.event_id === selectedEvent
    );

    if (existing) {
      await supabase.from("attendance").delete().eq("id", existing.id);
      toast({ title: "Presença removida" });
    } else {
      await supabase.from("attendance").insert({
        event_id: selectedEvent,
        user_id: memberId,
        checked_by: user?.id,
      });
      toast({ title: "Presença registrada! ✅" });
    }
    fetchAttendance(selectedEvent);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";
  const canManage = isAdmin || isLeader;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const selectedEventData = events.find((e) => e.id === selectedEvent);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader userName={userName} />

      <main className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Presença
              </h1>
              <p className="text-sm text-muted-foreground">
                Registro de participação
              </p>
            </div>
          </div>
        </motion.div>

        {/* Seletor de Evento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Selecione um evento" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title} - {formatDate(event.event_date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Stats */}
        {selectedEventData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 rounded-2xl gradient-hope p-5 text-primary-foreground"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">{selectedEventData.title}</p>
                <h3 className="font-serif text-xl font-semibold">
                  {attendance.length} presente{attendance.length !== 1 && "s"}
                </h3>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
                <UserCheck className="h-7 w-7" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Lista de Membros (só para líderes) */}
        {canManage ? (
          <div className="space-y-3">
            {members.length === 0 ? (
              <div className="rounded-2xl bg-card p-8 text-center shadow-md">
                <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhum membro aprovado ainda.</p>
              </div>
            ) : (
              members.map((member, index) => {
                const isPresent = attendance.some((a) => a.user_id === member.user_id);
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.03 }}
                    className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-md"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-serif text-lg font-semibold text-primary">
                      {member.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{member.full_name}</h3>
                    </div>
                    <Button
                      variant={isPresent ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAttendance(member.user_id)}
                      className="rounded-xl"
                    >
                      <Check className={`h-4 w-4 ${isPresent ? "" : "opacity-50"}`} />
                    </Button>
                  </motion.div>
                );
              })
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl bg-card p-8 text-center shadow-md"
          >
            <Calendar className="mx-auto mb-3 h-12 w-12 text-primary/50" />
            <h3 className="font-semibold text-foreground mb-2">Sua Presença</h3>
            <p className="text-muted-foreground text-sm">
              Você tem {attendance.filter((a) => a.user_id === user?.id).length} presença(s)
              registrada(s) neste evento.
            </p>
          </motion.div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Presenca;
