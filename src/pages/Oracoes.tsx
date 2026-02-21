import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Send, Check, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useXpAward } from "@/hooks/useXpAward";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { prayerRequestSchema, validateInput } from "@/lib/validation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { LevelUpCelebration } from "@/components/gamification/LevelUpCelebration";

interface PrayerRequest {
  id: string;
  title: string;
  content: string;
  is_private: boolean;
  is_answered: boolean;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

const Oracoes = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isAdmin, isLeader, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { awardXp, showLevelUp, levelUpData, closeLevelUp } = useXpAward(user?.id);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPrayer, setNewPrayer] = useState({ title: "", content: "" });

  const canManage = isAdmin || isLeader;

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (isApproved && user) fetchPrayers();
  }, [isApproved, user]);

  const fetchPrayers = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from("prayer_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch profile info for each unique user
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      
      const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      setPrayers(data.map(p => ({
        ...p,
        profiles: profileMap.get(p.user_id) as any,
      })));
    } else {
      setPrayers([]);
    }
    setIsLoading(false);
  };

  const handleCreatePrayer = async () => {
    const validation = validateInput(prayerRequestSchema, { ...newPrayer, is_private: false });
    
    if (!validation.success) {
      toast({ title: "Erro de validação", description: validation.error, variant: "destructive" });
      return;
    }

    const validatedData = validation.data;
    const { data: insertedData, error } = await supabase.from("prayer_requests").insert({
      title: validatedData.title,
      content: validatedData.content,
      is_private: false,
      user_id: user?.id,
    }).select().single();

    if (error) {
      toast({ title: "Erro", description: "Não foi possível enviar o pedido.", variant: "destructive" });
    } else {
      await awardXp("oracao", insertedData?.id, "Pedido de oração");
      toast({ title: "Pedido enviado! 🙏", description: "Todos os irmãos poderão orar por você." });
      setIsDialogOpen(false);
      setNewPrayer({ title: "", content: "" });
      fetchPrayers();
    }
  };

  const markAsAnswered = async (prayerId: string) => {
    const { error } = await supabase
      .from("prayer_requests")
      .update({ is_answered: true, answered_at: new Date().toISOString() })
      .eq("id", prayerId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar.", variant: "destructive" });
    } else {
      await awardXp("oracao", prayerId, "Oração respondida!");
      toast({ title: "Oração respondida! 🎉" });
      fetchPrayers();
    }
  };

  const deletePrayer = async (prayerId: string) => {
    const { error } = await supabase.from("prayer_requests").delete().eq("id", prayerId);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    } else {
      toast({ title: "Pedido removido" });
      fetchPrayers();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))' }}>
      <AppHeader userName={userName} />

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Pedidos de Oração
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> Visível para todos os irmãos
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-xl shadow-lg">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif">Novo Pedido de Oração</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={newPrayer.title}
                    onChange={(e) => setNewPrayer({ ...newPrayer, title: e.target.value })}
                    placeholder="Resumo do pedido"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label>Seu pedido</Label>
                  <Textarea
                    value={newPrayer.content}
                    onChange={(e) => setNewPrayer({ ...newPrayer, content: e.target.value })}
                    placeholder="Descreva seu pedido de oração..."
                    className="rounded-xl min-h-[100px]"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  🙏 Todos os membros poderão ver e orar por você
                </p>
                <Button onClick={handleCreatePrayer} className="w-full rounded-xl">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Pedido
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-2 gap-3"
        >
          <div className="rounded-2xl gradient-hope p-5 text-primary-foreground">
            <p className="text-2xl font-bold">{prayers.filter((p) => !p.is_answered).length}</p>
            <p className="text-xs opacity-80">Pedidos ativos</p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-md">
            <p className="text-2xl font-bold text-foreground">
              {prayers.filter((p) => p.is_answered).length}
            </p>
            <p className="text-xs text-muted-foreground">Respondidos ✨</p>
          </div>
        </motion.div>

        {/* Prayer list */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : prayers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl bg-card p-8 text-center shadow-md"
            >
              <MessageSquare className="mx-auto mb-3 h-12 w-12 text-primary/50" />
              <p className="text-muted-foreground">Nenhum pedido ainda.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Clique no + para enviar um pedido.
              </p>
            </motion.div>
          ) : (
            prayers.map((prayer, index) => (
              <motion.div
                key={prayer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + index * 0.03 }}
                className={`rounded-2xl bg-card p-4 shadow-md ${prayer.is_answered ? "opacity-60" : ""}`}
              >
                {/* Author */}
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={prayer.profiles?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(prayer.profiles?.full_name || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {prayer.profiles?.full_name || "Irmão(ã)"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(prayer.created_at)}
                    </p>
                  </div>
                  {prayer.is_answered && (
                    <Badge className="bg-primary/10 text-primary text-xs">
                      Respondido ✨
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-foreground mb-1">{prayer.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">{prayer.content}</p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-border/50">
                  {!prayer.is_answered && (prayer.user_id === user?.id || canManage) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsAnswered(prayer.id)}
                      className="text-muted-foreground hover:text-primary text-xs"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Respondida
                    </Button>
                  )}
                  {(prayer.user_id === user?.id || canManage) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePrayer(prayer.id)}
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Excluir
                    </Button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Motivação */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 rounded-2xl bg-accent/50 p-5 text-center"
        >
          <p className="font-serif text-muted-foreground">
            "A oração feita por um justo pode muito em seus efeitos."
          </p>
          <p className="mt-2 text-sm font-medium text-primary">— Tiago 5:16</p>
        </motion.div>
      </main>

      <BottomNavigation />

      {levelUpData && (
        <LevelUpCelebration
          open={showLevelUp}
          onClose={closeLevelUp}
          newLevel={levelUpData.newLevel}
          levelTitle={levelUpData.levelTitle}
          levelIcon={levelUpData.levelIcon}
          rewards={levelUpData.rewards}
        />
      )}
    </div>
  );
};

export default Oracoes;
