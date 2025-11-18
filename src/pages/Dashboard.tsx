import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

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
