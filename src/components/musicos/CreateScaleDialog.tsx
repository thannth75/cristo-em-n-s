import { useState, useEffect } from "react";
import { Plus, X, Check, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

interface Event {
  id: string;
  title: string;
  event_date: string;
}

interface Musician {
  id: string;
  user_id: string;
  instruments: string[];
  profiles?: {
    full_name: string;
  };
}

interface SelectedMusician {
  musicianId: string;
  name: string;
  instrument: string;
}

interface CreateScaleDialogProps {
  onScaleCreated: () => void;
}

const CreateScaleDialog = ({ onScaleCreated }: CreateScaleDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedMusicians, setSelectedMusicians] = useState<SelectedMusician[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    const today = new Date().toISOString().split("T")[0];
    
    // Fetch events
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, title, event_date")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(20);

    setEvents(eventsData || []);

    // Fetch musicians
    const { data: musiciansData } = await supabase
      .from("musicians")
      .select("id, user_id, instruments")
      .eq("is_active", true);

    // Fetch profiles for musician names
    if (musiciansData && musiciansData.length > 0) {
      const userIds = musiciansData.map((m) => m.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profilesData || []).map((p) => [p.user_id, p.full_name]));

      const musiciansWithProfiles = musiciansData.map((m) => ({
        ...m,
        profiles: { full_name: profileMap.get(m.user_id) || "Músico" },
      }));

      setMusicians(musiciansWithProfiles);
    } else {
      setMusicians([]);
    }
  };

  const addMusician = (musicianId: string, instrument: string) => {
    const musician = musicians.find((m) => m.id === musicianId);
    if (!musician) return;

    // Check if already added with same instrument
    if (selectedMusicians.some((sm) => sm.musicianId === musicianId && sm.instrument === instrument)) {
      return;
    }

    setSelectedMusicians([
      ...selectedMusicians,
      {
        musicianId,
        name: (musician.profiles as any)?.full_name || "Músico",
        instrument,
      },
    ]);
  };

  const removeMusician = (index: number) => {
    setSelectedMusicians(selectedMusicians.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!selectedEvent) {
      toast({
        title: "Selecione um evento",
        description: "Escolha o evento para criar a escala.",
        variant: "destructive",
      });
      return;
    }

    if (selectedMusicians.length === 0) {
      toast({
        title: "Adicione músicos",
        description: "Selecione pelo menos um músico para a escala.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Create the scale
    const { data: scale, error: scaleError } = await supabase
      .from("music_scales")
      .insert({
        event_id: selectedEvent,
        created_by: user?.id,
        notes: notes || null,
      })
      .select()
      .single();

    if (scaleError) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a escala.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Add musicians to the scale
    const scaleMusicians = selectedMusicians.map((sm) => ({
      scale_id: scale.id,
      musician_id: sm.musicianId,
      instrument: sm.instrument,
      confirmed: false,
    }));

    const { error: musiciansError } = await supabase
      .from("scale_musicians")
      .insert(scaleMusicians);

    if (musiciansError) {
      toast({
        title: "Aviso",
        description: "Escala criada, mas houve erro ao adicionar alguns músicos.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Escala criada! 🎵",
        description: "Os músicos foram escalados com sucesso.",
      });
    }

    setIsLoading(false);
    setIsOpen(false);
    setSelectedEvent("");
    setSelectedMusicians([]);
    setNotes("");
    onScaleCreated();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="rounded-xl shadow-lg">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-4 max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Nova Escala</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Event Selection */}
          <div>
            <Label>Evento</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione o evento" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} - {formatDate(event.event_date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Musicians */}
          <div>
            <Label>Adicionar Músico</Label>
            <div className="mt-2 space-y-2">
              {musicians.map((musician) => (
                <div
                  key={musician.id}
                  className="rounded-xl bg-muted/50 p-3"
                >
                  <p className="font-medium text-sm text-foreground mb-2">
                    {(musician.profiles as any)?.full_name || "Músico"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {musician.instruments.map((instrument) => (
                      <Button
                        key={instrument}
                        variant="outline"
                        size="sm"
                        onClick={() => addMusician(musician.id, instrument)}
                        className="h-7 text-xs rounded-lg"
                        disabled={selectedMusicians.some(
                          (sm) => sm.musicianId === musician.id && sm.instrument === instrument
                        )}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {instrument}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              {musicians.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum músico cadastrado.
                </p>
              )}
            </div>
          </div>

          {/* Selected Musicians */}
          {selectedMusicians.length > 0 && (
            <div>
              <Label>Músicos Escalados ({selectedMusicians.length})</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedMusicians.map((sm, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1.5"
                  >
                    <Music className="h-3 w-3" />
                    {sm.name} - {sm.instrument}
                    <button
                      onClick={() => removeMusician(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Observações (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Ensaio às 18h, tom original..."
              className="rounded-xl"
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full rounded-xl"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Criar Escala
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateScaleDialog;
