import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Eye, Globe, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";

interface AdSpace {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  approval_status: string;
  availability_status: string | null;
  pricing: any;
  specifications: any;
  media_urls: any;
}

const DigitalInventory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adSpaces, setAdSpaces] = useState<AdSpace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdSpaces();
  }, []);

  const fetchAdSpaces = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("publisher_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("publisher_type", "digital")
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        toast({
          title: "Profile not found",
          description: "Please complete your digital publisher profile first.",
          variant: "destructive",
        });
        navigate("/digital-service-registration");
        return;
      }

      const { data, error } = await supabase
        .from("ad_spaces")
        .select("*")
        .eq("publisher_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAdSpaces(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const approvedSpaces = adSpaces.filter(space => space.approval_status === "approved");
  const pendingSpaces = adSpaces.filter(space => space.approval_status === "pending");
  const rejectedSpaces = adSpaces.filter(space => space.approval_status === "rejected");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Digital Ad Inventory</h1>
            <p className="text-muted-foreground">Manage your digital ad spaces</p>
          </div>
          <Button onClick={() => navigate("/digital-service-registration")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Digital Property
          </Button>
        </div>

        <Tabs defaultValue="approved" className="space-y-6">
          <TabsList>
            <TabsTrigger value="approved">
              Approved ({approvedSpaces.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingSpaces.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedSpaces.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approved" className="space-y-4">
            {approvedSpaces.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No approved digital properties yet</p>
                    <Button onClick={() => navigate("/digital-service-registration")}>
                      Add Your First Property
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {approvedSpaces.map((space) => (
                  <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {space.media_urls && space.media_urls[0] && (
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        <img
                          src={space.media_urls[0]}
                          alt={space.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-1">{space.title}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">
                            {space.description}
                          </CardDescription>
                        </div>
                        {getStatusBadge(space.approval_status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {space.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Globe className="h-4 w-4" />
                            <span className="line-clamp-1">{space.location}</span>
                          </div>
                        )}
                        {space.pricing && (
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <DollarSign className="h-4 w-4" />
                            <span>
                              {space.pricing.weekly && `$${space.pricing.weekly}/week`}
                              {space.pricing.monthly && ` • $${space.pricing.monthly}/month`}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1 gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-2">
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingSpaces.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No pending properties</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingSpaces.map((space) => (
                  <Card key={space.id} className="overflow-hidden">
                    {space.media_urls && space.media_urls[0] && (
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        <img
                          src={space.media_urls[0]}
                          alt={space.title}
                          className="w-full h-full object-cover opacity-60"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="line-clamp-1">{space.title}</CardTitle>
                        {getStatusBadge(space.approval_status)}
                      </div>
                      <CardDescription>Awaiting admin approval</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedSpaces.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No rejected properties</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rejectedSpaces.map((space) => (
                  <Card key={space.id} className="overflow-hidden border-destructive">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="line-clamp-1">{space.title}</CardTitle>
                        {getStatusBadge(space.approval_status)}
                      </div>
                      <CardDescription className="text-destructive">
                        This property was rejected
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DigitalInventory;
