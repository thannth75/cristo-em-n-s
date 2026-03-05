import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Lock, Globe, Loader2, ChevronRight, Trash2, Edit2, LogOut, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Group {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_public: boolean;
  member_count: number;
  created_by: string;
  created_at: string;
  is_member?: boolean;
}

interface GroupListProps {
  onGroupSelect: (group: Group) => void;
}

export const GroupList = ({ onGroupSelect }: GroupListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupIsPublic, setNewGroupIsPublic] = useState(true);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { fetchGroups(); }, [user?.id]);

  const fetchGroups = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const { data: memberGroups } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
    const memberGroupIds = new Set(memberGroups?.map(m => m.group_id) || []);
    const { data: allGroups } = await supabase.from('community_groups').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (allGroups) setGroups(allGroups.map(g => ({ ...g, is_member: memberGroupIds.has(g.id) })));
    setIsLoading(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) { toast({ title: 'Digite um nome para o grupo', variant: 'destructive' }); return; }
    setIsCreating(true);
    const { data, error } = await supabase.from('community_groups').insert({
      name: newGroupName.trim(), description: newGroupDescription.trim() || null, is_public: newGroupIsPublic, created_by: user?.id,
    }).select().single();
    if (error) { toast({ title: 'Erro ao criar grupo', variant: 'destructive' }); }
    else {
      // Auto join as admin
      await supabase.from('group_members').insert({ group_id: data.id, user_id: user?.id, role: 'admin' });
      toast({ title: 'Grupo criado! 🎉' });
      setCreateDialogOpen(false);
      setNewGroupName(''); setNewGroupDescription(''); setNewGroupIsPublic(true);
      fetchGroups();
    }
    setIsCreating(false);
  };

  const handleEditGroup = async () => {
    if (!selectedGroup || !editName.trim()) return;
    const { error } = await supabase.from('community_groups').update({
      name: editName.trim(), description: editDescription.trim() || null,
    }).eq('id', selectedGroup.id);
    if (error) toast({ title: 'Erro ao editar', variant: 'destructive' });
    else { toast({ title: 'Grupo atualizado! ✅' }); setEditDialogOpen(false); fetchGroups(); }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    // Delete members first, then messages, then group
    await supabase.from('group_message_reactions').delete().in('message_id',
      (await supabase.from('group_messages').select('id').eq('group_id', selectedGroup.id)).data?.map(m => m.id) || []
    );
    await supabase.from('group_messages').delete().eq('group_id', selectedGroup.id);
    await supabase.from('group_members').delete().eq('group_id', selectedGroup.id);
    const { error } = await supabase.from('community_groups').delete().eq('id', selectedGroup.id);
    if (error) toast({ title: 'Erro ao excluir', variant: 'destructive' });
    else { toast({ title: 'Grupo excluído' }); setDeleteDialogOpen(false); fetchGroups(); }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;
    const { error } = await supabase.from('group_members').delete().eq('group_id', selectedGroup.id).eq('user_id', user?.id);
    if (error) toast({ title: 'Erro ao sair', variant: 'destructive' });
    else { toast({ title: 'Você saiu do grupo' }); setLeaveDialogOpen(false); fetchGroups(); }
  };

  const handleJoinGroup = async (groupId: string) => {
    const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: user?.id });
    if (error) toast({ title: 'Erro ao entrar no grupo', variant: 'destructive' });
    else { toast({ title: 'Você entrou no grupo!' }); fetchGroups(); }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-foreground text-sm">Seus Grupos</h3>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="rounded-full h-8 w-8 p-0"><Plus className="w-4 h-4" /></Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle className="font-serif">Criar Grupo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-xs">Nome do Grupo</Label><Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Ex: Jovens de São Paulo" maxLength={50} className="rounded-xl" /></div>
              <div><Label className="text-xs">Descrição (opcional)</Label><Textarea value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} placeholder="Sobre o que é esse grupo?" maxLength={200} className="rounded-xl" /></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">{newGroupIsPublic ? <Globe className="w-4 h-4 text-muted-foreground" /> : <Lock className="w-4 h-4 text-muted-foreground" />}<Label className="text-sm">{newGroupIsPublic ? 'Público' : 'Privado'}</Label></div>
                <Switch checked={newGroupIsPublic} onCheckedChange={setNewGroupIsPublic} />
              </div>
              <Button onClick={handleCreateGroup} disabled={isCreating || !newGroupName.trim()} className="w-full rounded-xl">
                {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : 'Criar Grupo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum grupo ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Crie o primeiro grupo!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {groups.map((group) => {
            const isOwner = group.created_by === user?.id;
            return (
              <motion.div key={group.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                onClick={() => group.is_member && onGroupSelect(group)}
              >
                <Avatar className="h-12 w-12 shrink-0">
                  {group.image_url ? <AvatarImage src={group.image_url} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{group.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-foreground text-sm truncate">{group.name}</p>
                    {!group.is_public && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {group.member_count} membro{group.member_count !== 1 ? 's' : ''}
                    {group.description && ` · ${group.description.slice(0, 30)}...`}
                  </p>
                </div>
                {group.is_member ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onGroupSelect(group); }}>
                        <ChevronRight className="w-4 h-4 mr-2" />Abrir Chat
                      </DropdownMenuItem>
                      {isOwner && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedGroup(group); setEditName(group.name); setEditDescription(group.description || ''); setEditDialogOpen(true); }}>
                          <Edit2 className="w-4 h-4 mr-2" />Editar
                        </DropdownMenuItem>
                      )}
                      {isOwner ? (
                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setSelectedGroup(group); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-4 h-4 mr-2" />Excluir Grupo
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setSelectedGroup(group); setLeaveDialogOpen(true); }}>
                          <LogOut className="w-4 h-4 mr-2" />Sair do Grupo
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={(e) => { e.stopPropagation(); handleJoinGroup(group.id); }}>Entrar</Button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle className="font-serif">Editar Grupo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Nome</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={50} className="rounded-xl" /></div>
            <div><Label className="text-xs">Descrição</Label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} maxLength={200} className="rounded-xl" /></div>
            <Button onClick={handleEditGroup} disabled={!editName.trim()} className="w-full rounded-xl">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir grupo?</AlertDialogTitle>
            <AlertDialogDescription>Todas as mensagens serão apagadas permanentemente. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="rounded-xl bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Confirmation */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do grupo?</AlertDialogTitle>
            <AlertDialogDescription>Você poderá entrar novamente depois.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroup} className="rounded-xl">Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export type { Group };
