import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Navigation } from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Loader2,
  Package,
  Eye,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";

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
  campaign_objective: string | null;
  brand_category: string | null;
  ad_spaces: {
    title: string;
    location: string | null;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_submission: { label: "Pending Review", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: <Clock className="h-4 w-4" /> },
  under_review: { label: "Under Review", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <Search className="h-4 w-4" /> },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: <CheckCircle className="h-4 w-4" /> },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: <XCircle className="h-4 w-4" /> },
  design: { label: "Draft", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: <Package className="h-4 w-4" /> },
  pending_approval: { label: "Pending Approval", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: <Clock className="h-4 w-4" /> },
  printing: { label: "Printing", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: <Package className="h-4 w-4" /> },
  payment_pending: { label: "Payment Pending", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: <Clock className="h-4 w-4" /> },
  completed: { label: "Completed", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: <CheckCircle className="h-4 w-4" /> },
};

export default function PublisherAdRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AdRequest[]>([]);
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

      // Check if user is a publisher and get their profile id
      const { data: profile } = await supabase
        .from("publisher_profiles")
        .select("id, publisher_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!profile) {
        toast({
          title: "Access Denied",
          description: "This page is only for publishers.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsPublisher(true);
      // Pass the publisher profile id (not user id) for querying activations
      await fetchRequests(profile.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async (publisherProfileId: string) => {
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
          campaign_objective,
          brand_category,
          ad_spaces (
            title,
            location
          )
        `)
        .eq("publisher_id", publisherProfileId)
        .order("submitted_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Show all requests that have been submitted (have a design URL)
      const validRequests = (data || []).filter(
        (r) => r.status !== "design" || r.ad_design_url
      );
      setRequests(validRequests);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load ad requests",
        variant: "destructive",
      });
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!isPublisher) return;

    const channel = supabase
      .channel("publisher-ad-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activations",
        },
        async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Get publisher profile id first
            const { data: profile } = await supabase
              .from("publisher_profiles")
              .select("id")
              .eq("user_id", session.user.id)
              .maybeSingle();
            if (profile) {
              await fetchRequests(profile.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isPublisher]);

  const pendingCount = requests.filter((r) => ["pending_submission", "under_review", "pending_approval", "payment_pending", "printing"].includes(r.status)).length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;
  const completedCount = requests.filter((r) => r.status === "completed").length;

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
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/venue-publishers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Ad Requests</h1>
            <p className="text-muted-foreground mt-1">
              Review and manage advertiser booking submissions
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-full">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-full">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rejectedCount}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
          </TabsList>

          {["all", "pending", "approved", "completed", "rejected"].map((tab) => {
            const filtered = tab === "all" ? requests
              : tab === "pending" ? requests.filter((r) => ["pending_submission", "under_review", "pending_approval", "payment_pending", "printing"].includes(r.status))
              : tab === "completed" ? requests.filter((r) => r.status === "completed")
              : requests.filter((r) => r.status === tab);

            return (
              <TabsContent key={tab} value={tab}>
                <Card>
                  <CardContent className="pt-6">
                    {filtered.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Requests</h3>
                        <p className="text-muted-foreground">
                          No ad requests in this category.
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Venue</TableHead>
                            <TableHead>Ad Unit</TableHead>
                            <TableHead>Schedule</TableHead>
                            <TableHead>Booking Fee</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((request) => {
                            const statusInfo = statusConfig[request.status] || statusConfig.design;
                            return (
                              <TableRow
                                key={request.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => navigate(`/publisher/ad-requests/${request.id}`)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    {request.ad_design_url && (
                                      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-muted">
                                        <img
                                          src={request.ad_design_url}
                                          alt="Creative"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium">{request.ad_spaces?.title || "Unknown"}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {request.ad_spaces?.location}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="capitalize">
                                    {request.activation_type?.replace("_", " ") || "N/A"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {request.start_date && request.end_date ? (
                                    <div className="flex items-center gap-1 text-sm">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(request.start_date), "MMM d")} -{" "}
                                      {format(new Date(request.end_date), "MMM d")}
                                    </div>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium text-primary">
                                    ₱{(request.estimated_publisher_payout || 0).toLocaleString()}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge className={statusInfo.color}>
                                    {statusInfo.icon}
                                    <span className="ml-1">{statusInfo.label}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {request.submitted_at
                                    ? format(new Date(request.submitted_at), "MMM d, yyyy")
                                    : format(new Date(request.created_at), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
