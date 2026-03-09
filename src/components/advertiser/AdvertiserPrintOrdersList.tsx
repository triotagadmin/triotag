import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { format } from "date-fns";

interface PrintOrder {
  id: string;
  branch_ids: string[];
  materials: Array<{ type: string; quantity: number; notes?: string }>;
  notes: string | null;
  status: string;
  created_at: string;
}

interface Branch {
  id: string;
  branch_name: string | null;
  full_address: string;
}

interface AdvertiserPrintOrdersListProps {
  userId: string;
}

const statusColor = (status: string) => {
  switch (status) {
    case "pending": return "secondary";
    case "processing": return "default";
    case "shipped": return "default";
    case "completed": return "default";
    default: return "secondary";
  }
};

export const AdvertiserPrintOrdersList = ({ userId }: AdvertiserPrintOrdersListProps) => {
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [ordersRes, branchesRes] = await Promise.all([
      supabase
        .from("advertiser_print_orders")
        .select("*")
        .eq("advertiser_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("advertiser_branches")
        .select("id, branch_name, full_address")
        .eq("advertiser_id", userId),
    ]);
    setOrders((ordersRes.data as any[]) || []);
    setBranches(branchesRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`adv-orders-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "advertiser_print_orders",
        filter: `advertiser_id=eq.${userId}`,
      }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const getBranchLabel = (id: string) => {
    const b = branches.find((br) => br.id === id);
    return b?.branch_name || b?.full_address?.substring(0, 30) || id.substring(0, 8);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading orders...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          Print Orders
        </CardTitle>
        <CardDescription>Track your submitted print orders</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No print orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    #{order.id.substring(0, 8).toUpperCase()} · {format(new Date(order.created_at), "MMM d, yyyy")}
                  </span>
                  <Badge variant={statusColor(order.status) as any}>
                    {order.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {order.branch_ids.map((bid) => (
                    <Badge key={bid} variant="outline" className="text-xs">
                      {getBranchLabel(bid)}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm space-y-0.5">
                  {order.materials.map((m: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{m.type}{m.notes ? ` (${m.notes})` : ""}</span>
                      <span className="font-medium">x{m.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
