import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  MapPin,
  Clock,
  Calendar,
  ChevronRight,
  UserPlus,
  UserMinus,
  Check,
  Edit,
  BookOpen
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

interface Cell {
  id: string;
  name: string;
  description: string | null;
  leader_id: string;
  meeting_day: string | null;
  meeting_time: string | null;
  meeting_location: string | null;
  is_active: boolean;
  member_count?: number;
  is_member?: boolean;
  leader_name?: string;
}

interface CellMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: { full_name: string; avatar_url: string | null };
}

interface CellMeeting {
  id: string;
  cell_id: string;
  meeting_date: string;
  topic: string | null;
  notes: string | null;
  attendance_count: number;
}

const DAYS_OF_WEEK = [
  { value: "domingo", label: "Domingo" },
  { value: "segunda", label: "Segunda-feira" },
  { value: "terca", label: "Terça-feira" },
  { value: "quarta", label: "Quarta-feira" },
  { value: "quinta", label: "Quinta-feira" },
  { value: "sexta", label: "Sexta-feira" },
  { value: "sabado", label: "Sábado" },
];

const Celulas = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isAdmin, isLeader, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [cells, setCells] = useState<Cell[]>([]);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [cellMembers, setCellMembers] = useState<CellMember[]>([]);
  const [cellMeetings, setCellMeetings] = useState<CellMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  
  const [newCell, setNewCell] = useState({
    name: "",
    description: "",
    meeting_day: "",
    meeting_time: "",
    meeting_location: "",
  });
  
  const [newMeeting, setNewMeeting] = useState({
    meeting_date: "",
    topic: "",
    notes: "",
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
      fetchCells();
    }
  }, [isApproved, user]);

  const fetchCells = async () => {
    setIsLoading(true);
    
    const { data: cellsData } = await supabase
      .from("cells")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (cellsData) {
      // Get member counts and check if user is member
      const cellIds = cellsData.map(c => c.id);
      
      const { data: membersData } = await supabase
        .from("cell_members")
        .select("cell_id, user_id")
        .in("cell_id", cellIds);

      const { data: leadersData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", cellsData.map(c => c.leader_id));

      const cellsWithInfo = cellsData.map(cell => {
        const members = membersData?.filter(m => m.cell_id === cell.id) || [];
        const leader = leadersData?.find(l => l.user_id === cell.leader_id);
        return {
          ...cell,
          member_count: members.length,
          is_member: members.some(m => m.user_id === user?.id),
          leader_name: leader?.full_name || "Líder",
        };
      });

      setCells(cellsWithInfo);
    }
    
    setIsLoading(false);
  };

  const fetchCellDetails = async (cellId: string) => {
    // Fetch members
    const { data: membersData } = await supabase
      .from("cell_members")
      .select("*")
      .eq("cell_id", cellId);

    if (membersData) {
      const userIds = membersData.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const membersWithProfiles = membersData.map(member => ({
        ...member,
        profile: profiles?.find(p => p.user_id === member.user_id),
      }));

      setCellMembers(membersWithProfiles);
    }

    // Fetch meetings
    const { data: meetingsData } = await supabase
      .from("cell_meetings")
      .select("*")
      .eq("cell_id", cellId)
      .order("meeting_date", { ascending: false })
      .limit(10);

    setCellMeetings(meetingsData || []);
  };

  const handleCreateCell = async () => {
    if (!newCell.name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("cells").insert({
      name: newCell.name.trim(),
      description: newCell.description.trim() || null,
      leader_id: user?.id,
      meeting_day: newCell.meeting_day || null,
      meeting_time: newCell.meeting_time || null,
      meeting_location: newCell.meeting_location.trim() || null,
    });

    if (error) {
      toast({ title: "Erro ao criar célula", variant: "destructive" });
    } else {
      toast({ title: "Célula criada! 🎉" });
      setNewCell({ name: "", description: "", meeting_day: "", meeting_time: "", meeting_location: "" });
      setIsCreateDialogOpen(false);
      fetchCells();
    }
  };

  const handleJoinCell = async (cellId: string) => {
    const { error } = await supabase.from("cell_members").insert({
      cell_id: cellId,
      user_id: user?.id,
      role: "membro",
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Você já é membro desta célula" });
      } else {
        toast({ title: "Erro ao entrar na célula", variant: "destructive" });
      }
    } else {
      toast({ title: "Bem-vindo à célula! 🙏" });
      fetchCells();
      if (selectedCell?.id === cellId) {
        fetchCellDetails(cellId);
      }
    }
  };

  const handleLeaveCell = async (cellId: string) => {
    const { error } = await supabase
      .from("cell_members")
      .delete()
      .eq("cell_id", cellId)
      .eq("user_id", user?.id);

    if (error) {
      toast({ title: "Erro ao sair da célula", variant: "destructive" });
    } else {
      toast({ title: "Você saiu da célula" });
      fetchCells();
      if (selectedCell?.id === cellId) {
        fetchCellDetails(cellId);
      }
    }
  };

  const handleCreateMeeting = async () => {
    if (!selectedCell || !newMeeting.meeting_date) {
      toast({ title: "Data obrigatória", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("cell_meetings").insert({
      cell_id: selectedCell.id,
      meeting_date: newMeeting.meeting_date,
      topic: newMeeting.topic.trim() || null,
      notes: newMeeting.notes.trim() || null,
      created_by: user?.id,
    });

    if (error) {
      toast({ title: "Erro ao criar encontro", variant: "destructive" });
    } else {
      toast({ title: "Encontro agendado! 📅" });
      setNewMeeting({ meeting_date: "", topic: "", notes: "" });
      setIsMeetingDialogOpen(false);
      fetchCellDetails(selectedCell.id);
    }
  };

  const formatDayLabel = (day: string | null) => {
    return DAYS_OF_WEEK.find(d => d.value === day)?.label || day;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";
  const canManageCells = isAdmin || isLeader;

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
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">Células</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Pequenos grupos de comunhão</p>
            </div>
          </div>
        </motion.div>

        {selectedCell ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Button variant="ghost" onClick={() => setSelectedCell(null)} className="mb-2">
              ← Voltar
            </Button>

            <div className="rounded-2xl bg-card p-5 shadow-md">
              <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
                {selectedCell.name}
              </h2>
              {selectedCell.description && (
                <p className="text-muted-foreground mb-4">{selectedCell.description}</p>
              )}
              
              <div className="space-y-2 text-sm">
                {selectedCell.meeting_day && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDayLabel(selectedCell.meeting_day)}</span>
                    {selectedCell.meeting_time && (
                      <span>às {selectedCell.meeting_time.slice(0, 5)}</span>
                    )}
                  </div>
                )}
                {selectedCell.meeting_location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedCell.meeting_location}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {selectedCell.is_member ? (
                  <Button
                    variant="outline"
                    onClick={() => handleLeaveCell(selectedCell.id)}
                    className="rounded-xl"
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Sair da Célula
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleJoinCell(selectedCell.id)}
                    className="rounded-xl"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Participar
                  </Button>
                )}
              </div>
            </div>

            <Tabs defaultValue="members" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="members">Membros</TabsTrigger>
                <TabsTrigger value="meetings">Encontros</TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="space-y-3">
                {cellMembers.length === 0 ? (
                  <div className="rounded-2xl bg-card p-6 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhum membro ainda</p>
                  </div>
                ) : (
                  cellMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-xl bg-card p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {member.profile?.full_name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.profile?.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                      {member.role === "lider" && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Líder
                        </span>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="meetings" className="space-y-3">
                {canManageCells && (
                  <Button
                    onClick={() => setIsMeetingDialogOpen(true)}
                    className="w-full rounded-xl mb-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agendar Encontro
                  </Button>
                )}

                {cellMeetings.length === 0 ? (
                  <div className="rounded-2xl bg-card p-6 text-center">
                    <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhum encontro agendado</p>
                  </div>
                ) : (
                  cellMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="rounded-xl bg-card p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-primary">
                          {formatDate(meeting.meeting_date)}
                        </span>
                        {meeting.attendance_count > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {meeting.attendance_count} presentes
                          </span>
                        )}
                      </div>
                      {meeting.topic && (
                        <p className="font-medium text-foreground">{meeting.topic}</p>
                      )}
                      {meeting.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{meeting.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {canManageCells && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="w-full rounded-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Nova Célula
              </Button>
            )}

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : cells.length === 0 ? (
              <div className="rounded-2xl bg-card p-8 text-center">
                <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhuma célula disponível ainda</p>
              </div>
            ) : (
              <AnimatePresence>
                {cells.map((cell, index) => (
                  <motion.button
                    key={cell.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    onClick={() => {
                      setSelectedCell(cell);
                      fetchCellDetails(cell.id);
                    }}
                    className="w-full rounded-2xl bg-card p-4 shadow-md text-left hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{cell.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Líder: {cell.leader_name}
                        </p>
                        {cell.meeting_day && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDayLabel(cell.meeting_day)}</span>
                            {cell.meeting_time && <span>às {cell.meeting_time.slice(0, 5)}</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{cell.member_count}</p>
                          <p className="text-xs text-muted-foreground">membros</p>
                        </div>
                        {cell.is_member && (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}

        {/* Dialog Criar Célula */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Nova Célula</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Célula *</Label>
                <Input
                  value={newCell.name}
                  onChange={(e) => setNewCell({ ...newCell, name: e.target.value })}
                  placeholder="Ex: Célula Jovens do Bairro"
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={newCell.description}
                  onChange={(e) => setNewCell({ ...newCell, description: e.target.value })}
                  placeholder="Sobre o que é essa célula..."
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Dia do Encontro</Label>
                <Select
                  value={newCell.meeting_day}
                  onValueChange={(value) => setNewCell({ ...newCell, meeting_day: value })}
                >
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={newCell.meeting_time}
                  onChange={(e) => setNewCell({ ...newCell, meeting_time: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Local</Label>
                <Input
                  value={newCell.meeting_location}
                  onChange={(e) => setNewCell({ ...newCell, meeting_location: e.target.value })}
                  placeholder="Endereço do encontro"
                  className="rounded-xl mt-1"
                />
              </div>
              <Button onClick={handleCreateCell} className="w-full rounded-xl">
                Criar Célula
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Criar Encontro */}
        <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Agendar Encontro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={newMeeting.meeting_date}
                  onChange={(e) => setNewMeeting({ ...newMeeting, meeting_date: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Tema/Assunto</Label>
                <Input
                  value={newMeeting.topic}
                  onChange={(e) => setNewMeeting({ ...newMeeting, topic: e.target.value })}
                  placeholder="Tema do estudo"
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={newMeeting.notes}
                  onChange={(e) => setNewMeeting({ ...newMeeting, notes: e.target.value })}
                  placeholder="Notas sobre o encontro"
                  className="rounded-xl mt-1"
                />
              </div>
              <Button onClick={handleCreateMeeting} className="w-full rounded-xl">
                Agendar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Celulas;
