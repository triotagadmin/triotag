import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { GuestBasketProvider } from "@/contexts/GuestBasketContext";
import Index from "./pages/Index";
import About from "./pages/About";
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

import AdminBrandCampaigns from "./pages/admin/AdminBrandCampaigns";
import AdminLocalListings from "./pages/admin/AdminLocalListings";
import AdminBusinessProspecting from "./pages/admin/AdminBusinessProspecting";
import AdminSocialScanner from "./pages/admin/AdminSocialScanner";
import AdminAgentCenter from "./pages/admin/AdminAgentCenter";
import AdminBrandAdvertiserApprovals from "./pages/admin/AdminBrandAdvertiserApprovals";
import AdminVerifiedLocations from "./pages/admin/AdminVerifiedLocations";
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
import VerifyAgent from "./pages/VerifyAgent";

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

import QRRedirect from "./pages/QRRedirect";
import MobileQRLanding from "./pages/qr/MobileQRLanding";
import AdminQRCodes from "./pages/admin/AdminQRCodes";
import AdminMobileQR from "./pages/admin/AdminMobileQR";
import AdminQRAnalytics from "./pages/admin/AdminQRAnalytics";
import AdminMobileQRAnalytics from "./pages/admin/AdminMobileQRAnalytics";
import AdminMobileLeads from "./pages/admin/AdminMobileLeads";
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
import RetailerSelfDashboard from "./pages/RetailerDashboard";
import RetailerCreatives from "./pages/RetailerCreatives";
import RetailerInventoryConfig from "./pages/RetailerInventoryConfig";
import RetailerBookings from "./pages/RetailerBookings";
import RetailerHouseAds from "./pages/RetailerHouseAds";
import RetailerScreens from "./pages/RetailerScreens";
import RetailerSelfSettings from "./pages/RetailerSelfSettings";
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
import MyClients from "./pages/retailer/MyClients";
import VenueCampaigns from "./pages/VenueCampaigns";
import TalentCampaigns from "./pages/talent/TalentCampaigns";
import AdminCampaigns from "./pages/AdminCampaigns";
import SolutionsOOH from "./pages/solutions/OOH";
import SolutionsDOOH from "./pages/solutions/DOOH";
import SolutionsAOOH from "./pages/solutions/AOOH";
import SolutionsMediaTruck from "./pages/solutions/MediaTruck";
import IndustriesRetailers from "./pages/industries/Retailers";
import IndustriesBrands from "./pages/industries/Brands";
import EcommerceOperations from "./pages/industries/EcommerceOperations";
import QRTechnology from "./pages/industries/QRTechnology";
import MediaPartners from "./pages/MediaPartners";
import MediaPartnerRegister from "./pages/MediaPartnerRegister";
import AdminMediaPartners from "./pages/admin/AdminMediaPartners";

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
import BrandAdvertiserInventory from "./pages/brand-advertiser/BrandAdvertiserInventory";
import BrandAdvertiserProductCampaigns from "./pages/brand-advertiser/BrandAdvertiserProductCampaigns";
import BrandAdvertiserServiceCampaigns from "./pages/brand-advertiser/BrandAdvertiserServiceCampaigns";
import BrandAdvertiserEventCampaigns from "./pages/brand-advertiser/BrandAdvertiserEventCampaigns";
import BrandApprovalGate from "./components/brand-advertiser/BrandApprovalGate";

import EcommerceSeoMicrosites from "./pages/EcommerceSeoMicrosites";
import VerifiedVenues from "./pages/agent/VerifiedVenues";
import DiscoverLocations from "./pages/agent/DiscoverLocations";
import WebmasterLogin from "./pages/webmaster/WebmasterLogin";
import WebmasterLayout from "./pages/webmaster/WebmasterLayout";
import WebmasterOverview from "./pages/webmaster/WebmasterOverview";
import WebmasterTenants from "./pages/webmaster/WebmasterTenants";
import WebmasterTenantNew from "./pages/webmaster/WebmasterTenantNew";
import WebmasterTenantDetail from "./pages/webmaster/WebmasterTenantDetail";
import WebmasterSuperAdmins from "./pages/webmaster/WebmasterSuperAdmins";
import WebmasterAgents from "./pages/webmaster/WebmasterAgents";
import WebmasterSupply from "./pages/webmaster/WebmasterSupply";
import WebmasterOperations from "./pages/webmaster/WebmasterOperations";
import WebmasterSystem from "./pages/webmaster/WebmasterSystem";
import WebmasterSecurity from "./pages/webmaster/WebmasterSecurity";
import WebmasterRoute from "./components/WebmasterRoute";

import TenantSuperAdminRoute from "./components/TenantSuperAdminRoute";
import SuperAdminDashboard from "./pages/tenant/SuperAdminDashboard";
import InviteAccept from "./pages/InviteAccept";

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

          <Route path="/webmaster" element={<WebmasterLogin />} />
          <Route element={<WebmasterRoute><WebmasterLayout /></WebmasterRoute>}>
            <Route path="/webmaster/dashboard" element={<WebmasterOverview />} />
            <Route path="/webmaster/tenants" element={<WebmasterTenants />} />
            <Route path="/webmaster/tenants/new" element={<WebmasterTenantNew />} />
            <Route path="/webmaster/tenants/:tenantId" element={<WebmasterTenantDetail />} />
            <Route path="/webmaster/super-admins" element={<WebmasterSuperAdmins />} />
            <Route path="/webmaster/account-approvals" element={<AdminBrandAdvertiserApprovals />} />
            <Route path="/webmaster/agents" element={<WebmasterAgents />} />
            <Route path="/webmaster/media-owners" element={<WebmasterSupply mode="media-owners" />} />
            <Route path="/webmaster/locations" element={<WebmasterSupply mode="locations" />} />
            <Route path="/webmaster/inventory" element={<WebmasterSupply mode="inventory" />} />
            <Route path="/webmaster/inventory-verification" element={<WebmasterSupply mode="verification" />} />
            <Route path="/webmaster/pending-approvals" element={<WebmasterSupply mode="pending" />} />
            <Route path="/webmaster/media-partners" element={<AdminMediaPartners />} />
            <Route path="/webmaster/campaigns" element={<WebmasterOperations mode="campaigns" />} />
            <Route path="/webmaster/proposals" element={<WebmasterOperations mode="proposals" />} />
            <Route path="/webmaster/transactions" element={<WebmasterOperations mode="transactions" />} />
            <Route path="/webmaster/commissions" element={<WebmasterOperations mode="commissions" />} />
            <Route path="/webmaster/reports" element={<WebmasterOperations mode="reports" />} />
            <Route path="/webmaster/users" element={<WebmasterSystem mode="users" />} />
            <Route path="/webmaster/roles" element={<WebmasterSystem mode="roles" />} />
            <Route path="/webmaster/audit-logs" element={<WebmasterSystem mode="audit" />} />
            <Route path="/webmaster/settings" element={<WebmasterSystem mode="settings" />} />
            <Route path="/webmaster/security" element={<WebmasterSecurity mode="overview" />} />
            <Route path="/webmaster/auth-activity" element={<WebmasterSecurity mode="auth-activity" />} />
            <Route path="/webmaster/access-logs" element={<WebmasterSecurity mode="access-logs" />} />
            <Route path="/webmaster/local-listings" element={<AdminLocalListings />} />
            <Route path="/webmaster/business-prospecting" element={<AdminBusinessProspecting />} />
            <Route path="/webmaster/social-scanner" element={<AdminSocialScanner />} />
          </Route>

          <Route path="/tenant/dashboard" element={<TenantSuperAdminRoute><SuperAdminDashboard /></TenantSuperAdminRoute>} />
          <Route path="/invite/:token" element={<InviteAccept />} />

          
          <Route path="/about" element={<About />} />
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
          
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/ticket-market" element={<TicketMarket />} />
          <Route path="/ticket-creator" element={<TicketMarket />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/agent" element={<VerifyAgent />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/retailer-dashboard" element={<RetailerSelfDashboard />} />
          <Route path="/retailer-dashboard/creatives" element={<RetailerCreatives />} />
          <Route path="/retailer-dashboard/inventory/:spaceId" element={<RetailerInventoryConfig />} />
          <Route path="/retailer-dashboard/bookings" element={<RetailerBookings />} />
          <Route path="/retailer-dashboard/house-ads" element={<RetailerHouseAds />} />
          <Route path="/retailer-dashboard/screens" element={<RetailerScreens />} />
          <Route path="/retailer-dashboard/settings" element={<RetailerSelfSettings />} />
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
          <Route path="/qr/mobile/:qrRef" element={<MobileQRLanding />} />
          <Route path="/qr/:shortCode" element={<QRRedirect />} />
          <Route path="/admin/qr-codes" element={<ProtectedAdminRoute><AdminQRCodes /></ProtectedAdminRoute>} />
          <Route path="/admin/mobile-qr" element={<ProtectedAdminRoute><AdminMobileQR /></ProtectedAdminRoute>} />
          <Route path="/admin/mobile-qr/:id/analytics" element={<ProtectedAdminRoute><AdminMobileQRAnalytics /></ProtectedAdminRoute>} />
          <Route path="/admin/qr-analytics" element={<ProtectedAdminRoute><AdminQRAnalytics /></ProtectedAdminRoute>} />
          <Route path="/admin/mobile-leads" element={<ProtectedAdminRoute><AdminMobileLeads /></ProtectedAdminRoute>} />
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
          <Route path="/admin/verified-locations" element={
            <ProtectedAdminRoute>
              <AdminVerifiedLocations />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/media-plans" element={
            <ProtectedAdminRoute>
              <AdminMediaPlans />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/brand-advertiser-approvals" element={<Navigate to="/webmaster/account-approvals" replace />} />
          <Route path="/admin/brand-campaigns" element={
            <ProtectedAdminRoute>
              <AdminBrandCampaigns />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/agents" element={
            <TenantSuperAdminRoute>
              <AdminAgentCenter />
            </TenantSuperAdminRoute>
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
          <Route path="/retailer/clients" element={<MyClients />} />
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
          <Route path="/industries/qr-technology" element={<QRTechnology />} />
          <Route path="/ecommerce" element={<EcommerceOperations />} />
          <Route path="/media-partners" element={<MediaPartners />} />
          <Route path="/partners/register" element={<MediaPartnerRegister />} />
          <Route path="/admin/media-partners" element={<Navigate to="/webmaster/media-partners" replace />} />

          {/* Brand Advertiser portal */}
          <Route path="/brand-advertiser/dashboard" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandApprovalGate><BrandAdvertiserDashboard /></BrandApprovalGate></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/campaigns" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandApprovalGate><BrandAdvertiserCampaignsList /></BrandApprovalGate></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/inventory" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandApprovalGate><BrandAdvertiserInventory /></BrandApprovalGate></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/creatives" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandApprovalGate><BrandAdvertiserCreatives /></BrandApprovalGate></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/audiences" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandApprovalGate><BrandAdvertiserAudiences /></BrandApprovalGate></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/reports" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandApprovalGate><BrandAdvertiserReports /></BrandApprovalGate></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/changelog" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandApprovalGate><BrandAdvertiserChangelog /></BrandApprovalGate></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/settings" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandApprovalGate><BrandAdvertiserSettings /></BrandApprovalGate></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/products" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandApprovalGate><BrandAdvertiserProductCampaigns /></BrandApprovalGate></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/services" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandApprovalGate><BrandAdvertiserServiceCampaigns /></BrandApprovalGate></RoleProtectedRoute>} />
          <Route path="/brand-advertiser/events" element={<RoleProtectedRoute requireAuth allowedRoles={["brand_advertiser"]}><BrandApprovalGate><BrandAdvertiserEventCampaigns /></BrandApprovalGate></RoleProtectedRoute>} />

          <Route path="/services/ecommerce-seo" element={<EcommerceSeoMicrosites />} />
          <Route path="/services/google-ads" element={<Navigate to="/services/ecommerce-seo" replace />} />
          <Route path="/agent/discover-locations" element={<RoleProtectedRoute requireAuth allowedRoles={["agent", "admin"]}><DiscoverLocations /></RoleProtectedRoute>} />
          <Route path="/agent/verified-venues" element={<RoleProtectedRoute requireAuth allowedRoles={["agent", "admin"]}><VerifiedVenues /></RoleProtectedRoute>} />

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