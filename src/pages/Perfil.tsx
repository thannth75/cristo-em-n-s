import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, LogOut, Shield, ChevronRight, Award, Calendar, BookOpen, Camera, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import GlowOrb from "@/components/GlowOrb";
import AvatarUpload from "@/components/perfil/AvatarUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Perfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, roles, isAdmin, isLeader, isApproved, signOut, isLoading } = useAuth();
  const [stats, setStats] = useState({ presencas: 0, estudos: 0, conquistas: 0 });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    birth_date: "",
  });

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
    if (profile) {
      setAvatarUrl(profile.avatar_url);
      setEditForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        birth_date: profile.birth_date || "",
      });
    }
  }, [profile]);

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

  const handleUpdateProfile = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editForm.full_name,
        phone: editForm.phone || null,
        birth_date: editForm.birth_date || null,
      })
      .eq("user_id", user?.id);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o perfil.", variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado! ✅", description: "Suas informações foram salvas." });
      setIsEditDialogOpen(false);
    }
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
                <div className="relative">
                  <AvatarUpload
                    userId={user?.id || ""}
                    currentAvatarUrl={avatarUrl}
                    userName={userName}
                    onAvatarChange={setAvatarUrl}
                  />
                </div>
              </motion.div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-16 text-center">
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-serif text-xl font-semibold text-foreground">{userName}</h2>
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
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

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="mx-4 max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Editar Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome completo</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Data de nascimento</Label>
              <Input
                type="date"
                value={editForm.birth_date}
                onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <Button onClick={handleUpdateProfile} className="w-full rounded-xl">
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default Perfil;
