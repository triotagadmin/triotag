import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, DollarSign, CreditCard, CheckCircle, Package, Truck, Loader2, ArrowRight, Send, Clock, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { AdMockupPreview } from "@/components/AdMockupPreview";
import { ActivationStepper, type ActivationStep } from "@/components/activation/ActivationStepper";
import { BookingScheduler } from "@/components/activation/BookingScheduler";
import { ProductCard } from "@/components/print-order/ProductCard";
import { OrderSuccessCard } from "@/components/print-order/OrderSuccessCard";
import { PaymentGateway } from "@/components/activation/PaymentGateway";
import { PrintOrderPaymentGate } from "@/components/activation/PrintOrderPaymentGate";
import { PrintOrderWizard, type BranchOption } from "@/components/print-order/PrintOrderWizard";
import { type BranchMaterialConfig } from "@/components/print-order/BranchMaterialConfigurator";
import { PRINT_PRODUCTS, SHIPPING_COUNTRIES, calculateOrderTotal, getProductById } from "@/lib/printProducts";
import { format } from "date-fns";
import { getCurrencySymbol, formatPrice, getCurrencyName } from "@/hooks/useCurrencyConversion";

const AD_UNIT_MATERIAL_LABELS: Record<string, string> = {
  vinyl_sticker: "Vinyl Sticker",
  table_tent_card: "Table Tent Card",
  acrylic_table_tent: "Acrylic Table Tent",
  coroplast_stand: "Coroplast Stand",
  poster_frame: "Poster Frame",
  wall_decal: "Wall Decal",
};

interface ListingDetails {
  id: string;
  title: string;
  location: string;
  description: string;
  pricing: any;
  specifications: any;
  media_urls: any;
  publisher_id: string;
  monthly_subscription_fee: number | null;
  annual_subscription_fee: number | null;
  activation_fee: number | null;
  agent_disconnected: boolean;
}

interface PublisherAddress {
  businessName: string;
  contactEmail: string;
  contactPhone: string | null;
  location: string | null;
}

type ActivationType = "sticker" | "table_tent" | "poster" | "flyer" | "banner" | "other";

// Currency configuration is imported from useCurrencyConversion hook

const ActivateListing = () => {
  const { id } = useParams<{id: string;}>();
  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<ActivationStep>("design");
  const [activationId, setActivationId] = useState<string | null>(null);
  const [activationStatus, setActivationStatus] = useState<string>("design");
  const [isAdvertiser, setIsAdvertiser] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Design step state
  const [designApproved, setDesignApproved] = useState(false);
  const [approvedAdUnitType, setApprovedAdUnitType] = useState("");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [activationType, setActivationType] = useState<ActivationType>("other");

  // Schedule state (now in design step)
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [estimatedPublisherPayout, setEstimatedPublisherPayout] = useState(0);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [approvedTotalAmount, setApprovedTotalAmount] = useState<number>(0);

  // Print order state - Branch-level system
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [shippingCountry, setShippingCountry] = useState("PH");

  // Publisher address (shipping destination)
  const [publisherAddress, setPublisherAddress] = useState<PublisherAddress | null>(null);

  // Print handler - platform always handles printing
  const printHandler = "platform";

  // Order state
  const [orderLoading, setOrderLoading] = useState(false);
  const [printOrderComplete, setPrintOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState("");

  // Branch-level print order state
  const [allBranchOptions, setAllBranchOptions] = useState<BranchOption[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<string>>(new Set());
  const [branchConfigs, setBranchConfigs] = useState<BranchMaterialConfig[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<{ type: string; label: string }[]>([]);
  const [detectedCurrency, setDetectedCurrency] = useState("USD");
  const [branchOrderSubmitting, setBranchOrderSubmitting] = useState(false);

  // Check if user is an advertiser
  useEffect(() => {
    const checkAdvertiserAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAdvertiser(false);
        return;
      }

      // Check if user has an advertiser profile
      const { data: advertiserProfile } = await supabase.
      from("advertiser_profiles").
      select("id").
      eq("user_id", session.user.id).
      maybeSingle();

      setIsAdvertiser(!!advertiserProfile);
    };

    checkAdvertiserAccess();
  }, []);

  useEffect(() => {
    if (id) {
      fetchListingDetails();
      checkExistingActivation();
    }
  }, [id]);

  // Auto-detect and set the print product based on listing's ad unit type
  useEffect(() => {
    if (listing && !selectedProductId) {
      const listingAdUnits = listing?.specifications?.ad_units || listing?.pricing?.ad_units || [];
      const firstAdUnit = listingAdUnits[0];
      const adUnitType = firstAdUnit?.type || activationType || "sticker";
      const detectedProduct = PRINT_PRODUCTS.find((p) =>
      p.id.includes(adUnitType.replace("_", "-")) ||
      adUnitType.includes("sticker") && p.id.includes("sticker") ||
      adUnitType.includes("tent") && p.id === "table-tent"
      ) || PRINT_PRODUCTS[0];

      if (detectedProduct) {
        setSelectedProductId(detectedProduct.id);
      }
    }
  }, [listing, activationType, selectedProductId]);

  // Load branch locations when listing is available and step is print-order
  const loadBranchesForListing = useCallback(async () => {
    if (!id || !listing) return;
    setBranchesLoading(true);

    const specs = (listing.specifications as any) || {};
    const listingCurrency = specs.lease_currency || specs.ad_units?.[0]?.currency || specs.currency || "USD";
    setDetectedCurrency(listingCurrency);

    // Get materials from listing specs
    const matTypes: string[] = specs.ad_unit_materials || [];
    const materials = matTypes.length > 0
      ? matTypes.map((t) => ({ type: t, label: AD_UNIT_MATERIAL_LABELS[t] || t }))
      : [{ type: "vinyl_sticker", label: "Vinyl Sticker" }, { type: "table_tent_card", label: "Table Tent Card" }];
    setAvailableMaterials(materials);

    // Load franchise branches
    const { data: fBranches } = await supabase
      .from("franchise_branches")
      .select("id, place_name, full_address")
      .eq("franchise_id", id)
      .order("created_at");

    // Load advertiser branches
    const { data: advBranches } = await supabase
      .from("advertiser_branches")
      .select("id, branch_name, full_address, city")
      .eq("listing_id", id)
      .order("created_at");

    // Load existing branch_materials
    const { data: existingMats } = await supabase
      .from("branch_materials")
      .select("branch_id, material_type, quantity")
      .eq("listing_id", id);

    const matMap = new Map<string, Map<string, number>>();
    existingMats?.forEach((m: any) => {
      if (!matMap.has(m.branch_id)) matMap.set(m.branch_id, new Map());
      matMap.get(m.branch_id)!.set(m.material_type, m.quantity);
    });

    // Merge & deduplicate
    const seenIds = new Set<string>();
    const allBranches: BranchOption[] = [];
    const configs: BranchMaterialConfig[] = [];

    (fBranches || []).forEach((b: any) => {
      if (!seenIds.has(b.id)) {
        seenIds.add(b.id);
        const addressParts = b.full_address?.split(",") || [];
        const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2]?.trim() : "";
        allBranches.push({ id: b.id, name: b.place_name, address: b.full_address, city });
        const branchMats = matMap.get(b.id);
        configs.push({
          branchId: b.id,
          branchName: b.place_name,
          fullAddress: b.full_address,
          city,
          materials: materials.map((m) => ({
            materialType: m.type,
            materialLabel: m.label,
            quantity: branchMats?.get(m.type) || 0,
          })),
          shippingAddress: { recipient: "", street: b.full_address || "", city, province: "", postalCode: "", contact: "" },
        });
      }
    });

    (advBranches || []).forEach((b: any) => {
      if (!seenIds.has(b.id)) {
        seenIds.add(b.id);
        allBranches.push({ id: b.id, name: b.branch_name || b.full_address, address: b.full_address, city: b.city || "" });
        configs.push({
          branchId: b.id,
          branchName: b.branch_name || b.full_address,
          fullAddress: b.full_address,
          city: b.city || "",
          materials: materials.map((m) => ({
            materialType: m.type,
            materialLabel: m.label,
            quantity: 0,
          })),
          shippingAddress: { recipient: "", street: b.full_address || "", city: b.city || "", province: "", postalCode: "", contact: "" },
        });
      }
    });

    setAllBranchOptions(allBranches);
    setBranchConfigs(configs);
    // Auto-select all branches
    setSelectedBranchIds(new Set(allBranches.map((b) => b.id)));
    setBranchesLoading(false);
  }, [id, listing]);

  useEffect(() => {
    if (currentStep === "print-order" && listing && allBranchOptions.length === 0) {
      loadBranchesForListing();
    }
  }, [currentStep, listing, allBranchOptions.length, loadBranchesForListing]);

  // Get selected branch configs for display
  const selectedBranchConfigs = branchConfigs.filter((b) => selectedBranchIds.has(b.branchId));
  const branchesWithMaterials = selectedBranchConfigs.filter((b) => b.materials.some((m) => m.quantity > 0));

  const handleSubmitBranchPrintOrder = async () => {
    if (selectedBranchIds.size === 0) {
      toast({ title: "Select at least one branch", variant: "destructive" });
      return;
    }

    if (branchesWithMaterials.length === 0) {
      toast({ title: "Set quantity > 0 for at least one material", variant: "destructive" });
      return;
    }

    // Validate shipping addresses
    for (const b of branchesWithMaterials) {
      if (!b.shippingAddress.recipient.trim() || !b.shippingAddress.street.trim() || !b.shippingAddress.city.trim()) {
        toast({ title: `Complete shipping address for ${b.branchName}`, variant: "destructive" });
        return;
      }
    }

    setBranchOrderSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const payload = {
        franchiseName: listing?.title || "",
        branches: branchesWithMaterials.map((b) => ({
          branchId: b.branchId,
          branchName: b.branchName,
          shippingAddress: b.shippingAddress,
          materials: b.materials.filter((m) => m.quantity > 0).map((m) => ({
            materialType: m.materialType,
            materialLabel: m.materialLabel,
            quantity: m.quantity,
          })),
        })),
        currency: detectedCurrency,
        submittedBy: session.user.id,
      };

      // Insert into advertiser_print_orders
      const { data: order, error } = await supabase
        .from("advertiser_print_orders")
        .insert({
          advertiser_id: session.user.id,
          branch_ids: branchesWithMaterials.map((b) => b.branchId),
          materials: payload as any,
          notes: JSON.stringify({ franchise_name: listing?.title, currency: detectedCurrency }),
          status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;

      // Update activation with print order reference
      if (activationId) {
        await supabase
          .from("activations")
          .update({ status: "printing", print_order_id: order.id, quantity: branchesWithMaterials.reduce((sum, b) => sum + b.materials.reduce((s, m) => s + m.quantity, 0), 0) })
          .eq("id", activationId);
      }

      // Send email notification
      try {
        await supabase.functions.invoke("submit-print-order-email", {
          body: { ...payload, orderId: order.id },
        });
      } catch (emailErr) {
        console.error("Email notification failed:", emailErr);
      }

      setOrderId(order.id);
      setPrintOrderComplete(true);
      setActivationStatus("printing");
      toast({ title: "Print order submitted!", description: "Your order is pending admin review." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBranchOrderSubmitting(false);
    }
  };

  const fetchListingDetails = async () => {
    try {
      const { data, error } = await supabase.
      from("ad_spaces").
       select("id, title, location, description, pricing, specifications, media_urls, publisher_id, monthly_subscription_fee, annual_subscription_fee, activation_fee, agent_disconnected").
       eq("id", id).
       single();

      if (error) throw error;
      setListing(data);

      // Use the address from the listing's specifications (entered during venue registration)
      if (data) {
        const specs = data.specifications as Record<string, any> || {};
        setPublisherAddress({
          businessName: data.title || "",
          contactEmail: specs.contact_email || "",
          contactPhone: specs.contact_number || null,
          location: specs.full_address || data.location || null
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load listing details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkExistingActivation = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.
      from("activations").
      select("*").
      eq("ad_space_id", id).
      eq("advertiser_id", session.user.id).
      order("created_at", { ascending: false }).
      limit(1).
      maybeSingle();

      if (data) {
        setActivationId(data.id);
        setActivationStatus(data.status);
        setArtworkUrl(data.ad_design_url || "");
        setSelectedProduct(data.ad_unit_sku || "");
        setQuantity(data.quantity || 1);
        setRejectionReason(data.rejection_reason || undefined);
        setApprovedTotalAmount(data.total_amount || 0);
        setEstimatedPublisherPayout(data.estimated_publisher_payout || 0);

        if (data.start_date) setStartDate(new Date(data.start_date));
        if (data.end_date) setEndDate(new Date(data.end_date));
        if (data.activation_type) setActivationType(data.activation_type as ActivationType);
        if (data.print_order_id) {
          setPrintOrderComplete(true);
          setOrderId(data.print_order_id);
        }

        // Determine current step based on status
        switch (data.status) {
          case "design":
          case "pending_submission":
            setCurrentStep("design");
            if (data.ad_design_url) setDesignApproved(true);
            break;
          case "pending_approval":
          case "under_review":
          case "rejected":
            setCurrentStep("design");
            setDesignApproved(true);
            break;
          case "approved":
          case "printing":
            setCurrentStep("print-order");
            setDesignApproved(true);
            break;
          case "payment_pending":
          case "completed":
            setCurrentStep("payment");
            setDesignApproved(true);
            setPrintOrderComplete(true);
            break;
        }
      }
    } catch (error) {
      console.error("Error checking activation:", error);
    }
  };

  const getActivationType = (adUnitType: string): ActivationType => {
    const typeMap: Record<string, ActivationType> = {
      "sticker": "sticker",
      "table-tent": "table_tent",
      "poster": "poster",
      "flyer": "flyer",
      "banner": "banner"
    };
    return typeMap[adUnitType] || "other";
  };

  const handleMockupApproval = async (data: {
    artworkUrl: string;
    campaignDetails?: {
      campaignName: string;
      brandCategory: string;
      campaignObjective: string;
      targetAudience: string;
      creativeNotes: string;
    };
  }) => {
    setArtworkUrl(data.artworkUrl);

    // Get ad unit type from listing (publisher defined)
    const listingAdUnits = listing?.specifications?.ad_units || listing?.pricing?.ad_units || [];
    const firstAdUnit = listingAdUnits[0];
    const adUnitType = firstAdUnit?.type || "sticker";

    setApprovedAdUnitType(adUnitType);
    const type = getActivationType(adUnitType);
    setActivationType(type);
    setDesignApproved(true);

    // Create or update activation record
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !listing) return;

      // Use publisher_profile_id directly (not user_id) for consistent querying
      const publisherProfileId = listing.publisher_id;

      const activationData = {
        ad_design_url: data.artworkUrl,
        activation_type: type,
        campaign_objective: data.campaignDetails?.campaignObjective || null,
        brand_category: data.campaignDetails?.brandCategory || null
      };

      if (activationId) {
        await supabase.
        from("activations").
        update(activationData).
        eq("id", activationId);
      } else {
        const { data: newActivation, error } = await supabase.
        from("activations").
        insert({
          ad_space_id: id,
          advertiser_id: session.user.id,
          publisher_id: publisherProfileId,
          status: "design",
          ...activationData
        }).
        select().
        single();

        if (error) throw error;
        if (newActivation) {
          setActivationId(newActivation.id);
        }
      }
    } catch (error: any) {
      console.error("Error saving activation:", error);
    }
  };

  const handleDatesChange = async (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);

    // Save dates to activation record
    if (activationId && start && end) {
      try {
        await supabase.
        from("activations").
        update({
          start_date: format(start, "yyyy-MM-dd"),
          end_date: format(end, "yyyy-MM-dd"),
          estimated_publisher_payout: estimatedPublisherPayout
        }).
        eq("id", activationId);
      } catch (error) {
        console.error("Error saving dates:", error);
      }
    }
  };

  const handleEstimatedPayoutChange = async (payout: number) => {
    setEstimatedPublisherPayout(payout);

    // Save payout to activation record
    if (activationId) {
      try {
        await supabase.
        from("activations").
        update({
          estimated_publisher_payout: payout
        }).
        eq("id", activationId);
      } catch (error) {
        console.error("Error saving payout:", error);
      }
    }
  };

  // Helper function to calculate booking price inline
  const calculateBookingPrice = () => {
    if (!startDate || !endDate || !listing) return 0;

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const diffWeeks = Math.ceil(diffDays / 7);

    const adUnits = listing.specifications?.ad_units || listing.pricing?.ad_units || [];
    const selectedAdUnit = adUnits.find((unit: any) =>
    unit.type === approvedAdUnitType || unit.type === activationType
    ) || adUnits[0];

    const weeklyRate =
    selectedAdUnit?.pricePerWeek ||
    selectedAdUnit?.weekly_subscription_fee ||
    listing.pricing?.weekly ||
    listing.pricing?.pricePerWeek ||
    listing.specifications?.weekly_lease_price ||
    0;

    const monthlyRate =
    selectedAdUnit?.pricePerMonth ||
    selectedAdUnit?.monthly_subscription_fee ||
    listing.pricing?.monthly ||
    listing.pricing?.pricePerMonth ||
    listing.monthly_subscription_fee ||
    listing.specifications?.monthly_lease_price ||
    0;


    if (diffWeeks >= 4 && monthlyRate > 0) {
      const fullMonths = Math.floor(diffWeeks / 4);
      const remainingWeeks = diffWeeks % 4;
      return fullMonths * monthlyRate + remainingWeeks * weeklyRate;
    }

    return diffWeeks * weeklyRate;
  };

  // Submit Ad Request to Admin for Approval
  const handleSubmitAdRequest = async () => {
    if (!startDate || !endDate || !listing || !artworkUrl) {
      toast({
        title: "Error",
        description: "Please complete all required fields (design, dates) before submitting.",
        variant: "destructive"
      });
      return;
    }

    // Use estimatedPublisherPayout as primary, fall back to calculated price
    const bookingPrice = estimatedPublisherPayout > 0 ? estimatedPublisherPayout : calculateBookingPrice();

    if (bookingPrice <= 0) {
      toast({
        title: "Error",
        description:
        "Cannot submit without a valid booking price. Please ensure dates are selected and the listing has pricing configured.",
        variant: "destructive"
      });
      return;
    }

    setSubmittingRequest(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Always persist an activation record on submission (even if one wasn't created earlier)
      let persistedActivationId = activationId;

      if (!persistedActivationId) {
        const { data: newActivation, error: insertError } = await supabase.
        from("activations").
        insert({
          ad_space_id: id,
          advertiser_id: session.user.id,
          publisher_id: listing.publisher_id, // publisher_profile_id (canonical)
          status: "pending_approval",
          submitted_at: new Date().toISOString(),
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          estimated_publisher_payout: bookingPrice,
          quantity,
          ad_design_url: artworkUrl,
          activation_type: activationType
        }).
        select("id").
        single();

        if (insertError) throw insertError;

        persistedActivationId = newActivation.id;
        setActivationId(persistedActivationId);
      } else {
        const { error: updateError } = await supabase.
        from("activations").
        update({
          status: "pending_approval",
          submitted_at: new Date().toISOString(),
          estimated_publisher_payout: bookingPrice,
          quantity,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          ad_design_url: artworkUrl,
          activation_type: activationType,
          publisher_id: listing.publisher_id
        }).
        eq("id", persistedActivationId);

        if (updateError) throw updateError;
      }

      // Send notification to all verified admins
      try {
        const { data: adminProfiles } = await supabase
          .from("admin_profiles")
          .select("user_id")
          .eq("status", "verified");

        if (adminProfiles && adminProfiles.length > 0) {
          const notifications = adminProfiles.map((admin) => ({
            user_id: admin.user_id,
            title: "New Booking Request",
            message: `A new ad space booking request for "${listing.title}" has been submitted and requires your approval.`,
            type: "booking_request",
          }));

          await supabase.from("notifications").insert(notifications);
        }
      } catch (notifyError) {
        console.error("Failed to send admin notifications:", notifyError);
      }

      setActivationStatus("pending_approval");
      toast({
        title: "Booking Request Submitted!",
        description: "Your booking request has been sent to the admin team for review."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit booking request",
        variant: "destructive"
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handlePlacePrintOrder = async () => {
    if (!selectedProductId) {
      toast({
        title: "Missing information",
        description: "Please select a product.",
        variant: "destructive"
      });
      return;
    }

    if (!publisherAddress) {
      toast({
        title: "Missing information",
        description: "Publisher address not available.",
        variant: "destructive"
      });
      return;
    }

    const product = getProductById(selectedProductId);
    if (!product) {
      toast({
        title: "Invalid product",
        description: "Please select a valid product.",
        variant: "destructive"
      });
      return;
    }

    if (quantity < product.minQuantity) {
      toast({
        title: "Minimum quantity required",
        description: `This product requires a minimum of ${product.minQuantity} units.`,
        variant: "destructive"
      });
      return;
    }

    setOrderLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const totalPrice = calculateOrderTotal(product, quantity);

      // Create print order in database
      const { data: printOrder, error: orderError } = await supabase.
      from("print_orders").
      insert({
        activation_id: activationId,
        advertiser_id: session.user.id,
        order_status: "pending_admin",
        product_sku: product.sku,
        product_name: product.name,
        product_specs: {
          ...product.specs,
          print_handler: "platform"
        },
        quantity,
        design_url: artworkUrl,
        shipping_address: {
          recipientName: publisherAddress?.businessName || "",
          line1: publisherAddress?.location || listing?.location || "",
          line2: null,
          city: null,
          state: null,
          postalCode: null,
          country: shippingCountry,
          email: publisherAddress?.contactEmail || "",
          phone: publisherAddress?.contactPhone || ""
        },
        shipping_country: shippingCountry,
        total_price: totalPrice
      }).
      select().
      single();

      if (orderError) throw orderError;

      // Update activation status to pending_print_approval
      if (activationId) {
        await supabase.
        from("activations").
        update({
          status: "printing",
          print_order_id: printOrder.id,
          quantity
        }).
        eq("id", activationId);
      }

      // Send message to admin inbox
      const { data: adminRoles } = await supabase.
      from("user_roles").
      select("user_id").
      eq("role", "admin").
      limit(1);

      if (adminRoles && adminRoles.length > 0) {
        const adminUserId = adminRoles[0].user_id;
        await supabase.
        from("messages").
        insert({
          sender_id: session.user.id,
          recipient_id: adminUserId,
          subject: `Print Order Request - ${product.name}`,
          content: `New print order request submitted:\n\n` +
          `**Listing:** ${listing?.title || "N/A"}\n` +
          `**Product:** ${product.name}\n` +
          `**Quantity:** ${quantity} units\n` +
          `**Total Price:** $${totalPrice.toFixed(2)}\n` +
          `**Shipping To:** ${publisherAddress?.businessName}\n` +
          `**Address:** ${publisherAddress?.location || listing?.location || "Not specified"}\n` +
          `\n**Design URL:** ${artworkUrl}\n\n` +
          `Please review and approve this order in the Admin Orders page.`,
          listing_id: listing?.id || null,
          listing_type: "ad_space"
        });
      }

      setOrderId(printOrder.id);
      setPrintOrderComplete(true);
      setActivationStatus("printing");

      toast({
        title: "Order Submitted!",
        description: "Your print order is pending admin approval. You'll be notified when reviewed."
      });
    } catch (error: any) {
      console.error("Order error:", error);
      toast({
        title: "Order failed",
        description: error.message || "Failed to place order",
        variant: "destructive"
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const handlePayNow = async () => {
    // Mark activation as completed
    if (activationId) {
      try {
        const product = getProductById(selectedProductId);
        const totalAmount = product ? calculateOrderTotal(product, quantity) : 0;

        await supabase.
        from("activations").
        update({
          status: "completed",
          total_amount: totalAmount + estimatedPublisherPayout
        }).
        eq("id", activationId);

        setActivationStatus("completed");

        // Send notification to venue publisher
        if (listing?.publisher_id) {
          // Get publisher user_id from publisher_profiles
          const { data: publisherProfile } = await supabase.
          from("publisher_profiles").
          select("user_id, business_name").
          eq("id", listing.publisher_id).
          single();

          if (publisherProfile?.user_id) {
            await supabase.
            from("notifications").
            insert({
              user_id: publisherProfile.user_id,
              title: "Print Ad Material Confirmed!",
              message: `Great news! An advertiser has completed payment for "${listing.title}". TrioTag is now handling the Print Ad Material for your venue.`,
              type: "payment_received"
            });
          }
        }

        toast({
          title: "Activation Complete!",
          description: "Your booking is now confirmed and added to the publisher's calendar."
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to complete activation",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Payment Gateway",
        description: "Payment integration coming soon. Contact support for manual activation."
      });
    }
  };

  const selectedPrintProduct = getProductById(selectedProductId);
  const orderTotal = selectedPrintProduct ? calculateOrderTotal(selectedPrintProduct, quantity) : 0;

  // Calculate subscription price based on selected duration
  const calculateSubscriptionPrice = () => {
    if (!startDate || !endDate || !listing) return 0;

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates
    const diffWeeks = Math.ceil(diffDays / 7);

    // Get pricing from multiple sources:
    // 1. listing.specifications.ad_units (ad unit specific pricing)
    // 2. listing.pricing.ad_units (alternative location)
    // 3. listing.pricing (legacy direct pricing)
    const adUnits = listing.specifications?.ad_units || listing.pricing?.ad_units || [];
    const selectedAdUnit = adUnits.find((unit: any) =>
    unit.type === approvedAdUnitType || unit.type === activationType
    ) || adUnits[0];

    // Get weekly rate from multiple possible fields (including specs from venue/franchise registration)
    const weeklyRate =
    selectedAdUnit?.pricePerWeek ||
    selectedAdUnit?.weekly_subscription_fee ||
    listing.pricing?.weekly ||
    listing.pricing?.pricePerWeek ||
    listing.specifications?.weekly_lease_price ||
    0;

    // Get monthly rate from multiple possible fields (including top-level column and specs)
    const monthlyRate =
    selectedAdUnit?.pricePerMonth ||
    selectedAdUnit?.monthly_subscription_fee ||
    listing.pricing?.monthly ||
    listing.pricing?.pricePerMonth ||
    listing.monthly_subscription_fee ||
    listing.specifications?.monthly_lease_price ||
    0;

    // Pricing logic: months apply first, remaining weeks billed at weekly rate
    if (diffWeeks >= 4 && monthlyRate > 0) {
      const fullMonths = Math.floor(diffWeeks / 4);
      const remainingWeeks = diffWeeks % 4;
      return fullMonths * monthlyRate + remainingWeeks * weeklyRate;
    }

    if (weeklyRate > 0) {
      return diffWeeks * weeklyRate;
    }

    return 0;
  };

  const subscriptionPrice = calculateSubscriptionPrice();

  // Check if schedule and design are complete for submitting
  // Detect fees from all ad materials in listing (ad_units, pricing jsonb, and top-level columns)
  const listingAdUnits = listing?.specifications?.ad_units || listing?.pricing?.ad_units || [];
  const hasListingFees = listingAdUnits.some((unit: any) =>
    (unit.pricePerWeek && unit.pricePerWeek > 0) ||
    (unit.pricePerMonth && unit.pricePerMonth > 0) ||
    (unit.weekly_subscription_fee && unit.weekly_subscription_fee > 0) ||
    (unit.monthly_subscription_fee && unit.monthly_subscription_fee > 0)
  ) || (listing?.pricing?.weekly && listing.pricing.weekly > 0)
    || (listing?.pricing?.monthly && listing.pricing.monthly > 0)
    || (listing?.pricing?.pricePerWeek && listing.pricing.pricePerWeek > 0)
    || (listing?.pricing?.pricePerMonth && listing.pricing.pricePerMonth > 0)
    || (listing?.specifications?.weekly_lease_price && listing.specifications.weekly_lease_price > 0)
    || (listing?.specifications?.monthly_lease_price && listing.specifications.monthly_lease_price > 0)
    || (listing?.monthly_subscription_fee && listing.monthly_subscription_fee > 0)
    || (listing?.activation_fee && listing.activation_fee > 0);

  const hasValidPrice = subscriptionPrice > 0 || estimatedPublisherPayout > 0;
  const canSubmitAdRequest = designApproved && startDate && endDate && hasValidPrice && hasListingFees;

  // Check if waiting for admin response
  const isWaitingForApproval = ["pending_submission", "pending_approval", "under_review"].includes(activationStatus);
  const isApproved = activationStatus === "approved";
  const isRejected = activationStatus === "rejected";

  if (loading || isAdvertiser === null) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>);

  }

  // Restrict access to advertisers only
  if (!isAdvertiser) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Access Restricted</CardTitle>
              <CardDescription>
                Only advertiser accounts can activate listings. Publishers cannot activate their own or other listings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you're an advertiser, please make sure you're logged in with your advertiser account.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => navigate("/auth")} variant="default">
                  Sign In as Advertiser
                </Button>
                <Button onClick={() => navigate(-1)} variant="outline">
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>);

  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Listing not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>);

  }

  const primaryImage = Array.isArray(listing.media_urls) && listing.media_urls.length > 0 ?
  listing.media_urls[0] :
  null;

  const activationPrice = subscriptionPrice > 0 ? subscriptionPrice : estimatedPublisherPayout;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Step Indicator - Now 3 steps: Book Ad Space → Print Order → Payment */}
        <ActivationStepper
          currentStep={currentStep}
          approvalStatus={isWaitingForApproval ? "pending" : isApproved ? "approved" : undefined} />


        {/* Listing Summary with Price */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {primaryImage &&
              <div className="w-full sm:w-32 h-24 overflow-hidden rounded-lg flex-shrink-0">
                  <img
                  src={primaryImage}
                  alt={listing.title}
                  className="w-full h-full object-cover" />

                </div>
              }
              <div className="flex-1">
                <h2 className="text-xl font-bold">{listing.title}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                </div>
                {listing.specifications?.venue_type &&
                <Badge variant="secondary" className="mt-2">
                    {listing.specifications.venue_type}
                  </Badge>
                }
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {startDate && endDate ?
                  <>Total Booking Fee ({Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))} week{Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)) !== 1 ? 's' : ''})</> :

                  'Total Booking Fee'
                  }
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(activationPrice, listing?.specifications?.lease_currency || listing?.specifications?.ad_units?.[0]?.currency || listing?.specifications?.currency || "USD")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === "design" &&
        <div className="space-y-8">
            {/* Show status messages for waiting/rejected states */}
            {isWaitingForApproval &&
          <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <Clock className="h-5 w-5 animate-pulse" />
                    Waiting for Admin Review
                  </CardTitle>
                  <CardDescription>
                    Your booking request has been submitted. The admin team will review and respond shortly.
                  </CardDescription>
                </CardHeader>
              </Card>
          }

            {isRejected &&
          <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    Booking Request Rejected
                  </CardTitle>
                  <CardDescription>
                    {rejectionReason || "The admin has rejected your booking request. You can modify and resubmit."}
                  </CardDescription>
                </CardHeader>
              </Card>
          }

            {isApproved &&
          <Card className="border-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <CheckCircle className="h-5 w-5" />
                    Booking Request Approved!
                  </CardTitle>
                  <CardDescription>
                    Your booking request has been approved. Proceed to place your print order.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                className="w-full"
                size="lg"
                onClick={() => setCurrentStep("print-order")}>

                    Continue to Print Order
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
          }

            {/* Design Upload and Booking - only show if not yet approved */}
            {!isApproved &&
          <>
                <div className="grid lg:grid-cols-2 gap-8">
                  <AdMockupPreview onApprove={handleMockupApproval} />
                  
                  <div className="space-y-6">
                    {designApproved ?
                <Card className="border-primary">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-primary">
                            <CheckCircle className="h-5 w-5" />
                            Design Ready
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-4 bg-primary/10 rounded-lg">
                            <p className="text-sm font-medium">
                              Ad Unit: {approvedAdUnitType.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Product SKU: {selectedProduct}
                            </p>
                          </div>
                          {artworkUrl &&
                    <div className="p-3 bg-muted rounded-lg">
                              <img
                        src={artworkUrl}
                        alt="Your artwork"
                        className="max-h-32 mx-auto rounded object-contain" />

                            </div>
                    }
                        </CardContent>
                      </Card> :

                <Card>
                        <CardHeader>
                          <CardTitle>Step 1: Book Ad Space</CardTitle>
                          <CardDescription>
                            Enter your campaign details, upload creative, and select ad unit type.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-muted-foreground/50" />
                              Provide campaign details (name, objective, category)
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-muted-foreground/50" />
                              Upload your creative (PNG or JPG, max 30)
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-muted-foreground/50" />
                              Select ad unit type and quantity
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-muted-foreground/50" />
                              Choose booking schedule and dates
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                }
                  </div>
                </div>

                {/* Booking Scheduler */}
                {designApproved && !isWaitingForApproval &&
            <>
                    <BookingScheduler
                startDate={startDate}
                endDate={endDate}
                onDatesChange={handleDatesChange}
                pricing={{
                  ...listing.pricing,
                  ad_units: listing.specifications?.ad_units || listing.pricing?.ad_units || [],
                  weekly_lease_price: listing.specifications?.weekly_lease_price,
                  monthly_lease_price: listing.specifications?.monthly_lease_price,
                }}
                adUnitType={approvedAdUnitType || activationType}
                quantity={quantity}
                onEstimatedPayoutChange={handleEstimatedPayoutChange}
                currency={listing.specifications?.lease_currency || listing.specifications?.ad_units?.[0]?.currency || listing.specifications?.currency || "USD"} />


                    {/* Quantity Selection */}
                    
























































                    {/* Submit Booking Request Button */}
                    <Button
                className="w-full"
                size="lg"
                onClick={handleSubmitAdRequest}
                disabled={!canSubmitAdRequest || submittingRequest}>

                      {submittingRequest ?
                <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting Booking Request...
                        </> :

                <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Booking Request - {formatPrice(activationPrice, listing?.specifications?.lease_currency || listing?.specifications?.ad_units?.[0]?.currency || listing?.specifications?.currency || "USD")}
                        </>
                }
                    </Button>

                    {!canSubmitAdRequest &&
              <div className="space-y-1 text-sm text-center text-muted-foreground">
                        {!designApproved && <p>⚠ Please upload and confirm your design.</p>}
                        {!startDate && <p>⚠ Please select a start date.</p>}
                        {!endDate && <p>⚠ Please select an end date.</p>}
                        {!hasListingFees && <p>⚠ This listing has no fees configured. Contact the admin.</p>}
                        {hasListingFees && startDate && endDate && !hasValidPrice && <p>⚠ Booking price could not be calculated for the selected dates.</p>}
                      </div>
              }
                  </>
            }
              </>
          }
          </div>
        }

        {currentStep === "print-order" &&
        <>
            {printOrderComplete ?
          <div className="max-w-xl mx-auto">
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Order Submitted for Review</CardTitle>
                    <CardDescription className="text-base">
                      Your print order is being reviewed by our admin team. You'll be notified once it's approved.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Order ID</span>
                        <span className="font-mono font-medium">{orderId.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Branches</span>
                        <span className="font-medium">{branchesWithMaterials.length} location(s)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant="secondary">Pending Admin Approval</Badge>
                      </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Package className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">What happens next?</p>
                          <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                            <li>Admin reviews your order details</li>
                            <li>You receive approval notification</li>
                            <li>Proceed to Payment (Step 3)</li>
                            <li>Production begins after payment</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    <PrintOrderPaymentGate
                  orderId={orderId}
                  onProceedToPayment={() => setCurrentStep("payment")}
                  onBackToDashboard={() => navigate("/advertiser-dashboard")} />
                  </CardContent>
                </Card>
              </div> :

          <div className="space-y-8">
                {/* Print Order Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-1">Print Order — Branch-Level Configuration</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select branch locations, configure ad materials per branch, and submit your print order.
                  </p>
                </div>

                {branchesLoading ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Section 1: Branch Selection */}
                    <BranchSelector
                      branches={allBranchOptions}
                      selectedIds={selectedBranchIds}
                      onChange={setSelectedBranchIds}
                    />

                    {/* Section 2: Branch-Level Material Configuration (only selected branches) */}
                    {selectedBranchIds.size > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold mb-3">Configure Ad Materials per Selected Branch</h2>
                        <BranchMaterialConfigurator
                          branches={selectedBranchConfigs}
                          onChange={(updated) => {
                            // Merge updated configs back into full branchConfigs
                            const updatedMap = new Map(updated.map((b) => [b.branchId, b]));
                            setBranchConfigs((prev) =>
                              prev.map((b) => updatedMap.get(b.branchId) || b)
                            );
                          }}
                          availableMaterials={availableMaterials}
                        />
                      </div>
                    )}

                    {/* Section 3: Order Summary */}
                    {branchesWithMaterials.length > 0 && (
                      <PrintOrderSummary
                        franchiseName={listing?.title || ""}
                        branches={selectedBranchConfigs}
                        currency={detectedCurrency}
                      />
                    )}

                    {/* Submit Button */}
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleSubmitBranchPrintOrder}
                      disabled={branchOrderSubmitting || selectedBranchIds.size === 0}
                    >
                      {branchOrderSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting Print Order...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Print Order for Approval
                        </>
                      )}
                    </Button>
                  </>
                )}

                <Button
              variant="outline"
              onClick={() => setCurrentStep("design")}
              className="w-full max-w-md mx-auto">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Design
                </Button>
              </div>
          }
          </>
        }

        {currentStep === "payment" &&
        <div className="max-w-2xl mx-auto">
            {activationStatus === "completed" ?
          <OrderSuccessCard
            orderId={orderId || activationId || "N/A"}
            productName={selectedPrintProduct?.name || "Print Order"}
            quantity={quantity}
            onNewOrder={() => navigate("/explore")} /> :


          <>
                {printOrderComplete &&
            <Card className="mb-6 border-primary">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 text-primary">
                        <CheckCircle className="h-6 w-6" />
                        <div>
                          <p className="font-semibold">Print Order Submitted</p>
                          <p className="text-sm text-muted-foreground">Order ID: {orderId.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
            }

                <PaymentGateway
              activationId={activationId || id || ""}
              listingTitle={listing?.title || "Ad Space"}
              onPaymentSuccess={handlePayNow}
              onBack={() => setCurrentStep("print-order")}
              disabled={activationStatus === "completed"} />

              </>
          }
          </div>
        }
      </div>
    </div>);

};

export default ActivateListing;