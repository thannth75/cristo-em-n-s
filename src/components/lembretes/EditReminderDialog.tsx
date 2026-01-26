import { useState, useEffect } from "react";
import { Sun, Sunset, Moon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TimePickerCustom from "./TimePickerCustom";

interface PrayerReminder {
  id: string;
  reminder_time: string;
  reminder_type: string;
  is_active: boolean;
}

interface EditReminderDialogProps {
  reminder: PrayerReminder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: { reminder_type: string; reminder_time: string }) => Promise<void>;
}

const reminderTypes = [
  { value: "manha", label: "Manhã", icon: Sun, color: "text-amber-500" },
  { value: "tarde", label: "Tarde", icon: Sunset, color: "text-orange-500" },
  { value: "noite", label: "Noite", icon: Moon, color: "text-indigo-500" },
  { value: "personalizado", label: "Personalizado", icon: Clock, color: "text-primary" },
];

const EditReminderDialog = ({
  reminder,
  open,
  onOpenChange,
  onSave,
}: EditReminderDialogProps) => {
  const [editData, setEditData] = useState({
    reminder_type: "manha",
    reminder_time: "06:00",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (reminder) {
      setEditData({
        reminder_type: reminder.reminder_type,
        reminder_time: reminder.reminder_time.slice(0, 5),
      });
    }
  }, [reminder]);

  const handleSave = async () => {
    if (!reminder) return;
    setIsSaving(true);
    try {
      await onSave(reminder.id, editData);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">Editar Lembrete</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="mb-2 block">Tipo de lembrete</Label>
            <Select
              value={editData.reminder_type}
              onValueChange={(value) =>
                setEditData({ ...editData, reminder_type: value })
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reminderTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-4 block text-center">Selecione o horário</Label>
            <TimePickerCustom
              value={editData.reminder_time}
              onChange={(time) => setEditData({ ...editData, reminder_time: time })}
            />
          </div>

          <div className="rounded-xl bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              ⏰ Novo horário do lembrete
            </p>
            <p className="text-4xl font-bold text-primary">
              {editData.reminder_time}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-xl"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditReminderDialog;
