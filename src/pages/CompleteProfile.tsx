import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { z } from "zod";

const profileSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(100),
  contactEmail: z.string().trim().email("Invalid email address").max(255),
  contactPhone: z.string().trim().max(20).optional(),
  location: z.string().trim().max(200).optional(),
  description: z.string().trim().max(500).optional(),
});

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [publisherType, setPublisherType] = useState<string>("venue");
  const [agentRole, setAgentRole] = useState<string | null>(null);
  
  // Form fields
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      setContactEmail(session.user.email || "");
      
      // Check if profile already exists and is completed
      const { data: profile } = await supabase
        .from("publisher_profiles")
        .select("id, publisher_type, business_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      if (profile && profile.business_name !== "Pending") {
        // Profile exists and is completed, redirect to appropriate dashboard
        redirectToDashboard(profile.publisher_type);
      } else if (profile && profile.business_name === "Pending") {
        // Profile exists but not completed, allow user to update it
        setPublisherType(profile.publisher_type);
      }
    };

    checkUser();
  }, [navigate]);

  const redirectToDashboard = (type: string) => {
    switch (type) {
      case "venue":
        navigate("/venue");
        break;
      case "digital":
        navigate("/digital-media");
        break;
      case "agent":
        navigate("/agent-publishers");
        break;
      default:
        navigate("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);

    try {
      // Validate inputs
      const validatedData = profileSchema.parse({
        businessName,
        contactEmail,
        contactPhone: contactPhone || undefined,
        location: location || undefined,
        description: description || undefined,
      });

      // Update existing publisher profile (created during signup)
      const profileData: any = {
        business_name: validatedData.businessName,
        contact_email: validatedData.contactEmail,
      };

      if (publisherType === "agent" && agentRole) {
        profileData.agent_role = agentRole;
      }

      if (validatedData.contactPhone) {
        profileData.contact_phone = validatedData.contactPhone;
      }

      if (validatedData.location) {
        profileData.location = validatedData.location;
      }

      if (validatedData.description) {
        profileData.description = validatedData.description;
      }

      const { error } = await supabase
        .from("publisher_profiles")
        .update(profileData)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile created!",
        description: "Your publisher profile has been submitted for approval.",
      });

      // Redirect to appropriate dashboard
      redirectToDashboard(publisherType);
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
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Complete Your Publisher Profile</CardTitle>
          <CardDescription>
            Tell us about your business to start monetizing your ad spaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="publisherType">Publisher Type</Label>
              <Select 
                value={publisherType} 
                onValueChange={setPublisherType}
                disabled={user !== null} // Disable if user exists (profile already created)
              >
                <SelectTrigger id="publisherType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venue">Venue (Physical Locations)</SelectItem>
                  <SelectItem value="digital">Digital Media (Online Platforms)</SelectItem>
                  <SelectItem value="agent">Agent (Freelance Placements)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {publisherType === "agent" && (
              <div className="space-y-2">
                <Label htmlFor="agentRole">Agent Role</Label>
                <Select value={agentRole || ""} onValueChange={setAgentRole}>
                  <SelectTrigger id="agentRole">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guerrilla">Guerrilla Agent</SelectItem>
                    <SelectItem value="influencer">Influencer</SelectItem>
                    <SelectItem value="model">Model</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business or brand name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State/Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your business and what makes your ad spaces unique"
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Profile..." : "Complete Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
