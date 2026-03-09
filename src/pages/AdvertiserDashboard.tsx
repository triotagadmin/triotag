import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ShoppingCart, Search, Mail, Receipt, Settings, Plus, MapPin, Globe, Users, TrendingUp, Calendar, Printer, Ticket, Building2, Key } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { format } from "date-fns";
import { AdvertiserBranchManager } from "@/components/advertiser/AdvertiserBranchManager";
import { AdvertiserPrintOrderForm } from "@/components/advertiser/AdvertiserPrintOrderForm";
import { AdvertiserPrintOrdersList } from "@/components/advertiser/AdvertiserPrintOrdersList";
import { AdvertiserBranchLocations } from "@/components/advertiser/AdvertiserBranchLocations";
const AdvertiserDashboard = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [ownedListings, setOwnedListings] = useState<any[]>([]);
  const [leasedListings, setLeasedListings] = useState<any[]>([]);
  const [bookingPage, setBookingPage] = useState(0);
  const BOOKINGS_PER_PAGE = 3;
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Verify user has advertiser role
      const {
        data: roles
      } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
      if (!roles || roles.role !== "advertiser") {
        navigate("/dashboard");
        return;
      }
      setUser(session.user);
      setLoading(false);

      // Fetch bookings
      const { data: activations } = await supabase
        .from("activations")
        .select("*, ad_spaces(title, location)")
        .eq("advertiser_id", session.user.id)
        .order("created_at", { ascending: false });
      if (activations) setBookings(activations);

      // Fetch listings owned by this advertiser (advertiser_id = user_id)
      const { data: owned } = await supabase
        .from("ad_spaces")
        .select("id, title, location, approval_status, specifications, created_at, leased_advertiser_ids")
        .eq("advertiser_id", session.user.id)
        .order("created_at", { ascending: false });
      if (owned) setOwnedListings(owned);

      // Fetch listings leased by this advertiser
      const { data: leased } = await supabase
        .from("ad_spaces")
        .select("id, title, location, approval_status, specifications, created_at")
        .contains("leased_advertiser_ids", [session.user.id])
        .order("created_at", { ascending: false });
      if (leased) setLeasedListings(leased);
    };
    checkUser();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
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
      description: "You have been signed out successfully."
    });
    navigate("/");
  };
  const handleResendVerification = async () => {
    if (!user?.email) return;
    try {
      const {
        error
      } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
      toast({
        title: "Verification email sent",
        description: "Please check your inbox for the verification link."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>;
  }
  return <div className="min-h-screen bg-muted/30">
      <Navigation />

      {/* Ticket Creator Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b border-border">
        
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, Advertiser!
          </h2>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        {user && !user.email_confirmed_at && <Card className="mb-8 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
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
            
            
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Order Print Materials */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/order-prints")}>
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
                ​ORDER  
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
        </div>

        {/* Owned Listings Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            My Listings
          </h3>
          <Card>
            <CardContent className="pt-6">
              {ownedListings.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">No listings associated with your account yet</p>
                  <p className="text-sm text-muted-foreground">When a publisher adds your email to a listing, it will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ownedListings.map((listing) => (
                    <div key={listing.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{listing.title}</p>
                          <Badge variant="outline" className="text-xs gap-1">
                            <Building2 className="h-3 w-3" /> Owned
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.location || "—"}
                        </p>
                        {(listing.leased_advertiser_ids as string[] || []).length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {(listing.leased_advertiser_ids as string[]).length} advertiser{(listing.leased_advertiser_ids as string[]).length !== 1 ? "s" : ""} leasing
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={listing.approval_status === "approved" ? "default" : "secondary"}>
                          {listing.approval_status}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/venue/${listing.id}`)}>
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/venue/${listing.id}/branches`)}>
                          Branches
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leased Listings Section */}
        {leasedListings.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Key className="h-6 w-6" />
              Leased Ad Spaces
            </h3>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {leasedListings.map((listing) => (
                    <div key={listing.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{listing.title}</p>
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Key className="h-3 w-3" /> Leased
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.location || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/venue/${listing.id}`)}>
                          View
                        </Button>
                        <Button size="sm" onClick={() => navigate(`/activate/${listing.id}`)}>
                          Activate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Branch Locations Section */}
        <div className="mb-12">
          {user && <AdvertiserBranchLocations userId={user.id} listings={[...ownedListings, ...leasedListings].map(l => ({ id: l.id, title: l.title }))} />}
        </div>

        {/* Print Orders Section */}
        <div className="mb-12">
          {user && <AdvertiserBranchManager userId={user.id} associatedListings={[...ownedListings, ...leasedListings].map(l => ({ id: l.id, title: l.title }))} />}
        </div>


        {/* My Bookings Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            My Bookings
          </h3>
          <Card>
            <CardContent className="pt-6">
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No bookings yet</p>
                  <Button onClick={() => navigate("/publishers")}>
                    Browse Ad Spaces
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(bookingPage * BOOKINGS_PER_PAGE, (bookingPage + 1) * BOOKINGS_PER_PAGE).map((booking) => (
                    <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg">
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-medium">{(booking.ad_spaces as any)?.title || "Ad Space"}</p>
                        <p className="text-sm text-muted-foreground">
                          {(booking.ad_spaces as any)?.location || "—"}
                        </p>
                        {booking.start_date && booking.end_date && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(booking.start_date), "MMM d, yyyy")} → {format(new Date(booking.end_date), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={
                          booking.status === "approved" || booking.status === "completed" ? "default" :
                          booking.status === "rejected" ? "destructive" : "secondary"
                        }>
                          {booking.status.replace(/_/g, " ")}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/activate/${booking.ad_space_id}`)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                  {bookings.length > BOOKINGS_PER_PAGE && (
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={bookingPage === 0}
                        onClick={() => setBookingPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {bookingPage + 1} of {Math.ceil(bookings.length / BOOKINGS_PER_PAGE)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(bookingPage + 1) * BOOKINGS_PER_PAGE >= bookings.length}
                        onClick={() => setBookingPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Browse & Discover Section */}
        

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 gap-6">

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
              <Button variant="outline" onClick={() => navigate("/advertiser-settings")}>
                Manage Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default AdvertiserDashboard;