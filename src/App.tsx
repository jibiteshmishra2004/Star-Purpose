import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { GlobalBackground } from "@/components/layout/GlobalBackground";
import { RequireRole } from "@/components/auth/RequireRole";
import Index from "./pages/Index";
import ForUsers from "./pages/ForUsers";
import ForSellers from "./pages/ForSellers";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import SellerDashboard from "./pages/SellerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSignin from "./pages/AdminSignin";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="star-purpose-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <AppProvider>
        <GlobalBackground />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/for-users" element={<ForUsers />} />
            <Route path="/for-sellers" element={<ForSellers />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <RequireRole role="user">
                  <Dashboard />
                </RequireRole>
              }
            />
            <Route
              path="/seller"
              element={
                <RequireRole role="seller">
                  <SellerDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireRole role="admin">
                  <AdminDashboard />
                </RequireRole>
              }
            />
            <Route path="/admin-signin" element={<AdminSignin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
