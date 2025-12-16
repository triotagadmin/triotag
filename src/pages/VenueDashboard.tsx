import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, DollarSign, Calendar, Upload, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, Edit, Eye } from "lucide-react";

const VenueDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [adSpaces, setAdSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const ITEMS_PER_SLIDE = 3;
  const totalSlides = Math.max(1, Math.ceil(adSpaces.length / ITEMS_PER_SLIDE));

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Fetch publisher profile
      const { data: profileData, error: profileError } = await supabase
        .from("publisher_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile error:", profileError);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!profileData) {
        // No profile exists, redirect to complete profile
        toast({
          title: "Profile Required",
          description: "Please complete your profile setup.",
        });
        navigate("/complete-profile");
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

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Verification email sent!",
      });
    }
  };

  const handleEditSpace = (spaceId: string) => {
    navigate(`/venue-inventory?edit=${spaceId}`);
  };

  const handleViewSpace = (spaceId: string) => {
    navigate(`/venue/${spaceId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "pending":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCurrentSlideSpaces = () => {
    const start = currentSlide * ITEMS_PER_SLIDE;
    return adSpaces.slice(start, start + ITEMS_PER_SLIDE);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const activeSpaces = adSpaces.filter(s => s.approval_status === "approved" && s.availability_status === "available").length;
  const pendingSpaces = adSpaces.filter(s => s.approval_status === "pending").length;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-2">Venue Dashboard</h2>
            <p className="text-xl text-muted-foreground">{profile?.business_name}</p>
            <div className="mt-2">{getStatusBadge(profile?.verification_status)}</div>
          </div>
        </div>

        {/* Email Verification Warning */}
        {!user?.email_confirmed_at && (
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

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Ad Spaces</CardTitle>
              <CardDescription>Active and available spaces</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">{activeSpaces}</p>
              <p className="text-sm text-muted-foreground">{pendingSpaces} pending approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Earnings</CardTitle>
              <CardDescription>Total revenue this month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">$0</p>
              <p className="text-sm text-muted-foreground">0 bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>Active bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-2">0</p>
              <p className="text-sm text-muted-foreground">No active bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Manage Ad Spaces - Horizontal Slider */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manage Venue Ad Spaces</CardTitle>
                <CardDescription>Add, edit, and manage your advertising spaces</CardDescription>
              </div>
              <Button onClick={() => navigate("/venue-inventory")}>
                <Upload className="w-4 h-4 mr-2" />
                View Full Inventory
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {adSpaces.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No ad spaces yet</h3>
                <p className="text-muted-foreground mb-4">Create your first ad space to start accepting bookings</p>
                <Button onClick={() => navigate("/venue/register")}>Add Your First Space</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Carousel Navigation */}
                {totalSlides > 1 && (
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Button variant="outline" size="icon" onClick={prevSlide}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalSlides }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <Button variant="outline" size="icon" onClick={nextSlide}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Horizontal Slider */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getCurrentSlideSpaces().map((space) => (
                    <Card key={space.id} className="overflow-hidden">
                      {Array.isArray(space.media_urls) && space.media_urls[0] && (
                        <div className="h-32 overflow-hidden">
                          <img 
                            src={space.media_urls[0]} 
                            alt={space.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold truncate">{space.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">{space.location}</p>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {getStatusBadge(space.approval_status)}
                          <Badge variant="outline">{space.availability_status}</Badge>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleEditSpace(space.id)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleViewSpace(space.id)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {adSpaces.length > ITEMS_PER_SLIDE && (
                  <p className="text-center text-sm text-muted-foreground">
                    Showing {getCurrentSlideSpaces().length} of {adSpaces.length} spaces
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Status */}
        {profile?.verification_status === "pending" && (
          <Card className="mb-8 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">Verification Pending</CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                Your verification documents are being reviewed. You'll be notified once approved.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Payouts */}
        <Card>
          <CardHeader>
            <CardTitle>Payouts</CardTitle>
            <CardDescription>Manage your earnings and withdrawals</CardDescription>
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

export default VenueDashboard;
