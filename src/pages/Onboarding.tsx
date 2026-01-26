import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, User, MapPin, Bell, Sparkles, CheckCircle, BookOpen, Heart, Users, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import logoVidaEmCristo from "@/assets/logo-vida-em-cristo.png";

const brazilianStates = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const features = [
  { icon: BookOpen, title: "Estudos Bíblicos", description: "Mergulhe na Palavra de Deus" },
  { icon: Heart, title: "Devocional Diário", description: "Comece o dia com Deus" },
  { icon: Users, title: "Comunidade", description: "Conecte-se com outros jovens" },
  { icon: Trophy, title: "Conquistas", description: "Ganhe badges ao crescer" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    birth_date: "",
    state: "",
    city: "",
    events_enabled: true,
    prayers_enabled: true,
    devotionals_enabled: true,
    achievements_enabled: true,
    community_enabled: true,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      if (!isApproved) {
        navigate("/pending");
        return;
      }
      
      // Check if onboarding is already completed
      checkOnboardingStatus();
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        full_name: profile.full_name || "",
        phone: (profile as any).phone || "",
        birth_date: (profile as any).birth_date || "",
        state: (profile as any).state || "",
        city: (profile as any).city || "",
      }));
    }
  }, [profile]);

  const checkOnboardingStatus = async () => {
    const { data } = await supabase
      .from("onboarding_progress")
      .select("completed_at")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (data?.completed_at) {
      navigate("/dashboard");
    }
  };

  const steps = [
    { id: "welcome", title: "Bem-vindo", icon: Sparkles },
    { id: "profile", title: "Seu Perfil", icon: User },
    { id: "location", title: "Localização", icon: MapPin },
    { id: "notifications", title: "Notificações", icon: Bell },
    { id: "complete", title: "Pronto!", icon: CheckCircle },
  ];

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      await completeOnboarding();
    } else {
      if (currentStep === 1) {
        await saveProfile();
      } else if (currentStep === 2) {
        await saveLocation();
      } else if (currentStep === 3) {
        await saveNotifications();
      }
      setCurrentStep((prev) => prev + 1);
    }
  };

  const saveProfile = async () => {
    await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
      })
      .eq("user_id", user?.id);
  };

  const saveLocation = async () => {
    await supabase
      .from("profiles")
      .update({
        state: formData.state || null,
        city: formData.city || null,
      })
      .eq("user_id", user?.id);
  };

  const saveNotifications = async () => {
    await supabase.from("notification_preferences").upsert({
      user_id: user?.id,
      events_enabled: formData.events_enabled,
      prayers_enabled: formData.prayers_enabled,
      devotionals_enabled: formData.devotionals_enabled,
      achievements_enabled: formData.achievements_enabled,
      community_enabled: formData.community_enabled,
    });
  };

  const completeOnboarding = async () => {
    setIsSubmitting(true);
    
    await supabase.from("onboarding_progress").upsert({
      user_id: user?.id,
      step_profile: true,
      step_location: true,
      step_notifications: true,
      step_tutorial: true,
      completed_at: new Date().toISOString(),
    });

    toast({
      title: "Bem-vindo(a) à família! 🎉",
      description: "Sua jornada espiritual começa agora.",
    });

    navigate("/dashboard");
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.full_name.trim().length >= 3;
      default:
        return true;
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress indicator */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl px-4 py-4 safe-area-inset-top">
        <div className="flex gap-1.5">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                index <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 py-6 flex flex-col">
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                src={logoVidaEmCristo}
                alt="Vida em Cristo"
                className="h-24 w-auto mb-8"
              />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="font-serif text-3xl font-bold text-foreground mb-3">
                  Bem-vindo(a)!
                </h1>
                <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                  Estamos felizes em ter você conosco. Vamos configurar sua experiência.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8"
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="rounded-2xl bg-card p-4 shadow-md"
                  >
                    <feature.icon className="h-6 w-6 text-primary mb-2" />
                    <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Step 1: Profile */}
          {currentStep === 1 && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-semibold text-foreground">
                    Seu Perfil
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Conte-nos um pouco sobre você
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Nome completo *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Seu nome completo"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label>Telefone (opcional)</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label>Data de nascimento (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <motion.div
              key="location"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-semibold text-foreground">
                    Sua Localização
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Para conectar você com jovens da região
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Estado</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(v) => setFormData({ ...formData, state: v })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecione seu estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Sua cidade"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Essa informação é opcional e ajuda líderes a entender a distribuição geográfica.
              </p>
            </motion.div>
          )}

          {/* Step 3: Notifications */}
          {currentStep === 3 && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-semibold text-foreground">
                    Notificações
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    O que você quer receber?
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: "events_enabled", label: "Eventos e Cultos", description: "Avisos sobre próximos eventos" },
                  { key: "prayers_enabled", label: "Orações", description: "Pedidos de oração da comunidade" },
                  { key: "devotionals_enabled", label: "Devocionais", description: "Lembretes de devocional diário" },
                  { key: "achievements_enabled", label: "Conquistas", description: "Quando você desbloquear badges" },
                  { key: "community_enabled", label: "Comunidade", description: "Novos posts e interações" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm">
                    <div>
                      <h3 className="font-semibold text-foreground">{item.label}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      checked={formData[item.key as keyof typeof formData] as boolean}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, [item.key]: checked })
                      }
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 4 && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="mb-6"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
                  <CheckCircle className="h-12 w-12 text-primary" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="font-serif text-3xl font-bold text-foreground mb-3">
                  Tudo Pronto!
                </h1>
                <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                  Sua jornada espiritual começa agora. Que Deus abençoe cada passo!
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl bg-primary/10 p-6 max-w-sm"
              >
                <p className="font-serif italic text-foreground">
                  "Porque eu bem sei os planos que tenho para vós, diz o Senhor; planos de paz, e não de mal, para vos dar o fim que esperais."
                </p>
                <p className="mt-2 text-sm font-medium text-primary">— Jeremias 29:11</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom action */}
      <div className="sticky bottom-0 px-4 py-4 pb-safe bg-background/95 backdrop-blur-xl border-t border-border">
        <Button
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          className="w-full h-14 rounded-xl text-base font-semibold"
        >
          {isSubmitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : currentStep === steps.length - 1 ? (
            "Começar!"
          ) : (
            <>
              Continuar
              <ChevronRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
        
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <button
            onClick={() => setCurrentStep(steps.length - 1)}
            className="w-full mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular configuração
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
