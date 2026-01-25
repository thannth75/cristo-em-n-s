import { motion } from "framer-motion";
import { Download, Smartphone, CheckCircle, Share, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Install = () => {
  const navigate = useNavigate();
  const { user, isApproved, isLoading: authLoading } = useAuth();
  const { isInstallable, isInstalled, isIOS, install } = usePWA();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isApproved) {
        navigate("/pending");
      }
    }
  }, [user, isApproved, authLoading, navigate]);

  const handleInstall = async () => {
    await install();
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader userName="" />

      <main className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>

          <h1 className="mb-2 font-serif text-2xl font-semibold text-foreground">
            Instalar App
          </h1>
          <p className="mb-8 text-muted-foreground">
            Adicione o Vida em Cristo à tela inicial do seu celular para acesso rápido
          </p>

          {isInstalled ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4 rounded-2xl bg-card p-6 shadow-lg"
            >
              <CheckCircle className="h-16 w-16 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">App Instalado!</h2>
                <p className="text-sm text-muted-foreground">
                  O app já está na sua tela inicial
                </p>
              </div>
            </motion.div>
          ) : isInstallable ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm space-y-4"
            >
              <Button
                onClick={handleInstall}
                size="lg"
                className="w-full gap-2 text-lg"
              >
                <Download className="h-5 w-5" />
                Instalar Agora
              </Button>
              <p className="text-sm text-muted-foreground">
                Clique para adicionar à tela inicial
              </p>
            </motion.div>
          ) : isIOS ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm space-y-6"
            >
              <div className="rounded-2xl bg-card p-6 shadow-lg">
                <h2 className="mb-4 font-semibold text-foreground">
                  Como instalar no iPhone/iPad:
                </h2>
                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      1
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Toque em</span>
                      <Share className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">(Compartilhar)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      2
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Role e toque em</span>
                      <Plus className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">"Adicionar à Tela de Início"</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      3
                    </div>
                    <span className="text-muted-foreground">
                      Confirme tocando em <span className="font-medium text-foreground">"Adicionar"</span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm space-y-6"
            >
              <div className="rounded-2xl bg-card p-6 shadow-lg">
                <h2 className="mb-4 font-semibold text-foreground">
                  Como instalar no Android:
                </h2>
                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      1
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Toque em</span>
                      <MoreVertical className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">(Menu do navegador)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      2
                    </div>
                    <span className="text-muted-foreground">
                      Toque em <span className="font-medium text-foreground">"Instalar app"</span> ou <span className="font-medium text-foreground">"Adicionar à tela inicial"</span>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      3
                    </div>
                    <span className="text-muted-foreground">
                      Confirme tocando em <span className="font-medium text-foreground">"Instalar"</span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 w-full max-w-sm"
          >
            <h3 className="mb-4 font-semibold text-foreground">Vantagens:</h3>
            <div className="space-y-3">
              {[
                "Acesso rápido pela tela inicial",
                "Funciona offline",
                "Notificações importantes",
                "Experiência de app nativo",
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-xl bg-card p-3"
                >
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Install;
