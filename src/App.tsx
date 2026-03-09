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
import { lazy, Suspense } from "react";

// Eager load critical path
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load all other pages for faster initial load
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Estudos = lazy(() => import("./pages/Estudos"));
const Agenda = lazy(() => import("./pages/Agenda"));
const Musicos = lazy(() => import("./pages/Musicos"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Admin = lazy(() => import("./pages/Admin"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const Presenca = lazy(() => import("./pages/Presenca"));
const Diario = lazy(() => import("./pages/Diario"));
const Conquistas = lazy(() => import("./pages/Conquistas"));
const Oracoes = lazy(() => import("./pages/Oracoes"));
const Ranking = lazy(() => import("./pages/Ranking"));
const Comunidade = lazy(() => import("./pages/Comunidade"));
const PlanoLeitura = lazy(() => import("./pages/PlanoLeitura"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Install = lazy(() => import("./pages/Install"));
const Devocional = lazy(() => import("./pages/Devocional"));
const Testemunhos = lazy(() => import("./pages/Testemunhos"));
const LembretesOracao = lazy(() => import("./pages/LembretesOracao"));
const Versiculos = lazy(() => import("./pages/Versiculos"));
const Celulas = lazy(() => import("./pages/Celulas"));
const DashboardLider = lazy(() => import("./pages/DashboardLider"));
const Mensagens = lazy(() => import("./pages/Mensagens"));
const RotinaComDeus = lazy(() => import("./pages/RotinaComDeus"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Provas = lazy(() => import("./pages/Provas"));
const PerfilPublico = lazy(() => import("./pages/PerfilPublico"));
const MomentoComDeus = lazy(() => import("./pages/MomentoComDeus"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/momento-com-deus" element={<MomentoComDeus />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
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
