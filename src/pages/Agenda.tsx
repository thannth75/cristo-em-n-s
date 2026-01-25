import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import EventDetailDialog from "@/components/agenda/EventDetailDialog";
import { eventSchema, validateInput } from "@/lib/validation";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "culto":
      return "bg-primary/10 text-primary";
    case "ensaio":
      return "bg-gold/20 text-gold";
    case "estudo":
      return "bg-accent text-accent-foreground";
    case "reuniao":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const Agenda = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isAdmin, isLeader, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_type: "culto",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
  });

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
    }
  }, [isApproved]);

  const fetchEvents = async () => {
    setIsLoading(true);
    const today = new Date().toISOString().split("T")[0];
    
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos.",
        variant: "destructive",
      });
    } else {
      setEvents(data || []);
    }
    setIsLoading(false);
  };

  const handleCreateEvent = async () => {
    const validation = validateInput(eventSchema, newEvent);
    
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const validatedData = validation.data;
    const { error } = await supabase.from("events").insert({
      title: validatedData.title,
      description: validatedData.description || null,
      event_type: validatedData.event_type,
      event_date: validatedData.event_date,
      start_time: validatedData.start_time,
      end_time: validatedData.end_time || null,
      location: validatedData.location || null,
      created_by: user?.id,
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Evento criado! 🎉",
        description: "O evento foi adicionado à agenda.",
      });
      setIsDialogOpen(false);
      setNewEvent({
        title: "",
        description: "",
        event_type: "culto",
        event_date: "",
        start_time: "",
        end_time: "",
        location: "",
      });
      fetchEvents();
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o evento.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Evento excluído",
        description: "O evento foi removido da agenda.",
      });
      fetchEvents();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader userName={userName} />

      <main className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">
              Agenda Espiritual
            </h1>
            <p className="text-sm text-muted-foreground">
              Próximos eventos e compromissos
            </p>
          </div>

          {canManage && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="rounded-xl shadow-lg">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-serif">Novo Evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Nome do evento"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={newEvent.event_type}
                      onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="culto">Culto</SelectItem>
                        <SelectItem value="ensaio">Ensaio</SelectItem>
                        <SelectItem value="estudo">Estudo Bíblico</SelectItem>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={newEvent.event_date}
                        onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Horário</Label>
                      <Input
                        type="time"
                        value={newEvent.start_time}
                        onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Local</Label>
                    <Input
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      placeholder="Local do evento"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Detalhes do evento"
                      className="rounded-xl"
                    />
                  </div>
                  <Button onClick={handleCreateEvent} className="w-full rounded-xl">
                    Criar Evento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        {/* Calendário Resumo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 overflow-hidden rounded-2xl gradient-hope p-5 text-primary-foreground"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-primary-foreground/20">
              <Calendar className="mb-1 h-5 w-5" />
              <span className="text-xs font-medium">
                {new Date().toLocaleString("pt-BR", { month: "short" }).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold">
                {events.length} evento{events.length !== 1 && "s"} próximo{events.length !== 1 && "s"}
              </h3>
              <p className="text-sm opacity-80">
                Continue firme na caminhada!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Lista de Eventos */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl bg-card p-8 text-center shadow-md"
            >
              <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum evento agendado.</p>
              {canManage && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Clique no + para criar um evento.
                </p>
              )}
            </motion.div>
          ) : (
            events.map((evento, index) => (
              <motion.button
                key={evento.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => {
                  setSelectedEvent(evento);
                  setIsDetailOpen(true);
                }}
                className="flex w-full text-left items-center gap-4 rounded-2xl bg-card p-4 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className={`rounded-xl p-3 ${getTypeColor(evento.event_type)}`}>
                  <Calendar className="h-6 w-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{evento.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(evento.event_date)}, {evento.start_time.slice(0, 5)}
                    </span>
                    {evento.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {evento.location}
                      </span>
                    )}
                  </div>
                </div>

                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(evento.id);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </motion.button>
            ))
          )}
        </div>

        {/* Versículo motivacional */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 rounded-2xl bg-accent/50 p-5 text-center"
        >
          <p className="font-serif italic text-muted-foreground">
            "Não deixemos de congregar-nos, como é costume de alguns, mas encorajemo-nos uns aos outros."
          </p>
          <p className="mt-2 text-sm font-medium text-primary">— Hebreus 10:25</p>
        </motion.div>
      </main>

      <EventDetailDialog
        event={selectedEvent}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      <BottomNavigation />
    </div>
  );
};

export default Agenda;
