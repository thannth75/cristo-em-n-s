import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Story {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  background_color: string;
  text_color: string;
  created_at: string;
  views_count: number;
  profile?: { full_name: string; avatar_url: string | null };
}

interface StoryCircleProps {
  story?: Story;
  isOwn?: boolean;
  hasStory?: boolean;
  onAdd?: () => void;
  onClick?: () => void;
  userName?: string;
}

export const StoryCircle = ({
  story,
  isOwn = false,
  hasStory = false,
  onAdd,
  onClick,
  userName,
}: StoryCircleProps) => {
  const displayName = story?.profile?.full_name || userName || 'Você';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <button
      onClick={isOwn && !hasStory ? onAdd : onClick}
      className="flex flex-col items-center gap-1 min-w-[70px]"
    >
      <div
        className={cn(
          'relative w-16 h-16 rounded-full flex items-center justify-center',
          hasStory
            ? 'bg-gradient-to-tr from-primary via-primary/80 to-primary/60 p-[2px]'
            : 'bg-muted'
        )}
      >
        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
          {story?.image_url ? (
            <img
              src={story.image_url}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold text-primary">{initial}</span>
          )}
        </div>
        {isOwn && !hasStory && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
            <Plus className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground truncate max-w-[70px]">
        {isOwn ? 'Seu status' : displayName.split(' ')[0]}
      </span>
    </button>
  );
};

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onMarkViewed: (storyId: string) => void;
}

export const StoryViewer = ({
  stories,
  initialIndex,
  onClose,
  onMarkViewed,
}: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const story = stories[currentIndex];

  const goNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      onMarkViewed(stories[currentIndex + 1].id);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!story) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
        onClick={goNext}
      >
        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {stories.map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
            >
              <motion.div
                className="h-full bg-white"
                initial={{ width: idx < currentIndex ? '100%' : '0%' }}
                animate={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? '100%' : '0%',
                }}
                transition={{
                  duration: idx === currentIndex ? 5 : 0,
                  ease: 'linear',
                }}
                onAnimationComplete={() => {
                  if (idx === currentIndex) goNext();
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-10 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-semibold">
                {story.profile?.full_name?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <p className="text-white font-semibold">
                {story.profile?.full_name || 'Usuário'}
              </p>
              <p className="text-white/60 text-xs flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {story.views_count}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div
          className="absolute inset-0 flex items-center justify-center p-8"
          style={{
            backgroundColor: story.background_color || '#1a472a',
          }}
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

        {/* Navigation */}
        <div className="absolute inset-y-0 left-0 w-1/3" onClick={(e) => { e.stopPropagation(); goPrev(); }}>
          {currentIndex > 0 && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <ChevronLeft className="w-8 h-8 text-white/50" />
            </div>
          )}
        </div>
        <div className="absolute inset-y-0 right-0 w-1/3" onClick={(e) => { e.stopPropagation(); goNext(); }}>
          {currentIndex < stories.length - 1 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <ChevronRight className="w-8 h-8 text-white/50" />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
