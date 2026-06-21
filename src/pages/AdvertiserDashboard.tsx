import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ShoppingCart, Mail, Receipt, Settings, Plus, MapPin, TrendingUp, Calendar, Printer, Ticket, Key, Info, Clock, CheckCircle2, Package, Eye, Hash } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { format } from "date-fns";
import { AdvertiserBranchManager } from "@/components/advertiser/AdvertiserBranchManager";
import { AdvertiserPrintOrderForm } from "@/components/advertiser/AdvertiserPrintOrderForm";
import { AdvertiserPrintOrdersList } from "@/components/advertiser/AdvertiserPrintOrdersList";
import { MyFranchiseSection } from "@/components/advertiser/MyFranchiseSection";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
const AdvertiserDashboard = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [leasedListings, setLeasedListings] = useState<any[]>([]);
  const [branchCounts, setBranchCounts] = useState<Record<string, number>>({});
  const [bookingPage, setBookingPage] = useState(0);
  const BOOKINGS_PER_PAGE = 3;
  useEffect(() => {
    let cancelled = false;
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }

      // Verify user has advertiser (retailer) role. Use maybeSingle so a missing
      // row doesn't throw, and fall back to user_metadata.user_type if needed.
      const { data: roleRow, error: roleErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (roleErr) {
        console.error("[AdvertiserDashboard] role fetch error:", roleErr);
      }
      const metaType = (session.user.user_metadata as any)?.user_type;
      const effectiveRole = roleRow?.role ?? metaType ?? null;
      console.log("[AdvertiserDashboard] role check", { roleRow, metaType, effectiveRole });

      if (effectiveRole && effectiveRole !== "retailer") {
        // Wrong role — route to their proper home instead of bouncing to "/".
        const ROLE_HOME: Record<string, string> = {
          agent: "/venue-publishers",
          print_partner: "/print-partner/dashboard",
          talent: "/talent-dashboard",
          admin: "/admin/dashboard",
          brand_advertiser: "/brand-advertiser/dashboard",
        };
        navigate(ROLE_HOME[effectiveRole] || "/", { replace: true });
        return;
      }

      if (cancelled) return;
      setUser(session.user);
      setLoading(false);

      const { data: activations } = await supabase
        .from("activations")
        .select("*, ad_spaces(title, location)")
        .eq("advertiser_id", session.user.id)
        .order("created_at", { ascending: false });
      if (!cancelled && activations) setBookings(activations);

      const { data: leased } = await supabase
        .from("ad_spaces")
        .select("id, title, location, approval_status, specifications, created_at")
        .contains("leased_advertiser_ids", [session.user.id])
        .order("created_at", { ascending: false });
      if (!cancelled && leased) {
        setLeasedListings(leased);
        const counts: Record<string, number> = {};
        await Promise.all(leased.map(async (l: any) => {
          const primaryAddress = (l.location || "").trim().toLowerCase();
          const { data: branchData } = await supabase
            .from("franchise_branches")
            .select("full_address")
            .eq("franchise_id", l.id);
          const filtered = (branchData || []).filter(
            (b: any) => !(primaryAddress && (b.full_address || "").trim().toLowerCase() === primaryAddress)
          );
          counts[l.id] = filtered.length;
        }));
        if (!cancelled) setBranchCounts(counts);
      }
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only react to actual sign-outs; ignore INITIAL_SESSION / TOKEN_REFRESHED
      // which were causing redirect loops.
      if (event === "SIGNED_OUT" || (event === "USER_UPDATED" && !session)) {
        navigate("/auth", { replace: true });
      } else if (session) {
        setUser(session.user);
      }
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
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
            Account Status: Retailer
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

          <div className="mt-6 flex gap-4 flex-wrap">
            <Button onClick={() => navigate("/campaign-builder")} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Register New Space
            </Button>
            
            
          </div>
        </div>

        {/* Messages card removed */}

{/* Bookmarked Ad Spaces section removed */}

        {/* My Franchises Section */}
        <div className="mb-12">
          {user && <MyFranchiseSection userId={user.id} />}
        </div>


        {/* Print Orders Section */}
        <div className="mb-12">
          {user && <AdvertiserBranchManager userId={user.id} associatedListings={leasedListings.map(l => ({ id: l.id, title: l.title }))} />}
        </div>


        {/* My Bookings Section */}
        <div className="mb-12">
          <div className="mb-6">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              My Bookings
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Track all ad space requests from marketplace clients. See the status of each booking: Pending, Approved, or Print Order.
            </p>
          </div>

          {bookings.length === 0 ? (
            <Card className="rounded-[20px]">
              <CardContent className="pt-8 pb-8">
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <ShoppingCart className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-lg font-semibold mb-1">No bookings yet</p>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    When marketplace users book your ad spaces via the activation flow, their requests will appear here.
                  </p>
                  <Button onClick={() => navigate("/explore")} className="gap-2">
                    <Eye className="h-4 w-4" />
                    Browse Ad Spaces
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings
                .slice(bookingPage * BOOKINGS_PER_PAGE, (bookingPage + 1) * BOOKINGS_PER_PAGE)
                .map((booking) => {
                  const statusConfig: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
                    pending_approval: { icon: <Clock className="h-4 w-4" />, label: "Pending", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
                    approved: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Approved", className: "bg-primary/15 text-primary border-primary/30" },
                    pending_admin: { icon: <Package className="h-4 w-4" />, label: "Print Order", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
                    in_production: { icon: <Printer className="h-4 w-4" />, label: "In Production", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
                    completed: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Completed", className: "bg-primary/15 text-primary border-primary/30" },
                    rejected: { icon: <Clock className="h-4 w-4" />, label: "Rejected", className: "bg-destructive/15 text-destructive border-destructive/30" },
                    cancelled: { icon: <Clock className="h-4 w-4" />, label: "Cancelled", className: "bg-muted text-muted-foreground border-border" },
                  };
                  const status = statusConfig[booking.status] || statusConfig.pending_approval;
                  const adSpace = booking.ad_spaces as any;
                  const location = adSpace?.location || "—";
                  // Extract city from location string
                  const city = location.includes(",") ? location.split(",").pop()?.trim() : location;

                  return (
                    <Card key={booking.id} className="rounded-[20px] hover:shadow-[0_0_20px_hsl(110_100%_55%_/_0.15)] transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Left: Info */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-base truncate">
                                  {adSpace?.title || "Ad Space"}
                                </p>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                  <Hash className="h-3.5 w-3.5 shrink-0" />
                                  <span className="font-mono text-xs">{booking.id.slice(0, 8).toUpperCase()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              {city && city !== "—" && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  {city}
                                </span>
                              )}
                              {booking.start_date && booking.end_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                                  {format(new Date(booking.start_date), "MMM d")} → {format(new Date(booking.end_date), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: Status + Action */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${status.className}`}>
                              {status.icon}
                              {status.label}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => navigate(`/activate/${booking.ad_space_id}`)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

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