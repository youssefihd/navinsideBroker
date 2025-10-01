import "./i18n.ts";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PrimeReactProvider } from "primereact/api";
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
import CreateLoad from "./pages/CreateLoad";
import ConsigneeForm from "./pages/ConsigneeForm";
import CreateUpdateCarriers from "./pages/CreateUpdateCarriers";
import CreateUpdateShipper from "./pages/CreateUpdateShipper";
import CreateUpdateEquipment from "./pages/CreateUpdateEquipment";
import CreateUpdateUser from "./pages/CreateUpdateUser";
import Emails from "./pages/Emails";
import Login from "./pages/Login";
import Accounting from "./pages/Accounting";          // removed .tsx (optional)
import ClientAccount from "./pages/ClientAccount";
import CarrierInvoice from "./pages/CarrierInvoice";  // removed .tsx (optional)
import ChecklistViewPage from "./pages/ChecklistViewPage"; // removed .tsx (optional)

// ✅ Missing import — make sure this file exists and default-exports the component
import CreateUpdateClient from "./pages/CreateUpdateClient";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

function AuthHandler({ onReady }: { onReady: () => void }) {
  const { instance } = useMsal();

  useEffect(() => {
    const init = async () => {
      try {
        // Depending on your msal-browser version, initialize() may be a no-op or required.
        // If you see errors here, you can remove initialize().
        // @ts-ignore
        if (typeof instance.initialize === "function") {
          // @ts-ignore
          await instance.initialize();
        }
        await instance.handleRedirectPromise();
        onReady();
      } catch (e) {
        console.error("MSAL redirect error:", e);
      }
    };
    init();
  }, [instance, onReady]);

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

                {/* Dashboard & Main Pages */}
                <Route path="/" element={<MainLayout><Index /></MainLayout>} />
                <Route path="/emails" element={<MainLayout><Emails /></MainLayout>} />

                {/* Loads */}
                <Route path="/loads" element={<MainLayout><Loads /></MainLayout>} />
                <Route path="/loads/create" element={<MainLayout><CreateLoad /></MainLayout>} />
                <Route path="/loads/update/:id" element={<MainLayout><CreateLoad /></MainLayout>} />

                {/* Clients */}
                <Route path="/clients" element={<MainLayout><Clients /></MainLayout>} />
                <Route path="/clients/create" element={<MainLayout><CreateUpdateClient /></MainLayout>} />
                <Route path="/clients/edit/:id" element={<MainLayout><CreateUpdateClient /></MainLayout>} />

                {/* Carriers */}
                <Route path="/carriers" element={<MainLayout><Carriers /></MainLayout>} />
                <Route path="/carriers/create" element={<MainLayout><CreateUpdateCarriers /></MainLayout>} />
                <Route path="/carriers/edit/:id" element={<MainLayout><CreateUpdateCarriers /></MainLayout>} />

                {/* Consignees */}
                <Route path="/consignees" element={<MainLayout><Consignees /></MainLayout>} />
                <Route path="/consignees/create" element={<MainLayout><ConsigneeForm /></MainLayout>} />
                <Route path="/consignees/edit/:id" element={<MainLayout><ConsigneeForm /></MainLayout>} />

                {/* Equipments */}
                <Route path="/equipments" element={<MainLayout><Equipments /></MainLayout>} />
                <Route path="/equipments/create" element={<MainLayout><CreateUpdateEquipment /></MainLayout>} />
                <Route path="/equipments/edit/:id" element={<MainLayout><CreateUpdateEquipment /></MainLayout>} />

                {/* Shippers */}
                <Route path="/shippers" element={<MainLayout><Shippers /></MainLayout>} />
                <Route path="/shippers/create" element={<MainLayout><CreateUpdateShipper /></MainLayout>} />
                <Route path="/shippers/edit/:id" element={<MainLayout><CreateUpdateShipper /></MainLayout>} />

                {/* Users */}
                <Route path="/users" element={<MainLayout><Users /></MainLayout>} />
                <Route path="/users/create" element={<MainLayout><CreateUpdateUser /></MainLayout>} />
                <Route path="/users/edit/:id" element={<MainLayout><CreateUpdateUser /></MainLayout>} />

                {/* Accounting */}
                <Route
                  path="/accounting"
                  element={
                    <div className="h-full min-h-[280px] flex-1">
                      <MainLayout><Accounting /></MainLayout>
                    </div>
                  }
                />
                <Route path="/accounting/clients" element={<MainLayout><ClientAccount /></MainLayout>} />
                <Route path="/accounting/carriers" element={<MainLayout><CarrierInvoice /></MainLayout>} />

                {/* Checklist */}
                <Route path="/check" element={<MainLayout><ChecklistViewPage /></MainLayout>} />
              </Routes>
            </BrowserRouter>
          )}
        </TooltipProvider>
      </PrimeReactProvider>
    </QueryClientProvider>
  );
};

export default App;
