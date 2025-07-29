import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CheckoutOriginal from './pages/Checkout';
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import { SocketProvider } from "./SocketContext";

const queryClient = new QueryClient();

const App = () => (
  <SocketProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/checkout" element={<CheckoutOriginal />} />
            <Route path="/parking55009hvSweJimbs5hhinbd56y" element={<Admin />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/success/:hash" element={<PaymentSuccess />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </SocketProvider>
);

export default App;
