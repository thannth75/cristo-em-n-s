import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  Send, 
  MessageSquare,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useXpAward } from "@/hooks/useXpAward";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import ModernStoriesRow from "@/components/comunidade/ModernStoriesRow";
import ModernFeedPost from "@/components/comunidade/ModernFeedPost";
import CreatePostCard from "@/components/comunidade/CreatePostCard";
import { EnhancedStoryViewer } from "@/components/comunidade/EnhancedStoryViewer";
import { EnhancedCreateStoryDialog } from "@/components/comunidade/EnhancedCreateStoryDialog";
import { EnhancedCreatePostDialog } from "@/components/comunidade/EnhancedCreatePostDialog";
import { GroupList, GroupChat } from "@/components/comunidade/GroupList";
import { PostLikersDialog } from "@/components/comunidade/PostLikersDialog";
import { LevelUpCelebration } from "@/components/gamification/LevelUpCelebration";
import { chatMessageSchema, privateMessageSchema, validateInput } from "@/lib/validation";
import { AdFeed, shouldShowAdAtIndex } from "@/components/ads/AdBanner";
import AIFloatingButton from "@/components/ai/AIFloatingButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  video_url?: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null };
  user_liked?: boolean;
  user_reposted?: boolean;
}

interface Story {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  background_color: string;
  text_color: string;
  expires_at: string;
  created_at: string;
  views_count: number;
  likes_count?: number;
  comments_count?: number;
  audio_url?: string | null;
  audio_title?: string | null;
  tagged_users?: string[];
  profile?: { full_name: string; avatar_url: string | null };
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
}

interface UserProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

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

const Comunidade = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { awardXp, showLevelUp, levelUpData, closeLevelUp } = useXpAward(user?.id);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Stories
  const [userHasStory, setUserHasStory] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [viewingStories, setViewingStories] = useState<Story[] | null>(null);
  const [storyInitialIndex, setStoryInitialIndex] = useState(0);
  const [viewingOwnStories, setViewingOwnStories] = useState(false);
  
  // Posts
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [viewLikersPostId, setViewLikersPostId] = useState<string | null>(null);
  const [viewLikersCount, setViewLikersCount] = useState(0);
  
  // Chat
  const [newChatMessage, setNewChatMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Private messages
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newPrivateMessage, setNewPrivateMessage] = useState("");
  const [userConversations, setUserConversations] = useState<PrivateMessage[]>([]);
  
  // Groups
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

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

    supabase
      .channel('stories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stories' }, () => {
        fetchStories();
      })
      .subscribe();
  };

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchPosts(), fetchStories(), fetchChatMessages(), fetchUsers()]);
    setIsLoading(false);
  };

  const fetchStories = async () => {
    const { data: storiesData } = await supabase
      .from("user_stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (storiesData) {
      const userIds = [...new Set(storiesData.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const storiesWithProfiles = storiesData.map(story => ({
        ...story,
        profile: profiles?.find(p => p.user_id === story.user_id),
      }));

      setStories(storiesWithProfiles);
      setUserHasStory(storiesWithProfiles.some(s => s.user_id === user?.id));
    }
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

      const { data: userReposts } = await supabase
        .from("post_reposts")
        .select("original_post_id")
        .eq("user_id", user?.id);

      const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
      const repostedPostIds = new Set(userReposts?.map(r => r.original_post_id) || []);

      const postsWithProfiles = postsData.map(post => ({
        ...post,
        reposts_count: post.reposts_count || 0,
        profiles: profiles?.find(p => p.user_id === post.user_id),
        user_liked: likedPostIds.has(post.id),
        user_reposted: repostedPostIds.has(post.id),
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

  const handleEditPost = async () => {
    if (!editingPost || !editContent.trim()) return;

    const { error } = await supabase
      .from("community_posts")
      .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
      .eq("id", editingPost.id)
      .eq("user_id", user?.id);

    if (error) {
      toast({ title: "Erro ao editar post", variant: "destructive" });
    } else {
      toast({ title: "Post atualizado!" });
      fetchPosts();
    }
    setEditingPost(null);
    setEditContent("");
  };

  const handleDeletePost = async () => {
    if (!deletingPost) return;

    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", deletingPost.id)
      .eq("user_id", user?.id);

    if (error) {
      toast({ title: "Erro ao excluir post", variant: "destructive" });
    } else {
      toast({ title: "Post excluído!" });
      fetchPosts();
    }
    setDeletingPost(null);
  };

  const handleSendChatMessage = async () => {
    const validation = validateInput(chatMessageSchema, { content: newChatMessage });
    if (!validation.success) {
      toast({ title: "Erro", description: validation.error, variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("chat_messages").insert({
      user_id: user?.id,
      content: validation.data.content,
    });

    if (!error) setNewChatMessage("");
  };

  const handleSendPrivateMessage = async () => {
    if (!selectedUser) return;
    
    const validation = validateInput(privateMessageSchema, { content: newPrivateMessage });
    if (!validation.success) {
      toast({ title: "Erro", description: validation.error, variant: "destructive" });
      return;
    }

    const { error } = await supabase.functions.invoke("send-private-message", {
      body: {
        receiver_id: selectedUser.user_id,
        content: validation.data.content,
      },
    });

    if (!error) {
      setNewPrivateMessage("");
      fetchConversation(selectedUser.user_id);
    }
  };

  const handleMarkStoryViewed = async (storyId: string) => {
    await supabase.from("story_views").upsert({
      story_id: storyId,
      viewer_id: user?.id,
    }, { onConflict: 'story_id,viewer_id' });
  };

  const openStories = (userId: string) => {
    const userStories = stories.filter(s => s.user_id === userId);
    if (userStories.length > 0) {
      setViewingStories(userStories);
      setStoryInitialIndex(0);
      setViewingOwnStories(userId === user?.id);
      handleMarkStoryViewed(userStories[0].id);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.user_id]) {
      acc[story.user_id] = [];
    }
    acc[story.user_id].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  const uniqueStoryUsers = Object.keys(groupedStories);

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))' }}>
      <AppHeader userName={userName} />

      <main className="py-4 sm:py-6">
        <ResponsiveContainer size="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-lg sm:text-2xl font-semibold text-foreground">Comunidade</h1>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Conecte-se com os jovens</p>
              </div>
            </div>
          </motion.div>

          {/* Modern Stories Row */}
          <ModernStoriesRow
            currentUserId={user?.id || ""}
            currentUserName={profile?.full_name}
            currentUserAvatar={profile?.avatar_url}
            hasOwnStory={userHasStory}
            groupedStories={groupedStories}
            onCreateStory={() => setCreateStoryOpen(true)}
            onViewStory={openStories}
          />

          <Tabs defaultValue="feed" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-4 mb-3 sm:mb-4 h-auto rounded-none sm:rounded-xl">
              <TabsTrigger value="feed" className="text-[10px] sm:text-sm py-2.5 rounded-none sm:rounded-lg">Mural</TabsTrigger>
              <TabsTrigger value="groups" className="text-[10px] sm:text-sm py-2.5 rounded-none sm:rounded-lg">Grupos</TabsTrigger>
              <TabsTrigger value="chat" className="text-[10px] sm:text-sm py-2.5 rounded-none sm:rounded-lg">Chat</TabsTrigger>
              <TabsTrigger value="messages" className="text-[10px] sm:text-sm py-2.5 rounded-none sm:rounded-lg">DM</TabsTrigger>
            </TabsList>

            {/* MURAL DE POSTS - Facebook Style */}
            <TabsContent value="feed" className="space-y-3 sm:space-y-4 mt-0">
              {/* Create Post Card */}
              <CreatePostCard
                userName={profile?.full_name}
                avatarUrl={profile?.avatar_url}
                onClick={() => setIsPostDialogOpen(true)}
              />

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-none sm:rounded-2xl bg-card border-y sm:border border-border p-8 text-center">
                  <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Nenhum post ainda. Seja o primeiro!</p>
                </div>
              ) : (
                posts.map((post, index) => (
                  <div key={post.id}>
                    <ModernFeedPost
                      post={post}
                      currentUserId={user?.id || ""}
                      onLike={handleLikePost}
                      onEdit={(p) => { setEditingPost(p); setEditContent(p.content); }}
                      onDelete={(p) => setDeletingPost(p)}
                      onViewLikers={(id, count) => { setViewLikersPostId(id); setViewLikersCount(count); }}
                      onCommentsChange={(postId, count) => {
                        setPosts(prev => prev.map(p => 
                          p.id === postId ? { ...p, comments_count: count } : p
                        ));
                      }}
                      onRepostSuccess={fetchPosts}
                    />
                    {shouldShowAdAtIndex(index, 6) && <AdFeed />}
                  </div>
                ))
              )}
            </TabsContent>

            {/* GRUPOS */}
            <TabsContent value="groups">
              <GroupList onGroupSelect={setSelectedGroup} />
            </TabsContent>

            {/* CHAT EM GRUPO */}
            <TabsContent value="chat" className="space-y-4">
              <div ref={chatContainerRef} className="h-[50vh] overflow-y-auto rounded-2xl bg-card p-3 sm:p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground text-sm">Comece uma conversa!</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isOwn = msg.user_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {!isOwn && <p className="text-xs font-semibold mb-1">{msg.profiles?.full_name || "Anônimo"}</p>}
                          <p className="text-sm break-words">{msg.content}</p>
                          <p className={`text-[10px] sm:text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatTime(msg.created_at)}</p>
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
                  <Button variant="ghost" onClick={() => setSelectedUser(null)} className="mb-2" size="sm">
                    <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <div className="rounded-2xl bg-card p-3 sm:p-4 mb-4">
                    <p className="font-semibold text-sm sm:text-base truncate">{selectedUser.full_name}</p>
                  </div>
                  <div className="h-[40vh] overflow-y-auto rounded-2xl bg-muted/50 p-3 sm:p-4 space-y-3">
                    {userConversations.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                            <p className="text-sm break-words">{msg.content}</p>
                            <p className={`text-[10px] sm:text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatTime(msg.created_at)}</p>
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
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">Selecione um jovem para conversar</p>
                  {users.map((u) => (
                    <button
                      key={u.user_id}
                      onClick={() => { setSelectedUser(u); fetchConversation(u.user_id); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted transition-colors"
                    >
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {u.full_name.charAt(0)}
                      </div>
                      <span className="font-medium text-sm sm:text-base text-foreground truncate">{u.full_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>

        {/* Dialog para criar post */}
        <EnhancedCreatePostDialog
          open={isPostDialogOpen}
          onOpenChange={setIsPostDialogOpen}
          userId={user?.id || ""}
          onSuccess={fetchPosts}
          onXpAward={awardXp}
        />

        {/* Create Story Dialog */}
        <EnhancedCreateStoryDialog
          open={createStoryOpen}
          onOpenChange={setCreateStoryOpen}
          userId={user?.id || ""}
          onSuccess={fetchStories}
        />

        {/* Story Viewer */}
        {viewingStories && (
          <EnhancedStoryViewer
            stories={viewingStories}
            initialIndex={storyInitialIndex}
            onClose={() => setViewingStories(null)}
            onMarkViewed={handleMarkStoryViewed}
            userId={user?.id || ""}
            isOwnStory={viewingOwnStories}
          />
        )}

        {/* Group Chat */}
        {selectedGroup && (
          <GroupChat group={selectedGroup} onClose={() => setSelectedGroup(null)} />
        )}

        {/* Edit Post Dialog */}
        <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Post</DialogTitle>
            </DialogHeader>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="O que você está pensando?"
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPost(null)}>Cancelar</Button>
              <Button onClick={handleEditPost}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Post Confirmation */}
        <AlertDialog open={!!deletingPost} onOpenChange={(open) => !open && setDeletingPost(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Post</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Post Likers Dialog */}
        {viewLikersPostId && (
          <PostLikersDialog
            postId={viewLikersPostId}
            open={!!viewLikersPostId}
            onOpenChange={(open) => !open && setViewLikersPostId(null)}
            likesCount={viewLikersCount}
          />
        )}
      </main>

      <AIFloatingButton type="general" />
      <BottomNavigation />

      {levelUpData && (
        <LevelUpCelebration
          open={showLevelUp}
          onClose={closeLevelUp}
          newLevel={levelUpData.newLevel}
          levelTitle={levelUpData.levelTitle}
          levelIcon={levelUpData.levelIcon}
          rewards={levelUpData.rewards}
        />
      )}
    </div>
  );
};

export default Comunidade;
