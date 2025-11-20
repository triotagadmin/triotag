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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [agentRole, setAgentRole] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [certifications, setCertifications] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

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

      setUserId(session.user.id);

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

      // Load existing photos from agent_service_files with signed URLs
      const { data: files } = await supabase
        .from("agent_service_files")
        .select("file_path")
        .eq("owner_id", session.user.id);
      
      if (files && files.length > 0) {
        const signedUrls = await Promise.all(
          files.map(async (file) => {
            const { data } = await supabase.storage
              .from('agent-service-photos')
              .createSignedUrl(file.file_path, 3600); // 1 hour expiry
            return data?.signedUrl || '';
          })
        );
        setUploadedPortfolio(signedUrls.filter(url => url !== ''));
      }
    };

    checkAuth();
  }, [navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file types - only images allowed
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const fileArray = Array.from(files);
    const invalidFiles = fileArray.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid File Type",
        description: "Only image files are allowed (JPG, PNG, WEBP).",
        variant: "destructive",
      });
      e.target.value = ''; // Clear input
      return;
    }

    // Check 30 photo limit
    const currentCount = uploadedPortfolio.length + selectedFiles.length;
    const newCount = currentCount + fileArray.length;
    
    if (newCount > 30) {
      toast({
        title: "Photo Limit Exceeded",
        description: `You can only upload up to 30 photos. You currently have ${currentCount} photo${currentCount !== 1 ? 's' : ''}.`,
        variant: "destructive",
      });
      e.target.value = ''; // Clear input
      return;
    }

    setSelectedFiles([...selectedFiles, ...fileArray]);
    e.target.value = ''; // Clear input for next selection
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
  };

  const handlePortfolioUpload = async () => {
    if (selectedFiles.length === 0) return;

    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setUploadingMedia(true);
    setUploadProgress(0);

    try {
      const totalFiles = selectedFiles.length;
      let completed = 0;

      const uploadPromises = selectedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(7)}-${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // Upload to storage (private bucket)
        const { error: uploadError } = await supabase.storage
          .from('agent-service-photos')
          .upload(filePath, file, {
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        // Get signed URL for display
        const { data: signedData } = await supabase.storage
          .from('agent-service-photos')
          .createSignedUrl(filePath, 3600);

        // Insert into agent_service_files table
        const { error: dbError } = await supabase
          .from('agent_service_files')
          .insert({
            owner_id: userId,
            file_path: filePath,
            file_url: signedData?.signedUrl || '',
            file_type: file.type,
          });

        if (dbError) {
          // Rollback: delete the uploaded file from storage
          await supabase.storage
            .from('agent-service-photos')
            .remove([filePath]);
          throw dbError;
        }

        completed++;
        setUploadProgress(Math.round((completed / totalFiles) * 100));

        return signedData?.signedUrl || '';
      });

      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(url => url !== '');
      setUploadedPortfolio([...uploadedPortfolio, ...validUrls]);
      setSelectedFiles([]); // Clear selected files after successful upload
      
      toast({
        title: "Success",
        description: `${validUrls.length} photo${validUrls.length !== 1 ? 's' : ''} uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
    }
  };

  const removePortfolioItem = async (index: number) => {
    if (!userId) return;

    try {
      // Get file path from database
      const { data: files } = await supabase
        .from('agent_service_files')
        .select('file_path')
        .eq('owner_id', userId);

      if (!files || !files[index]) return;

      const filePath = files[index].file_path;

      // Delete from database first
      const { error: dbError } = await supabase
        .from('agent_service_files')
        .delete()
        .eq('owner_id', userId)
        .eq('file_path', filePath);

      if (dbError) throw dbError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('agent-service-photos')
        .remove([filePath]);

      if (storageError) console.error('Storage deletion error:', storageError);

      setUploadedPortfolio(uploadedPortfolio.filter((_, i) => i !== index));
      
      toast({
        title: "Success",
        description: "Photo removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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
            <CardTitle>Register Agent Services</CardTitle>
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Portfolio Photos (Max 30)</Label>
                  <p className="text-sm text-muted-foreground">
                    {uploadedPortfolio.length + selectedFiles.length}/30 photos
                  </p>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Select portfolio images (JPG, PNG, WEBP only)
                  </p>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    className="max-w-xs mx-auto"
                    disabled={uploadingMedia || (uploadedPortfolio.length + selectedFiles.length) >= 30}
                  />
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Selected Files ({selectedFiles.length})</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearSelectedFiles}
                        disabled={uploadingMedia}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Selected ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                            onClick={() => removeSelectedFile(index)}
                            disabled={uploadingMedia}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      onClick={handlePortfolioUpload}
                      disabled={uploadingMedia}
                      className="w-full"
                    >
                      {uploadingMedia ? `Uploading... ${uploadProgress}%` : `Upload ${selectedFiles.length} Photo${selectedFiles.length !== 1 ? 's' : ''}`}
                    </Button>
                  </div>
                )}

                {uploadedPortfolio.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Uploaded Photos ({uploadedPortfolio.length})</Label>
                    <div className="grid grid-cols-3 gap-4">
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
                            onClick={() => removePortfolioItem(index)}
                            disabled={uploadingMedia}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
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
