import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Type, Loader2, X, Music, UserPlus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface UserProfile {
  user_id: string;
  full_name: string;
}

interface EnhancedCreateStoryDialogProps {
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
  '#f39c12', // Gold
  '#27ae60', // Emerald
];

// Example worship songs (in real app, this could come from an API or database)
const WORSHIP_SONGS = [
  { id: '1', title: 'Quão Grande é o Meu Deus', artist: 'Soraya Moraes' },
  { id: '2', title: 'Ele Continua Sendo Bom', artist: 'Israel Houghton' },
  { id: '3', title: 'Digno de Glória', artist: 'Aline Barros' },
  { id: '4', title: 'Tua Graça Me Basta', artist: 'Toque no Altar' },
  { id: '5', title: 'Santo Espírito', artist: 'Laura Souguellis' },
  { id: '6', title: 'Ninguém Explica Deus', artist: 'Preto no Branco' },
  { id: '7', title: 'Vou Além', artist: 'Ministério Zoe' },
  { id: '8', title: 'Grande Eu Sou', artist: 'Davi Sacer' },
];

export const EnhancedCreateStoryDialog = ({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: EnhancedCreateStoryDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [content, setContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#1a472a');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // New features
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<typeof WORSHIP_SONGS[0] | null>(null);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [searchUser, setSearchUser] = useState('');

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .eq('is_approved', true)
      .neq('user_id', userId);
    setAvailableUsers(data || []);
  };

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
        audio_title: selectedMusic?.title || null,
        tagged_users: taggedUsers.length > 0 ? taggedUsers : null,
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
    setSelectedMusic(null);
    setTaggedUsers([]);
  };

  const toggleUserTag = (userId: string) => {
    setTaggedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = availableUsers.filter(u => 
    u.full_name.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
              
              {/* Tagged users indicator */}
              {taggedUsers.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-black/50 rounded-full px-3 py-1 text-white text-xs">
                  👥 {taggedUsers.length} marcado{taggedUsers.length > 1 ? 's' : ''}
                </div>
              )}
              
              {/* Music indicator */}
              {selectedMusic && (
                <div className="absolute bottom-4 right-4 bg-black/50 rounded-full px-3 py-1 text-white text-xs flex items-center gap-1">
                  <Music className="w-3 h-3" />
                  {selectedMusic.title}
                </div>
              )}
            </motion.div>

            {/* Color picker (only for text mode) */}
            {mode === 'text' && (
              <div className="flex gap-2 justify-center flex-wrap">
                {BACKGROUND_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBackgroundColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      backgroundColor === color ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}

            {/* Additional options */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMusicPicker(true)}
                className="flex-1"
              >
                <Music className="w-4 h-4 mr-2" />
                {selectedMusic ? 'Trocar Louvor' : 'Adicionar Louvor'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { fetchUsers(); setShowTagPicker(true); }}
                className="flex-1"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Marcar ({taggedUsers.length})
              </Button>
            </div>

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

      {/* Music Picker Sheet */}
      <Sheet open={showMusicPicker} onOpenChange={setShowMusicPicker}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-serif">Escolher Louvor</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2 overflow-y-auto max-h-[45vh]">
            {WORSHIP_SONGS.map((song) => (
              <button
                key={song.id}
                onClick={() => { setSelectedMusic(song); setShowMusicPicker(false); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                  selectedMusic?.id === song.id ? 'bg-primary/10 border border-primary' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{song.title}</p>
                    <p className="text-xs text-muted-foreground">{song.artist}</p>
                  </div>
                </div>
                {selectedMusic?.id === song.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>
          {selectedMusic && (
            <Button
              variant="ghost"
              onClick={() => setSelectedMusic(null)}
              className="w-full mt-4"
            >
              Remover Louvor
            </Button>
          )}
        </SheetContent>
      </Sheet>

      {/* Tag Users Sheet */}
      <Sheet open={showTagPicker} onOpenChange={setShowTagPicker}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-serif">Marcar Pessoas</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <Input
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="Buscar pessoa..."
              className="mb-4"
            />
            <div className="space-y-2 overflow-y-auto max-h-[35vh]">
              {filteredUsers.map((user) => (
                <button
                  key={user.user_id}
                  onClick={() => toggleUserTag(user.user_id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    taggedUsers.includes(user.user_id) ? 'bg-primary/10 border border-primary' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary">
                        {user.full_name.charAt(0)}
                      </span>
                    </div>
                    <p className="font-medium text-sm">{user.full_name}</p>
                  </div>
                  {taggedUsers.includes(user.user_id) && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
