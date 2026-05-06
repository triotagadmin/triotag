import { useEffect, useState } from "react";
import { RetailerLayout, useRetailerPublisher } from "@/components/retailer/RetailerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AudienceInsights = () => {
  const pubId = useRetailerPublisher();
  const [data, setData] = useState<any>({
    daily_visitors: 0,
    peak_hours: [],
    demographics: { professionals: 20, students: 20, tourists: 20, residents: 20, other: 20 },
    gender_split: { male: 50, female: 50 },
    age_ranges: [],
    visibility_score: 0,
  });

  useEffect(() => {
    if (!pubId) return;
    supabase.from("retailer_audience_data").select("*").eq("publisher_id", pubId).maybeSingle().then(({ data: row }) => {
      if (row) setData(row);
    });
  }, [pubId]);

  const demSum = Object.values(data.demographics).reduce((a: number, b: any) => a + Number(b), 0) as number;
  const setDem = (k: string, v: number) => setData({ ...data, demographics: { ...data.demographics, [k]: v } });
  const toggleAge = (a: string) => {
    const arr = data.age_ranges.includes(a) ? data.age_ranges.filter((x: string) => x !== a) : [...data.age_ranges, a];
    setData({ ...data, age_ranges: arr });
  };

  const computeScore = () => {
    let s = 0;
    if (data.daily_visitors > 0) s += 25;
    if (data.peak_hours.length > 0) s += 25;
    if (demSum === 100) s += 25;
    if (data.age_ranges.length > 0) s += 25;
    return s;
  };

  const save = async () => {
    if (!pubId) return;
    if (demSum !== 100) return toast.error("Audience mix must total 100%");
    const score = computeScore();
    const { error } = await supabase.from("retailer_audience_data").upsert({
      publisher_id: pubId,
      daily_visitors: data.daily_visitors,
      peak_hours: data.peak_hours,
      demographics: data.demographics,
      gender_split: data.gender_split,
      age_ranges: data.age_ranges,
      visibility_score: score,
    }, { onConflict: "publisher_id" });
    if (error) return toast.error(error.message);
    setData({ ...data, visibility_score: score });
    toast.success("Audience data updated! Visibility score improved.");
  };

  const checks = [
    { label: "Daily Visitors", done: data.daily_visitors > 0 },
    { label: "Peak Hours", done: data.peak_hours.length > 0 },
    { label: "Demographics", done: demSum === 100 },
    { label: "Age Range", done: data.age_ranges.length > 0 },
  ];

  return (
    <RetailerLayout title="Audience Insights">
      <p className="text-sm text-zinc-600 mb-4">Share your venue data to attract more brand campaigns and increase your listing visibility.</p>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-4">
        <h3 className="font-bold text-zinc-900 mb-3">Listing Visibility Score</h3>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
              <path d="M18 2 a16 16 0 1 1 0 32 a16 16 0 1 1 0 -32" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <path d="M18 2 a16 16 0 1 1 0 32 a16 16 0 1 1 0 -32" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray={`${data.visibility_score}, 100`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-green-600">{data.visibility_score}</div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-zinc-700 mb-2">Complete your audience data to increase your score and attract more advertisers.</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {checks.map((c) => (
                <div key={c.label}>{c.done ? "✅" : "❌"} {c.label}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
        <h3 className="font-bold text-zinc-900">Update Your Venue Data</h3>

        <div>
          <label className="text-xs text-zinc-500 block mb-1">Daily Visitors</label>
          <input type="number" value={data.daily_visitors || ""} onChange={(e) => setData({ ...data, daily_visitors: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
        </div>

        <div>
          <div className="text-xs text-zinc-500 mb-2">Audience Mix (must total 100%)</div>
          {Object.entries(data.demographics).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 mb-2">
              <label className="w-28 text-xs capitalize">{k}</label>
              <input type="range" min={0} max={100} value={v as number} onChange={(e) => setDem(k, Number(e.target.value))} className="flex-1" />
              <span className="w-10 text-xs text-right">{v as number}%</span>
            </div>
          ))}
          <div className={`text-xs mt-1 ${demSum === 100 ? "text-green-600" : "text-red-600"}`}>Total: {demSum}% {demSum === 100 ? "✓" : "(must equal 100%)"}</div>
        </div>

        <div>
          <div className="text-xs text-zinc-500 mb-2">Age Ranges</div>
          <div className="flex gap-1.5 flex-wrap">
            {["18-24", "25-34", "35-44", "45-54", "55+"].map((a) => (
              <button key={a} onClick={() => toggleAge(a)} className={`px-2.5 py-1 text-xs rounded-full font-semibold ${data.age_ranges.includes(a) ? "bg-green-600 text-white" : "bg-gray-100 text-zinc-600"}`}>{a}</button>
            ))}
          </div>
        </div>

        <button onClick={save} className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-lg">Save Audience Data</button>
      </div>
    </RetailerLayout>
  );
};

export default AudienceInsights;
