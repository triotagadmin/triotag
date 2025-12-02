import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Briefcase, DollarSign, Upload, CheckCircle, Clock, XCircle, IdCard } from "lucide-react";
const AgentDashboard = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Fetch publisher profile
      const {
        data: profileData,
        error: profileError
      } = await supabase.from("publisher_profiles").select("*").eq("user_id", session.user.id).single();
      if (profileError) {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive"
        });
        return;
      }
      setProfile(profileData);
      setLoading(false);
    };
    fetchData();
  }, [navigate, toast]);
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  const handleResendVerification = async () => {
    if (!user?.email) return;
    const {
      error
    } = await supabase.auth.resend({
      type: 'signup',
      email: user.email
    });
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Verification email sent!"
      });
    }
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
  const getRoleLabel = (role: string | null) => {
    if (!role) return "Agent";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>;
  }
  return <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-2">Agent Dashboard</h2>
            <p className="text-xl text-muted-foreground">{profile?.business_name}</p>
            <div className="mt-2 flex gap-2">
              {getStatusBadge(profile?.verification_status)}
              <Badge variant="outline">{getRoleLabel(profile?.agent_role)}</Badge>
            </div>
          </div>
        </div>

        {/* Email Verification Warning */}
        {!user?.email_confirmed_at && <Card className="mb-8 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">Email Verification Required</CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                Please verify your email address to access all features. Check your inbox for the verification link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleResendVerification} variant="outline">
                Resend Verification Email
              </Button>
            </CardContent>
          </Card>}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Agent Profile</CardTitle>
              <CardDescription>Your skills and service areas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{profile?.description || "No description yet"}</p>
              <Button variant="outline" size="sm" className="mt-2">Edit Profile</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Active Jobs</CardTitle>
              <CardDescription>Current assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">0</p>
              <p className="text-sm text-muted-foreground">No active jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Earnings</CardTitle>
              <CardDescription>Total this month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">$0</p>
              <p className="text-sm text-muted-foreground">0 completed jobs</p>
            </CardContent>
          </Card>
        </div>

        {/* Manage Agent Services */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manage Agent Services</CardTitle>
                <CardDescription>Add and update your available services and rates</CardDescription>
              </div>
              <Button onClick={() => navigate("/agent-inventory")}>
                <Upload className="w-4 h-4 mr-2" />
                View Full Inventory
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Manage your services</h3>
              <p className="text-muted-foreground mb-4">View and manage all your agent services in one place</p>
              <Button onClick={() => navigate("/agent-inventory")}>Go to Inventory</Button>
            </div>
          </CardContent>
        </Card>

        {/* Verification */}
        {profile?.verification_status === "pending" && <Card className="mb-8 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">Verification Required</CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                Complete your verification to start accepting jobs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <IdCard className="w-5 h-5 text-yellow-800 dark:text-yellow-200" />
                <span className="text-sm">Upload ID Verification</span>
                <Button size="sm" variant="outline" onClick={() => navigate("/agent/verify")}>Upload</Button>
              </div>
              <div className="flex items-center gap-3">
                
                
                
              </div>
            </CardContent>
          </Card>}

        {/* Jobs / Tasks */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Available Jobs</CardTitle>
            <CardDescription>Browse and accept job opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No jobs available</p>
              <p className="text-sm text-muted-foreground mt-2">Complete your verification to see job listings</p>
            </div>
          </CardContent>
        </Card>

        {/* Payouts */}
        <Card>
          <CardHeader>
            <CardTitle>Payouts</CardTitle>
            <CardDescription>Earnings and transaction history</CardDescription>
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
    </div>;
};
export default AgentDashboard;