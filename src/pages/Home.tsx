import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MapPin, Zap, Target, BarChart3 } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      setUserRole(roles?.role || null);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section - Role Specific */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-6">
          {userRole === "advertiser" ? (
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <Badge className="mb-4">Advertiser Dashboard</Badge>
              <h1 className="text-5xl md:text-6xl font-bold">
                Discover Perfect Ad Spaces
              </h1>
              <p className="text-xl text-muted-foreground">
                Connect with verified venue publishers for high-visibility advertising
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/publishers")}>
                  <Target className="mr-2 w-5 h-5" />
                  Explore Publishers
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/advertiser-dashboard")}>
                  <BarChart3 className="mr-2 w-5 h-5" />
                  My Campaigns
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <Badge className="mb-4">Publisher Dashboard</Badge>
              <h1 className="text-5xl md:text-6xl font-bold">
                Monetize Your Space
              </h1>
              <p className="text-xl text-muted-foreground">
                Explore campaign proposals and connect with advertisers looking for your unique audience
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/dashboard")}>
                  <Zap className="mr-2 w-5 h-5" />
                  View Proposals
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/dashboard")}>
                  <TrendingUp className="mr-2 w-5 h-5" />
                  My Spaces
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold">2.5K+</CardTitle>
                <CardDescription>Active Publishers</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold">5.2K+</CardTitle>
                <CardDescription>Ad Campaigns</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold">$1.2M</CardTitle>
                <CardDescription>Revenue Generated</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold">98%</CardTitle>
                <CardDescription>Satisfaction Rate</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Content Section - Role Specific */}
      {userRole === "advertiser" ? (
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Find Your Perfect Publisher Match
              </h2>
              <p className="text-lg text-muted-foreground">
                Connect with venue publishers for high-visibility advertising
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <Card className="cursor-pointer hover:shadow-lg transition-all group" onClick={() => navigate("/publishers?type=venue")}>
                <CardHeader>
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl group-hover:text-primary transition-colors">Venue Publishers</CardTitle>
                  <CardDescription className="text-base">
                    Physical locations with high foot traffic - cafes, metros, bathrooms, and more
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• High visibility placements</li>
                    <li>• Local audience targeting</li>
                    <li>• Real-world engagement</li>
                  </ul>
                  <Button className="w-full mt-4">Explore Venues</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Campaign Opportunities Waiting
              </h2>
              <p className="text-lg text-muted-foreground">
                Connect with advertisers looking for spaces like yours
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="cursor-pointer hover:shadow-lg transition-all">
                <CardHeader>
                  <Badge className="w-fit mb-2">Active Proposals</Badge>
                  <CardTitle className="text-2xl">Browse Campaign Requests</CardTitle>
                  <CardDescription className="text-base">
                    View advertiser proposals matched to your space type and audience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold text-sm">12 New Proposals</p>
                      <p className="text-xs text-muted-foreground">Matched to your profile</p>
                    </div>
                  </div>
                  <Button className="w-full">View All Proposals</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all">
                <CardHeader>
                  <Badge className="w-fit mb-2" variant="outline">Optimization</Badge>
                  <CardTitle className="text-2xl">Improve Your Listing</CardTitle>
                  <CardDescription className="text-base">
                    Get more campaign proposals by optimizing your publisher profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold text-sm">Profile Completeness</p>
                      <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-3/4"></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">75% Complete</p>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">Optimize Profile</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Home;