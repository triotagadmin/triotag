import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapPin, Plus, Trash2, Edit, Store, Printer, ChevronDown, ChevronUp, Info, Power, PowerOff, Clock, XCircle, DollarSign, ChevronsUpDown, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getCountries, getProvinces, getCities, getPostalCode } from "@/lib/locationData";
import { cn } from "@/lib/utils";
import { PRINT_PRODUCTS } from "@/lib/printProducts";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type MarketplaceStatus = "active" | "inactive" | "pending_approval" | "rejected";

interface Franchise {
  id: string;
  advertiser_id: string;
  franchise_name: string;
  marketplace_status: MarketplaceStatus;
  created_at: string;
  updated_at: string;
  _isAdSpace?: boolean;
  _adSpaceId?: string;
  _location?: string;
}

interface FranchiseLocation {
  id: string;
  advertiser_id: string;
  advertiser_franchise_id: string | null;
  listing_id: string | null;
  branch_name: string | null;
  full_address: string;
  city: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  is_ad_space_listing: boolean;
  created_at: string;
}

interface MaterialPricing {
  id: string;
  partner_id: string;
  material_name: string;
  unit_type: string;
  base_price: number;
  min_quantity: number;
  rush_fee: number;
  design_fee: number;
  is_active: boolean;
}

interface PrintPartnerClientsContentProps {
  userId: string;
  partnerId: string;
}

const statusConfig: Record<MarketplaceStatus, { label: string; className: string; icon: React.ReactNode }> = {
  active: { label: "Approved on Marketplace", className: "bg-primary/20 text-primary border-primary/30", icon: <Power className="h-3 w-3" /> },
  inactive: { label: "Marketplace Inactive", className: "bg-muted text-muted-foreground border-border", icon: <PowerOff className="h-3 w-3" /> },
  pending_approval: { label: "Pending Approval", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="h-3 w-3" /> },
  rejected: { label: "Rejected", className: "bg-destructive/20 text-destructive border-destructive/30", icon: <XCircle className="h-3 w-3" /> },
};

const LocationCombobox = ({ value, onSelect, options, placeholder, searchPlaceholder, allowCustom }: {
  value: string; onSelect: (val: string) => void; options: string[]; placeholder: string; searchPlaceholder?: string; allowCustom?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-10">
          {value || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder || "Search..."} value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              {allowCustom && search.trim() ? (
                <button className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm cursor-pointer"
                  onClick={() => { onSelect(search.trim()); setOpen(false); setSearch(""); }}>
                  Use "{search.trim()}"
                </button>
              ) : "No results found."}
            </CommandEmpty>
            <CommandGroup>
              {filtered.map(opt => (
                <CommandItem key={opt} value={opt} onSelect={() => { onSelect(opt); setOpen(false); setSearch(""); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === opt ? "opacity-100" : "opacity-0")} />
                  {opt}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const PrintPartnerClientsContent = ({ userId, partnerId }: PrintPartnerClientsContentProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [locations, setLocations] = useState<FranchiseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFranchises, setExpandedFranchises] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);


  // Location dialog
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [targetFranchiseId, setTargetFranchiseId] = useState<string | null>(null);
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locCity, setLocCity] = useState("");
  const [locProvince, setLocProvince] = useState("");
  const [locPostal, setLocPostal] = useState("");
  const [locCountry, setLocCountry] = useState("");
  const [locContact, setLocContact] = useState("");
  const [locPhone, setLocPhone] = useState("");

  // Marketplace status
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [statusConfirmFranchise, setStatusConfirmFranchise] = useState<Franchise | null>(null);
  const [statusConfirmAction, setStatusConfirmAction] = useState<"activate" | "deactivate">("activate");

  const fetchAll = useCallback(async () => {
    const [fRes, lRes, adRes] = await Promise.all([
      supabase.from("advertiser_franchises").select("*").eq("advertiser_id", userId).order("created_at", { ascending: false }),
      supabase.from("advertiser_branches").select("*").eq("advertiser_id", userId).order("created_at", { ascending: false }),
      supabase.from("ad_spaces").select("id, title, location, approval_status, availability_status, created_at").eq("advertiser_id", userId).order("created_at", { ascending: false }),
    ]);

    const realFranchises: Franchise[] = (fRes.data || []) as unknown as Franchise[];
    const adSpaceRows = (adRes.data || []) as any[];
    const adSpaceFranchises: Franchise[] = adSpaceRows.map((ad: any) => {
      let mktStatus: MarketplaceStatus = "inactive";
      if (ad.approval_status === "approved" && ad.availability_status === "available") mktStatus = "active";
      else if (ad.approval_status === "pending") mktStatus = "pending_approval";
      else if (ad.approval_status === "rejected") mktStatus = "rejected";
      return {
        id: `adspace-${ad.id}`, _adSpaceId: ad.id, advertiser_id: userId, franchise_name: ad.title,
        marketplace_status: mktStatus, created_at: ad.created_at, updated_at: ad.created_at, _isAdSpace: true, _location: ad.location,
      };
    });

    setFranchises([...realFranchises, ...adSpaceFranchises] as any);
    if (lRes.data) setLocations(lRes.data as unknown as FranchiseLocation[]);
    setLoading(false);
  }, [userId, partnerId]);

  useEffect(() => {
    fetchAll();
    const ch1 = supabase.channel(`pp-franchises-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "advertiser_franchises", filter: `advertiser_id=eq.${userId}` }, () => fetchAll())
      .subscribe();
    const ch2 = supabase.channel(`pp-branches-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "advertiser_branches", filter: `advertiser_id=eq.${userId}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [userId, fetchAll]);

  useEffect(() => {
    if (franchises.length > 0) setExpandedFranchises(new Set(franchises.map(f => f.id)));
  }, [franchises]);

  const toggleExpand = (id: string) => {
    setExpandedFranchises(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // Location CRUD
  const buildFullAddress = () => [locAddress, locCity, locProvince, locPostal, locCountry].filter(Boolean).join(", ");

  const openAddLocation = (franchise: Franchise) => {
    setEditingLocationId(null);
    setTargetFranchiseId(franchise.id);
    setLocName(""); setLocAddress(""); setLocCity(""); setLocProvince(""); setLocPostal(""); setLocCountry(""); setLocContact(""); setLocPhone("");
    setLocationDialogOpen(true);
  };

  const saveLocation = async () => {
    if (!locName.trim() || !locAddress.trim()) { toast({ title: "Name and address required", variant: "destructive" }); return; }
    if (!targetFranchiseId) return;
    setSaving(true);
    const isAdSpace = targetFranchiseId.startsWith("adspace-");
    const realAdSpaceId = isAdSpace ? targetFranchiseId.replace("adspace-", "") : null;
    const realFranchiseId = isAdSpace ? null : targetFranchiseId;
    const fullAddr = buildFullAddress();
    const cityValue = locCity.trim() || null;

    if (editingLocationId) {
      const { error } = await supabase.from("advertiser_branches").update({
        branch_name: locName.trim(), full_address: fullAddr, city: cityValue,
        contact_name: locContact.trim() || null, contact_phone: locPhone.trim() || null,
      }).eq("id", editingLocationId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Location updated" }); setLocationDialogOpen(false); }
    } else {
      const { error } = await supabase.from("advertiser_branches").insert({
        advertiser_id: userId, advertiser_franchise_id: realFranchiseId, listing_id: realAdSpaceId,
        branch_name: locName.trim(), full_address: fullAddr, city: cityValue,
        contact_name: locContact.trim() || null, contact_phone: locPhone.trim() || null,
      });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Location added" }); setLocationDialogOpen(false); }
    }
    setSaving(false);
  };

  const deleteLocation = async (id: string) => {
    const { error } = await supabase.from("advertiser_branches").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Location removed" });
  };

  // Marketplace status
  const requestStatusChange = (franchise: Franchise, action: "activate" | "deactivate") => {
    setStatusConfirmFranchise(franchise);
    setStatusConfirmAction(action);
    setStatusConfirmOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!statusConfirmFranchise) return;
    setSaving(true);
    if ((statusConfirmFranchise as any)._isAdSpace) {
      const adSpaceId = (statusConfirmFranchise as any)._adSpaceId;
      const newAvailability = statusConfirmAction === "deactivate" ? "unavailable" : "available";
      const { error } = await supabase.from("ad_spaces").update({ availability_status: newAvailability } as any).eq("id", adSpaceId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: newAvailability === "available" ? "Listing activated" : "Listing deactivated" }); fetchAll(); }
    } else {
      const newStatus: MarketplaceStatus = statusConfirmAction === "deactivate" ? "inactive"
        : statusConfirmFranchise.marketplace_status === "inactive" ? "active" : "pending_approval";
      const { error } = await supabase.from("advertiser_franchises").update({ marketplace_status: newStatus }).eq("id", statusConfirmFranchise.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: newStatus === "active" ? "Listing activated" : newStatus === "inactive" ? "Listing deactivated" : "Submitted for approval" });
    }
    setSaving(false);
    setStatusConfirmOpen(false);
    setStatusConfirmFranchise(null);
  };

  // Material Pricing CRUD
  const openAddPricing = () => {
    setEditingPricing(null);
    setPricingForm({ material_name: "", base_price: "", min_quantity: "1", rush_fee: "0", design_fee: "0" });
    setPricingDialogOpen(true);
  };

  const openEditPricing = (p: MaterialPricing) => {
    setEditingPricing(p);
    setPricingForm({
      material_name: p.material_name, base_price: String(p.base_price),
      min_quantity: String(p.min_quantity), rush_fee: String(p.rush_fee), design_fee: String(p.design_fee),
    });
    setPricingDialogOpen(true);
  };

  const savePricing = async () => {
    if (!pricingForm.material_name || !pricingForm.base_price) { toast({ title: "Material name and price required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      partner_id: partnerId,
      material_name: pricingForm.material_name,
      base_price: parseFloat(pricingForm.base_price) || 0,
      min_quantity: parseInt(pricingForm.min_quantity) || 1,
      rush_fee: parseFloat(pricingForm.rush_fee) || 0,
      design_fee: parseFloat(pricingForm.design_fee) || 0,
    };
    if (editingPricing) {
      const { error } = await supabase.from("print_partner_material_pricing").update(payload).eq("id", editingPricing.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Pricing updated" }); setPricingDialogOpen(false); fetchAll(); }
    } else {
      const { error } = await supabase.from("print_partner_material_pricing").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Pricing added" }); setPricingDialogOpen(false); fetchAll(); }
    }
    setSaving(false);
  };

  const deletePricing = async (id: string) => {
    const { error } = await supabase.from("print_partner_material_pricing").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Pricing removed" }); fetchAll(); }
  };

  const togglePricingActive = async (p: MaterialPricing) => {
    const { error } = await supabase.from("print_partner_material_pricing").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchAll();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <>
      {/* Custom Material Pricing Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              My Material Pricing
            </h3>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="inline-flex items-center justify-center rounded-full h-5 w-5 bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 text-sm" side="bottom" align="start">
                <p className="font-medium mb-1">Custom Material Pricing</p>
                <p className="text-muted-foreground">Set your own prices for each ad material type. These prices will be used when generating client checkout links and invoices.</p>
              </PopoverContent>
            </Popover>
          </div>
          <Button size="sm" onClick={openAddPricing} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Material
          </Button>
        </div>

        {materialPricing.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <DollarSign className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm mb-1">No custom pricing set</p>
              <p className="text-xs text-muted-foreground mb-4">Add your material prices to start generating checkout links.</p>
              <Button size="sm" onClick={openAddPricing}><Plus className="h-4 w-4 mr-1" />Add Material Price</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {materialPricing.map(p => (
              <Card key={p.id} className={`transition-all ${!p.is_active ? "opacity-50" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{p.material_name}</p>
                      <p className="text-lg font-bold text-primary mt-1">₱{p.base_price.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/{p.unit_type}</span></p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
                        <span>Min qty: {p.min_quantity}</span>
                        {p.rush_fee > 0 && <span>Rush: ₱{p.rush_fee}</span>}
                        {p.design_fee > 0 && <span>Design: ₱{p.design_fee}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePricingActive(p)}>
                        {p.is_active ? <Power className="h-3.5 w-3.5 text-primary" /> : <PowerOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditPricing(p)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deletePricing(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Franchise / Ad Space Listings */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Store className="h-5 w-5" />
            My Franchises
          </h3>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="inline-flex items-center justify-center rounded-full h-5 w-5 bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                <Info className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm" side="bottom" align="start">
              <p className="font-medium mb-1">About My Franchises</p>
              <p className="text-muted-foreground">Manage your client franchise locations and ad space listings. Add locations, activate marketplace listings, and create print orders.</p>
            </PopoverContent>
          </Popover>
        </div>
        <Button size="sm" onClick={() => navigate("/venue-registration")} className="gap-1">
          <Plus className="h-4 w-4" />
          New Franchise
        </Button>
      </div>

      {franchises.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-1">No franchises yet</p>
            <p className="text-xs text-muted-foreground mb-4">Create a franchise to start adding client locations.</p>
            <Button size="sm" onClick={() => navigate("/venue-registration")}><Plus className="h-4 w-4 mr-1" />Create Franchise</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {franchises.map(franchise => {
            const isAdSpace = !!(franchise as any)._isAdSpace;
            const realAdSpaceId = isAdSpace ? (franchise as any)._adSpaceId : null;
            const fLocs = locations.filter(l =>
              isAdSpace ? l.listing_id === realAdSpaceId : l.advertiser_franchise_id === franchise.id
            );
            const expanded = expandedFranchises.has(franchise.id);
            const status = (franchise.marketplace_status || "inactive") as MarketplaceStatus;
            const cfg = statusConfig[status];
            const canActivate = status === "inactive" || status === "rejected";
            const canDeactivate = status === "active" || status === "pending_approval";

            return (
              <Card key={franchise.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => toggleExpand(franchise.id)}>
                      {expanded ? <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />}
                      <div className="min-w-0">
                        <CardTitle className="text-lg">{franchise.franchise_name}</CardTitle>
                        {isAdSpace && (franchise as any)._location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {(franchise as any)._location}
                          </p>
                        )}
                        {fLocs.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {fLocs.length} branch{fLocs.length !== 1 ? "es" : ""} registered
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(() => {
                        const editId = isAdSpace ? realAdSpaceId : franchise.id;
                        return editId ? (
                          <Button size="sm" variant="outline"
                            className="gap-1.5 rounded-[16px] backdrop-blur-sm bg-primary/10 border-primary/30 text-primary hover:bg-primary/15"
                            onClick={(e) => { e.stopPropagation(); navigate(`/franchise-registration/${editId}`); }}>
                            <Edit className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Edit Franchise</span>
                          </Button>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  <div className="mt-3">
                    <Badge variant="outline" className={`gap-1.5 text-xs px-3 py-1 ${cfg.className}`}>
                      {cfg.icon}
                      {cfg.label}
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => openAddLocation(franchise)} className="gap-1">
                      <Plus className="h-3.5 w-3.5" />Add Location
                    </Button>
                    {canActivate && (
                      <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => requestStatusChange(franchise, "activate")}>
                        <Power className="h-3.5 w-3.5" />Activate Marketplace Listing
                      </Button>
                    )}
                    {canDeactivate && (
                      <Button size="sm" variant="outline" className="gap-1 border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => requestStatusChange(franchise, "deactivate")}>
                        <PowerOff className="h-3.5 w-3.5" />Deactivate Marketplace Listing
                      </Button>
                    )}
                    <Button size="sm"
                      className="gap-1 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/15"
                      onClick={() => {
                        const franchiseKey = isAdSpace ? `listing_${realAdSpaceId}` : `adv_${franchise.id}`;
                        navigate("/order-prints", { state: { preselectedFranchiseId: franchiseKey } });
                      }}>
                      <Printer className="h-3.5 w-3.5" />Print Order
                    </Button>
                  </div>
                </CardHeader>

                {expanded && fLocs.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="border-t border-border/50 pt-3 space-y-2">
                      {fLocs.map(loc => (
                        <div key={loc.id} className="flex items-start gap-3 px-3 py-3 rounded-[14px] border border-border/50 bg-card/50 hover:border-primary/20 group">
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{loc.branch_name || "Unnamed Location"}</p>
                              {loc.is_ad_space_listing && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">Ad Space</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {loc.city || loc.full_address}
                            </p>
                            {loc.contact_name && <p className="text-xs text-muted-foreground">Contact: {loc.contact_name}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteLocation(loc.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLocationId ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogDescription>Add a new branch location for this franchise.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Location Name *</Label>
              <Input value={locName} onChange={e => setLocName(e.target.value)} placeholder="e.g., Diliman Branch" />
            </div>
            <div className="space-y-2">
              <Label>Country *</Label>
              <LocationCombobox value={locCountry} onSelect={val => { setLocCountry(val); setLocProvince(""); setLocCity(""); setLocPostal(""); }} options={getCountries()} placeholder="Select country" searchPlaceholder="Search country..." />
            </div>
            {locCountry && (
              <div className="space-y-2">
                <Label>Province / State</Label>
                <LocationCombobox value={locProvince} onSelect={val => { setLocProvince(val); setLocCity(""); setLocPostal(""); }} options={getProvinces(locCountry)} placeholder="Select province" allowCustom />
              </div>
            )}
            {locCountry && locProvince && (
              <div className="space-y-2">
                <Label>City</Label>
                <LocationCombobox value={locCity} onSelect={val => { setLocCity(val); const p = getPostalCode(locCountry, locProvince, val); if (p) setLocPostal(p); }} options={getCities(locCountry, locProvince)} placeholder="Select city" allowCustom />
              </div>
            )}
            {locCountry && locProvince && locCity && (
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input value={locPostal} onChange={e => setLocPostal(e.target.value)} placeholder="Postal code" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Street Address *</Label>
              <Input value={locAddress} onChange={e => setLocAddress(e.target.value)} placeholder="Street address" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={locContact} onChange={e => setLocContact(e.target.value)} placeholder="Contact name" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={locPhone} onChange={e => setLocPhone(e.target.value)} placeholder="Phone" />
              </div>
            </div>
            <Button onClick={saveLocation} disabled={saving} className="w-full">
              {saving ? "Saving..." : editingLocationId ? "Update Location" : "Save Location"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Material Pricing Dialog */}
      <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPricing ? "Edit Material Pricing" : "Add Material Pricing"}</DialogTitle>
            <DialogDescription>Set your custom price for this ad material type.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Material Name *</Label>
              {editingPricing ? (
                <Input value={pricingForm.material_name} disabled />
              ) : (
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={pricingForm.material_name}
                  onChange={e => setPricingForm(f => ({ ...f, material_name: e.target.value }))}
                >
                  <option value="">Select material...</option>
                  {PRINT_PRODUCTS.map(p => (
                    <option key={p.id} value={p.name}>{p.name} (Default: ${p.pricePerUnit})</option>
                  ))}
                  <option value="Custom Material">Custom Material</option>
                </select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Price per Unit (₱) *</Label>
              <Input type="number" min="0" step="0.01" value={pricingForm.base_price} onChange={e => setPricingForm(f => ({ ...f, base_price: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Min Qty</Label>
                <Input type="number" min="1" value={pricingForm.min_quantity} onChange={e => setPricingForm(f => ({ ...f, min_quantity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Rush Fee (₱)</Label>
                <Input type="number" min="0" step="0.01" value={pricingForm.rush_fee} onChange={e => setPricingForm(f => ({ ...f, rush_fee: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Design Fee (₱)</Label>
                <Input type="number" min="0" step="0.01" value={pricingForm.design_fee} onChange={e => setPricingForm(f => ({ ...f, design_fee: e.target.value }))} />
              </div>
            </div>
            <Button onClick={savePricing} disabled={saving} className="w-full">
              {saving ? "Saving..." : editingPricing ? "Update Pricing" : "Save Pricing"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Marketplace Confirmation */}
      <AlertDialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusConfirmAction === "deactivate" ? "Deactivate Listing?" : "Activate Listing?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusConfirmAction === "deactivate"
                ? "This will remove your listing from the marketplace."
                : statusConfirmFranchise?.marketplace_status === "inactive"
                  ? "This will make your listing visible on the marketplace."
                  : "This will submit your listing for approval."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} disabled={saving}
              className={statusConfirmAction === "deactivate" ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"}>
              {saving ? "Processing..." : statusConfirmAction === "deactivate" ? "Confirm Deactivation" : "Confirm Activation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
