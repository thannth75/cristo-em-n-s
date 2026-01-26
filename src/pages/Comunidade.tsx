import { useEffect, useState, useRef, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Send, 
  Plus, 
  Image as ImageIcon,
  MessageSquare,
  ChevronLeft,
  X,
  Loader2
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
import PostComments from "@/components/comunidade/PostComments";
import { communityPostSchema, chatMessageSchema, privateMessageSchema, validateInput } from "@/lib/validation";

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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [newChatMessage, setNewChatMessage] = useState("");
  
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newPrivateMessage, setNewPrivateMessage] = useState("");
  const [userConversations, setUserConversations] = useState<PrivateMessage[]>([]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    supabase
      .channel('community_posts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    supabase
      .channel('chat_messages_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setChatMessages(prev => [...prev, newMsg]);
        scrollToBottom();
      })
      .subscribe();

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
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

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

    const conversation = data?.filter(
      m => (m.sender_id === user?.id && m.receiver_id === otherUserId) ||
           (m.sender_id === otherUserId && m.receiver_id === user?.id)
    ) || [];

    setUserConversations(conversation);

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

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ 
          title: "Imagem muito grande", 
          description: "O tamanho máximo é 5MB.",
          variant: "destructive" 
        });
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    const { error } = await supabase.storage
      .from("posts")
      .upload(filePath, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("posts")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleCreatePost = async () => {
    const validation = validateInput(communityPostSchema, { content: newPostContent });
    
    if (!validation.success) {
      toast({ title: "Erro de validação", description: validation.error, variant: "destructive" });
      return;
    }

    setIsUploading(true);
    let imageUrl: string | null = null;

    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl) {
        toast({ 
          title: "Erro no upload", 
          description: "Não foi possível enviar a imagem.",
          variant: "destructive" 
        });
        setIsUploading(false);
        return;
      }
    }

    const validatedData = validation.data;
    const { error } = await supabase.from("community_posts").insert({
      user_id: user?.id,
      content: validatedData.content,
      image_url: imageUrl,
    });

    setIsUploading(false);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível criar o post.", variant: "destructive" });
    } else {
      toast({ title: "Post criado! 🎉", description: "Seu post foi publicado." });
      setNewPostContent("");
      removeSelectedImage();
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
    const validation = validateInput(chatMessageSchema, { content: newChatMessage });
    
    if (!validation.success) {
      toast({ title: "Erro", description: validation.error, variant: "destructive" });
      return;
    }

    const validatedData = validation.data;
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user?.id,
      content: validatedData.content,
    });

    if (!error) {
      setNewChatMessage("");
    }
  };

  const handleSendPrivateMessage = async () => {
    if (!selectedUser) return;
    
    const validation = validateInput(privateMessageSchema, { content: newPrivateMessage });
    
    if (!validation.success) {
      toast({ title: "Erro", description: validation.error, variant: "destructive" });
      return;
    }

    const validatedData = validation.data;
    const { error } = await supabase.from("private_messages").insert({
      sender_id: user?.id,
      receiver_id: selectedUser.user_id,
      content: validatedData.content,
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
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">Comunidade</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Conecte-se com os jovens</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="feed" className="text-xs sm:text-sm">Mural</TabsTrigger>
            <TabsTrigger value="chat" className="text-xs sm:text-sm">Chat</TabsTrigger>
            <TabsTrigger value="messages" className="text-xs sm:text-sm">Mensagens</TabsTrigger>
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
                  className="rounded-2xl bg-card p-4 shadow-md overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {post.profiles?.full_name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{post.profiles?.full_name || "Anônimo"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
                    </div>
                  </div>
                  
                  <p className="text-foreground mb-3 break-words">{post.content}</p>
                  
                  {/* Post Image */}
                  {post.image_url && (
                    <div className="mb-3 -mx-4 sm:mx-0 sm:rounded-xl overflow-hidden">
                      <img 
                        src={post.image_url} 
                        alt="Imagem do post" 
                        className="w-full max-h-80 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <button
                      onClick={() => handleLikePost(post.id, post.user_liked || false)}
                      className={`flex items-center gap-1 text-sm ${post.user_liked ? "text-destructive" : "text-muted-foreground"} hover:text-destructive transition-colors`}
                    >
                      <Heart className={`h-4 w-4 ${post.user_liked ? "fill-current" : ""}`} />
                      {post.likes_count}
                    </button>
                    <PostComments 
                      postId={post.id} 
                      commentsCount={post.comments_count}
                      onCommentsChange={(count) => {
                        setPosts(prev => prev.map(p => 
                          p.id === post.id ? { ...p, comments_count: count } : p
                        ));
                      }}
                    />
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
                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 ${
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
                        <p className="text-sm break-words">{msg.content}</p>
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
                className="rounded-xl flex-1"
                onKeyPress={(e) => e.key === "Enter" && handleSendChatMessage()}
              />
              <Button onClick={handleSendChatMessage} size="icon" className="rounded-xl shrink-0">
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
                  <p className="font-semibold truncate">{selectedUser.full_name}</p>
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
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-card"
                          }`}
                        >
                          <p className="text-sm break-words">{msg.content}</p>
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
                    className="rounded-xl flex-1"
                    onKeyPress={(e) => e.key === "Enter" && handleSendPrivateMessage()}
                  />
                  <Button onClick={handleSendPrivateMessage} size="icon" className="rounded-xl shrink-0">
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {u.full_name.charAt(0)}
                    </div>
                    <span className="font-medium text-foreground truncate">{u.full_name}</span>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog para criar post */}
        <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
          <DialogContent className="mx-4 max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Novo Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="O que você quer compartilhar?"
                className="min-h-[100px] rounded-xl"
              />
              
              {/* Image Preview */}
              <AnimatePresence>
                {imagePreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative rounded-xl overflow-hidden"
                  >
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full max-h-48 object-cover rounded-xl"
                    />
                    <button
                      onClick={removeSelectedImage}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Image Upload */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl gap-2 flex-1"
                  disabled={isUploading}
                >
                  <ImageIcon className="h-4 w-4" />
                  {selectedImage ? "Trocar foto" : "Adicionar foto"}
                </Button>
              </div>
              
              <Button 
                onClick={handleCreatePost} 
                className="w-full rounded-xl"
                disabled={isUploading || !newPostContent.trim()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  "Publicar"
                )}
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
