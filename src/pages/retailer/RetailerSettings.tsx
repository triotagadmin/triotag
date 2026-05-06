import { useEffect, useState } from "react";
import { RetailerLayout, useRetailerPublisher } from "@/components/retailer/RetailerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RetailerSettings = () => {
  const pubId = useRetailerPublisher();
  const [tab, setTab] = useState<"profile" | "notifications" | "payout">("profile");
  const [profile, setProfile] = useState<any>({});
  const [payout, setPayout] = useState<any>({ account_name: "", bank_name: "", account_number: "", revenue_share_pct: 70 });

  useEffect(() => {
    if (!pubId) return;
    supabase.from("publisher_profiles").select("*").eq("id", pubId).maybeSingle().then(({ data }) => data && setProfile(data));
    supabase.from("retailer_payout_details").select("*").eq("publisher_id", pubId).maybeSingle().then(({ data }) => data && setPayout(data));
  }, [pubId]);

  const saveProfile = async () => {
    const { error } = await supabase.from("publisher_profiles").update({
      business_name: profile.business_name,
      contact_email: profile.contact_email,
      contact_phone: profile.contact_phone,
    }).eq("id", pubId!);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  };

  const savePayout = async () => {
    if (!pubId) return;
    const { error } = await supabase.from("retailer_payout_details").upsert({
      publisher_id: pubId,
      account_name: payout.account_name,
      bank_name: payout.bank_name,
      account_number: payout.account_number,
    }, { onConflict: "publisher_id" });
    if (error) return toast.error(error.message);
    toast.success("Payout details saved");
  };

  return (
    <RetailerLayout title="Settings">
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {(["profile", "notifications", "payout"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === t ? "border-green-500 text-green-600" : "border-transparent text-zinc-500"}`}>
            {t === "payout" ? "Payout Details" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 max-w-2xl">
        {tab === "profile" && (
          <div className="space-y-3">
            <Field label="Business Name" value={profile.business_name || ""} onChange={(v) => setProfile({ ...profile, business_name: v })} />
            <Field label="Contact Email" value={profile.contact_email || ""} onChange={(v) => setProfile({ ...profile, contact_email: v })} />
            <Field label="Phone" value={profile.contact_phone || ""} onChange={(v) => setProfile({ ...profile, contact_phone: v })} />
            <button onClick={saveProfile} className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg">Save Profile</button>
          </div>
        )}
        {tab === "notifications" && (
          <div className="space-y-3">
            {["New booking request received", "Booking approved/rejected", "Screen goes offline", "New paid campaign goes live", "Weekly performance summary", "Monthly earnings report", "Creative deployment confirmation"].map((l) => (
              <label key={l} className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-sm">{l}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-green-600" />
              </label>
            ))}
            <button className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg">Save Preferences</button>
          </div>
        )}
        {tab === "payout" && (
          <div className="space-y-3">
            <Field label="Account Name" value={payout.account_name || ""} onChange={(v) => setPayout({ ...payout, account_name: v })} />
            <Field label="Bank Name" value={payout.bank_name || ""} onChange={(v) => setPayout({ ...payout, bank_name: v })} />
            <Field label="Account Number" value={payout.account_number || ""} onChange={(v) => setPayout({ ...payout, account_number: v })} />
            <p className="text-xs text-zinc-500">Your current revenue share: <strong className="text-green-600">{payout.revenue_share_pct}%</strong> per booking.</p>
            <button onClick={savePayout} className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg">Update Details</button>
          </div>
        )}
      </div>
    </RetailerLayout>
  );
};

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="text-xs text-zinc-500 block mb-1">{label}</label>
    <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
  </div>
);

export default RetailerSettings;
