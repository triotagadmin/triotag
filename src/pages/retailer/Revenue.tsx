import { useEffect, useState } from "react";
import { RetailerLayout, useRetailerPublisher } from "@/components/retailer/RetailerLayout";
import { supabase } from "@/integrations/supabase/client";

const Revenue = () => {
  const pubId = useRetailerPublisher();
  const [bookings, setBookings] = useState<any[]>([]);
  const [share, setShare] = useState(70);

  useEffect(() => {
    if (!pubId) return;
    (async () => {
      const { data: spaces } = await supabase.from("ad_spaces").select("id, title, ad_format").eq("publisher_id", pubId);
      const ids = (spaces || []).map((s) => s.id);
      if (ids.length) {
        const { data } = await supabase.from("activations").select("*").in("ad_space_id", ids).in("status", ["approved", "completed", "printing"] as any);
        setBookings((data || []).map((b) => ({ ...b, space: spaces!.find((s) => s.id === b.ad_space_id) })));
      }
      const { data: payout } = await supabase.from("retailer_payout_details").select("revenue_share_pct").eq("publisher_id", pubId).maybeSingle();
      if (payout) setShare(Number(payout.revenue_share_pct));
    })();
  }, [pubId]);

  const now = new Date();
  const thisMonth = bookings.filter((b) => new Date(b.created_at).getMonth() === now.getMonth() && new Date(b.created_at).getFullYear() === now.getFullYear());
  const lastMonth = bookings.filter((b) => {
    const d = new Date(b.created_at); const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  });
  const sum = (arr: any[]) => arr.reduce((s, b) => s + Number(b.total_amount || 0) * (share / 100), 0);

  const Stat = ({ l, v, sub, color = "text-green-600" }: any) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <div className="text-xs text-zinc-500">{l}</div>
      <div className={`text-2xl font-bold ${color} mt-1`}>₱{v.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );

  return (
    <RetailerLayout title="Revenue">
      <p className="text-sm text-zinc-600 mb-4">Track your earnings from brand advertisers booking your ad spaces.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat l="This Month" v={sum(thisMonth)} />
        <Stat l="Last Month" v={sum(lastMonth)} />
        <Stat l="Pending Payout" v={0} color="text-yellow-600" sub="Awaiting settlement" />
        <Stat l="All Time" v={sum(bookings)} />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-zinc-500">
            <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Ad Space</th><th className="text-left p-3">Gross ₱</th><th className="text-left p-3">Share</th><th className="text-left p-3">Earnings ₱</th><th className="text-left p-3">Status</th></tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No transactions yet.</td></tr> :
              bookings.map((b) => (
                <tr key={b.id} className="border-t border-gray-100">
                  <td className="p-3 text-xs">{new Date(b.created_at).toLocaleDateString()}</td>
                  <td className="p-3">{b.space?.title}</td>
                  <td className="p-3">₱{Number(b.total_amount || 0).toLocaleString()}</td>
                  <td className="p-3 text-xs">{share}%</td>
                  <td className="p-3 font-semibold text-green-600">₱{(Number(b.total_amount || 0) * share / 100).toLocaleString()}</td>
                  <td className="p-3"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">{b.status}</span></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <div className="bg-green-50 border border-green-100 rounded-2xl p-5 mt-4">
        <h3 className="font-bold text-zinc-900 mb-1">How Payouts Work</h3>
        <p className="text-sm text-zinc-700">You earn {share}% of each confirmed booking on your ad spaces. TrioTag retains {100 - share}%. Payouts are processed monthly. For inquiries: tinystickyads@gmail.com</p>
      </div>
    </RetailerLayout>
  );
};

export default Revenue;
