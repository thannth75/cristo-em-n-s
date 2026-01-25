import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Info, X } from "lucide-react";
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

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge className={`mb-2 ${getTypeColor(event.event_type)}`}>
                {getTypeLabel(event.event_type)}
              </Badge>
              <DialogTitle className="font-serif text-xl">{event.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data e Hora */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 rounded-xl bg-muted/50 p-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{formatDate(event.event_date)}</p>
              <p className="text-sm text-muted-foreground">
                {formatTime(event.start_time)}
                {event.end_time && ` - ${formatTime(event.end_time)}`}
              </p>
            </div>
          </motion.div>

          {/* Local */}
          {event.location && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 rounded-xl bg-muted/50 p-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Local</p>
                <p className="font-medium text-foreground">{event.location}</p>
              </div>
            </motion.div>
          )}

          {/* Descrição */}
          {event.description && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl bg-accent/50 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Descrição</span>
              </div>
              <p className="text-foreground">{event.description}</p>
            </motion.div>
          )}

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailDialog;
