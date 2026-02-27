import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Smile, Loader2, Globe, Lock, Camera, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ChatMediaPicker from '@/components/chat/ChatMediaPicker';
import type { Group } from './GroupList';

interface GroupMessage {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  image_url: string | null;
  profile?: { full_name: string; avatar_url: string | null };
}

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
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`group_messages_${group.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${group.id}` }, () => fetchMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [group.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      setMessages(messagesData.map(msg => ({
        ...msg,
        profile: profiles?.find(p => p.user_id === msg.user_id),
      })));
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
      toast({ title: 'Erro ao enviar', variant: 'destructive' });
    } else {
      setNewMessage('');
    }
    setIsSending(false);
  };

  const handleSendSticker = async (content: string, _type: "sticker" | "text_sticker") => {
    setIsSending(true);
    const { error } = await supabase.from('group_messages').insert({
      group_id: group.id,
      user_id: user?.id,
      content,
    });
    if (error) toast({ title: 'Erro ao enviar figurinha', variant: 'destructive' });
    setIsSending(false);
  };

  const handleSendImage = async (imageUrl: string) => {
    setIsSending(true);
    const { error } = await supabase.from('group_messages').insert({
      group_id: group.id,
      user_id: user?.id,
      content: '📷 Foto',
      image_url: imageUrl,
    });
    if (error) toast({ title: 'Erro ao enviar foto', variant: 'destructive' });
    setIsSending(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande (máx 10MB)', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    const ext = file.name.split('.').pop();
    const path = `groups/${group.id}/${user.id}-${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, file);
    if (uploadError) {
      toast({ title: 'Erro ao enviar foto', variant: 'destructive' });
      setIsSending(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
    
    const { error } = await supabase.from('group_messages').insert({
      group_id: group.id,
      user_id: user.id,
      content: '📷 Foto',
      image_url: urlData.publicUrl,
    });
    if (error) toast({ title: 'Erro ao enviar foto', variant: 'destructive' });
    setIsSending(false);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const isEmojiOnly = (text: string) => {
    const emojiRegex = /^[\p{Emoji}\s]+$/u;
    return emojiRegex.test(text) && text.trim().length <= 4;
  };

  const groupMessagesByDate = (msgs: GroupMessage[]) => {
    const groups: { date: string; messages: GroupMessage[] }[] = [];
    let currentDate = "";
    msgs.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toLocaleDateString("pt-BR");
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    });
    return groups;
  };

  const formatDateLabel = (dateStr: string) => {
    const [day, month, year] = dateStr.split("/");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Hoje";
    if (date.toDateString() === yesterday.toDateString()) return "Ontem";
    return dateStr;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-screen bg-background"
    >
      {/* Header - WhatsApp style */}
      <header 
        className="sticky top-0 z-20 flex items-center gap-3 bg-primary px-2 py-2"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 8px))' }}
      >
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 text-primary-foreground hover:bg-primary-foreground/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10 ring-2 ring-primary-foreground/20">
          {group.image_url ? <AvatarImage src={group.image_url} /> : null}
          <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground font-bold text-sm">
            {group.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 text-left">
          <h2 className="font-semibold text-primary-foreground truncate text-base">{group.name}</h2>
          <p className="text-primary-foreground/70 text-xs">{group.member_count} membros</p>
        </div>
      </header>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto px-3 py-4"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              {group.is_public ? <Globe className="w-8 h-8 text-primary/50" /> : <Lock className="w-8 h-8 text-primary/50" />}
            </div>
            <p className="text-muted-foreground text-sm">Nenhuma mensagem ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Envie a primeira mensagem!</p>
          </div>
        ) : (
          messageGroups.map((group, gi) => (
            <div key={gi}>
              <div className="flex justify-center my-3">
                <span className="bg-muted/80 text-muted-foreground text-[10px] px-3 py-1 rounded-full font-medium">
                  {formatDateLabel(group.date)}
                </span>
              </div>
              {group.messages.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                const isEmoji = isEmojiOnly(msg.content);

                return (
                  <div key={msg.id} className={`flex gap-2 mb-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <Avatar className="h-7 w-7 shrink-0 mt-1">
                        <AvatarImage src={msg.profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                          {msg.profile?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[75%] ${
                      isEmoji 
                        ? '' 
                        : `rounded-2xl px-3 py-2 shadow-sm ${
                          isOwn 
                            ? 'bg-primary text-primary-foreground rounded-tr-md' 
                            : 'bg-card border border-border rounded-tl-md'
                        }`
                    }`}>
                      {!isOwn && !isEmoji && (
                        <p className="text-[10px] font-semibold text-primary mb-0.5">
                          {msg.profile?.full_name?.split(' ')[0]}
                        </p>
                      )}
                      {msg.image_url ? (
                        <img
                          src={msg.image_url}
                          alt="Foto"
                          className="rounded-lg max-w-[220px] w-full object-cover cursor-pointer"
                          onClick={() => window.open(msg.image_url!, "_blank")}
                          loading="lazy"
                        />
                      ) : isEmoji ? (
                        <span className="text-4xl block text-center">{msg.content}</span>
                      ) : (
                        <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                      <p className={`text-[10px] mt-0.5 text-right ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Media Picker */}
      <ChatMediaPicker
        userId={user?.id || ""}
        onSendSticker={handleSendSticker}
        onSendImage={handleSendImage}
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
      />

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handlePhotoUpload} />

      {/* Input - WhatsApp style */}
      <div 
        className="p-2 border-t border-border bg-card flex items-center gap-1.5"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 8px))' }}
      >
        <button
          onClick={() => setShowMediaPicker(!showMediaPicker)}
          className="text-muted-foreground hover:text-primary transition-colors shrink-0 p-2"
        >
          <Smile className="h-5 w-5" />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-muted-foreground hover:text-primary transition-colors shrink-0 p-2"
        >
          <Camera className="h-5 w-5" />
        </button>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Mensagem..."
          className="flex-1 rounded-full text-sm h-10"
          maxLength={500}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          onFocus={() => setShowMediaPicker(false)}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || isSending}
          size="icon"
          className="rounded-full shrink-0 h-10 w-10"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </motion.div>
  );
};