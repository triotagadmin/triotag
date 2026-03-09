import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Listing {
  id: string;
  title: string;
}

interface Branch {
  id: string;
  listing_id: string | null;
  advertiser_id: string;
  branch_name: string | null;
  full_address: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
}

interface AdvertiserBranchLocationsProps {
  userId: string;
  listings: Listing[];
}

export const AdvertiserBranchLocations = ({ userId, listings }: AdvertiserBranchLocationsProps) => {
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedListing, setSelectedListing] = useState("");
  const [branchName, setBranchName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const fetchBranches = async () => {
    const { data, error } = await supabase
      .from("advertiser_branches")
      .select("*")
      .eq("advertiser_id", userId)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching branches:", error);
    else setBranches((data as Branch[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBranches();
    const channel = supabase
      .channel(`adv-branches-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "advertiser_branches", filter: `advertiser_id=eq.${userId}` }, () => fetchBranches())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const handleSave = async () => {
    if (!address.trim()) {
      toast({ title: "Address required", variant: "destructive" });
      return;
    }

    // Duplicate check
    const duplicate = branches.find(
      (b) =>
        b.full_address.toLowerCase().trim() === address.toLowerCase().trim() &&
        (b.branch_name || "").toLowerCase().trim() === branchName.toLowerCase().trim()
    );
    if (duplicate) {
      toast({ title: "Duplicate branch", description: "A branch with this name and address already exists.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("advertiser_branches").insert({
      advertiser_id: userId,
      listing_id: selectedListing || null,
      branch_name: branchName.trim() || null,
      full_address: address.trim(),
      contact_name: notes.trim() || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Branch added" });
      setDialogOpen(false);
      setBranchName("");
      setAddress("");
      setNotes("");
      setSelectedListing("");
    }
    setSaving(false);
  };

  const handleDelete = async (branchId: string) => {
    const { error } = await supabase.from("advertiser_branches").delete().eq("id", branchId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Branch removed" });
  };

  const getListingTitle = (listingId: string | null) => {
    if (!listingId) return null;
    return listings.find((l) => l.id === listingId)?.title || null;
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading branches...</p>;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                My Branch Locations
              </CardTitle>
              <CardDescription>
                Manage branch locations for campaigns and print orders
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Branch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-1">No branch locations yet</p>
              <p className="text-xs text-muted-foreground">
                Add your branch locations to use for campaigns and print orders.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {branches.map((branch) => {
                const listingTitle = getListingTitle(branch.listing_id);
                return (
                  <div key={branch.id} className="p-3 border rounded-lg flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-medium text-sm">{branch.branch_name || "Unnamed Branch"}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {branch.full_address}
                      </p>
                      {listingTitle && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Building2 className="h-3 w-3" />
                          {listingTitle}
                        </Badge>
                      )}
                      {branch.contact_name && (
                        <p className="text-xs text-muted-foreground">Notes: {branch.contact_name}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive" onClick={() => handleDelete(branch.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Branch Location</DialogTitle>
            <DialogDescription>Add a branch location for campaigns and print materials.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {listings.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Listing (optional)</Label>
                <Select value={selectedListing} onValueChange={setSelectedListing}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a listing..." />
                  </SelectTrigger>
                  <SelectContent>
                    {listings.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Branch Name / Description</Label>
              <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="e.g., Main Office, Unit 2B" />
            </div>
            <div className="space-y-2">
              <Label>Address / Location *</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., floor, unit, landmark" rows={2} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Branch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
