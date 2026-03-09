import { motion } from "framer-motion";
import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-vida-em-cristo.png";
import ParticlesBackground from "@/components/ParticlesBackground";

const PendingApproval = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <ParticlesBackground />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          {/* Logo com glow */}
          <motion.div
            className="mb-8 flex justify-center"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full scale-150" />
              <img
                src={logo}
                alt="Vida em Cristo"
                className="relative h-32 w-auto drop-shadow-2xl"
              />
            </div>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl bg-card/90 backdrop-blur-xl p-8 shadow-2xl border border-border/50"
          >
            <div className="mb-6 flex justify-center">
              <motion.div
                className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Clock className="h-10 w-10 text-primary" />
              </motion.div>
            </div>

            <h1 className="mb-2 text-center font-serif text-2xl font-bold text-foreground">
              Aguardando Aprovação
            </h1>

            <p className="mb-6 text-center text-muted-foreground">
              Olá, <span className="font-semibold text-foreground">{profile?.full_name || "Jovem"}</span>!
              <br />
              Seu cadastro foi recebido e está sendo analisado por um líder ou pastor.
            </p>

            <div className="mb-6 rounded-2xl bg-accent/50 p-4">
              <p className="text-center text-sm text-muted-foreground">
                Você receberá acesso assim que seu cadastro for aprovado. 
                Enquanto isso, ore e aguarde com fé! 🙏
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl bg-muted/50 p-4 text-center"
            >
              <p className="font-serif italic text-sm text-muted-foreground">
                "Espera no Senhor, anima-te e ele fortalecerá o teu coração."
              </p>
              <p className="mt-1 text-xs font-medium text-primary">— Salmos 27:14</p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 flex justify-center"
          >
            <Button
              variant="ghost"
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PendingApproval;
