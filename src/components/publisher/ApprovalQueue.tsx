import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle, Eye, Loader2, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Activation {
  id: string;
  ad_space_id: string;
  advertiser_id: string;
  status: string;
  activation_type: string | null;
  ad_design_url: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  ad_spaces: {
    title: string;
    location: string | null;
  } | null;
}

interface ApprovalQueueProps {
  activations: Activation[];
  onStatusChange: () => void;
}

export function ApprovalQueue({ activations, onStatusChange }: ApprovalQueueProps) {
  const [selectedActivation, setSelectedActivation] = useState<Activation | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApprove = async (activation: Activation) => {
    setProcessing(activation.id);
    try {
      const { error } = await supabase
        .from("activations")
        .update({ status: "approved" })
        .eq("id", activation.id);

      if (error) throw error;

      toast({
        title: "Booking Approved",
        description: "The advertiser has been notified and can proceed with their order.",
      });
      onStatusChange();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve booking",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedActivation) return;
    
    setProcessing(selectedActivation.id);
    try {
      const { error } = await supabase
        .from("activations")
        .update({ 
          status: "rejected",
          rejection_reason: rejectionReason || "No reason provided"
        })
        .eq("id", selectedActivation.id);

      if (error) throw error;

      toast({
        title: "Booking Rejected",
        description: "The advertiser has been notified of your decision.",
      });
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedActivation(null);
      onStatusChange();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject booking",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (activation: Activation) => {
    setSelectedActivation(activation);
    setRejectDialogOpen(true);
  };

  if (activations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No pending approvals</p>
            <p className="text-sm">You're all caught up! New booking requests will appear here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {activations.map((activation) => (
          <Card key={activation.id} className="border-yellow-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {activation.ad_spaces?.title || "Ad Space"}
                  </CardTitle>
                  {activation.ad_spaces?.location && (
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {activation.ad_spaces.location}
                    </CardDescription>
                  )}
                </div>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                  Pending Approval
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Requested Dates</p>
                  <p className="font-medium">
                    {activation.start_date && format(new Date(activation.start_date), "MMM d")} -{" "}
                    {activation.end_date && format(new Date(activation.end_date), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Ad Type</p>
                  <p className="font-medium capitalize">
                    {activation.activation_type?.replace("_", " ") || "Other"}
                  </p>
                </div>
              </div>

              {activation.ad_design_url && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Ad Design</p>
                  <img
                    src={activation.ad_design_url}
                    alt="Ad Design"
                    className="max-h-40 rounded object-contain"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(activation)}
                  disabled={processing === activation.id}
                  className="flex-1"
                >
                  {processing === activation.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => openRejectDialog(activation)}
                  disabled={processing === activation.id}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this booking. This will be shared with the advertiser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Dates conflict with existing booking, venue maintenance scheduled..."
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
              disabled={processing !== null}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
