import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, LogOut, Shield, ChevronRight, Award, Calendar, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import GlowOrb from "@/components/GlowOrb";

const Perfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, roles, isAdmin, isLeader, isApproved, signOut, isLoading } = useAuth();
  const [stats, setStats] = useState({ presencas: 0, estudos: 0, conquistas: 0 });

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isApproved) {
        navigate("/pending");
      }
    }
  }, [user, isApproved, isLoading, navigate]);

  useEffect(() => {
    if (user && isApproved) {
      fetchStats();
    }
  }, [user, isApproved]);

  const fetchStats = async () => {
    const [attendanceRes, progressRes, achievementsRes] = await Promise.all([
      supabase.from("attendance").select("id", { count: "exact" }).eq("user_id", user?.id),
      supabase.from("study_progress").select("id", { count: "exact" }).eq("user_id", user?.id),
      supabase.from("user_achievements").select("id", { count: "exact" }).eq("user_id", user?.id),
    ]);

    setStats({
      presencas: attendanceRes.count || 0,
      estudos: progressRes.count || 0,
      conquistas: achievementsRes.count || 0,
    });
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Até logo! 🙏",
      description: "Volte sempre. Deus te abençoe!",
    });
    navigate("/auth");
  };

  const getRoleLabel = () => {
    if (isAdmin) return "Administrador";
    if (isLeader) return "Líder";
    return "Jovem";
  };

  const getRoleBadgeClass = () => {
    if (isAdmin) return "bg-destructive/10 text-destructive";
    if (isLeader) return "bg-gold/20 text-gold";
    return "bg-primary/10 text-primary";
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const userName = profile?.full_name || user?.user_metadata?.full_name || "Jovem";
  const userEmail = profile?.email || user?.email || "";

  const menuItems = [
    ...(isAdmin || isLeader
      ? [{ icon: Shield, label: "Administração", action: () => navigate("/admin") }]
      : []),
  ];

  return (
    <div className="relative min-h-screen bg-background pb-24 overflow-hidden">
      <GlowOrb className="absolute -top-32 -right-32 h-80 w-80 opacity-20" />
      
      <AppHeader userName={userName.split(" ")[0]} />

      <main className="relative z-10 px-4 py-6">
        {/* Perfil Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 overflow-hidden rounded-3xl bg-card shadow-lg"
        >
          <div className="relative h-28 gradient-hope">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.15),transparent_70%)]" />
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="relative"
              >
                <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full scale-125" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-xl">
                  <span className="font-serif text-3xl font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-16 text-center">
            <h2 className="font-serif text-xl font-semibold text-foreground">{userName}</h2>
            <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{userEmail}</span>
            </div>
            <div className="mt-4 flex justify-center">
              <Badge className={`${getRoleBadgeClass()} px-4 py-1.5`}>
                <Shield className="mr-1.5 h-3.5 w-3.5" />
                {getRoleLabel()}
              </Badge>
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/presenca")}
            className="rounded-2xl bg-card p-4 text-center shadow-md"
          >
            <Calendar className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="font-serif text-2xl font-bold text-foreground">{stats.presencas}</p>
            <p className="text-xs text-muted-foreground">Presenças</p>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/estudos")}
            className="rounded-2xl bg-card p-4 text-center shadow-md"
          >
            <BookOpen className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="font-serif text-2xl font-bold text-foreground">{stats.estudos}</p>
            <p className="text-xs text-muted-foreground">Estudos</p>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/conquistas")}
            className="rounded-2xl bg-card p-4 text-center shadow-md"
          >
            <Award className="mx-auto mb-1 h-5 w-5 text-gold" />
            <p className="font-serif text-2xl font-bold text-foreground">{stats.conquistas}</p>
            <p className="text-xs text-muted-foreground">Conquistas</p>
          </motion.button>
        </motion.div>

        {/* Menu */}
        {menuItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 overflow-hidden rounded-2xl bg-card shadow-md"
          >
            {menuItems.map((item) => (
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
        )}

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
