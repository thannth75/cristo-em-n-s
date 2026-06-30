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
import PrayerReminderInitializer from "@/components/PrayerReminderInitializer";
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
const TrilhaFe = lazy(() => import("./pages/TrilhaFe"));
const Provas = lazy(() => import("./pages/Provas"));
const PerfilPublico = lazy(() => import("./pages/PerfilPublico"));
const MomentoComDeus = lazy(() => import("./pages/MomentoComDeus"));
const Radio = lazy(() => import("./pages/Radio"));
const JogosEspirituais = lazy(() => import("./pages/JogosEspirituais"));
const DesafiosDiarios = lazy(() => import("./pages/DesafiosDiarios"));
const RoletaDesafios = lazy(() => import("./pages/RoletaDesafios"));
const MemoriaBiblica = lazy(() => import("./pages/MemoriaBiblica"));
const EspacoKids = lazy(() => import("./pages/EspacoKids"));
const Biblia = lazy(() => import("./pages/Biblia"));
const ModoDevocional = lazy(() => import("./pages/ModoDevocional"));
const Cursos = lazy(() => import("./pages/Cursos"));
const BibliotecaCrista = lazy(() => import("./pages/BibliotecaCrista"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Aniversariantes = lazy(() => import("./pages/Aniversariantes"));
const AdminAniversarios = lazy(() => import("./pages/AdminAniversarios"));

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

// iOS-style horizontal page transitions with direction tracking
const ROOT_PATHS = new Set(["/", "/dashboard", "/comunidade", "/agenda", "/perfil", "/mensagens"]);

function useNavDirection(pathname: string) {
  const stackRef = (useNavDirection as any)._stack ?? ((useNavDirection as any)._stack = [] as string[]);
  const stack: string[] = stackRef;
  let direction: 1 | -1 | 0 = 0;
  const prev = stack[stack.length - 1];
  if (!prev) {
    stack.push(pathname);
    direction = 0;
  } else if (prev === pathname) {
    direction = 0;
  } else {
    const prevIdx = stack.lastIndexOf(pathname);
    if (prevIdx >= 0) {
      // going back
      stack.length = prevIdx + 1;
      direction = -1;
    } else {
      stack.push(pathname);
      direction = ROOT_PATHS.has(pathname) && ROOT_PATHS.has(prev) ? 0 : 1;
    }
  }
  return direction;
}

function AnimatedRoutes() {
  const location = useLocation();
  const direction = useNavDirection(location.pathname);

  const variants = {
    initial: (dir: number) => ({
      opacity: dir === 0 ? 0 : 1,
      x: dir === 0 ? 0 : dir > 0 ? "20%" : "-12%",
      scale: dir === 0 ? 0.99 : 1,
    }),
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({
      opacity: dir === 0 ? 0 : 1,
      x: dir === 0 ? 0 : dir > 0 ? "-12%" : "20%",
      scale: dir === 0 ? 0.99 : 1,
    }),
  };

  return (
    <AnimatePresence mode="sync" custom={direction} initial={false}>
      <motion.div
        key={location.pathname}
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        className="min-h-screen will-change-transform"
        style={{ position: "relative" }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/estudos" element={<Estudos />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/musicos" element={<Musicos />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/perfil/:userId" element={<PerfilPublico />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/aniversarios" element={<AdminAniversarios />} />
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
            <Route path="/mensagens/:conversationId" element={<Mensagens />} />
            <Route path="/rotina-com-deus" element={<RotinaComDeus />} />
            <Route path="/trilha-fe" element={<TrilhaFe />} />
            <Route path="/provas" element={<Provas />} />
            <Route path="/momento-com-deus" element={<MomentoComDeus />} />
            <Route path="/radio" element={<Radio />} />
            <Route path="/jogos-espirituais" element={<JogosEspirituais />} />
            <Route path="/desafios-diarios" element={<DesafiosDiarios />} />
            <Route path="/roleta-desafios" element={<RoletaDesafios />} />
            <Route path="/memoria-biblica" element={<MemoriaBiblica />} />
            <Route path="/espaco-kids" element={<EspacoKids />} />
            <Route path="/biblia" element={<Biblia />} />
            <Route path="/modo-devocional" element={<ModoDevocional />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/biblioteca-crista" element={<BibliotecaCrista />} />
            <Route path="/aniversariantes" element={<Aniversariantes />} />
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
        <PrayerReminderInitializer />
        <InAppNotificationToast />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
