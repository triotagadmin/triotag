import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, Search, DollarSign, Users, TrendingUp, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface TicketSale {
  id: string;
  ticket_id: string;
  buyer_name: string;
  buyer_email: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  currency: string;
  serial_number: string;
  payment_status: string;
  created_at: string;
  tickets?: {
    title: string;
    event_date: string;
  };
}

export default function AdminTicketSales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<TicketSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in");
        navigate("/admin");
        return;
      }

      const { data: adminProfile } = await supabase
        .from("admin_profiles")
        .select("status")
        .eq("user_id", session.user.id)
        .single();

      if (!adminProfile || adminProfile.status !== "verified") {
        toast.error("Admin access required");
        navigate("/admin");
        return;
      }

      fetchSales();
    } catch (error) {
      console.error("Error:", error);
      navigate("/admin");
    }
  };

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from("ticket_sales")
        .select(`
          *,
          tickets (
            title,
            event_date
          )
        `)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.buyer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.tickets?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalTicketsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const uniqueBuyers = new Set(sales.map(sale => sale.buyer_email)).size;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-pulse text-primary">Loading sales data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Ticket Sales</h1>
            <p className="text-muted-foreground">View all successful ticket purchases</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-primary" />
                ₱{totalRevenue.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tickets Sold</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Ticket className="w-6 h-6 text-primary" />
                {totalTicketsSold}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unique Buyers</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                {uniqueBuyers}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by buyer, email, serial number, or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales History</CardTitle>
            <CardDescription>
              {filteredSales.length} of {sales.length} sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSales.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No sales found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="text-sm">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{sale.tickets?.title || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">
                            {sale.tickets?.event_date
                              ? new Date(sale.tickets.event_date).toLocaleDateString()
                              : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{sale.buyer_name}</p>
                          <p className="text-xs text-muted-foreground">{sale.buyer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {sale.serial_number}
                        </code>
                      </TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell className="font-semibold">
                        {sale.currency} {sale.total_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Paid</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
