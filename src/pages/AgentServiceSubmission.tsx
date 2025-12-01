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
import { Upload, X } from "lucide-react";
import { z } from "zod";

const serviceSchema = z.object({
  title: z.string().trim().min(1, "Service name is required").max(100),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(1000),
  serviceType: z.string().min(1, "Service type is required"),
  location: z.string().trim().min(1, "Location is required").max(200),
  hourlyRate: z.string().trim().optional(),
  dailyRate: z.string().trim().optional(),
  projectRate: z.string().trim().optional(),
});

const AgentServiceSubmission = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [publisherId, setPublisherId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [location, setLocation] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [projectRate, setProjectRate] = useState("");

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
        .eq("publisher_type", "agent")
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
        navigate("/agent-registration");
      }
    };

    checkAuth();
  }, [navigate, toast]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 10) {
      toast({
        title: "Error",
        description: "Maximum 10 photos allowed",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `${publisherId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ad-space-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('ad-space-media')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedImages([...uploadedImages, ...urls]);

      toast({
        title: "Success",
        description: "Images uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (url: string) => {
    setUploadedImages(uploadedImages.filter(img => img !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publisherId) return;
    
    setLoading(true);

    try {
      const validatedData = serviceSchema.parse({
        title,
        description,
        serviceType,
        location,
        hourlyRate: hourlyRate || undefined,
        dailyRate: dailyRate || undefined,
        projectRate: projectRate || undefined,
      });

      const pricingData: any = {};
      if (validatedData.hourlyRate) pricingData.hourly = parseFloat(validatedData.hourlyRate);
      if (validatedData.dailyRate) pricingData.daily = parseFloat(validatedData.dailyRate);
      if (validatedData.projectRate) pricingData.project = parseFloat(validatedData.projectRate);

      const { error } = await supabase
        .from("agent_services")
        .insert({
          publisher_id: publisherId,
          title: validatedData.title,
          description: validatedData.description,
          service_type: validatedData.serviceType,
          location: validatedData.location,
          pricing: Object.keys(pricingData).length > 0 ? pricingData : null,
          media_urls: uploadedImages,
          approval_status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service submitted for approval",
      });

      navigate("/agent-inventory");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Submit New Service</CardTitle>
            <p className="text-muted-foreground mt-2">
              Complete all required fields to submit your service for approval
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Name */}
              <div>
                <Label htmlFor="title">Service Name *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter service name"
                  required
                />
              </div>

              {/* Service Type */}
              <div>
                <Label htmlFor="serviceType">Service Type *</Label>
                <Select value={serviceType} onValueChange={setServiceType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guerrilla">Guerrilla Marketing</SelectItem>
                    <SelectItem value="influencer">Influencer Promotion</SelectItem>
                    <SelectItem value="model">Modeling Services</SelectItem>
                    <SelectItem value="artist">Artistic Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State or Region"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Service Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your service and what makes it unique..."
                  rows={4}
                  required
                />
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold">Pricing (Optional)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dailyRate">Daily Rate ($)</Label>
                    <Input
                      id="dailyRate"
                      type="number"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="projectRate">Project Rate ($)</Label>
                    <Input
                      id="projectRate"
                      type="number"
                      value={projectRate}
                      onChange={(e) => setProjectRate(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <Label>Upload Photos (Max 10, JPEG/PNG)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {uploadedImages.length}/10 photos uploaded
                </p>
                <div className="mt-2">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                      </div>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage || uploadedImages.length >= 10}
                    />
                  </label>
                </div>

                {/* Image Preview */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/agent-inventory")}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || uploadingImage}>
                  {loading ? "Submitting..." : "Submit for Approval"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentServiceSubmission;
