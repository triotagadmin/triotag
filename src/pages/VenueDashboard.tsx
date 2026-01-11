import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MapPin, DollarSign, Calendar, Upload, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, Edit, Eye, Ticket, ClipboardCheck, CalendarCheck } from "lucide-react";
import { ApprovalQueue } from "@/components/publisher/ApprovalQueue";
import { PublisherCalendar } from "@/components/publisher/PublisherCalendar";
interface Activation {
  id: string;
  ad_space_id: string;
  advertiser_id: string;
  publisher_id: string;
  status: string;
  activation_type: string | null;
  ad_design_url: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  ad_spaces: {
    title: string;
    location: string | null;
  } | null;
}
const VenueDashboard = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [adSpaces, setAdSpaces] = useState<any[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const ITEMS_PER_SLIDE = 3;
  const totalSlides = Math.max(1, Math.ceil(adSpaces.length / ITEMS_PER_SLIDE));
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
      const {
        data: profileData,
        error: profileError
      } = await supabase.from("publisher_profiles").select("*").eq("user_id", session.user.id).maybeSingle();
      if (profileError) {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      if (!profileData) {
        toast({
          title: "Profile Required",
          description: "Please complete your profile setup."
        });
        navigate("/complete-profile");
        return;
      }
      setProfile(profileData);
      const {
        data: spacesData
      } = await supabase.from("ad_spaces").select("*").eq("publisher_id", profileData.id).order("created_at", {
        ascending: false
      });
      setAdSpaces(spacesData || []);

      // Query activations by publisher profile id (not user id)
      const {
        data: activationsData
      } = await supabase.from("activations").select(`id, ad_space_id, advertiser_id, publisher_id, status, activation_type, ad_design_url, start_date, end_date, created_at, ad_spaces (title, location)`).eq("publisher_id", profileData.id).order("created_at", {
        ascending: false
      });
      setActivations(activationsData || []);
      setLoading(false);
    };
    fetchData();
  }, [navigate, toast]);
  const handleActivationStatusChange = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (session) {
      // Get profile id first
      const {
        data: profileData
      } = await supabase.from("publisher_profiles").select("id").eq("user_id", session.user.id).maybeSingle();
      if (profileData) {
        const {
          data: activationsData
        } = await supabase.from("activations").select(`id, ad_space_id, advertiser_id, publisher_id, status, activation_type, ad_design_url, start_date, end_date, created_at, ad_spaces (title, location)`).eq("publisher_id", profileData.id).order("created_at", {
          ascending: false
        });
        setActivations(activationsData || []);
      }
    }
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
  const getCurrentSlideSpaces = () => adSpaces.slice(currentSlide * ITEMS_PER_SLIDE, (currentSlide + 1) * ITEMS_PER_SLIDE);
  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  const pendingCount = activations.filter(a => a.status === "pending_approval").length;
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }
  const activeSpaces = adSpaces.filter(s => s.approval_status === "approved" && s.availability_status === "available").length;
  const pendingSpaces = adSpaces.filter(s => s.approval_status === "pending").length;
  return <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Manage your Ad Space Requests from Advertisers</span>
          </div>
          <Button onClick={() => navigate("/ticket-creator")} className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white">
            <Ticket className="h-4 w-4 mr-2" />Ticket Creator
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Venue Dashboard</h2>
          <p className="text-xl text-muted-foreground">{profile?.business_name}</p>
          <div className="mt-2">{getStatusBadge(profile?.verification_status)}</div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="overview"><MapPin className="h-4 w-4 mr-2" />Overview</TabsTrigger>
            <TabsTrigger value="approvals" className="relative">
              <ClipboardCheck className="h-4 w-4 mr-2" />Booking Requests
              {pendingCount > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="calendar"><CalendarCheck className="h-4 w-4 mr-2" />Booking Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {!user?.email_confirmed_at && <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                <CardHeader>
                  <CardTitle className="text-yellow-800 dark:text-yellow-200">Email Verification Required</CardTitle>
                  <CardDescription className="text-yellow-700 dark:text-yellow-300">Please verify your email address.</CardDescription>
                </CardHeader>
              </Card>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card><CardHeader><div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><MapPin className="w-6 h-6 text-primary" /></div><CardTitle>Ad Spaces</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{activeSpaces}</p><p className="text-sm text-muted-foreground">{pendingSpaces} pending</p></CardContent></Card>
              <Card><CardHeader><div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><DollarSign className="w-6 h-6 text-primary" /></div><CardTitle>Earnings</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">$0</p></CardContent></Card>
              <Card><CardHeader><div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><Calendar className="w-6 h-6 text-primary" /></div><CardTitle>Bookings</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">0</p></CardContent></Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div><CardTitle>Manage Venue Ad Spaces</CardTitle><CardDescription>Add, edit, and manage your advertising spaces</CardDescription></div>
                  <Button onClick={() => navigate("/venue-inventory")}><Upload className="w-4 h-4 mr-2" />View Full Inventory</Button>
                </div>
              </CardHeader>
              <CardContent>
                {adSpaces.length === 0 ? <div className="text-center py-12">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No ad spaces yet</h3>
                    <Button onClick={() => navigate("/venue/register")}>Add Your First Space</Button>
                  </div> : <div className="space-y-4">
                    {totalSlides > 1 && <div className="flex items-center justify-center gap-4 mb-4">
                        <Button variant="outline" size="icon" onClick={prevSlide}><ChevronLeft className="h-4 w-4" /></Button>
                        <div className="flex gap-2">{Array.from({
                      length: totalSlides
                    }).map((_, idx) => <button key={idx} onClick={() => setCurrentSlide(idx)} className={`w-2 h-2 rounded-full ${idx === currentSlide ? "bg-primary" : "bg-muted-foreground/30"}`} />)}</div>
                        <Button variant="outline" size="icon" onClick={nextSlide}><ChevronRight className="h-4 w-4" /></Button>
                      </div>}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {getCurrentSlideSpaces().map(space => <Card key={space.id} className="overflow-hidden">
                          {Array.isArray(space.media_urls) && space.media_urls[0] && <div className="h-32 overflow-hidden"><img src={space.media_urls[0]} alt={space.title} className="w-full h-full object-cover" /></div>}
                          <div className="p-4">
                            <h4 className="font-semibold truncate">{space.title}</h4>
                            <p className="text-sm text-muted-foreground truncate">{space.location}</p>
                            <div className="mt-2 flex gap-2 flex-wrap">{getStatusBadge(space.approval_status)}<Badge variant="outline">{space.availability_status}</Badge></div>
                            <div className="flex gap-2 mt-3">
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/venue-inventory?edit=${space.id}`)}><Edit className="w-3 h-3 mr-1" />Edit</Button>
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/venue/${space.id}`)}><Eye className="w-3 h-3 mr-1" />View</Button>
                            </div>
                          </div>
                        </Card>)}
                    </div>
                  </div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approvals">
            <ApprovalQueue activations={activations.filter(a => a.status === "pending_approval")} onStatusChange={handleActivationStatusChange} />
          </TabsContent>

          <TabsContent value="calendar">
            <PublisherCalendar activations={activations} />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default VenueDashboard;