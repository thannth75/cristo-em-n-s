import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  Check, 
  X, 
  Shield, 
  UserCheck,
  Search,
  Filter,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import RoleManager from "@/components/admin/RoleManager";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  is_approved: boolean | null;
  role: string;
  attendance_count: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLeader, profile, isLoading: authLoading, isApproved } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState(true);
  const [lowAttendanceUsers, setLowAttendanceUsers] = useState<UserWithRole[]>([]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (!isApproved) {
      navigate("/pending");
      return;
    }
    
    if (!isAdmin && !isLeader) {
      navigate("/dashboard");
      return;
    }
    
    fetchUsers();
  }, [authLoading, user, isApproved, isAdmin, isLeader, navigate]);

  const fetchUsers = async () => {
    setIsLoading(true);
    
    // Fetch profiles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!profilesData) {
      setIsLoading(false);
      return;
    }

    // Fetch roles for all users
    const userIds = profilesData.map(p => p.user_id);
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    // Fetch attendance counts for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("user_id")
      .gte("checked_in_at", thirtyDaysAgo.toISOString());

    // Count attendance per user
    const attendanceCounts: Record<string, number> = {};
    attendanceData?.forEach(a => {
      attendanceCounts[a.user_id] = (attendanceCounts[a.user_id] || 0) + 1;
    });

    // Combine data
    const usersWithRoles: UserWithRole[] = profilesData.map(p => ({
      id: p.id,
      user_id: p.user_id,
      full_name: p.full_name,
      email: p.email,
      created_at: p.created_at,
      is_approved: p.is_approved,
      role: rolesData?.find(r => r.user_id === p.user_id)?.role || "jovem",
      attendance_count: attendanceCounts[p.user_id] || 0,
    }));

    setUsers(usersWithRoles);
    
    // Identify low attendance users (approved users with < 2 attendances in 30 days)
    const lowAttendance = usersWithRoles.filter(
      u => u.is_approved && u.attendance_count < 2
    );
    setLowAttendanceUsers(lowAttendance);
    
    setIsLoading(false);
  };

  const approveUser = async (userId: string, profileId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_approved: true,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível aprovar.", variant: "destructive" });
    } else {
      toast({ title: "Usuário aprovado! ✅" });
      fetchUsers();
    }
  };

  const rejectUser = async (profileId: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", profileId);

    if (!error) {
      toast({ title: "Cadastro rejeitado" });
      fetchUsers();
    }
  };

  const sendLowAttendanceNotification = async (targetUserId: string, userName: string) => {
    const { error } = await supabase.from("notifications").insert([{
      user_id: targetUserId,
      title: "Sentimos sua falta! 🙏",
      message: `Olá ${userName.split(" ")[0]}, percebemos que você não tem participado dos nossos encontros. Sua presença é muito importante! Volte para nossa comunhão.`,
      type: "warning",
    }]);

    if (!error) {
      toast({ title: "Aviso enviado!", description: `${userName} receberá uma notificação.` });
    }
  };

  const pendingUsers = users.filter(u => !u.is_approved);
  const approvedUsers = users.filter(u => u.is_approved);
  const displayUsers = showPendingOnly ? pendingUsers : approvedUsers;
  
  const filteredUsers = displayUsers.filter(
    u => u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const userName = profile?.full_name?.split(" ")[0] || "Admin";

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader userName={userName} />

      <main className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">Administração</h1>
              <p className="text-sm text-muted-foreground">Gerencie usuários e permissões</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="alerts">
              Alertas
              {lowAttendanceUsers.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {lowAttendanceUsers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 grid grid-cols-2 gap-3"
            >
              <div className="rounded-2xl bg-card p-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20">
                    <Users className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{pendingUsers.length}</p>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-card p-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{approvedUsers.length}</p>
                    <p className="text-xs text-muted-foreground">Aprovados</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Search & Filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
              <Button
                variant={showPendingOnly ? "default" : "outline"}
                size="icon"
                onClick={() => setShowPendingOnly(!showPendingOnly)}
                className="rounded-xl"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </motion.div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {showPendingOnly ? "Aguardando aprovação" : "Usuários aprovados"}
              </p>
              <Badge variant="secondary">{filteredUsers.length}</Badge>
            </div>

            {/* User List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl bg-card p-8 text-center shadow-md"
                >
                  <UserCheck className="mx-auto mb-3 h-12 w-12 text-primary/50" />
                  <p className="text-muted-foreground">
                    {showPendingOnly ? "Nenhum cadastro pendente! 🎉" : "Nenhum usuário encontrado."}
                  </p>
                </motion.div>
              ) : (
                filteredUsers.map((u, index) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="rounded-2xl bg-card p-4 shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-serif text-lg font-semibold text-primary">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{u.full_name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                      </div>
                      {u.is_approved ? (
                        isAdmin && (
                          <RoleManager
                            targetUserId={u.user_id}
                            currentRole={u.role}
                            adminUserId={user?.id || ""}
                            onRoleChange={fetchUsers}
                          />
                        )
                      ) : (
                        <Badge variant="secondary" className="bg-gold/20 text-gold">Pendente</Badge>
                      )}
                    </div>

                    {!u.is_approved && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={() => approveUser(u.user_id, u.id)}
                          className="flex-1 rounded-xl"
                          size="sm"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Aprovar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => rejectUser(u.id)}
                          className="rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ALERTS TAB */}
          <TabsContent value="alerts">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-2xl bg-gold/10 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-gold" />
                <h3 className="font-semibold text-foreground">Frequência Baixa</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Usuários com menos de 2 presenças nos últimos 30 dias
              </p>
            </motion.div>

            {lowAttendanceUsers.length === 0 ? (
              <div className="rounded-2xl bg-card p-8 text-center shadow-md">
                <Check className="mx-auto mb-3 h-12 w-12 text-primary/50" />
                <p className="text-muted-foreground">Todos os jovens estão frequentes! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowAttendanceUsers.map((u) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-2xl bg-card p-4 shadow-md"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 font-serif text-lg font-semibold text-gold">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{u.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {u.attendance_count} presença{u.attendance_count !== 1 && "s"} em 30 dias
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => sendLowAttendanceNotification(u.user_id, u.full_name)}
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Enviar Aviso de Frequência
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Admin;
