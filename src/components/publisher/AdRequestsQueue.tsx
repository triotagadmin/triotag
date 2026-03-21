import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, Calendar, Package, Clock, Image, Ban, AlertCircle } from "lucide-react";
import { format, differenceInHours } from "date-fns";

interface AdRequest {
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
  brand_category?: string | null;
  campaign_objective?: string | null;
  ad_spaces: {
    title: string;
    location: string | null;
  } | null;
}

interface AdRequestsQueueProps {
  requests: AdRequest[];
  onStatusChange: () => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending_submission: { label: "Pending Review", color: "bg-yellow-500" },
  under_review: { label: "Under Review", color: "bg-blue-500" },
  approved: { label: "Approved", color: "bg-green-500" },
  rejected: { label: "Rejected", color: "bg-red-500" },
  design: { label: "Draft", color: "bg-gray-500" },
};

export const AdRequestsQueue = ({ requests, onStatusChange }: AdRequestsQueueProps) => {
  const [selectedRequest, setSelectedRequest] = useState<AdRequest | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const { toast } = useToast();

  // Check if a request can be cancelled (within 24 hours of approval)
  const canCancelRequest = (request: AdRequest) => {
    if (request.status !== "approved") return false;
    const submittedAt = request.submitted_at || request.created_at;
    const hoursSinceSubmission = differenceInHours(new Date(), new Date(submittedAt));
    return hoursSinceSubmission <= 24;
  };

  const handleViewRequest = async (request: AdRequest) => {
    setSelectedRequest(request);
    setPreviewDialogOpen(true);

    // Mark as under review if it's pending
    if (request.status === "pending_submission" || request.status === "design") {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase
          .from("activations")
          .update({
            status: "under_review",
            reviewer_id: session?.user?.id,
          })
          .eq("id", request.id);
        onStatusChange();
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("activations")
        .update({
          status: "approved",
          reviewer_id: session?.user?.id,
          reviewed_at: new Date().toISOString(),
          total_amount: selectedRequest.estimated_publisher_payout || 0,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      // Send notification to advertiser
      await supabase.from("notifications").insert({
        user_id: selectedRequest.advertiser_id,
        title: "Ad Request Approved!",
        message: `Your ad request for "${selectedRequest.ad_spaces?.title}" has been approved. You can now proceed to place your print order.`,
        type: "ad_request_approved",
      });

      toast({
        title: "Request Approved",
        description: "The advertiser has been notified and can now proceed.",
      });

      setPreviewDialogOpen(false);
      setSelectedRequest(null);
      onStatusChange();
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

  const openRejectDialog = () => {
    setPreviewDialogOpen(false);
    setRejectDialogOpen(true);
  };

  const openCancelDialog = () => {
    setPreviewDialogOpen(false);
    setCancelDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
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
        .eq("id", selectedRequest.id);

      if (error) throw error;

      // Send notification to advertiser
      await supabase.from("notifications").insert({
        user_id: selectedRequest.advertiser_id,
        title: "Ad Request Rejected",
        message: `Your ad request for "${selectedRequest.ad_spaces?.title}" has been rejected. Reason: ${rejectionReason}`,
        type: "ad_request_rejected",
      });

      toast({
        title: "Request Rejected",
        description: "The advertiser has been notified.",
      });

      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedRequest(null);
      onStatusChange();
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

  const handleCancel = async () => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("activations")
        .update({
          status: "rejected",
          rejection_reason: "Cancelled by publisher within 24 hours of approval",
          reviewer_id: session?.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      // Send notification to advertiser
      await supabase.from("notifications").insert({
        user_id: selectedRequest.advertiser_id,
        title: "Ad Request Cancelled",
        message: `Your ad request for "${selectedRequest.ad_spaces?.title}" has been cancelled by the publisher.`,
        type: "ad_request_cancelled",
      });

      toast({
        title: "Request Cancelled",
        description: "The booking request has been cancelled.",
      });

      setCancelDialogOpen(false);
      setSelectedRequest(null);
      onStatusChange();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Filter to show all requests with ad design
  const allRequests = requests.filter(r => r.ad_design_url);

  if (allRequests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Booking Requests</h3>
          <p className="text-muted-foreground">
            Booking requests from advertisers will appear here for your review.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {allRequests.map((request) => {
          const statusInfo = statusLabels[request.status] || { label: request.status, color: "bg-gray-500" };
          const canCancel = canCancelRequest(request);
          
          return (
            <Card key={request.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Design Preview */}
                  {request.ad_design_url && (
                    <div className="w-full md:w-32 h-24 overflow-hidden rounded-lg flex-shrink-0 bg-muted">
                      <img
                        src={request.ad_design_url}
                        alt="Ad Design"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Request Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{request.ad_spaces?.title || "Unknown Venue"}</h3>
                        <p className="text-sm text-muted-foreground">{request.ad_spaces?.location}</p>
                      </div>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {request.start_date && request.end_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(request.start_date), "MMM d")} - {format(new Date(request.end_date), "MMM d, yyyy")}
                        </span>
                      )}
                      {request.activation_type && (
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {request.activation_type.replace("_", " ")}
                        </span>
                      )}
                      {request.estimated_publisher_payout && (
                        <span className="font-medium text-primary">
                          ₱{request.estimated_publisher_payout.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Submitted: {format(new Date(request.submitted_at || request.created_at), "PPP")}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRequest(request)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setCancelDialogOpen(true);
                        }}
                        className="flex-1 text-destructive hover:text-destructive"
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Request Details</DialogTitle>
            <DialogDescription>
              Review the advertiser's campaign submission and take action.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Ad Creative Preview */}
              {selectedRequest.ad_design_url && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Ad Creative
                  </Label>
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={selectedRequest.ad_design_url}
                      alt="Ad Design"
                      className="max-h-64 mx-auto object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Campaign & Booking Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Venue / Listing</Label>
                  <p className="font-medium">{selectedRequest.ad_spaces?.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">{selectedRequest.ad_spaces?.location || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ad Unit Type</Label>
                  <p className="font-medium">{selectedRequest.activation_type?.replace("_", " ") || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <p className="font-medium">{selectedRequest.quantity || 1} units</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Booking Period</Label>
                  <p className="font-medium">
                    {selectedRequest.start_date && selectedRequest.end_date
                      ? `${format(new Date(selectedRequest.start_date), "MMM d")} - ${format(new Date(selectedRequest.end_date), "MMM d, yyyy")}`
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Duration</Label>
                  <p className="font-medium">
                    {selectedRequest.start_date && selectedRequest.end_date
                      ? `${Math.ceil((new Date(selectedRequest.end_date).getTime() - new Date(selectedRequest.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} days`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Booking Fee / Payout</Label>
                  <p className="font-medium text-primary text-lg">
                    ₱{(selectedRequest.estimated_publisher_payout || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p className="font-medium">
                    {format(new Date(selectedRequest.submitted_at || selectedRequest.created_at), "PPP")}
                  </p>
                </div>
                {selectedRequest.brand_category && (
                  <div>
                    <Label className="text-muted-foreground">Brand Category</Label>
                    <p className="font-medium">{selectedRequest.brand_category}</p>
                  </div>
                )}
                {selectedRequest.campaign_objective && (
                  <div>
                    <Label className="text-muted-foreground">Campaign Objective</Label>
                    <p className="font-medium">{selectedRequest.campaign_objective}</p>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Label className="text-muted-foreground">Current Status:</Label>
                <Badge className={statusLabels[selectedRequest.status]?.color || "bg-gray-500"}>
                  {statusLabels[selectedRequest.status]?.label || selectedRequest.status}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
            {selectedRequest && ["pending_submission", "under_review", "design"].includes(selectedRequest.status) && (
              <>
                <Button variant="destructive" onClick={openRejectDialog} disabled={processing}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button onClick={handleApprove} disabled={processing}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </>
            )}
            {selectedRequest && canCancelRequest(selectedRequest) && (
              <Button variant="outline" className="text-destructive" onClick={openCancelDialog} disabled={processing}>
                <Ban className="h-4 w-4 mr-1" />
                Cancel Booking
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking Request</DialogTitle>
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
                placeholder="Explain why you're rejecting this booking request..."
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

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancel Approved Booking
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this approved booking? This action can only be done within 24 hours of approval.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
              <p><strong>Venue:</strong> {selectedRequest.ad_spaces?.title}</p>
              <p><strong>Booking Period:</strong> {selectedRequest.start_date && selectedRequest.end_date
                ? `${format(new Date(selectedRequest.start_date), "MMM d")} - ${format(new Date(selectedRequest.end_date), "MMM d, yyyy")}`
                : "N/A"}
              </p>
              <p><strong>Payout:</strong> ₱{(selectedRequest.estimated_publisher_payout || 0).toLocaleString()}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={processing}
            >
              {processing ? "Cancelling..." : "Yes, Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
