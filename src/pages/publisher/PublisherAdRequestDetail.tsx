import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  quantity: number | null;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer_id: string | null;
  rejection_reason: string | null;
  campaign_objective: string | null;
  brand_category: string | null;
  campaign_manager_name: string | null;
  campaign_manager_email: string | null;
  campaign_manager_phone: string | null;
  ad_spaces: {
    title: string;
    location: string | null;
  } | null;
}

interface AdvertiserProfile {
  company_name: string;
  contact_name: string;
  contact_email: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending_submission: { label: "Pending Review", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  under_review: { label: "Under Review", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  design: { label: "Draft", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

export default function PublisherAdRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<AdRequestDetail | null>(null);
  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
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

      // Fetch the request
      const { data, error } = await supabase
        .from("activations")
        .select(`
          id,
          ad_space_id,
          advertiser_id,
          publisher_id,
          status,
          activation_type,
          ad_design_url,
          ad_unit_sku,
          start_date,
          end_date,
          estimated_publisher_payout,
          quantity,
          created_at,
          submitted_at,
          reviewed_at,
          reviewer_id,
          rejection_reason,
          campaign_objective,
          brand_category,
          campaign_manager_name,
          campaign_manager_email,
          campaign_manager_phone,
          ad_spaces (
            title,
            location
          )
        `)
        .eq("id", id)
        .eq("publisher_id", session.user.id)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Not Found",
          description: "Ad request not found or you don't have access.",
          variant: "destructive",
        });
        navigate("/publisher/ad-requests");
        return;
      }

      setRequest(data);

      // Mark as under_review if pending
      if (data.status === "pending_submission") {
        await supabase
          .from("activations")
          .update({
            status: "under_review",
            reviewer_id: session.user.id,
          })
          .eq("id", id);
        setRequest({ ...data, status: "under_review" });
      }

      // Fetch advertiser info
      const { data: advertiserProfile } = await supabase
        .from("advertiser_profiles")
        .select("company_name, contact_name, contact_email")
        .eq("user_id", data.advertiser_id)
        .single();

      if (advertiserProfile) {
        setAdvertiser(advertiserProfile);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load request details",
        variant: "destructive",
      });
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

      // Send notification to advertiser
      await supabase.from("notifications").insert({
        user_id: request.advertiser_id,
        title: "Ad Request Approved!",
        message: `Your ad request for "${request.ad_spaces?.title}" has been approved. You can now proceed to place your print order.`,
        type: "ad_request_approved",
      });

      toast({
        title: "Request Approved",
        description: "The advertiser has been notified and can now proceed.",
      });

      navigate("/publisher/ad-requests");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!request || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
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

      // Send notification to advertiser
      await supabase.from("notifications").insert({
        user_id: request.advertiser_id,
        title: "Ad Request Rejected",
        message: `Your ad request for "${request.ad_spaces?.title}" has been rejected. Reason: ${rejectionReason}`,
        type: "ad_request_rejected",
      });

      toast({
        title: "Request Rejected",
        description: "The advertiser has been notified.",
      });

      navigate("/publisher/ad-requests");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
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
  const canTakeAction = ["pending_submission", "under_review"].includes(request.status);
  const duration = request.start_date && request.end_date
    ? Math.ceil((new Date(request.end_date).getTime() - new Date(request.start_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/publisher/ad-requests")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Ad Request Details</h1>
            <p className="text-muted-foreground">
              Request ID: {request.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Creative Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Ad Creative
                </CardTitle>
              </CardHeader>
              <CardContent>
                {request.ad_design_url ? (
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={request.ad_design_url}
                      alt="Ad Creative"
                      className="w-full max-h-96 object-contain"
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg bg-muted h-48 flex items-center justify-center">
                    <p className="text-muted-foreground">No creative uploaded</p>
                  </div>
                )}
                {request.ad_design_url && (
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => window.open(request.ad_design_url!, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Full Image
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Venue & Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Venue & Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Venue</Label>
                    <p className="font-medium">{request.ad_spaces?.title || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{request.ad_spaces?.location}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Ad Unit Type</Label>
                    <p className="font-medium capitalize">
                      {request.activation_type?.replace("_", " ") || "N/A"}
                    </p>
                    {request.ad_unit_sku && (
                      <p className="text-sm text-muted-foreground">SKU: {request.ad_unit_sku}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Booking Period</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {request.start_date && request.end_date
                          ? `${format(new Date(request.start_date), "MMM d")} - ${format(new Date(request.end_date), "MMM d, yyyy")}`
                          : "Not specified"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Duration</Label>
                    <p className="font-medium">{duration} days</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Quantity</Label>
                    <p className="font-medium">{request.quantity || 1} units</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Booking Fee</Label>
                    <p className="font-medium text-primary text-lg">
                      ₱{(request.estimated_publisher_payout || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Details */}
            {(request.campaign_objective || request.brand_category) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Campaign Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {request.campaign_objective && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Campaign Objective</Label>
                        <p className="font-medium">{request.campaign_objective}</p>
                      </div>
                    )}
                    {request.brand_category && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Brand Category</Label>
                        <p className="font-medium">{request.brand_category}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rejection Reason (if rejected) */}
            {request.status === "rejected" && request.rejection_reason && (
              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-500">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Advertiser Info */}
            {advertiser && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building className="h-4 w-4" />
                    Advertiser
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground text-xs">Company</Label>
                    <p className="font-medium">{advertiser.company_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Contact</Label>
                    <p className="font-medium">{advertiser.contact_name}</p>
                    <p className="text-sm text-muted-foreground">{advertiser.contact_email}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(request.created_at), "MMM d, yyyy")}</span>
                </div>
                {request.submitted_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span>{format(new Date(request.submitted_at), "MMM d, yyyy")}</span>
                  </div>
                )}
                {request.reviewed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reviewed</span>
                    <span>{format(new Date(request.reviewed_at), "MMM d, yyyy")}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {canTakeAction && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                  <CardDescription>
                    Review and respond to this ad request
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve Request
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={processing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Request
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Ad Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request. The advertiser will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why you're rejecting this ad request..."
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
              {processing ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
