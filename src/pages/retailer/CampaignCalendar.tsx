import { useEffect, useState } from "react";
import { RetailerLayout, useRetailerPublisher } from "@/components/retailer/RetailerLayout";
import { supabase } from "@/integrations/supabase/client";

const CampaignCalendar = () => {
  const pubId = useRetailerPublisher();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    if (!pubId) return;
    supabase.from("house_ad_schedules").select("*, ad_spaces(title)").eq("publisher_id", pubId).then(({ data }) => setSchedules(data || []));
  }, [pubId]);

  const now = new Date(); now.setMonth(now.getMonth() + monthOffset);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startDay = monthStart.getDay();
  const days: Array<{ date: Date | null }> = [];
  for (let i = 0; i < startDay; i++) days.push({ date: null });
  for (let d = 1; d <= monthEnd.getDate(); d++) days.push({ date: new Date(now.getFullYear(), now.getMonth(), d) });

  const eventsForDay = (d: Date) => {
    const ds = d.toISOString().slice(0, 10);
    return schedules.filter((s) => s.start_date <= ds && (!s.end_date || s.end_date >= ds));
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <RetailerLayout title="Campaign Calendar">
      <p className="text-sm text-zinc-600 mb-4">See exactly what's playing on each of your screens and audio zones, day by day.</p>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthOffset((m) => m - 1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm">‹</button>
          <div className="text-sm font-semibold">{now.toLocaleDateString("en", { month: "long", year: "numeric" })}</div>
          <button onClick={() => setMonthOffset((m) => m + 1)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm">›</button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Paid</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded" /> House</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-300 rounded" /> Empty</span>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 text-xs font-semibold text-zinc-600">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="p-2 text-center">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const isToday = d.date && d.date.getTime() === today.getTime();
            const events = d.date ? eventsForDay(d.date) : [];
            return (
              <div key={i} className={`min-h-[90px] p-1.5 border-t border-r border-gray-100 ${isToday ? "bg-green-50" : ""}`}>
                {d.date && <div className="text-xs font-semibold text-zinc-700 text-right">{d.date.getDate()}</div>}
                <div className="space-y-1 mt-1">
                  {events.slice(0, 3).map((e) => (
                    <div key={e.id} className="text-[10px] bg-blue-500 text-white px-1 py-0.5 rounded truncate">{e.title}</div>
                  ))}
                  {events.length > 3 && <div className="text-[10px] text-zinc-500">+{events.length - 3} more</div>}
                  {d.date && events.length === 0 && <div className="text-[10px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded">Empty</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </RetailerLayout>
  );
};

export default CampaignCalendar;
