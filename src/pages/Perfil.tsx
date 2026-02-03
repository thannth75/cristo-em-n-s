import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Mail, LogOut, Shield, ChevronRight, Award, Calendar, BookOpen, 
  Edit, BarChart3, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import GlowOrb from "@/components/GlowOrb";
import AvatarUpload from "@/components/perfil/AvatarUpload";
import CoverUpload from "@/components/perfil/CoverUpload";
import NotificationSettings from "@/components/perfil/NotificationSettings";
import LocationSettings from "@/components/perfil/LocationSettings";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Perfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, roles, isAdmin, isLeader, isApproved, signOut, isLoading } = useAuth();
  const [stats, setStats] = useState({ presencas: 0, estudos: 0, conquistas: 0, views: 0 });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [levelInfo, setLevelInfo] = useState<{ title: string; icon: string; xpRequired: number; nextXp: number } | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    birth_date: "",
    bio: "",
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
      setCoverUrl((profile as any).cover_url || null);
      setEditForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        birth_date: profile.birth_date || "",
        bio: (profile as any).bio || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user && isApproved) {
      fetchStats();
      fetchLevelInfo();
    }
  }, [user, isApproved]);

  const fetchStats = async () => {
    const [attendanceRes, progressRes, achievementsRes, viewsRes] = await Promise.all([
      supabase.from("attendance").select("id", { count: "exact" }).eq("user_id", user?.id),
      supabase.from("study_progress").select("id", { count: "exact" }).eq("user_id", user?.id),
      supabase.from("user_achievements").select("id", { count: "exact" }).eq("user_id", user?.id),
      supabase.from("profile_views").select("id", { count: "exact" }).eq("profile_user_id", user?.id),
    ]);

    setStats({
      presencas: attendanceRes.count || 0,
      estudos: progressRes.count || 0,
      conquistas: achievementsRes.count || 0,
      views: viewsRes.count || 0,
    });
  };

  const fetchLevelInfo = async () => {
    const currentLevel = (profile as any)?.current_level || 1;
    
    const { data: levelData } = await supabase
      .from("level_definitions")
      .select("*")
      .lte("level_number", currentLevel)
      .order("level_number", { ascending: false })
      .limit(1);

    const { data: nextLevelData } = await supabase
      .from("level_definitions")
      .select("xp_required")
      .eq("level_number", currentLevel + 1)
      .single();

    if (levelData?.[0]) {
      setLevelInfo({
        title: levelData[0].title,
        icon: levelData[0].icon,
        xpRequired: levelData[0].xp_required,
        nextXp: nextLevelData?.xp_required || levelData[0].xp_required + 100,
      });
    }
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
        bio: editForm.bio || null,
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
  const currentLevel = (profile as any)?.current_level || 1;
  const totalXp = (profile as any)?.total_xp || 0;
  const xpProgress = levelInfo 
    ? Math.min(((totalXp - levelInfo.xpRequired) / (levelInfo.nextXp - levelInfo.xpRequired)) * 100, 100)
    : 0;

  const menuItems = [
    ...(isAdmin || isLeader
      ? [
          { icon: BarChart3, label: "Dashboard de Líderes", action: () => navigate("/dashboard-lider") },
          { icon: Shield, label: "Administração", action: () => navigate("/admin") },
        ]
      : []),
  ];

  return (
    <div 
      className="relative min-h-screen bg-background overflow-hidden"
      style={{ paddingBottom: 'calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))' }}
    >
      {/* Cover Photo */}
      <div className="relative h-36 sm:h-48 bg-gradient-to-br from-primary/80 to-primary">
        {coverUrl && (
          <img 
            src={coverUrl} 
            alt="Cover" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
        <CoverUpload userId={user?.id || ""} currentCoverUrl={coverUrl} onCoverChange={setCoverUrl} />
      </div>

      <main className="relative z-10 px-4 -mt-16 max-w-2xl mx-auto" style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left, 16px))', paddingRight: 'max(1rem, env(safe-area-inset-right, 16px))' }}>
        {/* Avatar and Name */}
        <div className="flex flex-col items-center sm:flex-row sm:items-end sm:gap-4">
          <div className="relative">
            <AvatarUpload
              userId={user?.id || ""}
              currentAvatarUrl={avatarUrl}
              userName={userName}
              onAvatarChange={setAvatarUrl}
            />
            {levelInfo && (
              <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-lg">
                <LevelBadge level={currentLevel} icon={levelInfo.icon} title={levelInfo.title} size="sm" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0 sm:mb-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">{userName}</h2>
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
            {levelInfo && (
              <p className="text-primary font-medium text-sm flex items-center justify-center sm:justify-start gap-1">
                {levelInfo.icon} {levelInfo.title}
              </p>
            )}
            <div className="flex items-center justify-center sm:justify-start gap-1 text-xs text-muted-foreground mt-1">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[200px]">{userEmail}</span>
            </div>
            <Badge className={`${getRoleBadgeClass()} px-3 py-1 mt-2`}>
              <Shield className="mr-1 h-3 w-3" />
              {getRoleLabel()}
            </Badge>
          </div>

          <Button 
            variant="outline" 
            className="mt-4 sm:mt-0 sm:mb-2 rounded-xl"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar Perfil
          </Button>
        </div>

        {/* Bio */}
        {(profile as any)?.bio && (
          <p className="mt-4 text-muted-foreground text-sm text-center sm:text-left">
            {(profile as any).bio}
          </p>
        )}

        {/* XP Progress */}
        {levelInfo && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-2xl bg-card shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Nível {currentLevel}</span>
              <span className="text-xs text-muted-foreground">{totalXp} / {levelInfo.nextXp} XP</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {Math.round(levelInfo.nextXp - totalXp)} XP para o próximo nível
            </p>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: "Presenças", value: stats.presencas, icon: Calendar, action: () => navigate("/presenca") },
            { label: "Estudos", value: stats.estudos, icon: BookOpen, action: () => navigate("/estudos") },
            { label: "Conquistas", value: stats.conquistas, icon: Award, action: () => navigate("/conquistas") },
            { label: "Visitas", value: stats.views, icon: Eye, action: undefined },
          ].map((stat) => (
            <motion.button
              key={stat.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={stat.action}
              disabled={!stat.action}
              className="rounded-xl bg-card p-3 sm:p-4 text-center shadow-md disabled:cursor-default"
            >
              <stat.icon className="mx-auto mb-1.5 h-5 w-5 text-primary" />
              <p className="font-bold text-xl text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.button>
          ))}
        </motion.div>

        {/* Menu */}
        {menuItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 overflow-hidden rounded-2xl bg-card shadow-md"
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
          className="mt-6"
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
          className="mt-8 pb-4 text-center"
        >
          <p className="font-serif italic text-muted-foreground">
            "Tudo quanto fizerdes, fazei-o para a glória de Deus."
          </p>
          <p className="mt-1 text-sm font-medium text-primary">— 1 Coríntios 10:31</p>
        </motion.div>
      </main>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif">Configurações do Perfil</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="profile" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="location">Local</TabsTrigger>
              <TabsTrigger value="notifications">Alertas</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="profile" className="mt-0 space-y-4">
                <div>
                  <Label>Nome completo</Label>
                  <Input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label>Bio (sobre você)</Label>
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Conte um pouco sobre você..."
                    className="rounded-xl resize-none"
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {editForm.bio.length}/160
                  </p>
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
              </TabsContent>

              <TabsContent value="location" className="mt-0">
                <LocationSettings
                  userId={user?.id || ""}
                  currentState={(profile as any)?.state || null}
                  currentCity={(profile as any)?.city || null}
                  onUpdate={() => {}}
                />
              </TabsContent>

              <TabsContent value="notifications" className="mt-0">
                <NotificationSettings userId={user?.id || ""} />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default Perfil;