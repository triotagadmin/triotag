import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Globe, TrendingUp, DollarSign, Upload, CheckCircle, Clock, XCircle, FileText } from "lucide-react";

const DigitalMediaDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [adSpaces, setAdSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch publisher profile
      const { data: profileData, error: profileError } = await supabase
        .from("publisher_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profileError) {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
        return;
      }

      setProfile(profileData);

      // Fetch ad spaces
      const { data: spacesData } = await supabase
        .from("ad_spaces")
        .select("*")
        .eq("publisher_id", profileData.id)
        .order("created_at", { ascending: false });

      setAdSpaces(spacesData || []);
      setLoading(false);
    };

    fetchData();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case "pending":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const activeProperties = adSpaces.filter(s => s.approval_status === "approved").length;
  const pendingProperties = adSpaces.filter(s => s.approval_status === "pending").length;

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="bg-card border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-bold text-xl">Tiny Sticky Ads</h1>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-2">Digital Media Dashboard</h2>
            <p className="text-xl text-muted-foreground">{profile?.business_name}</p>
            <div className="mt-2">{getStatusBadge(profile?.verification_status)}</div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Digital Properties</CardTitle>
              <CardDescription>Active platforms and channels</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">{activeProperties}</p>
              <p className="text-sm text-muted-foreground">{pendingProperties} pending verification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Performance</CardTitle>
              <CardDescription>Total impressions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">0</p>
              <p className="text-sm text-muted-foreground">No data yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>Earnings this month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">$0</p>
              <p className="text-sm text-muted-foreground">0 orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Manage Digital Ad Spots */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manage Digital Ad Spots</CardTitle>
                <CardDescription>Add and manage your digital advertising placements</CardDescription>
              </div>
              <Button onClick={() => navigate("/digital-media/register")}>
                <Upload className="w-4 h-4 mr-2" />
                Add New Property
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {adSpaces.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
                <p className="text-muted-foreground mb-4">Add your first digital property to start earning</p>
                <Button onClick={() => navigate("/digital-media/register")}>Add Your First Property</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {adSpaces.map((space) => (
                  <div key={space.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{space.title}</h4>
                      <p className="text-sm text-muted-foreground">{space.description}</p>
                      <div className="mt-2 flex gap-2">
                        {getStatusBadge(space.approval_status)}
                        <Badge variant="outline">{space.availability_status}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Analytics</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Ownership Verification */}
        {profile?.verification_status === "pending" && (
          <Card className="mb-8 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">Account Verification Required</CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                Upload proof of platform ownership to get verified
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/digital-media/verify")}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Verification Screenshots
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bookings / Orders */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Active Orders</CardTitle>
            <CardDescription>Manage incoming advertiser orders and deliverables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active orders</p>
            </div>
          </CardContent>
        </Card>

        {/* Payouts */}
        <Card>
          <CardHeader>
            <CardTitle>Payouts</CardTitle>
            <CardDescription>Digital earnings and payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm font-medium">Available Balance</span>
                <span className="text-lg font-bold">$0.00</span>
              </div>
              <Button variant="outline" className="w-full" disabled>
                Request Withdrawal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DigitalMediaDashboard;
