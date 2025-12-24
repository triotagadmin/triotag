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
import Verify from "./pages/Verify";

import Insights from "./pages/Insights";
import BlogPost from "./pages/BlogPost";
import Marketplace from "./pages/Marketplace";
import VenueInventory from "./pages/VenueInventory";
import VenueDetail from "./pages/VenueDetail";
import ActivateListing from "./pages/ActivateListing";
import NotFound from "./pages/NotFound";
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
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import VenuePublisherDashboard from "./pages/VenuePublisherDashboard";
import VenueTicketsList from "./pages/VenueTicketsList";
import VenueTicketScanner from "./pages/VenueTicketScanner";
import TicketQRView from "./pages/TicketQRView";
import TicketValidation from "./pages/TicketValidation";
import TicketMarket from "./pages/TicketMarket";
import ValidateTicket from "./pages/ValidateTicket";
import PublisherApprovalDashboard from "./pages/PublisherApprovalDashboard";

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
          
          <Route path="/insights" element={<Insights />} />
          <Route path="/insights/:id" element={<BlogPost />} />
          <Route path="/explore" element={<Marketplace />} />
          <Route path="/inventory" element={<VenueInventory />} />
          <Route path="/venue-inventory" element={<VenueInventory />} />
          <Route path="/venue/:id" element={<VenueDetail />} />
          <Route path="/activate/:id" element={<ActivateListing />} />
          <Route path="/venue-registration" element={<VenueRegistration />} />
          <Route path="/campaign-builder" element={<CampaignBuilder />} />
          <Route path="/habit-tracker" element={<HabitTracker />} />
          <Route path="/trading-ai" element={<TradingAI />} />
          <Route path="/install" element={<Install />} />
          <Route path="/list-space" element={<ListSpace />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/ticket-market" element={<TicketMarket />} />
          <Route path="/ticket-creator" element={<TicketMarket />} />
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
          <Route path="/explore-all" element={<ExploreAll />} />
          <Route path="/campaign-submit" element={<CampaignSubmission />} />
          <Route path="/qr/:shortCode" element={<QRRedirect />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
{/* Venue Ticketing System */}
          <Route path="/venue-ticketing" element={<VenuePublisherDashboard />} />
          <Route path="/venue-ticketing/event/:eventId/tickets" element={<VenueTicketsList />} />
          <Route path="/venue-ticketing/scanner/:eventId" element={<VenueTicketScanner />} />
          <Route path="/ticket/:uniqueCode" element={<TicketQRView />} />
          <Route path="/validate/:uniqueCode" element={<TicketValidation />} />
          <Route path="/validate" element={<ValidateTicket />} />
          {/* Publisher Approval Dashboard */}
          <Route path="/publisher-dashboard" element={<PublisherApprovalDashboard />} />
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