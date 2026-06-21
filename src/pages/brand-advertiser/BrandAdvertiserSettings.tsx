import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BrandAdvertiserSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({
    company_name: "", contact_name: "", contact_phone: "", industry: "",
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const { data } = await supabase
        .from("brand_advertiser_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data) setProfile(data);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return; }
    const { error } = await supabase
      .from("brand_advertiser_profiles")
      .upsert({
        user_id: session.user.id,
        company_name: profile.company_name,
        contact_name: profile.contact_name,
        contact_phone: profile.contact_phone,
        industry: profile.industry,
        contact_email: session.user.email,
      }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated." });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Brand Advertiser Settings</h1>
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loading ? <div className="text-sm text-gray-500">Loading...</div> : (
              <>
                <div className="space-y-1.5">
                  <Label>Company Name</Label>
                  <Input value={profile.company_name || ""} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Name</Label>
                  <Input value={profile.contact_name || ""} onChange={(e) => setProfile({ ...profile, contact_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={profile.contact_phone || ""} onChange={(e) => setProfile({ ...profile, contact_phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Input value={profile.industry || ""} onChange={(e) => setProfile({ ...profile, industry: e.target.value })} />
                </div>
                <Button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
