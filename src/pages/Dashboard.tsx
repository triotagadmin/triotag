import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { MapPin, Globe, Users } from "lucide-react";

const Dashboard = () => {
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

  const userType = user?.user_metadata?.user_type || "advertiser";

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {userType.charAt(0).toUpperCase() + userType.slice(1)}!
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

        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Publisher Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-all group" onClick={() => navigate("/venue")}>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">Venue</CardTitle>
                <CardDescription>Manage physical venue locations and ad spaces</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Explore Venues</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all group" onClick={() => navigate("/digital-media")}>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">Digital Media</CardTitle>
                <CardDescription>Monetize your digital properties and content</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Explore Digital Media</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all group" onClick={() => navigate("/agent-publishers")}>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">Agent Publishers</CardTitle>
                <CardDescription>Work with freelance guerrilla agents, influencers, models, and artists</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Explore Agent Publishers</Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userType === "advertiser" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Create Campaign</CardTitle>
                  <CardDescription>Launch a new advertising campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Get Started</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Active Campaigns</CardTitle>
                  <CardDescription>Manage your running campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">campaigns active</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>View campaign performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">View Reports</Button>
                </CardContent>
              </Card>
            </>
          )}

          {(userType === "venue" || userType === "agent" || userType === "digital") && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Ad Slots</CardTitle>
                  <CardDescription>Manage your available ad spaces</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Add Slot</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Earnings</CardTitle>
                  <CardDescription>Track your revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">$0.00</p>
                  <p className="text-sm text-muted-foreground">total earnings</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Verification Status</CardTitle>
                  <CardDescription>Complete your publisher profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">Get Verified</Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
