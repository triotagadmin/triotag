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

interface BranchRecord {
  id: string;
  place_name: string;
  full_address: string;
  ad_unit_quantity: number | null;
  branch_operating_hours: string | null;
  notes: string | null;
  listing_title: string;
  listing_id: string;
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
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [targetListing, setTargetListing] = useState<string>("");
  const [form, setForm] = useState({ place_name: "", full_address: "", operating_hours: "", notes: "" });

  const listingIds = associatedListings.map((l) => l.id);

  const fetchBranches = async () => {
    if (listingIds.length === 0) {
      setBranches([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("franchise_branches")
      .select("id, place_name, full_address, ad_unit_quantity, branch_operating_hours, notes, franchise_id, ad_spaces(title)")
      .in("franchise_id", listingIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching branches:", error);
    } else {
      setBranches(
        (data || []).map((b: any) => ({
          id: b.id,
          place_name: b.place_name,
          full_address: b.full_address,
          ad_unit_quantity: b.ad_unit_quantity,
          branch_operating_hours: b.branch_operating_hours,
          notes: b.notes,
          listing_title: b.ad_spaces?.title || "Unknown",
          listing_id: b.franchise_id,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBranches();
    const channel = supabase
      .channel(`adv-branches-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "franchise_branches" }, () => fetchBranches())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, listingIds.join(",")]);

  const resetForm = () => {
    setForm({ place_name: "", full_address: "", operating_hours: "", notes: "" });
    setTargetListing(associatedListings.length === 1 ? associatedListings[0].id : "");
    setEditingBranch(null);
  };

  const openAdd = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (branch: BranchRecord) => {
    setEditingBranch(branch);
    setTargetListing(branch.listing_id);
    setForm({
      place_name: branch.place_name,
      full_address: branch.full_address,
      operating_hours: branch.branch_operating_hours || "",
      notes: branch.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_address.trim()) {
      toast({ title: "Address is required", variant: "destructive" });
      return;
    }
    if (!targetListing) {
      toast({ title: "Please select a listing", variant: "destructive" });
      return;
    }
    const placeName = form.place_name.trim() || form.full_address.trim().split(",")[0];

    setSaving(true);

    if (editingBranch) {
      const { error } = await supabase
        .from("franchise_branches")
        .update({
          place_name: placeName,
          full_address: form.full_address.trim(),
          branch_operating_hours: form.operating_hours.trim() || null,
          notes: form.notes.trim() || null,
        })
        .eq("id", editingBranch.id);
      if (error) toast({ title: "Error updating branch", description: error.message, variant: "destructive" });
      else { toast({ title: "Branch updated" }); setDialogOpen(false); resetForm(); }
    } else {
      // Use dedup-aware upsert
      const { error } = await supabase.rpc("upsert_franchise_branch", {
        _franchise_id: targetListing,
        _place_name: placeName,
        _full_address: form.full_address.trim(),
        _latitude: null,
        _longitude: null,
        _ad_unit_quantity: 0,
        _branch_operating_hours: form.operating_hours.trim() || null,
        _notes: form.notes.trim() || null,
      });
      if (error) toast({ title: "Error adding branch", description: error.message, variant: "destructive" });
      else {
        toast({ title: "Branch added", description: "This branch is now visible on both your and the publisher's dashboard." });
        setDialogOpen(false);
        resetForm();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (branch: BranchRecord) => {
    const { error } = await supabase.from("franchise_branches").delete().eq("id", branch.id);
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
          <CardDescription>
            {associatedListings.length > 0
              ? "Manage branch locations shared with publishers for print distribution"
              : "Branch locations will appear here when a publisher links your account to a listing"}
          </CardDescription>
        </div>
        {associatedListings.length > 0 && (
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1" onClick={openAdd}>
                <Plus className="h-4 w-4" /> Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBranch ? "Edit Branch" : "Add Branch to Listing"}</DialogTitle>
                <DialogDescription>
                  {editingBranch
                    ? "Update branch details. Changes are visible to both you and the publisher."
                    : "Add a new branch location. It will be shared with the publisher and visible on both dashboards."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {!editingBranch && associatedListings.length > 1 && (
                  <div>
                    <Label>Listing *</Label>
                    <Select value={targetListing} onValueChange={setTargetListing}>
                      <SelectTrigger><SelectValue placeholder="Select a listing..." /></SelectTrigger>
                      <SelectContent>
                        {associatedListings.map((l) => (
                          <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {!editingBranch && associatedListings.length === 1 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Adding branch to</p>
                    <p className="text-sm font-medium">{associatedListings[0].title}</p>
                  </div>
                )}
                <div>
                  <Label>Branch Name *</Label>
                  <Input placeholder="e.g. Caelum Café BGC" value={form.place_name} onChange={(e) => setForm({ ...form, place_name: e.target.value })} />
                </div>
                <div>
                  <Label>Address *</Label>
                  <Input placeholder="Full address" value={form.full_address} onChange={(e) => setForm({ ...form, full_address: e.target.value })} />
                </div>
                <div>
                  <Label>Operating Hours (optional)</Label>
                  <Input placeholder="e.g. Mon-Fri 8AM-10PM" value={form.operating_hours} onChange={(e) => setForm({ ...form, operating_hours: e.target.value })} />
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Input placeholder="Any additional details..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? "Saving..." : editingBranch ? "Update Branch" : "Add Branch"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {branches.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No branches yet</p>
            <p className="text-xs text-muted-foreground">
              {associatedListings.length > 0
                ? "Add your first branch location to start sending print materials."
                : "Branch locations will appear here when you're linked to a listing."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {branches.map((branch) => (
              <div key={branch.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{branch.place_name}</p>
                    <Badge variant="outline" className="text-xs">{branch.listing_title}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{branch.full_address}</p>
                  {branch.branch_operating_hours && (
                    <p className="text-xs text-muted-foreground">Hours: {branch.branch_operating_hours}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(branch)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
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
                          Are you sure? This branch will be removed from both your dashboard and the publisher's dashboard.
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
