import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import AdminApproval from "./pages/AdminApproval";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBlogSubmission from "./pages/AdminBlogSubmission";
import AdminNewsletterDashboard from "./pages/AdminNewsletterDashboard";
import AdminAuditLog from "./pages/AdminAuditLog";
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
import Verify from "./pages/Verify";
import Home from "./pages/Home";
import Insights from "./pages/Insights";
import BlogPost from "./pages/BlogPost";
import Marketplace from "./pages/Marketplace";
import VenueInventory from "./pages/VenueInventory";
import VenueDetail from "./pages/VenueDetail";
import ActivateListing from "./pages/ActivateListing";
import NotFound from "./pages/NotFound";
import DigitalInventory from "./pages/DigitalInventory";
import AgentInventory from "./pages/AgentInventory";
import AgentServiceSubmission from "./pages/AgentServiceSubmission";
import ExploreAll from "./pages/ExploreAll";
import CampaignSubmission from "./pages/CampaignSubmission";
import CampaignBuilder from "./pages/CampaignBuilder";
import HabitTracker from "./pages/HabitTracker";
import TradingAI from "./pages/TradingAI";
import Install from "./pages/Install";
import ListSpace from "./pages/ListSpace";
import QRRedirect from "./pages/QRRedirect";
import Tickets from "./pages/Tickets";
import OrderPrints from "./pages/OrderPrints";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<Home />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/insights/:id" element={<BlogPost />} />
          <Route path="/explore" element={<Marketplace />} />
          <Route path="/inventory" element={<VenueInventory />} />
          <Route path="/venue-inventory" element={<VenueInventory />} />
          <Route path="/digital-inventory" element={<DigitalInventory />} />
          <Route path="/agent-inventory" element={<AgentInventory />} />
          <Route path="/venue/:id" element={<VenueDetail />} />
          <Route path="/activate/:id" element={<ActivateListing />} />
          <Route path="/venue-registration" element={<VenueRegistration />} />
          <Route path="/campaign-builder" element={<CampaignBuilder />} />
          <Route path="/habit-tracker" element={<HabitTracker />} />
          <Route path="/trading-ai" element={<TradingAI />} />
          <Route path="/install" element={<Install />} />
          <Route path="/list-space" element={<ListSpace />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/advertiser-dashboard" element={<AdvertiserDashboard />} />
          <Route path="/order-prints" element={<OrderPrints />} />
          <Route path="/venue" element={<VenueDashboard />} />
          <Route path="/venue-publishers" element={<VenueDashboard />} />
          <Route path="/venue-info" element={<Venue />} />
          <Route path="/venue/register" element={<VenueRegistration />} />
          <Route path="/venue/verify" element={<VenueVerification />} />
          <Route path="/digital-media" element={<DigitalMediaDashboard />} />
          <Route path="/digital-publishers" element={<DigitalMediaDashboard />} />
          <Route path="/digital-media-info" element={<DigitalMedia />} />
          <Route path="/digital-media/register" element={<DigitalServiceRegistration />} />
          <Route path="/digital-media/verify" element={<DigitalVerification />} />
          <Route path="/agent-publishers" element={<AgentDashboard />} />
          <Route path="/agent-info" element={<AgentPublishers />} />
          <Route path="/agent/register" element={<AgentRegistration />} />
          <Route path="/agent/verify" element={<AgentVerification />} />
          <Route path="/agent-registration" element={<AgentRegistration />} />
          <Route path="/agent-service-submission" element={<AgentServiceSubmission />} />
          <Route path="/explore-all" element={<ExploreAll />} />
          <Route path="/campaign-submit" element={<CampaignSubmission />} />
          <Route path="/qr/:shortCode" element={<QRRedirect />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/admin/verify" element={<AdminApproval />} />
          <Route path="/admin-dashboard" element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/blog-submission" element={
            <ProtectedAdminRoute>
              <AdminBlogSubmission />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/newsletter-dashboard" element={
            <ProtectedAdminRoute>
              <AdminNewsletterDashboard />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/audit-log" element={
            <ProtectedAdminRoute>
              <AdminAuditLog />
            </ProtectedAdminRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
