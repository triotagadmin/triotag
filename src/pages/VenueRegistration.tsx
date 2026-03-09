import { useState, useEffect, useRef } from "react";
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
import { ArrowLeft, ArrowRight, Upload, X, CheckCircle, AlertCircle, Building2, Megaphone, Loader2, Plus, Trash2, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentUploadState {
  type: string;
  label: string;
  description: string;
  file: File | null;
  uploaded: boolean;
  existingUrl?: string;
  existingFileName?: string;
}

interface AdditionalLocation {
  id: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

interface EnvironmentDetails {
  venueType: string;
  venueSize: string;
  seatingCapacity: string;
  environment: string;
  customerActivity: string[];
  adPlacementAreas: string[];
  customerDemographics: string[];
  exactLocationNotes: string;
  visibility: string;
}

const VENUE_TYPES = [
  { value: "cafe", label: "Café" },
  { value: "restaurant", label: "Restaurant" },
  { value: "gym", label: "Gym/Fitness Center" },
  { value: "spa", label: "Spa/Salon" },
  { value: "retail", label: "Retail Store" },
  { value: "bar", label: "Bar/Lounge" },
  { value: "hotel", label: "Hotel" },
  { value: "coworking", label: "Co-Working Space" },
  { value: "clinic", label: "Clinic/Healthcare" },
  { value: "laundry", label: "Laundromat" },
  { value: "gas_station", label: "Gas Station" },
  { value: "convenience", label: "Convenience Store" },
  { value: "library", label: "Library" },
  { value: "salon", label: "Salon / Barbershop" },
  { value: "other", label: "Other" },
];

const INDUSTRY_CATEGORIES = [
  "Food & Beverage", "Health & Wellness", "Retail & Shopping", "Hospitality & Travel",
  "Entertainment & Leisure", "Automotive & Transport", "Education & Training",
  "Professional Services", "Beauty & Personal Care", "Other",
];

const AD_UNIT_MATERIALS = [
  { value: "vinyl_sticker", label: "Vinyl Sticker" },
  { value: "table_tent_card", label: "Table Tent Card" },
  { value: "acrylic_table_tent", label: "Acrylic Table Tent" },
  { value: "coroplast_stand", label: "Coroplast Stand" },
  { value: "poster_frame", label: "Poster Frame" },
  { value: "wall_decal", label: "Wall Decal" },
];

const CUSTOMER_ACTIVITY_OPTIONS = [
  "Dining", "Studying", "Shopping", "Fitness", "Socializing", "Waiting Area", "Services (salon, spa, etc.)",
];

const AD_PLACEMENT_OPTIONS = [
  "Tables", "Counter Area", "Walls", "Entrance Area", "Waiting Area", "Shelves / Displays",
];

const CUSTOMER_DEMOGRAPHICS = [
  "Students", "Young Professionals", "Families", "Fitness Enthusiasts", "Tourists", "Local Residents",
];

const ENVIRONMENT_OPTIONS = [
  { value: "indoor", label: "Indoor" },
  { value: "semi_outdoor", label: "Semi-Outdoor" },
  { value: "mixed", label: "Mixed Environment" },
];

const VISIBILITY_OPTIONS = [
  "Excellent (unobstructed)", "Good (minor obstructions)", "Moderate (partial visibility)", "Limited",
];

const DEFAULT_DESCRIPTION = "Advertise across multiple locations of this brand. Tiny Sticky Ads connects advertisers with high-traffic ad spaces where small-format ads such as vinyl stickers, table tents, and acrylic displays can be placed inside the establishment.";

const VenueRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [publisherId, setPublisherId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const submittedRef = useRef(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Brand Details
  const [title, setTitle] = useState("");
  const [venueType, setVenueType] = useState("");
  const [customVenueType, setCustomVenueType] = useState("");
  const [industryCategory, setIndustryCategory] = useState("");
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [operatingHours, setOperatingHours] = useState("");

  // Additional Locations
  const [additionalLocations, setAdditionalLocations] = useState<AdditionalLocation[]>([]);

  // Ad Unit Materials (multi-select)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  // Lease Pricing
  const [weeklyLeasePrice, setWeeklyLeasePrice] = useState("");
  const [monthlyLeasePrice, setMonthlyLeasePrice] = useState("");
  const [leaseCurrency, setLeaseCurrency] = useState("USD");

  // Environment Details (Step 2 replacement)
  const [envDetails, setEnvDetails] = useState<EnvironmentDetails>({
    venueType: "", venueSize: "", seatingCapacity: "", environment: "",
    customerActivity: [], adPlacementAreas: [], customerDemographics: [],
    exactLocationNotes: "", visibility: "",
  });

  const [verificationDocuments, setVerificationDocuments] = useState<DocumentUploadState[]>([
    { type: "business_license", label: "Business/Venue License", description: "Official business registration or venue operating license", file: null, uploaded: false },
    { type: "government_id", label: "Government-Issued ID", description: "Valid ID of business owner (passport, driver's license, national ID)", file: null, uploaded: false },
    { type: "proof_of_address", label: "Proof of Address", description: "Utility bill, bank statement, or lease agreement (within 3 months)", file: null, uploaded: false },
    { type: "tax_documents", label: "Tax/Registration Documents", description: "Tax registration certificate or similar business documentation", file: null, uploaded: false },
  ]);

  useEffect(() => {
    const checkAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const editParam = urlParams.get('edit');
      if (editParam) { setEditId(editParam); setIsEditing(true); }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data: profile, error } = await supabase
        .from("publisher_profiles").select("id, contact_email, contact_phone").eq("user_id", session.user.id).maybeSingle();
      if (error) { toast({ title: "Error", description: "Failed to load profile.", variant: "destructive" }); return; }
      if (profile) {
        setPublisherId(profile.id);
        if (!editParam) { setContactEmail(profile.contact_email || ""); setContactPhone(profile.contact_phone || ""); }
        if (editParam) await loadVenueData(editParam, profile.id);
      } else { navigate("/auth"); }
    };
    checkAuth();
  }, [navigate, toast]);

  const loadVenueData = async (venueId: string, pubId: string) => {
    try {
      const { data: venue, error } = await supabase.from("ad_spaces").select("*").eq("id", venueId).eq("publisher_id", pubId).maybeSingle();
      if (error) throw error;
      if (!venue) { toast({ title: "Error", description: "Listing not found.", variant: "destructive" }); navigate("/venue-inventory"); return; }

      setTitle(venue.title || "");
      setDescription(venue.description || "");
      setUploadedImages(Array.isArray(venue.media_urls) ? venue.media_urls as string[] : []);
      const specs = venue.specifications as any || {};
      setVenueType(specs.venue_type || "");
      if (specs.custom_venue_type) setCustomVenueType(specs.custom_venue_type);
      setIndustryCategory(specs.industry_category || "");
      setOperatingHours(specs.operating_hours || "");
      setContactPerson(specs.contact_person || "");
      setContactEmail(specs.contact_email || "");
      setContactPhone(specs.contact_number || "");
      setSelectedMaterials(specs.ad_unit_materials || []);
      setWeeklyLeasePrice(specs.weekly_lease_price?.toString() || "");
      setMonthlyLeasePrice(specs.monthly_lease_price?.toString() || "");
      setLeaseCurrency(specs.lease_currency || "USD");
      if (specs.additional_locations) setAdditionalLocations(specs.additional_locations);

      const fullAddress = specs.head_office_address || {};
      setStreet(fullAddress.street || "");
      setCity(fullAddress.city || "");
      setState(fullAddress.state || "");
      setPostalCode(fullAddress.postal_code || "");
      setCountry(fullAddress.country || "");

      if (specs.environment_details) {
        setEnvDetails({ ...envDetails, ...specs.environment_details });
      }

      const { data: existingDocs } = await supabase.from("verification_documents").select("*").eq("publisher_id", pubId);
      if (existingDocs && existingDocs.length > 0) {
        setVerificationDocuments(prev => prev.map(doc => {
          const existingDoc = existingDocs.find(d => d.document_type === doc.type);
          return existingDoc ? { ...doc, uploaded: true, existingUrl: existingDoc.file_url, existingFileName: existingDoc.file_name } : doc;
        }));
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (uploadedImages.length + files.length > 30) { toast({ title: "Error", description: "Maximum 30 photos allowed", variant: "destructive" }); return; }
    setUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map(async file => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `${publisherId}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('ad-space-media').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('ad-space-media').getPublicUrl(filePath);
        return publicUrl;
      });
      const urls = await Promise.all(uploadPromises);
      setUploadedImages([...uploadedImages, ...urls]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setUploadingImage(false); }
  };

  const removeImage = (url: string) => setUploadedImages(uploadedImages.filter(img => img !== url));
  const handleDocumentSelect = (index: number, file: File | null) => {
    const newDocs = [...verificationDocuments]; newDocs[index].file = file; setVerificationDocuments(newDocs);
  };

  // Additional Locations
  const addLocation = () => setAdditionalLocations([...additionalLocations, { id: crypto.randomUUID(), address: "", city: "", province: "", postalCode: "" }]);
  const removeLocation = (id: string) => setAdditionalLocations(additionalLocations.filter(l => l.id !== id));
  const updateLocation = (id: string, field: keyof AdditionalLocation, value: string) => {
    setAdditionalLocations(additionalLocations.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  // Materials toggle
  const toggleMaterial = (value: string) => {
    setSelectedMaterials(prev => prev.includes(value) ? prev.filter(m => m !== value) : [...prev, value]);
  };

  // Environment toggles
  const toggleEnvArray = (field: keyof EnvironmentDetails, value: string) => {
    const current = envDetails[field] as string[];
    setEnvDetails(prev => ({
      ...prev,
      [field]: current.includes(value) ? current.filter(v => v !== value) : [...current, value],
    }));
  };

  const validateStep1 = () => {
    if (!title.trim()) { toast({ title: "Error", description: "Franchise/brand name is required", variant: "destructive" }); return false; }
    if (!venueType) { toast({ title: "Error", description: "Venue type is required", variant: "destructive" }); return false; }
    if (!industryCategory) { toast({ title: "Error", description: "Industry category is required", variant: "destructive" }); return false; }
    if (!description.trim()) { toast({ title: "Error", description: "Brand description is required", variant: "destructive" }); return false; }
    if (!contactPerson.trim()) { toast({ title: "Error", description: "Contact person is required", variant: "destructive" }); return false; }
    if (!contactEmail.trim()) { toast({ title: "Error", description: "Contact email is required", variant: "destructive" }); return false; }
    if (!contactPhone.trim()) { toast({ title: "Error", description: "Contact phone is required", variant: "destructive" }); return false; }
    if (uploadedImages.length === 0) { toast({ title: "Error", description: "Please upload at least one photo", variant: "destructive" }); return false; }
    if (selectedMaterials.length === 0) { toast({ title: "Error", description: "Please select at least one ad unit material", variant: "destructive" }); return false; }
    const filledDocs = verificationDocuments.filter(doc => doc.file !== null);
    if (!isEditing && filledDocs.length === 0) { toast({ title: "Error", description: "Please upload at least one verification document", variant: "destructive" }); return false; }
    return true;
  };

  const handleNextStep = () => { if (validateStep1()) { setCurrentStep(2); window.scrollTo(0, 0); } };
  const handlePrevStep = () => { setCurrentStep(1); window.scrollTo(0, 0); };

  const buildVenueData = () => {
    const actualVenueType = venueType === "other" ? customVenueType : venueType;
    const headOfficeAddress = [street, city, state, postalCode, country].filter(Boolean).join(", ");
    const locsJson = additionalLocations.map(l => ({ id: l.id, address: l.address, city: l.city, province: l.province, postalCode: l.postalCode }));
    const envJson = {
      venueType: envDetails.venueType, venueSize: envDetails.venueSize, seatingCapacity: envDetails.seatingCapacity,
      environment: envDetails.environment, customerActivity: envDetails.customerActivity,
      adPlacementAreas: envDetails.adPlacementAreas, customerDemographics: envDetails.customerDemographics,
      exactLocationNotes: envDetails.exactLocationNotes, visibility: envDetails.visibility,
    };
    return {
      publisher_id: publisherId,
      title: title.trim(),
      location: headOfficeAddress || null,
      description: description.trim(),
      latitude: null as number | null, longitude: null as number | null,
      specifications: {
        venue_type: actualVenueType,
        custom_venue_type: venueType === "other" ? customVenueType : null,
        industry_category: industryCategory,
        is_franchise: true,
        head_office_address: { street: street.trim(), city: city.trim(), state: state.trim(), postal_code: postalCode.trim(), country: country.trim() },
        contact_person: contactPerson.trim(),
        contact_email: contactEmail.trim(),
        contact_number: contactPhone.trim(),
        operating_hours: operatingHours.trim() || null,
        additional_locations: locsJson,
        ad_unit_materials: selectedMaterials,
        weekly_lease_price: weeklyLeasePrice ? parseFloat(weeklyLeasePrice) : null,
        monthly_lease_price: monthlyLeasePrice ? parseFloat(monthlyLeasePrice) : null,
        lease_currency: leaseCurrency,
        environment_details: envJson,
      } as any,
      media_urls: uploadedImages,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publisherId || submittedRef.current) return;
    submittedRef.current = true;
    setLoading(true);
    try {
      const venueData = buildVenueData();
      const filledDocs = verificationDocuments.filter(doc => doc.file !== null);

      // Upload docs
      for (const doc of filledDocs) {
        if (!doc.file) continue;
        const fileExt = doc.file.name.split('.').pop();
        const fileName = `${doc.type}_${Date.now()}.${fileExt}`;
        const filePath = `${publisherId}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('verification-documents').upload(filePath, doc.file);
        if (uploadError) throw uploadError;
        await supabase.from('verification_documents').insert({ publisher_id: publisherId, document_type: doc.type, file_name: doc.file.name, file_url: filePath });
      }

      if (isEditing) {
        const { error } = await supabase.from("ad_spaces").update(venueData).eq("id", editId!).eq("publisher_id", publisherId);
        if (error) throw error;
        toast({ title: "Success", description: "Listing updated successfully" });
        navigate("/venue-inventory");
      } else {
        const { data: insertedData, error: insertError } = await supabase.from("ad_spaces").insert([{ ...venueData, approval_status: "pending" as const }]).select("id").single();
        if (insertError) throw insertError;

        // Save additional locations as franchise branches
        if (insertedData && additionalLocations.length > 0) {
          const branchRows = additionalLocations
            .filter(loc => loc.address.trim())
            .map(loc => ({
              franchise_id: insertedData.id,
              place_name: loc.city.trim() || loc.address.trim(),
              full_address: [loc.address, loc.city, loc.province, loc.postalCode].filter(Boolean).join(", "),
            }));
          if (branchRows.length > 0) {
            const { error: branchError } = await supabase.from("franchise_branches").insert(branchRows);
            if (branchError) console.error("Branch save error:", branchError);
          }
        }

        setShowConfirmation(true);
        window.scrollTo(0, 0);
      }
    } catch (error: any) {
      submittedRef.current = false;
      toast({ title: "Error", description: error.message || "Submission failed", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <p className={`text-sm font-medium ${currentStep >= 1 ? "text-foreground" : "text-muted-foreground"}`}>Step 1</p>
            <p className="text-xs text-muted-foreground">Ad Space Details</p>
          </div>
        </div>
        <div className={`w-16 h-1 rounded transition-colors ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`} />
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <p className={`text-sm font-medium ${currentStep >= 2 ? "text-foreground" : "text-muted-foreground"}`}>Step 2</p>
            <p className="text-xs text-muted-foreground">Environment Details</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (showConfirmation) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-lg mx-auto text-center">
            <Card>
              <CardContent className="pt-8 pb-8 space-y-4">
                <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                <h2 className="text-2xl font-bold">Ad Space Registration Submitted!</h2>
                <p className="text-muted-foreground">
                  Your ad space listing has been submitted and is now <strong>Pending Review</strong>.
                  Once approved, you can start adding branch locations from your dashboard.
                </p>
                <div className="glass rounded-[14px] p-4 mt-4">
                  <p className="text-sm text-muted-foreground">Status: <span className="font-semibold text-primary">Pending Review</span></p>
                </div>
                <Button onClick={() => navigate("/venue-inventory")} className="mt-4">Go to My Ad Spaces</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-4xl">
        <Card className="rounded-[24px]">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">
              {isEditing ? "Edit Ad Space Listing" : "Register Franchise / Multi-Location Ad Space"}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {isEditing ? "Update your ad space details below" : "Register a brand or franchise with multiple locations. After approval, you can add individual branches from your dashboard."}
            </p>
          </CardHeader>
          <CardContent>
            <StepIndicator />

            {currentStep === 1 && (
              <form className="space-y-6">
                {/* Brand Name */}
                <div>
                  <Label htmlFor="title">Ad Space Name *</Label>
                  <p className="text-xs text-muted-foreground mb-1">Franchise or brand name</p>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Coffee Spot, FitLife Gym" required />
                </div>

                {/* Venue Type */}
                <div>
                  <Label>Ad Space Type *</Label>
                  <Select value={venueType} onValueChange={setVenueType}>
                    <SelectTrigger className="rounded-[14px]"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{VENUE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                  {venueType === "other" && <Input className="mt-2" placeholder="Specify type" value={customVenueType} onChange={e => setCustomVenueType(e.target.value)} />}
                </div>

                {/* Industry */}
                <div>
                  <Label>Industry Category *</Label>
                  <Select value={industryCategory} onValueChange={setIndustryCategory}>
                    <SelectTrigger className="rounded-[14px]"><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>{INDUSTRY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Brand Description *</Label>
                  <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="rounded-[14px]" required />
                </div>

                {/* Head Office Address */}
                <Card className="rounded-[20px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Head Office / Primary Contact Address</CardTitle>
                    <p className="text-xs text-muted-foreground">This is NOT used as a branch listing.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div><Label>Street Address</Label><Input value={street} onChange={e => setStreet(e.target.value)} placeholder="123 Main Street" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" /></div>
                      <div><Label>State/Province</Label><Input value={state} onChange={e => setState(e.target.value)} placeholder="State" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Postal Code</Label><Input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="ZIP" /></div>
                      <div><Label>Country</Label><Input value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" /></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Locations */}
                <Card className="rounded-[20px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Additional Ad Space Locations</CardTitle>
                    <p className="text-xs text-muted-foreground">If your organization manages multiple locations, you can add them here. Each location will be listed as a separate ad space under your publisher account.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {additionalLocations.map((loc) => (
                      <Card key={loc.id} className="rounded-[14px]">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="font-semibold text-primary">Location</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeLocation(loc.id)} className="text-destructive h-8">
                              <Trash2 className="h-4 w-4 mr-1" /> Remove
                            </Button>
                          </div>
                          <Input placeholder="Address" value={loc.address} onChange={e => updateLocation(loc.id, "address", e.target.value)} />
                          <div className="grid grid-cols-2 gap-3">
                            <Input placeholder="City" value={loc.city} onChange={e => updateLocation(loc.id, "city", e.target.value)} />
                            <Input placeholder="Province" value={loc.province} onChange={e => updateLocation(loc.id, "province", e.target.value)} />
                          </div>
                          <Input placeholder="Postal Code" value={loc.postalCode} onChange={e => updateLocation(loc.id, "postalCode", e.target.value)} />
                        </CardContent>
                      </Card>
                    ))}
                    <Button type="button" variant="outline" className="w-full" onClick={addLocation}>
                      <Plus className="h-4 w-4 mr-2" /> Add Another Location
                    </Button>
                    <p className="text-xs text-muted-foreground">You can add multiple locations such as different café branches, library locations, or retail outlets.</p>
                  </CardContent>
                </Card>

                {/* Ad Unit Materials */}
                <Card className="rounded-[20px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Ad Unit Materials</CardTitle>
                    <p className="text-xs text-muted-foreground">Select the types of advertising materials that can be installed in this ad space.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {AD_UNIT_MATERIALS.map(mat => (
                        <div key={mat.value} className="flex items-center space-x-2">
                          <Checkbox id={`mat-${mat.value}`} checked={selectedMaterials.includes(mat.value)} onCheckedChange={() => toggleMaterial(mat.value)} />
                          <Label htmlFor={`mat-${mat.value}`} className="text-sm font-normal cursor-pointer">{mat.label}</Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Lease Pricing */}
                <Card className="rounded-[20px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Ad Space Lease Pricing</CardTitle>
                    <p className="text-xs text-muted-foreground">Set the lease price for advertisers who want to place ads in this ad space. This pricing represents the cost of using the ad space itself, not the ad material.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Currency</Label>
                      <Select value={leaseCurrency} onValueChange={setLeaseCurrency}>
                        <SelectTrigger className="rounded-[14px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="PHP">PHP</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Weekly Lease Price</Label>
                        <Input type="number" value={weeklyLeasePrice} onChange={e => setWeeklyLeasePrice(e.target.value)} placeholder="0.00" />
                      </div>
                      <div>
                        <Label>Monthly Lease Price</Label>
                        <Input type="number" value={monthlyLeasePrice} onChange={e => setMonthlyLeasePrice(e.target.value)} placeholder="0.00" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Info */}
                <Card className="rounded-[20px]">
                  <CardHeader className="pb-2"><CardTitle className="text-lg">Contact Information</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div><Label>Contact Person *</Label><Input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Full name" required /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Contact Email *</Label><Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required /></div>
                      <div><Label>Contact Number *</Label><Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+1 234 567 8900" required /></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Operating Hours */}
                <div>
                  <Label>Operating Hours (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-1">Leave blank if hours vary by branch</p>
                  <Textarea value={operatingHours} onChange={e => setOperatingHours(e.target.value)} placeholder="e.g., Mon-Fri: 9AM-10PM" rows={3} className="rounded-[14px]" />
                </div>

                {/* Photos */}
                <div>
                  <Label>Upload Photos *</Label>
                  <p className="text-sm text-muted-foreground mb-2">Upload photos representing different branches. {uploadedImages.length}/30</p>
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-[14px] cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="mt-2 text-sm text-muted-foreground">{uploadingImage ? "Uploading..." : "Click to upload"}</span>
                    </div>
                    <input type="file" className="hidden" accept="image/jpeg,image/png" multiple onChange={handleImageUpload} disabled={uploadingImage || uploadedImages.length >= 30} />
                  </label>
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {uploadedImages.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt={`Photo ${i + 1}`} className="w-full h-32 object-cover rounded-[14px]" />
                          <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6 rounded-full" onClick={() => removeImage(url)}><X className="h-4 w-4" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verification Documents */}
                <Card className="rounded-[20px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Verification Documents {!isEditing && "*"}</CardTitle>
                    <p className="text-sm text-muted-foreground">{isEditing ? "Upload additional documents if needed" : "Upload at least one verification document"}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="rounded-[14px]">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription><strong>Global Compliance:</strong> Upload equivalent documents based on your country's regulations.</AlertDescription>
                    </Alert>
                    {verificationDocuments.map((doc, index) => (
                      <Card key={doc.type} className={`rounded-[14px] ${doc.uploaded || doc.existingUrl ? "border-primary/30" : ""}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Label className="text-sm font-semibold">{doc.label}</Label>
                            {(doc.uploaded || doc.existingUrl) && <CheckCircle className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{doc.description}</p>
                          {doc.existingUrl && !doc.file && (
                            <div className="flex items-center gap-2 mb-3 p-2 glass rounded-[10px]">
                              <span className="text-sm text-muted-foreground truncate flex-1">{doc.existingFileName || "Uploaded document"}</span>
                              <a href={doc.existingUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">View</a>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-3 py-1.5 glass rounded-[10px] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] text-sm transition-colors">
                              <Upload className="w-4 h-4" />
                              <span>{doc.file ? doc.file.name : doc.existingUrl ? "Replace" : "Choose file"}</span>
                              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleDocumentSelect(index, e.target.files?.[0] || null)} disabled={loading} />
                            </label>
                            {doc.file && <Button type="button" variant="ghost" size="sm" onClick={() => handleDocumentSelect(index, null)}>Remove</Button>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Alert className="rounded-[14px]"><AlertCircle className="h-4 w-4" /><AlertDescription>Accepted: PDF, JPG, PNG. Max 10MB per file.</AlertDescription></Alert>
                  </CardContent>
                </Card>

                <div className="pt-6 border-t border-[rgba(255,255,255,0.08)]">
                  <Button type="button" className="w-full" onClick={handleNextStep}>
                    Next: Ad Space Environment Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {currentStep === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Ad Space Environment Details */}
                <Card className="rounded-[20px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Ad Space Environment Details</CardTitle>
                    <p className="text-xs text-muted-foreground">Describe the physical characteristics of the establishment where ads are placed.</p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Venue Type */}
                    <div>
                      <Label>Venue Type</Label>
                      <Select value={envDetails.venueType} onValueChange={v => setEnvDetails(p => ({ ...p, venueType: v }))}>
                        <SelectTrigger className="rounded-[14px]"><SelectValue placeholder="Select venue type" /></SelectTrigger>
                        <SelectContent>
                          {["Coffee Shop", "Restaurant", "Library", "Gym", "Coworking Space", "Retail Store", "Salon / Barbershop", "Spa", "Other"].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Venue Size */}
                    <div>
                      <Label>Venue Floor Area (sqm)</Label>
                      <Input type="number" value={envDetails.venueSize} onChange={e => setEnvDetails(p => ({ ...p, venueSize: e.target.value }))} placeholder="e.g., 120" />
                    </div>

                    {/* Seating */}
                    <div>
                      <Label>Estimated Seating Capacity</Label>
                      <Input type="number" value={envDetails.seatingCapacity} onChange={e => setEnvDetails(p => ({ ...p, seatingCapacity: e.target.value }))} placeholder="e.g., 40" />
                    </div>

                    {/* Environment */}
                    <div>
                      <Label>Indoor / Semi-Outdoor Environment</Label>
                      <Select value={envDetails.environment} onValueChange={v => setEnvDetails(p => ({ ...p, environment: v }))}>
                        <SelectTrigger className="rounded-[14px]"><SelectValue placeholder="Select environment" /></SelectTrigger>
                        <SelectContent>{ENVIRONMENT_OPTIONS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>

                    {/* Customer Activity */}
                    <div>
                      <Label>Customer Activity Type</Label>
                      <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
                      <div className="grid grid-cols-2 gap-2">
                        {CUSTOMER_ACTIVITY_OPTIONS.map(opt => (
                          <div key={opt} className="flex items-center space-x-2">
                            <Checkbox id={`act-${opt}`} checked={envDetails.customerActivity.includes(opt)} onCheckedChange={() => toggleEnvArray("customerActivity", opt)} />
                            <Label htmlFor={`act-${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Placement Areas */}
                    <div>
                      <Label>Ad Placement Areas</Label>
                      <p className="text-xs text-muted-foreground mb-2">Where can ads appear?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {AD_PLACEMENT_OPTIONS.map(opt => (
                          <div key={opt} className="flex items-center space-x-2">
                            <Checkbox id={`place-${opt}`} checked={envDetails.adPlacementAreas.includes(opt)} onCheckedChange={() => toggleEnvArray("adPlacementAreas", opt)} />
                            <Label htmlFor={`place-${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Demographics */}
                    <div>
                      <Label>Customer Demographics (Optional)</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {CUSTOMER_DEMOGRAPHICS.map(opt => (
                          <div key={opt} className="flex items-center space-x-2">
                            <Checkbox id={`demo-${opt}`} checked={envDetails.customerDemographics.includes(opt)} onCheckedChange={() => toggleEnvArray("customerDemographics", opt)} />
                            <Label htmlFor={`demo-${opt}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Visibility */}
                    <div>
                      <Label>Visibility</Label>
                      <Select value={envDetails.visibility} onValueChange={v => setEnvDetails(p => ({ ...p, visibility: v }))}>
                        <SelectTrigger className="rounded-[14px]"><SelectValue placeholder="Select visibility level" /></SelectTrigger>
                        <SelectContent>{VISIBILITY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>

                    {/* Placement Notes */}
                    <div>
                      <Label>Exact Placement Notes</Label>
                      <Textarea value={envDetails.exactLocationNotes} onChange={e => setEnvDetails(p => ({ ...p, exactLocationNotes: e.target.value }))} placeholder="e.g., Inside near cashier, bathroom walls..." rows={3} className="rounded-[14px]" />
                    </div>
                  </CardContent>
                </Card>

                {!isEditing && (
                  <Alert className="rounded-[14px]">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Your submission will be reviewed. Once approved, you can add branch locations from your dashboard.</AlertDescription>
                  </Alert>
                )}

                <div className="pt-6 border-t border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={handlePrevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ad Space Details
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditing ? "Updating..." : "Submitting..."}</> : isEditing ? "Update Ad Space" : "Submit Ad Space Listing"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VenueRegistration;
