import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Lock, Globe, MessageCircle, Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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

interface GroupMessage {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  image_url: string | null;
  profile?: { full_name: string; avatar_url: string | null };
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
    
    // Get groups user is a member of
    const { data: memberGroups } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    const memberGroupIds = new Set(memberGroups?.map(m => m.group_id) || []);

    // Get all accessible groups
    const { data: allGroups } = await supabase
      .from('community_groups')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (allGroups) {
      const groupsWithMembership = allGroups.map(g => ({
        ...g,
        is_member: memberGroupIds.has(g.id),
      }));
      setGroups(groupsWithMembership);
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
      console.error('Error creating group:', error);
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
      console.error('Error joining group:', error);
      toast({ title: 'Erro ao entrar no grupo', variant: 'destructive' });
    } else {
      toast({ title: 'Você entrou no grupo!' });
      fetchGroups();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Grupos</h3>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-xl">
              <Plus className="w-4 h-4 mr-1" />
              Criar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Criar Grupo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Grupo</Label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ex: Jovens de São Paulo"
                  maxLength={50}
                />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Sobre o que é esse grupo?"
                  maxLength={200}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {newGroupIsPublic ? (
                    <Globe className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Label>Grupo Público</Label>
                </div>
                <Switch
                  checked={newGroupIsPublic}
                  onCheckedChange={setNewGroupIsPublic}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {newGroupIsPublic
                  ? 'Qualquer membro pode ver e entrar'
                  : 'Apenas com convite'}
              </p>
              <Button
                onClick={handleCreateGroup}
                disabled={isCreating || !newGroupName.trim()}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Grupo'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="text-center py-8 bg-card rounded-2xl">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">Nenhum grupo ainda</p>
          <p className="text-xs text-muted-foreground">Crie o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => group.is_member && onGroupSelect(group)}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {group.is_public ? (
                  <Globe className="w-5 h-5 text-primary" />
                ) : (
                  <Lock className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{group.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {group.member_count} membro{group.member_count !== 1 ? 's' : ''}
                </p>
              </div>
              {group.is_member ? (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinGroup(group.id);
                  }}
                >
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

interface GroupChatProps {
  group: Group;
  onClose: () => void;
}

export const GroupChat = ({ group, onClose }: GroupChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`group_messages_${group.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${group.id}` },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id]);

  const fetchMessages = async () => {
    const { data: messagesData } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', group.id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (messagesData) {
      const userIds = [...new Set(messagesData.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const messagesWithProfiles = messagesData.map(msg => ({
        ...msg,
        profile: profiles?.find(p => p.user_id === msg.user_id),
      }));

      setMessages(messagesWithProfiles);
    }
    
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);

    const { error } = await supabase.from('group_messages').insert({
      group_id: group.id,
      user_id: user?.id,
      content: newMessage.trim(),
    });

    if (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Erro ao enviar', variant: 'destructive' });
    } else {
      setNewMessage('');
    }

    setIsSending(false);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Sheet open={true} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {group.is_public ? (
                <Globe className="w-5 h-5 text-primary" />
              ) : (
                <Lock className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <p className="font-semibold">{group.name}</p>
              <p className="text-xs text-muted-foreground font-normal">
                {group.member_count} membros
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-semibold text-primary">
                  {msg.profile?.full_name?.charAt(0) || '?'}
                </div>
                <div
                  className={`max-w-[70%] rounded-2xl px-3 py-2 ${
                    msg.user_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.user_id !== user?.id && (
                    <p className="text-xs font-semibold mb-1 opacity-70">
                      {msg.profile?.full_name?.split(' ')[0]}
                    </p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-[10px] opacity-60 mt-1 text-right">
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-xl"
            maxLength={500}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="rounded-xl"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
