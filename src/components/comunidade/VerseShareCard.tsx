import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SHAREABLE_VERSES = [
  { verse: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.", ref: "João 3:16" },
  { verse: "O Senhor é o meu pastor; nada me faltará.", ref: "Salmos 23:1" },
  { verse: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
  { verse: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", ref: "Salmos 37:5" },
  { verse: "Sede fortes e corajosos. Não temais, pois o Senhor estará convosco.", ref: "Josué 1:9" },
  { verse: "Mas os que esperam no Senhor renovarão as suas forças.", ref: "Isaías 40:31" },
  { verse: "Eu sou o caminho, a verdade e a vida.", ref: "João 14:6" },
  { verse: "E conhecereis a verdade, e a verdade vos libertará.", ref: "João 8:32" },
  { verse: "Buscai primeiro o Reino de Deus e a sua justiça.", ref: "Mateus 6:33" },
  { verse: "Não andeis ansiosos por coisa alguma.", ref: "Filipenses 4:6" },
];

interface VerseShareCardProps {
  onShareToPost?: (text: string) => void;
}

export default function VerseShareCard({ onShareToPost }: VerseShareCardProps) {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const todayVerse = SHAREABLE_VERSES[new Date().getDate() % SHAREABLE_VERSES.length];

  const copyVerse = (verse: string, ref: string, index: number) => {
    const text = `"${verse}" — ${ref}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({ title: "Versículo copiado! ✝️" });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const shareVerse = (verse: string, ref: string) => {
    const text = `✝️ "${verse}"\n— ${ref}\n\n🙏 Vida em Cristo`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else if (onShareToPost) {
      onShareToPost(text);
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Versículo copiado para compartilhar!" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/5 via-card to-accent/5 rounded-none sm:rounded-2xl border-y sm:border border-border overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Versículo do Dia</h3>
            <p className="text-[10px] text-muted-foreground">Compartilhe a Palavra</p>
          </div>
        </div>

        <blockquote className="relative pl-4 border-l-2 border-primary/30 mb-3">
          <p className="text-sm italic text-foreground/90 leading-relaxed">"{todayVerse.verse}"</p>
          <footer className="mt-1 text-xs font-medium text-primary">{todayVerse.ref}</footer>
        </blockquote>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-full text-xs gap-1.5 flex-1"
            onClick={() => copyVerse(todayVerse.verse, todayVerse.ref, -1)}>
            {copiedIndex === -1 ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copiar
          </Button>
          <Button size="sm" className="rounded-full text-xs gap-1.5 flex-1"
            onClick={() => shareVerse(todayVerse.verse, todayVerse.ref)}>
            <Share2 className="h-3.5 w-3.5" /> Compartilhar
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
