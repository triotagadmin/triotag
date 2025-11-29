import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { ArrowLeft, Upload, X } from "lucide-react";

const digitalServiceSchema = z.object({
  title: z.string().trim().min(1, "Service name is required").max(100),
  description: z.string().trim().max(1000).optional(),
  websiteUrl: z.string().trim().url("Invalid URL").max(500).optional(),
  category: z.string().min(1, "Category is required"),
  pricingModel: z.string().min(1, "Pricing model is required"),
  monthlyRate: z.string().trim().max(50).optional(),
  impressions: z.string().trim().max(50).optional(),
});

const DigitalServiceRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [publisherId, setPublisherId] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [category, setCategory] = useState("");
  const [pricingModel, setPricingModel] = useState("");
  const [monthlyRate, setMonthlyRate] = useState("");
  const [impressions, setImpressions] = useState("");

  const categories = [
    "Website Banner",
    "Social Media",
    "Email Marketing",
    "Mobile App",
    "Video Platform",
    "Podcast",
    "Blog/Content",
    "Newsletter",
    "Other",
  ];

  const pricingModels = ["CPM", "CPC", "CPA", "Fixed Monthly", "Custom"];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile, error } = await supabase
        .from("publisher_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching publisher profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (profile) {
        setPublisherId(profile.id);
      } else {
        navigate("/complete-profile");
      }
    };

    checkAuth();
  }, [navigate, toast]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `${publisherId}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('ad-space-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('ad-space-media')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedMedia([...uploadedMedia, ...urls]);
      
      toast({
        title: "Success",
        description: "Media uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = (url: string) => {
    setUploadedMedia(uploadedMedia.filter(u => u !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publisherId) {
      toast({
        title: "Error",
        description: "Publisher ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = {
        title,
        description,
        websiteUrl,
        category,
        pricingModel,
        monthlyRate,
        impressions,
      };

      digitalServiceSchema.parse(formData);

      setLoading(true);

      const { error } = await supabase
        .from("ad_spaces")
        .insert({
          publisher_id: publisherId,
          title,
          description,
          location: websiteUrl,
          media_urls: uploadedMedia,
          specifications: {
            category,
            pricingModel,
            impressions,
          },
          pricing: {
            monthlyRate,
            model: pricingModel,
          },
          approval_status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Digital service submitted for review",
      });

      navigate("/digital-media");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Register Digital Service/Space</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Service Name *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Tech Blog Banner Ad"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website/Platform URL</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your digital advertising space..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricingModel">Pricing Model *</Label>
                <Select value={pricingModel} onValueChange={setPricingModel} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing model" />
                  </SelectTrigger>
                  <SelectContent>
                    {pricingModels.map((model) => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyRate">Monthly Rate (USD)</Label>
                  <Input
                    id="monthlyRate"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(e.target.value)}
                    placeholder="e.g., $500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="impressions">Monthly Impressions</Label>
                  <Input
                    id="impressions"
                    value={impressions}
                    onChange={(e) => setImpressions(e.target.value)}
                    placeholder="e.g., 100,000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Media Files (Screenshots, Videos)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload screenshots or videos of your ad space
                  </p>
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaUpload}
                    className="max-w-xs mx-auto"
                    disabled={uploadingMedia}
                  />
                </div>

                {uploadedMedia.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {uploadedMedia.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Media ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                          onClick={() => removeMedia(url)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/digital-media")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploadingMedia}
                  className="flex-1"
                >
                  {loading ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DigitalServiceRegistration;
