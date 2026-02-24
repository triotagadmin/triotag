import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send } from "lucide-react";

interface FormData {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  campaignName: string;
  category: string;
  adUnit: string;
  budget: string;
  targetAudience: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

const CampaignSubmission = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    campaignName: "",
    category: "",
    adUnit: "",
    budget: "",
    targetAudience: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const adUnitOptions = {
    venue: ["Table top stand ads", "Venue signage", "Display boards"],
    digital: ["Facebook posts", "TikTok videos", "Instagram stories", "Twitter posts"],
    agent: ["Guerrilla sticker placements", "Mural paintings", "Street art", "Flash mob events"],
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Reset ad unit when category changes
    if (field === "category") {
      setFormData((prev) => ({ ...prev, adUnit: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke("submit-campaign", {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Campaign Submitted!",
        description: "We've received your campaign details and will contact you shortly.",
      });

      // Reset form
      setFormData({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        campaignName: "",
        category: "",
        adUnit: "",
        budget: "",
        targetAudience: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
      });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">Submit Your Campaign</h1>
              <p className="text-xl text-muted-foreground">
                Tell us about your advertising needs and we'll match you with the perfect publishers
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll send your campaign details to our team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Company Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Company Name *</Label>
                          <Input
                            id="companyName"
                            required
                            value={formData.companyName}
                            onChange={(e) => handleInputChange("companyName", e.target.value)}
                            placeholder="Your Company"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactName">Contact Name *</Label>
                          <Input
                            id="contactName"
                            required
                            value={formData.contactName}
                            onChange={(e) => handleInputChange("contactName", e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            placeholder="contact@company.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Campaign Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Campaign Information</h3>
                      <div className="space-y-2">
                        <Label htmlFor="campaignName">Campaign Name *</Label>
                        <Input
                          id="campaignName"
                          required
                          value={formData.campaignName}
                          onChange={(e) => handleInputChange("campaignName", e.target.value)}
                          placeholder="Summer Product Launch"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => handleInputChange("category", value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="venue">Agent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="adUnit">Ad Unit (Deliverable) *</Label>
                          <Select
                            value={formData.adUnit}
                            onValueChange={(value) => handleInputChange("adUnit", value)}
                            required
                            disabled={!formData.category}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={formData.category ? "Select ad unit" : "Select category first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {formData.category &&
                                adUnitOptions[formData.category as keyof typeof adUnitOptions].map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="budget">Budget (USD) *</Label>
                          <Input
                            id="budget"
                            type="number"
                            required
                            value={formData.budget}
                            onChange={(e) => handleInputChange("budget", e.target.value)}
                            placeholder="5000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Target Location *</Label>
                          <Input
                            id="location"
                            required
                            value={formData.location}
                            onChange={(e) => handleInputChange("location", e.target.value)}
                            placeholder="New York, NY"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date *</Label>
                          <Input
                            id="startDate"
                            type="date"
                            required
                            value={formData.startDate}
                            onChange={(e) => handleInputChange("startDate", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">End Date *</Label>
                          <Input
                            id="endDate"
                            type="date"
                            required
                            value={formData.endDate}
                            onChange={(e) => handleInputChange("endDate", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="targetAudience">Target Audience *</Label>
                        <Input
                          id="targetAudience"
                          required
                          value={formData.targetAudience}
                          onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                          placeholder="Young professionals, ages 25-35"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Campaign Description *</Label>
                        <Textarea
                          id="description"
                          required
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          placeholder="Describe your campaign goals, creative vision, and any special requirements..."
                          rows={5}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Campaign
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CampaignSubmission;
