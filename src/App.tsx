import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotificationPermissionBanner from "@/components/NotificationPermissionBanner";
import PresenceTracker from "@/components/PresenceTracker";
import InAppNotificationToast from "@/components/InAppNotificationToast";
import { useNativePushNotifications } from "@/hooks/useNativePushNotifications";
import { useAutoWebPush } from "@/hooks/useAutoWebPush";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Estudos from "./pages/Estudos";
import Agenda from "./pages/Agenda";
import Musicos from "./pages/Musicos";
import Perfil from "./pages/Perfil";
import Admin from "./pages/Admin";
import PendingApproval from "./pages/PendingApproval";
import Presenca from "./pages/Presenca";
import Diario from "./pages/Diario";
import Conquistas from "./pages/Conquistas";
import Oracoes from "./pages/Oracoes";
import Ranking from "./pages/Ranking";
import Comunidade from "./pages/Comunidade";
import PlanoLeitura from "./pages/PlanoLeitura";
import Quiz from "./pages/Quiz";
import Install from "./pages/Install";
import Devocional from "./pages/Devocional";
import Testemunhos from "./pages/Testemunhos";
import LembretesOracao from "./pages/LembretesOracao";
import Versiculos from "./pages/Versiculos";
import Celulas from "./pages/Celulas";
import DashboardLider from "./pages/DashboardLider";
import Mensagens from "./pages/Mensagens";
import RotinaComDeus from "./pages/RotinaComDeus";
import Onboarding from "./pages/Onboarding";
import Provas from "./pages/Provas";
import PerfilPublico from "./pages/PerfilPublico";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PushInitializer = () => {
  useNativePushNotifications();
  useAutoWebPush();
  return null;
};

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} {...pageTransition} className="min-h-screen">
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/pending" element={<PendingApproval />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/estudos" element={<Estudos />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/musicos" element={<Musicos />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/:userId" element={<PerfilPublico />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/presenca" element={<Presenca />} />
          <Route path="/diario" element={<Diario />} />
          <Route path="/conquistas" element={<Conquistas />} />
          <Route path="/oracoes" element={<Oracoes />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/comunidade" element={<Comunidade />} />
          <Route path="/plano-leitura" element={<PlanoLeitura />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/install" element={<Install />} />
          <Route path="/devocional" element={<Devocional />} />
          <Route path="/testemunhos" element={<Testemunhos />} />
          <Route path="/lembretes-oracao" element={<LembretesOracao />} />
          <Route path="/versiculos" element={<Versiculos />} />
          <Route path="/celulas" element={<Celulas />} />
          <Route path="/dashboard-lider" element={<DashboardLider />} />
          <Route path="/mensagens" element={<Mensagens />} />
          <Route path="/rotina-com-deus" element={<RotinaComDeus />} />
          <Route path="/provas" element={<Provas />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NotificationPermissionBanner />
        <PresenceTracker />
        <PushInitializer />
        <InAppNotificationToast />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
