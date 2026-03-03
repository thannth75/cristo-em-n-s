import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Target,
  CheckCircle,
  Calendar,
  Heart,
  BookOpen,
  MessageCircle,
  ChevronRight,
  Star,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface Discipleship {
  id: string;
  mentor_id: string;
  disciple_id: string;
  started_at: string;
  is_active: boolean;
  notes: string | null;
  mentor_name?: string;
  disciple_name?: string;
}

interface DiscipleshipGoal {
  id: string;
  discipleship_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
}

interface DiscipleshipCheckin {
  id: string;
  discipleship_id: string;
  checkin_date: string;
  spiritual_health: number | null;
  bible_reading: boolean;
  prayer_life: boolean;
  community_involvement: boolean;
  challenges: string | null;
  victories: string | null;
  prayer_requests: string | null;
  mentor_feedback: string | null;
}

const Discipulado = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isAdmin, isLeader, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [discipleships, setDiscipleships] = useState<Discipleship[]>([]);
  const [selectedDisc, setSelectedDisc] = useState<Discipleship | null>(null);
  const [goals, setGoals] = useState<DiscipleshipGoal[]>([]);
  const [checkins, setCheckins] = useState<DiscipleshipCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isCheckinDialogOpen, setIsCheckinDialogOpen] = useState(false);

  const [availableMembers, setAvailableMembers] = useState<{ user_id: string; full_name: string }[]>([]);
  const [newDisciple, setNewDisciple] = useState({ disciple_id: "", notes: "" });
  const [newGoal, setNewGoal] = useState({ title: "", description: "", target_date: "" });
  const [newCheckin, setNewCheckin] = useState({
    spiritual_health: 7,
    bible_reading: false,
    prayer_life: false,
    community_involvement: false,
    challenges: "",
    victories: "",
    prayer_requests: "",
  });

  const canManage = isAdmin || isLeader;

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (isApproved && user) fetchDiscipleships();
  }, [isApproved, user]);

  const fetchDiscipleships = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("discipleship")
      .select("*")
      .eq("is_active", true);

    if (data) {
      const userIds = [...new Set(data.flatMap(d => [d.mentor_id, d.disciple_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const enriched = data.map(d => ({
        ...d,
        mentor_name: profiles?.find(p => p.user_id === d.mentor_id)?.full_name || "Mentor",
        disciple_name: profiles?.find(p => p.user_id === d.disciple_id)?.full_name || "Discípulo",
      }));
      setDiscipleships(enriched);
    }
    setIsLoading(false);
  };

  const fetchDetails = async (discId: string) => {
    const [goalsRes, checkinsRes] = await Promise.all([
      supabase.from("discipleship_goals").select("*").eq("discipleship_id", discId).order("created_at"),
      supabase.from("discipleship_checkins").select("*").eq("discipleship_id", discId).order("checkin_date", { ascending: false }).limit(10),
    ]);
    setGoals(goalsRes.data || []);
    setCheckins(checkinsRes.data || []);
  };

  const openCreateDialog = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name").eq("is_approved", true);
    setAvailableMembers(data || []);
    setIsCreateDialogOpen(true);
  };

  const handleCreateDiscipleship = async () => {
    if (!newDisciple.disciple_id) {
      toast({ title: "Selecione um discípulo", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("discipleship").insert({
      mentor_id: user!.id,
      disciple_id: newDisciple.disciple_id,
      notes: newDisciple.notes || null,
    });
    if (error) {
      toast({ title: "Erro ao criar discipulado", variant: "destructive" });
    } else {
      toast({ title: "Discipulado iniciado! 🙏" });
      setNewDisciple({ disciple_id: "", notes: "" });
      setIsCreateDialogOpen(false);
      fetchDiscipleships();
    }
  };

  const handleCreateGoal = async () => {
    if (!selectedDisc || !newGoal.title.trim()) return;
    const { error } = await supabase.from("discipleship_goals").insert({
      discipleship_id: selectedDisc.id,
      title: newGoal.title.trim(),
      description: newGoal.description.trim() || null,
      target_date: newGoal.target_date || null,
    });
    if (error) {
      toast({ title: "Erro ao criar meta", variant: "destructive" });
    } else {
      toast({ title: "Meta adicionada! 🎯" });
      setNewGoal({ title: "", description: "", target_date: "" });
      setIsGoalDialogOpen(false);
      fetchDetails(selectedDisc.id);
    }
  };

  const handleToggleGoal = async (goal: DiscipleshipGoal) => {
    const { error } = await supabase
      .from("discipleship_goals")
      .update({
        is_completed: !goal.is_completed,
        completed_at: !goal.is_completed ? new Date().toISOString() : null,
      })
      .eq("id", goal.id);
    if (!error && selectedDisc) fetchDetails(selectedDisc.id);
  };

  const handleCreateCheckin = async () => {
    if (!selectedDisc) return;
    const { error } = await supabase.from("discipleship_checkins").insert({
      discipleship_id: selectedDisc.id,
      spiritual_health: newCheckin.spiritual_health,
      bible_reading: newCheckin.bible_reading,
      prayer_life: newCheckin.prayer_life,
      community_involvement: newCheckin.community_involvement,
      challenges: newCheckin.challenges || null,
      victories: newCheckin.victories || null,
      prayer_requests: newCheckin.prayer_requests || null,
    });
    if (error) {
      toast({ title: "Erro ao salvar check-in", variant: "destructive" });
    } else {
      toast({ title: "Check-in registrado! ✅" });
      setNewCheckin({
        spiritual_health: 7, bible_reading: false, prayer_life: false,
        community_involvement: false, challenges: "", victories: "", prayer_requests: "",
      });
      setIsCheckinDialogOpen(false);
      fetchDetails(selectedDisc.id);
    }
  };

  const myDiscipleships = discipleships.filter(
    d => d.mentor_id === user?.id || d.disciple_id === user?.id
  );
  const isMentor = (d: Discipleship) => d.mentor_id === user?.id;

  const completedGoals = goals.filter(g => g.is_completed).length;
  const goalProgress = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

  const avgHealth = checkins.length > 0
    ? Math.round(checkins.reduce((s, c) => s + (c.spiritual_health || 0), 0) / checkins.length)
    : 0;

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

      <main className="px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">Discipulado</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Crescimento espiritual guiado</p>
            </div>
          </div>
        </motion.div>

        {selectedDisc ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <Button variant="ghost" onClick={() => setSelectedDisc(null)}>← Voltar</Button>

            {/* Header Card */}
            <div className="rounded-2xl bg-card p-5 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isMentor(selectedDisc) ? "Discípulo" : "Mentor"}</p>
                  <h2 className="font-serif text-lg font-semibold text-foreground">
                    {isMentor(selectedDisc) ? selectedDisc.disciple_name : selectedDisc.mentor_name}
                  </h2>
                </div>
              </div>

              {/* Progress Overview */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center rounded-xl bg-muted/50 p-3">
                  <Target className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold text-foreground">{completedGoals}/{goals.length}</p>
                  <p className="text-xs text-muted-foreground">Metas</p>
                </div>
                <div className="text-center rounded-xl bg-muted/50 p-3">
                  <TrendingUp className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold text-foreground">{avgHealth}/10</p>
                  <p className="text-xs text-muted-foreground">Saúde</p>
                </div>
                <div className="text-center rounded-xl bg-muted/50 p-3">
                  <Calendar className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold text-foreground">{checkins.length}</p>
                  <p className="text-xs text-muted-foreground">Check-ins</p>
                </div>
              </div>

              {goals.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progresso das metas</span>
                    <span className="text-primary font-semibold">{goalProgress}%</span>
                  </div>
                  <Progress value={goalProgress} className="h-2" />
                </div>
              )}
            </div>

            <Tabs defaultValue="goals" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="goals">Metas</TabsTrigger>
                <TabsTrigger value="checkins">Check-ins</TabsTrigger>
              </TabsList>

              <TabsContent value="goals" className="space-y-3">
                {isMentor(selectedDisc) && (
                  <Button onClick={() => setIsGoalDialogOpen(true)} className="w-full rounded-xl">
                    <Plus className="mr-2 h-4 w-4" /> Nova Meta
                  </Button>
                )}
                {goals.length === 0 ? (
                  <div className="rounded-2xl bg-card p-6 text-center">
                    <Target className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhuma meta definida</p>
                  </div>
                ) : (
                  goals.map(goal => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <button onClick={() => handleToggleGoal(goal)} className="mt-0.5">
                          <CheckCircle className={`h-5 w-5 ${goal.is_completed ? 'text-primary' : 'text-muted-foreground/30'}`} />
                        </button>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${goal.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {goal.title}
                          </h4>
                          {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
                          {goal.target_date && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Prazo: {new Date(goal.target_date + "T00:00:00").toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="checkins" className="space-y-3">
                <Button onClick={() => setIsCheckinDialogOpen(true)} className="w-full rounded-xl">
                  <Plus className="mr-2 h-4 w-4" /> Novo Check-in
                </Button>
                {checkins.length === 0 ? (
                  <div className="rounded-2xl bg-card p-6 text-center">
                    <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhum check-in registrado</p>
                  </div>
                ) : (
                  checkins.map(ci => (
                    <div key={ci.id} className="rounded-2xl bg-card p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-primary">
                          {new Date(ci.checkin_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round((ci.spiritual_health || 0) / 2) ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3 mb-3 flex-wrap">
                        {ci.bible_reading && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> Leitura
                          </span>
                        )}
                        {ci.prayer_life && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                            <Heart className="h-3 w-3" /> Oração
                          </span>
                        )}
                        {ci.community_involvement && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                            <Users className="h-3 w-3" /> Comunidade
                          </span>
                        )}
                      </div>
                      {ci.victories && <p className="text-sm text-foreground mb-1">🏆 {ci.victories}</p>}
                      {ci.challenges && <p className="text-sm text-muted-foreground mb-1">💪 {ci.challenges}</p>}
                      {ci.prayer_requests && <p className="text-sm text-muted-foreground italic">🙏 {ci.prayer_requests}</p>}
                      {ci.mentor_feedback && (
                        <div className="mt-2 rounded-lg bg-primary/5 p-3 border-l-4 border-primary">
                          <p className="text-xs text-muted-foreground mb-1">Feedback do mentor:</p>
                          <p className="text-sm text-foreground">{ci.mentor_feedback}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {canManage && (
              <Button onClick={openCreateDialog} className="w-full rounded-xl">
                <Plus className="mr-2 h-4 w-4" /> Iniciar Discipulado
              </Button>
            )}

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : myDiscipleships.length === 0 ? (
              <div className="rounded-2xl bg-card p-8 text-center shadow-md">
                <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <h3 className="font-semibold text-foreground mb-2">Nenhum discipulado</h3>
                <p className="text-sm text-muted-foreground">
                  {canManage ? "Inicie um discipulado com alguém da comunidade." : "Seu líder pode iniciar um discipulado com você."}
                </p>
              </div>
            ) : (
              myDiscipleships.map((disc, index) => (
                <motion.button
                  key={disc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => { setSelectedDisc(disc); fetchDetails(disc.id); }}
                  className="w-full rounded-2xl bg-card p-4 shadow-md text-left flex items-center gap-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{isMentor(disc) ? "Discípulo" : "Mentor"}</p>
                    <h3 className="font-semibold text-foreground truncate">
                      {isMentor(disc) ? disc.disciple_name : disc.mentor_name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Desde {new Date(disc.started_at || "").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </motion.button>
              ))
            )}
          </div>
        )}

        {/* Create Discipleship Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Iniciar Discipulado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Discípulo</Label>
                <Select value={newDisciple.disciple_id} onValueChange={v => setNewDisciple(p => ({ ...p, disciple_id: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {availableMembers.filter(m => m.user_id !== user?.id).map(m => (
                      <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observações (opcional)</Label>
                <Textarea value={newDisciple.notes} onChange={e => setNewDisciple(p => ({ ...p, notes: e.target.value }))} className="rounded-xl" placeholder="Objetivos do discipulado..." />
              </div>
              <Button onClick={handleCreateDiscipleship} className="w-full rounded-xl">Iniciar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Goal Dialog */}
        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título da meta</Label>
                <Input value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))} className="rounded-xl" placeholder="Ex: Ler o livro de João" />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea value={newGoal.description} onChange={e => setNewGoal(p => ({ ...p, description: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label>Prazo (opcional)</Label>
                <Input type="date" value={newGoal.target_date} onChange={e => setNewGoal(p => ({ ...p, target_date: e.target.value }))} className="rounded-xl" />
              </div>
              <Button onClick={handleCreateGoal} className="w-full rounded-xl">Criar Meta</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Check-in Dialog */}
        <Dialog open={isCheckinDialogOpen} onOpenChange={setIsCheckinDialogOpen}>
          <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Check-in Semanal</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Saúde espiritual: {newCheckin.spiritual_health}/10</Label>
                <Slider
                  value={[newCheckin.spiritual_health]}
                  onValueChange={v => setNewCheckin(p => ({ ...p, spiritual_health: v[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="py-2"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox checked={newCheckin.bible_reading} onCheckedChange={v => setNewCheckin(p => ({ ...p, bible_reading: !!v }))} />
                  <Label className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Leitura bíblica em dia</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={newCheckin.prayer_life} onCheckedChange={v => setNewCheckin(p => ({ ...p, prayer_life: !!v }))} />
                  <Label className="flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Vida de oração ativa</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={newCheckin.community_involvement} onCheckedChange={v => setNewCheckin(p => ({ ...p, community_involvement: !!v }))} />
                  <Label className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Participando da comunidade</Label>
                </div>
              </div>

              <div>
                <Label>🏆 Vitórias da semana</Label>
                <Textarea value={newCheckin.victories} onChange={e => setNewCheckin(p => ({ ...p, victories: e.target.value }))} className="rounded-xl" placeholder="O que Deus fez por você?" />
              </div>
              <div>
                <Label>💪 Desafios</Label>
                <Textarea value={newCheckin.challenges} onChange={e => setNewCheckin(p => ({ ...p, challenges: e.target.value }))} className="rounded-xl" placeholder="Dificuldades que está enfrentando..." />
              </div>
              <div>
                <Label>🙏 Pedidos de oração</Label>
                <Textarea value={newCheckin.prayer_requests} onChange={e => setNewCheckin(p => ({ ...p, prayer_requests: e.target.value }))} className="rounded-xl" placeholder="O que deseja que orem por você?" />
              </div>

              <Button onClick={handleCreateCheckin} className="w-full rounded-xl">Salvar Check-in</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Discipulado;
