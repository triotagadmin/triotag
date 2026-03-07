import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Trash2, Search, Building } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Branch {
  id: string;
  place_name: string;
  full_address: string;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string | null;
  ad_unit_quantity: number;
  branch_operating_hours: string | null;
  notes: string | null;
  created_at: string;
}

interface BranchManagerProps {
  franchiseId: string;
  franchiseName: string;
}

export const BranchManager = ({ franchiseId, franchiseName }: BranchManagerProps) => {
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New branch form
  const [placeName, setPlaceName] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [adUnitQuantity, setAdUnitQuantity] = useState(1);
  const [branchHours, setBranchHours] = useState("");
  const [branchNotes, setBranchNotes] = useState("");

  useEffect(() => {
    fetchBranches();
  }, [franchiseId]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from("franchise_branches")
        .select("*")
        .eq("franchise_id", franchiseId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setBranches((data as any[]) || []);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPlaceName("");
    setFullAddress("");
    setLatitude("");
    setLongitude("");
    setAdUnitQuantity(1);
    setBranchHours("");
    setBranchNotes("");
  };

  const handleAddBranch = async () => {
    if (!placeName.trim()) {
      toast({ title: "Error", description: "Branch name is required", variant: "destructive" });
      return;
    }
    if (!fullAddress.trim()) {
      toast({ title: "Error", description: "Address is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const parseCoord = (val: string): number | null => {
        if (!val.trim()) return null;
        const num = parseFloat(val.trim());
        return isNaN(num) ? null : num;
      };

      const { error } = await supabase
        .from("franchise_branches")
        .insert({
          franchise_id: franchiseId,
          place_name: placeName.trim(),
          full_address: fullAddress.trim(),
          latitude: parseCoord(latitude),
          longitude: parseCoord(longitude),
          ad_unit_quantity: adUnitQuantity,
          branch_operating_hours: branchHours.trim() || null,
          notes: branchNotes.trim() || null,
        } as any);

      if (error) throw error;

      toast({ title: "Success", description: "Branch added successfully" });
      resetForm();
      setAddDialogOpen(false);
      fetchBranches();
    } catch (error: any) {
      console.error("Error adding branch:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!confirm("Are you sure you want to remove this branch?")) return;

    try {
      const { error } = await supabase
        .from("franchise_branches")
        .delete()
        .eq("id", branchId);

      if (error) throw error;
      setBranches(branches.filter(b => b.id !== branchId));
      toast({ title: "Deleted", description: "Branch removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Manage Branch Locations
            </CardTitle>
            <CardDescription>
              Add and manage branches for {franchiseName}. {branches.length} branch{branches.length !== 1 ? "es" : ""} registered.
            </CardDescription>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading branches...</p>
        ) : branches.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No branches yet</h3>
            <p className="text-muted-foreground mb-4">Start adding branch locations for this franchise.</p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Add First Branch
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((branch) => (
              <Card key={branch.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{branch.place_name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{branch.full_address}</p>
                      {branch.ad_unit_quantity > 0 && (
                        <p className="text-xs text-primary mt-1">{branch.ad_unit_quantity} ad unit{branch.ad_unit_quantity !== 1 ? "s" : ""} available</p>
                      )}
                      {branch.branch_operating_hours && (
                        <p className="text-xs text-muted-foreground mt-1">Hours: {branch.branch_operating_hours}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteBranch(branch.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Branch Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Branch Location</DialogTitle>
            <DialogDescription>
              Add a new branch for {franchiseName}. Enter the location details manually, or use coordinates from Google Maps.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="branchName">Branch Name *</Label>
              <Input id="branchName" value={placeName} onChange={e => setPlaceName(e.target.value)} placeholder={`e.g., ${franchiseName} – Makati`} />
            </div>
            <div>
              <Label htmlFor="branchAddress">Full Address *</Label>
              <Input id="branchAddress" value={fullAddress} onChange={e => setFullAddress(e.target.value)} placeholder="e.g., 123 Main St, Makati City, Metro Manila" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="branchLat">Latitude</Label>
                <Input id="branchLat" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="e.g., 14.5547" />
              </div>
              <div>
                <Label htmlFor="branchLng">Longitude</Label>
                <Input id="branchLng" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="e.g., 121.0244" />
              </div>
            </div>
            <div>
              <Label htmlFor="branchQty">Ad Unit Quantity Available</Label>
              <Input id="branchQty" type="number" min={0} value={adUnitQuantity} onChange={e => setAdUnitQuantity(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <Label htmlFor="branchHours">Operating Hours (Optional)</Label>
              <Input id="branchHours" value={branchHours} onChange={e => setBranchHours(e.target.value)} placeholder="e.g., Mon-Fri 8AM-10PM" />
            </div>
            <div>
              <Label htmlFor="branchNotes">Notes (Optional)</Label>
              <Textarea id="branchNotes" value={branchNotes} onChange={e => setBranchNotes(e.target.value)} rows={2} placeholder="Any additional details about this branch..." />
            </div>
            <Button className="w-full" onClick={handleAddBranch} disabled={saving}>
              {saving ? "Adding..." : "Add Branch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
