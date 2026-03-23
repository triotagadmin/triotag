import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Copy, Eye, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClientCheckoutItem {
  id: string;
  token: string;
  client_name: string;
  client_email: string;
  client_company: string | null;
  listing_title: string | null;
  grand_total: number | null;
  status: string | null;
  created_at: string;
}

export const ClientCheckoutsList = () => {
  const [checkouts, setCheckouts] = useState<ClientCheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCheckouts();
  }, []);

  const loadCheckouts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("client_checkouts")
      .select("id, token, client_name, client_email, client_company, listing_title, grand_total, status, created_at")
      .eq("print_partner_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCheckouts(data as ClientCheckoutItem[]);
    }
    setLoading(false);
  };

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/checkout/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link Copied!", description: "Checkout link copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: url, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-primary/20 text-primary"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case "awaiting_client_payment":
        return <Badge variant="secondary">Awaiting Payment</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (checkouts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No client checkout pages yet. Generate one during the ad space booking flow.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Client Checkout Pages</CardTitle>
        <CardDescription>Manage checkout links generated for your clients.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {checkouts.map((c) => (
          <div key={c.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{c.client_name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.listing_title || "Campaign"} · {c.client_company || c.client_email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(c.status)}
                <span className="font-bold text-sm text-primary">
                  ₱{(c.grand_total ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => copyLink(c.token)}>
                <Copy className="h-3 w-3 mr-1" />Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/checkout/${c.token}`, "_blank")}
              >
                <Eye className="h-3 w-3 mr-1" />Preview
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
