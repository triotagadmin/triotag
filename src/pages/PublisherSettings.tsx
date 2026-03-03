import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Lock, Bell, ArrowLeft } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  business_name: z.string().trim().min(1, "Business name is required").max(100),
  contact_email: z.string().trim().email("Invalid email format").max(255),
  contact_phone: z.string().trim().max(20).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

const PublisherSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ business_name: "", contact_email: "", contact_phone: "", location: "", description: "" });
  const [password, setPassword] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [notifPrefs, setNotifPrefs] = useState({ messages: true, bookings: true, invoices: true });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data } = await supabase
        .from("publisher_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setForm({
          business_name: data.business_name || "",
          contact_email: data.contact_email || "",
          contact_phone: data.contact_phone || "",
          location: data.location || "",
          description: data.description || "",
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [navigate]);

  const handleSaveProfile = async () => {
    const result = profileSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => { fieldErrors[e.path[0] as string] = e.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    const { error } = await supabase
      .from("publisher_profiles")
      .update({
        business_name: form.business_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone?.trim() || null,
        location: form.location?.trim() || null,
        description: form.description?.trim() || null,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile updated successfully." });
    }
  };

  const handleChangePassword = async () => {
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => { fieldErrors[e.path[0] as string] = e.message; });
      setPasswordErrors(fieldErrors);
      return;
    }
    setPasswordErrors({});
    setSaving(true);

    const { error } = await supabase.auth.updateUser({ password: password.password });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Password updated successfully." });
      setPassword({ password: "", confirm: "" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate("/venue-publishers")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" />
          Account Settings
        </h1>

        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Profile Information</CardTitle>
            <CardDescription>Update your business profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="business_name">Business Name *</Label>
              <Input id="business_name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
              {errors.business_name && <p className="text-sm text-destructive mt-1">{errors.business_name}</p>}
            </div>
            <div>
              <Label htmlFor="contact_email">Email *</Label>
              <Input id="contact_email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
              {errors.contact_email && <p className="text-sm text-destructive mt-1">{errors.contact_email}</p>}
            </div>
            <div>
              <Label htmlFor="contact_phone">Phone</Label>
              <Input id="contact_phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new_password">New Password</Label>
              <Input id="new_password" type="password" value={password.password} onChange={(e) => setPassword({ ...password, password: e.target.value })} />
              {passwordErrors.password && <p className="text-sm text-destructive mt-1">{passwordErrors.password}</p>}
            </div>
            <div>
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input id="confirm_password" type="password" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} />
              {passwordErrors.confirm && <p className="text-sm text-destructive mt-1">{passwordErrors.confirm}</p>}
            </div>
            <Button onClick={handleChangePassword} disabled={saving}>
              {saving ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notification Preferences</CardTitle>
            <CardDescription>Manage what notifications you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-messages">Messages</Label>
              <Switch id="notif-messages" checked={notifPrefs.messages} onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, messages: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-bookings">Bookings</Label>
              <Switch id="notif-bookings" checked={notifPrefs.bookings} onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, bookings: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-invoices">Invoices</Label>
              <Switch id="notif-invoices" checked={notifPrefs.invoices} onCheckedChange={(v) => setNotifPrefs({ ...notifPrefs, invoices: v })} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublisherSettings;
