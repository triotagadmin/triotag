import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { GuestBasketProvider } from "@/contexts/GuestBasketContext";
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
import AdminOrders from "./pages/AdminOrders";
import AdminTotalInventory from "./pages/admin/AdminTotalInventory";
import AdminMediaPlans from "./pages/admin/AdminMediaPlans";
import AdminExternalInventory from "./pages/admin/AdminExternalInventory";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

import AdvertiserDashboard from "./pages/AdvertiserDashboard";
import AdvertiserSettings from "./pages/AdvertiserSettings";
import PrintPartnerDashboard from "./pages/PrintPartnerDashboard";
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
import FranchiseBranches from "./pages/FranchiseBranches";
import ManageBranches from "./pages/ManageBranches";
import FranchiseEdit from "./pages/FranchiseEdit";
import ActivateListing from "./pages/ActivateListing";
import NotFound from "./pages/NotFound";
import ExploreAll from "./pages/ExploreAll";
import CampaignSubmission from "./pages/CampaignSubmission";
import CampaignMarketplace from "./pages/CampaignMarketplace";
import CampaignBuilder from "./pages/CampaignBuilder";
import HabitTracker from "./pages/HabitTracker";
import TradingAI from "./pages/TradingAI";
import Install from "./pages/Install";
import ListSpace from "./pages/ListSpace";
import Services from "./pages/Services";
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

 import PaymentSuccess from "./pages/PaymentSuccess";
 
import PublisherAdRequests from "./pages/publisher/PublisherAdRequests";
import PublisherAdRequestDetail from "./pages/publisher/PublisherAdRequestDetail";
import PublisherActiveInventory from "./pages/publisher/PublisherActiveInventory";
import Messages from "./pages/Messages";
import PublisherSettings from "./pages/PublisherSettings";

import HireTalent from "./pages/HireTalent";
import AdvertiserExplore from "./pages/advertiser/AdvertiserExplore";
import AdvertiserCityOverview from "./pages/advertiser/AdvertiserCityOverview";
import AdvertiserAreaDetails from "./pages/advertiser/AdvertiserAreaDetails";
import AdvertiserCampaignCreate from "./pages/advertiser/AdvertiserCampaignCreate";
import AOOHCampaignCreate from "./pages/advertiser/AOOHCampaignCreate";
import AOOHCampaignReport from "./pages/advertiser/AOOHCampaignReport";
import AOOHPlayer from "./pages/player/AOOHPlayer";
import TalentProfileSubmission from "./pages/TalentProfileSubmission";
import TalentDashboard from "./pages/TalentDashboard";
import BookTalent from "./pages/BookTalent";
import RetailerDashboard from "./pages/retailer/RetailerDashboard";
import CreativeLibrary from "./pages/retailer/CreativeLibrary";
import HouseAds from "./pages/retailer/HouseAds";
import CampaignCalendar from "./pages/retailer/CampaignCalendar";
import Inventory from "./pages/retailer/Inventory";
import BookingRequests from "./pages/retailer/BookingRequests";
import AudienceInsights from "./pages/retailer/AudienceInsights";
import Revenue from "./pages/retailer/Revenue";
import ScreenMonitor from "./pages/retailer/ScreenMonitor";
import RetailerSettings from "./pages/retailer/RetailerSettings";
import AdvertiserCampaigns from "./pages/advertiser/AdvertiserCampaigns";
import AdvertiserReports from "./pages/advertiser/AdvertiserReports";
import PublisherCampaigns from "./pages/publisher/PublisherCampaigns";
import RetailerCampaigns from "./pages/retailer/RetailerCampaigns";
import VenueCampaigns from "./pages/VenueCampaigns";
import TalentCampaigns from "./pages/talent/TalentCampaigns";
import AdminCampaigns from "./pages/AdminCampaigns";
import SolutionsOOH from "./pages/solutions/OOH";
import SolutionsDOOH from "./pages/solutions/DOOH";
import SolutionsAOOH from "./pages/solutions/AOOH";
import SolutionsMediaTruck from "./pages/solutions/MediaTruck";
import IndustriesRetailers from "./pages/industries/Retailers";
import IndustriesBrands from "./pages/industries/Brands";
import MediaPartners from "./pages/MediaPartners";
import UnderConstruction from "./pages/UnderConstruction";
import HomeRouter from "./components/HomeRouter";
import Notifications from "./pages/Notifications";
import { AppSidebarShell } from "./components/shared/AppSidebar";
import BrandAdvertiserDashboard from "./pages/brand-advertiser/BrandAdvertiserDashboard";
import BrandAdvertiserSettings from "./pages/brand-advertiser/BrandAdvertiserSettings";
import BrandAdvertiserCampaignsList from "./pages/brand-advertiser/BrandAdvertiserCampaignsList";
import BrandAdvertiserCreatives from "./pages/brand-advertiser/BrandAdvertiserCreatives";
import BrandAdvertiserAudiences from "./pages/brand-advertiser/BrandAdvertiserAudiences";
import BrandAdvertiserReports from "./pages/brand-advertiser/BrandAdvertiserReports";
import BrandAdvertiserChangelog from "./pages/brand-advertiser/BrandAdvertiserChangelog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <GuestBasketProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <AppSidebarShell>
        <Routes>
          <Route path="/" element={<HomeRouter />} />
          
          <Route path="/insights" element={<Insights />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/campaigns" element={<RoleProtectedRoute requireAuth allowedRoles={["admin"]}><CampaignMarketplace /></RoleProtectedRoute>} />
          <Route path="/insights/:id" element={<BlogPost />} />
          <Route path="/explore" element={<RoleProtectedRoute allowedRoles={["admin"]}><Marketplace /></RoleProtectedRoute>} />
          <Route path="/inventory" element={<VenueInventory />} />
          <Route path="/venue-inventory" element={<VenueInventory />} />
          <Route path="/venue/:id" element={<VenueDetail />} />
          <Route path="/venue/:id/branches" element={<FranchiseBranches />} />
          <Route path="/activate/:id" element={<ActivateListing />} />
           <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/venue-registration" element={<VenueRegistration />} />
          <Route path="/campaign-builder" element={<CampaignBuilder />} />
          <Route path="/habit-tracker" element={<HabitTracker />} />
          <Route path="/trading-ai" element={<TradingAI />} />
          <Route path="/install" element={<Install />} />
          <Route path="/list-space" element={<ListSpace />} />
          <Route path="/services" element={<Services />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/ticket-market" element={<TicketMarket />} />
          <Route path="/ticket-creator" element={<TicketMarket />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/retailer-dashboard" element={<AdvertiserDashboard />} />
          <Route path="/advertiser-settings" element={<AdvertiserSettings />} />
          <Route path="/print-partner/dashboard" element={<PrintPartnerDashboard />} />
          <Route path="/print-partner/clients" element={<PrintPartnerDashboard />} />
          <Route path="/print-partner/campaigns" element={<PrintPartnerDashboard />} />
          <Route path="/print-partner/jobs" element={<PrintPartnerDashboard />} />
          <Route path="/print-partner/pricing" element={<PrintPartnerDashboard />} />
          <Route path="/print-partner/revenue" element={<PrintPartnerDashboard />} />
          <Route path="/print-partner/files" element={<PrintPartnerDashboard />} />
          <Route path="/print-partner/settings" element={<PrintPartnerDashboard />} />
          <Route path="/order-prints" element={<OrderPrints />} />
          <Route path="/venue" element={<VenueDashboard />} />
          <Route path="/venue-publishers" element={<VenueDashboard />} />
          <Route path="/venue-publishers/:listingId/branches" element={<ManageBranches />} />
          <Route path="/franchise-registration/:franchiseId" element={<FranchiseEdit />} />
          <Route path="/venue-info" element={<Venue />} />
          <Route path="/venue/register" element={<VenueRegistration />} />
          <Route path="/venue/verify" element={<VenueVerification />} />
          <Route path="/explore-all" element={<RoleProtectedRoute allowedRoles={["admin"]}><ExploreAll /></RoleProtectedRoute>} />
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
          {/* Messaging */}
          <Route path="/messages" element={<Messages />} />
          {/* Talent Marketplace */}
          <Route path="/hire-talent" element={<HireTalent />} />
          <Route path="/talent-profile" element={<TalentProfileSubmission />} />
          <Route path="/talent-dashboard" element={<TalentDashboard />} />
          <Route path="/book-talent/:talentId" element={<BookTalent />} />
          {/* Publisher Ad Requests */}
          <Route path="/publisher/ad-requests" element={<PublisherAdRequests />} />
          <Route path="/publisher/active" element={<PublisherActiveInventory />} />
           <Route path="/publisher/ad-requests/:id" element={<PublisherAdRequestDetail />} />
           <Route path="/publisher/settings" element={<PublisherSettings />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/admin/verify" element={<AdminApproval />} />
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
          <Route path="/admin/orders" element={
            <ProtectedAdminRoute>
              <AdminOrders />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/total-inventory" element={
            <ProtectedAdminRoute>
              <AdminTotalInventory />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/media-plans" element={
            <ProtectedAdminRoute>
              <AdminMediaPlans />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/external-inventory" element={
            <ProtectedAdminRoute>
              <AdminExternalInventory />
            </ProtectedAdminRoute>
          } />
          {/* Advertiser inventory explorer — PUBLIC, no auth required */}
          <Route path="/advertiser/explore" element={<AdvertiserExplore />} />
          <Route path="/advertiser/explore/:city" element={<AdvertiserCityOverview />} />
          <Route path="/advertiser/explore/:city/:area" element={<AdvertiserAreaDetails />} />
          {/* Protected — login required */}
          <Route path="/advertiser/campaigns/create" element={<RoleProtectedRoute requireAuth><AdvertiserCampaignCreate /></RoleProtectedRoute>} />
          <Route path="/advertiser/campaigns/aooh/create" element={<RoleProtectedRoute requireAuth><AOOHCampaignCreate /></RoleProtectedRoute>} />
          <Route path="/advertiser/campaigns/aooh/:id" element={<RoleProtectedRoute requireAuth><AOOHCampaignReport /></RoleProtectedRoute>} />
          {/* AOOH player (token-based public) */}
          <Route path="/player/audio" element={<AOOHPlayer />} />
          {/* Retailer Portal — publisher only, all guarded inside RetailerLayout */}
          <Route path="/retailer/dashboard" element={<RetailerDashboard />} />
          <Route path="/retailer/creative-library" element={<CreativeLibrary />} />
          <Route path="/retailer/house-ads" element={<HouseAds />} />
          <Route path="/retailer/campaign-calendar" element={<CampaignCalendar />} />
          <Route path="/retailer/inventory" element={<Inventory />} />
          <Route path="/retailer/booking-requests" element={<BookingRequests />} />
          <Route path="/retailer/audience-insights" element={<AudienceInsights />} />
          <Route path="/retailer/revenue" element={<Revenue />} />
          <Route path="/retailer/screen-monitor" element={<ScreenMonitor />} />
          <Route path="/retailer/settings" element={<RetailerSettings />} />
          <Route path="/retailer/campaigns" element={<RetailerCampaigns />} />
          {/* Campaigns dashboards per role */}
          <Route path="/advertiser/campaigns" element={<RoleProtectedRoute requireAuth><AdvertiserCampaigns /></RoleProtectedRoute>} />
          <Route path="/advertiser/reports" element={<RoleProtectedRoute requireAuth><AdvertiserReports /></RoleProtectedRoute>} />
          <Route path="/publisher/campaigns" element={<RoleProtectedRoute requireAuth><PublisherCampaigns /></RoleProtectedRoute>} />
          <Route path="/venue/campaigns" element={<RoleProtectedRoute requireAuth><VenueCampaigns /></RoleProtectedRoute>} />
          <Route path="/talent/campaigns" element={<RoleProtectedRoute requireAuth><TalentCampaigns /></RoleProtectedRoute>} />
          <Route path="/admin/campaigns" element={<ProtectedAdminRoute><AdminCampaigns /></ProtectedAdminRoute>} />
          <Route path="/solutions/ooh" element={<SolutionsOOH />} />
          <Route path="/solutions/dooh" element={<SolutionsDOOH />} />
          <Route path="/solutions/aooh" element={<SolutionsAOOH />} />
          <Route path="/solutions/media-truck" element={<SolutionsMediaTruck />} />
          <Route path="/industries/retaildsp" element={<IndustriesRetailers />} />
          <Route path="/industries/sspsource" element={<IndustriesBrands />} />
          <Route path="/media-partners" element={<MediaPartners />} />
          {/* Brand Advertiser portal */}
          <Route path="/brand-advertiser/dashboard" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandAdvertiserDashboard /></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/campaigns" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandAdvertiserCampaignsList /></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/creatives" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandAdvertiserCreatives /></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/audiences" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandAdvertiserAudiences /></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/reports" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandAdvertiserReports /></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/changelog" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandAdvertiserChangelog /></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/settings" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandAdvertiserSettings /></RoleProtectedRoute>} />

          <Route path="/under-construction" element={<UnderConstruction />} />
          <Route path="/careers" element={<UnderConstruction />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AppSidebarShell>
        </BrowserRouter>
      </TooltipProvider>
      </GuestBasketProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;