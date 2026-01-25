import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Send, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { prayerRequestSchema, validateInput } from "@/lib/validation";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

interface PrayerRequest {
  id: string;
  title: string;
  content: string;
  is_private: boolean;
  is_answered: boolean;
  created_at: string;
  user_id: string;
}

const Oracoes = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isAdmin, isLeader, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPrayer, setNewPrayer] = useState({
    title: "",
    content: "",
    is_private: true,
  });

  const canManage = isAdmin || isLeader;

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
      fetchPrayers();
    }
  }, [isApproved, user, canManage]);

  const fetchPrayers = async () => {
    setIsLoading(true);
    
    // Líderes veem todos, usuários veem só os seus
    let query = supabase
      .from("prayer_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!canManage) {
      query = query.eq("user_id", user?.id);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos.",
        variant: "destructive",
      });
    } else {
      setPrayers(data || []);
    }
    setIsLoading(false);
  };

  const handleCreatePrayer = async () => {
    const validation = validateInput(prayerRequestSchema, newPrayer);
    
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const validatedData = validation.data;
    const { error } = await supabase.from("prayer_requests").insert({
      title: validatedData.title,
      content: validatedData.content,
      is_private: validatedData.is_private,
      user_id: user?.id,
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o pedido.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pedido enviado! 🙏",
        description: "Seus líderes estarão orando por você.",
      });
      setIsDialogOpen(false);
      setNewPrayer({ title: "", content: "", is_private: true });
      fetchPrayers();
    }
  };

  const markAsAnswered = async (prayerId: string) => {
    const { error } = await supabase
      .from("prayer_requests")
      .update({ is_answered: true, answered_at: new Date().toISOString() })
      .eq("id", prayerId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Oração respondida! 🎉" });
      fetchPrayers();
    }
  };

  const deletePrayer = async (prayerId: string) => {
    const { error } = await supabase.from("prayer_requests").delete().eq("id", prayerId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Pedido removido" });
      fetchPrayers();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

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
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Pedidos de Oração
              </h1>
              <p className="text-sm text-muted-foreground">
                {canManage ? "Todos os pedidos" : "Compartilhe com líderes"}
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
                <DialogTitle className="font-serif">Novo Pedido</DialogTitle>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="private" className="text-sm">
                    Pedido privado (só líderes veem)
                  </Label>
                  <Switch
                    id="private"
                    checked={newPrayer.is_private}
                    onCheckedChange={(checked) =>
                      setNewPrayer({ ...newPrayer, is_private: checked })
                    }
                  />
                </div>
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
            <p className="text-xs text-muted-foreground">Respondidos</p>
          </div>
        </motion.div>

        {/* Lista de Pedidos */}
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
                transition={{ delay: 0.1 + index * 0.05 }}
                className={`rounded-2xl bg-card p-4 shadow-md ${
                  prayer.is_answered ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {prayer.title}
                      </h3>
                      {prayer.is_answered && (
                        <Badge className="bg-primary/10 text-primary text-xs">
                          Respondido
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(prayer.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!prayer.is_answered && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsAnswered(prayer.id)}
                        className="text-muted-foreground hover:text-primary h-8 w-8"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {(prayer.user_id === user?.id || canManage) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePrayer(prayer.id)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {prayer.content}
                </p>
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
    </div>
  );
};

export default Oracoes;
