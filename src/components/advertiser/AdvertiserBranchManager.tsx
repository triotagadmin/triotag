import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Printer, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface PrintOrderRecord {
  id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  total_price: number | null;
  order_status: string;
  design_url: string;
  shipping_address: any;
  created_at: string;
  admin_notes: string | null;
  activation_id: string | null;
}

interface AssociatedListing {
  id: string;
  title: string;
}

interface AdvertiserBranchManagerProps {
  userId: string;
  associatedListings?: AssociatedListing[];
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  pending_admin: { label: "Pending Review", variant: "secondary", icon: Clock },
  in_production: { label: "In Production", variant: "default", icon: Printer },
  shipped: { label: "Shipped", variant: "default", icon: Package },
  delivered: { label: "Delivered", variant: "default", icon: CheckCircle },
};

export const AdvertiserBranchManager = ({ userId }: AdvertiserBranchManagerProps) => {
  const [orders, setOrders] = useState<PrintOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("print_orders")
      .select("*")
      .eq("advertiser_id", userId)
      .in("order_status", ["pending_admin", "in_production"])
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching print orders:", error);
    else setOrders((data as PrintOrderRecord[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel(`adv-print-orders-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "print_orders" }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  if (loading) return <p className="text-muted-foreground text-sm">Loading print orders...</p>;

  const pendingOrders = orders.filter(o => o.order_status === "pending_admin");
  const approvedOrders = orders.filter(o => o.order_status === "in_production");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Printer className="h-5 w-5" />
          Print Orders
        </CardTitle>
        <CardDescription>
          Track your pending and approved print orders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-1">No active print orders</p>
            <p className="text-xs text-muted-foreground">
              Print orders created during ad activation will appear here.
            </p>
          </div>
        ) : (
          <>
            {pendingOrders.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Pending Review ({pendingOrders.length})
                </h4>
                {pendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}

            {approvedOrders.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2 text-primary">
                  <CheckCircle className="h-4 w-4" />
                  Approved ({approvedOrders.length})
                </h4>
                {approvedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

function OrderCard({ order }: { order: PrintOrderRecord }) {
  const config = statusConfig[order.order_status] || statusConfig.pending_review;
  const StatusIcon = config.icon;

  return (
    <div className="p-3 border rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          #{order.id.substring(0, 8).toUpperCase()} · {format(new Date(order.created_at), "MMM d, yyyy")}
        </span>
        <Badge variant={config.variant} className="gap-1">
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{order.product_name}</span>
        <span className="text-sm font-medium">×{order.quantity}</span>
      </div>
      {order.total_price != null && (
        <p className="text-xs text-muted-foreground">
          Total: ${order.total_price.toFixed(2)}
        </p>
      )}
      {order.admin_notes && (
        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          Admin: {order.admin_notes}
        </p>
      )}
    </div>
  );
}
