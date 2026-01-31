import { useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat2, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RepostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalPost: {
    id: string;
    content: string;
    user_name: string;
  };
  userId: string;
  onSuccess: () => void;
}

export const RepostDialog = ({
  open,
  onOpenChange,
  originalPost,
  userId,
  onSuccess,
}: RepostDialogProps) => {
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [isReposting, setIsReposting] = useState(false);

  const handleRepost = async () => {
    setIsReposting(true);

    const { error } = await supabase.from('post_reposts').insert({
      original_post_id: originalPost.id,
      user_id: userId,
      comment: comment.trim() || null,
    });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Você já repostou isso', variant: 'destructive' });
      } else {
        console.error('Error reposting:', error);
        toast({ title: 'Erro ao repostar', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Repostado! 🔄' });
      onSuccess();
      onOpenChange(false);
      setComment('');
    }

    setIsReposting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Repeat2 className="w-5 h-5" />
            Repostar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original post preview */}
          <div className="bg-muted rounded-xl p-3 border-l-4 border-primary">
            <p className="text-xs text-muted-foreground mb-1">
              Post de {originalPost.user_name}
            </p>
            <p className="text-sm line-clamp-3">{originalPost.content}</p>
          </div>

          {/* Add comment */}
          <div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Adicione um comentário (opcional)..."
              className="resize-none"
              maxLength={280}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {comment.length}/280
            </p>
          </div>

          <Button
            onClick={handleRepost}
            disabled={isReposting}
            className="w-full"
          >
            {isReposting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Repostando...
              </>
            ) : (
              <>
                <Repeat2 className="w-4 h-4 mr-2" />
                Repostar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface RepostButtonProps {
  postId: string;
  postContent: string;
  postUserName: string;
  repostsCount: number;
  userId: string;
  hasReposted?: boolean;
  onRepostSuccess: () => void;
}

export const RepostButton = ({
  postId,
  postContent,
  postUserName,
  repostsCount,
  userId,
  hasReposted = false,
  onRepostSuccess,
}: RepostButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!hasReposted) setDialogOpen(true);
        }}
        disabled={hasReposted}
        className={`flex items-center justify-center gap-1.5 w-full h-full transition-colors ${
          hasReposted
            ? 'text-primary cursor-default'
            : 'text-muted-foreground hover:text-primary'
        }`}
      >
        <Repeat2 className="h-5 w-5 shrink-0" />
        <span className="text-sm font-medium">Repostar</span>
      </button>

      <RepostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        originalPost={{
          id: postId,
          content: postContent,
          user_name: postUserName,
        }}
        userId={userId}
        onSuccess={onRepostSuccess}
      />
    </>
  );
};
