import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Printer, Plus, Trash2, ArrowLeft, ArrowRight, Check, Building2 } from "lucide-react";

interface AssociatedListing {
  id: string;
  title: string;
}

interface UnifiedBranch {
  id: string;
  name: string;
  address: string;
  source: "advertiser" | "franchise";
  listing_title?: string;
}

interface MaterialItem {
  type: string;
  quantity: number;
  notes: string;
}

interface AdvertiserPrintOrderFormProps {
  userId: string;
  associatedListings?: AssociatedListing[];
  onComplete?: () => void;
}

const MATERIAL_TYPES = ["Sticker", "Flyer", "Poster", "Table Tent", "Banner", "Other"];

export const AdvertiserPrintOrderForm = ({ userId, associatedListings = [], onComplete }: AdvertiserPrintOrderFormProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedListingId, setSelectedListingId] = useState<string>("all");
  const [allBranches, setAllBranches] = useState<UnifiedBranch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<UnifiedBranch[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([{ type: "Sticker", quantity: 1, notes: "" }]);
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const listingIds = associatedListings.map((l) => l.id);

  useEffect(() => {
    const fetchBranches = async () => {
      const unified: UnifiedBranch[] = [];

      // Advertiser-only branches
      const { data: advBranches } = await supabase
        .from("advertiser_branches")
        .select("id, branch_name, full_address")
        .eq("advertiser_id", userId)
        .order("created_at");
      if (advBranches) {
        advBranches.forEach((b) =>
          unified.push({ id: b.id, name: b.branch_name || "Unnamed Branch", address: b.full_address, source: "advertiser" })
        );
      }

      // Shared franchise branches
      if (listingIds.length > 0) {
        const { data: frBranches } = await supabase
          .from("franchise_branches")
          .select("id, place_name, full_address, franchise_id, ad_spaces(title)")
          .in("franchise_id", listingIds)
          .order("created_at");
        if (frBranches) {
          frBranches.forEach((b: any) => {
            const exists = unified.some((u) => u.address.toLowerCase().trim() === b.full_address.toLowerCase().trim());
            if (!exists) {
              unified.push({
                id: b.id, name: b.place_name, address: b.full_address,
                source: "franchise", listing_title: b.ad_spaces?.title,
              });
            }
          });
        }
      }

      setAllBranches(unified);
      setFilteredBranches(unified);
      setLoading(false);
    };
    fetchBranches();
  }, [userId, listingIds.join(",")]);

  // Filter branches when listing selection changes
  useEffect(() => {
    if (selectedListingId === "all") {
      setFilteredBranches(allBranches);
    } else {
      // Show franchise branches for this listing + all standalone advertiser branches
      const filtered = allBranches.filter((b) => {
        if (b.source === "advertiser") return true;
        return b.listing_title === associatedListings.find((l) => l.id === selectedListingId)?.title;
      });
      setFilteredBranches(filtered);
    }
    setSelectedBranchIds([]);
  }, [selectedListingId, allBranches]);

  const toggleBranch = (id: string) => {
    setSelectedBranchIds((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
  };
  const selectAll = () => {
    setSelectedBranchIds(selectedBranchIds.length === filteredBranches.length ? [] : filteredBranches.map((b) => b.id));
  };
  const addMaterial = () => { setMaterials([...materials, { type: "Sticker", quantity: 1, notes: "" }]); };
  const removeMaterial = (idx: number) => { setMaterials(materials.filter((_, i) => i !== idx)); };
  const updateMaterial = (idx: number, field: keyof MaterialItem, value: any) => {
    const updated = [...materials];
    updated[idx] = { ...updated[idx], [field]: value };
    setMaterials(updated);
  };

  const handleSubmit = async () => {
    if (selectedBranchIds.length === 0) { toast({ title: "Select at least one branch", variant: "destructive" }); return; }
    if (materials.length === 0 || materials.some((m) => !m.type || m.quantity < 1)) { toast({ title: "Add valid materials", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("advertiser_print_orders").insert({
      advertiser_id: userId,
      branch_ids: selectedBranchIds,
      materials: materials as any,
      notes: orderNotes || null,
      status: "pending",
    });
    if (error) {
      toast({ title: "Error submitting order", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Print order submitted!", description: "Your order is now pending review." });
      setStep(1); setSelectedBranchIds([]); setSelectedListingId("all");
      setMaterials([{ type: "Sticker", quantity: 1, notes: "" }]); setOrderNotes("");
      onComplete?.();
    }
    setSubmitting(false);
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  if (allBranches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-8">
          <Printer className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground mb-1">No branches available yet.</p>
          <p className="text-xs text-muted-foreground">Add branch locations or get linked to a listing to create print orders.</p>
        </CardContent>
      </Card>
    );
  }

  const totalSteps = associatedListings.length > 0 ? 4 : 3;
  const adjustedStep = associatedListings.length > 0 ? step : step + 1; // skip listing step if none

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Printer className="h-5 w-5" /> Create Print Order</CardTitle>
        <CardDescription>Send print materials to your branch locations</CardDescription>
        <div className="flex gap-2 pt-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i < (associatedListings.length > 0 ? step : step) ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Step 1: Select Listing (only if listings exist) */}
        {step === 1 && associatedListings.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Select Listing (Optional)
            </Label>
            <p className="text-xs text-muted-foreground">Filter branches by listing or select all.</p>
            <Select value={selectedListingId} onValueChange={setSelectedListingId}>
              <SelectTrigger><SelectValue placeholder="All branches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {associatedListings.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setStep(2)} className="w-full gap-2">
              Next: Select Branches <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Select branches (step 1 if no listings) */}
        {((step === 2 && associatedListings.length > 0) || (step === 1 && associatedListings.length === 0)) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select Branch Locations</Label>
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedBranchIds.length === filteredBranches.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredBranches.map((branch) => (
                <label key={`${branch.source}-${branch.id}`} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Checkbox checked={selectedBranchIds.includes(branch.id)} onCheckedChange={() => toggleBranch(branch.id)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{branch.name}</p>
                      {branch.source === "franchise" && <Badge variant="outline" className="text-xs">{branch.listing_title || "Shared"}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{branch.address}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{selectedBranchIds.length} branch(es) selected</p>
            <div className="flex gap-2">
              {associatedListings.length > 0 && (
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              )}
              <Button
                onClick={() => setStep(associatedListings.length > 0 ? 3 : 2)}
                disabled={selectedBranchIds.length === 0}
                className="flex-1 gap-2"
              >
                Next: Add Materials <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Add materials */}
        {((step === 3 && associatedListings.length > 0) || (step === 2 && associatedListings.length === 0)) && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Print Materials</Label>
            {materials.map((mat, idx) => (
              <div key={idx} className="p-3 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Material #{idx + 1}</span>
                  {materials.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeMaterial(idx)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Type</Label><Select value={mat.type} onValueChange={(v) => updateMaterial(idx, "type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MATERIAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label className="text-xs">Quantity</Label><Input type="number" min={1} value={mat.quantity} onChange={(e) => updateMaterial(idx, "quantity", parseInt(e.target.value) || 1)} /></div>
                </div>
                <div><Label className="text-xs">Notes (optional)</Label><Input placeholder="e.g. 4x6 size, glossy finish" value={mat.notes} onChange={(e) => updateMaterial(idx, "notes", e.target.value)} /></div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addMaterial} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Another Material</Button>
            <div><Label className="text-xs">Order Notes (optional)</Label><Textarea placeholder="Any special instructions..." value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} rows={2} /></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(associatedListings.length > 0 ? 2 : 1)} className="flex-1 gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(associatedListings.length > 0 ? 4 : 3)} className="flex-1 gap-2">Review Order <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {((step === 4 && associatedListings.length > 0) || (step === 3 && associatedListings.length === 0)) && (
          <div className="space-y-4">
            {selectedListingId !== "all" && (
              <div>
                <Label className="text-sm font-medium">Listing</Label>
                <p className="text-sm">{associatedListings.find((l) => l.id === selectedListingId)?.title}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Selected Branches ({selectedBranchIds.length})</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {allBranches.filter((b) => selectedBranchIds.includes(b.id)).map((b) => (
                  <Badge key={`${b.source}-${b.id}`} variant="secondary" className="text-xs">{b.name}</Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Materials</Label>
              <div className="mt-1 space-y-1">
                {materials.map((m, i) => (
                  <div key={i} className="text-sm flex justify-between p-2 bg-muted/50 rounded"><span>{m.type}</span><span className="font-medium">x{m.quantity}</span></div>
                ))}
              </div>
            </div>
            {orderNotes && <div><Label className="text-sm font-medium">Notes</Label><p className="text-sm text-muted-foreground">{orderNotes}</p></div>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(associatedListings.length > 0 ? 3 : 2)} className="flex-1 gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 gap-2"><Check className="h-4 w-4" />{submitting ? "Submitting..." : "Submit Order"}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
