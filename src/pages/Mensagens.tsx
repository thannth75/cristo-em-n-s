import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, ArrowLeft, Search, Check, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { privateMessageSchema, validateInput } from "@/lib/validation";

interface Profile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      
      // Subscribe to new messages
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
    
    // Get all messages involving this user
    const { data: messagesData, error } = await supabase
      .from("private_messages")
      .select("*")
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .order("created_at", { ascending: false });

    if (error || !messagesData) {
      setIsLoading(false);
      return;
    }

    // Group by conversation partner
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
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          unreadCount: 0,
        });
      }

      if (!msg.is_read && msg.receiver_id === user?.id) {
        const conv = conversationMap.get(partnerId)!;
        conv.unreadCount++;
      }
    }

    // Fetch profiles
    if (profileIds.size > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", Array.from(profileIds));

      if (profilesData) {
        const profileMap: Record<string, Profile> = {};
        for (const p of profilesData) {
          profileMap[p.user_id] = p;
        }
        setProfiles(profileMap);

        // Update conversation names
        conversationMap.forEach((conv, partnerId) => {
          const partnerProfile = profileMap[partnerId];
          if (partnerProfile) {
            conv.partnerName = partnerProfile.full_name;
            conv.partnerAvatar = partnerProfile.avatar_url;
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
      .select("user_id, full_name, avatar_url")
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
    if (!newMessage.trim() || !selectedConversation) return;

    const validation = validateInput(privateMessageSchema, { content: newMessage });
    if (!validation.success) {
      toast({ title: "Erro", description: validation.error, variant: "destructive" });
      return;
    }

    const { data, error } = await supabase.from("private_messages").insert({
      sender_id: user?.id,
      receiver_id: selectedConversation,
      content: validation.data.content,
    }).select().single();

    if (error) {
      toast({ title: "Erro", description: "Não foi possível enviar a mensagem.", variant: "destructive" });
    } else if (data) {
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      fetchConversations();
    }
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

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const filteredProfiles = allProfiles.filter((p) =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const selectedPartnerProfile = selectedConversation ? profiles[selectedConversation] || allProfiles.find(p => p.user_id === selectedConversation) : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <AnimatePresence mode="wait">
        {selectedConversation ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-screen"
          >
            {/* Chat Header */}
            <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/95 backdrop-blur-xl px-4 py-3 safe-area-inset-top">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedConversation(null)}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedPartnerProfile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(selectedPartnerProfile?.full_name || "?")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground truncate">
                  {selectedPartnerProfile?.full_name || "Usuário"}
                </h2>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                          <span className={`text-xs ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {formatTime(msg.created_at)}
                          </span>
                          {isOwn && (
                            msg.is_read ? (
                              <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/70" />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-primary-foreground/70" />
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur-xl px-4 py-3 pb-safe">
              <div className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 rounded-full"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="rounded-full shrink-0"
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
          >
            <AppHeader userName={userName} />

            <main className="px-4 py-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
                      Mensagens
                    </h1>
                    <p className="text-sm text-muted-foreground">Chat privado</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowNewChat(true)}
                  className="rounded-xl"
                >
                  Nova
                </Button>
              </div>

              {/* New Chat Modal */}
              {showNewChat && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-2xl bg-card p-4 shadow-md"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar pessoa..."
                      className="flex-1"
                      autoFocus
                    />
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
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredProfiles.slice(0, 10).map((p) => (
                      <button
                        key={p.user_id}
                        onClick={() => startNewConversation(p.user_id)}
                        className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-muted transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={p.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(p.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{p.full_name}</span>
                      </button>
                    ))}
                    {filteredProfiles.length === 0 && searchQuery && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        Nenhuma pessoa encontrada
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Conversations List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : conversations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl bg-card p-8 text-center shadow-md"
                >
                  <MessageCircle className="mx-auto mb-3 h-12 w-12 text-primary/50" />
                  <p className="text-muted-foreground">Nenhuma conversa ainda.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Clique em "Nova" para iniciar uma conversa.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv, index) => (
                    <motion.button
                      key={conv.partnerId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedConversation(conv.partnerId)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conv.partnerAvatar || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(conv.partnerName)}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground truncate">
                            {conv.partnerName || "Usuário"}
                          </h3>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
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
