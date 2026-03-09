import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Branch {
  id: string;
  branch_name: string | null;
  full_address: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
}

interface AdvertiserBranchManagerProps {
  userId: string;
}

export const AdvertiserBranchManager = ({ userId }: AdvertiserBranchManagerProps) => {
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState({
    branch_name: "",
    full_address: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchBranches = async () => {
    const { data, error } = await supabase
      .from("advertiser_branches")
      .select("*")
      .eq("advertiser_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching branches:", error);
    } else {
      setBranches(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBranches();

    const channel = supabase
      .channel(`adv-branches-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "advertiser_branches",
        filter: `advertiser_id=eq.${userId}`,
      }, () => fetchBranches())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const resetForm = () => {
    setForm({ branch_name: "", full_address: "", contact_name: "", contact_email: "", contact_phone: "" });
    setEditingBranch(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setForm({
      branch_name: branch.branch_name || "",
      full_address: branch.full_address,
      contact_name: branch.contact_name || "",
      contact_email: branch.contact_email || "",
      contact_phone: branch.contact_phone || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_address.trim()) {
      toast({ title: "Address is required", variant: "destructive" });
      return;
    }
    setSaving(true);

    if (editingBranch) {
      const { error } = await supabase
        .from("advertiser_branches")
        .update({
          branch_name: form.branch_name || null,
          full_address: form.full_address,
          contact_name: form.contact_name || null,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
        })
        .eq("id", editingBranch.id);
      if (error) {
        toast({ title: "Error updating branch", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Branch updated" });
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("advertiser_branches")
        .insert({
          advertiser_id: userId,
          branch_name: form.branch_name || null,
          full_address: form.full_address,
          contact_name: form.contact_name || null,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
        });
      if (error) {
        toast({ title: "Error adding branch", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Branch added" });
        setDialogOpen(false);
        resetForm();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (branchId: string) => {
    const { error } = await supabase
      .from("advertiser_branches")
      .delete()
      .eq("id", branchId);
    if (error) {
      toast({ title: "Error removing branch", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Branch removed" });
    }
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
          <CardDescription>Manage your franchise branch locations for print distribution</CardDescription>
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
                {editingBranch ? "Update branch details." : "Add a new branch location for print distribution."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Branch Name (optional)</Label>
                <Input
                  placeholder="e.g. Downtown Branch"
                  value={form.branch_name}
                  onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Address *</Label>
                <Input
                  placeholder="Full address"
                  value={form.full_address}
                  onChange={(e) => setForm({ ...form, full_address: e.target.value })}
                />
              </div>
              <div>
                <Label>Contact Name (optional)</Label>
                <Input
                  placeholder="Branch contact person"
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email (optional)</Label>
                  <Input
                    type="email"
                    placeholder="branch@email.com"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone (optional)</Label>
                  <Input
                    placeholder="+1234567890"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  />
                </div>
              </div>
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
            <p className="text-xs text-muted-foreground">Add branch locations to start creating print orders.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {branches.map((branch) => (
              <div key={branch.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-medium text-sm">
                    {branch.branch_name || "Unnamed Branch"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{branch.full_address}</p>
                  {(branch.contact_name || branch.contact_email || branch.contact_phone) && (
                    <p className="text-xs text-muted-foreground">
                      {[branch.contact_name, branch.contact_email, branch.contact_phone].filter(Boolean).join(" · ")}
                    </p>
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
                          Are you sure you want to remove this branch? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(branch.id)}>Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {branches.length < 3 && (
              <p className="text-xs text-muted-foreground">
                {3 - branches.length} of 3 initial branch slots remaining.
              </p>
            )}
            {branches.length >= 3 && (
              <p className="text-xs text-muted-foreground">
                You can continue adding unlimited branches anytime.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
