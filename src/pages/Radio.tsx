import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Radio as RadioIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import { motion } from "framer-motion";

const RADIO_WIDGET_URL =
  "https://public-player-widget.webradiosite.com/?source=widget_embeded&locale=pt-br&info=https%3A%2F%2Fpublic-player-widget.webradiosite.com%2Fapp%2Fplayer%2Finfo%2F3001%3Fhash%3D40baa3aa9377e413d27100e209d7c2d24ba5afd1&theme=light&color=3&cover=0&current_track=1&schedules=1&link=1&link_to=https%3A%2F%2Fwww.obraemrestauracao.org&share=1&popup=1&embed=1&auto_play=0";

const Radio = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, authLoading, navigate]);

  if (authLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        paddingBottom: "calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))",
      }}
    >
      <AppHeader userName={profile?.full_name?.split(" ")[0] || "Jovem"} />

      <main className="py-6">
        <ResponsiveContainer size="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <RadioIcon className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Rádio Obra em Restauração
              </h1>
              <p className="text-sm text-muted-foreground">
                Louvores e pregações 24 horas
              </p>
            </div>

            {/* Player widget */}
            <div className="rounded-2xl border border-border/60 bg-card shadow-lg overflow-hidden">
              <iframe
                src={RADIO_WIDGET_URL}
                title="Rádio Obra em Restauração"
                scrolling="no"
                frameBorder="0"
                allow="autoplay; clipboard-write"
                className="w-full"
                height={220}
              />
            </div>

            {/* Info */}
            <div className="rounded-xl bg-muted/40 border border-border/40 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">
                💡 Dica: Use o botão de rádio flutuante
              </p>
              <p className="text-xs text-muted-foreground">
                Toque no ícone de rádio no canto inferior direito de qualquer
                página para ouvir a rádio enquanto navega pelo app. O áudio
                continua tocando mesmo em segundo plano.
              </p>
            </div>
          </motion.div>
        </ResponsiveContainer>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Radio;
