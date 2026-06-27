import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, MapPin, Star, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BookTalent = () => {
  const { talentId } = useParams<{ talentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [talent, setTalent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [campaignType, setCampaignType] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (talentId) fetchTalent();
  }, [talentId]);

  const fetchTalent = async () => {
    try {
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("id", talentId)
        .eq("status", "approved")
        .single();

      if (error) throw error;
      setTalent(data);
    } catch {
      toast({ title: "Talent not found", variant: "destructive" });
      navigate("/hire-talent");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("talent_bookings").insert({
        talent_id: talentId,
        advertiser_id: session.user.id,
        campaign_type: campaignType.trim() || null,
        duration: duration.trim() || null,
        notes: notes.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        status: "pending",
      });

      if (error) throw error;

      // Notify talent
      await supabase.from("notifications").insert({
        user_id: talent.user_id,
        title: "New Booking Request",
        message: `You have a new booking request${campaignType ? ` for "${campaignType}"` : ""}. Check your dashboard to accept or decline.`,
        type: "talent_booking",
      });

      toast({
        title: "Booking Submitted!",
        description: "The talent will be notified and can accept or decline your request.",
      });
      navigate("/retailer-dashboard");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!talent) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        {/* Talent summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {talent.full_name}
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{talent.skill_type}</Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" /> {talent.location}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Booking form */}
        <Card>
          <CardHeader>
            <CardTitle>Book This Talent</CardTitle>
            <CardDescription>Fill in the details for your booking request.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="campaignType">Campaign Type</Label>
                <Input
                  id="campaignType"
                  value={campaignType}
                  onChange={(e) => setCampaignType(e.target.value)}
                  placeholder="e.g. Product Launch, Brand Activation, Photo Shoot"
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 3 days, 1 week, 2 hours"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Requirements</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details about what you need..."
                  rows={4}
                  maxLength={1000}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                ) : "Submit Booking Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookTalent;
