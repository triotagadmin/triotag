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

const venueSchema = z.object({
  title: z.string().trim().min(1, "Venue name is required").max(100),
  street: z.string().trim().min(1, "Street address is required").max(200),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().min(1, "Country is required").max(100),
  latitude: z.string().trim().optional(),
  longitude: z.string().trim().optional(),
  contactPerson: z.string().trim().min(1, "Contact person is required").max(100),
  contactEmail: z.string().trim().email("Invalid email").max(255),
  contactPhone: z.string().trim().min(1, "Phone is required").max(20),
  venueType: z.string().min(1, "Venue type is required"),
  operatingHours: z.string().trim().min(1, "Operating hours are required").max(500),
  expectedFootTraffic: z.string().trim().min(1, "Expected foot traffic is required").max(500),
  description: z.string().trim().max(1000).optional(),
  weeklyPrice: z.string().trim().optional(),
  monthlyPrice: z.string().trim().optional(),
});

const VenueRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [publisherId, setPublisherId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [venueType, setVenueType] = useState("");
  const [operatingHours, setOperatingHours] = useState("");
  const [expectedFootTraffic, setExpectedFootTraffic] = useState("");
  const [description, setDescription] = useState("");
  const [weeklyPrice, setWeeklyPrice] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [allowedAdFormats, setAllowedAdFormats] = useState<string[]>([]);

  const amenitiesList = [
    "Wi-Fi",
    "Parking",
    "AV Equipment",
    "Catering",
    "Wheelchair Accessible",
    "Air Conditioning",
    "Restrooms",
    "Stage/Platform",
  ];

  const adFormatsList = [
    "Poster Display",
    "Digital Screen",
    "Table Tents",
    "Wall Murals",
    "Floor Graphics",
    "Window Clings",
    "Standee/Cutout",
    "Banner/Flag",
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
        .select("id, contact_email, contact_phone")
        .eq("user_id", session.user.id)
        .single();

      if (profile) {
        setPublisherId(profile.id);
        setContactEmail(profile.contact_email || "");
        setContactPhone(profile.contact_phone || "");
      } else {
        navigate("/complete-profile");
      }
    };

    checkAuth();
  }, [navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check photo limit
    if (uploadedImages.length + files.length > 30) {
      toast({
        title: "Error",
        description: "Maximum 30 photos allowed",
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

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const toggleAdFormat = (format: string) => {
    setAllowedAdFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publisherId) return;
    
    setLoading(true);

    try {
      const validatedData = venueSchema.parse({
        title,
        street,
        city,
        state: state || undefined,
        postalCode: postalCode || undefined,
        country,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        contactPerson,
        contactEmail,
        contactPhone,
        venueType,
        operatingHours,
        expectedFootTraffic,
        description: description || undefined,
        weeklyPrice: weeklyPrice || undefined,
        monthlyPrice: monthlyPrice || undefined,
      });

      const fullAddress = [
        validatedData.street,
        validatedData.city,
        validatedData.state,
        validatedData.postalCode,
        validatedData.country
      ].filter(Boolean).join(", ");

      const pricingData: any = {};
      if (validatedData.weeklyPrice) pricingData.weekly = parseFloat(validatedData.weeklyPrice);
      if (validatedData.monthlyPrice) pricingData.monthly = parseFloat(validatedData.monthlyPrice);

      const { error } = await supabase
        .from("ad_spaces")
        .insert({
          publisher_id: publisherId,
          title: validatedData.title,
          location: fullAddress,
          description: validatedData.description,
          approval_status: "pending",
          specifications: {
            venue_type: validatedData.venueType,
            full_address: fullAddress,
            latitude: validatedData.latitude,
            longitude: validatedData.longitude,
            contact_person: validatedData.contactPerson,
            contact_email: validatedData.contactEmail,
            contact_number: validatedData.contactPhone,
            operating_hours: validatedData.operatingHours,
            expected_foot_traffic: validatedData.expectedFootTraffic,
            amenities,
            allowed_ad_formats: allowedAdFormats,
          },
          pricing: Object.keys(pricingData).length > 0 ? pricingData : null,
          media_urls: uploadedImages,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Venue submitted for approval",
      });

      navigate("/inventory");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit venue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="bg-card border-b">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate("/inventory")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inventory
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Register New Venue Space</CardTitle>
            <p className="text-muted-foreground mt-2">
              Complete all required fields to submit your venue for approval
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Venue Name */}
              <div>
                <Label htmlFor="title">Venue Name *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter venue name"
                  required
                />
              </div>

              {/* Venue Type */}
              <div>
                <Label htmlFor="venueType">Venue Type *</Label>
                <Select value={venueType} onValueChange={setVenueType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="cafe">Café</SelectItem>
                    <SelectItem value="gym">Gym/Fitness Center</SelectItem>
                    <SelectItem value="mall_corridor">Mall Corridor</SelectItem>
                    <SelectItem value="restroom">Restroom Stall</SelectItem>
                    <SelectItem value="salon">Salon/Spa</SelectItem>
                    <SelectItem value="bar">Bar/Lounge</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="retail">Retail Store</SelectItem>
                    <SelectItem value="coworking">Co-Working Space</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Address Fields */}
              <div className="space-y-4">
                <h3 className="font-semibold">Full Address</h3>
                
                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State or Province"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Postal/ZIP Code"
                    />
                  </div>

                  <div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude (Google Maps)</Label>
                    <Input
                      id="latitude"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="e.g., 40.7128"
                    />
                  </div>

                  <div>
                    <Label htmlFor="longitude">Longitude (Google Maps)</Label>
                    <Input
                      id="longitude"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="e.g., -74.0060"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                
                <div>
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Full name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Contact Number *</Label>
                    <Input
                      id="contactPhone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div>
                <Label htmlFor="operatingHours">Operating Hours *</Label>
                <Textarea
                  id="operatingHours"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  placeholder="e.g., Monday-Friday: 9 AM - 10 PM, Saturday-Sunday: 10 AM - 11 PM"
                  rows={3}
                  required
                />
              </div>

              {/* Expected Foot Traffic */}
              <div>
                <Label htmlFor="expectedFootTraffic">Expected Foot Traffic *</Label>
                <Input
                  id="expectedFootTraffic"
                  value={expectedFootTraffic}
                  onChange={(e) => setExpectedFootTraffic(e.target.value)}
                  placeholder="e.g., 500-1000 daily visitors"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Venue Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your venue and what makes it unique..."
                  rows={4}
                />
              </div>

              {/* Photo Upload */}
              <div>
                <Label>Upload Photos (Max 30, JPEG/PNG) *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {uploadedImages.length}/30 photos uploaded
                </p>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="mt-2 text-sm text-muted-foreground">
                        {uploadingImage ? "Uploading..." : "Click to upload images"}
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImage || uploadedImages.length >= 30}
                    />
                  </label>
                </div>
                
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Venue ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeImage(url)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Allowed Ad Formats */}
              <div>
                <Label>Allowed Ad Formats (check all that apply) *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {adFormatsList.map((format) => (
                    <div key={format} className="flex items-center space-x-2">
                      <Checkbox
                        id={`format-${format}`}
                        checked={allowedAdFormats.includes(format)}
                        onCheckedChange={() => toggleAdFormat(format)}
                      />
                      <label
                        htmlFor={`format-${format}`}
                        className="text-sm cursor-pointer"
                      >
                        {format}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <Label>Amenities (optional)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {amenitiesList.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={amenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      <label
                        htmlFor={amenity}
                        className="text-sm cursor-pointer"
                      >
                        {amenity}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="font-semibold mb-4">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weeklyPrice">Price per Week ($)</Label>
                    <Input
                      id="weeklyPrice"
                      type="number"
                      value={weeklyPrice}
                      onChange={(e) => setWeeklyPrice(e.target.value)}
                      placeholder="e.g., 500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthlyPrice">Price per Month ($)</Label>
                    <Input
                      id="monthlyPrice"
                      type="number"
                      value={monthlyPrice}
                      onChange={(e) => setMonthlyPrice(e.target.value)}
                      placeholder="e.g., 1800"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || uploadedImages.length === 0}>
                {loading ? "Submitting..." : "Submit for Approval"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VenueRegistration;
