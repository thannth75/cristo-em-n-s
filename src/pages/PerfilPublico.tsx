import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  MessageCircle, 
  Award, 
  Trophy, 
  Star,
  Users,
  BookOpen,
  Heart,
  Camera,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import BottomNavigation from "@/components/BottomNavigation";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import { LevelBadge } from "@/components/gamification/LevelBadge";

interface PublicProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  current_level: number;
  total_xp: number;
  created_at: string;
}

interface UserStats {
  posts: number;
  achievements: number;
  attendance: number;
  followers: number;
  following: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

const PerfilPublico = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, isApproved, isLoading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ posts: 0, achievements: 0, attendance: 0, followers: 0, following: 0 });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [levelInfo, setLevelInfo] = useState<{ title: string; icon: string; xpRequired: number; nextXp: number } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate("/auth");
    } else if (!authLoading && !isApproved) {
      navigate("/pending");
    }
  }, [currentUser, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (userId && currentUser) {
      fetchProfileData();
      recordProfileView();
    }
  }, [userId, currentUser]);

  const fetchProfileData = async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileData) {
        setProfile(profileData as PublicProfile);
      }

      // Fetch stats in parallel
      const [postsRes, achievementsRes, attendanceRes, followersRes, followingRes] = await Promise.all([
        supabase.from("community_posts").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("user_achievements").select("*, achievements(*)").eq("user_id", userId),
        supabase.from("attendance").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("user_follows").select("id", { count: "exact" }).eq("following_id", userId),
        supabase.from("user_follows").select("id", { count: "exact" }).eq("follower_id", userId),
      ]);

      setStats({
        posts: postsRes.count || 0,
        achievements: achievementsRes.data?.length || 0,
        attendance: attendanceRes.count || 0,
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
      });

      // Set achievements
      if (achievementsRes.data) {
        setAchievements(achievementsRes.data.map((a: any) => ({
          id: a.id,
          name: a.achievements?.name || "Conquista",
          description: a.achievements?.description || "",
          icon: a.achievements?.icon || "🏆",
          earned_at: a.earned_at,
        })));
      }

      // Fetch recent posts
      const { data: postsData } = await supabase
        .from("community_posts")
        .select("id, content, image_url, likes_count, comments_count, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6);

      if (postsData) {
        setPosts(postsData);
      }

      // Fetch level info
      const { data: levelData } = await supabase
        .from("level_definitions")
        .select("*")
        .lte("level_number", profileData?.current_level || 1)
        .order("level_number", { ascending: false })
        .limit(1);

      const { data: nextLevelData } = await supabase
        .from("level_definitions")
        .select("xp_required")
        .eq("level_number", (profileData?.current_level || 1) + 1)
        .single();

      if (levelData?.[0]) {
        setLevelInfo({
          title: levelData[0].title,
          icon: levelData[0].icon,
          xpRequired: levelData[0].xp_required,
          nextXp: nextLevelData?.xp_required || levelData[0].xp_required + 100,
        });
      }

      // Check if following
      if (currentUser?.id !== userId) {
        const { data: followData } = await supabase
          .from("user_follows")
          .select("id")
          .eq("follower_id", currentUser?.id)
          .eq("following_id", userId)
          .single();

        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }

    setIsLoading(false);
  };

  const recordProfileView = async () => {
    if (!userId || !currentUser || userId === currentUser.id) return;

    await supabase.from("profile_views").insert({
      profile_user_id: userId,
      viewer_id: currentUser.id,
    });
  };

  const handleFollow = async () => {
    if (!userId || !currentUser) return;

    if (isFollowing) {
      await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", userId);
      setIsFollowing(false);
      setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
    } else {
      await supabase.from("user_follows").insert({
        follower_id: currentUser.id,
        following_id: userId,
      });
      setIsFollowing(true);
      setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const xpProgress = levelInfo 
    ? ((profile?.total_xp || 0) - levelInfo.xpRequired) / (levelInfo.nextXp - levelInfo.xpRequired) * 100
    : 0;

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Perfil não encontrado</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Voltar</Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div 
      className="min-h-screen bg-background"
      style={{ paddingBottom: 'calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))' }}
    >
      {/* Cover Photo */}
      <div className="relative h-40 sm:h-56 bg-gradient-to-br from-primary/80 to-primary">
        {profile.cover_url && (
          <img 
            src={profile.cover_url} 
            alt="Cover" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-black/30 text-white hover:bg-black/50 rounded-full"
          style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile Info */}
      <ResponsiveContainer size="lg" className="-mt-16 relative z-10">
        <div className="flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-28 w-28 sm:h-36 sm:w-36 border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            {levelInfo && (
              <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-lg">
                <LevelBadge level={profile.current_level || 1} icon={levelInfo.icon} title={levelInfo.title} size="md" />
              </div>
            )}
          </div>

          {/* Name and Actions */}
          <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0 sm:mb-4">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              {profile.full_name}
            </h1>
            {levelInfo && (
              <p className="text-primary font-medium flex items-center justify-center sm:justify-start gap-1 mt-1">
                <span>{levelInfo.icon}</span>
                <span>{levelInfo.title}</span>
              </p>
            )}
            {(profile.city || profile.state) && (
              <p className="text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {[profile.city, profile.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 sm:mt-0 sm:mb-4">
            {!isOwnProfile ? (
              <>
                <Button 
                  onClick={handleFollow}
                  variant={isFollowing ? "outline" : "default"}
                  className="rounded-xl"
                >
                  {isFollowing ? (
                    <><Check className="h-4 w-4 mr-1" /> Seguindo</>
                  ) : (
                    <><Users className="h-4 w-4 mr-1" /> Seguir</>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-xl"
                  onClick={() => navigate(`/mensagens?user=${userId}`)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Mensagem
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                className="rounded-xl"
                onClick={() => navigate("/perfil")}
              >
                <Camera className="h-4 w-4 mr-1" />
                Editar Perfil
              </Button>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center sm:text-left text-muted-foreground"
          >
            {profile.bio}
          </motion.p>
        )}

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 grid grid-cols-5 gap-2"
        >
          {[
            { label: "Posts", value: stats.posts, icon: BookOpen },
            { label: "Conquistas", value: stats.achievements, icon: Award },
            { label: "Presenças", value: stats.attendance, icon: Calendar },
            { label: "Seguidores", value: stats.followers, icon: Heart },
            { label: "Seguindo", value: stats.following, icon: Users },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-2 rounded-xl bg-card">
              <stat.icon className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="font-bold text-lg text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* XP Progress */}
        {levelInfo && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 p-4 rounded-2xl bg-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Nível {profile.current_level || 1}</span>
              <span className="text-xs text-muted-foreground">
                {profile.total_xp || 0} / {levelInfo.nextXp} XP
              </span>
            </div>
            <Progress value={Math.min(xpProgress, 100)} className="h-2" />
          </motion.div>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">Publicações</TabsTrigger>
            <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            {posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma publicação ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="aspect-square rounded-xl overflow-hidden bg-muted relative group cursor-pointer"
                    onClick={() => navigate(`/comunidade`)}
                  >
                    {post.image_url ? (
                      <img 
                        src={post.image_url} 
                        alt="Post" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3 bg-primary/10">
                        <p className="text-xs text-center text-foreground line-clamp-4">
                          {post.content}
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-3 text-white text-sm">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" /> {post.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" /> {post.comments_count}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="mt-4">
            {achievements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma conquista ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-card border border-border"
                  >
                    <span className="text-3xl">{achievement.icon}</span>
                    <h3 className="font-semibold mt-2 text-sm">{achievement.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {achievement.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Joined date */}
        <p className="text-center text-xs text-muted-foreground mt-8 mb-4">
          Membro desde {formatDate(profile.created_at)}
        </p>
      </ResponsiveContainer>

      <BottomNavigation />
    </div>
  );
};

export default PerfilPublico;