import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Lock, Globe, Loader2, ChevronRight, Camera } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupIsPublic, setNewGroupIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [user?.id]);

  const fetchGroups = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const { data: memberGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);
    const memberGroupIds = new Set(memberGroups?.map(m => m.group_id) || []);
    const { data: allGroups } = await supabase
      .from('community_groups')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (allGroups) {
      setGroups(allGroups.map(g => ({ ...g, is_member: memberGroupIds.has(g.id) })));
    }
    setIsLoading(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({ title: 'Digite um nome para o grupo', variant: 'destructive' });
      return;
    }
    setIsCreating(true);
    const { error } = await supabase.from('community_groups').insert({
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || null,
      is_public: newGroupIsPublic,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: 'Erro ao criar grupo', variant: 'destructive' });
    } else {
      toast({ title: 'Grupo criado! 🎉' });
      setCreateDialogOpen(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupIsPublic(true);
      fetchGroups();
    }
    setIsCreating(false);
  };

  const handleJoinGroup = async (groupId: string) => {
    const { error } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: user?.id,
    });
    if (error) {
      toast({ title: 'Erro ao entrar no grupo', variant: 'destructive' });
    } else {
      toast({ title: 'Você entrou no grupo!' });
      fetchGroups();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-foreground text-sm">Seus Grupos</h3>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="rounded-full h-8 w-8 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Criar Grupo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Nome do Grupo</Label>
                <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Ex: Jovens de São Paulo" maxLength={50} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Descrição (opcional)</Label>
                <Textarea value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} placeholder="Sobre o que é esse grupo?" maxLength={200} className="rounded-xl" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {newGroupIsPublic ? <Globe className="w-4 h-4 text-muted-foreground" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  <Label className="text-sm">{newGroupIsPublic ? 'Público' : 'Privado'}</Label>
                </div>
                <Switch checked={newGroupIsPublic} onCheckedChange={setNewGroupIsPublic} />
              </div>
              <Button onClick={handleCreateGroup} disabled={isCreating || !newGroupName.trim()} className="w-full rounded-xl">
                {isCreating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</>) : 'Criar Grupo'}
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
          {groups.map((group) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
              onClick={() => group.is_member && onGroupSelect(group)}
            >
              <Avatar className="h-12 w-12 shrink-0">
                {group.image_url ? (
                  <AvatarImage src={group.image_url} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {group.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
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
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={(e) => { e.stopPropagation(); handleJoinGroup(group.id); }}>
                  Entrar
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export type { Group };