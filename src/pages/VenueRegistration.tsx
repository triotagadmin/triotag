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
import { ArrowLeft, ArrowRight, Upload, X, CheckCircle, AlertCircle, Building2, Megaphone, Loader2, Plus, Trash2, MapPin, Clock, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { LocationPickerMap, type LocationData } from "@/components/LocationPickerMap";

interface DocumentUploadState {
  type: string;
  label: string;
  description: string;
  file: File | null;
  uploaded: boolean;
  existingUrl?: string;
  existingFileName?: string;
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

const DEFAULT_DESCRIPTION = "";

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
  const [venueTypes, setVenueTypes] = useState<string[]>([]);
  const toggleVenueType = (v: string) => setVenueTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const [customVenueType, setCustomVenueType] = useState("");
  const [industryCategory, setIndustryCategory] = useState("");
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [operatingHours, setOperatingHours] = useState("");


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

  // Advertiser linking status
  const [advertiserLinked, setAdvertiserLinked] = useState(false);
  const [pendingAdvertiserEmail, setPendingAdvertiserEmail] = useState<string | null>(null);
  const [originalContactEmail, setOriginalContactEmail] = useState("");
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [ownershipWorkflow, setOwnershipWorkflow] = useState<"verification" | "registration" | null>(null);

  // Listing toggle (edit mode)
  const [isListedOnExplore, setIsListedOnExplore] = useState(true);

  // Available Ad Formats (multi-select)
  const [selectedFormats, setSelectedFormats] = useState<("OOH" | "DOOH" | "AOOH")[]>([]);
  // OOH details
  const [oohPrintFormats, setOohPrintFormats] = useState<string[]>([]);
  const toggleOohPrintFormat = (v: string) => setOohPrintFormats(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const [oohUnits, setOohUnits] = useState<Record<string, number>>({});
  // DOOH details
  const [doohScreenDescription, setDoohScreenDescription] = useState("");
  const [doohScreenTypes, setDoohScreenTypes] = useState<string[]>([]);
  const toggleDoohScreenType = (v: string) => setDoohScreenTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const [doohUnits, setDoohUnits] = useState<Record<string, number>>({});
  // AOOH details
  const [aoohSpotDurations, setAoohSpotDurations] = useState<string[]>([]);
  const toggleAoohSpotDuration = (v: string) => setAoohSpotDurations(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const [aoohUnits, setAoohUnits] = useState<Record<string, number>>({});
  const [aoohPlayFrequency, setAoohPlayFrequency] = useState("");

  const toggleFormat = (f: "OOH" | "DOOH" | "AOOH") =>
    setSelectedFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
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

      // Try publisher profile first
      let { data: profile, error } = await supabase
        .from("publisher_profiles").select("id, contact_email, contact_phone").eq("user_id", session.user.id).maybeSingle();
      if (error) { toast({ title: "Error", description: "Failed to load profile.", variant: "destructive" }); return; }

      // If no publisher profile, auto-create one for advertisers
      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from("publisher_profiles")
          .insert({
            user_id: session.user.id,
            publisher_type: "venue" as const,
            business_name: session.user.email || "My Business",
            contact_email: session.user.email || "",
            verified: false,
            verification_status: "pending" as const,
          })
          .select("id, contact_email, contact_phone")
          .single();
        if (createError) { toast({ title: "Error", description: "Failed to initialize profile for registration.", variant: "destructive" }); return; }
        profile = newProfile;
      }

      if (profile) {
        setPublisherId(profile.id);
        if (!editParam) { setContactEmail(profile.contact_email || ""); setContactPhone(profile.contact_phone || ""); }
        if (editParam) await loadVenueData(editParam, profile.id);
      }
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
      setIsListedOnExplore(venue.availability_status !== "unlisted");
      const specs = venue.specifications as any || {};
      const vt = specs.venue_type;
      setVenueTypes(Array.isArray(vt) ? vt : (typeof vt === "string" && vt ? vt.split(",").map((s: string) => s.trim()).filter(Boolean) : []));
      if (specs.custom_venue_type) setCustomVenueType(specs.custom_venue_type);
      setIndustryCategory(specs.industry_category || "");
      setOperatingHours(specs.operating_hours || "");
      setContactPerson(specs.contact_person || "");
      const loadedContactEmail = specs.contact_email || "";
      setContactEmail(loadedContactEmail);
      setOriginalContactEmail(loadedContactEmail.trim().toLowerCase());
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
        setEnvDetails({ ...envDetails, ...specs.environment_details });
      }

      // Track advertiser linking status
      if (venue.advertiser_id) {
        setAdvertiserLinked(true);
        setPendingAdvertiserEmail(null);
        setOwnershipWorkflow(null);
      } else if (venue.pending_advertiser_email) {
        setAdvertiserLinked(false);
        setPendingAdvertiserEmail(venue.pending_advertiser_email);
        setOwnershipWorkflow("registration");
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
    if (venueTypes.length === 0) { toast({ title: "Error", description: "Ad space type is required", variant: "destructive" }); return false; }
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

  const handleNextStep = () => {
    if (!validateStep1()) return;
    if (selectedFormats.length === 0) {
      toast({ title: "Error", description: "Please select at least one ad format", variant: "destructive" });
      return;
    }
    setCurrentStep(2); window.scrollTo(0, 0);
  };
  const handlePrevStep = () => { setCurrentStep(1); window.scrollTo(0, 0); };

  const buildVenueData = () => {
    const actualVenueTypes = venueTypes.includes("other") && customVenueType
      ? [...venueTypes.filter(v => v !== "other"), customVenueType]
      : venueTypes;
    const headOfficeAddress = [street, city, state, postalCode, country].filter(Boolean).join(", ");
    const locsJson: any[] = [];
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
      latitude: latitude, longitude: longitude,
      specifications: {
        venue_type: actualVenueTypes.join(", "),
        venue_types: actualVenueTypes,
        custom_venue_type: venueTypes.includes("other") ? customVenueType : null,
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

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const checkDuplicateListing = async (locationValue: string, emailValue: string, excludeId?: string | null) => {
    const normalizedEmail = normalizeEmail(emailValue);
    let query = supabase
      .from("ad_spaces")
      .select("id")
      .eq("publisher_id", publisherId)
      .eq("location", locationValue)
      .ilike("specifications->>contact_email", normalizedEmail);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data } = await query.limit(1).maybeSingle();
    return Boolean(data);
  };

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
        description:
          workflowType === "verification"
            ? `Verification email sent to ${normalizedEmail}. Ownership will link after confirmation.`
            : `Invite sent to ${normalizedEmail}. Ownership links automatically after advertiser signup and verification.`,
      });
    } finally {
      setSendingVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publisherId || submittedRef.current) return;
    submittedRef.current = true;
    setLoading(true);
    try {
      const venueData = buildVenueData();
      const filledDocs = verificationDocuments.filter(doc => doc.file !== null);
      const normalizedContactEmail = normalizeEmail(contactEmail);
      const headOfficeAddress = [street, city, state, postalCode, country].filter(Boolean).join(", ");

      const hasDuplicate = await checkDuplicateListing(headOfficeAddress || "", normalizedContactEmail, isEditing ? editId : null);
      if (hasDuplicate) {
        throw new Error("A listing with the same location and advertiser email already exists.");
      }

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
        const emailChanged = normalizedContactEmail !== originalContactEmail;
        const updatePayload: any = { ...venueData, availability_status: isListedOnExplore ? "available" : "unlisted" };

        if (emailChanged && normalizedContactEmail) {
          updatePayload.advertiser_id = null;
          updatePayload.pending_advertiser_email = normalizedContactEmail;
        }

        const { error } = await supabase.from("ad_spaces").update(updatePayload).eq("id", editId!).eq("publisher_id", publisherId);
        if (error) throw error;

        if (emailChanged && normalizedContactEmail) {
          await requestOwnershipWorkflow(editId!, normalizedContactEmail);
        }

        setOriginalContactEmail(normalizedContactEmail);
        toast({ title: "Success", description: "Listing updated successfully" });
        navigate("/venue-inventory");
      } else {
        const sumUnits = (m: Record<string, number>) => Object.values(m).reduce((s, n) => s + (Number(n) || 0), 0);
        const formatDetails: Record<string, any> = {
          OOH: { print_format: oohPrintFormats.join(", "), print_formats: oohPrintFormats, units_by_format: oohUnits, placement_count: sumUnits(oohUnits) || null },
          DOOH: { screen_description: doohScreenDescription, screen_type: doohScreenTypes.join(", "), screen_types: doohScreenTypes, units_by_type: doohUnits, screen_count: sumUnits(doohUnits) || null },
          AOOH: { spot_duration: aoohSpotDurations.join(", "), spot_durations: aoohSpotDurations, zones_by_duration: aoohUnits, play_frequency_min: aoohPlayFrequency ? parseInt(aoohPlayFrequency) : null, audio_zones: sumUnits(aoohUnits) || null },
        };
        const rows = selectedFormats.map(fmt => ({
          ...venueData,
          specifications: { ...(venueData.specifications as any), format_details: formatDetails[fmt] },
          media_type: fmt,
          advertiser_id: null,
          pending_advertiser_email: normalizedContactEmail || null,
          approval_status: "pending" as const,
          availability_status: "unavailable",
        }));
        const { data: insertedData, error: insertError } = await supabase.from("ad_spaces").insert(rows).select("id");
        if (insertError) throw insertError;

        if (normalizedContactEmail && insertedData?.[0]) {
          await requestOwnershipWorkflow(insertedData[0].id, normalizedContactEmail);
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
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <Card className="rounded-[24px]">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-2xl md:text-3xl">
                {isEditing ? "Edit Ad Space Listing" : "Register Franchise / Multi-Location Ad Space"}
              </CardTitle>
              <Badge variant="outline" className="text-xs">Agent View</Badge>
            </div>
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
                  <Label>Ad Space Type * <span className="text-xs text-muted-foreground font-normal">(select all that apply)</span></Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {VENUE_TYPES.map(t => {
                      const on = venueTypes.includes(t.value);
                      return (
                        <button key={t.value} type="button" onClick={() => toggleVenueType(t.value)}
                          className={`text-left text-sm px-3 py-2 rounded-[12px] border-2 transition-all ${on ? "border-green-500 bg-green-500/10" : "border-border hover:border-green-500/50"}`}>
                          <span className={`inline-block w-3 h-3 mr-2 rounded-sm border align-middle ${on ? "bg-green-500 border-green-500" : "border-muted-foreground/40"}`} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                  {venueTypes.includes("other") && <Input className="mt-2" placeholder="Specify type" value={customVenueType} onChange={e => setCustomVenueType(e.target.value)} />}
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

                {/* Head Office Address - Location Picker */}
                <Card className="rounded-[20px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Head Office / Primary Location</CardTitle>
                    <p className="text-xs text-muted-foreground">Search for your location or click the map to place a pin. This address is private.</p>
                  </CardHeader>
                  <CardContent>
                    <LocationPickerMap
                      initialLocation={latitude && longitude ? { lat: latitude, lng: longitude } : null}
                      onConfirm={(loc: LocationData) => {
                        setLatitude(loc.lat);
                        setLongitude(loc.lng);
                        // Parse address parts from the full address string
                        const parts = loc.address.split(",").map(s => s.trim());
                        if (parts.length >= 1) setStreet(parts[0]);
                        if (parts.length >= 2) setCity(parts[1]);
                        if (parts.length >= 3) setState(parts[2]);
                        if (parts.length >= 4) setPostalCode(parts[3]);
                        if (parts.length >= 5) setCountry(parts[parts.length - 1]);
                      }}
                    />
                  </CardContent>
                </Card>


                {/* Available Ad Formats */}
                <Card className="rounded-[20px]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Available Ad Formats *</CardTitle>
                    <p className="text-xs text-muted-foreground">Select all formats your venue can host. A separate listing is created per format.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {([
                        { k: "OOH", title: "OOH — Print Advertising", desc: "Static print formats — table tents, posters, stickers, shelf signage, floor graphics." },
                        { k: "DOOH", title: "DOOH — Digital Screens", desc: "Digital screen formats — LED displays, TV screens, menu boards, video walls." },
                        { k: "AOOH", title: "AOOH — Audio Advertising", desc: "In-venue audio — branded jingles, promotional spots, announcements, queue audio." },
                      ] as const).map(f => {
                        const on = selectedFormats.includes(f.k);
                        return (
                          <button key={f.k} type="button" onClick={() => toggleFormat(f.k)}
                            className={`text-left p-4 rounded-[14px] border-2 transition-all ${on ? "border-green-500 bg-green-500/10" : "border-border hover:border-green-500/50"}`}>
                            <div className="font-semibold mb-1">{f.title}</div>
                            <div className="text-xs text-muted-foreground">{f.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                    {selectedFormats.includes("OOH") && (
                      <div className="border-t pt-4">
                        <Label>Print Formats & Units <span className="text-xs text-muted-foreground font-normal">(select all, set units each)</span></Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {["Table Tent","Poster/Wall","Floor Sticker","Shelf Signage","Counter Display","Aisle Signage","Entrance Banner","Other"].map(o => {
                            const on = oohPrintFormats.includes(o);
                            return (
                              <div key={o} className={`flex items-center gap-2 px-3 py-2 rounded-[12px] border-2 transition-all ${on ? "border-green-500 bg-green-500/10" : "border-border"}`}>
                                <button type="button" onClick={() => toggleOohPrintFormat(o)} className="flex items-center gap-2 text-xs flex-1 text-left">
                                  <span className={`inline-block w-3 h-3 rounded-sm border ${on ? "bg-green-500 border-green-500" : "border-muted-foreground/40"}`} />{o}
                                </button>
                                <Input type="number" min={0} disabled={!on} value={oohUnits[o] ?? ""} onChange={e => setOohUnits(prev => ({ ...prev, [o]: Math.max(0, Number(e.target.value) || 0) }))} placeholder="units" className="h-7 w-20 text-xs" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {selectedFormats.includes("DOOH") && (
                      <div className="border-t pt-4 space-y-3">
                        <div><Label>Screen Description</Label><Input value={doohScreenDescription} onChange={e=>setDoohScreenDescription(e.target.value)} placeholder="e.g. 55-inch LED at entrance" /></div>
                        <Label>Screen Types & Units <span className="text-xs text-muted-foreground font-normal">(select all, set units each)</span></Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {["Indoor Screen","Outdoor Screen","Menu Board","Video Wall","Checkout Screen"].map(o => {
                            const on = doohScreenTypes.includes(o);
                            return (
                              <div key={o} className={`flex items-center gap-2 px-3 py-2 rounded-[12px] border-2 transition-all ${on ? "border-green-500 bg-green-500/10" : "border-border"}`}>
                                <button type="button" onClick={() => toggleDoohScreenType(o)} className="flex items-center gap-2 text-xs flex-1 text-left">
                                  <span className={`inline-block w-3 h-3 rounded-sm border ${on ? "bg-green-500 border-green-500" : "border-muted-foreground/40"}`} />{o}
                                </button>
                                <Input type="number" min={0} disabled={!on} value={doohUnits[o] ?? ""} onChange={e => setDoohUnits(prev => ({ ...prev, [o]: Math.max(0, Number(e.target.value) || 0) }))} placeholder="screens" className="h-7 w-20 text-xs" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {selectedFormats.includes("AOOH") && (
                      <div className="border-t pt-4 space-y-3">
                        <Label>Spot Durations & Zones <span className="text-xs text-muted-foreground font-normal">(select all, set audio zones each)</span></Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {["15 seconds","30 seconds","60 seconds"].map(o => {
                            const on = aoohSpotDurations.includes(o);
                            return (
                              <div key={o} className={`flex items-center gap-2 px-3 py-2 rounded-[12px] border-2 transition-all ${on ? "border-green-500 bg-green-500/10" : "border-border"}`}>
                                <button type="button" onClick={() => toggleAoohSpotDuration(o)} className="flex items-center gap-2 text-xs flex-1 text-left">
                                  <span className={`inline-block w-3 h-3 rounded-sm border ${on ? "bg-green-500 border-green-500" : "border-muted-foreground/40"}`} />{o}
                                </button>
                                <Input type="number" min={0} disabled={!on} value={aoohUnits[o] ?? ""} onChange={e => setAoohUnits(prev => ({ ...prev, [o]: Math.max(0, Number(e.target.value) || 0) }))} placeholder="zones" className="h-7 w-20 text-xs" />
                              </div>
                            );
                          })}
                        </div>
                        <div><Label>Play Frequency (min)</Label><Input type="number" value={aoohPlayFrequency} onChange={e=>setAoohPlayFrequency(e.target.value)} placeholder="e.g. 30" /></div>
                      </div>
                    )}
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
                              <span className="text-xs text-primary font-medium">Retailer Linked</span>
                            </div>
                          ) : (pendingAdvertiserEmail || !advertiserLinked) && (
                            <div className="mt-2 space-y-2">
                              <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
                                <Clock className="h-3 w-3" />
                                {ownershipWorkflow === "verification" ? "Pending Retailer Verification" : "Pending Retailer Registration"}
                              </Badge>
                              {editId && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-1.5 text-xs"
                                  disabled={sendingVerification}
                                  onClick={async () => {
                                    try {
                                      await requestOwnershipWorkflow(editId, contactEmail);
                                    } catch (err: any) {
                                      toast({ title: "Error", description: err.message || "Failed to send advertiser workflow email", variant: "destructive" });
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
                  <Label>Photos {!isEditing && "*"}</Label>
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

                {/* Listing Toggle - only when editing */}
                {isEditing && (
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
                )}

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
