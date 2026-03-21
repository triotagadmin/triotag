import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  User, MapPin, Star, Calendar, CheckCircle, XCircle, Clock, Upload, X, Edit,
  Loader2, Briefcase, Image,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const SKILL_LABELS: Record<string, string> = {
  promoter: "Promoter",
  artist: "Artist",
  creator: "Creator",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "secondary",
  accepted: "default",
  declined: "destructive",
  completed: "default",
  cancelled: "secondary",
};

const TalentDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ bio: "", availability: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: role } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id).single();
      if (role?.role !== "talent") { navigate("/"); return; }

      const { data: tp } = await supabase
        .from("talent_profiles").select("*").eq("user_id", session.user.id).single();
      if (!tp) { navigate("/talent-profile"); return; }
      if (tp.status !== "approved") { navigate("/talent-profile"); return; }

      setProfile(tp);
      setEditForm({ bio: tp.bio || "", availability: tp.availability || "", location: tp.location });

      const { data: bk } = await supabase
        .from("talent_bookings").select("*").eq("talent_id", tp.id).order("created_at", { ascending: false });
      setBookings(bk || []);

      const { data: rv } = await supabase
        .from("talent_reviews").select("*").eq("talent_id", tp.id).order("created_at", { ascending: false });
      setReviews(rv || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: "accepted" | "declined") => {
    try {
      const { error } = await supabase
        .from("talent_bookings")
        .update({ status: action })
        .eq("id", bookingId);
      if (error) throw error;

      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        await supabase.from("notifications").insert({
          user_id: booking.advertiser_id,
          title: `Booking ${action === "accepted" ? "Accepted" : "Declined"}`,
          message: `${profile.full_name} has ${action} your booking request${booking.campaign_type ? ` for "${booking.campaign_type}"` : ""}.`,
          type: "talent_booking_response",
        });
      }

      toast({ title: `Booking ${action}` });
      loadDashboard();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("talent_profiles")
        .update({
          bio: editForm.bio.trim() || null,
          availability: editForm.availability.trim() || null,
          location: editForm.location.trim(),
        })
        .eq("id", profile.id);
      if (error) throw error;
      toast({ title: "Profile updated!" });
      setEditOpen(false);
      loadDashboard();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !profile) return;
    setUploadingPortfolio(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const newUrls = [...(Array.isArray(profile.portfolio_urls) ? profile.portfolio_urls : [])];
      for (const file of Array.from(e.target.files)) {
        const ext = file.name.split(".").pop();
        const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("talent-portfolio").upload(path, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("talent-portfolio").getPublicUrl(path);
        newUrls.push(publicUrl);
      }

      await supabase.from("talent_profiles").update({ portfolio_urls: newUrls }).eq("id", profile.id);
      toast({ title: "Portfolio updated!" });
      loadDashboard();
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const removePortfolioItem = async (urlToRemove: string) => {
    try {
      const newUrls = (profile.portfolio_urls || []).filter((u: string) => u !== urlToRemove);
      await supabase.from("talent_profiles").update({ portfolio_urls: newUrls }).eq("id", profile.id);
      toast({ title: "Removed from portfolio" });
      loadDashboard();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const pendingBookings = bookings.filter(b => b.status === "pending");
  const activeBookings = bookings.filter(b => b.status === "accepted");
  const pastBookings = bookings.filter(b => ["completed", "declined", "cancelled"].includes(b.status));
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        {/* Profile Summary */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {profile.full_name}
                  <CheckCircle className="h-5 w-5 text-primary" />
                </CardTitle>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="secondary" className="capitalize">
                    {SKILL_LABELS[profile.skill_type] || profile.skill_type}
                  </Badge>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {profile.location}
                  </span>
                  {avgRating && (
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      {avgRating} ({reviews.length} reviews)
                    </span>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Edit className="h-4 w-4 mr-1" /> Edit Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}
            {profile.availability && (
              <p className="text-sm text-muted-foreground">
                <strong>Availability:</strong> {profile.availability}
              </p>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings">
              <Briefcase className="h-4 w-4 mr-2" />
              Bookings
              {pendingBookings.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {pendingBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="portfolio">
              <Image className="h-4 w-4 mr-2" /> Portfolio
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="h-4 w-4 mr-2" /> Reviews
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            {pendingBookings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Pending Requests</h3>
                <div className="grid gap-4">
                  {pendingBookings.map((b) => (
                    <Card key={b.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            {b.campaign_type && <p className="font-medium">{b.campaign_type}</p>}
                            {b.duration && <p className="text-sm text-muted-foreground">Duration: {b.duration}</p>}
                            {b.start_date && <p className="text-sm text-muted-foreground">Starts: {new Date(b.start_date).toLocaleDateString()}</p>}
                            {b.notes && <p className="text-sm text-muted-foreground mt-1">{b.notes}</p>}
                            <p className="text-xs text-muted-foreground">Received: {new Date(b.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleBookingAction(b.id, "accepted")}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Accept
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleBookingAction(b.id, "declined")}>
                              <XCircle className="h-4 w-4 mr-1" /> Decline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeBookings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Active Bookings</h3>
                <div className="grid gap-4">
                  {activeBookings.map((b) => (
                    <Card key={b.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            {b.campaign_type && <p className="font-medium">{b.campaign_type}</p>}
                            {b.duration && <p className="text-sm text-muted-foreground">Duration: {b.duration}</p>}
                            {b.start_date && <p className="text-sm text-muted-foreground">
                              {new Date(b.start_date).toLocaleDateString()} {b.end_date && `- ${new Date(b.end_date).toLocaleDateString()}`}
                            </p>}
                          </div>
                          <Badge>Active</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {pastBookings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Past Bookings</h3>
                <div className="grid gap-4">
                  {pastBookings.map((b) => (
                    <Card key={b.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            {b.campaign_type && <p className="font-medium">{b.campaign_type}</p>}
                            <p className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</p>
                          </div>
                          <Badge variant={STATUS_COLORS[b.status] as any || "secondary"} className="capitalize">{b.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {bookings.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No bookings yet. Your profile is live in the marketplace!
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Portfolio</h3>
              <div>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handlePortfolioUpload}
                  className="hidden"
                  id="portfolio-upload"
                />
                <Button variant="outline" size="sm" asChild disabled={uploadingPortfolio}>
                  <label htmlFor="portfolio-upload" className="cursor-pointer">
                    {uploadingPortfolio ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                    Upload
                  </label>
                </Button>
              </div>
            </div>
            {profile.portfolio_urls && profile.portfolio_urls.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {profile.portfolio_urls.map((url: string, idx: number) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden">
                    <img src={url} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePortfolioItem(url)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No portfolio items yet. Upload images or videos to showcase your work.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((r) => (
                <Card key={r.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                    {r.review_text && <p className="text-sm text-muted-foreground">{r.review_text}</p>}
                    <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No reviews yet. Complete bookings to receive reviews from Print Partners.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={editForm.location} onChange={(e) => setEditForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={editForm.bio} onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Availability</Label>
              <Input value={editForm.availability} onChange={(e) => setEditForm(f => ({ ...f, availability: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TalentDashboard;
