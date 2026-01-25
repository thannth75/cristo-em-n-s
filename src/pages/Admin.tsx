import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  Check, 
  X, 
  Shield, 
  UserCheck,
  ChevronRight,
  Search,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  is_approved: boolean | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLeader, profile, isLoading: authLoading, isApproved } = useAuth();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Aguardar carregamento
    
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
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } else {
      setAllUsers(data || []);
      setPendingUsers((data || []).filter((u) => !u.is_approved));
    }
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
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o usuário.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Usuário aprovado! ✅",
        description: "O jovem agora pode acessar o app.",
      });
      fetchUsers();
    }
  };

  const rejectUser = async (profileId: string) => {
    // Por enquanto, apenas remove o perfil (o usuário pode tentar novamente)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profileId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o usuário.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cadastro rejeitado",
        description: "O usuário foi removido.",
      });
      fetchUsers();
    }
  };

  const promoteToLeader = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "lider", assigned_by: user?.id });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Info",
          description: "Usuário já é líder.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível promover o usuário.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Promovido a Líder! 🎉",
        description: "O usuário agora tem permissões de líder.",
      });
    }
  };

  const displayUsers = showPendingOnly ? pendingUsers : allUsers;
  const filteredUsers = displayUsers.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Administração
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie usuários e permissões
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-2 gap-3"
        >
          <div className="rounded-2xl bg-card p-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Users className="h-5 w-5 text-amber-500" />
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
                <p className="text-2xl font-bold text-foreground">
                  {allUsers.filter((u) => u.is_approved).length}
                </p>
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
            {showPendingOnly ? "Aguardando aprovação" : "Todos os usuários"}
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
                {showPendingOnly
                  ? "Nenhum cadastro pendente! 🎉"
                  : "Nenhum usuário encontrado."}
              </p>
            </motion.div>
          ) : (
            filteredUsers.map((pendingUser, index) => (
              <motion.div
                key={pendingUser.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="rounded-2xl bg-card p-4 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-serif text-lg font-semibold text-primary">
                    {pendingUser.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {pendingUser.full_name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {pendingUser.email}
                    </p>
                  </div>
                  {pendingUser.is_approved ? (
                    <Badge className="bg-primary/10 text-primary">Aprovado</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                      Pendente
                    </Badge>
                  )}
                </div>

                {!pendingUser.is_approved && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => approveUser(pendingUser.user_id, pendingUser.id)}
                      className="flex-1 rounded-xl"
                      size="sm"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => rejectUser(pendingUser.id)}
                      className="rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {pendingUser.is_approved && isAdmin && (
                  <div className="mt-3 border-t border-border pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => promoteToLeader(pendingUser.user_id)}
                      className="w-full justify-between text-muted-foreground hover:text-primary"
                    >
                      Promover a Líder
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Admin;
