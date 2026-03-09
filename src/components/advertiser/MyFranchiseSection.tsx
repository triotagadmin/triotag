import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { MapPin, Plus, Trash2, Edit, Store, EyeOff, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PrivateLocation {
  id: string;
  advertiser_id: string;
  branch_name: string | null;
  full_address: string;
  contact_name: string | null;
  status: string;
  created_at: string;
}

interface MyFranchiseSectionProps {
  userId: string;
}

export const MyFranchiseSection = ({ userId }: MyFranchiseSectionProps) => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<PrivateLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from("advertiser_branches")
      .select("*")
      .eq("advertiser_id", userId)
      .is("listing_id", null)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching private locations:", error);
    else setLocations((data as PrivateLocation[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLocations();
    const channel = supabase
      .channel(`franchise-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "advertiser_branches", filter: `advertiser_id=eq.${userId}` }, () => fetchLocations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const resetForm = () => {
    setLocationName("");
    setAddress("");
    setNotes("");
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (loc: PrivateLocation) => {
    setEditingId(loc.id);
    setLocationName(loc.branch_name || "");
    setAddress(loc.full_address);
    setNotes(loc.contact_name || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!locationName.trim() || !address.trim()) {
      toast({ title: "Name and address are required", variant: "destructive" });
      return;
    }

    // Duplicate check (exclude current editing item)
    const duplicate = locations.find(
      (l) =>
        l.id !== editingId &&
        (l.branch_name || "").toLowerCase().trim() === locationName.toLowerCase().trim() &&
        l.full_address.toLowerCase().trim() === address.toLowerCase().trim()
    );
    if (duplicate) {
      toast({ title: "Duplicate location", description: "A location with this name and address already exists.", variant: "destructive" });
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from("advertiser_branches")
        .update({
          branch_name: locationName.trim(),
          full_address: address.trim(),
          contact_name: notes.trim() || null,
        })
        .eq("id", editingId);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Location updated" });
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from("advertiser_branches").insert({
        advertiser_id: userId,
        listing_id: null,
        branch_name: locationName.trim(),
        full_address: address.trim(),
        contact_name: notes.trim() || null,
        status: "private",
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Location added" });
        setDialogOpen(false);
        resetForm();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("advertiser_branches").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Location removed" });
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading locations...</p>;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="h-5 w-5" />
                My Franchise
              </CardTitle>
              <CardDescription>
                Private locations not listed in the ad space marketplace
              </CardDescription>
            </div>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-8">
              <Store className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-1">No private locations yet</p>
              <p className="text-xs text-muted-foreground">
                Add your franchise locations here. They remain private until submitted for marketplace approval.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map((loc) => (
                <div key={loc.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{loc.branch_name || "Unnamed Location"}</p>
                        <Badge variant="secondary" className="text-xs gap-1">
                          <EyeOff className="h-3 w-3" />
                          Private – Not Listed in Marketplace
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {loc.full_address}
                      </p>
                      {loc.contact_name && (
                        <p className="text-xs text-muted-foreground">Notes: {loc.contact_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(loc)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(loc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Location" : "Add Private Location"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update this private franchise location." : "Add a private franchise location. It won't appear in the marketplace."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Location Name *</Label>
              <Input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g., Downtown Branch, Mall Kiosk" />
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., floor, unit, landmark" rows={2} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : editingId ? "Update Location" : "Save Location"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
