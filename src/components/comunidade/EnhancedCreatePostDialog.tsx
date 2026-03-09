import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Video, X, Loader2, BarChart3, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  // Poll state
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

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

    // Validate poll if active
    if (showPoll) {
      if (!pollQuestion.trim()) {
        toast({ title: 'Erro', description: 'Digite a pergunta da enquete.', variant: 'destructive' });
        return;
      }
      const validOptions = pollOptions.filter(o => o.trim());
      if (validOptions.length < 2) {
        toast({ title: 'Erro', description: 'Adicione pelo menos 2 opções.', variant: 'destructive' });
        return;
      }
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
        // Insert mentions
        if (mentions.length > 0 && insertedData) {
          await supabase.from('post_mentions').insert(
            mentions.map(mentionUserId => ({
              post_id: insertedData.id,
              mentioned_user_id: mentionUserId,
            }))
          );
        }

        // Insert poll if active
        if (showPoll && insertedData) {
          const validOptions = pollOptions.filter(o => o.trim());
          await supabase.from('community_polls').insert({
            post_id: insertedData.id,
            question: pollQuestion.trim(),
            options: validOptions,
          });
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
    setShowPoll(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  const removeMedia = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedVideo(null);
    setVideoPreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
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

          {/* Poll Creator */}
          <AnimatePresence>
            {showPoll && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Enquete</span>
                  </div>
                  <button onClick={() => setShowPoll(false)} className="p-1 rounded-full hover:bg-muted">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <Input
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Faça uma pergunta..."
                  className="rounded-lg text-sm"
                  maxLength={200}
                />

                <div className="space-y-2">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`Opção ${index + 1}`}
                        className="rounded-lg text-sm flex-1"
                        maxLength={100}
                      />
                      {pollOptions.length > 2 && (
                        <button onClick={() => removePollOption(index)} className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptions.length < 6 && (
                  <Button variant="ghost" size="sm" onClick={addPollOption} className="w-full gap-1 text-primary hover:text-primary">
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar opção
                  </Button>
                )}
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

            <Button
              type="button"
              variant={showPoll ? "default" : "outline"}
              onClick={() => setShowPoll(!showPoll)}
              className="gap-2 rounded-xl"
              disabled={isUploading}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            📷 Fotos até 5MB • 🎬 Vídeos até 100MB • 📊 Enquetes
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
