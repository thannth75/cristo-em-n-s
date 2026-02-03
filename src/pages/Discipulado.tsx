import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Plus, Target, Calendar, CheckCircle2, ChevronRight, Heart, BookOpen, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface Profile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Discipleship {
  id: string;
  mentor_id: string;
  disciple_id: string;
  is_active: boolean;
  notes: string | null;
  started_at: string;
  mentor?: Profile;
  disciple?: Profile;
}

interface Goal {
  id: string;
  discipleship_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
}

interface Checkin {
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
  const [selectedDiscipleship, setSelectedDiscipleship] = useState<Discipleship | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isCheckinDialogOpen, setIsCheckinDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [newDiscipleship, setNewDiscipleship] = useState({ disciple_id: "", notes: "" });
  const [newGoal, setNewGoal] = useState({ title: "", description: "", target_date: "" });
  const [newCheckin, setNewCheckin] = useState({
    spiritual_health: 3,
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
      if (!user) {
        navigate("/auth");
      } else if (!isApproved) {
        navigate("/pending");
      }
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (isApproved && user) {
      fetchDiscipleships();
      if (canManage) {
        fetchProfiles();
      }
    }
  }, [isApproved, user, canManage]);

  const fetchDiscipleships = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from("discipleship")
      .select("*")
      .eq("is_active", true);

    if (!error && data) {
      // Fetch profiles for mentors and disciples
      const userIds = new Set<string>();
      data.forEach((d) => {
        userIds.add(d.mentor_id);
        userIds.add(d.disciple_id);
      });

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", Array.from(userIds));

      const profileMap: Record<string, Profile> = {};
      profilesData?.forEach((p) => {
        profileMap[p.user_id] = p;
      });

      const enrichedData = data.map((d) => ({
        ...d,
        mentor: profileMap[d.mentor_id],
        disciple: profileMap[d.disciple_id],
      }));

      setDiscipleships(enrichedData);
    }
    setIsLoading(false);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .eq("is_approved", true);

    if (data) {
      setProfiles(data);
    }
  };

  const fetchGoals = async (discipleshipId: string) => {
    const { data } = await supabase
      .from("discipleship_goals")
      .select("*")
      .eq("discipleship_id", discipleshipId)
      .order("created_at", { ascending: false });

    if (data) {
      setGoals(data);
    }
  };

  const fetchCheckins = async (discipleshipId: string) => {
    const { data } = await supabase
      .from("discipleship_checkins")
      .select("*")
      .eq("discipleship_id", discipleshipId)
      .order("checkin_date", { ascending: false });

    if (data) {
      setCheckins(data);
    }
  };

  const handleSelectDiscipleship = async (d: Discipleship) => {
    setSelectedDiscipleship(d);
    await Promise.all([fetchGoals(d.id), fetchCheckins(d.id)]);
  };

  const handleCreateDiscipleship = async () => {
    if (!newDiscipleship.disciple_id) return;

    const { error } = await supabase.from("discipleship").insert({
      mentor_id: user?.id,
      disciple_id: newDiscipleship.disciple_id,
      notes: newDiscipleship.notes || null,
    });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível criar o discipulado.", variant: "destructive" });
    } else {
      toast({ title: "Discipulado criado! 🙏", description: "Acompanhe o crescimento espiritual." });
      setIsNewDialogOpen(false);
      setNewDiscipleship({ disciple_id: "", notes: "" });
      fetchDiscipleships();
    }
  };

  const handleCreateGoal = async () => {
    if (!selectedDiscipleship || !newGoal.title) return;

    const { error } = await supabase.from("discipleship_goals").insert({
      discipleship_id: selectedDiscipleship.id,
      title: newGoal.title,
      description: newGoal.description || null,
      target_date: newGoal.target_date || null,
    });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível criar a meta.", variant: "destructive" });
    } else {
      toast({ title: "Meta criada! 🎯" });
      setIsGoalDialogOpen(false);
      setNewGoal({ title: "", description: "", target_date: "" });
      fetchGoals(selectedDiscipleship.id);
    }
  };

  const handleToggleGoal = async (goal: Goal) => {
    const { error } = await supabase
      .from("discipleship_goals")
      .update({
        is_completed: !goal.is_completed,
        completed_at: !goal.is_completed ? new Date().toISOString() : null,
      })
      .eq("id", goal.id);

    if (!error && selectedDiscipleship) {
      fetchGoals(selectedDiscipleship.id);
    }
  };

  const handleCreateCheckin = async () => {
    if (!selectedDiscipleship) return;

    const { error } = await supabase.from("discipleship_checkins").insert({
      discipleship_id: selectedDiscipleship.id,
      spiritual_health: newCheckin.spiritual_health,
      bible_reading: newCheckin.bible_reading,
      prayer_life: newCheckin.prayer_life,
      community_involvement: newCheckin.community_involvement,
      challenges: newCheckin.challenges || null,
      victories: newCheckin.victories || null,
      prayer_requests: newCheckin.prayer_requests || null,
    });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível registrar o check-in.", variant: "destructive" });
    } else {
      toast({ title: "Check-in registrado! ✅" });
      setIsCheckinDialogOpen(false);
      setNewCheckin({
        spiritual_health: 3,
        bible_reading: false,
        prayer_life: false,
        community_involvement: false,
        challenges: "",
        victories: "",
        prayer_requests: "",
      });
      fetchCheckins(selectedDiscipleship.id);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";
  const myDiscipleships = discipleships.filter(
    (d) => d.mentor_id === user?.id || d.disciple_id === user?.id
  );

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
        {selectedDiscipleship ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDiscipleship(null)}
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedDiscipleship.disciple?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(selectedDiscipleship.disciple?.full_name || "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="font-serif text-xl font-semibold text-foreground">
                    {selectedDiscipleship.disciple?.full_name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Mentor: {selectedDiscipleship.mentor?.full_name}
                  </p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="goals" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="goals">Metas</TabsTrigger>
                <TabsTrigger value="checkins">Check-ins</TabsTrigger>
              </TabsList>

              <TabsContent value="goals" className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-foreground">Metas de Crescimento</h2>
                  {(selectedDiscipleship.mentor_id === user?.id || canManage) && (
                    <Button size="sm" onClick={() => setIsGoalDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Nova
                    </Button>
                  )}
                </div>

                {goals.length === 0 ? (
                  <div className="rounded-2xl bg-card p-6 text-center">
                    <Target className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhuma meta definida.</p>
                  </div>
                ) : (
                  goals.map((goal) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-card p-4 shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleGoal(goal)}
                          className={`mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            goal.is_completed
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {goal.is_completed && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                        </button>
                        <div className="flex-1">
                          <h3 className={`font-semibold ${goal.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {goal.title}
                          </h3>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          )}
                          {goal.target_date && (
                            <p className="text-xs text-primary mt-2">
                              📅 {new Date(goal.target_date).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="checkins" className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-foreground">Check-ins Semanais</h2>
                  <Button size="sm" onClick={() => setIsCheckinDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Novo
                  </Button>
                </div>

                {checkins.length === 0 ? (
                  <div className="rounded-2xl bg-card p-6 text-center">
                    <Calendar className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhum check-in ainda.</p>
                  </div>
                ) : (
                  checkins.map((checkin) => (
                    <motion.div
                      key={checkin.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-card p-4 shadow-md"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-foreground">
                          {new Date(checkin.checkin_date).toLocaleDateString("pt-BR")}
                        </span>
                        <Badge variant="outline" className="bg-primary/10">
                          Saúde: {checkin.spiritual_health}/5
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {checkin.bible_reading && (
                          <Badge variant="secondary" className="text-xs">
                            <BookOpen className="h-3 w-3 mr-1" />
                            Leitura
                          </Badge>
                        )}
                        {checkin.prayer_life && (
                          <Badge variant="secondary" className="text-xs">
                            <Heart className="h-3 w-3 mr-1" />
                            Oração
                          </Badge>
                        )}
                        {checkin.community_involvement && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Comunidade
                          </Badge>
                        )}
                      </div>

                      {checkin.victories && (
                        <p className="text-sm text-muted-foreground">
                          <span className="text-primary">✨ Vitórias:</span> {checkin.victories}
                        </p>
                      )}
                      {checkin.challenges && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="text-destructive">⚠️ Desafios:</span> {checkin.challenges}
                        </p>
                      )}
                    </motion.div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
                    Discipulado
                  </h1>
                  <p className="text-sm text-muted-foreground">Crescimento espiritual</p>
                </div>
              </div>
              {canManage && (
                <Button onClick={() => setIsNewDialogOpen(true)} className="rounded-xl">
                  <Plus className="h-4 w-4 mr-1" />
                  Novo
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : myDiscipleships.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-card p-8 text-center shadow-md"
              >
                <Users className="mx-auto mb-3 h-12 w-12 text-primary/50" />
                <p className="text-muted-foreground">
                  {canManage
                    ? "Nenhum discipulado ativo. Crie um para começar."
                    : "Você ainda não participa de nenhum discipulado."}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {myDiscipleships.map((d, index) => {
                  const isMentor = d.mentor_id === user?.id;
                  const partner = isMentor ? d.disciple : d.mentor;
                  
                  return (
                    <motion.button
                      key={d.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectDiscipleship(d)}
                      className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 shadow-md hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={partner?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(partner?.full_name || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-foreground">{partner?.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {isMentor ? "Você é mentor" : "Seu mentor"}
                        </p>
                      </div>
                      <Badge variant={isMentor ? "default" : "secondary"}>
                        {isMentor ? "Mentor" : "Discípulo"}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </motion.button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* New Discipleship Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Novo Discipulado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Discípulo</Label>
              <Select
                value={newDiscipleship.disciple_id}
                onValueChange={(v) => setNewDiscipleship({ ...newDiscipleship, disciple_id: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione um jovem" />
                </SelectTrigger>
                <SelectContent>
                  {profiles
                    .filter((p) => p.user_id !== user?.id)
                    .map((p) => (
                      <SelectItem key={p.user_id} value={p.user_id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                value={newDiscipleship.notes}
                onChange={(e) => setNewDiscipleship({ ...newDiscipleship, notes: e.target.value })}
                placeholder="Observações sobre o discipulado..."
                className="rounded-xl"
              />
            </div>
            <Button onClick={handleCreateDiscipleship} className="w-full rounded-xl">
              Criar Discipulado
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Goal Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Nova Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder="Ex: Ler o livro de João"
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                placeholder="Detalhes da meta..."
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Data alvo (opcional)</Label>
              <Input
                type="date"
                value={newGoal.target_date}
                onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <Button onClick={handleCreateGoal} className="w-full rounded-xl">
              Criar Meta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkin Dialog */}
      <Dialog open={isCheckinDialogOpen} onOpenChange={setIsCheckinDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Check-in Semanal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Saúde Espiritual (1-5)</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNewCheckin({ ...newCheckin, spiritual_health: n })}
                    className={`h-10 w-10 rounded-full font-semibold transition-colors ${
                      newCheckin.spiritual_health === n
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Esta semana você...</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCheckin.bible_reading}
                    onChange={(e) => setNewCheckin({ ...newCheckin, bible_reading: e.target.checked })}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">Leu a Bíblia regularmente</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCheckin.prayer_life}
                    onChange={(e) => setNewCheckin({ ...newCheckin, prayer_life: e.target.checked })}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">Manteve vida de oração</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCheckin.community_involvement}
                    onChange={(e) => setNewCheckin({ ...newCheckin, community_involvement: e.target.checked })}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">Participou da comunidade</span>
                </label>
              </div>
            </div>

            <div>
              <Label>Vitórias da semana</Label>
              <Textarea
                value={newCheckin.victories}
                onChange={(e) => setNewCheckin({ ...newCheckin, victories: e.target.value })}
                placeholder="O que Deus fez de bom?"
                className="rounded-xl"
              />
            </div>

            <div>
              <Label>Desafios enfrentados</Label>
              <Textarea
                value={newCheckin.challenges}
                onChange={(e) => setNewCheckin({ ...newCheckin, challenges: e.target.value })}
                placeholder="Quais dificuldades você teve?"
                className="rounded-xl"
              />
            </div>

            <div>
              <Label>Pedidos de oração</Label>
              <Textarea
                value={newCheckin.prayer_requests}
                onChange={(e) => setNewCheckin({ ...newCheckin, prayer_requests: e.target.value })}
                placeholder="Como posso orar por você?"
                className="rounded-xl"
              />
            </div>

            <Button onClick={handleCreateCheckin} className="w-full rounded-xl">
              Registrar Check-in
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default Discipulado;
