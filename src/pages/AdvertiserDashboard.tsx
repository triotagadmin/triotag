import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { 
  BarChart3, 
  ShoppingCart, 
  Search, 
  Mail, 
  Receipt, 
  Settings,
  Plus,
  MapPin,
  Globe,
  Users,
  TrendingUp,
  Calendar,
  Printer,
  Ticket
} from "lucide-react";
import { Navigation } from "@/components/Navigation";

const AdvertiserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      // Verify user has advertiser role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      
      if (!roles || roles.role !== "advertiser") {
        navigate("/dashboard");
        return;
      }
      
      setUser(session.user);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;

      toast({
        title: "Verification email sent",
        description: "Please check your inbox for the verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, Advertiser!
          </h2>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        {user && !user.email_confirmed_at && (
          <Card className="mb-8 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
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
          </Card>
        )}

        {/* Overview Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Overview
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Active Campaigns
                </CardTitle>
                <CardDescription>Currently running ads</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">0</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Pending Approval
                </CardTitle>
                <CardDescription>Awaiting publisher response</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">0</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-5 w-5" />
                  Total Spent
                </CardTitle>
                <CardDescription>This month</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$0</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex gap-4 flex-wrap">
            <Button onClick={() => navigate("/campaign-builder")} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
            <Button onClick={() => navigate("/ticket-market")} size="lg" variant="secondary" className="gap-2">
              <Ticket className="h-4 w-4" />
              Ticket Creator
            </Button>
            <Button onClick={() => navigate("/order-prints")} size="lg" variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Order Print Materials
            </Button>
            <Button onClick={() => navigate("/publishers")} variant="outline" size="lg">
              Browse Publishers
            </Button>
          </div>
        </div>

        {/* My Campaigns Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            My Campaigns
          </h3>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Campaign Inventory</CardTitle>
                  <CardDescription>View and manage all your advertising campaigns</CardDescription>
                </div>
                <Button onClick={() => navigate("/campaign-builder")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No campaigns yet</p>
                <Button onClick={() => navigate("/campaign-builder")}>
                  Create Your First Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Bookings Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            My Bookings
          </h3>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No bookings yet</p>
                <Button onClick={() => navigate("/publishers")}>
                  Browse Ad Spaces
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Browse & Discover Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Search className="h-6 w-6" />
            Browse & Discover
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate("/publishers?type=venue")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Featured Venues
                </CardTitle>
                <CardDescription>
                  Physical locations for your ads
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate("/publishers?type=digital")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Digital Media
                </CardTitle>
                <CardDescription>
                  Online platforms and websites
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate("/publishers?type=agent")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Agent Publishers
                </CardTitle>
                <CardDescription>
                  Influencers, models, and artists
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Print Materials */}
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/order-prints")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Order Print Materials
              </CardTitle>
              <CardDescription>
                Create stickers, table tent ads, and more via Prodigi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Order professional print ad units</p>
              <Button variant="outline">
                Start Order
              </Button>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Messages
              </CardTitle>
              <CardDescription>
                Communication with publishers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No new messages</p>
              <Button variant="outline" className="mt-4" disabled>
                View Inbox
              </Button>
            </CardContent>
          </Card>

          {/* Billing */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Billing & Invoices
              </CardTitle>
              <CardDescription>
                Payments and transaction history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No invoices yet</p>
              <Button variant="outline" className="mt-4" disabled>
                View Billing
              </Button>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your profile and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled>
                Manage Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdvertiserDashboard;
