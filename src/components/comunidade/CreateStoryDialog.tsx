import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image, Type, Loader2, X } from 'lucide-react';
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

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

const BACKGROUND_COLORS = [
  '#1a472a', // Green (brand)
  '#2c3e50', // Dark blue
  '#8e44ad', // Purple
  '#c0392b', // Red
  '#16a085', // Teal
  '#2980b9', // Blue
  '#d35400', // Orange
  '#1a1a2e', // Dark
];

export const CreateStoryDialog = ({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: CreateStoryDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [content, setContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#1a472a');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Imagem muito grande',
          description: 'O tamanho máximo é 10MB.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setMode('image');
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-story-${Date.now()}.${fileExt}`;
    const filePath = `stories/${userId}/${fileName}`;

    const { error } = await supabase.storage.from('posts').upload(filePath, file);
    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleCreate = async () => {
    if (mode === 'text' && !content.trim()) {
      toast({ title: 'Escreva algo para seu status', variant: 'destructive' });
      return;
    }

    if (mode === 'image' && !selectedImage) {
      toast({ title: 'Selecione uma imagem', variant: 'destructive' });
      return;
    }

    setIsUploading(true);

    try {
      let imageUrl: string | null = null;

      if (mode === 'image' && selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          toast({ title: 'Erro ao enviar imagem', variant: 'destructive' });
          setIsUploading(false);
          return;
        }
      }

      // Calculate expiry (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error } = await supabase.from('user_stories').insert({
        user_id: userId,
        content: mode === 'text' ? content.trim() : null,
        image_url: imageUrl,
        background_color: backgroundColor,
        text_color: '#ffffff',
        expires_at: expiresAt.toISOString(),
      });

      if (error) {
        console.error('Error creating story:', error);
        toast({ title: 'Erro ao criar status', variant: 'destructive' });
      } else {
        toast({ title: 'Status criado! 🎉' });
        onSuccess();
        onOpenChange(false);
        resetForm();
      }
    } catch (err) {
      console.error('Error:', err);
      toast({ title: 'Erro ao criar status', variant: 'destructive' });
    }

    setIsUploading(false);
  };

  const resetForm = () => {
    setContent('');
    setSelectedImage(null);
    setImagePreview(null);
    setMode('text');
    setBackgroundColor('#1a472a');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Criar Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('text')}
              className="flex-1"
            >
              <Type className="w-4 h-4 mr-2" />
              Texto
            </Button>
            <Button
              variant={mode === 'image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Image className="w-4 h-4 mr-2" />
              Imagem
            </Button>
          </div>

          {/* Preview area */}
          <motion.div
            className="relative aspect-[9/16] rounded-xl overflow-hidden flex items-center justify-center"
            style={{ backgroundColor }}
          >
            {mode === 'image' && imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    setMode('text');
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva uma palavra, versículo ou mensagem..."
                className="absolute inset-0 bg-transparent border-0 resize-none text-xl font-serif text-white text-center flex items-center justify-center p-8 placeholder:text-white/50 focus-visible:ring-0"
                style={{ color: '#ffffff' }}
                maxLength={280}
              />
            )}
          </motion.div>

          {/* Color picker (only for text mode) */}
          {mode === 'text' && (
            <div className="flex gap-2 justify-center">
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setBackgroundColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    backgroundColor === color ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          {/* Submit */}
          <Button
            onClick={handleCreate}
            disabled={isUploading || (mode === 'text' && !content.trim())}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar Status'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
