import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, MapPin, CheckCircle, Building2, Truck, Send, DollarSign } from "lucide-react";
import { SHIPPING_COUNTRIES } from "@/lib/printProducts";
import { getCurrencySymbol, formatPrice } from "@/hooks/useCurrencyConversion";

interface ListingOption {
  id: string;
  title: string;
  location: string;
  city: string;
  branchCount: number;
  specifications: any;
  pricing: any;
  media_urls: any;
}

interface MaterialOption {
  type: string;
  label: string;
  size: string;
  placement: string;
  weeklyFee: number;
  monthlyFee: number;
  currency: string;
}

interface SelectedMaterial extends MaterialOption {
  quantity: number;
}

const AD_UNIT_MATERIAL_LABELS: Record<string, string> = {
  vinyl_sticker: "Vinyl Sticker",
  table_tent_card: "Table Tent Card",
  acrylic_table_tent: "Acrylic Table Tent",
  coroplast_stand: "Coroplast Stand",
  poster_frame: "Poster Frame",
  wall_decal: "Wall Decal",
};

const AD_UNIT_SPECS: Record<string, { size: string; placement: string }> = {
  vinyl_sticker: { size: '8.3" x 11.7" (A4)', placement: "Walls, Windows, Doors" },
  table_tent_card: { size: '8.3" x 11.7" (A4)', placement: "Tables, Counters" },
  acrylic_table_tent: { size: '4" x 6"', placement: "Tables, Reception Desks" },
  coroplast_stand: { size: '18" x 24"', placement: "Sidewalks, Storefronts" },
  poster_frame: { size: '18" x 24"', placement: "Walls, Display Areas" },
  wall_decal: { size: "Custom", placement: "Walls, Windows" },
};

const OrderPrints = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [userId, setUserId] = useState<string>("");

  // Section 1: Listing selection
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string>("");
  const [listingsLoading, setListingsLoading] = useState(false);

  // Section 2: Materials
  const [availableMaterials, setAvailableMaterials] = useState<MaterialOption[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);

  // Section 3: Print details
  const [shippingCountry, setShippingCountry] = useState("PH");
  const [recipientName, setRecipientName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState("");

  const selectedListing = listings.find((l) => l.id === selectedListingId);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: profile } = await supabase
        .from("advertiser_profiles")
        .select("status")
        .eq("user_id", session.user.id)
        .single();

      if (profile?.status === "approved") {
        setIsVerified(true);
        setUserId(session.user.id);
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  // Load listings when verified
  useEffect(() => {
    if (!isVerified || !userId) return;
    const loadListings = async () => {
      setListingsLoading(true);
      try {
        // Get listings where user is advertiser or leased
        const { data: adSpaces } = await supabase
          .from("ad_spaces")
          .select("id, title, location, specifications, pricing, media_urls, availability_status")
          .eq("approval_status", "approved")
          .or(`advertiser_id.eq.${userId},leased_advertiser_ids.cs.{${userId}}`);

        if (!adSpaces || adSpaces.length === 0) {
          setListings([]);
          setListingsLoading(false);
          return;
        }

        // Get branch counts
        const listingIds = adSpaces.map((a) => a.id);
        const { data: branchCounts } = await supabase.rpc("get_listing_branch_counts", {
          _listing_ids: listingIds,
        });

        const countMap = new Map<string, number>();
        branchCounts?.forEach((bc: any) => countMap.set(bc.listing_id, bc.branch_count));

        const mapped: ListingOption[] = adSpaces.map((a) => {
          const specs = (a.specifications as any) || {};
          const headOffice = specs.head_office_address || {};
          return {
            id: a.id,
            title: a.title,
            location: a.location || "",
            city: headOffice.city || "",
            branchCount: countMap.get(a.id) || 0,
            specifications: a.specifications,
            pricing: a.pricing,
            media_urls: a.media_urls,
          };
        });

        setListings(mapped);
      } catch (err) {
        console.error("Failed to load listings:", err);
      } finally {
        setListingsLoading(false);
      }
    };
    loadListings();
  }, [isVerified, userId]);

  // When listing selected, load materials
  useEffect(() => {
    if (!selectedListingId || !selectedListing) {
      setAvailableMaterials([]);
      setSelectedMaterials([]);
      return;
    }

    const specs = (selectedListing.specifications as any) || {};
    const materialsArr: string[] = specs.ad_unit_materials || [];
    const currency = specs.lease_currency || "USD";
    const weeklyPrice = specs.weekly_lease_price || 0;
    const monthlyPrice = specs.monthly_lease_price || 0;

    const mats: MaterialOption[] = materialsArr.map((type) => ({
      type,
      label: AD_UNIT_MATERIAL_LABELS[type] || type,
      size: AD_UNIT_SPECS[type]?.size || "Standard",
      placement: AD_UNIT_SPECS[type]?.placement || "Various",
      weeklyFee: weeklyPrice,
      monthlyFee: monthlyPrice,
      currency,
    }));

    setAvailableMaterials(mats);
    setSelectedMaterials([]);
  }, [selectedListingId]);

  const toggleMaterial = (mat: MaterialOption) => {
    setSelectedMaterials((prev) => {
      const exists = prev.find((m) => m.type === mat.type);
      if (exists) return prev.filter((m) => m.type !== mat.type);
      return [...prev, { ...mat, quantity: 1 }];
    });
  };

  const updateMaterialQuantity = (type: string, qty: number) => {
    setSelectedMaterials((prev) =>
      prev.map((m) => (m.type === type ? { ...m, quantity: Math.max(1, qty) } : m))
    );
  };

  const totalQuantity = selectedMaterials.reduce((sum, m) => sum + m.quantity, 0);

  const handleSubmitOrder = async () => {
    if (!selectedListingId || selectedMaterials.length === 0) {
      toast({ title: "Select a listing and at least one material", variant: "destructive" });
      return;
    }
    if (!recipientName.trim() || !streetAddress.trim() || !city.trim() || !postalCode.trim()) {
      toast({ title: "Fill in all required shipping fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const specs = (selectedListing?.specifications as any) || {};
      const currency = specs.lease_currency || "USD";

      const { data: order, error } = await supabase
        .from("advertiser_print_orders")
        .insert({
          advertiser_id: userId,
          branch_ids: [],
          materials: selectedMaterials.map((m) => ({
            type: m.type,
            label: m.label,
            quantity: m.quantity,
            size: m.size,
            weeklyFee: m.weeklyFee,
            monthlyFee: m.monthlyFee,
            currency: m.currency,
          })) as any,
          notes: JSON.stringify({
            listing_id: selectedListingId,
            listing_title: selectedListing?.title,
            shipping_country: shippingCountry,
            shipping_address: {
              recipientName,
              streetAddress,
              city,
              province,
              postalCode,
              contactNumber,
              country: shippingCountry,
            },
            pricing_snapshot: {
              currency,
              weeklyFee: specs.weekly_lease_price || 0,
              monthlyFee: specs.monthly_lease_price || 0,
            },
          }),
          status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;

      setOrderId(order.id);
      setOrderComplete(true);
      toast({ title: "Print order submitted!", description: "Your order is pending admin review." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Account Verification Required</CardTitle>
              <CardDescription>Only verified advertiser accounts can order print materials.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/advertiser-dashboard")}>Back to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <Card className="max-w-lg mx-auto text-center">
            <CardHeader>
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl">Print Order Submitted!</CardTitle>
              <CardDescription>Your order is now pending admin approval.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-[14px]">
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono font-bold">{orderId.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-[14px]">
                <p className="text-sm font-medium mb-2">Status Flow</p>
                <div className="flex flex-wrap gap-1 justify-center text-xs">
                  <Badge variant="default">Pending</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary">Approved</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary">Printing</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary">Shipped</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary">Completed</Badge>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => { setOrderComplete(false); setSelectedListingId(""); setSelectedMaterials([]); setRecipientName(""); setStreetAddress(""); setCity(""); setProvince(""); setPostalCode(""); setContactNumber(""); }}>
                  Place Another Order
                </Button>
                <Button variant="outline" onClick={() => navigate("/advertiser-dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const listingCurrency = selectedListing ? ((selectedListing.specifications as any)?.lease_currency || "USD") : "USD";
  const currencySymbol = getCurrencySymbol(listingCurrency);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Print Materials</h1>
          <p className="text-muted-foreground">
            Select an ad space listing, choose materials, and submit your print order for admin approval.
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Select Ad Space Listing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Select Ad Space Listing
              </CardTitle>
              <CardDescription>Choose which ad space listing to order print materials for.</CardDescription>
            </CardHeader>
            <CardContent>
              {listingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No ad space listings found.</p>
                  <p className="text-xs text-muted-foreground mt-1">Get linked to a listing to start ordering.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      className={`p-4 rounded-[14px] border-2 cursor-pointer transition-all ${
                        selectedListingId === listing.id
                          ? "border-primary bg-primary/5"
                          : "border-[rgba(255,255,255,0.12)] hover:border-primary/40"
                      }`}
                      onClick={() => setSelectedListingId(listing.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{listing.title}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {listing.city || "Unknown City"} — {listing.branchCount > 0 ? `${listing.branchCount} Locations` : "1 Location"}
                          </p>
                        </div>
                        <Badge variant={listing.branchCount > 0 ? "default" : "secondary"}>
                          {listing.branchCount > 0 ? "Multi-Location" : "Single Location"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Available Ad Unit Materials & Pricing */}
          {selectedListingId && (
            <Card className={availableMaterials.length === 0 ? "opacity-60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-primary" />
                  Available Ad Unit Materials & Pricing
                </CardTitle>
                <CardDescription>
                  Materials configured for this listing. Select the ones you want to order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableMaterials.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No ad unit materials configured for this listing. Update the listing to add materials.
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {availableMaterials.map((mat) => {
                      const isSelected = selectedMaterials.some((m) => m.type === mat.type);
                      const selectedMat = selectedMaterials.find((m) => m.type === mat.type);
                      return (
                        <div
                          key={mat.type}
                          className={`p-4 rounded-[14px] border-2 transition-all ${
                            isSelected ? "border-primary bg-primary/5" : "border-[rgba(255,255,255,0.12)]"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{mat.label}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {mat.size} • {mat.placement}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1 text-sm mb-3">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Weekly Listing Fee</span>
                              <span className="font-medium">{formatPrice(mat.weeklyFee, mat.currency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Monthly Listing Fee</span>
                              <span className="font-medium">{formatPrice(mat.monthlyFee, mat.currency)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleMaterial(mat)}
                            />
                            <Label className="text-sm cursor-pointer" onClick={() => toggleMaterial(mat)}>
                              Select Material
                            </Label>
                          </div>

                          {isSelected && selectedMat && (
                            <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)]">
                              <Label className="text-xs">Quantity</Label>
                              <Input
                                type="number"
                                min={1}
                                value={selectedMat.quantity}
                                onChange={(e) => updateMaterialQuantity(mat.type, parseInt(e.target.value) || 1)}
                                className="mt-1"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Section 3: Print Product Details */}
          {selectedMaterials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5 text-primary" />
                  Print Product Details
                </CardTitle>
                <CardDescription>Configure shipping details for your print order.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Shipping Country</Label>
                  <Select value={shippingCountry} onValueChange={setShippingCountry}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SHIPPING_COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Recipient Name *</Label>
                  <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Full name" />
                </div>

                <div>
                  <Label>Street Address *</Label>
                  <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="123 Main Street" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City *</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                  </div>
                  <div>
                    <Label>Province / State</Label>
                    <Input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Province" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Postal Code *</Label>
                    <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="ZIP" />
                  </div>
                  <div>
                    <Label>Contact Number</Label>
                    <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+63 912 345 6789" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 4: Order Summary */}
          {selectedMaterials.length > 0 && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Print Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Listing</span>
                    <span className="font-medium">{selectedListing?.title}</span>
                  </div>

                  {selectedMaterials.map((m) => (
                    <div key={m.type} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium">x{m.quantity}</span>
                    </div>
                  ))}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Units</span>
                    <span className="font-medium">{totalQuantity}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping Country</span>
                    <span className="font-medium">{SHIPPING_COUNTRIES.find((c) => c.code === shippingCountry)?.name}</span>
                  </div>

                  <div className="pt-2 border-t border-[rgba(255,255,255,0.08)] space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Weekly Listing Fee</span>
                      <span className="font-medium">
                        {formatPrice(
                          (selectedListing?.specifications as any)?.weekly_lease_price || 0,
                          listingCurrency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Listing Fee</span>
                      <span className="font-medium">
                        {formatPrice(
                          (selectedListing?.specifications as any)?.monthly_lease_price || 0,
                          listingCurrency
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Print Order
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Your order will be reviewed by the admin team. Status: Pending → Approved → Printing → Shipped → Completed
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderPrints;
