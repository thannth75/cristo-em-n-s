import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, MessageSquare, Loader2, TrendingUp, Clock, Pin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useXpAward } from "@/hooks/useXpAward";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import ModernStoriesRow from "@/components/comunidade/ModernStoriesRow";
import ModernFeedPost from "@/components/comunidade/ModernFeedPost";
import CreatePostCard from "@/components/comunidade/CreatePostCard";
import { EnhancedStoryViewer } from "@/components/comunidade/EnhancedStoryViewer";
import { EnhancedCreateStoryDialog } from "@/components/comunidade/EnhancedCreateStoryDialog";
import { EnhancedCreatePostDialog } from "@/components/comunidade/EnhancedCreatePostDialog";
import { PostLikersDialog } from "@/components/comunidade/PostLikersDialog";
import { LevelUpCelebration } from "@/components/gamification/LevelUpCelebration";
import { AdFeed, shouldShowAdAtIndex } from "@/components/ads/AdBanner";
import AIFloatingButton from "@/components/ai/AIFloatingButton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  video_url?: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  is_pinned?: boolean;
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

type FeedFilter = "recent" | "popular";

const Comunidade = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { awardXp, showLevelUp, levelUpData, closeLevelUp } = useXpAward(user?.id);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("recent");
  
  const [userHasStory, setUserHasStory] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [viewingStories, setViewingStories] = useState<Story[] | null>(null);
  const [storyInitialIndex, setStoryInitialIndex] = useState(0);
  const [viewingOwnStories, setViewingOwnStories] = useState(false);
  
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [viewLikersPostId, setViewLikersPostId] = useState<string | null>(null);
  const [viewLikersCount, setViewLikersCount] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (isApproved && user) {
      fetchData();
      const ch1 = supabase.channel('community_posts_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => fetchPosts())
        .subscribe();
      const ch2 = supabase.channel('stories_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stories' }, () => fetchStories())
        .subscribe();
      return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
    }
  }, [isApproved, user]);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchPosts(), fetchStories()]);
    setIsLoading(false);
  };

  const fetchStories = async () => {
    const { data: storiesData } = await supabase.from("user_stories").select("*").order("created_at", { ascending: false });
    if (storiesData) {
      const userIds = [...new Set(storiesData.map(s => s.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds);
      const storiesWithProfiles = storiesData.map(story => ({ ...story, profile: profiles?.find(p => p.user_id === story.user_id) }));
      setStories(storiesWithProfiles);
      setUserHasStory(storiesWithProfiles.some(s => s.user_id === user?.id));
    }
  };

  const fetchPosts = async () => {
    const { data: postsData } = await supabase.from("community_posts").select("*").order("created_at", { ascending: false });
    if (postsData) {
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const [{ data: profiles }, { data: userLikes }, { data: userReposts }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds),
        supabase.from("post_likes").select("post_id").eq("user_id", user?.id),
        supabase.from("post_reposts").select("original_post_id").eq("user_id", user?.id),
      ]);
      const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
      const repostedPostIds = new Set(userReposts?.map(r => r.original_post_id) || []);
      setPosts(postsData.map(post => ({
        ...post, reposts_count: post.reposts_count || 0,
        profiles: profiles?.find(p => p.user_id === post.user_id),
        user_liked: likedPostIds.has(post.id), user_reposted: repostedPostIds.has(post.id),
      })));
    }
  };

  const handleLikePost = async (postId: string, currentlyLiked: boolean) => {
    if (currentlyLiked) await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user?.id);
    else await supabase.from("post_likes").insert({ post_id: postId, user_id: user?.id });
    fetchPosts();
  };

  const handleEditPost = async () => {
    if (!editingPost || !editContent.trim()) return;
    const { error } = await supabase.from("community_posts")
      .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
      .eq("id", editingPost.id).eq("user_id", user?.id);
    if (error) toast({ title: "Erro ao editar post", variant: "destructive" });
    else { toast({ title: "Post atualizado!" }); fetchPosts(); }
    setEditingPost(null); setEditContent("");
  };

  const handleDeletePost = async () => {
    if (!deletingPost) return;
    const { error } = await supabase.from("community_posts").delete().eq("id", deletingPost.id).eq("user_id", user?.id);
    if (error) toast({ title: "Erro ao excluir post", variant: "destructive" });
    else { toast({ title: "Post excluído!" }); fetchPosts(); }
    setDeletingPost(null);
  };

  const handleMarkStoryViewed = async (storyId: string) => {
    await supabase.from("story_views").upsert({ story_id: storyId, viewer_id: user?.id }, { onConflict: 'story_id,viewer_id' });
  };

  const openStories = (userId: string) => {
    const userStories = stories.filter(s => s.user_id === userId);
    if (userStories.length === 0) return;
    setViewingStories(userStories); setStoryInitialIndex(0); setViewingOwnStories(userId === user?.id);
  };

  const groupedStories = stories.reduce((acc, story) => {
    const userId = story.user_id;
    if (!acc[userId]) acc[userId] = [];
    acc[userId].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  // Sort posts based on filter
  const sortedPosts = [...posts].sort((a, b) => {
    // Pinned posts always first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    if (feedFilter === "popular") return (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const userName = profile?.full_name || "Jovem";

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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 sm:mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-lg sm:text-2xl font-semibold text-foreground">Comunidade</h1>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Conecte-se com os irmãos</p>
              </div>
            </div>
          </motion.div>

          <ModernStoriesRow currentUserId={user?.id || ""} currentUserName={profile?.full_name}
            currentUserAvatar={profile?.avatar_url} hasOwnStory={userHasStory} groupedStories={groupedStories}
            onCreateStory={() => setCreateStoryOpen(true)} onViewStory={openStories} />

          <div className="space-y-3 sm:space-y-4 mt-4">
            <CreatePostCard userName={profile?.full_name} avatarUrl={profile?.avatar_url} onClick={() => setIsPostDialogOpen(true)} />

            {/* Feed Filters */}
            <div className="flex gap-2 px-1">
              <Button size="sm" variant={feedFilter === "recent" ? "default" : "outline"}
                className="rounded-full text-xs h-8 gap-1.5" onClick={() => setFeedFilter("recent")}>
                <Clock className="h-3.5 w-3.5" /> Recentes
              </Button>
              <Button size="sm" variant={feedFilter === "popular" ? "default" : "outline"}
                className="rounded-full text-xs h-8 gap-1.5" onClick={() => setFeedFilter("popular")}>
                <TrendingUp className="h-3.5 w-3.5" /> Populares
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : sortedPosts.length === 0 ? (
              <div className="rounded-none sm:rounded-2xl bg-card border-y sm:border border-border p-8 text-center">
                <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhum post ainda. Seja o primeiro!</p>
              </div>
            ) : (
              sortedPosts.map((post, index) => (
                <div key={post.id}>
                  {post.is_pinned && (
                    <div className="flex items-center gap-1.5 px-4 py-1 text-xs text-primary font-medium">
                      <Pin className="h-3 w-3" /> Post fixado
                    </div>
                  )}
                  <ModernFeedPost post={post} currentUserId={user?.id || ""}
                    onLike={handleLikePost}
                    onEdit={(p) => { setEditingPost(p); setEditContent(p.content); }}
                    onDelete={(p) => setDeletingPost(p)}
                    onViewLikers={(id, count) => { setViewLikersPostId(id); setViewLikersCount(count); }}
                    onCommentsChange={(postId, count) => { setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: count } : p)); }}
                    onRepostSuccess={fetchPosts} />
                  {shouldShowAdAtIndex(index, 6) && <AdFeed />}
                </div>
              ))
            )}
          </div>

          <EnhancedCreateStoryDialog open={createStoryOpen} onOpenChange={setCreateStoryOpen} userId={user?.id || ""} onSuccess={fetchStories} />
          <EnhancedCreatePostDialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen} userId={user?.id || ""}
            onSuccess={() => fetchPosts()} onXpAward={(type, id, description) => awardXp(type, id, description)} />

          {viewingStories && (
            <EnhancedStoryViewer stories={viewingStories} initialIndex={storyInitialIndex} userId={user?.id || ""}
              isOwnStory={viewingOwnStories} onClose={() => setViewingStories(null)} onMarkViewed={handleMarkStoryViewed} />
          )}
        </ResponsiveContainer>

        <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Editar Post</DialogTitle></DialogHeader>
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="O que você está pensando?" rows={4} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPost(null)}>Cancelar</Button>
              <Button onClick={handleEditPost}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingPost} onOpenChange={(open) => !open && setDeletingPost(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Post</AlertDialogTitle>
              <AlertDialogDescription>Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {viewLikersPostId && (
          <PostLikersDialog postId={viewLikersPostId} open={!!viewLikersPostId}
            onOpenChange={(open) => !open && setViewLikersPostId(null)} likesCount={viewLikersCount} />
        )}
      </main>

      <AIFloatingButton type="general" />
      <BottomNavigation />

      {levelUpData && (
        <LevelUpCelebration open={showLevelUp} onClose={closeLevelUp} newLevel={levelUpData.newLevel}
          levelTitle={levelUpData.levelTitle} levelIcon={levelUpData.levelIcon} rewards={levelUpData.rewards} />
      )}
    </div>
  );
};

export default Comunidade;
