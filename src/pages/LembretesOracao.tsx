import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Bell, 
  Plus, 
  Trash2, 
  Sun,
  Sunset,
  Moon,
  Clock,
  Pencil,
  BellRing,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { usePrayerReminderScheduler } from "@/hooks/usePrayerReminderScheduler";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import TimePickerCustom from "@/components/lembretes/TimePickerCustom";
import EditReminderDialog from "@/components/lembretes/EditReminderDialog";

interface PrayerReminder {
  id: string;
  reminder_time: string;
  reminder_type: string;
  is_active: boolean;
  created_at: string;
}

const reminderTypes = [
  { value: "manha", label: "Manhã", icon: Sun, defaultTime: "06:00", color: "text-amber-500" },
  { value: "tarde", label: "Tarde", icon: Sunset, defaultTime: "12:00", color: "text-orange-500" },
  { value: "noite", label: "Noite", icon: Moon, defaultTime: "21:00", color: "text-indigo-500" },
  { value: "personalizado", label: "Personalizado", icon: Clock, defaultTime: "08:00", color: "text-primary" },
];

const LembretesOracao = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { isEnabled: notificationsEnabled, permission, requestPermission } = usePushNotifications();
  
  // Initialize scheduler for local notifications
  usePrayerReminderScheduler(user?.id);
  
  const [reminders, setReminders] = useState<PrayerReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<PrayerReminder | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [newReminder, setNewReminder] = useState({
    reminder_type: "manha",
    reminder_time: "06:00",
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
    if (isApproved && user) {
      fetchReminders();
    }
  }, [isApproved, user]);

  const fetchReminders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("prayer_reminders")
      .select("*")
      .eq("user_id", user?.id)
      .order("reminder_time", { ascending: true });

    if (!error) {
      setReminders(data || []);
    }
    setIsLoading(false);
  };

  const handleCreateReminder = async () => {
    // Check for duplicates
    const exists = reminders.some(
      r => r.reminder_time === newReminder.reminder_time + ":00"
    );
    
    if (exists) {
      toast({
        title: "Lembrete já existe",
        description: "Você já tem um lembrete para este horário.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("prayer_reminders").insert({
      user_id: user?.id,
      reminder_type: newReminder.reminder_type,
      reminder_time: newReminder.reminder_time + ":00",
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o lembrete.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Lembrete criado! 🔔",
        description: `Você será lembrado às ${newReminder.reminder_time}.`,
      });
      setIsDialogOpen(false);
      setNewReminder({ reminder_type: "manha", reminder_time: "06:00" });
      fetchReminders();
    }
  };

  const handleUpdateReminder = async (id: string, data: { reminder_type: string; reminder_time: string }) => {
    const { error } = await supabase
      .from("prayer_reminders")
      .update({
        reminder_type: data.reminder_type,
        reminder_time: data.reminder_time + ":00",
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o lembrete.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Lembrete atualizado! ✓",
        description: `Novo horário: ${data.reminder_time}`,
      });
      fetchReminders();
    }
  };

  const handleToggleReminder = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("prayer_reminders")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (!error) {
      setReminders(reminders.map(r => 
        r.id === id ? { ...r, is_active: !currentActive } : r
      ));
      toast({
        title: !currentActive ? "Lembrete ativado" : "Lembrete desativado",
      });
    }
  };

  const handleDeleteReminder = async (id: string) => {
    const { error } = await supabase
      .from("prayer_reminders")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: "Lembrete excluído" });
      fetchReminders();
    }
  };

  const handleQuickAdd = async (type: typeof reminderTypes[number]) => {
    const exists = reminders.some(r => r.reminder_type === type.value);
    if (exists) {
      toast({
        title: "Já existe",
        description: `Você já tem um lembrete de ${type.label.toLowerCase()}.`,
      });
      return;
    }

    const { error } = await supabase.from("prayer_reminders").insert({
      user_id: user?.id,
      reminder_type: type.value,
      reminder_time: type.defaultTime + ":00",
    });

    if (!error) {
      toast({
        title: "Lembrete criado! 🔔",
        description: `${type.label} às ${type.defaultTime}.`,
      });
      fetchReminders();
    }
  };

  const getReminderTypeInfo = (type: string) => {
    return reminderTypes.find(t => t.value === type) || reminderTypes[3];
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getNextReminder = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const activeReminders = reminders
      .filter(r => r.is_active)
      .map(r => {
        const [h, m] = r.reminder_time.split(":").map(Number);
        return { ...r, totalMinutes: h * 60 + m };
      })
      .sort((a, b) => a.totalMinutes - b.totalMinutes);

    const nextToday = activeReminders.find(r => r.totalMinutes > currentMinutes);
    if (nextToday) return { reminder: nextToday, isToday: true };
    
    if (activeReminders.length > 0) {
      return { reminder: activeReminders[0], isToday: false };
    }
    
    return null;
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const activeReminders = reminders.filter(r => r.is_active).length;
  const nextReminder = getNextReminder();

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader userName={userName} />

      <main className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Lembretes de Oração
              </h1>
              <p className="text-sm text-muted-foreground">
                Momentos dedicados a Deus
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-xl shadow-lg">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif">Novo Lembrete</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">Tipo de lembrete</Label>
                  <Select 
                    value={newReminder.reminder_type} 
                    onValueChange={(value) => {
                      const typeInfo = reminderTypes.find(t => t.value === value);
                      setNewReminder({ 
                        ...newReminder, 
                        reminder_type: value,
                        reminder_time: typeInfo?.defaultTime || "08:00"
                      });
                    }}
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
                    value={newReminder.reminder_time}
                    onChange={(time) => setNewReminder({ ...newReminder, reminder_time: time })}
                  />
                </div>

                <div className="rounded-xl bg-muted p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    ⏰ Você será lembrado diariamente às
                  </p>
                  <p className="text-4xl font-bold text-primary">
                    {newReminder.reminder_time}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  💡 Os lembretes aparecerão nas suas notificações.
                </p>

                <Button onClick={handleCreateReminder} className="w-full rounded-xl">
                  Criar Lembrete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Notification Permission Banner */}
        {permission !== "granted" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4"
          >
            <div className="flex items-start gap-3">
              <BellRing className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Ative as notificações</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Para receber lembretes de oração, você precisa permitir notificações.
                </p>
                <Button 
                  size="sm" 
                  onClick={requestPermission}
                  className="rounded-xl"
                >
                  Ativar Notificações
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats + Next Reminder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-2xl gradient-hope p-5 text-primary-foreground"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-80">Lembretes ativos</p>
              <h3 className="font-serif text-2xl font-semibold">
                {activeReminders} de {reminders.length}
              </h3>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
              <Bell className="h-7 w-7" />
            </div>
          </div>
          
          {nextReminder && (
            <div className="rounded-xl bg-primary-foreground/10 p-3">
              <p className="text-xs opacity-80 mb-1">
                Próximo lembrete {nextReminder.isToday ? "hoje" : "amanhã"}
              </p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-bold text-lg">
                  {formatTime(nextReminder.reminder.reminder_time)}
                </span>
                <span className="text-sm opacity-80">
                  — {getReminderTypeInfo(nextReminder.reminder.reminder_type).label}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Add Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="font-serif text-lg font-semibold text-foreground mb-3">
            Adicionar Rapidamente
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {reminderTypes.slice(0, 3).map((type) => {
              const Icon = type.icon;
              const exists = reminders.some(r => r.reminder_type === type.value);
              return (
                <button
                  key={type.value}
                  onClick={() => handleQuickAdd(type)}
                  disabled={exists}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                    exists 
                      ? "bg-muted opacity-50" 
                      : "bg-card hover:bg-primary/10 shadow-md"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${type.color}`} />
                  <span className="text-xs font-medium text-foreground">{type.label}</span>
                  <span className="text-xs text-muted-foreground">{type.defaultTime}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Reminders List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-serif text-lg font-semibold text-foreground mb-3">
            Seus Lembretes
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="rounded-2xl bg-card p-8 text-center shadow-md">
              <Bell className="mx-auto mb-3 h-12 w-12 text-primary/50" />
              <p className="text-muted-foreground">Nenhum lembrete configurado.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Crie lembretes para não esquecer de orar!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder, index) => {
                const typeInfo = getReminderTypeInfo(reminder.reminder_type);
                const Icon = typeInfo.icon;
                return (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className={`rounded-2xl bg-card p-4 shadow-md flex items-center gap-4 ${
                      !reminder.is_active && "opacity-60"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setEditingReminder(reminder);
                        setIsEditDialogOpen(true);
                      }}
                      className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                        reminder.is_active ? "bg-primary/10 hover:bg-primary/20" : "bg-muted"
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${reminder.is_active ? typeInfo.color : "text-muted-foreground"}`} />
                    </button>
                    
                    <button 
                      onClick={() => {
                        setEditingReminder(reminder);
                        setIsEditDialogOpen(true);
                      }}
                      className="flex-1 text-left"
                    >
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {typeInfo.label}
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </h3>
                      <p className="text-2xl font-bold text-primary">
                        {formatTime(reminder.reminder_time)}
                      </p>
                    </button>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={reminder.is_active}
                        onCheckedChange={() => handleToggleReminder(reminder.id, reminder.is_active)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 rounded-2xl bg-accent/50 p-5"
        >
          <h3 className="font-semibold text-foreground mb-2">💡 Dica</h3>
          <p className="text-sm text-muted-foreground">
            Reserve momentos específicos do dia para orar. A oração constante fortalece 
            sua comunhão com Deus e traz paz ao coração.
          </p>
          <p className="mt-3 text-sm font-medium text-primary">
            "Orai sem cessar." — 1 Tessalonicenses 5:17
          </p>
        </motion.div>
      </main>

      {/* Edit Dialog */}
      <EditReminderDialog
        reminder={editingReminder}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdateReminder}
      />

      <BottomNavigation />
    </div>
  );
};

export default LembretesOracao;
