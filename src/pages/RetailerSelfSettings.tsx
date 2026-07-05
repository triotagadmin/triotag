import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
  </div>
);

const Field = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div>
    <label className="text-xs text-zinc-500 block mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
  </div>
);

const RetailerSelfSettings = () => {
  const navigate = useNavigate();
  const [pubId, setPubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({
    business_name: "", contact_email: "", contact_phone: "", location: "", description: "",
  });
  const [payout, setPayout] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth?redirect=/retailer-dashboard/settings", { replace: true }); return; }
      const { data: pub } = await supabase.from("publisher_profiles").select("*").eq("user_id", session.user.id).maybeSingle();
      if (!pub) { navigate("/retailer-dashboard", { replace: true }); return; }
      setPubId(pub.id);
      setProfile({
        business_name: pub.business_name || "",
        contact_email: pub.contact_email || "",
        contact_phone: pub.contact_phone || "",
        location: pub.location || "",
        description: pub.description || "",
      });
      const { data: p } = await supabase.from("retailer_payout_details").select("revenue_share_pct").eq("publisher_id", pub.id).maybeSingle();
      setPayout(p);
      setLoading(false);
    })();
  }, [navigate]);

  const saveProfile = async () => {
    if (!pubId) return;
    setSaving(true);
    const { error } = await supabase.from("publisher_profiles").update({
      business_name: profile.business_name.trim(),
      contact_email: profile.contact_email.trim(),
      contact_phone: profile.contact_phone?.trim() || null,
      location: profile.location?.trim() || null,
      description: profile.description?.trim() || null,
    }).eq("id", pubId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><Navigation /><PageLoader /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-2xl">
        <Link to="/retailer-dashboard" className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:underline mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-1">Settings</h1>
        <p className="text-sm text-zinc-600 mb-6">Update your business profile and view your revenue share.</p>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
          <h2 className="font-bold text-zinc-900 mb-3">Business Profile</h2>
          <div className="space-y-3">
            <Field label="Business Name *" value={profile.business_name} onChange={(v) => setProfile({ ...profile, business_name: v })} />
            <Field label="Contact Email *" value={profile.contact_email} onChange={(v) => setProfile({ ...profile, contact_email: v })} type="email" />
            <Field label="Contact Phone" value={profile.contact_phone} onChange={(v) => setProfile({ ...profile, contact_phone: v })} />
            <Field label="Location" value={profile.location} onChange={(v) => setProfile({ ...profile, location: v })} />
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Description</label>
              <textarea rows={3} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
            </div>
            <button onClick={saveProfile} disabled={saving} className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-bold text-zinc-900 mb-3">Revenue Share</h2>
          {payout ? (
            <>
              <div className="text-sm text-zinc-600 mb-1">Your current revenue share per booking:</div>
              <div className="text-3xl font-bold text-green-600 mb-2">{payout.revenue_share_pct}%</div>
              <p className="text-xs text-zinc-500">Contact support to change your revenue share.</p>
            </>
          ) : (
            <p className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
              Revenue share not yet configured — contact support.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetailerSelfSettings;
