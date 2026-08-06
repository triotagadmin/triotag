import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, XCircle, Loader2, Building2, User, Check } from "lucide-react";
import { toast } from "sonner";

type Profile = {
  id: string;
  company_name: string | null;
  industry: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  approval_status: string | null;
  rejection_reason: string | null;
};

const STEPS = [
  { title: "Company Info", icon: Building2 },
  { title: "Contact Info", icon: User },
];

export default function BrandApprovalGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ company_name: "", industry: "", contact_name: "", contact_phone: "" });

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    setUserId(session.user.id);
    const { data } = await supabase
      .from("brand_advertiser_profiles")
      .select("id, company_name, industry, contact_name, contact_phone, approval_status, rejection_reason")
      .eq("user_id", session.user.id)
      .maybeSingle();
    setProfile((data as any) || null);
    if (data) {
      setForm({
        company_name: (data as any).company_name || "",
        industry: (data as any).industry || "",
        contact_name: (data as any).contact_name || "",
        contact_phone: (data as any).contact_phone || "",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!userId) return;
    if (!form.company_name.trim() || !form.contact_name.trim()) {
      toast.error("Company name and contact name are required");
      return;
    }
    setSaving(true);
    const payload = {
      company_name: form.company_name.trim(),
      industry: form.industry.trim() || null,
      contact_name: form.contact_name.trim(),
      contact_phone: form.contact_phone.trim() || null,
    };
    let error: any = null;
    if (profile?.id) {
      ({ error } = await supabase.from("brand_advertiser_profiles").update(payload).eq("id", profile.id));
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      ({ error } = await supabase.from("brand_advertiser_profiles").insert({
        ...payload,
        user_id: userId,
        contact_email: session?.user?.email || null,
      } as any));
    }
    setSaving(false);
    if (error) { toast.error("Could not save your details"); return; }
    toast.success("Details submitted for review");
    setLoading(true);
    await load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const needsWizard = !profile?.company_name || !profile.company_name.trim();

  if (needsWizard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
        <Card className="max-w-lg w-full p-8 bg-white border border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Complete your Brand profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            We need a few details before a Super Admin can review your account.
          </p>

          <div className="flex items-center gap-3 my-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step;
              const done = i < step;
              return (
                <div key={s.title} className="flex items-center gap-3 flex-1">
                  <div className={`flex items-center gap-2 ${active || done ? "text-primary" : "text-gray-400"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                      done ? "bg-primary text-primary-foreground border-primary"
                        : active ? "border-primary" : "border-gray-300"
                    }`}>
                      {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 ${step > i ? "bg-primary" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {step === 0 ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input id="company_name" value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="Acme Corporation" />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  placeholder="Retail, F&B, Fashion..." />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact_name">Contact Name *</Label>
                <Input id="contact_name" value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  placeholder="Jane Dela Cruz" />
              </div>
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input id="contact_phone" value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  placeholder="+63 912 345 6789" />
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button variant="outline" disabled={step === 0 || saving} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {step === 0 ? (
              <Button disabled={!form.company_name.trim()} onClick={() => setStep(1)}>Next</Button>
            ) : (
              <Button disabled={saving} onClick={submit}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit for approval
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (profile?.approval_status !== "approved") {
    const rejected = profile?.approval_status === "rejected";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full p-8 text-center bg-white border border-gray-200">
          <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${rejected ? "bg-red-100" : "bg-yellow-100"}`}>
            {rejected ? <XCircle className="w-6 h-6 text-red-600" /> : <Clock className="w-6 h-6 text-yellow-600" />}
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mt-4">
            {rejected ? "Your Brand Advertiser application was rejected" : "Your Brand Advertiser account is awaiting Super Admin approval"}
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            {rejected
              ? profile?.rejection_reason || "Please contact support for more details."
              : "We'll notify you once your account has been reviewed and approved."}
          </p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
