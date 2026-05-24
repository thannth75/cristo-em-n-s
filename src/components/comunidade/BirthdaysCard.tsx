import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Gift, PartyPopper, Send, Sparkles, Trash2, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useBirthdays, type BirthdayProfile } from "@/hooks/useBirthdays";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const BIRTHDAY_VERSES = [
  { text: "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti.", ref: "Números 6:24-25" },
  { text: "Ensina-nos a contar os nossos dias, para que alcancemos coração sábio.", ref: "Salmos 90:12" },
  { text: "Porque eu bem sei os planos que tenho para vós, diz o Senhor; planos de paz, e não de mal, para vos dar um futuro e uma esperança.", ref: "Jeremias 29:11" },
  { text: "Este é o dia que fez o Senhor; regozijemo-nos e alegremo-nos nele.", ref: "Salmos 118:24" },
  { text: "O Senhor é a minha luz e a minha salvação; a quem temerei?", ref: "Salmos 27:1" },
  { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
  { text: "Lança o teu cuidado sobre o Senhor, e ele te susterá.", ref: "Salmos 55:22" },
  { text: "Os que esperam no Senhor renovarão as suas forças, subirão com asas como águias.", ref: "Isaías 40:31" },
];

const verseFor = (userId: string) => {
  // Stable verse per user
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  return BIRTHDAY_VERSES[Math.abs(hash) % BIRTHDAY_VERSES.length];
};

interface MessageRow {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string | null;
}

interface BirthdayDetailDialogProps {
  person: BirthdayProfile | null;
  onClose: () => void;
}

const BirthdayDetailDialog = ({ person, onClose }: BirthdayDetailDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const year = new Date().getFullYear();

  const loadMessages = async (recipientId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("birthday_messages")
      .select("id, sender_id, message, created_at")
      .eq("recipient_id", recipientId)
      .eq("birthday_year", year)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const ids = Array.from(new Set(data.map((m) => m.sender_id)));
      const { data: profs } = await supabase
        .from("public_profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", ids);
      const map = new Map((profs || []).map((p: any) => [p.user_id, p]));
      setMessages(
        data.map((m) => ({
          ...m,
          sender_name: map.get(m.sender_id)?.full_name || "Membro",
          sender_avatar: map.get(m.sender_id)?.avatar_url ?? null,
        })),
      );
    } else {
      setMessages([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (person) loadMessages(person.user_id);
  }, [person?.user_id]);

  const send = async () => {
    if (!person || !user || !draft.trim()) return;
    setSending(true);
    const { error } = await supabase.from("birthday_messages").insert({
      recipient_id: person.user_id,
      sender_id: user.id,
      message: draft.trim(),
      birthday_year: year,
    });
    setSending(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setDraft("");
    toast({ title: "Mensagem enviada! 🎉", description: "Que Deus abençoe!" });
    loadMessages(person.user_id);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("birthday_messages").delete().eq("id", id);
    if (!error) setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  if (!person) return null;
  const verse = verseFor(person.user_id);
  const today = new Date().getDate();
  const isToday = person.day === today;

  return (
    <Dialog open={!!person} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 p-6">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {isToday &&
              Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  initial={{ y: -20, x: Math.random() * 300, opacity: 0 }}
                  animate={{ y: 200, opacity: [0, 1, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                >
                  {["🎉", "🎂", "✨", "🎈"][i % 4]}
                </motion.div>
              ))}
          </div>
          <DialogHeader className="relative">
            <div className="flex flex-col items-center gap-3">
              <Link to={`/perfil/${person.user_id}`} onClick={onClose}>
                <Avatar className="h-20 w-20 ring-4 ring-primary/40">
                  <AvatarImage src={person.avatar_url || ""} />
                  <AvatarFallback className="text-2xl">{person.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
              <DialogTitle className="text-center text-xl">
                {isToday ? "🎂 Feliz Aniversário!" : `Aniversário dia ${person.day}`}
              </DialogTitle>
              <DialogDescription className="text-center">
                <Link to={`/perfil/${person.user_id}`} onClick={onClose} className="font-semibold text-foreground hover:underline">
                  {person.full_name}
                </Link>
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pt-4 pb-2">
          <div className="rounded-xl bg-accent/30 p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">Versículo para o dia</span>
            </div>
            <p className="font-serif italic text-sm leading-relaxed">"{verse.text}"</p>
            <p className="mt-2 text-right text-xs font-semibold text-primary">— {verse.ref}</p>
          </div>
        </div>

        {user && user.id !== person.user_id && (
          <div className="px-6 py-3 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Envie uma mensagem de parabéns
            </p>
            <div className="flex gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 500))}
                placeholder="Que Deus continue te abençoando..."
                rows={2}
                className="resize-none text-sm"
              />
              <Button size="icon" onClick={send} disabled={sending || !draft.trim()} className="shrink-0 self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="px-6 pb-5">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Mensagens ({messages.length})
          </p>
          <ScrollArea className="max-h-56">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-3">Carregando...</p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                Seja o primeiro a desejar parabéns! 🎉
              </p>
            ) : (
              <div className="space-y-2">
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 rounded-lg bg-muted/40 p-2"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={m.sender_avatar || ""} />
                      <AvatarFallback className="text-[10px]">{m.sender_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{m.sender_name}</p>
                      <p className="text-sm break-words">{m.message}</p>
                    </div>
                    {(user?.id === m.sender_id || user?.id === person.user_id) && (
                      <button
                        onClick={() => remove(m.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const BirthdaysCard = () => {
  const { birthdays, isLoading, getTodaysBirthdays, getUpcomingBirthdays } = useBirthdays();
  const [selected, setSelected] = useState<BirthdayProfile | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const todays = getTodaysBirthdays();
  const upcoming = getUpcomingBirthdays();
  const currentMonth = new Date().toLocaleString("pt-BR", { month: "long" });

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card p-4 shadow-md">
        <div className="h-5 w-32 bg-muted animate-pulse rounded mb-3" />
        <div className="space-y-2">
          <div className="h-12 bg-muted/60 animate-pulse rounded" />
          <div className="h-12 bg-muted/60 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card p-4 shadow-md"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Cake className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground capitalize">
              Aniversariantes de {currentMonth}
            </h3>
          </div>
          {birthdays.length > 0 && (
            <Link
              to="/aniversariantes"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver todos ({birthdays.length})
            </Link>
          )}
        </div>

        {birthdays.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum aniversariante este mês
          </p>
        )}

        {todays.length > 0 && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="mb-4 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 p-3 border border-primary/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <PartyPopper className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Hoje!</span>
            </div>
            <div className="space-y-2">
              {todays.map((person) => (
                <button
                  key={person.user_id}
                  onClick={() => setSelected(person)}
                  className="flex items-center gap-3 w-full text-left rounded-lg hover:bg-primary/10 p-1 transition"
                >
                  <Avatar className="h-10 w-10 ring-2 ring-primary/50">
                    <AvatarImage src={person.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {person.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{person.full_name}</p>
                    <p className="text-xs text-primary">🎂 Desejar parabéns</p>
                  </div>
                  <Gift className="h-5 w-5 text-primary animate-bounce" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {upcoming.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium mb-2">Próximos</p>
            {upcoming.map((person) => (
              <button
                key={person.user_id}
                onClick={() => setSelected(person)}
                className="flex items-center gap-3 w-full py-1 px-1 rounded-lg hover:bg-muted/60 transition"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={person.avatar_url || ""} />
                  <AvatarFallback className="text-xs">{person.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{person.full_name}</p>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  Dia {person.day}
                </span>
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Full month list dialog */}
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize flex items-center gap-2">
              <Cake className="h-5 w-5 text-primary" />
              Aniversariantes de {currentMonth}
            </DialogTitle>
            <DialogDescription>
              Toque em alguém para enviar uma mensagem ou ver o perfil.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-1 pr-2">
              <AnimatePresence>
                {birthdays.map((person) => {
                  const today = new Date().getDate();
                  const isToday = person.day === today;
                  return (
                    <motion.button
                      key={person.user_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => {
                        setListOpen(false);
                        setSelected(person);
                      }}
                      className={`flex items-center gap-3 w-full p-2 rounded-lg transition ${
                        isToday ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/60"
                      }`}
                    >
                      <Avatar className={`h-10 w-10 ${isToday ? "ring-2 ring-primary" : ""}`}>
                        <AvatarImage src={person.avatar_url || ""} />
                        <AvatarFallback>{person.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold truncate">{person.full_name}</p>
                        {isToday && <p className="text-xs text-primary">🎂 Hoje!</p>}
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        Dia {person.day}
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <BirthdayDetailDialog person={selected} onClose={() => setSelected(null)} />
    </>
  );
};

export default BirthdaysCard;
