import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";

const TalentProfileSubmission = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingProfile, setExistingProfile] = useState<any>(null);

  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [skillType, setSkillType] = useState<string>("");
  const [bio, setBio] = useState("");
  const [availability, setAvailability] = useState("");
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (role?.role !== "talent") {
        navigate("/");
        return;
      }

      const { data: profile } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile) {
        setExistingProfile(profile);
        if (profile.status === "approved") {
          navigate("/talent-dashboard");
          return;
        }
        // Pre-fill form for rejected profiles that can resubmit
        if (profile.status === "rejected") {
          setFullName(profile.full_name);
          setLocation(profile.location);
          setSkillType(profile.skill_type);
          setBio(profile.bio || "");
          setAvailability(profile.availability || "");
        }
      }
    } finally {
      setChecking(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPortfolioFiles(prev => [...prev, ...newFiles].slice(0, 10));
    }
  };

  const removeFile = (index: number) => {
    setPortfolioFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPortfolio = async (userId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of portfolioFiles) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("talent-portfolio")
        .upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from("talent-portfolio")
        .getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillType) {
      toast({ title: "Please select a skill type", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      setUploadingFiles(true);
      const portfolioUrls = portfolioFiles.length > 0
        ? await uploadPortfolio(session.user.id)
        : [];
      setUploadingFiles(false);

      const profileData = {
        user_id: session.user.id,
        full_name: fullName.trim(),
        location: location.trim(),
        skill_type: skillType as "promoter" | "artist" | "creator",
        bio: bio.trim() || null,
        availability: availability.trim() || null,
        portfolio_urls: portfolioUrls,
        status: "pending" as const,
        rejection_reason: null,
      };

      if (existingProfile) {
        const { error } = await supabase
          .from("talent_profiles")
          .update(profileData)
          .eq("id", existingProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("talent_profiles")
          .insert(profileData);
        if (error) throw error;
      }

      // Notify admins
      const { data: admins } = await supabase
        .from("admin_profiles")
        .select("user_id")
        .eq("status", "verified");

      if (admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            title: "New Talent Submission",
            message: `${fullName} has submitted a talent profile as a ${skillType}. Please review.`,
            type: "talent_submission",
          });
        }
      }

      toast({
        title: "Profile Submitted!",
        description: "Your profile is under review. You'll be notified once approved.",
      });

      setExistingProfile({ ...profileData, status: "pending" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (existingProfile?.status === "pending") {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12 max-w-lg">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Profile Under Review</CardTitle>
              <CardDescription>
                Your talent profile has been submitted and is pending admin approval.
                You'll receive a notification once it's reviewed.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" onClick={() => navigate("/")}>
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {existingProfile?.status === "rejected" ? "Resubmit Your Profile" : "Create Your Talent Profile"}
            </CardTitle>
            <CardDescription>
              Fill in your details to get listed in the Hire Talent marketplace.
            </CardDescription>
            {existingProfile?.status === "rejected" && existingProfile?.rejection_reason && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                <strong>Rejection reason:</strong> {existingProfile.rejection_reason}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (City / Area) *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Manila, Philippines"
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label>Skill Type *</Label>
                <Select value={skillType} onValueChange={setSkillType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your skill type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promoter">Promoter</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                    <SelectItem value="creator">Creator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio / Intro</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell advertisers about yourself, your experience, and what you can offer..."
                  rows={4}
                  maxLength={1000}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">Availability (optional)</Label>
                <Input
                  id="availability"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="e.g. Weekdays 9am-5pm, Weekends available"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label>Portfolio Upload (images/videos, max 10)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
                {portfolioFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {portfolioFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs">
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button type="button" onClick={() => removeFile(idx)}>
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadingFiles ? "Uploading files..." : "Submitting..."}
                  </>
                ) : existingProfile?.status === "rejected" ? "Resubmit Profile" : "Submit Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TalentProfileSubmission;
