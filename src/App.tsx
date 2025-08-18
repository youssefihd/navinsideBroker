import './i18n.ts';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PrimeReactProvider } from 'primereact/api';
import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";

// Layout
import { MainLayout } from "./components/layout/MainLayout";

// Auth
import { PrivateRoute } from "./components/auth/PrivateRoute";

// Pages
import Index from "./pages/Index";
import Loads from "./pages/Loads";
import Clients from "./pages/Clients";
import Carriers from "./pages/Carriers";
import Consignees from "./pages/Consignees";
import Equipments from "./pages/Equipments";
import Shippers from "./pages/Shippers";
import Users from "./pages/Users";
import CreateLoad from "./pages/CreatLoad";
import CreateUpdateClient from "./pages/CreateUpdateClient";
import ConsigneeForm from "./pages/ConsigneeForm";
import CreateUpdateCarriers from './pages/CreateUpdateCarriers';
import CreateUpdateShipper from "./pages/CreateUpdateShipper";
import CreateUpdateEquipment from "./pages/CreateUpdateEquipment";
import CreateUpdateUser from "./pages/CreateUpdateUser";
import Emails from "./pages/Emails";
import Login from "./pages/Login";
import Accounting from "./pages/Accounting.tsx";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import ClientAccount from "./pages/ClientAccount";
import CarrierInvoice from './pages/CarrierInvoice.tsx';
import ChecklistViewPage from './pages/ChecklistViewPage.tsx';
function AuthHandler({ onReady }: { onReady: () => void }) {
  const { instance } = useMsal();

  useEffect(() => {
    const init = async () => {
      try {
        await instance.initialize();
        await instance.handleRedirectPromise();
        onReady();
      } catch (e) {
        console.error("MSAL redirect error:", e);
      }
    };
    init();
  }, [instance]);

  return null;
}

const queryClient = new QueryClient();

const App = () => {
  const [ready, setReady] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <PrimeReactProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthHandler onReady={() => setReady(true)} />
          {ready && (
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/emails" element={<PrivateRoute><MainLayout><Emails /></MainLayout></PrivateRoute>} />
                <Route path="/" element={<PrivateRoute><MainLayout><Index /></MainLayout></PrivateRoute>} />
                <Route path="/loads" element={<PrivateRoute><MainLayout><Loads /></MainLayout></PrivateRoute>} />
                <Route path="/loads/create" element={<PrivateRoute><MainLayout><CreateLoad /></MainLayout></PrivateRoute>} />
                <Route path="/loads/update/:id" element={<PrivateRoute><MainLayout><CreateLoad /></MainLayout></PrivateRoute>} />
                <Route path="/clients" element={<PrivateRoute><MainLayout><Clients /></MainLayout></PrivateRoute>} />
                <Route path="/clients/create" element={<PrivateRoute><MainLayout><CreateUpdateClient /></MainLayout></PrivateRoute>} />
                <Route path="/clients/edit/:id" element={<PrivateRoute><MainLayout><CreateUpdateClient /></MainLayout></PrivateRoute>} />
                <Route path="/carriers" element={<PrivateRoute><MainLayout><Carriers /></MainLayout></PrivateRoute>} />
                <Route path="/carriers/create" element={<PrivateRoute><MainLayout><CreateUpdateCarriers /></MainLayout></PrivateRoute>} />
                <Route path="/carriers/edit/:id" element={<PrivateRoute><MainLayout><CreateUpdateCarriers /></MainLayout></PrivateRoute>} />
                <Route path="/consignees" element={<PrivateRoute><MainLayout><Consignees /></MainLayout></PrivateRoute>} />
                <Route path="/consignees/create" element={<PrivateRoute><MainLayout><ConsigneeForm /></MainLayout></PrivateRoute>} />
                <Route path="/consignees/edit/:id" element={<PrivateRoute><MainLayout><ConsigneeForm /></MainLayout></PrivateRoute>} />
                <Route path="/equipments" element={<PrivateRoute><MainLayout><Equipments /></MainLayout></PrivateRoute>} />
                <Route path="/equipements/create" element={<PrivateRoute><MainLayout><CreateUpdateEquipment /></MainLayout></PrivateRoute>} />
                <Route path="/equipements/edit/:id" element={<PrivateRoute><MainLayout><CreateUpdateEquipment /></MainLayout></PrivateRoute>} />
                <Route path="/shippers" element={<PrivateRoute><MainLayout><Shippers /></MainLayout></PrivateRoute>} />
                <Route path="/shippers/create" element={<PrivateRoute><MainLayout><CreateUpdateShipper /></MainLayout></PrivateRoute>} />
                <Route path="/shippers/edit/:id" element={<PrivateRoute><MainLayout><CreateUpdateShipper /></MainLayout></PrivateRoute>} />
                <Route path="/users" element={<PrivateRoute><MainLayout><Users /></MainLayout></PrivateRoute>} />
                <Route path="/users/create" element={<PrivateRoute><MainLayout><CreateUpdateUser /></MainLayout></PrivateRoute>} />
                <Route path="/users/edit/:id" element={<PrivateRoute><MainLayout><CreateUpdateUser /></MainLayout></PrivateRoute>} />
                <Route path="/accounting" element={<PrivateRoute><MainLayout><Accounting /></MainLayout></PrivateRoute>} />
<Route path="/accounting/clients" element={<PrivateRoute><MainLayout><ClientAccount /></MainLayout></PrivateRoute>} />
<Route path="/check" element={<PrivateRoute><MainLayout><ChecklistViewPage /></MainLayout></PrivateRoute>} />
<Route path="/accounting/carriers" element={<PrivateRoute><MainLayout><CarrierInvoice /></MainLayout></PrivateRoute>} />
              </Routes>
            </BrowserRouter>
          )}
        </TooltipProvider>
      </PrimeReactProvider>
    </QueryClientProvider>
  );
};

export default App;
