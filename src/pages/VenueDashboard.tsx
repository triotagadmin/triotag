import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MapPin, DollarSign, Calendar, Upload, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, Edit, Eye, Ticket, Check, X, User, Settings, Building } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookingsArchive } from "@/components/publisher/BookingsArchive";
import { BillingInvoices } from "@/components/publisher/BillingInvoices";
import { MessagesCard } from "@/components/publisher/MessagesCard";
import { Separator } from "@/components/ui/separator";


const VenueDashboard = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [adSpaces, setAdSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
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
        // Profile not yet created (e.g. race condition after signup) — just show empty state
        setLoading(false);
        return;
      }
      setProfile(profileData);
      const {
        data: spacesData
      } = await supabase.from("ad_spaces").select("*").eq("publisher_id", profileData.id).order("created_at", {
        ascending: false
      });
      setAdSpaces(spacesData || []);
      setLoading(false);
    };
    fetchData();
  }, [navigate, toast]);
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
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }
  const activeSpaces = adSpaces.filter((s) => s.approval_status === "approved" && s.availability_status === "available").length;
  const pendingSpaces = adSpaces.filter((s) => s.approval_status === "pending").length;
  const isApprovedAgent = profile?.verification_status === "approved";
  const isPendingAgent = profile?.verification_status === "pending";
  return <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Manage your Ad Space Requests from Retailers</span>
          </div>
          <Button onClick={() => navigate("/publisher/ad-requests")} className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white">
            <Ticket className="h-4 w-4 mr-2" />Ad Request
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Agent Dashboard</h2>
          <div className="flex items-center gap-2 mt-1">
            {editingName ? <div className="flex items-center gap-2">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="max-w-xs" autoFocus />
                <Button size="icon" variant="ghost" onClick={async () => {
              if (!newName.trim() || !profile) return;
              const {
                error
              } = await supabase.from("publisher_profiles").update({
                business_name: newName.trim()
              }).eq("id", profile.id);
              if (error) {
                toast({
                  title: "Error",
                  description: error.message,
                  variant: "destructive"
                });
              } else {
                setProfile({
                  ...profile,
                  business_name: newName.trim()
                });
                toast({
                  title: "Updated",
                  description: "Business name updated."
                });
              }
              setEditingName(false);
            }}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingName(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div> : <>
                <button
              type="button"
              className="text-xl text-primary underline-offset-4 hover:underline cursor-pointer bg-transparent border-none p-0"
              onClick={() => setProfileDialogOpen(true)}>

                  {profile?.business_name}
                </button>
              </>}
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {getStatusBadge(profile?.verification_status)}
            {(profile?.contact_email || user?.email) && (
              <span className="text-sm text-muted-foreground">• {profile?.contact_email || user?.email}</span>
            )}
            {profile?.location && <span className="text-sm text-muted-foreground">• {profile.location}</span>}
          </div>
        </div>
        <div className="space-y-6">
          {!user?.email_confirmed_at && <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
              <CardHeader>
                <CardTitle className="text-yellow-800 dark:text-yellow-200">Email Verification Required</CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-300">Please verify your email address.</CardDescription>
              </CardHeader>
            </Card>}

          {isPendingAgent && <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="text-orange-800 dark:text-orange-200">Account Under Review</CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-300">
                  Your account is under review. You cannot post listings until approved by an administrator.
                </CardDescription>
              </CardHeader>
            </Card>}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Ad Spaces</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{activeSpaces}</p>
                <p className="text-sm text-muted-foreground">{pendingSpaces} pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">$0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Ad Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">-</p>
                <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate("/publisher/ad-requests")}>
                  View All Requests
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Ad Spaces</CardTitle>
                  <CardDescription>Add, edit, and manage your inventory</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => navigate("/venue-registration")} disabled={!isApprovedAgent}>
                    <Building className="h-4 w-4 mr-2" />
                    Register New Franchise
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/venue-inventory")}>
                    <Upload className="w-4 h-4 mr-2" />View Full Inventory
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {adSpaces.length === 0 ? <div className="text-center py-12">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{isPendingAgent ? "Your account is not approved to post listings." : "No ad spaces yet"}</h3>
                  <Button onClick={() => navigate("/venue/register")} disabled={!isApprovedAgent}>Add Your First Space</Button>
                </div> : <div className="space-y-4">
                  {totalSlides > 1 && <div className="flex items-center justify-center gap-4 mb-4">
                      <Button variant="outline" size="icon" onClick={prevSlide}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex gap-2">
                        {Array.from({
                    length: totalSlides
                  }).map((_, idx) => <button key={idx} onClick={() => setCurrentSlide(idx)} className={`w-2 h-2 rounded-full ${idx === currentSlide ? "bg-primary" : "bg-muted-foreground/30"}`} />)}
                      </div>
                      <Button variant="outline" size="icon" onClick={nextSlide}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {getCurrentSlideSpaces().map((space) => <Card key={space.id} className="overflow-hidden">
                        {Array.isArray(space.media_urls) && space.media_urls[0] && <div className="h-32 overflow-hidden">
                            <img src={space.media_urls[0]} alt={space.title} className="w-full h-full object-cover" />
                          </div>}
                        <div className="p-4">
                          <h4 className="font-semibold truncate">{space.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">{space.location}</p>
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {space.media_type === "DOOH" && <Badge className="bg-blue-600 hover:bg-blue-600">DOOH</Badge>}
                            {space.media_type === "AOOH" && <Badge className="bg-red-600 hover:bg-red-600">AOOH</Badge>}
                            {(!space.media_type || space.media_type === "OOH") && <Badge className="bg-green-600 hover:bg-green-600">OOH</Badge>}
                            {getStatusBadge(space.approval_status)}
                            <Badge variant="outline">{space.availability_status}</Badge>
                            {Array.isArray((space as any).leased_advertiser_ids) && (space as any).leased_advertiser_ids.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {(space as any).leased_advertiser_ids.length} lessee{(space as any).leased_advertiser_ids.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                            {(space as any).pending_advertiser_email && !(space as any).advertiser_id && (
                              <Badge variant="outline" className="text-xs gap-1 border-destructive/40 text-destructive">
                                <Clock className="w-3 h-3" /> Pending Retailer
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/venue-inventory?edit=${space.id}`)}>
                              <Edit className="w-3 h-3 mr-1" />Edit
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/venue/${space.id}`)}>
                              <Eye className="w-3 h-3 mr-1" />View
                            </Button>
                          </div>
                        </div>
                      </Card>)}

                  </div>
                </div>}
            </CardContent>
          </Card>

          {/* Branch Management */}

          {/* Bottom Modules */}
          <Separator className="my-8" />
          
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Management Hub</h2>
            
            {profile?.id && <BookingsArchive publisherProfileId={profile.id} />}
            
            {user?.id && <MessagesCard userId={user.id} />}
            
            {user?.id && <BillingInvoices userId={user.id} />}
            
            {/* Account Settings Link */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      Account Settings
                    </CardTitle>
                    <CardDescription>Manage your profile, password, and notification preferences</CardDescription>
                  </div>
                  <Button onClick={() => navigate("/publisher/settings")}>
                    <Settings className="h-4 w-4 mr-2" />Open Settings
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Retailer Profile
            </DialogTitle>
            <DialogDescription>Your business profile information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Business Name</p>
              <p className="text-base font-semibold">{profile?.business_name}</p>
            </div>
            {profile?.location &&
          <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-base">{profile.location}</p>
              </div>
          }
            {profile?.description &&
          <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-base">{profile.description}</p>
              </div>
          }
            <div>
              <p className="text-sm font-medium text-muted-foreground">Retailer Type</p>
              <p className="text-base capitalize">{profile?.publisher_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Verification Status</p>
              <div className="mt-1">{getStatusBadge(profile?.verification_status)}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Member Since</p>
              <p className="text-base">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default VenueDashboard;