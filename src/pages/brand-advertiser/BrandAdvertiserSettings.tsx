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
    company_name: "", contact_name: "", contact_phone: "", industry: "", website_domain: "",
  });
  const [domainError, setDomainError] = useState<string | null>(null);

  const validateDomain = (v: string): string | null => {
    const trimmed = v.trim();
    if (!trimmed) return null; // optional
    if (/^https?:\/\//i.test(trimmed) || trimmed.includes("/")) {
      return "Enter just the domain (e.g. example.com), not a full URL.";
    }
    // Basic domain regex: labels separated by dots, TLD 2+ chars
    if (!/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(trimmed)) {
      return "Enter a valid domain like example.com.";
    }
    return null;
  };

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
    const err = validateDomain(profile.website_domain || "");
    setDomainError(err);
    if (err) {
      toast({ title: "Invalid website domain", description: err, variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return; }
    const { error } = await (supabase as any)
      .from("brand_advertiser_profiles")
      .upsert({
        user_id: session.user.id,
        company_name: profile.company_name,
        contact_name: profile.contact_name,
        contact_phone: profile.contact_phone,
        industry: profile.industry,
        website_domain: (profile.website_domain || "").trim() || null,
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
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Brand Advertiser Settings</h1>
        <Card>
          <CardHeader><CardTitle className="text-gray-900">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {loading ? <div className="text-sm text-gray-500">Loading...</div> : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-gray-700">Company Name</Label>
                  <Input value={profile.company_name || ""} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-700">Contact Name</Label>
                  <Input value={profile.contact_name || ""} onChange={(e) => setProfile({ ...profile, contact_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-700">Phone</Label>
                  <Input value={profile.contact_phone || ""} onChange={(e) => setProfile({ ...profile, contact_phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-700">Industry</Label>
                  <Input value={profile.industry || ""} onChange={(e) => setProfile({ ...profile, industry: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-700">Website Domain</Label>
                  <Input
                    value={profile.website_domain || ""}
                    onChange={(e) => {
                      setProfile({ ...profile, website_domain: e.target.value });
                      setDomainError(null);
                    }}
                    onBlur={(e) => setDomainError(validateDomain(e.target.value))}
                    placeholder="example.com"
                    aria-invalid={!!domainError}
                  />
                  {domainError ? (
                    <p className="text-xs text-red-600">{domainError}</p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Just the domain (no https://, no paths). Required by ad exchanges for brand safety review.
                    </p>
                  )}
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
