import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Navigation } from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Package,
  MapPin,
  DollarSign,
  Image,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Target,
  Building,
  ExternalLink,
  MessageSquare,
  FileText,
  Shield,
  Hash,
  Mail,
  Phone,
  CreditCard,
  AlertTriangle,
  Printer,
  Activity,
  Copy,
} from "lucide-react";

interface AdRequestDetail {
  id: string;
  ad_space_id: string;
  advertiser_id: string;
  publisher_id: string;
  status: string;
  activation_type: string | null;
  ad_design_url: string | null;
  ad_unit_sku: string | null;
  start_date: string | null;
  end_date: string | null;
  estimated_publisher_payout: number | null;
  total_amount: number | null;
  quantity: number | null;
  created_at: string;
  submitted_at: string | null;
  updated_at: string | null;
  reviewed_at: string | null;
  reviewer_id: string | null;
  rejection_reason: string | null;
  campaign_objective: string | null;
  brand_category: string | null;
  campaign_manager_name: string | null;
  campaign_manager_email: string | null;
  campaign_manager_phone: string | null;
  compliance_completed: boolean | null;
  creative_compliance_confirmed: boolean | null;
  print_order_id: string | null;
  reporting_frequency: string | null;
  competitive_conflict_declaration: string | null;
  sensitive_theme_flag: string | null;
  restricted_content: string[] | null;
  ad_spaces: {
    title: string;
    location: string | null;
    pricing: any | null;
    specifications: any | null;
  } | null;
}

interface AdvertiserProfile {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  company_description: string | null;
  website_url: string | null;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_submission: { label: "Pending Review", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: <Clock className="h-4 w-4" /> },
  under_review: { label: "Under Review", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <Activity className="h-4 w-4" /> },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: <CheckCircle className="h-4 w-4" /> },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: <XCircle className="h-4 w-4" /> },
  design: { label: "Draft", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: <FileText className="h-4 w-4" /> },
  pending_approval: { label: "Pending Approval", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: <Clock className="h-4 w-4" /> },
  printing: { label: "Printing", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: <Printer className="h-4 w-4" /> },
  payment_pending: { label: "Payment Pending", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: <CreditCard className="h-4 w-4" /> },
  completed: { label: "Completed", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: "Cancelled", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: <XCircle className="h-4 w-4" /> },
};

function DetailRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="font-medium text-sm break-words">{value}</div>
      </div>
    </div>
  );
}

export default function PublisherAdRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<AdRequestDetail | null>(null);
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchRequestDetails();
    }
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("publisher_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!profile) {
        toast({ title: "Access Denied", description: "Publisher profile not found.", variant: "destructive" });
        navigate("/publisher/ad-requests");
        return;
      }

      const { data, error } = await supabase
        .from("activations")
        .select(`
          id, ad_space_id, advertiser_id, publisher_id, status,
          activation_type, ad_design_url, ad_unit_sku,
          start_date, end_date, estimated_publisher_payout, total_amount,
          quantity, created_at, submitted_at, updated_at, reviewed_at,
          reviewer_id, rejection_reason, campaign_objective, brand_category,
          campaign_manager_name, campaign_manager_email, campaign_manager_phone,
          compliance_completed, creative_compliance_confirmed, print_order_id,
          reporting_frequency, competitive_conflict_declaration,
          sensitive_theme_flag, restricted_content,
          ad_spaces (
            title, location, pricing, specifications
          )
        `)
        .eq("id", id)
        .eq("publisher_id", profile.id)
        .single();

      if (error) throw error;

      if (!data) {
        toast({ title: "Not Found", description: "Ad request not found or you don't have access.", variant: "destructive" });
        navigate("/publisher/ad-requests");
        return;
      }

      setRequest(data);

      // Mark as viewed (but don't change status - admin handles approval now)
      // Publishers can only view, not approve/reject

      const { data: advertiserProfile } = await supabase
        .from("advertiser_profiles")
        .select("id, company_name, contact_name, contact_email, contact_phone, company_description, website_url, status")
        .eq("user_id", data.advertiser_id)
        .single();

      if (advertiserProfile) {
        setAdvertiser(advertiserProfile);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load request details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!request) return;
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("activations")
        .update({
          status: "approved",
          reviewer_id: session?.user?.id,
          reviewed_at: new Date().toISOString(),
          total_amount: request.estimated_publisher_payout || 0,
        })
        .eq("id", request.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: request.advertiser_id,
        title: "Ad Request Approved!",
        message: `Your ad request for "${request.ad_spaces?.title}" has been approved. You can now proceed to place your print order.`,
        type: "ad_request_approved",
      });

      toast({ title: "Request Approved", description: "The advertiser has been notified and can now proceed." });
      navigate("/publisher/ad-requests");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to approve request", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!request || !rejectionReason.trim()) {
      toast({ title: "Error", description: "Please provide a rejection reason", variant: "destructive" });
      return;
    }
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("activations")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewer_id: session?.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: request.advertiser_id,
        title: "Ad Request Rejected",
        message: `Your ad request for "${request.ad_spaces?.title}" has been rejected. Reason: ${rejectionReason}`,
        type: "ad_request_rejected",
      });

      toast({ title: "Request Rejected", description: "The advertiser has been notified." });
      navigate("/publisher/ad-requests");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to reject request", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyId = async () => {
    if (!request) return;
    await navigator.clipboard.writeText(request.id);
    setCopiedId(true);
    toast({ title: "Copied", description: "Request ID copied to clipboard." });
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleMessageAdvertiser = () => {
    if (!request) return;
    navigate(`/messages?to=${request.advertiser_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12 max-w-4xl text-center">
          <p className="text-muted-foreground">Request not found</p>
          <Button onClick={() => navigate("/publisher/ad-requests")} className="mt-4">
            Back to Ad Requests
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[request.status] || statusConfig.design;
  const canTakeAction = false; // Approval is now handled by admin accounts only
  const duration = request.start_date && request.end_date
    ? Math.ceil((new Date(request.end_date).getTime() - new Date(request.start_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const creativeStatus = request.ad_design_url
    ? request.creative_compliance_confirmed
      ? "Approved"
      : request.status === "rejected"
        ? "Rejected"
        : "Submitted"
    : "Not uploaded";

  const creativeStatusColor = request.ad_design_url
    ? request.creative_compliance_confirmed
      ? "bg-green-500/10 text-green-500 border-green-500/20"
      : request.status === "rejected"
        ? "bg-red-500/10 text-red-500 border-red-500/20"
        : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    : "bg-gray-500/10 text-gray-500 border-gray-500/20";

  const paymentStatus = request.total_amount && request.total_amount > 0
    ? request.status === "completed" ? "Paid" : request.status === "payment_pending" ? "Unpaid" : "Pending"
    : "N/A";

  // Build activity timeline
  const timeline: { date: string; label: string; icon: React.ReactNode }[] = [];
  timeline.push({ date: request.created_at, label: "Request created", icon: <FileText className="h-3.5 w-3.5" /> });
  if (request.submitted_at) {
    timeline.push({ date: request.submitted_at, label: "Submitted for review", icon: <Package className="h-3.5 w-3.5" /> });
  }
  if (request.reviewed_at) {
    const action = request.status === "rejected" ? "Rejected by publisher" : "Reviewed by publisher";
    timeline.push({ date: request.reviewed_at, label: action, icon: request.status === "rejected" ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" /> });
  }
  if (request.updated_at && request.updated_at !== request.created_at) {
    timeline.push({ date: request.updated_at, label: "Last updated", icon: <Activity className="h-3.5 w-3.5" /> });
  }
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/publisher/ad-requests")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">Ad Request Details</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground font-mono">
                ID: {request.id.slice(0, 8).toUpperCase()}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyId}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Badge className={`${statusInfo.color} gap-1.5`}>
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Creative & Content Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Creative & Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Creative Status:</span>
                  <Badge className={creativeStatusColor}>{creativeStatus}</Badge>
                </div>
                {request.ad_design_url ? (
                  <div className="border border-border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={request.ad_design_url}
                      alt="Ad Creative"
                      className="w-full max-h-96 object-contain"
                    />
                  </div>
                ) : (
                  <div className="border border-border rounded-lg bg-muted h-48 flex items-center justify-center">
                    <div className="text-center">
                      <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground text-sm">No creative uploaded yet</p>
                    </div>
                  </div>
                )}
                {request.ad_design_url && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(request.ad_design_url!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Full Image
                  </Button>
                )}
                {request.competitive_conflict_declaration && (
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Advertiser Notes / Competitive Conflict</p>
                    <p className="text-sm">{request.competitive_conflict_declaration}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Venue & Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Ad Placement & Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                  <DetailRow
                    label="Venue / Listing"
                    icon={<MapPin className="h-4 w-4" />}
                    value={
                      <div>
                        <p>{request.ad_spaces?.title || "Unknown"}</p>
                        {request.ad_spaces?.location && (
                          <p className="text-xs text-muted-foreground font-normal">{request.ad_spaces.location}</p>
                        )}
                      </div>
                    }
                  />
                  <DetailRow
                    label="Ad Format / Unit Type"
                    icon={<Package className="h-4 w-4" />}
                    value={
                      <span className="capitalize">{request.activation_type?.replace("_", " ") || "N/A"}</span>
                    }
                  />
                  {request.ad_unit_sku && (
                    <DetailRow label="Ad Unit SKU" icon={<Hash className="h-4 w-4" />} value={request.ad_unit_sku} />
                  )}
                  <DetailRow
                    label="Campaign Duration"
                    icon={<Calendar className="h-4 w-4" />}
                    value={
                      request.start_date && request.end_date
                        ? `${format(new Date(request.start_date), "MMM d, yyyy")} – ${format(new Date(request.end_date), "MMM d, yyyy")} (${duration} days)`
                        : "Not specified"
                    }
                  />
                  <DetailRow
                    label="Quantity / Placements"
                    icon={<Package className="h-4 w-4" />}
                    value={`${request.quantity || 1} unit(s)`}
                  />
                  <DetailRow
                    label="Reporting Frequency"
                    icon={<Activity className="h-4 w-4" />}
                    value={request.reporting_frequency?.replace(/-/g, " ") || "End of campaign"}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Campaign Details */}
            {(request.campaign_objective || request.brand_category || request.sensitive_theme_flag) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Campaign Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                    {request.campaign_objective && (
                      <DetailRow label="Campaign Objective" icon={<Target className="h-4 w-4" />} value={request.campaign_objective} />
                    )}
                    {request.brand_category && (
                      <DetailRow label="Brand Category" icon={<Building className="h-4 w-4" />} value={request.brand_category} />
                    )}
                    {request.sensitive_theme_flag && request.sensitive_theme_flag !== "none" && (
                      <DetailRow
                        label="Sensitive Theme Flag"
                        icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                        value={<span className="text-amber-500">{request.sensitive_theme_flag}</span>}
                      />
                    )}
                    {request.restricted_content && request.restricted_content.length > 0 && (
                      <DetailRow
                        label="Restricted Content Tags"
                        icon={<Shield className="h-4 w-4" />}
                        value={
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {request.restricted_content.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        }
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Budget & Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget & Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                  <DetailRow
                    label="Proposed Booking Fee"
                    icon={<DollarSign className="h-4 w-4" />}
                    value={
                      <span className="text-primary text-lg">
                        ₱{(request.estimated_publisher_payout || 0).toLocaleString()}
                      </span>
                    }
                  />
                  {request.total_amount !== null && request.total_amount !== undefined && request.total_amount > 0 && (
                    <DetailRow
                      label="Total Amount"
                      icon={<CreditCard className="h-4 w-4" />}
                      value={`₱${request.total_amount.toLocaleString()}`}
                    />
                  )}
                  <DetailRow
                    label="Payment Status"
                    icon={<CreditCard className="h-4 w-4" />}
                    value={
                      <Badge className={
                        paymentStatus === "Paid"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : paymentStatus === "Unpaid"
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                      }>
                        {paymentStatus}
                      </Badge>
                    }
                  />
                  {request.print_order_id && (
                    <DetailRow
                      label="Print Order ID"
                      icon={<Printer className="h-4 w-4" />}
                      value={request.print_order_id.slice(0, 8).toUpperCase()}
                    />
                  )}
                </div>
                {/* Pricing breakdown from ad space */}
                {request.ad_spaces?.pricing && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Pricing Breakdown (from listing)</p>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                      {Object.entries(request.ad_spaces.pricing as Record<string, any>).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                          <span className="font-medium">{typeof val === "number" ? `₱${val.toLocaleString()}` : String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance */}
            {(request.compliance_completed !== null || request.creative_compliance_confirmed !== null) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      {request.compliance_completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        Compliance {request.compliance_completed ? "Completed" : "Pending"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.creative_compliance_confirmed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        Creative {request.creative_compliance_confirmed ? "Confirmed" : "Not Confirmed"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rejection Reason */}
            {request.status === "rejected" && request.rejection_reason && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    Rejection Reason
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{request.rejection_reason}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Right column */}
          <div className="space-y-6">
            {/* Actions (top of sidebar for quick access) */}
            {canTakeAction && (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                  <CardDescription>Review and respond to this request</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" onClick={handleApprove} disabled={processing}>
                    {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Approve Request
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={() => setRejectDialogOpen(true)} disabled={processing}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline Request
                  </Button>
                  <Separator />
                  <Button variant="outline" className="w-full" onClick={handleMessageAdvertiser}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Advertiser
                  </Button>
                </CardContent>
              </Card>
            )}

            {!canTakeAction && (
              <Card>
                <CardContent className="pt-6">
                  <Button variant="outline" className="w-full" onClick={handleMessageAdvertiser}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Advertiser
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Requesting Account Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building className="h-4 w-4" />
                  Requesting Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {advertiser ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Company / Brand</p>
                      <p className="font-semibold">{advertiser.company_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Account Type</p>
                      <Badge variant="outline" className="capitalize">{advertiser.status === "approved" ? "Verified Advertiser" : "Advertiser"}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Account ID</p>
                      <p className="text-sm font-mono text-muted-foreground">{advertiser.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Contact Person</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm font-medium">{advertiser.contact_name}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{advertiser.contact_email}</p>
                      </div>
                      {advertiser.contact_phone && (
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{advertiser.contact_phone}</p>
                        </div>
                      )}
                    </div>
                    {advertiser.website_url && (
                      <div>
                        <p className="text-xs text-muted-foreground">Website</p>
                        <a
                          href={advertiser.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {advertiser.website_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {advertiser.company_description && (
                      <div>
                        <p className="text-xs text-muted-foreground">About</p>
                        <p className="text-sm text-muted-foreground">{advertiser.company_description}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    <p>Advertiser ID: {request.advertiser_id.slice(0, 8).toUpperCase()}</p>
                    <p className="mt-1 text-xs">Profile not available</p>
                  </div>
                )}
                {/* Campaign Manager (if different from account contact) */}
                {request.campaign_manager_name && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Campaign Manager</p>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm">{request.campaign_manager_name}</p>
                      </div>
                      {request.campaign_manager_email && (
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{request.campaign_manager_email}</p>
                        </div>
                      )}
                      {request.campaign_manager_phone && (
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{request.campaign_manager_phone}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-4">
                  {timeline.map((event, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="relative flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                          {event.icon}
                        </div>
                        {i < timeline.length - 1 && (
                          <div className="w-px h-full bg-border absolute top-7 left-1/2 -translate-x-1/2" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium">{event.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.date), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Ad Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this request. The advertiser will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why you're declining this ad request..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? "Declining..." : "Confirm Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
