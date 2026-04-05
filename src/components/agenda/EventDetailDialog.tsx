import { motion } from "framer-motion";
import { Calendar, MapPin, Info, Pencil, Trash2, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  address?: string | null;
  display_date?: string;
  is_recurring?: boolean;
  recurrence_day?: number | null;
  recurrence_end_date?: string | null;
}

interface EventDetailDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage?: boolean;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
}

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = { culto: "Culto", ensaio: "Ensaio", estudo: "Estudo Bíblico", reuniao: "Reunião", outro: "Outro" };
  return labels[type] || type;
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "culto": return "bg-primary/10 text-primary";
    case "ensaio": return "bg-gold/20 text-gold";
    case "estudo": return "bg-accent text-accent-foreground";
    case "reuniao": return "bg-secondary text-secondary-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const EventDetailDialog = ({ event, open, onOpenChange, canManage, onEdit, onDelete }: EventDetailDialogProps) => {
  if (!event) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const formatTime = (time: string) => time.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-lg max-h-[85dvh] overflow-hidden rounded-2xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="border-b border-border px-4 pt-5 pb-3">
          <Badge className={`mb-1.5 w-fit text-[10px] sm:text-xs ${getTypeColor(event.event_type)}`}>
            {getTypeLabel(event.event_type)}
          </Badge>
          <DialogTitle className="font-serif text-base sm:text-xl leading-tight break-words">
            {event.title}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-4 py-3 space-y-3">
          {/* Date & Time */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm break-words">{formatDate(event.display_date || event.event_date)}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(event.start_time)}
                {event.end_time && ` - ${formatTime(event.end_time)}`}
              </p>
            </div>
          </motion.div>

          {/* Recurring info */}
          {event.is_recurring && event.recurrence_day != null && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}
              className="flex items-center gap-3 rounded-xl bg-primary/5 p-3">
              <Repeat className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs text-foreground break-words">
                Repete toda <strong>{DAY_NAMES[event.recurrence_day]}</strong>
                {event.recurrence_end_date && ` até ${formatDate(event.recurrence_end_date)}`}
              </p>
            </motion.div>
          )}

          {/* Location */}
          {event.location && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Local</p>
                <p className="font-medium text-foreground text-sm break-words">{event.location}</p>
                {event.address && (
                  <p className="text-xs text-muted-foreground break-words mt-0.5">{event.address}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Description */}
          {event.description && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="rounded-xl bg-accent/50 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">Descrição</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed break-words whitespace-pre-wrap">{event.description}</p>
            </motion.div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-border px-4 py-3 space-y-2">
          {canManage && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => onEdit?.(event)} className="rounded-xl text-sm gap-1.5">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
              <Button variant="outline" onClick={() => onDelete?.(event)} className="rounded-xl text-sm gap-1.5 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </Button>
            </div>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full rounded-xl text-sm">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailDialog;
