import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Phone, LogOut, Settings, Shield, Bell, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Perfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Até logo! 🙏",
      description: "Volte sempre. Deus te abençoe!",
    });
    navigate("/auth");
  };

  const userName = user?.user_metadata?.full_name || "Jovem";
  const userEmail = user?.email || "";

  const menuItems = [
    { icon: User, label: "Editar Perfil", action: () => {} },
    { icon: Bell, label: "Notificações", action: () => {} },
    { icon: Shield, label: "Privacidade", action: () => {} },
    { icon: Settings, label: "Configurações", action: () => {} },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader userName={userName.split(" ")[0]} />

      <main className="px-4 py-6">
        {/* Perfil Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-3xl bg-card shadow-lg"
        >
          <div className="relative h-24 gradient-hope">
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-lg">
                <span className="font-serif text-3xl font-bold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-16 text-center">
            <h2 className="font-serif text-xl font-semibold text-foreground">{userName}</h2>
            <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{userEmail}</span>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm font-medium text-accent-foreground">Jovem</span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-3 gap-3"
        >
          {[
            { label: "Presenças", value: "12" },
            { label: "Estudos", value: "5" },
            { label: "Conquistas", value: "3" },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-card p-4 text-center shadow-md"
            >
              <p className="font-serif text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 overflow-hidden rounded-2xl bg-card shadow-md"
        >
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex w-full items-center justify-between border-b border-border p-4 last:border-0 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">{item.label}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleLogout}
            variant="outline"
            className="h-12 w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sair da Conta
          </Button>
        </motion.div>

        {/* Versículo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="font-serif italic text-muted-foreground">
            "Tudo quanto fizerdes, fazei-o para a glória de Deus."
          </p>
          <p className="mt-1 text-sm font-medium text-primary">— 1 Coríntios 10:31</p>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Perfil;
