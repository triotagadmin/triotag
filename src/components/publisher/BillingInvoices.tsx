import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Download, Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import jsPDF from "jspdf";

interface Order {
  id: string;
  product_name: string;
  total_price: number | null;
  order_status: string;
  created_at: string;
  quantity: number;
  product_sku: string;
}

interface BillingInvoicesProps {
  userId: string;
}

const ITEMS_PER_PAGE = 5;
type SortKey = "created_at" | "order_status" | "id";

const statusStyle = (status: string) => {
  switch (status) {
    case "completed": case "approved": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "pending": case "pending_review": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "rejected": case "cancelled": return "bg-destructive/20 text-destructive border-destructive/30";
    default: return "bg-muted text-muted-foreground";
  }
};

export const BillingInvoices = ({ userId }: BillingInvoicesProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("print_orders")
        .select("id, product_name, total_price, order_status, created_at, quantity, product_sku")
        .eq("advertiser_id", userId)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const filtered = useMemo(() => {
    let items = orders.filter((o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.product_name.toLowerCase().includes(search.toLowerCase())
    );
    items.sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return items;
  }, [orders, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageItems = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  };

  const downloadInvoice = (order: Order) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Invoice", 20, 30);
    doc.setFontSize(12);
    doc.text(`Invoice #: ${order.id.slice(0, 8).toUpperCase()}`, 20, 50);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 20, 60);
    doc.text(`Product: ${order.product_name}`, 20, 70);
    doc.text(`SKU: ${order.product_sku}`, 20, 80);
    doc.text(`Quantity: ${order.quantity}`, 20, 90);
    doc.text(`Status: ${order.order_status}`, 20, 100);
    doc.text(`Total: $${order.total_price ?? 0}`, 20, 110);
    doc.save(`invoice-${order.id.slice(0, 8)}.pdf`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Billing & Invoices
            </CardTitle>
            <CardDescription>Your payments and transaction history</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice #..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading billing data...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No invoices found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button onClick={() => toggleSort("id")} className="flex items-center gap-1 hover:text-foreground">
                        Invoice # <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1 hover:text-foreground">
                        Date <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>
                      <button onClick={() => toggleSort("order_status")} className="flex items-center gap-1 hover:text-foreground">
                        Status <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{o.product_name}</TableCell>
                      <TableCell>${o.total_price ?? 0}</TableCell>
                      <TableCell>
                        <Badge className={statusStyle(o.order_status)}>{o.order_status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => downloadInvoice(o)}>
                          <Download className="h-3 w-3 mr-1" />Invoice
                        </Button>
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
                <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
