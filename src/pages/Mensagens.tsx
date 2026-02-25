import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, ArrowLeft, Search, Check, CheckCheck, Plus, Smile, Paperclip, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import OnlineStatusBadge from "@/components/comunidade/OnlineStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavigation from "@/components/BottomNavigation";
import { privateMessageSchema, validateInput } from "@/lib/validation";
import ChatMediaPicker from "@/components/chat/ChatMediaPicker";
import { GroupList, GroupChat } from "@/components/comunidade/GroupList";

interface Profile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  last_seen?: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  image_url?: string | null;
  message_type?: string;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  partnerLastSeen: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  lastMessageType?: string;
}

const Mensagens = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'conversas' | 'grupos'>('conversas');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      fetchConversations();
      fetchAllProfiles();
    }
  }, [isApproved, user]);

  useEffect(() => {
    if (selectedConversation && user) {
      fetchMessages(selectedConversation);
      markAsRead(selectedConversation);
      
      const channel = supabase
        .channel(`private_messages_${selectedConversation}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'private_messages',
            filter: `sender_id=eq.${selectedConversation}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            if (newMsg.receiver_id === user.id) {
              setMessages((prev) => [...prev, newMsg]);
              markAsRead(selectedConversation);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    setIsLoading(true);
    
    const { data: messagesData, error } = await supabase
      .from("private_messages")
      .select("*")
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .order("created_at", { ascending: false });

    if (error || !messagesData) {
      setIsLoading(false);
      return;
    }

    const conversationMap = new Map<string, Conversation>();
    const profileIds = new Set<string>();

    for (const msg of messagesData) {
      const partnerId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
      profileIds.add(partnerId);

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          partnerName: "",
          partnerAvatar: null,
          partnerLastSeen: null,
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          unreadCount: 0,
          lastMessageType: msg.message_type || "text",
        });
      }

      if (!msg.is_read && msg.receiver_id === user?.id) {
        const conv = conversationMap.get(partnerId)!;
        conv.unreadCount++;
      }
    }

    if (profileIds.size > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, last_seen")
        .in("user_id", Array.from(profileIds));

      if (profilesData) {
        const profileMap: Record<string, Profile> = {};
        for (const p of profilesData) {
          profileMap[p.user_id] = p;
        }
        setProfiles(profileMap);

        conversationMap.forEach((conv, partnerId) => {
          const partnerProfile = profileMap[partnerId];
          if (partnerProfile) {
            conv.partnerName = partnerProfile.full_name;
            conv.partnerAvatar = partnerProfile.avatar_url;
            conv.partnerLastSeen = partnerProfile.last_seen || null;
          }
        });
      }
    }

    setConversations(Array.from(conversationMap.values()));
    setIsLoading(false);
  };

  const fetchAllProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, last_seen")
      .eq("is_approved", true)
      .neq("user_id", user?.id);

    if (data) {
      setAllProfiles(data);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    const { data } = await supabase
      .from("private_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user?.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user?.id})`
      )
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const markAsRead = async (partnerId: string) => {
    await supabase
      .from("private_messages")
      .update({ is_read: true })
      .eq("sender_id", partnerId)
      .eq("receiver_id", user?.id)
      .eq("is_read", false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    const validation = validateInput(privateMessageSchema, { content: newMessage });
    if (!validation.success) {
      toast({ title: "Erro", description: validation.error, variant: "destructive" });
      return;
    }

    setIsSending(true);
    const messageContent = validation.data.content;
    setNewMessage("");
    setShowMediaPicker(false);

    const { data, error } = await supabase.functions.invoke("send-private-message", {
      body: {
        receiver_id: selectedConversation,
        content: messageContent,
      },
    });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível enviar a mensagem.", variant: "destructive" });
      setNewMessage(messageContent);
    } else {
      const inserted = (data as any)?.message as Message | undefined;
      if (inserted) {
        setMessages((prev) => [...prev, inserted]);
        fetchConversations();
      }
    }

    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleSendSticker = async (content: string, type: "sticker" | "text_sticker" | "gif") => {
    if (!selectedConversation || isSending) return;

    setIsSending(true);

    const { data, error } = await supabase.functions.invoke("send-private-message", {
      body: {
        receiver_id: selectedConversation,
        content,
        message_type: type,
      },
    });

    if (error) {
      toast({ title: "Erro ao enviar figurinha", variant: "destructive" });
    } else {
      const inserted = (data as any)?.message as Message | undefined;
      if (inserted) {
        setMessages((prev) => [...prev, inserted]);
        fetchConversations();
      }
    }

    setIsSending(false);
  };

  const handleSendImage = async (imageUrl: string) => {
    if (!selectedConversation || isSending) return;

    setIsSending(true);

    const { data, error } = await supabase.functions.invoke("send-private-message", {
      body: {
        receiver_id: selectedConversation,
        content: "📷 Foto",
        message_type: "image",
        image_url: imageUrl,
      },
    });

    if (error) {
      toast({ title: "Erro ao enviar foto", variant: "destructive" });
    } else {
      const inserted = (data as any)?.message as Message | undefined;
      if (inserted) {
        setMessages((prev) => [...prev, inserted]);
        fetchConversations();
      }
    }

    setIsSending(false);
  };

  const startNewConversation = (partnerId: string) => {
    setSelectedConversation(partnerId);
    setShowNewChat(false);
    setSearchQuery("");
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } else if (diff < 604800000) {
      return date.toLocaleDateString("pt-BR", { weekday: "short" });
    } else {
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    }
  };

  const formatMessageTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const filteredProfiles = allProfiles.filter((p) =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    messages.forEach((msg) => {
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

  const getLastMessagePreview = (conv: Conversation) => {
    if (conv.lastMessageType === "image") return "📷 Foto";
    if (conv.lastMessageType === "sticker") return "😊 Figurinha";
    if (conv.lastMessageType === "gif") return "🎬 GIF";
    return conv.lastMessage;
  };

  const renderMessageContent = (msg: Message) => {
    const isOwn = msg.sender_id === user?.id;
    const msgType = msg.message_type || "text";

    if (msgType === "sticker") {
      // Check if it's a single emoji (short content) or a URL (gif/sticker from Klipy)
      if (msg.content.startsWith("http")) {
        return (
          <img
            src={msg.content}
            alt="Sticker"
            className="max-w-[120px] w-full object-contain"
            loading="lazy"
          />
        );
      }
      return <span className="text-5xl block text-center py-1">{msg.content}</span>;
    }

    if (msgType === "gif") {
      return (
        <img
          src={msg.content}
          alt="GIF"
          className="rounded-lg max-w-[240px] w-full object-cover cursor-pointer"
          onClick={() => window.open(msg.content, "_blank")}
          loading="lazy"
        />
      );
    }

    if (msgType === "image" && msg.image_url) {
      return (
        <img
          src={msg.image_url}
          alt="Foto"
          className="rounded-lg max-w-[240px] w-full object-cover cursor-pointer"
          onClick={() => window.open(msg.image_url!, "_blank")}
          loading="lazy"
        />
      );
    }

    return (
      <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">
        {msg.content}
      </p>
    );
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const selectedPartnerProfile = selectedConversation 
    ? profiles[selectedConversation] || allProfiles.find(p => p.user_id === selectedConversation) 
    : null;

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {/* Group Chat View */}
        {selectedGroup ? (
          <GroupChat group={selectedGroup} onClose={() => setSelectedGroup(null)} />
        ) : selectedConversation ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col h-screen"
          >
            {/* Chat Header */}
            <header 
              className="sticky top-0 z-20 flex items-center gap-3 bg-primary px-2 py-2"
              style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 8px))' }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setSelectedConversation(null); setShowMediaPicker(false); }}
                className="shrink-0 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <button 
                onClick={() => navigate(`/perfil/${selectedConversation}`)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar className="h-10 w-10 ring-2 ring-primary-foreground/20">
                  <AvatarImage src={selectedPartnerProfile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-sm font-semibold">
                    {getInitials(selectedPartnerProfile?.full_name || "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <h2 className="font-semibold text-primary-foreground truncate text-base">
                    {selectedPartnerProfile?.full_name || "Usuário"}
                  </h2>
                  <div className="text-primary-foreground/70 text-xs">
                    <OnlineStatusBadge 
                      lastSeen={selectedPartnerProfile?.last_seen || null} 
                      showText 
                    />
                  </div>
                </div>
              </button>
            </header>

            {/* Chat Messages */}
            <div 
              className="flex-1 overflow-y-auto px-3 py-4 bg-muted/30"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {messageGroups.map((group) => (
                <div key={group.date}>
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-1 text-xs font-medium bg-card text-muted-foreground rounded-lg shadow-sm">
                      {formatDateLabel(group.date)}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {group.messages.map((msg, msgIndex) => {
                      const isOwn = msg.sender_id === user?.id;
                      const msgType = msg.message_type || "text";
                      const isSticker = msgType === "sticker";

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: msgIndex * 0.02 }}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`relative max-w-[85%] sm:max-w-[70%] shadow-sm ${
                              isSticker
                                ? "bg-transparent shadow-none"
                                : isOwn
                                  ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3 py-2"
                                  : "bg-card text-foreground rounded-2xl rounded-bl-md px-3 py-2"
                            }`}
                          >
                            {renderMessageContent(msg)}
                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                              <span className={`text-[10px] ${isSticker ? "text-muted-foreground" : isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {formatMessageTime(msg.created_at)}
                              </span>
                              {isOwn && (
                                msg.is_read ? (
                                  <CheckCheck className={`h-3.5 w-3.5 ${isSticker ? "text-muted-foreground" : "text-primary-foreground/70"}`} />
                                ) : (
                                  <Check className={`h-3.5 w-3.5 ${isSticker ? "text-muted-foreground" : "text-primary-foreground/70"}`} />
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
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

            {/* Input */}
            <div 
              className="sticky bottom-0 bg-background border-t border-border px-2 py-2"
              style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 8px))' }}
            >
              <div className="flex items-end gap-2">
                <div className="flex-1 flex items-center gap-2 bg-card rounded-3xl px-3 py-2 shadow-sm border border-border">
                  <button
                    onClick={() => setShowMediaPicker(!showMediaPicker)}
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mensagem"
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0 py-0 h-auto min-h-[24px] max-h-[120px] resize-none"
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    onFocus={() => setShowMediaPicker(false)}
                  />
                  <button
                    onClick={() => setShowMediaPicker(!showMediaPicker)}
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                </div>
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="h-11 w-11 rounded-full shrink-0 shadow-md"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-24"
          >
            {/* Header */}
            <header 
              className="sticky top-0 z-20 bg-primary px-4 py-3"
              style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 12px))' }}
            >
              <div className="flex items-center justify-between">
                <h1 className="font-serif text-xl font-semibold text-primary-foreground">
                  Mensagens
                </h1>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewChat(true)}
                    className="text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Search */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar..."
                  className="pl-10 rounded-full bg-background/90 border-0"
                />
              </div>

              {/* Tabs */}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setActiveTab('conversas')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeTab === 'conversas' 
                      ? 'bg-primary-foreground text-primary' 
                      : 'bg-primary-foreground/20 text-primary-foreground'
                  }`}
                >
                  Conversas
                </button>
                <button
                  onClick={() => setActiveTab('grupos')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeTab === 'grupos' 
                      ? 'bg-primary-foreground text-primary' 
                      : 'bg-primary-foreground/20 text-primary-foreground'
                  }`}
                >
                  <Users className="h-3.5 w-3.5 inline mr-1" />
                  Grupos
                </button>
              </div>
            </header>

            {/* New Chat Modal - only in conversas tab */}
            {activeTab === 'conversas' && (
              <AnimatePresence>
                {showNewChat && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mx-4 mt-4 rounded-2xl bg-card p-4 shadow-lg border border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Nova conversa</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowNewChat(false);
                          setSearchQuery("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {filteredProfiles.slice(0, 15).map((p) => (
                        <button
                          key={p.user_id}
                          onClick={() => startNewConversation(p.user_id)}
                          className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-11 w-11">
                            <AvatarImage src={p.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                              {getInitials(p.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <span className="font-medium text-foreground">{p.full_name}</span>
                          </div>
                        </button>
                      ))}
                      {filteredProfiles.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-6">
                          Nenhuma pessoa encontrada
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            <main className="px-4 py-4">
              {activeTab === 'conversas' ? (
                <>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-card p-8 text-center shadow-md mt-4"
                    >
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <MessageCircle className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Nenhuma conversa</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Comece uma conversa com alguém da comunidade
                      </p>
                      <Button onClick={() => setShowNewChat(true)} className="rounded-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova conversa
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-1">
                      {conversations
                        .filter(conv => 
                          !searchQuery || 
                          conv.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((conv, index) => (
                        <motion.button
                          key={conv.partnerId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => setSelectedConversation(conv.partnerId)}
                          className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={conv.partnerAvatar || ""} />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {getInitials(conv.partnerName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5">
                              <OnlineStatusBadge lastSeen={conv.partnerLastSeen} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-semibold text-foreground truncate">
                                {conv.partnerName || "Usuário"}
                              </h3>
                              <span className={`text-xs shrink-0 ${conv.unreadCount > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                                {formatTime(conv.lastMessageAt)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <p className="text-sm text-muted-foreground truncate">
                                {getLastMessagePreview(conv)}
                              </p>
                              {conv.unreadCount > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground px-1.5 font-medium shrink-0">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* GRUPOS TAB */
                <GroupList onGroupSelect={setSelectedGroup} />
              )}
            </main>

            <BottomNavigation />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Mensagens;
