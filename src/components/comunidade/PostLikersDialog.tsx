import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Liker {
  id: string;
  user_id: string;
  created_at: string;
  profile?: { full_name: string; avatar_url: string | null };
}

interface PostLikersDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  likesCount: number;
}

export function PostLikersDialog({
  postId,
  open,
  onOpenChange,
  likesCount,
}: PostLikersDialogProps) {
  const [likers, setLikers] = useState<Liker[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLikers();
    }
  }, [open, postId]);

  const fetchLikers = async () => {
    setIsLoading(true);
    
    const { data: likesData } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (likesData) {
      const userIds = likesData.map(l => l.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

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
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Agora';
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500 fill-current" />
            Curtidas ({likesCount})
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {likers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma curtida ainda
              </div>
            ) : (
              likers.map((liker) => (
                <motion.div
                  key={liker.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={liker.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {liker.profile?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {liker.profile?.full_name || 'Usuário'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(liker.created_at)}
                    </p>
                  </div>
                  <Heart className="h-4 w-4 text-red-500 fill-current shrink-0" />
                </motion.div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
