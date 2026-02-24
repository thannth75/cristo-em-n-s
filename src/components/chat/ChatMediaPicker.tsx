import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Image, X, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ─── Curated Christian Stickers (emoji-based) ───
const STICKER_CATEGORIES = [
  {
    name: "Fé",
    icon: "✝️",
    stickers: [
      { emoji: "✝️", label: "Cruz" },
      { emoji: "🙏", label: "Oração" },
      { emoji: "📖", label: "Bíblia" },
      { emoji: "⛪", label: "Igreja" },
      { emoji: "🕊️", label: "Pomba" },
      { emoji: "👑", label: "Coroa" },
      { emoji: "🔥", label: "Fogo" },
      { emoji: "💧", label: "Batismo" },
      { emoji: "🍞", label: "Pão" },
      { emoji: "🍷", label: "Cálice" },
      { emoji: "🌿", label: "Ramo" },
      { emoji: "⭐", label: "Estrela" },
    ],
  },
  {
    name: "Amor",
    icon: "❤️",
    stickers: [
      { emoji: "❤️", label: "Amor" },
      { emoji: "💕", label: "Corações" },
      { emoji: "🤗", label: "Abraço" },
      { emoji: "😇", label: "Anjo" },
      { emoji: "🥰", label: "Carinho" },
      { emoji: "💝", label: "Presente" },
      { emoji: "🫂", label: "Acolhimento" },
      { emoji: "💖", label: "Coração brilhante" },
      { emoji: "🌹", label: "Rosa" },
      { emoji: "🌻", label: "Girassol" },
      { emoji: "🌈", label: "Aliança" },
      { emoji: "☀️", label: "Luz" },
    ],
  },
  {
    name: "Louvor",
    icon: "🎵",
    stickers: [
      { emoji: "🎵", label: "Música" },
      { emoji: "🎶", label: "Notas" },
      { emoji: "🙌", label: "Mãos ao alto" },
      { emoji: "👏", label: "Palmas" },
      { emoji: "🎸", label: "Violão" },
      { emoji: "🎤", label: "Microfone" },
      { emoji: "💃", label: "Dança" },
      { emoji: "🎼", label: "Partitura" },
      { emoji: "🥁", label: "Tambor" },
      { emoji: "🎹", label: "Teclado" },
      { emoji: "📯", label: "Trombeta" },
      { emoji: "🪘", label: "Pandeiro" },
    ],
  },
  {
    name: "Bênção",
    icon: "🌟",
    stickers: [
      { emoji: "🌟", label: "Brilho" },
      { emoji: "✨", label: "Bênção" },
      { emoji: "🙏🏽", label: "Oração" },
      { emoji: "💫", label: "Glória" },
      { emoji: "🕯️", label: "Vela" },
      { emoji: "🌅", label: "Amanhecer" },
      { emoji: "🌄", label: "Montanha" },
      { emoji: "🌊", label: "Mar" },
      { emoji: "🌸", label: "Flor" },
      { emoji: "🦋", label: "Borboleta" },
      { emoji: "🌾", label: "Trigo" },
      { emoji: "🫒", label: "Oliveira" },
    ],
  },
];

// ─── Quick Christian text stickers ───
const TEXT_STICKERS = [
  "Deus te abençoe! 🙏✨",
  "Jesus te ama! ❤️✝️",
  "Paz do Senhor! 🕊️",
  "Amém! 🙌",
  "Glória a Deus! 🔥",
  "Deus é fiel! ⭐",
  "Tudo posso naquele que me fortalece! 💪✝️",
  "O Senhor é meu pastor! 🌿",
  "Bom dia com Deus! ☀️🙏",
  "Boa noite com Deus! 🌙✨",
  "Graça e paz! 🕊️💕",
  "Ore por mim! 🙏❤️",
  "Deus no controle! 👑",
  "Aleluia! 🎵🙌",
  "Confie no Senhor! 💫📖",
  "Obrigado Deus! 🙏🌟",
];

interface ChatMediaPickerProps {
  userId: string;
  onSendSticker: (content: string, type: "sticker" | "text_sticker") => void;
  onSendImage: (imageUrl: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ChatMediaPicker = ({ userId, onSendSticker, onSendImage, isOpen, onClose }: ChatMediaPickerProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Apenas imagens são permitidas", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande (máx 5MB)", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("chat-media")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) {
      toast({ title: "Erro ao enviar imagem", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(data.path);
    onSendImage(urlData.publicUrl);
    setIsUploading(false);
    onClose();

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 20, height: 0 }}
          className="border-t border-border bg-card overflow-hidden"
        >
          <div className="p-2">
            {/* Close & Photo buttons */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  Foto
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <Tabs defaultValue="stickers" className="w-full">
              <TabsList className="w-full h-8 rounded-lg mb-2">
                <TabsTrigger value="stickers" className="text-xs flex-1 rounded-md">😊 Figurinhas</TabsTrigger>
                <TabsTrigger value="text" className="text-xs flex-1 rounded-md">💬 Mensagens</TabsTrigger>
              </TabsList>

              <TabsContent value="stickers" className="mt-0">
                {/* Category tabs */}
                <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                  {STICKER_CATEGORIES.map((cat, i) => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(i)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                        selectedCategory === i
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>

                {/* Sticker grid */}
                <div className="grid grid-cols-6 gap-1 max-h-[200px] overflow-y-auto">
                  {STICKER_CATEGORIES[selectedCategory].stickers.map((sticker) => (
                    <button
                      key={sticker.label}
                      onClick={() => {
                        onSendSticker(sticker.emoji, "sticker");
                        onClose();
                      }}
                      className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-muted/80 transition-colors active:scale-90"
                      title={sticker.label}
                    >
                      <span className="text-3xl">{sticker.emoji}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="text" className="mt-0">
                <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
                  {TEXT_STICKERS.map((text) => (
                    <button
                      key={text}
                      onClick={() => {
                        onSendSticker(text, "text_sticker");
                        onClose();
                      }}
                      className="text-left text-xs px-3 py-2.5 rounded-xl bg-muted hover:bg-primary/10 transition-colors leading-tight"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatMediaPicker;
