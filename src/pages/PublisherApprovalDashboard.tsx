import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Calendar, ClipboardCheck, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { ApprovalQueue } from "@/components/publisher/ApprovalQueue";
import { PublisherCalendar } from "@/components/publisher/PublisherCalendar";
import { AdRequestsQueue } from "@/components/publisher/AdRequestsQueue";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Activation {
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
  ad_spaces: {
    title: string;
    location: string | null;
  } | null;
}

export default function PublisherApprovalDashboard() {
  const [loading, setLoading] = useState(true);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [isPublisher, setIsPublisher] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is a publisher (venue type)
      const { data: profile } = await supabase
        .from("publisher_profiles")
        .select("id, publisher_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!profile || profile.publisher_type !== "venue") {
        toast({
          title: "Access Denied",
          description: "This dashboard is only for venue publishers.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsPublisher(true);
      await fetchActivations(session.user.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivations = async (userId: string) => {
    try {
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
          ad_spaces (
            title,
            location
          )
        `)
        .eq("publisher_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setActivations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load activations",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetchActivations(session.user.id);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!isPublisher) return;

    const channel = supabase
      .channel('publisher-activations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activations',
        },
        async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await fetchActivations(session.user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isPublisher]);

  const pendingCount = activations.filter(a => a.status === "pending_approval").length;
  const completedCount = activations.filter(a => a.status === "completed").length;
  const adRequestsCount = activations.filter(a => 
    ["pending_submission", "under_review", "design"].includes(a.status) && a.ad_design_url
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Publisher Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage ad requests, bookings, and view your venue calendar
            </p>
          </div>
          <Button onClick={() => navigate("/publisher/ad-requests")} variant="outline">
            <Package className="h-4 w-4 mr-2" />
            View All Ad Requests
          </Button>
        </div>

        <Tabs defaultValue="ad-requests" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="ad-requests" className="relative">
              <Package className="h-4 w-4 mr-2" />
              Ad Requests
              {adRequestsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {adRequestsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approvals" className="relative">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Approval Queue
              {pendingCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Venue Calendar
              {completedCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2"
                >
                  {completedCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ad-requests">
            <AdRequestsQueue 
              requests={activations} 
              onStatusChange={handleStatusChange}
            />
          </TabsContent>

          <TabsContent value="approvals">
            <ApprovalQueue 
              activations={activations.filter(a => a.status === "pending_approval")} 
              onStatusChange={handleStatusChange}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <PublisherCalendar activations={activations} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
