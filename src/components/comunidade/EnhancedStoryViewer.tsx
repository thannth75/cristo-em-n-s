import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Eye, ChevronLeft, ChevronRight, Heart, MessageCircle, 
  Bookmark, Send, Loader2, Pause, Play, Volume2, VolumeX 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Story {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  background_color: string;
  text_color: string;
  created_at: string;
  views_count: number;
  likes_count?: number;
  comments_count?: number;
  audio_url?: string | null;
  audio_title?: string | null;
  tagged_users?: string[];
  profile?: { full_name: string; avatar_url: string | null };
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: { full_name: string };
}

interface EnhancedStoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onMarkViewed: (storyId: string) => void;
  userId: string;
}

export const EnhancedStoryViewer = ({
  stories,
  initialIndex,
  onClose,
  onMarkViewed,
  userId,
}: EnhancedStoryViewerProps) => {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const holdTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const story = stories[currentIndex];

  // Check if liked/saved on story change
  useEffect(() => {
    if (!story) return;
    checkLikeStatus();
    checkSaveStatus();
  }, [currentIndex, story?.id]);

  // Progress timer
  useEffect(() => {
    if (isPaused || showComments) return;
    
    const STORY_DURATION = 7000; // 7 seconds
    const INTERVAL = 50;
    
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + (INTERVAL / STORY_DURATION) * 100;
        if (next >= 100) {
          goNext();
          return 0;
        }
        return next;
      });
    }, INTERVAL);
    
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [currentIndex, isPaused, showComments]);

  // Audio management
  useEffect(() => {
    if (story?.audio_url && audioRef.current) {
      audioRef.current.src = story.audio_url;
      audioRef.current.muted = isMuted;
      if (!isPaused) audioRef.current.play();
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [story?.audio_url, isPaused, isMuted]);

  const checkLikeStatus = async () => {
    const { data } = await supabase
      .from('story_likes')
      .select('id')
      .eq('story_id', story.id)
      .eq('user_id', userId)
      .maybeSingle();
    setIsLiked(!!data);
  };

  const checkSaveStatus = async () => {
    const { data } = await supabase
      .from('saved_stories')
      .select('id')
      .eq('story_id', story.id)
      .eq('user_id', userId)
      .maybeSingle();
    setIsSaved(!!data);
  };

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
      onMarkViewed(stories[currentIndex + 1].id);
    } else {
      onClose();
    }
  }, [currentIndex, stories, onClose, onMarkViewed]);

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleLike = async () => {
    if (isLiked) {
      await supabase.from('story_likes').delete()
        .eq('story_id', story.id).eq('user_id', userId);
    } else {
      await supabase.from('story_likes').insert({ story_id: story.id, user_id: userId });
    }
    setIsLiked(!isLiked);
  };

  const handleSave = async () => {
    if (isSaved) {
      await supabase.from('saved_stories').delete()
        .eq('story_id', story.id).eq('user_id', userId);
      toast({ title: 'Removido dos salvos' });
    } else {
      await supabase.from('saved_stories').insert({ story_id: story.id, user_id: userId });
      toast({ title: 'Salvo! 📌' });
    }
    setIsSaved(!isSaved);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('story_comments')
      .select('*')
      .eq('story_id', story.id)
      .order('created_at', { ascending: true });
    
    if (data) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      setComments(data.map(c => ({
        ...c,
        profile: profiles?.find(p => p.user_id === c.user_id),
      })));
    }
  };

  const toggleComments = async () => {
    if (!showComments) {
      setIsPaused(true);
      await fetchComments();
    } else {
      setIsPaused(false);
    }
    setShowComments(!showComments);
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setIsSending(true);
    
    const { error } = await supabase.from('story_comments').insert({
      story_id: story.id,
      user_id: userId,
      content: newComment.trim(),
    });
    
    if (!error) {
      setNewComment('');
      fetchComments();
    }
    setIsSending(false);
  };

  // Touch/Click handlers for pause
  const handlePressStart = () => {
    holdTimeout.current = setTimeout(() => {
      setIsPaused(true);
    }, 200);
  };

  const handlePressEnd = () => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
    }
    setIsPaused(false);
  };

  if (!story) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black touch-none"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      {/* Audio element */}
      {story.audio_url && <audio ref={audioRef} loop />}
      
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-10 left-4 right-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white font-semibold">
              {story.profile?.full_name?.charAt(0) || '?'}
            </span>
          </div>
          <div>
            <p className="text-white font-semibold">{story.profile?.full_name || 'Usuário'}</p>
            <p className="text-white/60 text-xs flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {story.views_count}
              {story.audio_title && (
                <span className="ml-2">🎵 {story.audio_title}</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Pause indicator */}
          {isPaused && !showComments && (
            <div className="flex items-center gap-1 text-white/80 text-sm">
              <Pause className="w-4 h-4" />
              Pausado
            </div>
          )}
          
          {/* Mute button */}
          {story.audio_url && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
          )}
          
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="absolute inset-0 flex items-center justify-center p-8"
        style={{ backgroundColor: story.background_color || '#1a472a' }}
      >
        {story.image_url ? (
          <img
            src={story.image_url}
            alt=""
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        ) : (
          <p
            className="text-2xl font-serif text-center max-w-md"
            style={{ color: story.text_color || '#ffffff' }}
          >
            {story.content}
          </p>
        )}
      </div>

      {/* Bottom actions */}
      <div className="absolute bottom-8 left-4 right-4 flex items-center justify-center gap-6 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          className={`flex flex-col items-center gap-1 ${isLiked ? 'text-red-500' : 'text-white'}`}
        >
          <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-xs">{(story.likes_count || 0) + (isLiked ? 1 : 0)}</span>
        </button>
        
        <button
          onClick={(e) => { e.stopPropagation(); toggleComments(); }}
          className="flex flex-col items-center gap-1 text-white"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="text-xs">{story.comments_count || 0}</span>
        </button>
        
        <button
          onClick={(e) => { e.stopPropagation(); handleSave(); }}
          className={`flex flex-col items-center gap-1 ${isSaved ? 'text-primary' : 'text-white'}`}
        >
          <Bookmark className={`w-7 h-7 ${isSaved ? 'fill-current' : ''}`} />
          <span className="text-xs">Salvar</span>
        </button>
      </div>

      {/* Navigation areas */}
      <div
        className="absolute inset-y-0 left-0 w-1/4 z-10"
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
      >
        {currentIndex > 0 && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <ChevronLeft className="w-8 h-8 text-white/50" />
          </div>
        )}
      </div>
      
      <div
        className="absolute inset-y-0 right-0 w-1/4 z-10"
        onClick={(e) => { e.stopPropagation(); goNext(); }}
      >
        {currentIndex < stories.length - 1 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <ChevronRight className="w-8 h-8 text-white/50" />
          </div>
        )}
      </div>

      {/* Comments panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl max-h-[60vh] z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
              <h3 className="font-semibold text-center">Comentários</h3>
            </div>
            
            <div className="overflow-y-auto max-h-[40vh] p-4 space-y-3">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Seja o primeiro a comentar!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {comment.profile?.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{comment.profile?.full_name}</span>{' '}
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-border flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
              />
              <Button
                onClick={handleSendComment}
                size="icon"
                disabled={!newComment.trim() || isSending}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
