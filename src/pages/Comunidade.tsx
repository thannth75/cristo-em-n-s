import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Send, 
  Plus, 
  Image,
  MessageSquare,
  ChevronLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null };
  user_liked?: boolean;
}

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  message_type: string;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null };
}

interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: { full_name: string; avatar_url: string | null };
}

interface UserProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

const Comunidade = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newPostContent, setNewPostContent] = useState("");
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [newChatMessage, setNewChatMessage] = useState("");
  
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newPrivateMessage, setNewPrivateMessage] = useState("");
  const [userConversations, setUserConversations] = useState<PrivateMessage[]>([]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
      fetchData();
      setupRealtimeSubscriptions();
    }
    
    return () => {
      supabase.removeAllChannels();
    };
  }, [isApproved, user]);

  const setupRealtimeSubscriptions = () => {
    // Posts realtime
    supabase
      .channel('community_posts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    // Chat realtime
    supabase
      .channel('chat_messages_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setChatMessages(prev => [...prev, newMsg]);
        scrollToBottom();
      })
      .subscribe();

    // Private messages realtime
    supabase
      .channel('private_messages_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, () => {
        if (selectedUser) {
          fetchConversation(selectedUser.user_id);
        }
      })
      .subscribe();
  };

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchPosts(), fetchChatMessages(), fetchUsers()]);
    setIsLoading(false);
  };

  const fetchPosts = async () => {
    const { data: postsData } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (postsData) {
      // Fetch profiles for posts
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      // Check which posts user has liked
      const { data: userLikes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user?.id);

      const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);

      const postsWithProfiles = postsData.map(post => ({
        ...post,
        profiles: profiles?.find(p => p.user_id === post.user_id),
        user_liked: likedPostIds.has(post.id),
      }));

      setPosts(postsWithProfiles);
    }
  };

  const fetchChatMessages = async () => {
    const { data: messagesData } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);

    if (messagesData) {
      const userIds = [...new Set(messagesData.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const messagesWithProfiles = messagesData.map(msg => ({
        ...msg,
        profiles: profiles?.find(p => p.user_id === msg.user_id),
      }));

      setChatMessages(messagesWithProfiles);
      scrollToBottom();
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .eq("is_approved", true)
      .neq("user_id", user?.id);

    setUsers(data || []);
  };

  const fetchConversation = async (otherUserId: string) => {
    const { data } = await supabase
      .from("private_messages")
      .select("*")
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
      .order("created_at", { ascending: true });

    // Filter for this specific conversation
    const conversation = data?.filter(
      m => (m.sender_id === user?.id && m.receiver_id === otherUserId) ||
           (m.sender_id === otherUserId && m.receiver_id === user?.id)
    ) || [];

    setUserConversations(conversation);

    // Mark as read
    await supabase
      .from("private_messages")
      .update({ is_read: true })
      .eq("receiver_id", user?.id)
      .eq("sender_id", otherUserId);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    const { error } = await supabase.from("community_posts").insert({
      user_id: user?.id,
      content: newPostContent,
    });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível criar o post.", variant: "destructive" });
    } else {
      toast({ title: "Post criado! 🎉", description: "Seu post foi publicado." });
      setNewPostContent("");
      setIsPostDialogOpen(false);
      fetchPosts();
    }
  };

  const handleLikePost = async (postId: string, currentlyLiked: boolean) => {
    if (currentlyLiked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user?.id);
      await supabase.from("community_posts").update({ likes_count: posts.find(p => p.id === postId)!.likes_count - 1 }).eq("id", postId);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user?.id });
      await supabase.from("community_posts").update({ likes_count: posts.find(p => p.id === postId)!.likes_count + 1 }).eq("id", postId);
    }
    fetchPosts();
  };

  const handleSendChatMessage = async () => {
    if (!newChatMessage.trim()) return;

    const { error } = await supabase.from("chat_messages").insert({
      user_id: user?.id,
      content: newChatMessage,
    });

    if (!error) {
      setNewChatMessage("");
    }
  };

  const handleSendPrivateMessage = async () => {
    if (!newPrivateMessage.trim() || !selectedUser) return;

    const { error } = await supabase.from("private_messages").insert({
      sender_id: user?.id,
      receiver_id: selectedUser.user_id,
      content: newPrivateMessage,
    });

    if (!error) {
      setNewPrivateMessage("");
      fetchConversation(selectedUser.user_id);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Agora";
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

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
              <h1 className="font-serif text-2xl font-semibold text-foreground">Comunidade</h1>
              <p className="text-sm text-muted-foreground">Conecte-se com os jovens</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="feed">Mural</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
          </TabsList>

          {/* MURAL DE POSTS */}
          <TabsContent value="feed" className="space-y-4">
            <Button
              onClick={() => setIsPostDialogOpen(true)}
              className="w-full rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Post
            </Button>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl bg-card p-8 text-center">
                <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhum post ainda. Seja o primeiro!</p>
              </div>
            ) : (
              posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-card p-4 shadow-md"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {post.profiles?.full_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{post.profiles?.full_name || "Anônimo"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-foreground mb-3">{post.content}</p>
                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <button
                      onClick={() => handleLikePost(post.id, post.user_liked || false)}
                      className={`flex items-center gap-1 text-sm ${post.user_liked ? "text-red-500" : "text-muted-foreground"}`}
                    >
                      <Heart className={`h-4 w-4 ${post.user_liked ? "fill-current" : ""}`} />
                      {post.likes_count}
                    </button>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments_count}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* CHAT EM GRUPO */}
          <TabsContent value="chat" className="space-y-4">
            <div
              ref={chatContainerRef}
              className="h-[50vh] overflow-y-auto rounded-2xl bg-card p-4 space-y-3"
            >
              {chatMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Comece uma conversa!</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isOwn = msg.user_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {!isOwn && (
                          <p className="text-xs font-semibold mb-1">
                            {msg.profiles?.full_name || "Anônimo"}
                          </p>
                        )}
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="rounded-xl"
                onKeyPress={(e) => e.key === "Enter" && handleSendChatMessage()}
              />
              <Button onClick={handleSendChatMessage} size="icon" className="rounded-xl">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* MENSAGENS PRIVADAS */}
          <TabsContent value="messages" className="space-y-4">
            {selectedUser ? (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedUser(null)}
                  className="mb-2"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <div className="rounded-2xl bg-card p-4 mb-4">
                  <p className="font-semibold">{selectedUser.full_name}</p>
                </div>
                <div className="h-[40vh] overflow-y-auto rounded-2xl bg-muted/50 p-4 space-y-3">
                  {userConversations.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-card"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newPrivateMessage}
                    onChange={(e) => setNewPrivateMessage(e.target.value)}
                    placeholder="Mensagem privada..."
                    className="rounded-xl"
                    onKeyPress={(e) => e.key === "Enter" && handleSendPrivateMessage()}
                  />
                  <Button onClick={handleSendPrivateMessage} size="icon" className="rounded-xl">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione um jovem para conversar
                </p>
                {users.map((u) => (
                  <button
                    key={u.user_id}
                    onClick={() => {
                      setSelectedUser(u);
                      fetchConversation(u.user_id);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {u.full_name.charAt(0)}
                    </div>
                    <span className="font-medium text-foreground">{u.full_name}</span>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog para criar post */}
        <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
          <DialogContent className="mx-4 max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Novo Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="O que você quer compartilhar?"
                className="min-h-[120px] rounded-xl"
              />
              <Button onClick={handleCreatePost} className="w-full rounded-xl">
                Publicar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Comunidade;
