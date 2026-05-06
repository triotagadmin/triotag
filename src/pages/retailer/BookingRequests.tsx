import { useEffect, useState } from "react";
import { RetailerLayout, useRetailerPublisher } from "@/components/retailer/RetailerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BookingRequests = () => {
  const pubId = useRetailerPublisher();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [items, setItems] = useState<any[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

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
  useEffect(() => { load(); }, [pubId, tab]);

  const respond = async (booking_id: string, action: "approved" | "rejected", rejection_reason?: string) => {
    const { data, error } = await supabase.functions.invoke("respond-booking-request", { body: { booking_id, action, rejection_reason } });
    if (error || (data as any)?.error) return toast.error(error?.message || (data as any).error);
    toast.success(action === "approved" ? "Campaign approved and scheduled!" : "Booking rejected");
    setRejectingId(null); setReason("");
    load();
  };

  return (
    <RetailerLayout title="Booking Requests">
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
    </RetailerLayout>
  );
};

export default BookingRequests;
