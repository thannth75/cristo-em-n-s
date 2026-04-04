import { useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Radio, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const RADIO_WIDGET_URL =
  "https://public-player-widget.webradiosite.com/?source=widget_embeded&locale=pt-br&info=https%3A%2F%2Fpublic-player-widget.webradiosite.com%2Fapp%2Fplayer%2Finfo%2F3001%3Fhash%3D40baa3aa9377e413d27100e209d7c2d24ba5afd1&theme=light&color=3&cover=0&current_track=1&schedules=1&link=1&link_to=https%3A%2F%2Fwww.obraemrestauracao.org&share=1&popup=1&embed=1&auto_play=0";

const AmbientSound = forwardRef<HTMLDivElement>(function AmbientSound(_, ref) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      ref={ref}
      className="fixed right-4 z-40"
      style={{
        bottom: "calc(10rem + max(0.5rem, env(safe-area-inset-bottom, 8px)))",
      }}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="radio-widget"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-2">
              <p className="text-sm font-semibold text-foreground">Rádio de Louvores</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar rádio"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="px-2 py-2">
              <iframe
                src={RADIO_WIDGET_URL}
                title="Rádio Obra em Restauração"
                scrolling="no"
                frameBorder="0"
                allow="autoplay; clipboard-write"
                className="w-full rounded-xl"
                height={165}
              />
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border/60 px-3 py-2">
              <span className="text-xs text-muted-foreground">Música cristã 24h</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full gap-1.5"
                onClick={() => navigate("/radio")}
              >
                Abrir página
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="radio-button"
            onClick={() => setIsOpen(true)}
            whileTap={{ scale: 0.94 }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-card/95 text-primary shadow-lg backdrop-blur"
            aria-label="Abrir rádio de louvores"
          >
            <Radio className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
});

export default AmbientSound;
