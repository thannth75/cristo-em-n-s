import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ChatTheme {
  id: string;
  name: string;
  background: string;
}

export const CHAT_THEMES: ChatTheme[] = [
  {
    id: "default",
    name: "Padrão",
    background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  },
  {
    id: "clean",
    name: "Limpo",
    background: "none",
  },
  {
    id: "warm",
    name: "Aconchego",
    background: `linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--accent) / 0.08))`,
  },
  {
    id: "night",
    name: "Noite",
    background: `linear-gradient(180deg, hsl(220 25% 12% / 0.5), hsl(220 25% 8% / 0.6))`,
  },
  {
    id: "dawn",
    name: "Alvorada",
    background: `linear-gradient(135deg, hsl(35 90% 92% / 0.5), hsl(15 85% 88% / 0.6))`,
  },
  {
    id: "verses",
    name: "Versículos",
    background: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='10' y='40' font-family='serif' font-size='10' fill='%2322c55e' fill-opacity='0.06'%3E✝%3C/text%3E%3C/svg%3E")`,
  },
];

export function getStoredChatTheme(conversationId: string): ChatTheme {
  try {
    const id = localStorage.getItem(`chat_theme_${conversationId}`);
    return CHAT_THEMES.find((t) => t.id === id) || CHAT_THEMES[0];
  } catch {
    return CHAT_THEMES[0];
  }
}

export default function ChatThemeMenu({
  conversationId,
  onChange,
}: {
  conversationId: string;
  onChange: (theme: ChatTheme) => void;
}) {
  const [active, setActive] = useState<string>(() => getStoredChatTheme(conversationId).id);

  useEffect(() => {
    setActive(getStoredChatTheme(conversationId).id);
  }, [conversationId]);

  const select = (theme: ChatTheme) => {
    localStorage.setItem(`chat_theme_${conversationId}`, theme.id);
    setActive(theme.id);
    onChange(theme);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 text-primary-foreground hover:bg-primary-foreground/10">
          <Palette className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
          Personalizar conversa
        </p>
        <div className="grid grid-cols-3 gap-2">
          {CHAT_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => select(t)}
              className={`relative aspect-square rounded-lg border-2 transition-all overflow-hidden ${
                active === t.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
              }`}
              style={{
                backgroundImage: t.background !== "none" ? t.background : undefined,
                backgroundColor: "hsl(var(--muted))",
              }}
              title={t.name}
            >
              {active === t.id && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
              <span className="absolute bottom-0 inset-x-0 text-[9px] font-medium text-foreground bg-background/80 py-0.5">
                {t.name}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
