import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { Calendar, DollarSign, MapPin, Users, Sparkles, Tag } from "lucide-react";
import { PRINT_PRODUCTS } from "@/lib/printProducts";

const CampaignBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    campaign_name: "",
    campaign_description: "",
    campaign_type: "",
    location: "",
    budget_amount: "",
    budget_currency: "USD",
    start_date: "",
    end_date: "",
    target_audience: "",
    ad_unit_type: "",
  });

  const selectedProduct = PRINT_PRODUCTS.find(p => p.id === formData.ad_unit_type);
  const adUnitPrice = selectedProduct?.pricePerUnit ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("advertiser_profiles")
        .select("id, company_name, contact_name, contact_phone")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        toast({
          title: "Profile not found",
          description: "Please complete your advertiser profile first.",
          variant: "destructive",
        });
        navigate("/advertiser-dashboard");
        return;
      }

      const { error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          advertiser_id: profile.id,
          campaign_name: formData.campaign_name,
          campaign_description: formData.campaign_description,
          campaign_type: formData.campaign_type,
          location: formData.location,
          budget_amount: parseFloat(formData.budget_amount),
          budget_currency: formData.budget_currency,
          start_date: formData.start_date,
          end_date: formData.end_date,
          target_audience: formData.target_audience,
          ad_unit_type: formData.ad_unit_type,
          ad_unit_price: adUnitPrice,
          status: "pending",
        });

      if (campaignError) throw campaignError;

      try {
        await supabase.functions.invoke("submit-campaign", {
          body: {
            companyName: profile.company_name || profile.id,
            contactName: profile.contact_name || session.user.email,
            email: session.user.email,
            phone: profile.contact_phone || "",
            campaignName: formData.campaign_name,
            category: formData.campaign_type,
            adUnit: selectedProduct?.name || "N/A",
            adUnitPrice: adUnitPrice != null ? `$${adUnitPrice}` : "N/A",
            budget: formData.budget_amount,
            budgetCurrency: formData.budget_currency,
            targetAudience: formData.target_audience || "Not specified",
            location: formData.location || "Not specified",
            startDate: formData.start_date,
            endDate: formData.end_date,
            description: formData.campaign_description || "No description provided",
          },
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

      toast({
        title: "Campaign created!",
        description: "Your campaign has been submitted for review.",
      });

      navigate("/advertiser-dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="h-8 w-8" />
            Create Campaign
          </h1>
          <p className="text-muted-foreground">
            Build your advertising campaign and reach your target audience
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Provide information about your advertising campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="campaign_name">Campaign Name *</Label>
                <Input
                  id="campaign_name"
                  placeholder="Summer Product Launch 2024"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  required
                />
              </div>

              {/* Campaign Description */}
              <div className="space-y-2">
                <Label htmlFor="campaign_description">Campaign Description</Label>
                <Textarea
                  id="campaign_description"
                  placeholder="Describe your campaign objectives and key messages..."
                  value={formData.campaign_description}
                  onChange={(e) => setFormData({ ...formData, campaign_description: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Campaign Type */}
              <div className="space-y-2">
                <Label htmlFor="campaign_type">Campaign Type *</Label>
                <Select
                  value={formData.campaign_type}
                  onValueChange={(value) => setFormData({ ...formData, campaign_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                    <SelectItem value="product_launch">Product Launch</SelectItem>
                    <SelectItem value="event_promotion">Event Promotion</SelectItem>
                    <SelectItem value="seasonal">Seasonal Campaign</SelectItem>
                    <SelectItem value="ongoing">Ongoing Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ad Unit Type & Price */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ad_unit_type" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Ad Unit Type *
                  </Label>
                  <Select
                    value={formData.ad_unit_type}
                    onValueChange={(value) => setFormData({ ...formData, ad_unit_type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ad unit type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRINT_PRODUCTS.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Current Price per Unit</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/50 text-sm">
                    {adUnitPrice != null ? (
                      <span className="font-semibold text-foreground">${adUnitPrice.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">Select an ad unit</span>
                    )}
                  </div>
                  {selectedProduct && (
                    <p className="text-xs text-muted-foreground">
                      {selectedProduct.specs.size} · {selectedProduct.specs.material}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Target Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., New York, NY or Nationwide"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              {/* Budget */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_amount" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Budget Amount *
                  </Label>
                  <Input
                    id="budget_amount"
                    type="number"
                    placeholder="5000"
                    value={formData.budget_amount}
                    onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_currency">Currency</Label>
                  <Select
                    value={formData.budget_currency}
                    onValueChange={(value) => setFormData({ ...formData, budget_currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Campaign Duration */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date *
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End Date *
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="target_audience" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Target Audience
                </Label>
                <Textarea
                  id="target_audience"
                  placeholder="Describe your target audience (age, interests, demographics...)"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/advertiser-dashboard")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating Campaign..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignBuilder;
