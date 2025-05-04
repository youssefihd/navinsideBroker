
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";

// Pages
import Index from "./pages/Index";
import Loads from "./pages/Loads";
import Clients from "./pages/Clients";
import Carriers from "./pages/Carriers";
import Consignees from "./pages/Consignees";
import Equipments from "./pages/Equipments";
import Shippers from "./pages/Shippers";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout><Index /></MainLayout>} />
          <Route path="/loads" element={<MainLayout><Loads /></MainLayout>} />
          <Route path="/clients" element={<MainLayout><Clients /></MainLayout>} />
          <Route path="/carriers" element={<MainLayout><Carriers /></MainLayout>} />
          <Route path="/consignees" element={<MainLayout><Consignees /></MainLayout>} />
          <Route path="/equipments" element={<MainLayout><Equipments /></MainLayout>} />
          <Route path="/shippers" element={<MainLayout><Shippers /></MainLayout>} />
          <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
