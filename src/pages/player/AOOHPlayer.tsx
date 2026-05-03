import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleItem {
  aooh_campaign_id: string;
  campaign_name: string;
  audio_file_url: string;
  audio_duration_sec: number | null;
  play_frequency_min: number;
  max_plays_per_day: number;
  dayparts: string[];
}

const AOOHPlayer = () => {
  const [token, setToken] = useState("");
  const [session, setSession] = useState<any>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<ScheduleItem | null>(null);
  const [playsToday, setPlaysToday] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayRef = useRef<Record<string, number>>({});

  const connect = async () => {
    setError(null);
    const { data, error } = await supabase.functions.invoke("aooh-get-schedule", { body: { access_token: token.trim() } });
    if (error || !data?.session) { setError("Invalid token"); return; }
    setSession(data.session);
    setSchedule(data.schedule || []);
    if ("wakeLock" in navigator) {
      try { await (navigator as any).wakeLock.request("screen"); } catch {}
    }
  };

  // Refresh schedule every 60s
  useEffect(() => {
    if (!session) return;
    const id = setInterval(async () => {
      const { data } = await supabase.functions.invoke("aooh-get-schedule", { body: { access_token: token.trim() } });
      if (data?.schedule) setSchedule(data.schedule);
    }, 60000);
    return () => clearInterval(id);
  }, [session, token]);

  // Play loop every 30s
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      if (nowPlaying) return;
      const now = Date.now();
      for (const item of schedule) {
        const last = lastPlayRef.current[item.aooh_campaign_id] || 0;
        if (now - last < item.play_frequency_min * 60_000) continue;
        playItem(item);
        break;
      }
    }, 30000);
    return () => clearInterval(id);
  }, [schedule, nowPlaying, session]);

  const playItem = (item: ScheduleItem) => {
    setNowPlaying(item);
    lastPlayRef.current[item.aooh_campaign_id] = Date.now();
    const audio = new Audio(item.audio_file_url);
    audioRef.current = audio;
    audio.play().catch(() => {});
    const onEnd = (completed: boolean) => async () => {
      setNowPlaying(null);
      if (completed) setPlaysToday(p => p + 1);
      await supabase.functions.invoke("aooh-log-play", {
        body: {
          aooh_campaign_id: item.aooh_campaign_id,
          venue_id: session.venue_id,
          ad_space_id: session.ad_space_id,
          duration_sec: Math.floor(audio.currentTime),
          completed,
          player_session_id: session.id,
          device_info: { ua: navigator.userAgent },
        },
      });
    };
    audio.onended = onEnd(true);
    audio.onerror = onEnd(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center text-white">
          <h1 className="text-3xl font-bold text-green-500 mb-2">Triotag</h1>
          <h2 className="text-xl font-semibold mb-2">AOOH Audio Player</h2>
          <p className="text-zinc-400 mb-6">Enter your venue access token to begin.</p>
          <Input value={token} onChange={e => setToken(e.target.value)} placeholder="Access token" className="mb-3 text-center" />
          <Button onClick={connect} className="w-full bg-green-600 hover:bg-green-500">Connect</Button>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          <p className="text-xs text-zinc-500 mt-4">Your access token was provided by Triotag admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="flex items-center justify-between mb-8">
        <span className="text-green-500 font-bold">Triotag</span>
        <span className="text-zinc-300">{session.label || "AOOH Player"}</span>
        <span className="flex items-center gap-2 text-green-500"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />LIVE</span>
      </div>
      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 bg-zinc-900 rounded-xl p-6">
          <h3 className="text-sm uppercase text-zinc-400 mb-3">Now Playing</h3>
          {nowPlaying ? (
            <div>
              <p className="text-2xl font-bold text-green-400">{nowPlaying.campaign_name}</p>
              <div className="flex gap-1 mt-4 h-16 items-end">
                {Array.from({ length: 20 }).map((_, i) => (
                  <span key={i} className="flex-1 bg-green-500 rounded-sm animate-pulse" style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 50}ms` }} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-zinc-400">Standby — waiting for next scheduled play.</p>
          )}
        </div>
        <div className="md:col-span-2 space-y-4">
          <div className="bg-zinc-900 rounded-xl p-6">
            <h3 className="text-sm uppercase text-zinc-400 mb-2">Today's Stats</h3>
            <p className="text-4xl font-bold text-green-500">{playsToday}</p>
            <p className="text-xs text-zinc-400">plays today</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-6">
            <h3 className="text-sm uppercase text-zinc-400 mb-2">Active Campaigns</h3>
            <ul className="space-y-2 text-sm">
              {schedule.map(s => <li key={s.aooh_campaign_id}>{s.campaign_name} — every {s.play_frequency_min}m</li>)}
              {schedule.length === 0 && <li className="text-zinc-500">No active campaigns</li>}
            </ul>
          </div>
        </div>
      </div>
      <p className="text-center text-zinc-600 text-xs mt-12">Powered by Triotag AOOH Network</p>
    </div>
  );
};
export default AOOHPlayer;
