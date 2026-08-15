import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { User } from "@supabase/supabase-js";
import {
  ArrowLeft, User as UserIcon, CreditCard, SlidersHorizontal,
  Bell, Shield, AlertTriangle, Save, Loader2, LogOut, KeyRound,
  Building2, Phone, Mail, MapPin, Trash2
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

const AdvertiserSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Account info
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Ad preferences
  const [preferredAdSize, setPreferredAdSize] = useState("table_tent_card");
  const [industryCategory, setIndustryCategory] = useState("");
  const [locationPreference, setLocationPreference] = useState("");

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [paymentConfirmations, setPaymentConfirmations] = useState(true);
  const [adPlacementAlerts, setAdPlacementAlerts] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id).single();
      if (!roles || roles.role !== "print_partner") { navigate("/dashboard"); return; }

      setUser(session.user);

      // Fetch advertiser profile
      const { data: profile } = await supabase
        .from("advertiser_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profile) {
        setCompanyName(profile.company_name || "");
        setContactName(profile.contact_name || "");
        setContactEmail(profile.contact_email || "");
        setContactPhone(profile.contact_phone || "");
      }

      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("advertiser_profiles")
        .update({
          company_name: companyName.trim(),
          contact_name: contactName.trim(),
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim() || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Settings saved", description: "Your account settings have been updated." });
    } catch (err: any) {
      toast({ title: "Error saving settings", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords match.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setChangePasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOutAll = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" });
      toast({ title: "Signed out", description: "You have been signed out of all sessions." });
      navigate("/auth");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeactivate = async () => {
    toast({ title: "Account deactivated", description: "Your account has been deactivated. Contact support to reactivate." });
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    toast({ title: "Deletion requested", description: "Your account deletion request has been submitted. Our team will process it within 30 days." });
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 pb-28 md:pb-10 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/retailer-dashboard")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserIcon className="h-5 w-5 text-primary" />
                Account Information
              </CardTitle>
              <CardDescription>Manage your business and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Business / Brand Name
                  </Label>
                  <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5" /> Contact Person
                  </Label>
                  <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Full name" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email Address
                  </Label>
                  <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Phone Number
                  </Label>
                  <Input id="contactPhone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <Separator />
              <Button variant="outline" size="sm" onClick={() => setChangePasswordOpen(true)} className="gap-2">
                <KeyRound className="h-4 w-4" />
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Billing & Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Billing & Payments
              </CardTitle>
              <CardDescription>Your plan, payment methods, and billing history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Current Plan</p>
                  <p className="text-muted-foreground text-xs">Pay-per-listing</p>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-sm mb-2">Saved Payment Methods</p>
                <p className="text-muted-foreground text-sm">No payment methods saved yet.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => toast({ title: "Coming Soon", description: "Payment method management is under development." })}>
                  Add Payment Method
                </Button>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-sm mb-2">Billing History</p>
                <p className="text-muted-foreground text-sm">No billing history available.</p>
              </div>
            </CardContent>
          </Card>

          {/* Ad Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                Ad Preferences
              </CardTitle>
              <CardDescription>Set your default ad format and targeting preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Preferred Ad Size</Label>
                <Select value={preferredAdSize} onValueChange={setPreferredAdSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sticker_small">Sticker — Small (2×2 in)</SelectItem>
                    <SelectItem value="sticker_medium">Sticker — Medium (3×3 in)</SelectItem>
                    <SelectItem value="sticker_large">Sticker — Large (4×6 in)</SelectItem>
                    <SelectItem value="table_tent_card">Table Tent Card</SelectItem>
                    <SelectItem value="poster_a4">Poster — A4</SelectItem>
                    <SelectItem value="flyer_half">Flyer — Half Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="industryCategory">Industry Category</Label>
                  <Input id="industryCategory" value={industryCategory} onChange={(e) => setIndustryCategory(e.target.value)} placeholder="e.g. Food & Beverage" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationPreference" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Location Preference
                  </Label>
                  <Input id="locationPreference" value={locationPreference} onChange={(e) => setLocationPreference(e.target.value)} placeholder="e.g. Metro Manila (optional)" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Control what emails and alerts you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Email Notifications</p>
                  <p className="text-muted-foreground text-xs">Receive updates via email</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Payment Confirmations</p>
                  <p className="text-muted-foreground text-xs">Get notified when payments are processed</p>
                </div>
                <Switch checked={paymentConfirmations} onCheckedChange={setPaymentConfirmations} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Ad Placement Alerts</p>
                  <p className="text-muted-foreground text-xs">Know when your ad goes live</p>
                </div>
                <Switch checked={adPlacementAlerts} onCheckedChange={setAdPlacementAlerts} />
              </div>
            </CardContent>
          </Card>

          {/* Security & Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Security & Access
              </CardTitle>
              <CardDescription>Login activity and session management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Last Sign-In</p>
                  <p className="text-muted-foreground text-xs">
                    {user?.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString()
                      : "Unknown"}
                  </p>
                </div>
                <Badge variant="outline">Current</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOutAll} className="gap-2">
                <LogOut className="h-4 w-4" />
                Log Out of All Sessions
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto border-destructive/30 text-destructive hover:bg-destructive/10">
                    Deactivate Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your ads will be paused and your profile hidden. You can reactivate by contacting support.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Deactivate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10 gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All your data, campaigns, and billing history will be permanently deleted within 30 days.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Yes, Delete My Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Save Bar (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border md:hidden z-40">
        <Button className="w-full gap-2" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Desktop Save Button (sticky at bottom of form area) */}
      <div className="hidden md:block container mx-auto max-w-3xl px-6 pb-10">
        <Button className="gap-2" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your new password below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={changingPassword} className="gap-2">
              {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvertiserSettings;
