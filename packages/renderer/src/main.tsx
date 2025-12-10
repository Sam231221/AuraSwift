import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import { AppProviders } from "@/app/providers/app-providers";
import { ToastContainer } from "react-toastify";
import { Toaster } from "@/components/ui/sonner";
import App from "@/app/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
      <ToastContainer />
      <Toaster />
    </AppProviders>
  </StrictMode>
);
