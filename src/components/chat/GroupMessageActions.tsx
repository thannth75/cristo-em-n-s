import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Edit2, Trash2, SmilePlus, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const QUICK_REACTIONS = ["❤️", "🙏", "😂", "😮", "👍", "🔥"];

interface GroupMessageActionsProps {
  messageId: string;
  content: string;
  isOwn: boolean;
  isDeleted?: boolean;
  reactions: { reaction: string; user_id: string }[];
  userId: string;
  onMessageEdited: (id: string, newContent: string) => void;
  onMessageDeleted: (id: string) => void;
  onReactionToggled: (messageId: string, reaction: string, added: boolean) => void;
}

export function GroupMessageActions({
  messageId, content, isOwn, isDeleted, reactions, userId,
  onMessageEdited, onMessageDeleted, onReactionToggled,
}: GroupMessageActionsProps) {
  const { toast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === content) { setIsEditing(false); return; }
    const { error } = await supabase
      .from("group_messages")
      .update({ content: editContent, edited_at: new Date().toISOString() })
      .eq("id", messageId);
    if (error) toast({ title: "Erro ao editar", variant: "destructive" });
    else onMessageEdited(messageId, editContent);
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("group_messages")
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), content: "Mensagem apagada" })
      .eq("id", messageId);
    if (error) toast({ title: "Erro ao apagar", variant: "destructive" });
    else onMessageDeleted(messageId);
    setShowMenu(false);
  };

  const handleReaction = async (reaction: string) => {
    const existing = reactions.find((r) => r.reaction === reaction && r.user_id === userId);
    if (existing) {
      await supabase.from("group_message_reactions").delete()
        .eq("message_id", messageId).eq("user_id", userId).eq("reaction", reaction);
      onReactionToggled(messageId, reaction, false);
    } else {
      await supabase.from("group_message_reactions").insert({ message_id: messageId, user_id: userId, reaction });
      onReactionToggled(messageId, reaction, true);
    }
    setShowReactions(false);
  };

  if (isDeleted) return null;

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <Input value={editContent} onChange={(e) => setEditContent(e.target.value)}
          className="h-7 text-xs rounded-lg" autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") handleEdit(); if (e.key === "Escape") setIsEditing(false); }}
        />
        <button onClick={handleEdit} className="text-primary p-1"><Check className="h-3.5 w-3.5" /></button>
        <button onClick={() => setIsEditing(false)} className="text-muted-foreground p-1"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {showReactions && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute ${isOwn ? "right-0" : "left-0"} -top-10 z-30 flex gap-1 rounded-full bg-card border border-border px-2 py-1 shadow-lg`}>
            {QUICK_REACTIONS.map((r) => (
              <button key={r} onClick={() => handleReaction(r)}
                className={`text-lg hover:scale-125 transition-transform ${reactions.some((rx) => rx.reaction === r && rx.user_id === userId) ? "opacity-100" : "opacity-70"}`}>
                {r}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`flex items-center gap-0.5 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
        <button onClick={() => { setShowReactions(!showReactions); setShowMenu(false); }}
          className="p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          <SmilePlus className="h-3 w-3" />
        </button>
        {isOwn && (
          <button onClick={() => { setShowMenu(!showMenu); setShowReactions(false); }}
            className="p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            <MoreVertical className="h-3 w-3" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {showMenu && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute ${isOwn ? "right-0" : "left-0"} top-6 z-30 rounded-xl bg-card border border-border shadow-lg overflow-hidden min-w-[140px]`}>
            <button onClick={() => { setIsEditing(true); setEditContent(content); setShowMenu(false); }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
              <Edit2 className="h-3.5 w-3.5" /> Editar
            </button>
            <button onClick={handleDelete}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Apagar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GroupReactionsDisplay({ reactions, isOwn }: { reactions: { reaction: string; user_id: string }[]; isOwn: boolean }) {
  if (reactions.length === 0) return null;
  const grouped = reactions.reduce((acc, r) => { acc[r.reaction] = (acc[r.reaction] || 0) + 1; return acc; }, {} as Record<string, number>);
  return (
    <div className={`flex gap-1 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
      {Object.entries(grouped).map(([emoji, count]) => (
        <span key={emoji} className="inline-flex items-center gap-0.5 rounded-full bg-muted/80 px-1.5 py-0.5 text-xs">
          {emoji} {count > 1 && <span className="text-muted-foreground">{count}</span>}
        </span>
      ))}
    </div>
  );
}
