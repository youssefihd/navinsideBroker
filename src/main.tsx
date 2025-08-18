import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { msalInstance } from "@/lib/MsalProvide.ts"
import './i18n.ts';
import { MsalProvider } from "@azure/msal-react";
import "primereact/resources/themes/lara-light-blue/theme.css";  // or any other theme you prefer
import "primereact/resources/primereact.min.css";                 // core styles
import "primeicons/primeicons.css";                               // icons (used by FileUpload buttons)


createRoot(document.getElementById("root")!).render(<MsalProvider instance={msalInstance}><App /></MsalProvider>);
