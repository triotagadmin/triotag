import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive, Eye, Download, Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import jsPDF from "jspdf";

interface Booking {
  id: string;
  ad_space_id: string;
  advertiser_id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  total_amount: number | null;
  created_at: string | null;
  ad_unit_sku: string | null;
  campaign_objective: string | null;
  brand_category: string | null;
  quantity: number | null;
  ad_space_title?: string;
}

interface BookingsArchiveProps {
  publisherProfileId: string;
}

const ITEMS_PER_PAGE = 5;

type SortKey = "created_at" | "status" | "ad_space_title";
type SortDir = "asc" | "desc";

const statusColor = (status: string) => {
  switch (status) {
    case "completed": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "approved": case "in_production": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "rejected": case "cancelled": return "bg-destructive/20 text-destructive border-destructive/30";
    default: return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  }
};

export const BookingsArchive = ({ publisherProfileId }: BookingsArchiveProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from("activations")
        .select("*, ad_spaces(title)")
        .eq("publisher_id", publisherProfileId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setBookings(
          data.map((b: any) => ({
            ...b,
            ad_space_title: b.ad_spaces?.title || "Unknown",
          }))
        );
      }
      setLoading(false);
    };
    fetchBookings();
  }, [publisherProfileId]);

  const filtered = useMemo(() => {
    let items = bookings.filter((b) =>
      b.ad_space_title?.toLowerCase().includes(search.toLowerCase()) ||
      b.status.toLowerCase().includes(search.toLowerCase())
    );
    items.sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return items;
  }, [bookings, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageItems = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  };

  const downloadReceipt = (booking: Booking) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Booking Receipt", 20, 30);
    doc.setFontSize(12);
    doc.text(`Booking ID: ${booking.id.slice(0, 8).toUpperCase()}`, 20, 50);
    doc.text(`Listing: ${booking.ad_space_title}`, 20, 60);
    doc.text(`Status: ${booking.status}`, 20, 70);
    doc.text(`Date Booked: ${booking.created_at ? new Date(booking.created_at).toLocaleDateString() : "N/A"}`, 20, 80);
    doc.text(`Start Date: ${booking.start_date || "N/A"}`, 20, 90);
    doc.text(`End Date: ${booking.end_date || "N/A"}`, 20, 100);
    doc.text(`Amount: $${booking.total_amount ?? 0}`, 20, 110);
    doc.text(`Quantity: ${booking.quantity ?? "N/A"}`, 20, 120);
    doc.text(`Campaign Objective: ${booking.campaign_objective || "N/A"}`, 20, 130);
    doc.save(`receipt-${booking.id.slice(0, 8)}.pdf`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-primary" />
              Ad Space Bookings Archive
            </CardTitle>
            <CardDescription>All past and current ad space bookings</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading bookings...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No bookings found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button onClick={() => toggleSort("ad_space_title")} className="flex items-center gap-1 hover:text-foreground">
                        Listing Name <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1 hover:text-foreground">
                        Date Booked <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort("status")} className="flex items-center gap-1 hover:text-foreground">
                        Status <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.ad_space_title}</TableCell>
                      <TableCell>{b.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <Badge className={statusColor(b.status)}>{b.status}</Badge>
                      </TableCell>
                      <TableCell>${b.total_amount ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedBooking(b)}>
                            <Eye className="h-3 w-3 mr-1" />View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => downloadReceipt(b)}>
                            <Download className="h-3 w-3 mr-1" />Receipt
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-3 pt-2">
              <DetailRow label="Booking ID" value={selectedBooking.id.slice(0, 8).toUpperCase()} />
              <DetailRow label="Listing" value={selectedBooking.ad_space_title || "—"} />
              <DetailRow label="Status" value={selectedBooking.status} />
              <DetailRow label="Date Booked" value={selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleDateString() : "—"} />
              <DetailRow label="Start Date" value={selectedBooking.start_date || "—"} />
              <DetailRow label="End Date" value={selectedBooking.end_date || "—"} />
              <DetailRow label="Amount" value={`$${selectedBooking.total_amount ?? 0}`} />
              <DetailRow label="Quantity" value={String(selectedBooking.quantity ?? "—")} />
              <DetailRow label="Ad Unit SKU" value={selectedBooking.ad_unit_sku || "—"} />
              <DetailRow label="Campaign Objective" value={selectedBooking.campaign_objective || "—"} />
              <DetailRow label="Brand Category" value={selectedBooking.brand_category || "—"} />
              <div className="pt-2">
                <Button onClick={() => downloadReceipt(selectedBooking)} className="w-full">
                  <Download className="h-4 w-4 mr-2" />Download Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium capitalize">{value}</span>
  </div>
);
