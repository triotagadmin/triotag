import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapPin, Plus, Trash2, Edit, Store, Printer, ChevronDown, ChevronUp, Info, Power, PowerOff, Clock, XCircle, Check, ChevronsUpDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getCountries, getProvinces, getCities, getPostalCode } from "@/lib/locationData";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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
  contact_email: string | null;
  contact_phone: string | null;
  is_ad_space_listing: boolean;
  created_at: string;
}

interface MyFranchiseSectionProps {
  userId: string;
  onSelectionChange?: (selectedLocationIds: string[]) => void;
}

const statusConfig: Record<MarketplaceStatus, { label: string; className: string; icon: React.ReactNode }> = {
  active: {
    label: "Approved on Ad Space Marketplace",
    className: "bg-primary/20 text-primary border-primary/30",
    icon: <Power className="h-3 w-3" />,
  },
  inactive: {
    label: "Marketplace Listing Inactive",
    className: "bg-muted text-muted-foreground border-border",
    icon: <PowerOff className="h-3 w-3" />,
  },
  pending_approval: {
    label: "Pending Approval",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/20 text-destructive border-destructive/30",
    icon: <XCircle className="h-3 w-3" />,
  },
};

export const MyFranchiseSection = ({ userId, onSelectionChange }: MyFranchiseSectionProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [locations, setLocations] = useState<FranchiseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedFranchises, setExpandedFranchises] = useState<Set<string>>(new Set());

  // Franchise dialog
  const [franchiseDialogOpen, setFranchiseDialogOpen] = useState(false);
  const [editingFranchiseId, setEditingFranchiseId] = useState<string | null>(null);
  const [franchiseName, setFranchiseName] = useState("");

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

  // Marketplace status confirmation
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [statusConfirmFranchise, setStatusConfirmFranchise] = useState<Franchise | null>(null);
  const [statusConfirmAction, setStatusConfirmAction] = useState<"activate" | "deactivate">("activate");

  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    const [fRes, lRes, adRes] = await Promise.all([
      supabase
        .from("advertiser_franchises")
        .select("*")
        .eq("advertiser_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("advertiser_branches")
        .select("*")
        .eq("advertiser_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("ad_spaces")
        .select("id, title, location, approval_status, created_at, leased_advertiser_ids")
        .eq("advertiser_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    // Merge ad_spaces as virtual franchise entries
    const realFranchises: Franchise[] = (fRes.data || []) as unknown as Franchise[];
    const adSpaceFranchises: Franchise[] = ((adRes.data || []) as any[]).map((ad: any) => ({
      id: `adspace-${ad.id}`,
      _adSpaceId: ad.id,
      advertiser_id: userId,
      franchise_name: ad.title,
      marketplace_status: ad.approval_status === "approved" ? "active" as MarketplaceStatus : "inactive" as MarketplaceStatus,
      created_at: ad.created_at,
      updated_at: ad.created_at,
      _isAdSpace: true,
      _location: ad.location,
    }));

    setFranchises([...realFranchises, ...adSpaceFranchises] as any);
    if (lRes.data) setLocations(lRes.data as unknown as FranchiseLocation[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAll();
    const ch1 = supabase
      .channel(`franchises-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "advertiser_franchises", filter: `advertiser_id=eq.${userId}` }, () => fetchAll())
      .subscribe();
    const ch2 = supabase
      .channel(`franchise-locs-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "advertiser_branches", filter: `advertiser_id=eq.${userId}` }, () => fetchAll())
      .subscribe();
    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [userId, fetchAll]);

  useEffect(() => {
    onSelectionChange?.(Array.from(selectedIds));
  }, [selectedIds, onSelectionChange]);

  useEffect(() => {
    if (franchises.length > 0) {
      setExpandedFranchises(new Set(franchises.map(f => f.id)));
    }
  }, [franchises]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllForFranchise = (franchise: Franchise) => {
    const isAdSpace = !!(franchise as any)._isAdSpace;
    const realAdSpaceId = isAdSpace ? (franchise as any)._adSpaceId : null;
    const locs = locations.filter(l => 
      isAdSpace ? l.listing_id === realAdSpaceId : l.advertiser_franchise_id === franchise.id
    );
    const allSelected = locs.every(l => selectedIds.has(l.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      locs.forEach(l => allSelected ? next.delete(l.id) : next.add(l.id));
      return next;
    });
  };

  const toggleAdSpaceListing = async (locId: string, currentValue: boolean) => {
    const { error } = await supabase.from("advertiser_branches").update({ is_ad_space_listing: !currentValue }).eq("id", locId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchAll();
  };

  const toggleExpand = (id: string) => {
    setExpandedFranchises(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Franchise CRUD
  const openAddFranchise = () => {
    setEditingFranchiseId(null);
    setFranchiseName("");
    setFranchiseDialogOpen(true);
  };
  const openEditFranchise = (f: Franchise) => {
    setEditingFranchiseId(f.id);
    setFranchiseName(f.franchise_name);
    setFranchiseDialogOpen(true);
  };
  const saveFranchise = async () => {
    if (!franchiseName.trim()) {
      toast({ title: "Franchise name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editingFranchiseId) {
      const { error } = await supabase.from("advertiser_franchises").update({ franchise_name: franchiseName.trim() }).eq("id", editingFranchiseId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Franchise updated" }); setFranchiseDialogOpen(false); }
    } else {
      const { error } = await supabase.from("advertiser_franchises").insert({ advertiser_id: userId, franchise_name: franchiseName.trim() });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Franchise created" }); setFranchiseDialogOpen(false); }
    }
    setSaving(false);
  };
  const deleteFranchise = async (id: string) => {
    const { error } = await supabase.from("advertiser_franchises").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Franchise removed" });
  };

  // Location CRUD
  const buildFullAddress = () => [locAddress, locCity, locProvince, locPostal, locCountry].filter(Boolean).join(", ");

  const openAddLocation = (franchise: Franchise) => {
    setEditingLocationId(null);
    // For ad-space franchises, store the real ad space ID; for regular franchises, store franchise ID
    setTargetFranchiseId(franchise.id);
    setLocName(""); setLocAddress(""); setLocCity(""); setLocProvince(""); setLocPostal(""); setLocCountry(""); setLocContact(""); setLocPhone("");
    setLocationDialogOpen(true);
  };
  const openEditLocation = (loc: FranchiseLocation) => {
    setEditingLocationId(loc.id);
    setTargetFranchiseId(loc.advertiser_franchise_id);
    setLocName(loc.branch_name || "");
    setLocAddress(loc.full_address);
    setLocCity(""); setLocProvince(""); setLocPostal(""); setLocCountry("");
    setLocContact(loc.contact_name || "");
    setLocPhone(loc.contact_phone || "");
    setLocationDialogOpen(true);
  };
  const saveLocation = async () => {
    if (!locName.trim() || !locAddress.trim()) {
      toast({ title: "Name and address are required", variant: "destructive" });
      return;
    }
    if (!targetFranchiseId) {
      toast({ title: "Unable to save location. Please refresh the page and try again.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const fullAddr = buildFullAddress();
    const cityValue = locCity.trim() || null;

    if (editingLocationId) {
      const { error } = await supabase.from("advertiser_branches").update({
        branch_name: locName.trim(),
        full_address: fullAddr,
        city: cityValue,
        contact_name: locContact.trim() || null,
        contact_phone: locPhone.trim() || null,
      }).eq("id", editingLocationId);
      if (error) toast({ title: "Location could not be saved. Please check the form and try again.", variant: "destructive" });
      else { toast({ title: "Location updated" }); setLocationDialogOpen(false); }
    } else {
      // Determine if this is an ad-space franchise or a regular franchise
      const isAdSpace = targetFranchiseId.startsWith("adspace-");
      const realAdSpaceId = isAdSpace ? targetFranchiseId.replace("adspace-", "") : null;
      const realFranchiseId = isAdSpace ? null : targetFranchiseId;

      const { error } = await supabase.from("advertiser_branches").insert({
        advertiser_id: userId,
        advertiser_franchise_id: realFranchiseId,
        listing_id: realAdSpaceId,
        branch_name: locName.trim(),
        full_address: fullAddr,
        city: cityValue,
        contact_name: locContact.trim() || null,
        contact_phone: locPhone.trim() || null,
      });
      if (error) toast({ title: "Location could not be saved. Please check the form and try again.", variant: "destructive" });
      else { toast({ title: "Location added" }); setLocationDialogOpen(false); }
    }
    setSaving(false);
  };
  const deleteLocation = async (id: string) => {
    const { error } = await supabase.from("advertiser_branches").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Location removed" });
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  // Marketplace status toggle
  const requestStatusChange = (franchise: Franchise, action: "activate" | "deactivate") => {
    setStatusConfirmFranchise(franchise);
    setStatusConfirmAction(action);
    setStatusConfirmOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!statusConfirmFranchise) return;
    setSaving(true);

    let newStatus: MarketplaceStatus;
    if (statusConfirmAction === "deactivate") {
      newStatus = "inactive";
    } else {
      // If previously approved (active), go straight to active. Otherwise pending.
      const wasApproved = statusConfirmFranchise.marketplace_status === "active" || statusConfirmFranchise.marketplace_status === "inactive";
      // If it was ever active before (now inactive), re-activate directly
      // If it was rejected or never approved, submit for approval
      if (statusConfirmFranchise.marketplace_status === "inactive") {
        newStatus = "active";
      } else {
        newStatus = "pending_approval";
      }
    }

    if ((statusConfirmFranchise as any)._isAdSpace) {
      // For ad spaces, we don't change marketplace_status in advertiser_franchises
      // Ad spaces are controlled by their approval_status - skip for now
      toast({ title: "Ad Space listings are managed by your publishing agent", variant: "destructive" });
      setSaving(false);
      setStatusConfirmOpen(false);
      setStatusConfirmFranchise(null);
      return;
    }

    const { error } = await supabase
      .from("advertiser_franchises")
      .update({ marketplace_status: newStatus })
      .eq("id", statusConfirmFranchise.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const msg = newStatus === "active"
        ? "Listing activated on marketplace"
        : newStatus === "inactive"
          ? "Listing deactivated from marketplace"
          : "Listing submitted for approval";
      toast({ title: msg });
    }

    setSaving(false);
    setStatusConfirmOpen(false);
    setStatusConfirmFranchise(null);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading franchises...</p>;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6" />
            My Franchises
          </h3>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" aria-label="About My Franchises"
                className="inline-flex items-center justify-center rounded-full h-5 w-5 bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                <Info className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm" side="bottom" align="start">
              <p className="font-medium mb-1">About My Franchises</p>
              <p className="text-muted-foreground">Organize your locations by franchise. Select locations with checkboxes to use for print orders or ad campaigns. You can also activate or deactivate marketplace listings.</p>
            </PopoverContent>
          </Popover>
        </div>
        <Button size="sm" onClick={openAddFranchise} className="gap-1">
          <Plus className="h-4 w-4" />
          New Franchise
        </Button>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 rounded-[20px] glass border border-primary/30 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.size} location{selectedIds.size !== 1 ? "s" : ""} selected</span>
          <Button size="sm" className="gap-1" onClick={() => navigate("/order-prints", { state: { selectedBranchIds: Array.from(selectedIds) } })}>
            <Printer className="h-4 w-4" />
            Start Print Order
          </Button>
        </div>
      )}

      {franchises.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-1">No franchises yet</p>
            <p className="text-xs text-muted-foreground mb-4">Create a franchise to start adding locations.</p>
            <Button size="sm" onClick={openAddFranchise}><Plus className="h-4 w-4 mr-1" />Create Franchise</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {franchises.map(franchise => {
            const isAdSpace = !!(franchise as any)._isAdSpace;
            const realAdSpaceId = isAdSpace ? (franchise as any)._adSpaceId : null;
            const fLocs = locations.filter(l => 
              isAdSpace 
                ? l.listing_id === realAdSpaceId 
                : l.advertiser_franchise_id === franchise.id
            );
            const expanded = expandedFranchises.has(franchise.id);
            const allSelected = fLocs.length > 0 && fLocs.every(l => selectedIds.has(l.id));
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
                        {(franchise as any)._isAdSpace && (franchise as any)._location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {(franchise as any)._location}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {fLocs.length} branch{fLocs.length !== 1 ? "es" : ""} registered
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!(franchise as any)._isAdSpace && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openEditFranchise(franchise)} className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteFranchise(franchise.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {(franchise as any)._isAdSpace && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Store className="h-3 w-3" /> Ad Space
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Marketplace Status Badge */}
                  <div className="mt-3">
                    <Badge variant="outline" className={`gap-1.5 text-xs px-3 py-1 ${cfg.className}`}>
                      {cfg.icon}
                      {cfg.label}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => openAddLocation(franchise)} className="gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Add Location
                    </Button>
                    {fLocs.length > 0 && selectedIds.size > 0 && fLocs.some(l => selectedIds.has(l.id)) && (
                      <Button size="sm" className="gap-1" onClick={() => navigate("/order-prints", { state: { selectedBranchIds: fLocs.filter(l => selectedIds.has(l.id)).map(l => l.id) } })}>
                        <Printer className="h-3.5 w-3.5" />
                        Print Order
                      </Button>
                    )}
                    {canActivate && (
                      <Button
                        size="sm"
                        className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => requestStatusChange(franchise, "activate")}
                      >
                        <Power className="h-3.5 w-3.5" />
                        Activate Marketplace Listing
                      </Button>
                    )}
                    {canDeactivate && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                        onClick={() => requestStatusChange(franchise, "deactivate")}
                      >
                        <PowerOff className="h-3.5 w-3.5" />
                        Deactivate Marketplace Listing
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {expanded && (
                  <CardContent className="pt-0">
                    {fLocs.length === 0 ? (
                      <div className="text-center py-6 border-t border-border/50">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No locations yet. Add your first location.</p>
                      </div>
                    ) : (
                      <div className="border-t border-border/50 pt-3 space-y-2">
                        {/* Select All */}
                        <div className="flex items-center gap-3 px-3 py-2 rounded-[14px] bg-muted/30">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => toggleSelectAllForFranchise(franchise)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-sm font-medium text-muted-foreground">Select All Locations</span>
                        </div>

                        {fLocs.map(loc => {
                          const isSelected = selectedIds.has(loc.id);
                          return (
                            <div
                              key={loc.id}
                              className={`flex items-start gap-3 px-3 py-3 rounded-[14px] transition-all duration-200 hover:translate-y-[-1px] hover:shadow-md cursor-pointer group
                                ${isSelected
                                  ? "border border-primary/40 bg-primary/5 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                                  : "border border-border/50 bg-card/50 hover:border-primary/20 hover:shadow-[0_0_8px_hsl(var(--primary)/0.1)]"
                                }`}
                              onClick={() => toggleSelect(loc.id)}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelect(loc.id)}
                                className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm">{loc.branch_name || "Unnamed Location"}</p>
                                  {loc.is_ad_space_listing && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                                      Ad Space
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  {loc.city || loc.full_address}
                                </p>
                                {loc.contact_name && (
                                  <p className="text-xs text-muted-foreground">Contact: {loc.contact_name}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-7 text-[10px] px-2 ${loc.is_ad_space_listing ? 'text-primary' : 'text-muted-foreground'}`}
                                  onClick={e => { e.stopPropagation(); toggleAdSpaceListing(loc.id, loc.is_ad_space_listing); }}
                                >
                                  {loc.is_ad_space_listing ? "Listed" : "List as Ad Space"}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEditLocation(loc); }}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); deleteLocation(loc.id); }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Franchise Dialog */}
      <Dialog open={franchiseDialogOpen} onOpenChange={setFranchiseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFranchiseId ? "Edit Franchise" : "Create Franchise"}</DialogTitle>
            <DialogDescription>{editingFranchiseId ? "Update franchise name." : "Enter a name for your new franchise."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Franchise Name *</Label>
              <Input value={franchiseName} onChange={e => setFranchiseName(e.target.value)} placeholder="e.g., Caelum Café" />
            </div>
            <Button onClick={saveFranchise} disabled={saving} className="w-full">
              {saving ? "Saving..." : editingFranchiseId ? "Update Franchise" : "Create Franchise"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLocationId ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogDescription>{editingLocationId ? "Update this location." : "Add a new branch location."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Location Name *</Label>
              <Input value={locName} onChange={e => setLocName(e.target.value)} placeholder="e.g., Diliman Branch" />
            </div>

            {/* Step 1: Country */}
            <div className="space-y-2">
              <Label>Country *</Label>
              <LocationCombobox
                value={locCountry}
                onSelect={(val) => {
                  setLocCountry(val);
                  setLocProvince("");
                  setLocCity("");
                  setLocPostal("");
                }}
                options={getCountries()}
                placeholder="Select country"
                searchPlaceholder="Search country..."
              />
            </div>

            {/* Step 2: Province / State */}
            {locCountry && (
              <div className="space-y-2">
                <Label>Province / State</Label>
                <LocationCombobox
                  value={locProvince}
                  onSelect={(val) => {
                    setLocProvince(val);
                    setLocCity("");
                    setLocPostal("");
                  }}
                  options={getProvinces(locCountry)}
                  placeholder="Select province / state"
                  searchPlaceholder="Search province..."
                  allowCustom
                />
              </div>
            )}

            {/* Step 3: City */}
            {locCountry && locProvince && (
              <div className="space-y-2">
                <Label>City</Label>
                <LocationCombobox
                  value={locCity}
                  onSelect={(val) => {
                    setLocCity(val);
                    const postal = getPostalCode(locCountry, locProvince, val);
                    if (postal) setLocPostal(postal);
                  }}
                  options={getCities(locCountry, locProvince)}
                  placeholder="Select city"
                  searchPlaceholder="Search city..."
                  allowCustom
                />
              </div>
            )}

            {/* Step 4: Postal Code (auto-detected, editable) */}
            {locCountry && locProvince && locCity && (
              <div className="space-y-2">
                <Label>Postal Code {locPostal ? "(auto-detected)" : ""}</Label>
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
                <Label>Phone Number</Label>
                <Input value={locPhone} onChange={e => setLocPhone(e.target.value)} placeholder="Phone" />
              </div>
            </div>
            <Button onClick={saveLocation} disabled={saving} className="w-full">
              {saving ? "Saving..." : editingLocationId ? "Update Location" : "Save Location"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Marketplace Status Confirmation */}
      <AlertDialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusConfirmAction === "deactivate" ? "Deactivate Listing?" : "Activate Listing?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusConfirmAction === "deactivate"
                ? "This will remove your franchise listing from the Ad Space Marketplace. Advertisers will no longer be able to discover or book this listing."
                : statusConfirmFranchise?.marketplace_status === "inactive"
                  ? "This will make your franchise listing visible on the Ad Space Marketplace."
                  : "This will submit your franchise listing for review. Once approved, it will appear on the Ad Space Marketplace."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={saving}
              className={statusConfirmAction === "deactivate"
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }
            >
              {saving
                ? "Processing..."
                : statusConfirmAction === "deactivate"
                  ? "Confirm Deactivation"
                  : "Confirm Activation"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
