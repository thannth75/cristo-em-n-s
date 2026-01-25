import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/pending" element={<PendingApproval />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/estudos" element={<Estudos />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/musicos" element={<Musicos />} />
          <Route path="/perfil" element={<Perfil />} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
