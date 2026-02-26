import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ─── Full Emoji Set ───
const EMOJI_CATEGORIES = [
  {
    name: "Fé",
    icon: "✝️",
    emojis: ["✝️","🙏","📖","⛪","🕊️","👑","🔥","💧","🍞","🍷","🌿","⭐","😇","🕯️","📿","🛐","☦️","✡️","🤲","🫶"],
  },
  {
    name: "Rostos",
    icon: "😊",
    emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","☹️","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"],
  },
  {
    name: "Mãos",
    icon: "👋",
    emojis: ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","💪","🦾"],
  },
  {
    name: "Amor",
    icon: "❤️",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","🫀","💐","🌹","🥀","🌺","🌸","🌷","🌻","💒","💍","💎"],
  },
  {
    name: "Natureza",
    icon: "🌿",
    emojis: ["🌍","🌎","🌏","🌐","🗺️","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🌅","🌄","🌠","🎇","🎆","🌇","🌆","🏙️","🌃","🌌","🌉","🌁","🌊","🌈","☀️","🌤️","⛅","🌥️","☁️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","☃️","⛄","🌬️","💨","🌪️","🌫️","🌈","☔","💧","💦","🌊"],
  },
  {
    name: "Música",
    icon: "🎵",
    emojis: ["🎵","🎶","🎼","🎤","🎧","🎸","🎹","🥁","🪘","🎺","🎷","🪗","🎻","🪕","🎶","🔔","🔕","📯","🎙️","📻","🔊","🔉","🔈","🔇","📢","📣"],
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

interface KlipyResult {
  id: string;
  title: string;
  preview_url: string;
  full_url: string;
}

interface ChatMediaPickerProps {
  userId: string;
  onSendSticker: (content: string, type: "sticker" | "text_sticker" | "gif") => void;
  onSendImage: (imageUrl: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ChatMediaPicker = ({ userId, onSendSticker, onSendImage, isOpen, onClose }: ChatMediaPickerProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(0);
  const [gifSearch, setGifSearch] = useState("");
  const [stickerSearch, setStickerSearch] = useState("");
  const [gifResults, setGifResults] = useState<KlipyResult[]>([]);
  const [stickerResults, setStickerResults] = useState<KlipyResult[]>([]);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);
  const [isLoadingStickers, setIsLoadingStickers] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchKlipy = useCallback(async (query: string, type: "gifs" | "stickers") => {
    const setLoading = type === "gifs" ? setIsLoadingGifs : setIsLoadingStickers;
    const setResults = type === "gifs" ? setGifResults : setStickerResults;
    
    setLoading(true);
    try {
      const action = query.trim() ? "search" : "trending";
      const params = new URLSearchParams({
        type,
        action,
        limit: "20",
        locale: "br",
      });
      if (query.trim()) params.set("q", query.trim());

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const session = (await supabase.auth.getSession()).data.session;
      
      const res = await fetch(
        `${supabaseUrl}/functions/v1/klipy-search?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token || anonKey}`,
            'apikey': anonKey,
          },
        }
      );

      const result = await res.json();
      setResults(result.results || []);
    } catch (err) {
      console.error("Klipy fetch error:", err);
      setResults([]);
    }
    setLoading(false);
  }, []);

  // Load trending on open
  useEffect(() => {
    if (isOpen) {
      fetchKlipy("", "gifs");
      fetchKlipy("", "stickers");
    }
  }, [isOpen, fetchKlipy]);

  const handleGifSearch = (value: string) => {
    setGifSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => fetchKlipy(value, "gifs"), 500);
  };

  const handleStickerSearch = (value: string) => {
    setStickerSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => fetchKlipy(value, "stickers"), 500);
  };

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
            {/* Top bar */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full gap-1.5 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
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

            <Tabs defaultValue="emojis" className="w-full">
              <TabsList className="w-full h-8 rounded-lg mb-2 grid grid-cols-4">
                <TabsTrigger value="emojis" className="text-xs rounded-md">😊</TabsTrigger>
                <TabsTrigger value="gifs" className="text-xs rounded-md">GIF</TabsTrigger>
                <TabsTrigger value="stickers" className="text-xs rounded-md">🎨</TabsTrigger>
                <TabsTrigger value="text" className="text-xs rounded-md">💬</TabsTrigger>
              </TabsList>

              {/* ── Emojis Tab ── */}
              <TabsContent value="emojis" className="mt-0">
                <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                  {EMOJI_CATEGORIES.map((cat, i) => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedEmojiCategory(i)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                        selectedEmojiCategory === i
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-8 gap-0.5 max-h-[200px] overflow-y-auto">
                  {EMOJI_CATEGORIES[selectedEmojiCategory].emojis.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      onClick={() => { onSendSticker(emoji, "sticker"); onClose(); }}
                      className="flex items-center justify-center p-1.5 rounded-lg hover:bg-muted/80 transition-colors active:scale-90"
                    >
                      <span className="text-2xl">{emoji}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>

              {/* ── GIFs Tab ── */}
              <TabsContent value="gifs" className="mt-0">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={gifSearch}
                    onChange={(e) => handleGifSearch(e.target.value)}
                    placeholder="Buscar GIFs..."
                    className="pl-8 h-8 text-xs rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-3 gap-1 max-h-[200px] overflow-y-auto">
                  {isLoadingGifs ? (
                    <div className="col-span-3 flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : gifResults.length === 0 ? (
                    <div className="col-span-3 text-center py-8 text-xs text-muted-foreground">
                      {gifSearch ? "Nenhum GIF encontrado" : "GIFs em destaque aparecerão aqui"}
                    </div>
                  ) : (
                    gifResults.map((gif) => (
                      <button
                        key={gif.id}
                        onClick={() => { onSendSticker(gif.full_url || gif.preview_url, "gif"); onClose(); }}
                        className="rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all aspect-square"
                      >
                        <img
                          src={gif.preview_url}
                          alt={gif.title || "GIF"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))
                  )}
                </div>
                <p className="text-[9px] text-muted-foreground text-center mt-1">Powered by KLIPY</p>
              </TabsContent>

              {/* ── Stickers Tab ── */}
              <TabsContent value="stickers" className="mt-0">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={stickerSearch}
                    onChange={(e) => handleStickerSearch(e.target.value)}
                    placeholder="Buscar figurinhas..."
                    className="pl-8 h-8 text-xs rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-4 gap-1.5 max-h-[200px] overflow-y-auto">
                  {isLoadingStickers ? (
                    <div className="col-span-4 flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : stickerResults.length === 0 ? (
                    <div className="col-span-4 text-center py-8 text-xs text-muted-foreground">
                      {stickerSearch ? "Nenhuma figurinha encontrada" : "Figurinhas em destaque"}
                    </div>
                  ) : (
                    stickerResults.map((sticker) => (
                      <button
                        key={sticker.id}
                        onClick={() => { onSendSticker(sticker.full_url || sticker.preview_url, "gif"); onClose(); }}
                        className="rounded-xl p-1 hover:bg-muted/80 transition-all"
                      >
                        <img
                          src={sticker.preview_url}
                          alt={sticker.title || "Sticker"}
                          className="w-full aspect-square object-contain"
                          loading="lazy"
                        />
                      </button>
                    ))
                  )}
                </div>
                <p className="text-[9px] text-muted-foreground text-center mt-1">Powered by KLIPY</p>
              </TabsContent>

              {/* ── Text Stickers Tab ── */}
              <TabsContent value="text" className="mt-0">
                <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
                  {TEXT_STICKERS.map((text) => (
                    <button
                      key={text}
                      onClick={() => { onSendSticker(text, "text_sticker"); onClose(); }}
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
