import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { ArrowLeft, ArrowRight, Upload, X, CheckCircle, AlertCircle, Building2, Megaphone, Loader2, Plus, Trash2, MapPin, Clock, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

interface BranchLocation {
  id: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  isAdSpaceListing: boolean;
  dbId?: string; // franchise_branches row id
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

const FranchiseEdit = () => {
  const { franchiseId } = useParams<{ franchiseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [userRole, setUserRole] = useState<"publisher" | "advertiser" | null>(null);
  const [publisherId, setPublisherId] = useState<string | null>(null);
  const submittedRef = useRef(false);

  // Franchise fields
  const [title, setTitle] = useState("");
  const [venueType, setVenueType] = useState("");
  const [customVenueType, setCustomVenueType] = useState("");
  const [industryCategory, setIndustryCategory] = useState("");
  const [description, setDescription] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [operatingHours, setOperatingHours] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [weeklyLeasePrice, setWeeklyLeasePrice] = useState("");
  const [monthlyLeasePrice, setMonthlyLeasePrice] = useState("");
  const [leaseCurrency, setLeaseCurrency] = useState("USD");

  // Branch locations
  const [branches, setBranches] = useState<BranchLocation[]>([]);

  // Environment Details
  const [envDetails, setEnvDetails] = useState<EnvironmentDetails>({
    venueType: "", venueSize: "", seatingCapacity: "", environment: "",
    customerActivity: [], adPlacementAreas: [], customerDemographics: [],
    exactLocationNotes: "", visibility: "",
  });

  // Advertiser linking
  const [advertiserLinked, setAdvertiserLinked] = useState(false);
  const [pendingAdvertiserEmail, setPendingAdvertiserEmail] = useState<string | null>(null);
  const [originalContactEmail, setOriginalContactEmail] = useState("");
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [ownershipWorkflow, setOwnershipWorkflow] = useState<"verification" | "registration" | null>(null);

  // Listing toggle
  const [isListedOnExplore, setIsListedOnExplore] = useState(true);

  useEffect(() => {
    if (!franchiseId) return;
    loadData();

    // Realtime subscription
    const channel = supabase
      .channel(`franchise-edit-${franchiseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_spaces', filter: `id=eq.${franchiseId}` }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'franchise_branches', filter: `franchise_id=eq.${franchiseId}` }, () => {
        loadBranches();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [franchiseId]);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      // Determine role
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
      const currentRole = role?.role as string;

      if (currentRole === "publisher") {
        setUserRole("publisher");
        const { data: pubProfile } = await supabase.from("publisher_profiles").select("id").eq("user_id", session.user.id).maybeSingle();
        if (pubProfile) setPublisherId(pubProfile.id);
      } else if (currentRole === "advertiser") {
        setUserRole("advertiser");
      } else {
        toast({ title: "Access denied", description: "You don't have permission to edit this franchise.", variant: "destructive" });
        navigate("/");
        return;
      }

      // Load ad_space data
      const { data: venue, error } = await supabase.from("ad_spaces").select("*").eq("id", franchiseId!).single();
      if (error || !venue) {
        toast({ title: "Error", description: "Franchise not found.", variant: "destructive" });
        navigate(-1 as any);
        return;
      }

      // Verify access
      const isPublisher = currentRole === "publisher";
      const isOwnerAdvertiser = venue.advertiser_id === session.user.id;
      const isLeasedAdvertiser = Array.isArray(venue.leased_advertiser_ids) && venue.leased_advertiser_ids.includes(session.user.id);

      if (!isPublisher && !isOwnerAdvertiser && !isLeasedAdvertiser) {
        toast({ title: "Access denied", description: "You don't have access to this franchise.", variant: "destructive" });
        navigate(-1 as any);
        return;
      }

      // Populate fields
      setTitle(venue.title || "");
      setDescription(venue.description || "");
      setUploadedImages(Array.isArray(venue.media_urls) ? venue.media_urls as string[] : []);
      setIsListedOnExplore(venue.availability_status !== "unlisted");

      const specs = venue.specifications as any || {};
      setVenueType(specs.venue_type || "");
      if (specs.custom_venue_type) setCustomVenueType(specs.custom_venue_type);
      setIndustryCategory(specs.industry_category || "");
      setOperatingHours(specs.operating_hours || "");
      setContactPerson(specs.contact_person || "");
      const loadedEmail = specs.contact_email || "";
      setContactEmail(loadedEmail);
      setOriginalContactEmail(loadedEmail.trim().toLowerCase());
      setContactPhone(specs.contact_number || "");
      setSelectedMaterials(specs.ad_unit_materials || []);
      setWeeklyLeasePrice(specs.weekly_lease_price?.toString() || "");
      setMonthlyLeasePrice(specs.monthly_lease_price?.toString() || "");
      setLeaseCurrency(specs.lease_currency || "USD");

      const fullAddress = specs.head_office_address || {};
      setStreet(fullAddress.street || "");
      setCity(fullAddress.city || "");
      setState(fullAddress.state || "");
      setPostalCode(fullAddress.postal_code || "");
      setCountry(fullAddress.country || "");

      if (specs.environment_details) {
        setEnvDetails(prev => ({ ...prev, ...specs.environment_details }));
      }

      if (venue.advertiser_id) {
        setAdvertiserLinked(true);
        setPendingAdvertiserEmail(null);
      } else if (venue.pending_advertiser_email) {
        setAdvertiserLinked(false);
        setPendingAdvertiserEmail(venue.pending_advertiser_email);
        setOwnershipWorkflow("registration");
      }

      await loadBranches();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load franchise data", variant: "destructive" });
    } finally {
      setPageLoading(false);
    }
  };

  const loadBranches = async () => {
    if (!franchiseId) return;

    // Load from both franchise_branches and advertiser_branches for this listing
    const [fbRes, abRes] = await Promise.all([
      supabase
        .from("franchise_branches")
        .select("id, place_name, full_address")
        .eq("franchise_id", franchiseId)
        .order("created_at", { ascending: true }),
      supabase
        .from("advertiser_branches")
        .select("id, branch_name, full_address")
        .eq("listing_id", franchiseId)
        .order("created_at", { ascending: true }),
    ]);

    const combined: BranchLocation[] = [];

    if (!fbRes.error && fbRes.data) {
      fbRes.data.forEach((b: any) => {
        const parts = (b.full_address || "").split(", ");
        combined.push({
          id: crypto.randomUUID(),
          dbId: b.id,
          address: parts[0] || "",
          city: parts[1] || b.place_name || "",
          province: parts[2] || "",
          postalCode: parts[3] || "",
          isAdSpaceListing: true,
        });
      });
    }

    if (!abRes.error && abRes.data) {
      abRes.data.forEach((b: any) => {
        // Avoid duplicates by checking full_address
        const alreadyExists = combined.some(
          (c) => c.address === (b.full_address || "").split(", ")[0]
            && c.city === ((b.full_address || "").split(", ")[1] || b.branch_name || "")
        );
        if (!alreadyExists) {
          const parts = (b.full_address || "").split(", ");
          combined.push({
            id: crypto.randomUUID(),
            dbId: b.id,
            address: parts[0] || "",
            city: parts[1] || b.branch_name || "",
            province: parts[2] || "",
            postalCode: parts[3] || "",
            isAdSpaceListing: false,
          });
        }
      });
    }

    setBranches(combined);
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
        const filePath = `franchise-${franchiseId}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('ad-space-media').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('ad-space-media').getPublicUrl(filePath);
        return publicUrl;
      });
      const urls = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...urls]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setUploadingImage(false); }
  };

  const removeImage = (url: string) => setUploadedImages(prev => prev.filter(img => img !== url));

  const addBranch = () => setBranches(prev => [...prev, { id: crypto.randomUUID(), address: "", city: "", province: "", postalCode: "", isAdSpaceListing: true }]);

  const removeBranch = async (localId: string) => {
    const branch = branches.find(b => b.id === localId);
    if (branch?.dbId) {
      const { error } = await supabase.from("franchise_branches").delete().eq("id", branch.dbId);
      if (error) {
        toast({ title: "Error", description: "Failed to remove branch", variant: "destructive" });
        return;
      }
    }
    setBranches(prev => prev.filter(b => b.id !== localId));
  };

  const updateBranch = (localId: string, field: keyof BranchLocation, value: any) => {
    setBranches(prev => prev.map(b => b.id === localId ? { ...b, [field]: value } : b));
  };

  const toggleMaterial = (value: string) => {
    setSelectedMaterials(prev => prev.includes(value) ? prev.filter(m => m !== value) : [...prev, value]);
  };

  const toggleEnvArray = (field: keyof EnvironmentDetails, value: string) => {
    const current = envDetails[field] as string[];
    setEnvDetails(prev => ({
      ...prev,
      [field]: current.includes(value) ? current.filter(v => v !== value) : [...current, value],
    }));
  };

  const normalizeEmail = (v: string) => v.trim().toLowerCase();

  const requestOwnershipWorkflow = async (listingId: string, emailValue: string) => {
    const normalizedEmail = normalizeEmail(emailValue);
    if (!normalizedEmail) return;
    setSendingVerification(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-listing-ownership", {
        body: { listingId, email: normalizedEmail },
      });
      if (error) throw error;
      const workflowType = (data?.workflowType === "verification" ? "verification" : "registration") as "verification" | "registration";
      setOwnershipWorkflow(workflowType);
      setAdvertiserLinked(false);
      setPendingAdvertiserEmail(normalizedEmail);
      setVerificationSent(true);
      toast({
        title: workflowType === "verification" ? "Verification requested" : "Registration invite sent",
        description: workflowType === "verification"
          ? `Verification email sent to ${normalizedEmail}.`
          : `Invite sent to ${normalizedEmail}.`,
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const validateStep1 = () => {
    if (!title.trim()) { toast({ title: "Error", description: "Franchise/brand name is required", variant: "destructive" }); return false; }
    if (!venueType) { toast({ title: "Error", description: "Venue type is required", variant: "destructive" }); return false; }
    if (!industryCategory) { toast({ title: "Error", description: "Industry category is required", variant: "destructive" }); return false; }
    if (!description.trim()) { toast({ title: "Error", description: "Brand description is required", variant: "destructive" }); return false; }
    if (!contactPerson.trim()) { toast({ title: "Error", description: "Contact person is required", variant: "destructive" }); return false; }
    if (!contactEmail.trim()) { toast({ title: "Error", description: "Contact email is required", variant: "destructive" }); return false; }
    if (!contactPhone.trim()) { toast({ title: "Error", description: "Contact phone is required", variant: "destructive" }); return false; }
    if (selectedMaterials.length === 0) { toast({ title: "Error", description: "Please select at least one ad unit material", variant: "destructive" }); return false; }
    return true;
  };

  const handleNextStep = () => { if (validateStep1()) { setCurrentStep(2); window.scrollTo(0, 0); } };
  const handlePrevStep = () => { setCurrentStep(1); window.scrollTo(0, 0); };

  const checkDuplicateBranch = (address: string, existingBranches: BranchLocation[], excludeId?: string) => {
    const norm = address.trim().toLowerCase();
    return existingBranches.some(b => b.id !== excludeId && b.address.trim().toLowerCase() === norm && norm !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!franchiseId || submittedRef.current) return;
    submittedRef.current = true;
    setLoading(true);
    try {
      const actualVenueType = venueType === "other" ? customVenueType : venueType;
      const headOfficeAddress = [street, city, state, postalCode, country].filter(Boolean).join(", ");
      const normalizedContactEmail = normalizeEmail(contactEmail);
      const emailChanged = normalizedContactEmail !== originalContactEmail;

      const updatePayload: any = {
        title: title.trim(),
        location: headOfficeAddress || null,
        description: description.trim(),
        availability_status: isListedOnExplore ? "available" : "unlisted",
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
          ad_unit_materials: selectedMaterials,
          weekly_lease_price: weeklyLeasePrice ? parseFloat(weeklyLeasePrice) : null,
          monthly_lease_price: monthlyLeasePrice ? parseFloat(monthlyLeasePrice) : null,
          lease_currency: leaseCurrency,
          environment_details: {
            venueType: envDetails.venueType, venueSize: envDetails.venueSize, seatingCapacity: envDetails.seatingCapacity,
            environment: envDetails.environment, customerActivity: envDetails.customerActivity,
            adPlacementAreas: envDetails.adPlacementAreas, customerDemographics: envDetails.customerDemographics,
            exactLocationNotes: envDetails.exactLocationNotes, visibility: envDetails.visibility,
          },
        } as any,
        media_urls: uploadedImages,
      };

      if (emailChanged && normalizedContactEmail) {
        updatePayload.advertiser_id = null;
        updatePayload.pending_advertiser_email = normalizedContactEmail;
      }

      const { error: updateError } = await supabase.from("ad_spaces").update(updatePayload).eq("id", franchiseId);
      if (updateError) throw updateError;

      if (emailChanged && normalizedContactEmail) {
        await requestOwnershipWorkflow(franchiseId, normalizedContactEmail);
      }
      setOriginalContactEmail(normalizedContactEmail);

      // Sync branches — upsert existing, insert new, deletions already handled inline
      for (const branch of branches) {
        if (!branch.address.trim()) continue;
        const fullAddr = [branch.address, branch.city, branch.province, branch.postalCode].filter(Boolean).join(", ");
        const placeName = branch.city.trim() || branch.address.trim();

        if (branch.dbId) {
          await supabase.from("franchise_branches").update({
            place_name: placeName,
            full_address: fullAddr,
          }).eq("id", branch.dbId);
        } else {
          // Check duplicate
          if (checkDuplicateBranch(branch.address, branches, branch.id)) {
            toast({ title: "Duplicate", description: `Branch "${branch.address}" already exists. Skipping.` });
            continue;
          }
          const { data: inserted } = await supabase.from("franchise_branches").insert({
            franchise_id: franchiseId,
            place_name: placeName,
            full_address: fullAddr,
          }).select("id").single();
          if (inserted) {
            setBranches(prev => prev.map(b => b.id === branch.id ? { ...b, dbId: inserted.id } : b));
          }
        }
      }

      toast({ title: "Success", description: "Franchise updated successfully" });
    } catch (error: any) {
      submittedRef.current = false;
      toast({ title: "Error", description: error.message || "Update failed", variant: "destructive" });
    } finally {
      setLoading(false);
      submittedRef.current = false;
    }
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

  if (pageLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-6 py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading franchise data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <Card className="rounded-[24px]">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-2xl md:text-3xl">Edit Franchise</CardTitle>
              <Badge variant="outline" className="text-xs">
                {userRole === "publisher" ? "Agent View" : "Advertiser View"}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              Update franchise details, branch locations, and ad space settings. Changes sync in real-time for all linked accounts.
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
                  <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="rounded-[14px]" required placeholder="Describe your Brand" />
                </div>

                {/* Head Office Address */}
                <Card className="rounded-[20px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Head Office / Primary Contact Address</CardTitle>
                    <p className="text-xs text-muted-foreground">This is NOT used as a branch listing.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div><Label>Street Address</Label><Input value={street} onChange={e => setStreet(e.target.value)} placeholder="123 Main Street" /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" /></div>
                      <div><Label>State/Province</Label><Input value={state} onChange={e => setState(e.target.value)} placeholder="State" /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><Label>Postal Code</Label><Input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="ZIP" /></div>
                      <div><Label>Country</Label><Input value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" /></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                      <p className="text-xs text-muted-foreground">Branch Locations (read-only — edit on dashboard)</p>
                      {branches.length > 0 ? (
                        <div className="space-y-1.5">
                          {branches.map((loc, idx) => (
                            <div key={loc.id} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-[12px] bg-muted/30">
                              <span className="text-primary font-medium shrink-0">{idx + 1}.</span>
                              <span className="truncate">
                                {[loc.address, loc.city, loc.province, loc.postalCode].filter(Boolean).join(", ") || "No address"}
                              </span>
                              {loc.isAdSpaceListing && (
                                <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">Ad Space</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic py-2">No branch locations added yet. Add branches from the dashboard.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Ad Unit Materials */}
                <Card className="rounded-[20px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Ad Unit Materials</CardTitle>
                    <p className="text-xs text-muted-foreground">Select the types of advertising materials that can be installed.</p>
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
                    <p className="text-xs text-muted-foreground">Set the lease price for advertisers.</p>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Contact Email *</Label>
                        <Input type="email" value={contactEmail} onChange={e => { setContactEmail(e.target.value); setVerificationSent(false); setOwnershipWorkflow(null); }} required />
                        {contactEmail.trim() && (
                          advertiserLinked ? (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <CheckCircle className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs text-primary font-medium">Advertiser Linked</span>
                            </div>
                          ) : (pendingAdvertiserEmail || !advertiserLinked) && (
                            <div className="mt-2 space-y-2">
                              <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
                                <Clock className="h-3 w-3" />
                                {ownershipWorkflow === "verification" ? "Pending Advertiser Verification" : "Pending Advertiser Registration"}
                              </Badge>
                              {franchiseId && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-1.5 text-xs"
                                  disabled={sendingVerification}
                                  onClick={async () => {
                                    try {
                                      await requestOwnershipWorkflow(franchiseId, contactEmail);
                                    } catch (err: any) {
                                      toast({ title: "Error", description: err.message || "Failed to send workflow email", variant: "destructive" });
                                    }
                                  }}
                                >
                                  {sendingVerification ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                                  {verificationSent ? "Resend Workflow Email" : "Send Workflow Email"}
                                </Button>
                              )}
                            </div>
                          )
                        )}
                      </div>
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
                  <Label>Photos</Label>
                  <p className="text-sm text-muted-foreground mb-2">Upload photos representing branches. {uploadedImages.length}/30</p>
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

                {/* Listing Toggle */}
                <Card className="rounded-[20px]">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">List on Explore Page</Label>
                        <p className="text-xs text-muted-foreground mt-1">Toggle to activate/deactivate this franchise listing on /explore</p>
                      </div>
                      <Switch checked={isListedOnExplore} onCheckedChange={setIsListedOnExplore} />
                    </div>
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
                <Card className="rounded-[20px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Ad Space Environment Details</CardTitle>
                    <p className="text-xs text-muted-foreground">Describe the physical characteristics of the establishment.</p>
                  </CardHeader>
                  <CardContent className="space-y-5">
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

                    <div>
                      <Label>Venue Floor Area (sqm)</Label>
                      <Input type="number" value={envDetails.venueSize} onChange={e => setEnvDetails(p => ({ ...p, venueSize: e.target.value }))} placeholder="e.g., 120" />
                    </div>

                    <div>
                      <Label>Estimated Seating Capacity</Label>
                      <Input type="number" value={envDetails.seatingCapacity} onChange={e => setEnvDetails(p => ({ ...p, seatingCapacity: e.target.value }))} placeholder="e.g., 40" />
                    </div>

                    <div>
                      <Label>Indoor / Semi-Outdoor Environment</Label>
                      <Select value={envDetails.environment} onValueChange={v => setEnvDetails(p => ({ ...p, environment: v }))}>
                        <SelectTrigger className="rounded-[14px]"><SelectValue placeholder="Select environment" /></SelectTrigger>
                        <SelectContent>{ENVIRONMENT_OPTIONS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>

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

                    <div>
                      <Label>Visibility</Label>
                      <Select value={envDetails.visibility} onValueChange={v => setEnvDetails(p => ({ ...p, visibility: v }))}>
                        <SelectTrigger className="rounded-[14px]"><SelectValue placeholder="Select visibility level" /></SelectTrigger>
                        <SelectContent>{VISIBILITY_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Exact Placement Notes</Label>
                      <Textarea value={envDetails.exactLocationNotes} onChange={e => setEnvDetails(p => ({ ...p, exactLocationNotes: e.target.value }))} placeholder="e.g., Inside near cashier, bathroom walls..." rows={3} className="rounded-[14px]" />
                    </div>
                  </CardContent>
                </Card>

                <div className="pt-6 border-t border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row gap-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={handlePrevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ad Space Details
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
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

export default FranchiseEdit;
