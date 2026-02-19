import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EventMapPreview from "@/components/agenda/EventMapPreview";

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
  latitude?: number | null;
  longitude?: number | null;
  location_type?: string | null;
}

interface EventDetailDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    culto: "Culto",
    ensaio: "Ensaio",
    estudo: "Estudo Bíblico",
    reuniao: "Reunião",
    outro: "Outro",
  };
  return labels[type] || type;
};

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

const EventDetailDialog = ({ event, open, onOpenChange }: EventDetailDialogProps) => {
  if (!event) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const formatTime = (time: string) => time.slice(0, 5);

  const hasCoordinates = event.latitude && event.longitude;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <Badge className={`mb-2 text-[10px] sm:text-xs ${getTypeColor(event.event_type)}`}>
                {getTypeLabel(event.event_type)}
              </Badge>
              <DialogTitle className="font-serif text-base sm:text-xl leading-tight">
                {event.title}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {/* Date & Time */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 sm:p-4"
          >
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm sm:text-base truncate">{formatDate(event.event_date)}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {formatTime(event.start_time)}
                {event.end_time && ` - ${formatTime(event.end_time)}`}
              </p>
            </div>
          </motion.div>

          {/* Location name */}
          {event.location && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 sm:p-4"
            >
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Local</p>
                <p className="font-medium text-foreground text-sm sm:text-base truncate">{event.location}</p>
              </div>
            </motion.div>
          )}

          {/* Map with navigation */}
          {hasCoordinates && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <EventMapPreview
                latitude={event.latitude!}
                longitude={event.longitude!}
                address={event.address}
                locationType={event.location_type}
                title={event.title}
              />
            </motion.div>
          )}

          {/* Description */}
          {event.description && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-xl bg-accent/50 p-3 sm:p-4"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Descrição</span>
              </div>
              <p className="text-sm text-foreground">{event.description}</p>
            </motion.div>
          )}

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl text-sm"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailDialog;
