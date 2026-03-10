import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle, Eye, Loader2, Calendar, MapPin, Clock, Package, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookingActivation {
  id: string;
  ad_space_id: string;
  advertiser_id: string;
  publisher_id: string;
  status: string;
  activation_type: string | null;
  ad_design_url: string | null;
  start_date: string | null;
  end_date: string | null;
  estimated_publisher_payout: number | null;
  total_amount: number | null;
  quantity: number | null;
  created_at: string;
  submitted_at: string | null;
  rejection_reason: string | null;
  ad_spaces: {
    title: string;
    location: string | null;
    specifications: any;
  } | null;
}

const statusConfig: Record<string, { label: string; badgeClass: string }> = {
  pending_submission: { label: "Pending", badgeClass: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  pending_approval: { label: "Pending Approval", badgeClass: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  under_review: { label: "Under Review", badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  approved: { label: "Approved", badgeClass: "bg-green-500/10 text-green-500 border-green-500/20" },
  rejected: { label: "Rejected", badgeClass: "bg-red-500/10 text-red-500 border-red-500/20" },
  printing: { label: "Print Order", badgeClass: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
  payment_pending: { label: "Payment Pending", badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  completed: { label: "Completed", badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
};

export function AdminBookingsQueue() {
  const [bookings, setBookings] = useState<BookingActivation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingActivation | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewBooking, setPreviewBooking] = useState<BookingActivation | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("activations")
        .select(`
          id, ad_space_id, advertiser_id, publisher_id, status,
          activation_type, ad_design_url, start_date, end_date,
          estimated_publisher_payout, total_amount, quantity,
          created_at, submitted_at, rejection_reason,
          ad_spaces (title, location, specifications)
        `)
        .in("status", ["pending_submission", "pending_approval", "under_review", "approved", "printing", "payment_pending", "completed", "rejected"])
        .order("submitted_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (booking: BookingActivation) => {
    setProcessing(booking.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("activations")
        .update({
          status: "approved",
          reviewer_id: session?.user?.id,
          reviewed_at: new Date().toISOString(),
          total_amount: booking.estimated_publisher_payout || 0,
        })
        .eq("id", booking.id);

      if (error) throw error;

      // Notify advertiser
      await supabase.from("notifications").insert({
        user_id: booking.advertiser_id,
        title: "Booking Approved! 🎉",
        message: `Your booking for "${booking.ad_spaces?.title}" has been approved. You can now proceed with your print order.`,
        type: "booking_approved",
      });

      toast({ title: "Booking Approved", description: "The advertiser has been notified." });
      fetchBookings();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to approve", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking) return;
    setProcessing(selectedBooking.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("activations")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || "No reason provided",
          reviewer_id: session?.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: selectedBooking.advertiser_id,
        title: "Booking Request Rejected",
        message: `Your booking for "${selectedBooking.ad_spaces?.title}" was declined. Reason: ${rejectionReason || "No reason provided"}.`,
        type: "booking_rejected",
      });

      toast({ title: "Booking Rejected", description: "The advertiser has been notified." });
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedBooking(null);
      fetchBookings();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to reject", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const pendingBookings = bookings.filter((b) => ["pending_submission", "pending_approval", "under_review"].includes(b.status));
  const approvedBookings = bookings.filter((b) => b.status === "approved");
  const printOrderBookings = bookings.filter((b) => ["printing", "payment_pending", "completed"].includes(b.status));
  const rejectedBookings = bookings.filter((b) => b.status === "rejected");

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const renderBookingRow = (booking: BookingActivation, showActions = false) => {
    const status = statusConfig[booking.status] || { label: booking.status, badgeClass: "" };
    const currency = booking.ad_spaces?.specifications?.currency || "PHP";
    const fee = booking.estimated_publisher_payout || booking.total_amount || 0;

    return (
      <TableRow key={booking.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            {booking.ad_design_url && (
              <div className="w-10 h-10 rounded-[10px] overflow-hidden flex-shrink-0 bg-muted">
                <img src={booking.ad_design_url} alt="Design" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{booking.ad_spaces?.title || "Unknown"}</p>
              {booking.ad_spaces?.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{booking.ad_spaces.location}
                </p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span className="capitalize text-sm">{booking.activation_type?.replace("_", " ") || "N/A"}</span>
        </TableCell>
        <TableCell>
          {booking.start_date && booking.end_date ? (
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-3 w-3" />
              {format(new Date(booking.start_date), "MMM d")} – {format(new Date(booking.end_date), "MMM d")}
            </div>
          ) : "—"}
        </TableCell>
        <TableCell>
          <span className="font-medium text-primary">
            {currency === "PHP" ? "₱" : "$"}{fee.toLocaleString()}
          </span>
        </TableCell>
        <TableCell>
          <Badge className={status.badgeClass}>{status.label}</Badge>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {booking.submitted_at ? format(new Date(booking.submitted_at), "MMM d, yyyy") : "—"}
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setPreviewBooking(booking)}>
              <Eye className="h-4 w-4" />
            </Button>
            {showActions && (
              <>
                <Button size="sm" onClick={() => handleApprove(booking)} disabled={processing === booking.id}>
                  {processing === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { setSelectedBooking(booking); setRejectDialogOpen(true); }} disabled={processing === booking.id}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderTable = (items: BookingActivation[], showActions = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Listing</TableHead>
          <TableHead>Ad Unit</TableHead>
          <TableHead>Schedule</TableHead>
          <TableHead>Fee</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
              No bookings in this category
            </TableCell>
          </TableRow>
        ) : items.map((b) => renderBookingRow(b, showActions))}
      </TableBody>
    </Table>
  );

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{pendingBookings.length}</CardTitle>
          </CardHeader>
          <CardContent><Clock className="w-4 h-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl text-green-600">{approvedBookings.length}</CardTitle>
          </CardHeader>
          <CardContent><CheckCircle className="w-4 h-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Print Orders</CardDescription>
            <CardTitle className="text-3xl text-indigo-600">{printOrderBookings.length}</CardTitle>
          </CardHeader>
          <CardContent><Package className="w-4 h-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-600">{rejectedBookings.length}</CardTitle>
          </CardHeader>
          <CardContent><XCircle className="w-4 h-4 text-muted-foreground" /></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="print-orders">
            Print Orders ({printOrderBookings.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Booking Requests</CardTitle>
              <CardDescription>Review and approve or reject advertiser booking submissions</CardDescription>
            </CardHeader>
            <CardContent>{renderTable(pendingBookings, true)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Bookings</CardTitle>
              <CardDescription>Bookings approved and awaiting print order</CardDescription>
            </CardHeader>
            <CardContent>{renderTable(approvedBookings)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="print-orders">
          <Card>
            <CardHeader>
              <CardTitle>Print Order Bookings</CardTitle>
              <CardDescription>Bookings with active print orders or completed</CardDescription>
            </CardHeader>
            <CardContent>{renderTable(printOrderBookings)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Bookings</CardTitle>
              <CardDescription>Previously rejected booking requests</CardDescription>
            </CardHeader>
            <CardContent>{renderTable(rejectedBookings)}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this booking. The advertiser will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Rejection Reason</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Dates unavailable, incomplete submission..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing !== null}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewBooking} onOpenChange={(open) => !open && setPreviewBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {previewBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Listing</p>
                  <p className="font-medium">{previewBooking.ad_spaces?.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{previewBooking.ad_spaces?.location || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ad Type</p>
                  <p className="font-medium capitalize">{previewBooking.activation_type?.replace("_", " ") || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-medium">{previewBooking.quantity || 1} units</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Schedule</p>
                  <p className="font-medium">
                    {previewBooking.start_date && previewBooking.end_date
                      ? `${format(new Date(previewBooking.start_date), "MMM d")} – ${format(new Date(previewBooking.end_date), "MMM d, yyyy")}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Booking Fee</p>
                  <p className="font-medium text-primary">
                    ₱{(previewBooking.estimated_publisher_payout || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              {previewBooking.ad_design_url && (
                <div className="rounded-[14px] overflow-hidden border border-border bg-muted">
                  <img src={previewBooking.ad_design_url} alt="Ad Design" className="w-full max-h-64 object-contain" />
                </div>
              )}
              {previewBooking.rejection_reason && (
                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-[14px]">
                  <p className="text-xs text-muted-foreground mb-1">Rejection Reason</p>
                  <p className="text-sm">{previewBooking.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
