import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { ArrowLeft, Upload, X } from "lucide-react";

const agentSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  location: z.string().trim().min(1, "Location is required").max(200),
  country: z.string().trim().min(1, "Country is required").max(100),
  contactEmail: z.string().trim().email("Invalid email").max(255),
  contactPhone: z.string().trim().min(1, "Phone is required").max(20),
  agentRole: z.string().min(1, "Agent role is required"),
  description: z.string().trim().max(1000).optional(),
});

const AgentRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [publisherId, setPublisherId] = useState<string | null>(null);
  const [uploadedPortfolio, setUploadedPortfolio] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [agentRole, setAgentRole] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [certifications, setCertifications] = useState("");

  const agentRoles = ["guerrilla", "influencer", "model", "artist"];

  const servicesList = [
    "Street Advertising",
    "Event Promotion",
    "Social Media Marketing",
    "Brand Ambassadorship",
    "Product Photography",
    "Video Content Creation",
    "Live Performances",
    "Pop-up Activations",
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("publisher_profiles")
        .select("id, contact_email, contact_phone, business_name")
        .eq("user_id", session.user.id)
        .single();

      if (profile) {
        setPublisherId(profile.id);
        setContactEmail(profile.contact_email || "");
        setContactPhone(profile.contact_phone || "");
        setFullName(profile.business_name || "");
      } else {
        navigate("/complete-profile");
      }
    };

    checkAuth();
  }, [navigate]);

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `portfolio-${Math.random()}-${Date.now()}.${fileExt}`;
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
      setUploadedPortfolio([...uploadedPortfolio, ...urls]);
      
      toast({
        title: "Success",
        description: "Portfolio media uploaded successfully",
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

  const removePortfolioItem = (url: string) => {
    setUploadedPortfolio(uploadedPortfolio.filter(u => u !== url));
  };

  const toggleService = (service: string) => {
    setServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
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
        fullName,
        location,
        country,
        contactEmail,
        contactPhone,
        agentRole,
        description,
      };

      agentSchema.parse(formData);

      setLoading(true);

      const { error: updateError } = await supabase
        .from("publisher_profiles")
        .update({
          business_name: fullName,
          location: `${location}, ${country}`,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          agent_role: agentRole as "guerrilla" | "influencer" | "model" | "artist",
          description,
          portfolio_media: uploadedPortfolio,
          metrics: {
            services,
            certifications,
          },
        })
        .eq("id", publisherId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Agent profile updated successfully",
      });

      navigate("/agent-publishers");
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
      <nav className="bg-card border-b">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate("/agent-publishers")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Register Agent Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentRole">Agent Role *</Label>
                <Select value={agentRole} onValueChange={setAgentRole} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">City *</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Services Offered</Label>
                <div className="grid grid-cols-2 gap-4">
                  {servicesList.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={service}
                        checked={services.includes(service)}
                        onCheckedChange={() => toggleService(service)}
                      />
                      <label
                        htmlFor={service}
                        className="text-sm cursor-pointer"
                      >
                        {service}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications">Certifications/Licenses</Label>
                <Input
                  id="certifications"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="List your certifications (comma separated)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about your experience and what makes you unique..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Portfolio (Photos/Videos)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload your portfolio images and videos
                  </p>
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handlePortfolioUpload}
                    className="max-w-xs mx-auto"
                    disabled={uploadingMedia}
                  />
                </div>

                {uploadedPortfolio.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {uploadedPortfolio.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                          onClick={() => removePortfolioItem(url)}
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
                  onClick={() => navigate("/agent-publishers")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploadingMedia}
                  className="flex-1"
                >
                  {loading ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentRegistration;
