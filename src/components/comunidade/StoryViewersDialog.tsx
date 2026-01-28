import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Heart, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Viewer {
  id: string;
  user_id: string;
  viewed_at: string;
  profile?: { full_name: string; avatar_url: string | null };
}

interface Liker {
  id: string;
  user_id: string;
  created_at: string;
  profile?: { full_name: string; avatar_url: string | null };
}

interface StoryViewersDialogProps {
  storyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewsCount: number;
  likesCount: number;
}

export function StoryViewersDialog({
  storyId,
  open,
  onOpenChange,
  viewsCount,
  likesCount,
}: StoryViewersDialogProps) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [likers, setLikers] = useState<Liker[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, storyId]);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch viewers
    const { data: viewsData } = await supabase
      .from('story_views')
      .select('*')
      .eq('story_id', storyId)
      .order('viewed_at', { ascending: false });

    // Fetch likers
    const { data: likesData } = await supabase
      .from('story_likes')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: false });

    // Get unique user IDs
    const userIds = [
      ...new Set([
        ...(viewsData?.map(v => v.viewer_id) || []),
        ...(likesData?.map(l => l.user_id) || []),
      ]),
    ];

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);

    // Map viewers with profiles
    if (viewsData) {
      setViewers(
        viewsData.map(v => ({
          id: v.id,
          user_id: v.viewer_id,
          viewed_at: v.viewed_at,
          profile: profiles?.find(p => p.user_id === v.viewer_id),
        }))
      );
    }

    // Map likers with profiles
    if (likesData) {
      setLikers(
        likesData.map(l => ({
          ...l,
          profile: profiles?.find(p => p.user_id === l.user_id),
        }))
      );
    }

    setIsLoading(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const renderUserList = (users: Array<{ user_id: string; profile?: { full_name: string; avatar_url: string | null }; viewed_at?: string; created_at?: string }>, isLikes = false) => (
    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
      {users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {isLikes ? 'Nenhuma curtida ainda' : 'Nenhuma visualização ainda'}
        </div>
      ) : (
        users.map((user) => (
          <motion.div
            key={user.user_id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.profile?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {user.profile?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTime(user.viewed_at || user.created_at || '')}
              </p>
            </div>
            {isLikes && <Heart className="h-4 w-4 text-red-500 fill-current" />}
          </motion.div>
        ))
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-serif">Interações do Status</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="views" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="views" className="gap-2">
                <Eye className="h-4 w-4" />
                <span>{viewsCount}</span>
              </TabsTrigger>
              <TabsTrigger value="likes" className="gap-2">
                <Heart className="h-4 w-4" />
                <span>{likesCount}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="views" className="mt-4">
              {renderUserList(viewers)}
            </TabsContent>

            <TabsContent value="likes" className="mt-4">
              {renderUserList(likers, true)}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
