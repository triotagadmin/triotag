import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, LogOut, Users, FileText, CheckCircle, XCircle, Clock, Filter, Bell, AlertCircle, Search, Eye, Building, Monitor, UserCircle, Edit, Trash2, ShoppingCart, ChevronLeft, ChevronRight, Ticket, Package, UserCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import SubmissionDetailsDialog from "@/components/SubmissionDetailsDialog";
import { Navigation } from "@/components/Navigation";

interface Submission {
  id: string;
  type: "publisher" | "admin" | "advertiser" | "campaign" | "ad_space" | "verification_document" | "agent_service";
  name: string;
  email?: string;
  location?: string;
  status: string;
  createdAt: string;
  publisherType?: string;
  userId?: string;
  details?: any;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  category: "campaign" | "venue" | "digital" | "agent";
  status: string;
  location?: string;
  createdAt: string;
  ownerName: string;
  table: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "info" | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewDetailsSubmission, setViewDetailsSubmission] = useState<Submission | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Marketplace management state
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [marketplaceSlide, setMarketplaceSlide] = useState(0);
  const [editingListing, setEditingListing] = useState<MarketplaceListing | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ title: "", description: "", location: "" });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingListing, setDeletingListing] = useState<MarketplaceListing | null>(null);
  
  // Tickets state
  const [ticketSubmissions, setTicketSubmissions] = useState<any[]>([]);
  const [ticketSlide, setTicketSlide] = useState(0);
  
  // Agents state
  const [agentProfiles, setAgentProfiles] = useState<any[]>([]);
  const [agentActionLoading, setAgentActionLoading] = useState<string | null>(null);
  

  useEffect(() => {
    checkAdminAccess();
    loadSubmissions();
    loadMarketplaceListings();
    loadNotifications();
    loadTicketSubmissions();
    loadAgentProfiles();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, statusFilter, typeFilter, searchTerm]);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please log in to access admin dashboard");
        navigate("/admin");
        return;
      }

      const { data: adminProfile } = await supabase
        .from("admin_profiles")
        .select("status, full_name")
        .eq("user_id", session.user.id)
        .single();

      if (!adminProfile || adminProfile.status !== "verified") {
        toast.error("Access denied. Verified admin credentials required.");
        await supabase.auth.signOut();
        navigate("/admin");
        return;
      }

      setAdminName(adminProfile.full_name);
    } catch (error) {
      console.error("Access check error:", error);
      navigate("/admin");
    }
  };

  const loadSubmissions = async () => {
    try {
      // Load admin profiles
      const { data: admins } = await supabase
        .from("admin_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // Load advertiser profiles
      const { data: advertisers } = await supabase
        .from("advertiser_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // Load campaigns
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select(`
          *,
          advertiser_profiles (
            company_name,
            contact_email,
            user_id
          )
        `)
        .order("created_at", { ascending: false });

      // Load ad spaces
      const { data: adSpaces } = await supabase
        .from("ad_spaces")
        .select(`
          *,
          publisher_profiles (
            business_name,
            contact_email,
            user_id
          )
        `)
        .order("created_at", { ascending: false });

      // Load verification documents
      const { data: verificationDocs } = await supabase
        .from("verification_documents")
        .select(`
          *,
          publisher_profiles (
            business_name,
            contact_email,
            user_id,
            verification_status
          )
        `)
        .order("uploaded_at", { ascending: false });

      const allSubmissions: Submission[] = [
        ...(admins || []).map((a) => ({
          id: a.id,
          type: "admin" as const,
          name: a.full_name,
          status: a.status,
          createdAt: a.created_at,
          userId: a.user_id,
          details: a,
        })),
        ...(advertisers || []).map((a) => ({
          id: a.id,
          type: "advertiser" as const,
          name: a.company_name,
          email: a.contact_email,
          status: a.status,
          createdAt: a.created_at,
          userId: a.user_id,
          details: a,
        })),
        ...(campaigns || []).map((c) => ({
          id: c.id,
          type: "campaign" as const,
          name: c.campaign_name,
          email: c.advertiser_profiles?.contact_email,
          status: c.status,
          createdAt: c.created_at,
          userId: c.advertiser_profiles?.user_id,
          details: c,
        })),
        ...(adSpaces || []).map((a) => ({
          id: a.id,
          type: "ad_space" as const,
          name: a.title,
          email: a.publisher_profiles?.contact_email,
          location: a.location,
          status: a.approval_status,
          createdAt: a.created_at,
          userId: a.publisher_profiles?.user_id,
          details: a,
        })),
        ...(verificationDocs || []).map((v) => ({
          id: v.id,
          type: "verification_document" as const,
          name: `${v.document_type} - ${v.publisher_profiles?.business_name}`,
          email: v.publisher_profiles?.contact_email,
          status: v.publisher_profiles?.verification_status || "pending",
          createdAt: v.uploaded_at,
          userId: v.publisher_profiles?.user_id,
          details: v,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setSubmissions(allSubmissions);
    } catch (error) {
      console.error("Error loading submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMarketplaceListings = async () => {
    try {
      // Load campaigns
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select(`*, advertiser_profiles(company_name)`)
        .order("created_at", { ascending: false });

      // Load ad spaces (venues)
      const { data: adSpaces } = await supabase
        .from("ad_spaces")
        .select(`*, publisher_profiles(business_name)`)
        .order("created_at", { ascending: false });

      // Load agent services
      const { data: agentServices } = await supabase
        .from("agent_services")
        .select(`*, publisher_profiles(business_name)`)
        .order("created_at", { ascending: false });

      // Load digital publishers
      const { data: digitalPublishers } = await supabase
        .from("publisher_profiles")
        .select("*")
        .eq("publisher_type", "digital")
        .order("created_at", { ascending: false });

      const allListings: MarketplaceListing[] = [
        ...(campaigns || []).map(c => ({
          id: c.id,
          title: c.campaign_name,
          description: c.campaign_description || "",
          category: "campaign" as const,
          status: c.status,
          location: c.location,
          createdAt: c.created_at || "",
          ownerName: (c.advertiser_profiles as any)?.company_name || "Advertiser",
          table: "campaigns"
        })),
        ...(adSpaces || []).map(v => ({
          id: v.id,
          title: v.title,
          description: v.description || "",
          category: "venue" as const,
          status: v.approval_status,
          location: v.location,
          createdAt: v.created_at || "",
          ownerName: (v.publisher_profiles as any)?.business_name || "Venue",
          table: "ad_spaces"
        })),
        ...(agentServices || []).map(s => ({
          id: s.id,
          title: s.title,
          description: s.description || "",
          category: "agent" as const,
          status: s.approval_status,
          location: s.location,
          createdAt: s.created_at || "",
          ownerName: (s.publisher_profiles as any)?.business_name || "Agent",
          table: "agent_services"
        })),
        ...(digitalPublishers || []).map(d => ({
          id: d.id,
          title: d.business_name,
          description: d.description || "",
          category: "digital" as const,
          status: d.verification_status,
          location: d.location,
          createdAt: d.created_at || "",
          ownerName: d.business_name,
          table: "publisher_profiles"
        }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setMarketplaceListings(allListings);
    } catch (error) {
      console.error("Error loading marketplace listings:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const loadTicketSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTicketSubmissions(data || []);
    } catch (error) {
      console.error("Error loading ticket submissions:", error);
    }
  };


  const loadAgentProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("publisher_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAgentProfiles(data || []);
    } catch (error) {
      console.error("Error loading agent profiles:", error);
    }
  };

  const handleAgentApprove = async (agent: any) => {
    setAgentActionLoading(agent.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("publisher_profiles")
        .update({
          verification_status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: session.user.id,
        })
        .eq("id", agent.id);

      if (error) throw error;

      // Send notification to agent
      await supabase.from("notifications").insert({
        user_id: agent.user_id,
        title: "Account Approved",
        message: "Your agent account has been approved! You can now post listings.",
        type: "agent_approval",
      });

      console.log(`[Admin] Approved agent: ${agent.contact_email} (${agent.id})`);
      toast.success(`Agent "${agent.business_name}" approved`);
      loadAgentProfiles();
    } catch (error) {
      console.error("Error approving agent:", error);
      toast.error("Failed to approve agent");
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleAgentReject = async (agent: any) => {
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE agent "${agent.business_name}" (${agent.contact_email})? This will remove their account, auth credentials, and all associated data. This cannot be undone.`)) {
      return;
    }
    setAgentActionLoading(agent.id);
    try {
      const { data, error } = await supabase.functions.invoke("delete-agent", {
        body: { agentProfileId: agent.id },
      });

      if (error) throw error;

      console.log(`[Admin] Rejected and deleted agent: ${agent.contact_email} (${agent.id})`);
      toast.success(`Agent "${agent.business_name}" has been permanently deleted`);
      loadAgentProfiles();
      loadSubmissions();
      loadMarketplaceListings();
    } catch (error: any) {
      console.error("Error rejecting agent:", error);
      toast.error("Failed to reject agent: " + (error?.message || "Unknown error"));
    } finally {
      setAgentActionLoading(null);
    }
  };


  const handleTicketAction = async (ticket: any, action: "approve" | "reject") => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("tickets")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          approved_at: action === "approve" ? new Date().toISOString() : null,
          approved_by: action === "approve" ? session.user.id : null,
        })
        .eq("id", ticket.id);

      if (error) throw error;

      toast.success(`Ticket ${action}d successfully`);
      loadTicketSubmissions();
    } catch (error: any) {
      console.error("Ticket action error:", error);
      toast.error(`Failed to ${action} ticket`);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Ticket deleted successfully");
      loadTicketSubmissions();
    } catch (error: any) {
      console.error("Delete ticket error:", error);
      toast.error("Failed to delete ticket");
    }
  };

  const TICKETS_PER_SLIDE = 6;
  const totalTicketSlides = Math.max(1, Math.ceil(ticketSubmissions.length / TICKETS_PER_SLIDE));
  const getCurrentTicketSlide = () => {
    const start = ticketSlide * TICKETS_PER_SLIDE;
    return ticketSubmissions.slice(start, start + TICKETS_PER_SLIDE);
  };


  const filterSubmissions = () => {
    let filtered = [...submissions];

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((s) => s.type === typeFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((s) => 
        s.name.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.location?.toLowerCase().includes(term) ||
        s.publisherType?.toLowerCase().includes(term)
      );
    }

    setFilteredSubmissions(filtered);
  };

  const openActionDialog = (submission: Submission, action: "approve" | "reject" | "info") => {
    setSelectedSubmission(submission);
    setActionType(action);
    setActionNote("");
    setIsDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedSubmission || !actionType) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const timestamp = new Date().toISOString();
      const newStatus = actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : selectedSubmission.status;
      
      console.log(`[Admin Action] Admin ${adminName} (${session.user.id}) ${actionType}ing ${selectedSubmission.type} submission:`, {
        submissionId: selectedSubmission.id,
        submissionName: selectedSubmission.name,
        action: actionType,
        timestamp,
        note: actionNote || "none"
      });

      const updateData: any = {
        ...(actionType === "approve" && {
          approved_at: timestamp,
          approved_by: session.user.id,
        }),
        ...(actionType === "reject" && {
          rejection_reason: actionNote,
        }),
      };

      // Update status in appropriate table based on type
      let error = null;

      if (selectedSubmission.type === "admin") {
        const { error: updateError } = await supabase
          .from("admin_profiles")
          .update({
            ...updateData,
            status: newStatus === "approved" ? "verified" : newStatus,
            ...(actionType === "approve" && {
              verified_at: timestamp,
              verified_by: session.user.id,
            }),
          })
          .eq("id", selectedSubmission.id);
        error = updateError;
      } else if (selectedSubmission.type === "advertiser") {
        const { error: updateError } = await supabase
          .from("advertiser_profiles")
          .update({
            ...updateData,
            status: newStatus,
          })
          .eq("id", selectedSubmission.id);
        error = updateError;
      } else if (selectedSubmission.type === "campaign") {
        const { error: updateError } = await supabase
          .from("campaigns")
          .update({
            ...updateData,
            status: newStatus,
          })
          .eq("id", selectedSubmission.id);
        error = updateError;
      } else if (selectedSubmission.type === "ad_space") {
        const { error: updateError } = await supabase
          .from("ad_spaces")
          .update({
            ...updateData,
            approval_status: newStatus,
          })
          .eq("id", selectedSubmission.id);
        error = updateError;
      } else if (selectedSubmission.type === "verification_document") {
        // Update the publisher profile verification status
        const verificationStatus = actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : "pending";
        const { error: updateError } = await supabase
          .from("publisher_profiles")
          .update({
            verification_status: verificationStatus as "approved" | "pending" | "rejected",
            ...(actionType === "approve" && {
              approved_at: timestamp,
              approved_by: session.user.id,
            }),
            ...(actionType === "reject" && {
              rejection_reason: actionNote,
            }),
          })
          .eq("id", selectedSubmission.details.publisher_id);
        error = updateError;
      }

      if (error) {
        console.error(`[Admin Action Error] Failed to ${actionType} submission:`, error);
        throw error;
      }

      console.log(`[Admin Action Success] Submission ${selectedSubmission.id} ${actionType}ed successfully`);

      // Send notification
      if (selectedSubmission.userId && selectedSubmission.email) {
        await supabase.functions.invoke("send-status-notification", {
          body: {
            userId: selectedSubmission.userId,
            recipientEmail: selectedSubmission.email,
            recipientName: selectedSubmission.name,
            submissionType: selectedSubmission.type,
            status: newStatus,
            rejectionReason: actionType === "reject" ? actionNote : undefined,
            requestedInfo: actionType === "info" ? actionNote : undefined,
          },
        });
        
        console.log(`[Notification Sent] Notified user ${selectedSubmission.userId} about ${actionType} action`);
      }

      toast.success(`Submission ${actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : "updated"} successfully`);
      setIsDialogOpen(false);
      loadSubmissions();
    } catch (error) {
      console.error("[Admin Action Error]", error);
      toast.error("Failed to process action");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/admin");
  };

  // Delete submission handler for admin panel
  const handleDeleteSubmission = async (submission: Submission) => {
    if (!confirm(`Are you sure you want to delete "${submission.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      let error = null;
      console.log("[Admin Delete] Deleting submission:", submission.type, submission.id);

      switch (submission.type) {
        case "ad_space":
          const { error: adSpaceError } = await supabase
            .from("ad_spaces")
            .delete()
            .eq("id", submission.id);
          error = adSpaceError;
          break;
        case "advertiser":
          const { error: advertiserError } = await supabase
            .from("advertiser_profiles")
            .delete()
            .eq("id", submission.id);
          error = advertiserError;
          break;
        case "campaign":
          const { error: campaignError } = await supabase
            .from("campaigns")
            .delete()
            .eq("id", submission.id);
          error = campaignError;
          break;
        case "admin":
          const { error: adminError } = await supabase
            .from("admin_profiles")
            .delete()
            .eq("id", submission.id);
          error = adminError;
          break;
        case "verification_document":
          const { error: docError } = await supabase
            .from("verification_documents")
            .delete()
            .eq("id", submission.id);
          error = docError;
          break;
        case "agent_service":
          const { error: agentError } = await supabase
            .from("agent_services")
            .delete()
            .eq("id", submission.id);
          error = agentError;
          break;
        default:
          toast.error("Unknown submission type");
          return;
      }

      if (error) {
        console.error("[Admin Delete Error]", error);
        throw error;
      }

      console.log("[Admin Delete] Successfully deleted:", submission.id);
      toast.success("Submission deleted successfully");
      loadSubmissions();
      loadMarketplaceListings();
    } catch (error) {
      console.error("[Admin Delete Error]", error);
      toast.error("Failed to delete submission");
    }
  };

  // Marketplace management functions
  const ITEMS_PER_SLIDE = 6;
  const totalMarketplaceSlides = Math.ceil(marketplaceListings.length / ITEMS_PER_SLIDE);

  const getCurrentMarketplaceItems = () => {
    const start = marketplaceSlide * ITEMS_PER_SLIDE;
    return marketplaceListings.slice(start, start + ITEMS_PER_SLIDE);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "campaign": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "venue": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "digital": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "agent": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      default: return "";
    }
  };

  const openEditDialog = (listing: MarketplaceListing) => {
    setEditingListing(listing);
    setEditFormData({
      title: listing.title,
      description: listing.description,
      location: listing.location || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingListing) return;

    try {
      let error = null;

      if (editingListing.table === "campaigns") {
        const { error: updateError } = await supabase
          .from("campaigns")
          .update({
            campaign_name: editFormData.title,
            campaign_description: editFormData.description,
            location: editFormData.location
          })
          .eq("id", editingListing.id);
        error = updateError;
      } else if (editingListing.table === "ad_spaces") {
        const { error: updateError } = await supabase
          .from("ad_spaces")
          .update({
            title: editFormData.title,
            description: editFormData.description,
            location: editFormData.location
          })
          .eq("id", editingListing.id);
        error = updateError;
      } else if (editingListing.table === "agent_services") {
        const { error: updateError } = await supabase
          .from("agent_services")
          .update({
            title: editFormData.title,
            description: editFormData.description,
            location: editFormData.location
          })
          .eq("id", editingListing.id);
        error = updateError;
      } else if (editingListing.table === "publisher_profiles") {
        const { error: updateError } = await supabase
          .from("publisher_profiles")
          .update({
            business_name: editFormData.title,
            description: editFormData.description,
            location: editFormData.location
          })
          .eq("id", editingListing.id);
        error = updateError;
      }

      if (error) throw error;

      toast.success("Listing updated successfully");
      setIsEditDialogOpen(false);
      setEditingListing(null);
      loadMarketplaceListings();
    } catch (error) {
      console.error("Error updating listing:", error);
      toast.error("Failed to update listing");
    }
  };

  const openDeleteDialog = (listing: MarketplaceListing) => {
    setDeletingListing(listing);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingListing) return;

    try {
      let error = null;

      if (deletingListing.table === "campaigns") {
        const { error: deleteError } = await supabase
          .from("campaigns")
          .delete()
          .eq("id", deletingListing.id);
        error = deleteError;
      } else if (deletingListing.table === "ad_spaces") {
        const { error: deleteError } = await supabase
          .from("ad_spaces")
          .delete()
          .eq("id", deletingListing.id);
        error = deleteError;
      } else if (deletingListing.table === "agent_services") {
        const { error: deleteError } = await supabase
          .from("agent_services")
          .delete()
          .eq("id", deletingListing.id);
        error = deleteError;
      } else if (deletingListing.table === "publisher_profiles") {
        // For digital publishers, we reject instead of delete
        const { error: updateError } = await supabase
          .from("publisher_profiles")
          .update({ verification_status: "rejected" })
          .eq("id", deletingListing.id);
        error = updateError;
      }

      if (error) throw error;

      toast.success("Listing deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingListing(null);
      loadMarketplaceListings();
      loadSubmissions();
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      verified: "default",
      rejected: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string, publisherType?: string) => {
    return (
      <Badge variant="outline" className="capitalize">
        {type.replace("_", " ")}
      </Badge>
    );
  };

  const renderSubmissionsPanel = (submissions: Submission[], title: string, description: string) => (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{submissions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {submissions.filter((s) => s.status === "pending").length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {submissions.filter((s) => ["approved", "verified"].includes(s.status)).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {submissions.filter((s) => s.status === "rejected").length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <XCircle className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No submissions found
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      {getTypeBadge(submission.type, submission.publisherType)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {submission.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {submission.email || submission.location || "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setViewDetailsSubmission(submission);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {submission.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openActionDialog(submission, "approve")}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openActionDialog(submission, "reject")}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {/* Delete button for all submissions */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSubmission(submission)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => ["approved", "verified"].includes(s.status)).length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {adminName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="default" onClick={() => navigate("/admin/orders")}>
              <Package className="w-4 h-4 mr-2" />
              Ad Orders
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/blog-submission")}>
              <FileText className="w-4 h-4 mr-2" />
              Blog
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/newsletter-dashboard")}>
              <Bell className="w-4 h-4 mr-2" />
              News
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="marketplace">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="publishers">
              <Building className="w-4 h-4 mr-2" />
              Publishers
            </TabsTrigger>
            <TabsTrigger value="advertisers">
              <Monitor className="w-4 h-4 mr-2" />
              Advertisers
            </TabsTrigger>
            <TabsTrigger value="agents">
              <UserCheck className="w-4 h-4 mr-2" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="documents">
              <UserCircle className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Marketplace Listings</CardTitle>
                <CardDescription>Manage all marketplace submissions - edit or delete listings</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Carousel Navigation */}
                {totalMarketplaceSlides > 1 && (
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Button variant="outline" size="icon" onClick={() => setMarketplaceSlide(prev => (prev - 1 + totalMarketplaceSlides) % totalMarketplaceSlides)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalMarketplaceSlides }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setMarketplaceSlide(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${idx === marketplaceSlide ? "bg-primary" : "bg-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setMarketplaceSlide(prev => (prev + 1) % totalMarketplaceSlides)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <p className="text-sm text-muted-foreground mb-4">
                  Showing {getCurrentMarketplaceItems().length} of {marketplaceListings.length} listings
                  {totalMarketplaceSlides > 1 && ` • Slide ${marketplaceSlide + 1} of ${totalMarketplaceSlides}`}
                </p>

                {/* Horizontal Listings Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {getCurrentMarketplaceItems().length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No marketplace listings found
                    </div>
                  ) : (
                    getCurrentMarketplaceItems().map((listing) => (
                      <Card key={`${listing.table}-${listing.id}`} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm line-clamp-1">{listing.title}</CardTitle>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(listing)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => openDeleteDialog(listing)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className={`capitalize text-xs ${getCategoryBadgeColor(listing.category)}`}>
                              {listing.category}
                            </Badge>
                            {getStatusBadge(listing.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {listing.description || "No description"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            By: {listing.ownerName}
                          </p>
                          {listing.location && (
                            <p className="text-xs text-muted-foreground">
                              Location: {listing.location}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Publishers Tab */}
          <TabsContent value="publishers" className="space-y-6">
            {renderSubmissionsPanel(filteredSubmissions.filter(s => s.type === "publisher" || s.type === "ad_space"), "Publisher Submissions", "Manage venue, digital, and agent publisher submissions")}
          </TabsContent>

          {/* Advertisers Tab */}
          <TabsContent value="advertisers" className="space-y-6">
            {renderSubmissionsPanel(filteredSubmissions.filter(s => s.type === "advertiser"), "Advertiser Submissions", "Manage advertiser profile submissions")}
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Agents</CardDescription>
                  <CardTitle className="text-3xl">{agentProfiles.length}</CardTitle>
                </CardHeader>
                <CardContent><Users className="w-4 h-4 text-muted-foreground" /></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Pending</CardDescription>
                  <CardTitle className="text-3xl text-yellow-600">
                    {agentProfiles.filter(a => a.verification_status === "pending").length}
                  </CardTitle>
                </CardHeader>
                <CardContent><Clock className="w-4 h-4 text-muted-foreground" /></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Approved</CardDescription>
                  <CardTitle className="text-3xl text-green-600">
                    {agentProfiles.filter(a => a.verification_status === "approved").length}
                  </CardTitle>
                </CardHeader>
                <CardContent><CheckCircle className="w-4 h-4 text-muted-foreground" /></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Agent Accounts</CardTitle>
                <CardDescription>Approve or reject agent accounts. Rejected agents are permanently deleted.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Applied</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentProfiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No agent accounts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      agentProfiles.map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell className="font-medium">{agent.business_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{agent.contact_email}</TableCell>
                          <TableCell>{getStatusBadge(agent.verification_status)}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(agent.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              {agent.verification_status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    disabled={agentActionLoading === agent.id}
                                    onClick={() => handleAgentApprove(agent)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={agentActionLoading === agent.id}
                                    onClick={() => handleAgentReject(agent)}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {agent.verification_status === "approved" && (
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                  <CheckCircle className="w-3 h-3 mr-1" />Active
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            {renderSubmissionsPanel(filteredSubmissions.filter(s => s.type === "verification_document"), "Verification Documents", "Manage agent credential verification documents")}
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>System notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No notifications</p>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg ${!notification.read ? "bg-muted/50" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <Badge variant="default" className="ml-4">New</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Submission"}
              {actionType === "reject" && "Reject Submission"}
              {actionType === "info" && "Request More Information"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" && "This will approve the submission and notify the user."}
              {actionType === "reject" && "Please provide a reason for rejection."}
              {actionType === "info" && "Specify what additional information is needed."}
            </DialogDescription>
          </DialogHeader>
          {(actionType === "reject" || actionType === "info") && (
            <div className="space-y-2">
              <Label htmlFor="note">
                {actionType === "reject" ? "Rejection Reason" : "Information Needed"}
              </Label>
              <Textarea
                id="note"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  actionType === "reject"
                    ? "Please explain why this submission is being rejected..."
                    : "Please describe what information is needed..."
                }
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={(actionType === "reject" || actionType === "info") && !actionNote.trim()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <SubmissionDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        submission={viewDetailsSubmission}
      />

      {/* Edit Listing Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
            <DialogDescription>
              Update the listing information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editFormData.location}
                onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingListing?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
