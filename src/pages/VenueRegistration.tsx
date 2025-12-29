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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { ArrowLeft, Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { AdUnitSelector, AdUnitConfig } from "@/components/AdUnitSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OperatingHoursSelector, OperatingHoursData, formatOperatingHoursToString, isValidOperatingHours } from "@/components/OperatingHoursSelector";
import type { Json } from "@/integrations/supabase/types";

interface DocumentUpload {
  type: string;
  label: string;
  description: string;
  file: File | null;
  uploaded: boolean;
}

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
  description: z.string().trim().max(1000).optional(),
  weeklyPrice: z.string().trim().optional(),
  monthlyPrice: z.string().trim().optional()
});
const VenueRegistration = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [publisherId, setPublisherId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
  const [customVenueType, setCustomVenueType] = useState("");
  const [operatingHours, setOperatingHours] = useState<OperatingHoursData | null>(null);
  const [description, setDescription] = useState("");
  const [weeklyPrice, setWeeklyPrice] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [allowedAdFormats, setAllowedAdFormats] = useState<string[]>([]);
  const [selectedAdUnits, setSelectedAdUnits] = useState<AdUnitConfig[]>([]);

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "PHP", symbol: "₱", name: "Philippine Peso" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  ];

  const getCurrencySymbol = () => currencies.find(c => c.code === currency)?.symbol || "$";

  // Verification documents
  const [verificationDocuments, setVerificationDocuments] = useState<DocumentUpload[]>([{
    type: "business_license",
    label: "Business/Venue License",
    description: "Official business registration or venue operating license",
    file: null,
    uploaded: false
  }, {
    type: "government_id",
    label: "Government-Issued ID",
    description: "Valid ID of business owner (passport, driver's license, national ID)",
    file: null,
    uploaded: false
  }, {
    type: "proof_of_address",
    label: "Proof of Address",
    description: "Utility bill, bank statement, or lease agreement (within 3 months)",
    file: null,
    uploaded: false
  }, {
    type: "safety_certificate",
    label: "Safety Certificates",
    description: "Fire safety, occupancy permit, or health certificate",
    file: null,
    uploaded: false
  }, {
    type: "tax_documents",
    label: "Tax/Registration Documents",
    description: "Tax registration certificate or similar business documentation",
    file: null,
    uploaded: false
  }]);
  const adFormatsList = ["Poster Display", "Digital Screen", "Table Tents", "Wall Murals", "Floor Graphics", "Window Clings", "Standee/Cutout", "Banner/Flag", "Mural Painting", "Wheat Paste"];
  
  useEffect(() => {
    const checkAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const editParam = urlParams.get('edit');
      if (editParam) {
        setEditId(editParam);
        setIsEditing(true);
      }
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      const {
        data: profile,
        error
      } = await supabase.from("publisher_profiles").select("id, contact_email, contact_phone").eq("user_id", session.user.id).maybeSingle();
      if (error) {
        console.error("Error fetching publisher profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive"
        });
        return;
      }
      if (profile) {
        setPublisherId(profile.id);
        // Only set contact info if not editing (will be loaded from venue data)
        if (!editParam) {
          setContactEmail(profile.contact_email || "");
          setContactPhone(profile.contact_phone || "");
        }

        // Load existing venue data if editing
        if (editParam) {
          await loadVenueData(editParam, profile.id);
        }
      } else {
        navigate("/complete-profile");
      }
    };
    checkAuth();
  }, [navigate, toast]);
  const loadVenueData = async (venueId: string, pubId: string) => {
    try {
      const {
        data: venue,
        error
      } = await supabase.from("ad_spaces").select("*").eq("id", venueId).eq("publisher_id", pubId).maybeSingle();
      if (error) throw error;
      if (!venue) {
        toast({
          title: "Error",
          description: "Venue not found or you don't have permission to edit it.",
          variant: "destructive"
        });
        navigate("/venue-inventory");
        return;
      }

      // Populate form fields
      setTitle(venue.title || "");
      setDescription(venue.description || "");
      setUploadedImages(Array.isArray(venue.media_urls) ? venue.media_urls as string[] : []);
      const specs = venue.specifications as any || {};
      setVenueType(specs.venue_type || "");
      if (specs.custom_venue_type) {
        setCustomVenueType(specs.custom_venue_type);
      }
      // Load operating hours - check if it's structured or legacy string
      const savedHours = specs.operating_hours;
      if (savedHours && typeof savedHours === 'object') {
        setOperatingHours(savedHours as OperatingHoursData);
      } else {
        // Legacy string format - leave as null, user needs to re-enter
        setOperatingHours(null);
      }
      setAllowedAdFormats(specs.allowed_ad_formats || []);
      setContactPerson(specs.contact_person || "");
      setContactEmail(specs.contact_email || "");
      setContactPhone(specs.contact_number || "");
      setLatitude(specs.latitude || "");
      setLongitude(specs.longitude || "");

      // Parse address from location or full_address
      const fullAddress = specs.full_address || venue.location || "";
      const addressParts = fullAddress.split(", ");
      if (addressParts.length >= 2) {
        setStreet(addressParts[0] || "");
        setCity(addressParts[1] || "");
        setState(addressParts[2] || "");
        setPostalCode(addressParts[3] || "");
        setCountry(addressParts[addressParts.length - 1] || "");
      }

      // Load ad units
      if (specs.ad_units && Array.isArray(specs.ad_units)) {
        setSelectedAdUnits(specs.ad_units.map((u: any) => ({
          type: u.type,
          quantity: u.quantity || 1,
          pricePerWeek: u.pricePerWeek || 0,
          pricePerMonth: u.pricePerMonth || 0,
          specialRules: u.specialRules || "",
          customFormat: u.customFormat,
          thumbnailUrl: u.thumbnailUrl
        })));
      }
      const pricing = venue.pricing as any || {};
      setWeeklyPrice(pricing.weekly?.toString() || "");
      setMonthlyPrice(pricing.monthly?.toString() || "");
    } catch (error: any) {
      console.error("Error loading venue:", error);
      toast({
        title: "Error",
        description: "Failed to load venue data.",
        variant: "destructive"
      });
    }
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check photo limit
    if (uploadedImages.length + files.length > 30) {
      toast({
        title: "Error",
        description: "Maximum 30 photos allowed",
        variant: "destructive"
      });
      return;
    }
    setUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map(async file => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `${publisherId}/${fileName}`;
        const {
          error: uploadError,
          data
        } = await supabase.storage.from('ad-space-media').upload(filePath, file);
        if (uploadError) throw uploadError;
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from('ad-space-media').getPublicUrl(filePath);
        return publicUrl;
      });
      const urls = await Promise.all(uploadPromises);
      setUploadedImages([...uploadedImages, ...urls]);
      toast({
        title: "Success",
        description: "Images uploaded successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };
  const removeImage = (url: string) => {
    setUploadedImages(uploadedImages.filter(img => img !== url));
  };
  const toggleAdFormat = (format: string) => {
    setAllowedAdFormats(prev => prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]);
  };
  const handleDocumentSelect = (index: number, file: File | null) => {
    const newDocuments = [...verificationDocuments];
    newDocuments[index].file = file;
    setVerificationDocuments(newDocuments);
  };
  const uploadVerificationDocument = async (doc: DocumentUpload, pubId: string) => {
    if (!doc.file) return null;
    const fileExt = doc.file.name.split('.').pop();
    const fileName = `${doc.type}_${Date.now()}.${fileExt}`;
    const filePath = `${pubId}/${fileName}`;
    const {
      error: uploadError
    } = await supabase.storage.from('verification-documents').upload(filePath, doc.file);
    if (uploadError) throw uploadError;
    const {
      data: {
        publicUrl
      }
    } = supabase.storage.from('verification-documents').getPublicUrl(filePath);

    // Save document reference
    const {
      error: dbError
    } = await supabase.from('verification_documents').insert({
      publisher_id: pubId,
      document_type: doc.type,
      file_name: doc.file.name,
      file_url: publicUrl
    });
    if (dbError) throw dbError;
    return publicUrl;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publisherId) return;

    // Require at least one photo (instead of AI thumbnail)
    if (uploadedImages.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one photo of your venue",
        variant: "destructive"
      });
      return;
    }

    // Require at least one ad unit
    if (selectedAdUnits.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one ad unit type",
        variant: "destructive"
      });
      return;
    }

    // Validate operating hours
    if (!isValidOperatingHours(operatingHours)) {
      toast({
        title: "Error",
        description: "Please set valid operating hours for at least one day",
        variant: "destructive"
      });
      return;
    }

    // For new registrations, require at least one verification document
    const filledDocs = verificationDocuments.filter(doc => doc.file !== null);
    if (!isEditing && filledDocs.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one verification document",
        variant: "destructive"
      });
      return;
    }
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
        description: description || undefined,
        weeklyPrice: weeklyPrice || undefined,
        monthlyPrice: monthlyPrice || undefined
      });
      const fullAddress = [validatedData.street, validatedData.city, validatedData.state, validatedData.postalCode, validatedData.country].filter(Boolean).join(", ");
      const pricingData: any = {};
      if (validatedData.weeklyPrice) pricingData.weekly = parseFloat(validatedData.weeklyPrice);
      if (validatedData.monthlyPrice) pricingData.monthly = parseFloat(validatedData.monthlyPrice);

      // Use user-uploaded images (first image as main)
      const finalMediaUrls = uploadedImages;
      
      // Determine actual venue type (if "other", use custom value)
      const actualVenueType = venueType === "other" ? customVenueType : venueType;
      
      const venueData = {
        publisher_id: publisherId,
        title: validatedData.title,
        location: fullAddress,
        description: validatedData.description,
        specifications: JSON.parse(JSON.stringify({
          venue_type: actualVenueType,
          custom_venue_type: venueType === "other" ? customVenueType : null,
          full_address: fullAddress,
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
          contact_person: validatedData.contactPerson,
          contact_email: validatedData.contactEmail,
          contact_number: validatedData.contactPhone,
          operating_hours: operatingHours,
          operating_hours_display: formatOperatingHoursToString(operatingHours),
          allowed_ad_formats: allowedAdFormats,
          ad_units: selectedAdUnits.map(unit => ({
            type: unit.type,
            quantity: unit.quantity,
            pricePerWeek: unit.pricePerWeek,
            pricePerMonth: unit.pricePerMonth,
            specialRules: unit.specialRules,
            customFormat: unit.customFormat || null,
            thumbnailUrl: unit.thumbnailUrl || null
          }))
        })),
        pricing: Object.keys(pricingData).length > 0 ? pricingData : null,
        media_urls: finalMediaUrls
      };
      if (isEditing && editId) {
        // Update existing venue
        const {
          error
        } = await supabase.from("ad_spaces").update(venueData).eq("id", editId).eq("publisher_id", publisherId);
        if (error) throw error;

        // Upload any new verification documents (optional during edit)
        if (filledDocs.length > 0) {
          const uploadPromises = filledDocs.map(doc => uploadVerificationDocument(doc, publisherId));
          await Promise.all(uploadPromises);
        }
        toast({
          title: "Success",
          description: "Venue updated successfully"
        });
      } else {
        // Create new venue
        const {
          error
        } = await supabase.from("ad_spaces").insert([{
          ...venueData,
          approval_status: "pending" as const
        }]);
        if (error) throw error;

        // Upload verification documents
        const uploadPromises = filledDocs.map(doc => uploadVerificationDocument(doc, publisherId));
        await Promise.all(uploadPromises);

        // Update publisher profile verification status
        await supabase.from('publisher_profiles').update({
          verification_status: 'pending',
          updated_at: new Date().toISOString()
        }).eq('id', publisherId);
        toast({
          title: "Success",
          description: "Venue and verification documents submitted for approval"
        });
      }
      navigate("/venue-inventory");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit venue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">
              {isEditing ? "Edit Ad Space" : "Register Ad Space"}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {isEditing ? "Update your venue details below" : "Complete all required fields to submit your venue for approval"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Venue Name */}
              <div>
                <Label htmlFor="title">Venue Name *</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter venue name" required />
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
                    <SelectItem value="restroom">Restroom Stall</SelectItem>
                    <SelectItem value="salon">Salon/Spa</SelectItem>
                    <SelectItem value="bar">Bar/Lounge</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="coworking">Co-Working Space</SelectItem>
                    <SelectItem value="guerrilla">Guerrilla Ad Space</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {venueType === "other" && (
                  <div className="mt-2">
                    <Input
                      placeholder="Specify your venue type"
                      value={customVenueType}
                      onChange={(e) => setCustomVenueType(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Address Fields */}
              <div className="space-y-4">
                <h3 className="font-semibold">Full Address</h3>
                
                <div>
                  <Label htmlFor="street">Street Address *</Label>
                  <Input id="street" value={street} onChange={e => setStreet(e.target.value)} placeholder="123 Main Street" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="City" required />
                  </div>

                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input id="state" value={state} onChange={e => setState(e.target.value)} placeholder="State or Province" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input id="postalCode" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="Postal/ZIP Code" />
                  </div>

                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input id="country" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude (Google Maps)</Label>
                    <Input id="latitude" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="e.g., 40.7128" />
                  </div>

                  <div>
                    <Label htmlFor="longitude">Longitude (Google Maps)</Label>
                    <Input id="longitude" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="e.g., -74.0060" />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                
                <div>
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input id="contactPerson" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Full name" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input id="contactEmail" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Contact Number *</Label>
                    <Input id="contactPhone" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+1 234 567 8900" required />
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="border-t pt-6">
                <OperatingHoursSelector
                  value={operatingHours}
                  onChange={setOperatingHours}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Venue Description</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your venue and what makes it unique..." rows={4} />
              </div>

              {/* Photo Upload */}
              <div>
                <Label>Upload Additional Photos (Optional, Max 30, JPEG/PNG)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {uploadedImages.length}/30 photos uploaded. The AI-generated thumbnail will be the main preview image.
                </p>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="mt-2 text-sm text-muted-foreground">
                        {uploadingImage ? "Uploading..." : "Click to upload additional images (optional)"}
                      </span>
                    </div>
                    <input type="file" className="hidden" accept="image/jpeg,image/png" multiple onChange={handleImageUpload} disabled={uploadingImage || uploadedImages.length >= 30} />
                  </label>
                </div>
                
                {uploadedImages.length > 0 && <div className="grid grid-cols-3 gap-4 mt-4">
                    {uploadedImages.map((url, index) => <div key={index} className="relative">
                        <img src={url} alt={`Venue ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeImage(url)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>)}
                  </div>}
              </div>

              {/* Ad Unit Types Selection */}
              <div className="border-t pt-6">
                <AdUnitSelector selectedUnits={selectedAdUnits} onUnitsChange={setSelectedAdUnits} publisherId={publisherId} />
              </div>


              {/* Currency Selection */}
              <div>
                <h3 className="font-semibold mb-4">Currency</h3>
                <div className="max-w-xs">
                  <Label htmlFor="currency">Select Currency *</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.code} - {curr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Verification Documents */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4">
                  Verification Documents {!isEditing && "*"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isEditing ? "Upload additional verification documents if needed (optional during edit)" : "Upload at least one verification document to submit your venue for approval"}
                </p>

                <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-300">
                    <strong>Global Compliance:</strong> These requirements work for venues worldwide. Upload equivalent documents based on your country's regulations.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {verificationDocuments.map((doc, index) => <Card key={doc.type} className={doc.uploaded ? "border-green-200 bg-green-50/50" : ""}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Label className="text-sm font-semibold">
                                {doc.label}
                              </Label>
                              {doc.uploaded && <CheckCircle className="w-4 h-4 text-green-600" />}
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              {doc.description}
                            </p>
                            
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted/50 text-sm">
                                <Upload className="w-4 h-4" />
                                <span>
                                  {doc.file ? doc.file.name : "Choose file"}
                                </span>
                                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleDocumentSelect(index, e.target.files?.[0] || null)} disabled={loading} />
                              </label>
                              
                              {doc.file && <Button type="button" variant="ghost" size="sm" onClick={() => handleDocumentSelect(index, null)}>
                                  Remove
                                </Button>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
                </div>

                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Accepted formats: PDF, JPG, PNG. Maximum file size: 10MB per document.
                  </AlertDescription>
                </Alert>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? isEditing ? "Updating..." : "Submitting..." : isEditing ? "Update Venue" : "Submit for Approval"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default VenueRegistration;