import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Plus, Trash2, Navigation, Repeat } from "lucide-react";
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
import EventMapPicker from "@/components/agenda/EventMapPicker";
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
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  location_type: string | null;
  is_recurring?: boolean;
  recurrence_day?: number | null;
  recurrence_end_date?: string | null;
}

// Virtual event = a displayed occurrence derived from a recurring event
interface DisplayEvent extends Event {
  display_date: string; // The actual date to show (may differ from event_date for recurring)
  is_virtual?: boolean; // True if this is a generated occurrence
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

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const Agenda = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isAdmin, isLeader, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DisplayEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_type: "culto",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
    location_type: "igreja",
    is_recurring: false,
    recurrence_day: "" as string,
    recurrence_end_date: "",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (isApproved) fetchEvents();
  }, [isApproved]);

  const fetchEvents = async () => {
    setIsLoading(true);
    const today = new Date().toISOString().split("T")[0];
    
    // Fetch non-recurring events from today forward + all recurring events that haven't ended
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .or(`and(is_recurring.is.null,event_date.gte.${today}),and(is_recurring.eq.false,event_date.gte.${today}),and(is_recurring.eq.true,recurrence_end_date.gte.${today})`)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os eventos.", variant: "destructive" });
    } else {
      setEvents(data || []);
    }
    setIsLoading(false);
  };

  // Expand recurring events into virtual display events
  const displayEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    
    // Look ahead 90 days for recurring events
    const lookAhead = new Date(today);
    lookAhead.setDate(lookAhead.getDate() + 90);
    const lookAheadStr = lookAhead.toISOString().split("T")[0];
    
    const result: DisplayEvent[] = [];
    
    for (const event of events) {
      if (event.is_recurring && event.recurrence_day != null && event.recurrence_end_date) {
        // Generate virtual occurrences
        const startDate = new Date(Math.max(today.getTime(), new Date(event.event_date + "T00:00:00").getTime()));
        const endDate = new Date(Math.min(lookAhead.getTime(), new Date(event.recurrence_end_date + "T00:00:00").getTime()));
        
        const current = new Date(startDate);
        // Find first occurrence of recurrence_day
        while (current.getDay() !== event.recurrence_day) {
          current.setDate(current.getDate() + 1);
        }
        
        while (current <= endDate) {
          const dateStr = current.toISOString().split("T")[0];
          if (dateStr >= todayStr) {
            result.push({
              ...event,
              display_date: dateStr,
              is_virtual: true,
            });
          }
          current.setDate(current.getDate() + 7);
        }
      } else {
        // Normal event
        if (event.event_date >= todayStr) {
          result.push({
            ...event,
            display_date: event.event_date,
            is_virtual: false,
          });
        }
      }
    }
    
    // Sort by display_date then start_time
    result.sort((a, b) => {
      const dateCompare = a.display_date.localeCompare(b.display_date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });
    
    return result;
  }, [events]);

  const handleCreateEvent = async () => {
    const validation = validateInput(eventSchema, newEvent);
    if (!validation.success) {
      toast({ title: "Erro de validação", description: validation.error, variant: "destructive" });
      return;
    }

    const validatedData = validation.data;
    const eventToInsert: any = {
      title: validatedData.title,
      description: validatedData.description || null,
      event_type: validatedData.event_type,
      event_date: validatedData.event_date,
      start_time: validatedData.start_time,
      end_time: validatedData.end_time || null,
      location: validatedData.location || null,
      address: newEvent.address || null,
      latitude: newEvent.latitude,
      longitude: newEvent.longitude,
      location_type: newEvent.location_type || "igreja",
      created_by: user?.id,
      is_recurring: newEvent.is_recurring,
      recurrence_day: newEvent.is_recurring ? parseInt(newEvent.recurrence_day) : null,
      recurrence_end_date: newEvent.is_recurring ? newEvent.recurrence_end_date : null,
    };

    if (newEvent.is_recurring && (!newEvent.recurrence_day || !newEvent.recurrence_end_date)) {
      toast({ title: "Erro", description: "Selecione o dia da semana e a data final da recorrência.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("events").insert([eventToInsert]);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível criar o evento.", variant: "destructive" });
    } else {
      toast({ 
        title: "Evento criado! 🎉", 
        description: newEvent.is_recurring 
          ? `Evento recorrente criado (toda ${DAY_NAMES[parseInt(newEvent.recurrence_day)]}).`
          : "O evento foi adicionado à agenda."
      });
      setIsDialogOpen(false);
      setNewEvent({
        title: "", description: "", event_type: "culto", event_date: "",
        start_time: "", end_time: "", location: "", address: "",
        latitude: null, longitude: null, location_type: "igreja",
        is_recurring: false, recurrence_day: "", recurrence_end_date: "",
      });
      fetchEvents();
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir o evento.", variant: "destructive" });
    } else {
      toast({ title: "Evento excluído", description: "O evento foi removido da agenda." });
      fetchEvents();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
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
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))' }}>
      <AppHeader userName={userName} />

      <main className="px-4 py-4 sm:py-6 max-w-4xl mx-auto" style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left, 16px))', paddingRight: 'max(1rem, env(safe-area-inset-right, 16px))' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
              Agenda Espiritual
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
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
              <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="font-serif">Novo Evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium">Título</Label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Nome do evento"
                      className="rounded-xl text-sm border border-border bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium">Tipo</Label>
                    <Select
                      value={newEvent.event_type}
                      onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}
                    >
                      <SelectTrigger className="rounded-xl text-sm border border-border bg-background">
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
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-medium">Data início</Label>
                      <Input
                        type="date"
                        value={newEvent.event_date}
                        onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                        className="rounded-xl text-sm border border-border bg-background"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-medium">Horário</Label>
                      <Input
                        type="time"
                        value={newEvent.start_time}
                        onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                        className="rounded-xl text-sm border border-border bg-background"
                      />
                    </div>
                  </div>
                  
                  {/* Recurring event toggle */}
                  <div className="space-y-2 rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                        <Repeat className="h-4 w-4" />
                        Evento recorrente
                      </Label>
                      <button
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, is_recurring: !newEvent.is_recurring })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          newEvent.is_recurring ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-primary-foreground transition-transform ${
                            newEvent.is_recurring ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                    
                    {newEvent.is_recurring && (
                      <div className="space-y-2 pt-1">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Dia da semana</Label>
                          <Select
                            value={newEvent.recurrence_day}
                            onValueChange={(v) => setNewEvent({ ...newEvent, recurrence_day: v })}
                          >
                            <SelectTrigger className="rounded-xl text-xs h-8 border border-border bg-background">
                              <SelectValue placeholder="Selecione o dia" />
                            </SelectTrigger>
                            <SelectContent>
                              {DAY_NAMES.map((day, i) => (
                                <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Até quando?</Label>
                          <Input
                            type="date"
                            value={newEvent.recurrence_end_date}
                            onChange={(e) => setNewEvent({ ...newEvent, recurrence_end_date: e.target.value })}
                            className="rounded-xl text-xs h-8 border border-border bg-background"
                          />
                        </div>
                        {newEvent.recurrence_day && newEvent.recurrence_end_date && (
                          <p className="text-[10px] text-muted-foreground bg-muted rounded-lg px-2 py-1">
                            🔁 Repete toda {DAY_NAMES[parseInt(newEvent.recurrence_day)]} até {formatDate(newEvent.recurrence_end_date)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium">Local (nome)</Label>
                    <Input
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      placeholder="Ex: Igreja Vida em Cristo"
                      className="rounded-xl text-sm border border-border bg-background"
                    />
                  </div>

                  {/* Map location picker */}
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm">📍 Localização no Mapa</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl gap-2 text-xs sm:text-sm h-9"
                      onClick={() => setIsMapPickerOpen(true)}
                    >
                      <MapPin className="h-4 w-4 shrink-0" />
                      {newEvent.latitude
                        ? "✅ Local selecionado — Alterar"
                        : "Selecionar no Mapa"
                      }
                    </Button>
                    {newEvent.address && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground px-1 line-clamp-2">
                        {newEvent.address}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium">Descrição (opcional)</Label>
                    <Textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Detalhes do evento"
                      className="rounded-xl text-sm min-h-[60px] border border-border bg-background"
                    />
                  </div>
                  <Button onClick={handleCreateEvent} className="w-full rounded-xl text-sm">
                    Criar Evento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        {/* Calendar summary */}
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
                {displayEvents.length} evento{displayEvents.length !== 1 && "s"} próximo{displayEvents.length !== 1 && "s"}
              </h3>
              <p className="text-sm opacity-80">Continue firme na caminhada!</p>
            </div>
          </div>
        </motion.div>

        {/* Events list */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : displayEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl bg-card p-8 text-center shadow-md"
            >
              <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum evento agendado.</p>
              {canManage && (
                <p className="mt-2 text-sm text-muted-foreground">Clique no + para criar um evento.</p>
              )}
            </motion.div>
          ) : (
            displayEvents.map((evento, index) => (
              <motion.button
                key={`${evento.id}-${evento.display_date}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => { setSelectedEvent(evento); setIsDetailOpen(true); }}
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
                      {formatDate(evento.display_date)}, {evento.start_time.slice(0, 5)}
                    </span>
                    {(evento.location || evento.address) && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {evento.location || evento.address}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {evento.is_recurring && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <Repeat className="h-3 w-3" />
                        Recorrente
                      </span>
                    )}
                    {evento.latitude && (
                      <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                        <Navigation className="h-3 w-3" />
                        GPS
                      </span>
                    )}
                  </div>
                </div>

                {canManage && !evento.is_virtual && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evento.id); }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </motion.button>
            ))
          )}
        </div>

        {/* Verse */}
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

      <EventMapPicker
        open={isMapPickerOpen}
        onOpenChange={setIsMapPickerOpen}
        onLocationSelect={(data) => {
          setNewEvent((prev) => ({
            ...prev,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
            location_type: data.location_type,
          }));
        }}
        initialLat={newEvent.latitude}
        initialLng={newEvent.longitude}
        initialAddress={newEvent.address}
        initialLocationType={newEvent.location_type}
      />

      <BottomNavigation />
    </div>
  );
};

export default Agenda;
