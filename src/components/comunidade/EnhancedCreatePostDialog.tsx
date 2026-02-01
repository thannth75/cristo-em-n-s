import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Video, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MentionInput } from './MentionInput';
import { communityPostSchema, validateInput } from '@/lib/validation';

interface EnhancedCreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
  onXpAward: (type: string, id: string, description: string) => void;
}

export const EnhancedCreatePostDialog = ({
  open,
  onOpenChange,
  userId,
  onSuccess,
  onXpAward,
}: EnhancedCreatePostDialogProps) => {
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Imagem muito grande', description: 'Máximo 5MB.', variant: 'destructive' });
        return;
      }
      setSelectedVideo(null);
      setVideoPreview(null);
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVideoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast({ title: 'Vídeo muito grande', description: 'Máximo 100MB.', variant: 'destructive' });
        return;
      }
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, type: 'image' | 'video'): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${type}-${Date.now()}.${fileExt}`;
    const filePath = `${type}s/${userId}/${fileName}`;

    const { error } = await supabase.storage.from('posts').upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleCreatePost = async () => {
    const cleanContent = content.replace(/@\[[^\]]+\]\([^)]+\)/g, (match) => {
      const nameMatch = match.match(/@\[([^\]]+)\]/);
      return nameMatch ? `@${nameMatch[1]}` : match;
    });

    const validation = validateInput(communityPostSchema, { content: cleanContent });
    if (!validation.success) {
      toast({ title: 'Erro de validação', description: validation.error, variant: 'destructive' });
      return;
    }

    setIsUploading(true);

    let imageUrl: string | null = null;
    let videoUrl: string | null = null;

    try {
      if (selectedImage) {
        imageUrl = await uploadFile(selectedImage, 'image');
        if (!imageUrl) {
          toast({ title: 'Erro no upload', description: 'Não foi possível enviar a imagem.', variant: 'destructive' });
          setIsUploading(false);
          return;
        }
      }

      if (selectedVideo) {
        videoUrl = await uploadFile(selectedVideo, 'video');
        if (!videoUrl) {
          toast({ title: 'Erro no upload', description: 'Não foi possível enviar o vídeo.', variant: 'destructive' });
          setIsUploading(false);
          return;
        }
      }

      const { data: insertedData, error } = await supabase.from('community_posts').insert({
        user_id: userId,
        content: cleanContent,
        image_url: imageUrl,
        video_url: videoUrl,
      }).select().single();

      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível criar o post.', variant: 'destructive' });
      } else {
        if (mentions.length > 0 && insertedData) {
          await supabase.from('post_mentions').insert(
            mentions.map(mentionUserId => ({
              post_id: insertedData.id,
              mentioned_user_id: mentionUserId,
            }))
          );
        }

        onXpAward('community_post', insertedData.id, 'Post na comunidade');
        toast({ title: 'Post criado! 🎉' });
        resetForm();
        onOpenChange(false);
        onSuccess();
      }
    } catch (err) {
      console.error('Error:', err);
      toast({ title: 'Erro ao criar post', variant: 'destructive' });
    }

    setIsUploading(false);
  };

  const resetForm = () => {
    setContent('');
    setMentions([]);
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedVideo(null);
    setVideoPreview(null);
  };

  const removeMedia = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedVideo(null);
    setVideoPreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Novo Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <MentionInput
            value={content}
            onChange={(value, newMentions) => {
              setContent(value);
              setMentions(newMentions);
            }}
            placeholder="O que você quer compartilhar? Versículos, testemunhos, pregações..."
          />
          
          <AnimatePresence>
            {(imagePreview || videoPreview) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative rounded-xl overflow-hidden"
              >
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover rounded-xl" />
                )}
                {videoPreview && (
                  <video src={videoPreview} className="w-full max-h-48 object-cover rounded-xl" controls />
                )}
                <button
                  onClick={removeMedia}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex gap-2">
            <input 
              ref={imageInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleImageSelect} 
              className="hidden" 
            />
            <input 
              ref={videoInputRef} 
              type="file" 
              accept="video/*" 
              onChange={handleVideoSelect} 
              className="hidden" 
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => imageInputRef.current?.click()}
              className="flex-1 gap-2 rounded-xl"
              disabled={isUploading || !!selectedVideo}
            >
              <Image className="h-4 w-4" />
              Foto
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => videoInputRef.current?.click()}
              className="flex-1 gap-2 rounded-xl"
              disabled={isUploading || !!selectedImage}
            >
              <Video className="h-4 w-4" />
              Vídeo
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            📷 Fotos até 5MB • 🎬 Vídeos até 100MB
          </p>
          
          <Button
            onClick={handleCreatePost}
            className="w-full rounded-xl"
            disabled={isUploading || !content.trim()}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
