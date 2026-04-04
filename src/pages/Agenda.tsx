import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, Plus, Trash2, Navigation, Repeat, Pencil, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

interface DisplayEvent extends Event {
  display_date: string;
  is_virtual?: boolean;
}

const getTypeColor = (type: string) => {
  switch (type) {
    case "culto": return "bg-primary/10 text-primary";
    case "ensaio": return "bg-gold/20 text-gold";
    case "estudo": return "bg-accent text-accent-foreground";
    case "reuniao": return "bg-secondary text-secondary-foreground";
    default: return "bg-muted text-muted-foreground";
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
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditMapPickerOpen, setIsEditMapPickerOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "", description: "", event_type: "culto", event_date: "",
    start_time: "", end_time: "", location: "", address: "",
    latitude: null as number | null, longitude: null as number | null,
    location_type: "igreja", is_recurring: false,
    recurrence_day: "" as string, recurrence_end_date: "",
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
    
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .or(`and(is_recurring.is.null,event_date.gte.${today}),and(is_recurring.eq.false,event_date.gte.${today}),is_recurring.eq.true`)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os eventos.", variant: "destructive" });
    } else {
      setEvents(data || []);
    }
    setIsLoading(false);
  };

  // Only show NEXT occurrence of recurring events (like a real calendar)
  const displayEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    
    const result: DisplayEvent[] = [];
    
    for (const event of events) {
      if (event.is_recurring && event.recurrence_day != null) {
        // Find only the NEXT occurrence
        const endDate = event.recurrence_end_date ? new Date(event.recurrence_end_date + "T23:59:59") : null;
        
        // If the recurrence has ended, skip
        if (endDate && endDate < today) continue;

        const current = new Date(today);
        // Find next occurrence of recurrence_day from today
        while (current.getDay() !== event.recurrence_day) {
          current.setDate(current.getDate() + 1);
        }
        
        // If that date is past the end date, skip
        if (endDate && current > endDate) continue;
        
        const dateStr = current.toISOString().split("T")[0];
        result.push({
          ...event,
          display_date: dateStr,
          is_virtual: true,
        });
      } else {
        if (event.event_date >= todayStr) {
          result.push({
            ...event,
            display_date: event.event_date,
            is_virtual: false,
          });
        }
      }
    }
    
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
          ? `Repete toda ${DAY_NAMES[parseInt(newEvent.recurrence_day)]}.`
          : "Adicionado à agenda."
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

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    const { error } = await supabase.from("events").delete().eq("id", deletingEvent.id);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    } else {
      toast({ title: "Evento excluído ✓" });
      fetchEvents();
    }
    setDeletingEvent(null);
  };

  const handleEditEvent = async () => {
    if (!editingEvent) return;
    const { error } = await supabase
      .from("events")
      .update({
        title: editingEvent.title,
        description: editingEvent.description,
        event_type: editingEvent.event_type,
        event_date: editingEvent.event_date,
        start_time: editingEvent.start_time,
        end_time: editingEvent.end_time,
        location: editingEvent.location,
        address: editingEvent.address,
        latitude: editingEvent.latitude,
        longitude: editingEvent.longitude,
        location_type: editingEvent.location_type,
        is_recurring: editingEvent.is_recurring,
        recurrence_day: editingEvent.recurrence_day,
        recurrence_end_date: editingEvent.recurrence_end_date,
      })
      .eq("id", editingEvent.id);

    if (error) {
      toast({ title: "Erro ao editar evento", variant: "destructive" });
    } else {
      toast({ title: "Evento atualizado! ✓" });
      fetchEvents();
    }
    setEditingEvent(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.getTime() === today.getTime()) return "Hoje";
    if (date.getTime() === tomorrow.getTime()) return "Amanhã";
    
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
            <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">Agenda</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Próximos compromissos</p>
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
                    <Input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Nome do evento" className="rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium">Tipo</Label>
                    <Select value={newEvent.event_type} onValueChange={(v) => setNewEvent({ ...newEvent, event_type: v })}>
                      <SelectTrigger className="rounded-xl text-sm"><SelectValue /></SelectTrigger>
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
                      <Input type="date" value={newEvent.event_date} onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })} className="rounded-xl text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs sm:text-sm font-medium">Horário</Label>
                      <Input type="time" value={newEvent.start_time} onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })} className="rounded-xl text-sm" />
                    </div>
                  </div>
                  
                  {/* Recurring */}
                  <div className="space-y-3 rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                        <Repeat className="h-4 w-4" /> Evento recorrente
                      </Label>
                      <Switch checked={newEvent.is_recurring} onCheckedChange={(v) => setNewEvent({ ...newEvent, is_recurring: v })} />
                    </div>
                    {newEvent.is_recurring && (
                      <div className="space-y-2 pt-1">
                        <Select value={newEvent.recurrence_day} onValueChange={(v) => setNewEvent({ ...newEvent, recurrence_day: v })}>
                          <SelectTrigger className="rounded-xl text-xs h-8"><SelectValue placeholder="Dia da semana" /></SelectTrigger>
                          <SelectContent>
                            {DAY_NAMES.map((day, i) => (<SelectItem key={i} value={String(i)}>{day}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <Input type="date" value={newEvent.recurrence_end_date} onChange={(e) => setNewEvent({ ...newEvent, recurrence_end_date: e.target.value })} className="rounded-xl text-xs h-8" placeholder="Data final" />
                        {newEvent.recurrence_day && (
                          <p className="text-[10px] text-muted-foreground bg-muted rounded-lg px-2 py-1">
                            🔁 Toda {DAY_NAMES[parseInt(newEvent.recurrence_day)]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs sm:text-sm font-medium">Local</Label>
                    <Input value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Ex: Igreja Vida em Cristo" className="rounded-xl text-sm" />
                  </div>
                  <Button type="button" variant="outline" className="w-full rounded-xl gap-2 text-xs h-9" onClick={() => setIsMapPickerOpen(true)}>
                    <MapPin className="h-4 w-4" />
                    {newEvent.latitude ? "✅ Local no mapa — Alterar" : "Selecionar no Mapa"}
                  </Button>
                  <Textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Descrição (opcional)" className="rounded-xl text-sm min-h-[60px]" />
                  <Button onClick={handleCreateEvent} className="w-full rounded-xl">Criar Evento</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 overflow-hidden rounded-2xl gradient-hope p-5 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-primary-foreground/20">
              <Calendar className="h-5 w-5" />
              <span className="text-[10px] font-medium mt-0.5">{new Date().toLocaleString("pt-BR", { month: "short" }).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold">
                {displayEvents.length} evento{displayEvents.length !== 1 && "s"}
              </h3>
              <p className="text-sm opacity-80">Próximos compromissos</p>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-card p-8 text-center shadow-md">
              <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum evento agendado.</p>
            </motion.div>
          ) : (
            displayEvents.map((evento, index) => (
              <motion.div
                key={`${evento.id}-${evento.display_date}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + index * 0.03 }}
                className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden"
              >
                <button
                  onClick={() => { setSelectedEvent(evento); setIsDetailOpen(true); }}
                  className="flex w-full text-left items-center gap-3 p-4"
                >
                  {/* Date badge */}
                  <div className="flex flex-col items-center justify-center shrink-0 w-12">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {new Date(evento.display_date + "T00:00:00").toLocaleString("pt-BR", { month: "short" })}
                    </span>
                    <span className="text-xl font-bold text-foreground leading-tight">
                      {new Date(evento.display_date + "T00:00:00").getDate()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {DAY_NAMES[new Date(evento.display_date + "T00:00:00").getDay()].slice(0, 3)}
                    </span>
                  </div>

                  <div className="w-px h-10 bg-border shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                        evento.event_type === 'culto' ? 'bg-primary' :
                        evento.event_type === 'ensaio' ? 'bg-yellow-500' :
                        evento.event_type === 'estudo' ? 'bg-blue-500' : 'bg-muted-foreground'
                      }`} />
                      <h3 className="font-semibold text-foreground text-sm truncate">{evento.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>{evento.start_time.slice(0, 5)}</span>
                      {evento.location && (
                        <>
                          <span>•</span>
                          <span className="truncate">{evento.location}</span>
                        </>
                      )}
                    </div>
                    {evento.is_recurring && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-primary/80 mt-1">
                        <Repeat className="h-2.5 w-2.5" /> Toda {DAY_NAMES[evento.recurrence_day!]}
                      </span>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>

                {/* Action buttons for admins */}
                {canManage && (
                  <div className="flex border-t border-border">
                    <button
                      onClick={() => setEditingEvent({ ...evento })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      <Pencil className="h-3 w-3" /> Editar
                    </button>
                    <div className="w-px bg-border" />
                    <button
                      onClick={() => setDeletingEvent(evento)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Excluir
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Verse */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 rounded-2xl bg-accent/50 p-5 text-center">
          <p className="font-serif italic text-muted-foreground text-sm">"Não deixemos de congregar-nos, como é costume de alguns"</p>
          <p className="mt-1.5 text-xs font-medium text-primary">— Hebreus 10:25</p>
        </motion.div>
      </main>

      {/* Detail Dialog */}
      <EventDetailDialog event={selectedEvent} open={isDetailOpen} onOpenChange={setIsDetailOpen} canManage={canManage} onEdit={(e) => { setIsDetailOpen(false); setEditingEvent(e as Event); }} onDelete={(e) => { setIsDetailOpen(false); setDeletingEvent(e as Event); }} />

      {/* Create Map Picker */}
      <EventMapPicker
        open={isMapPickerOpen}
        onOpenChange={setIsMapPickerOpen}
        onLocationSelect={(data) => setNewEvent((prev) => ({ ...prev, address: data.address, latitude: data.latitude, longitude: data.longitude, location_type: data.location_type }))}
        initialLat={newEvent.latitude}
        initialLng={newEvent.longitude}
        initialAddress={newEvent.address}
        initialLocationType={newEvent.location_type}
      />

      {/* Edit Map Picker */}
      <EventMapPicker
        open={isEditMapPickerOpen}
        onOpenChange={setIsEditMapPickerOpen}
        onLocationSelect={(data) => setEditingEvent((prev) => prev ? { ...prev, address: data.address, latitude: data.latitude, longitude: data.longitude, location_type: data.location_type } : null)}
        initialLat={editingEvent?.latitude}
        initialLng={editingEvent?.longitude}
        initialAddress={editingEvent?.address || ""}
        initialLocationType={editingEvent?.location_type || "igreja"}
      />

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-serif">Editar Evento</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Título</Label>
                <Input value={editingEvent.title} onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })} className="rounded-xl text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select value={editingEvent.event_type} onValueChange={(v) => setEditingEvent({ ...editingEvent, event_type: v })}>
                  <SelectTrigger className="rounded-xl text-sm"><SelectValue /></SelectTrigger>
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
                  <Label className="text-xs">Data</Label>
                  <Input type="date" value={editingEvent.event_date} onChange={(e) => setEditingEvent({ ...editingEvent, event_date: e.target.value })} className="rounded-xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Horário</Label>
                  <Input type="time" value={editingEvent.start_time} onChange={(e) => setEditingEvent({ ...editingEvent, start_time: e.target.value })} className="rounded-xl text-sm" />
                </div>
              </div>

              {/* Recurring toggle for edit */}
              <div className="space-y-3 rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5"><Repeat className="h-3.5 w-3.5" /> Recorrente</Label>
                  <Switch checked={editingEvent.is_recurring || false} onCheckedChange={(v) => setEditingEvent({ ...editingEvent, is_recurring: v })} />
                </div>
                {editingEvent.is_recurring && (
                  <div className="space-y-2">
                    <Select value={String(editingEvent.recurrence_day ?? "")} onValueChange={(v) => setEditingEvent({ ...editingEvent, recurrence_day: parseInt(v) })}>
                      <SelectTrigger className="rounded-xl text-xs h-8"><SelectValue placeholder="Dia" /></SelectTrigger>
                      <SelectContent>
                        {DAY_NAMES.map((day, i) => (<SelectItem key={i} value={String(i)}>{day}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Input type="date" value={editingEvent.recurrence_end_date || ""} onChange={(e) => setEditingEvent({ ...editingEvent, recurrence_end_date: e.target.value })} className="rounded-xl text-xs h-8" />
                  </div>
                )}
              </div>

              <Input value={editingEvent.location || ""} onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })} placeholder="Local" className="rounded-xl text-sm" />
              <Button type="button" variant="outline" className="w-full rounded-xl gap-2 text-xs h-9" onClick={() => setIsEditMapPickerOpen(true)}>
                <MapPin className="h-4 w-4" />
                {editingEvent.latitude ? "✅ Alterar local no mapa" : "Adicionar no mapa"}
              </Button>
              <Textarea value={editingEvent.description || ""} onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })} placeholder="Descrição" className="rounded-xl text-sm min-h-[60px]" />
              <Button onClick={handleEditEvent} className="w-full rounded-xl">Salvar Alterações</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEvent} onOpenChange={(open) => !open && setDeletingEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Evento</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingEvent?.is_recurring
                ? "Este é um evento recorrente. Excluir removerá TODAS as ocorrências futuras. Deseja continuar?"
                : "Tem certeza que deseja excluir este evento?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
};

export default Agenda;