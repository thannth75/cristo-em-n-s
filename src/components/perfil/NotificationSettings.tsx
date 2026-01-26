import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Calendar, Heart, BookOpen, Award, Users, Settings, BellOff, BellRing, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotificationSettingsProps {
  userId: string;
}

interface NotificationPreferences {
  events_enabled: boolean;
  prayers_enabled: boolean;
  devotionals_enabled: boolean;
  achievements_enabled: boolean;
  community_enabled: boolean;
}

const NotificationSettings = ({ userId }: NotificationSettingsProps) => {
  const { toast } = useToast();
  const { isSupported, permission, isEnabled, requestPermission, swRegistration } = usePushNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    events_enabled: true,
    prayers_enabled: true,
    devotionals_enabled: true,
    achievements_enabled: true,
    community_enabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const hasServiceWorker = !!swRegistration;

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const fetchPreferences = async () => {
    const { data } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setPreferences({
        events_enabled: data.events_enabled ?? true,
        prayers_enabled: data.prayers_enabled ?? true,
        devotionals_enabled: data.devotionals_enabled ?? true,
        achievements_enabled: data.achievements_enabled ?? true,
        community_enabled: data.community_enabled ?? true,
      });
    }
    setIsLoading(false);
  };

  const savePreferences = async (newPrefs: NotificationPreferences) => {
    setIsSaving(true);
    
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: userId,
        ...newPrefs,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as preferências.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Preferências salvas! ✅",
      });
    }
    
    setIsSaving(false);
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      // Save that notifications are enabled
      savePreferences(preferences);
    }
  };

  const notificationOptions = [
    {
      key: "events_enabled" as const,
      icon: Calendar,
      label: "Eventos e Cultos",
      description: "Lembretes de eventos próximos e escalas",
    },
    {
      key: "prayers_enabled" as const,
      icon: Heart,
      label: "Orações",
      description: "Lembretes de oração e pedidos da comunidade",
    },
    {
      key: "devotionals_enabled" as const,
      icon: BookOpen,
      label: "Devocionais",
      description: "Novos devocionais e leituras diárias",
    },
    {
      key: "achievements_enabled" as const,
      icon: Award,
      label: "Conquistas",
      description: "Novas conquistas e marcos alcançados",
    },
    {
      key: "community_enabled" as const,
      icon: Users,
      label: "Comunidade",
      description: "Novos posts e interações na comunidade",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Push Permission Banner - Denied */}
      {isSupported && permission === "denied" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/20">
              <BellOff className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">Notificações Bloqueadas</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Você bloqueou as notificações. Para ativá-las, acesse as configurações do navegador.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Push Permission Banner - Not Granted Yet */}
      {isSupported && permission !== "denied" && !isEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-primary/10 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">Ativar Notificações Push</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Receba alertas importantes mesmo quando o app estiver fechado.
              </p>
              <Button
                onClick={handleEnableNotifications}
                size="sm"
                className="mt-3 rounded-xl"
              >
                <BellRing className="h-4 w-4 mr-2" />
                Ativar Agora
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Status - Enabled */}
      {isEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-primary/10 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Notificações Ativas ✓</p>
              <p className="text-sm text-muted-foreground">Você receberá alertas importantes</p>
            </div>
          </div>
          
          {/* Background notification support indicator */}
          <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-background/50">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {hasServiceWorker 
                ? "✓ Notificações em segundo plano ativas" 
                : "Notificações apenas com app aberto"}
            </span>
          </div>
        </motion.div>
      )}

      {/* Preferences */}
      <div className="rounded-2xl bg-card p-4 shadow-md space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Preferências</h3>
        </div>

        {notificationOptions.map((option, index) => (
          <motion.div
            key={option.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <option.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label className="text-foreground font-medium">{option.label}</Label>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </div>
            <Switch
              checked={preferences[option.key]}
              onCheckedChange={() => handleToggle(option.key)}
              disabled={isSaving}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NotificationSettings;
