import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Heart, 
  Plus, 
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

interface Testimony {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  is_anonymous: boolean;
  is_approved: boolean;
  likes_count: number;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null };
  user_liked?: boolean;
}

const categories = [
  { value: "geral", label: "Geral", emoji: "✨" },
  { value: "cura", label: "Cura", emoji: "💚" },
  { value: "libertacao", label: "Libertação", emoji: "⛓️‍💥" },
  { value: "provisao", label: "Provisão", emoji: "🎁" },
  { value: "restauracao", label: "Restauração", emoji: "🌱" },
  { value: "conversao", label: "Conversão", emoji: "🕊️" },
  { value: "milagre", label: "Milagre", emoji: "🌟" },
];

const Testemunhos = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isAdmin, isLeader, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [myTestimonies, setMyTestimonies] = useState<Testimony[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newTestimony, setNewTestimony] = useState({
    title: "",
    content: "",
    category: "geral",
    is_anonymous: false,
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
      fetchTestimonies();
    }
  }, [isApproved, user]);

  const fetchTestimonies = async () => {
    setIsLoading(true);
    
    // Fetch approved testimonies
    const { data: approvedData } = await supabase
      .from("testimonies")
      .select("*")
      .eq("is_approved", true)
      .order("created_at", { ascending: false });

    if (approvedData) {
      // Fetch profiles for non-anonymous testimonies
      const userIds = [...new Set(approvedData.filter(t => !t.is_anonymous).map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      // Check which testimonies user has liked
      const { data: userLikes } = await supabase
        .from("testimony_likes")
        .select("testimony_id")
        .eq("user_id", user?.id);

      const likedIds = new Set(userLikes?.map(l => l.testimony_id) || []);

      const testimoniesWithProfiles = approvedData.map(t => ({
        ...t,
        profiles: t.is_anonymous ? undefined : profiles?.find(p => p.user_id === t.user_id),
        user_liked: likedIds.has(t.id),
      }));

      setTestimonies(testimoniesWithProfiles);
    }

    // Fetch my testimonies
    const { data: myData } = await supabase
      .from("testimonies")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    setMyTestimonies(myData || []);
    setIsLoading(false);
  };

  const handleCreateTestimony = async () => {
    if (!newTestimony.title.trim() || !newTestimony.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e o testemunho.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("testimonies").insert({
      user_id: user?.id,
      title: newTestimony.title,
      content: newTestimony.content,
      category: newTestimony.category,
      is_anonymous: newTestimony.is_anonymous,
      is_approved: isAdmin || isLeader, // Auto-approve for leaders
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o testemunho.",
        variant: "destructive",
      });
    } else {
      const message = isAdmin || isLeader 
        ? "Seu testemunho foi publicado!" 
        : "Seu testemunho foi enviado para aprovação.";
      
      toast({
        title: "Testemunho enviado! 🙏",
        description: message,
      });
      setIsDialogOpen(false);
      setNewTestimony({ title: "", content: "", category: "geral", is_anonymous: false });
      fetchTestimonies();
    }
  };

  const handleLikeTestimony = async (testimonyId: string, currentlyLiked: boolean) => {
    if (currentlyLiked) {
      await supabase.from("testimony_likes").delete().eq("testimony_id", testimonyId).eq("user_id", user?.id);
      await supabase.from("testimonies").update({ 
        likes_count: testimonies.find(t => t.id === testimonyId)!.likes_count - 1 
      }).eq("id", testimonyId);
    } else {
      await supabase.from("testimony_likes").insert({ testimony_id: testimonyId, user_id: user?.id });
      await supabase.from("testimonies").update({ 
        likes_count: testimonies.find(t => t.id === testimonyId)!.likes_count + 1 
      }).eq("id", testimonyId);
    }
    fetchTestimonies();
  };

  const handleApproveTestimony = async (testimonyId: string) => {
    const { error } = await supabase
      .from("testimonies")
      .update({ is_approved: true })
      .eq("id", testimonyId);

    if (!error) {
      toast({ title: "Testemunho aprovado! ✅" });
      fetchTestimonies();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryInfo = (category: string) => {
    return categories.find(c => c.value === category) || categories[0];
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const pendingTestimonies = myTestimonies.filter(t => !t.is_approved);

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
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Testemunhos
              </h1>
              <p className="text-sm text-muted-foreground">
                Histórias de fé e vitória
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
                <DialogTitle className="font-serif">Compartilhar Testemunho</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={newTestimony.title}
                    onChange={(e) => setNewTestimony({ ...newTestimony, title: e.target.value })}
                    placeholder="Ex: Deus me curou da ansiedade"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label>Categoria</Label>
                  <Select 
                    value={newTestimony.category} 
                    onValueChange={(value) => setNewTestimony({ ...newTestimony, category: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.emoji} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Seu testemunho</Label>
                  <Textarea
                    value={newTestimony.content}
                    onChange={(e) => setNewTestimony({ ...newTestimony, content: e.target.value })}
                    placeholder="Conte sua história de como Deus agiu em sua vida..."
                    className="rounded-xl min-h-[150px]"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-2">
                    {newTestimony.is_anonymous ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">Publicar anonimamente</span>
                  </div>
                  <Switch
                    checked={newTestimony.is_anonymous}
                    onCheckedChange={(checked) => setNewTestimony({ ...newTestimony, is_anonymous: checked })}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  {isAdmin || isLeader 
                    ? "✅ Seu testemunho será publicado imediatamente."
                    : "⏳ Seu testemunho será revisado por um líder antes de ser publicado."
                  }
                </p>

                <Button onClick={handleCreateTestimony} className="w-full rounded-xl">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Testemunho
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="meus">
              Meus {pendingTestimonies.length > 0 && `(${pendingTestimonies.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Todos os Testemunhos */}
          <TabsContent value="todos" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : testimonies.length === 0 ? (
              <div className="rounded-2xl bg-card p-8 text-center">
                <Sparkles className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhum testemunho ainda.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Seja o primeiro a compartilhar sua história!
                </p>
              </div>
            ) : (
              testimonies.map((testimony, index) => (
                <motion.div
                  key={testimony.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="rounded-2xl bg-card p-5 shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg">
                        {getCategoryInfo(testimony.category).emoji}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {testimony.is_anonymous 
                            ? "Anônimo" 
                            : testimony.profiles?.full_name || "Membro"
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(testimony.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {getCategoryInfo(testimony.category).label}
                    </span>
                  </div>
                  
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
                    {testimony.title}
                  </h3>
                  <p className="text-muted-foreground text-sm whitespace-pre-line">
                    {testimony.content}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                    <button
                      onClick={() => handleLikeTestimony(testimony.id, testimony.user_liked || false)}
                      className={`flex items-center gap-1 text-sm ${
                        testimony.user_liked ? "text-red-500" : "text-muted-foreground"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${testimony.user_liked ? "fill-current" : ""}`} />
                      {testimony.likes_count}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Meus Testemunhos */}
          <TabsContent value="meus" className="space-y-4">
            {myTestimonies.length === 0 ? (
              <div className="rounded-2xl bg-card p-8 text-center">
                <Sparkles className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Você ainda não compartilhou nenhum testemunho.</p>
              </div>
            ) : (
              myTestimonies.map((testimony, index) => (
                <motion.div
                  key={testimony.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="rounded-2xl bg-card p-4 shadow-md"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{testimony.title}</h3>
                      <p className="text-xs text-muted-foreground">{formatDate(testimony.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {testimony.is_approved ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Publicado
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {testimony.content}
                  </p>
                  {testimony.is_anonymous && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />
                      Publicado anonimamente
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Testemunhos;
