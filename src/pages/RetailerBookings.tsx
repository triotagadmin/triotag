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

const RetailerBookings = () => {
  const navigate = useNavigate();
  const [pubId, setPubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [items, setItems] = useState<any[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth?redirect=/retailer-dashboard/bookings", { replace: true }); return; }
      const { data: pub } = await supabase.from("publisher_profiles").select("id").eq("user_id", session.user.id).maybeSingle();
      if (!pub) { navigate("/retailer-dashboard", { replace: true }); return; }
      setPubId(pub.id);
      setLoading(false);
    })();
  }, [navigate]);

  const load = async () => {
    if (!pubId) return;
    const { data: spaces } = await supabase.from("ad_spaces").select("id, title, location").eq("publisher_id", pubId);
    const ids = (spaces || []).map((s) => s.id);
    if (!ids.length) return setItems([]);
    const statusMap: any = { pending: "pending_publisher_approval", approved: "approved", rejected: "rejected" };
    const { data } = await supabase.from("activations").select("*").in("ad_space_id", ids).eq("status", statusMap[tab]).order("created_at", { ascending: false });
    const enriched = (data || []).map((b) => ({ ...b, space: spaces!.find((s) => s.id === b.ad_space_id) }));
    setItems(enriched);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [pubId, tab]);

  const respond = async (booking_id: string, action: "approved" | "rejected", rejection_reason?: string) => {
    const { data, error } = await supabase.functions.invoke("respond-booking-request", { body: { booking_id, action, rejection_reason } });
    if (error || (data as any)?.error) return toast.error(error?.message || (data as any).error);
    toast.success(action === "approved" ? "Campaign approved and scheduled!" : "Booking rejected");
    setRejectingId(null); setReason("");
    load();
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><Navigation /><PageLoader /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
        <Link to="/retailer-dashboard" className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:underline mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-1">Booking Requests</h1>
        <p className="text-sm text-zinc-600 mb-4">Review incoming brand campaign requests before they go live on your screens.</p>

        <div className="flex gap-1 mb-4 border-b border-gray-200">
          {(["pending", "approved", "rejected"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === t ? "border-green-500 text-green-600" : "border-transparent text-zinc-500"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-sm text-zinc-500">No {tab} requests.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {items.map((b) => (
              <div key={b.id} className={`rounded-2xl p-5 shadow-sm border ${tab === "pending" ? "border-orange-200 bg-orange-50/30" : "bg-white border-gray-100"}`}>
                <div className="flex items-center justify-between mb-2">
                  {tab === "pending" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">New Booking Request</span>}
                  <span className="text-xs text-zinc-500">{new Date(b.created_at).toLocaleDateString()}</span>
                </div>
                <div className="font-bold text-zinc-900">{b.space?.title}</div>
                <div className="text-xs text-zinc-500 mb-2">{b.space?.location}</div>
                <div className="text-sm">A brand advertiser • {b.activation_type}</div>
                <div className="text-xs text-zinc-600 mt-1">{b.start_date} → {b.end_date}</div>
                <div className="text-xl font-bold text-green-600 mt-2">₱{Number(b.total_amount || 0).toLocaleString()}</div>

                {tab === "pending" && (
                  <>
                    {rejectingId === b.id ? (
                      <div className="mt-3 space-y-2">
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection reason (optional)" rows={2} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg" />
                        <div className="flex gap-2">
                          <button onClick={() => respond(b.id, "rejected", reason)} className="flex-1 bg-red-600 text-white text-xs font-semibold py-1.5 rounded-lg">Confirm Rejection</button>
                          <button onClick={() => { setRejectingId(null); setReason(""); }} className="text-xs text-zinc-600">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => respond(b.id, "approved")} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-2 rounded-lg">Approve Campaign</button>
                        <button onClick={() => setRejectingId(b.id)} className="flex-1 border border-red-500 text-red-600 hover:bg-red-50 text-sm font-semibold py-2 rounded-lg">Reject</button>
                      </div>
                    )}
                  </>
                )}
                {tab === "rejected" && b.rejection_reason && <div className="text-xs text-zinc-500 mt-2 italic">"{b.rejection_reason}"</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailerBookings;
