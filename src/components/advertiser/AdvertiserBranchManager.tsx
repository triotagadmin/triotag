import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UnifiedBranch {
  id: string;
  name: string;
  address: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  source: "advertiser" | "franchise";
  listing_title?: string;
  listing_id?: string;
}

interface AssociatedListing {
  id: string;
  title: string;
}

interface AdvertiserBranchManagerProps {
  userId: string;
  associatedListings?: AssociatedListing[];
}

export const AdvertiserBranchManager = ({ userId, associatedListings = [] }: AdvertiserBranchManagerProps) => {
  const { toast } = useToast();
  const [branches, setBranches] = useState<UnifiedBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<UnifiedBranch | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state - includes target listing for new branches
  const [targetListing, setTargetListing] = useState<string>("standalone");
  const [form, setForm] = useState({
    branch_name: "", full_address: "", contact_name: "", contact_email: "", contact_phone: "",
  });

  const listingIds = associatedListings.map((l) => l.id);

  const fetchBranches = async () => {
    const unified: UnifiedBranch[] = [];

    // 1. Fetch advertiser-only branches
    const { data: advBranches } = await supabase
      .from("advertiser_branches")
      .select("*")
      .eq("advertiser_id", userId)
      .order("created_at", { ascending: false });

    if (advBranches) {
      advBranches.forEach((b) =>
        unified.push({
          id: b.id, name: b.branch_name || "Unnamed Branch", address: b.full_address,
          contact_name: b.contact_name, contact_email: b.contact_email, contact_phone: b.contact_phone,
          source: "advertiser",
        })
      );
    }

    // 2. Fetch shared franchise branches from associated listings
    if (listingIds.length > 0) {
      const { data: frBranches } = await supabase
        .from("franchise_branches")
        .select("*, ad_spaces(title)")
        .in("franchise_id", listingIds)
        .order("created_at", { ascending: true });

      if (frBranches) {
        frBranches.forEach((b: any) => {
          const exists = unified.some(
            (u) => u.address.toLowerCase().trim() === b.full_address.toLowerCase().trim()
          );
          if (!exists) {
            unified.push({
              id: b.id, name: b.place_name, address: b.full_address,
              source: "franchise", listing_title: b.ad_spaces?.title, listing_id: b.franchise_id,
            });
          }
        });
      }
    }

    setBranches(unified);
    setLoading(false);
  };

  useEffect(() => {
    fetchBranches();
    const channel = supabase
      .channel(`adv-branches-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "advertiser_branches", filter: `advertiser_id=eq.${userId}` }, () => fetchBranches())
      .on("postgres_changes", { event: "*", schema: "public", table: "franchise_branches" }, () => fetchBranches())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, listingIds.join(",")]);

  const resetForm = () => {
    setForm({ branch_name: "", full_address: "", contact_name: "", contact_email: "", contact_phone: "" });
    setTargetListing("standalone");
    setEditingBranch(null);
  };

  const openAdd = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (branch: UnifiedBranch) => {
    if (branch.source === "franchise") {
      toast({ title: "Edit via listing", description: "Franchise branches can be edited from the listing's branch page." });
      return;
    }
    setEditingBranch(branch);
    setForm({
      branch_name: branch.name === "Unnamed Branch" ? "" : branch.name,
      full_address: branch.address,
      contact_name: branch.contact_name || "",
      contact_email: branch.contact_email || "",
      contact_phone: branch.contact_phone || "",
    });
    setTargetListing("standalone");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_address.trim()) {
      toast({ title: "Address is required", variant: "destructive" });
      return;
    }

    // Cross-check for duplicates across both tables
    const { data: dupes } = await supabase.rpc("check_cross_branch_duplicate", {
      _user_id: userId,
      _full_address: form.full_address.trim(),
    });
    if (dupes && dupes.length > 0 && !editingBranch) {
      const dup = dupes[0] as any;
      const desc = dup.exists_in === "franchise"
        ? `This address already exists as a branch under "${dup.listing_title || "a listing"}".`
        : "You already have a branch at this address.";
      toast({ title: "Branch already exists", description: desc, variant: "destructive" });
      return;
    }

    setSaving(true);

    if (editingBranch) {
      // Only advertiser branches can be edited inline
      const { error } = await supabase.from("advertiser_branches").update({
        branch_name: form.branch_name || null, full_address: form.full_address,
        contact_name: form.contact_name || null, contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
      }).eq("id", editingBranch.id);
      if (error) toast({ title: "Error updating branch", description: error.message, variant: "destructive" });
      else { toast({ title: "Branch updated" }); setDialogOpen(false); resetForm(); }
    } else if (targetListing !== "standalone") {
      // Add to franchise_branches (shared with publisher)
      const { error } = await supabase.rpc("upsert_franchise_branch", {
        _franchise_id: targetListing,
        _place_name: form.branch_name.trim() || form.full_address.trim().split(",")[0],
        _full_address: form.full_address.trim(),
        _latitude: null, _longitude: null,
        _ad_unit_quantity: 0,
        _branch_operating_hours: null,
        _notes: null,
      });
      if (error) toast({ title: "Error adding branch", description: error.message, variant: "destructive" });
      else { toast({ title: "Branch added to listing", description: "This branch is now visible to both you and the publisher." }); setDialogOpen(false); resetForm(); }
    } else {
      // Add to advertiser_branches (standalone)
      const { error } = await supabase.rpc("upsert_advertiser_branch", {
        _advertiser_id: userId, _full_address: form.full_address.trim(),
        _branch_name: form.branch_name || null, _contact_name: form.contact_name || null,
        _contact_email: form.contact_email || null, _contact_phone: form.contact_phone || null,
      });
      if (error) toast({ title: "Error adding branch", description: error.message, variant: "destructive" });
      else { toast({ title: "Branch added" }); setDialogOpen(false); resetForm(); }
    }
    setSaving(false);
  };

  const handleDelete = async (branch: UnifiedBranch) => {
    const table = branch.source === "franchise" ? "franchise_branches" : "advertiser_branches";
    const { error } = await supabase.from(table).delete().eq("id", branch.id);
    if (error) toast({ title: "Error removing branch", description: error.message, variant: "destructive" });
    else toast({ title: "Branch removed" });
  };

  if (loading) return <p className="text-muted-foreground text-sm">Loading branches...</p>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Branch Locations
          </CardTitle>
          <CardDescription>Manage your branch locations for print distribution</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBranch ? "Edit Branch" : "Add Branch"}</DialogTitle>
              <DialogDescription>
                {editingBranch ? "Update branch details." : "Add a new branch location. Choose a listing to share it with the publisher, or add it standalone."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Listing selector - only for new branches */}
              {!editingBranch && associatedListings.length > 0 && (
                <div>
                  <Label>Link to Listing</Label>
                  <Select value={targetListing} onValueChange={setTargetListing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a listing..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standalone">Standalone (my branch only)</SelectItem>
                      {associatedListings.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {targetListing !== "standalone"
                      ? "This branch will be shared with the publisher and visible on both dashboards."
                      : "This branch will only be visible on your dashboard."}
                  </p>
                </div>
              )}
              <div>
                <Label>Branch Name {targetListing !== "standalone" ? "*" : "(optional)"}</Label>
                <Input placeholder="e.g. Downtown Branch" value={form.branch_name} onChange={(e) => setForm({ ...form, branch_name: e.target.value })} />
              </div>
              <div>
                <Label>Address *</Label>
                <Input placeholder="Full address" value={form.full_address} onChange={(e) => setForm({ ...form, full_address: e.target.value })} />
              </div>
              {/* Contact fields only for standalone branches */}
              {targetListing === "standalone" && (
                <>
                  <div>
                    <Label>Contact Name (optional)</Label>
                    <Input placeholder="Branch contact person" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Email (optional)</Label>
                      <Input type="email" placeholder="branch@email.com" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
                    </div>
                    <div>
                      <Label>Phone (optional)</Label>
                      <Input placeholder="+1234567890" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
                    </div>
                  </div>
                </>
              )}
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Saving..." : editingBranch ? "Update Branch" : "Add Branch"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {branches.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No branches added yet</p>
            <p className="text-xs text-muted-foreground">Add branch locations or they'll appear here when a publisher links your account to a listing.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {branches.map((branch) => (
              <div key={`${branch.source}-${branch.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{branch.name}</p>
                    {branch.source === "franchise" && (
                      <Badge variant="outline" className="text-xs">{branch.listing_title || "Shared"}</Badge>
                    )}
                    {branch.source === "advertiser" && (
                      <Badge variant="secondary" className="text-xs">Standalone</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{branch.address}</p>
                  {branch.source === "advertiser" && (branch.contact_name || branch.contact_email || branch.contact_phone) && (
                    <p className="text-xs text-muted-foreground">
                      {[branch.contact_name, branch.contact_email, branch.contact_phone].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {branch.source === "advertiser" && (
                    <Button variant="outline" size="sm" onClick={() => openEdit(branch)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Branch</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove this branch?
                          {branch.source === "franchise" && " This will also remove it from the publisher's dashboard."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(branch)}>Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
