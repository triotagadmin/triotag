import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import AdminApproval from "./pages/AdminApproval";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import CompleteProfile from "./pages/CompleteProfile";
import AdvertiserDashboard from "./pages/AdvertiserDashboard";
import Venue from "./pages/Venue";
import VenueDashboard from "./pages/VenueDashboard";
import VenueRegistration from "./pages/VenueRegistration";
import VenueVerification from "./pages/VenueVerification";
import DigitalMedia from "./pages/DigitalMedia";
import DigitalMediaDashboard from "./pages/DigitalMediaDashboard";
import AgentPublishers from "./pages/AgentPublishers";
import AgentDashboard from "./pages/AgentDashboard";
import AgentRegistration from "./pages/AgentRegistration";
import AgentVerification from "./pages/AgentVerification";
import DigitalServiceRegistration from "./pages/DigitalServiceRegistration";
import DigitalVerification from "./pages/DigitalVerification";
import Publishers from "./pages/Publishers";
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/advertiser-dashboard" element={<AdvertiserDashboard />} />
          <Route path="/venue" element={<VenueDashboard />} />
          <Route path="/venue-info" element={<Venue />} />
          <Route path="/venue/register" element={<VenueRegistration />} />
          <Route path="/venue/verify" element={<VenueVerification />} />
          <Route path="/digital-media" element={<DigitalMediaDashboard />} />
          <Route path="/digital-media-info" element={<DigitalMedia />} />
          <Route path="/digital-media/register" element={<DigitalServiceRegistration />} />
          <Route path="/digital-media/verify" element={<DigitalVerification />} />
          <Route path="/agent-publishers" element={<AgentDashboard />} />
          <Route path="/agent-info" element={<AgentPublishers />} />
          <Route path="/agent/register" element={<AgentRegistration />} />
          <Route path="/agent/verify" element={<AgentVerification />} />
          <Route path="/publishers" element={<Publishers />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/admin/verify" element={<AdminApproval />} />
          <Route path="/admin/dashboard" element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
