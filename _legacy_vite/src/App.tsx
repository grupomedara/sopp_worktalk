import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import TasksPage from "./pages/TasksPage";
import ObjectivesPage from "./pages/ObjectivesPage";
import ProjectsPage from "./pages/ProjectsPage";
import PeoplePage from "./pages/PeoplePage";
import StudiesPage from "./pages/StudiesPage";
import LessonsPage from "./pages/LessonsPage";
import FinancesPage from "./pages/FinancesPage";
import AgendaPage from "./pages/AgendaPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tarefas" element={<TasksPage />} />
            <Route path="/objetivos" element={<ObjectivesPage />} />
            <Route path="/projetos" element={<ProjectsPage />} />
            <Route path="/pessoas" element={<PeoplePage />} />
            <Route path="/estudos" element={<StudiesPage />} />
            <Route path="/aulas" element={<LessonsPage />} />
            <Route path="/financas" element={<FinancesPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
