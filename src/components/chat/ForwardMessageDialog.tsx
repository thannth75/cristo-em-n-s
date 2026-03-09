import { useState } from "react";
import { Forward, Search, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface ForwardMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  messageType: string;
  imageUrl?: string | null;
  contacts: Profile[];
  currentUserId: string;
}

export default function ForwardMessageDialog({
  isOpen, onClose, messageContent, messageType, imageUrl, contacts, currentUserId,
}: ForwardMessageDialogProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState<string | null>(null);

  const filtered = contacts.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleForward = async (receiverId: string) => {
    setSending(receiverId);

    const body: Record<string, string> = {
      receiver_id: receiverId,
      content: messageContent,
      message_type: messageType,
    };
    if (imageUrl) body.image_url = imageUrl;

    const { error } = await supabase.functions.invoke("send-private-message", { body });

    if (error) {
      toast({ title: "Erro ao encaminhar", variant: "destructive" });
    } else {
      toast({ title: "Mensagem encaminhada ✓" });
      onClose();
    }
    setSending(null);
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-5 w-5 text-primary" />
            Encaminhar mensagem
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar contato..."
            className="pl-9 rounded-full"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1">
          {filtered.map((c) => (
            <button
              key={c.user_id}
              onClick={() => handleForward(c.user_id)}
              disabled={sending !== null}
              className="flex w-full items-center gap-3 rounded-xl p-3 hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={c.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {getInitials(c.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground flex-1 text-left truncate">
                {c.full_name}
              </span>
              {sending === c.user_id && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">
              Nenhum contato encontrado
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
