import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarCog, History, Save, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavigation from "@/components/BottomNavigation";

interface MemberRow {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  birth_date: string | null;
}

interface AuditRow {
  id: string;
  target_user_id: string;
  changed_by: string;
  old_birth_date: string | null;
  new_birth_date: string | null;
  reason: string | null;
  created_at: string;
  target_name?: string;
  changer_name?: string;
}

const AdminAniversarios = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [authLoading, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const [m, a] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url, birth_date").order("full_name"),
      supabase
        .from("birth_date_audit_log")
        .select("id, target_user_id, changed_by, old_birth_date, new_birth_date, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    const memberList = (m.data || []) as MemberRow[];
    setMembers(memberList);

    const auditRows = (a.data || []) as AuditRow[];
    if (auditRows.length) {
      const ids = Array.from(new Set(auditRows.flatMap((r) => [r.target_user_id, r.changed_by])));
      const nameMap = new Map(memberList.filter((mm) => ids.includes(mm.user_id)).map((mm) => [mm.user_id, mm.full_name]));
      // Fallback fetch for missing names
      const missing = ids.filter((id) => !nameMap.has(id));
      if (missing.length) {
        const { data: extra } = await supabase.from("profiles").select("user_id, full_name").in("user_id", missing);
        (extra || []).forEach((p: any) => nameMap.set(p.user_id, p.full_name));
      }
      setAudit(
        auditRows.map((r) => ({
          ...r,
          target_name: nameMap.get(r.target_user_id) || "Usuário",
          changer_name: nameMap.get(r.changed_by) || "Admin",
        })),
      );
    } else {
      setAudit([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? members.filter((m) => m.full_name.toLowerCase().includes(q)) : members;
  }, [members, search]);

  const fmtDate = (d?: string | null) => {
    if (!d) return "—";
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : d;
  };

  const openEdit = (m: MemberRow) => {
    setEditing(m);
    setNewDate(m.birth_date ? m.birth_date.slice(0, 10) : "");
    setReason("");
  };

  const save = async () => {
    if (!editing || !newDate) return;
    setSaving(true);
    const { error } = await supabase.rpc("admin_update_birth_date", {
      p_target_user_id: editing.user_id,
      p_new_birth_date: newDate,
      p_reason: reason || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Data atualizada", description: "Histórico registrado." });
    setEditing(null);
    load();
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))" }}
    >
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <CalendarCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold">Correção de Aniversários</h1>
              <p className="text-xs text-muted-foreground">Admin · alterações registradas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-5 max-w-2xl mx-auto">
        <Tabs defaultValue="members">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-1" /> Histórico ({audit.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted/60 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((m) => (
                  <motion.button
                    key={m.user_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => openEdit(m)}
                    className="flex items-center gap-3 w-full rounded-xl bg-card border p-3 text-left hover:bg-muted/40 transition"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={m.avatar_url || ""} />
                      <AvatarFallback>{m.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.birth_date ? `Aniversário: ${fmtDate(m.birth_date)}` : "Sem data"}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {audit.length === 0 ? (
              <div className="rounded-xl bg-card p-6 text-center border">
                <p className="text-muted-foreground text-sm">Nenhuma alteração registrada ainda.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {audit.map((a) => (
                  <div key={a.id} className="rounded-xl bg-card border p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">{a.target_name}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      De <span className="font-mono">{fmtDate(a.old_birth_date)}</span> →{" "}
                      <span className="font-mono text-primary">{fmtDate(a.new_birth_date)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Por: {a.changer_name}</p>
                    {a.reason && (
                      <p className="text-xs mt-2 italic bg-muted/40 rounded p-2">"{a.reason}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corrigir data de aniversário</DialogTitle>
            <DialogDescription>{editing?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Data atual</Label>
              <p className="text-sm text-muted-foreground">{fmtDate(editing?.birth_date)}</p>
            </div>
            <div>
              <Label htmlFor="newDate">Nova data</Label>
              <Input
                id="newDate"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div>
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 300))}
                placeholder="Ex: usuário enviou data correta por mensagem"
                rows={2}
              />
            </div>
            <Button onClick={save} disabled={saving || !newDate} className="w-full rounded-xl">
              <Save className="h-4 w-4 mr-2" /> {saving ? "Salvando..." : "Salvar correção"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default AdminAniversarios;
