import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShieldCheck, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { getSessionId, normalizePhMobile, trackingPath } from "@/lib/mobileQr";

type PublicQr = {
  id: string;
  qr_ref: string;
  name: string | null;
  brand_name: string | null;
  landing_title: string | null;
  offer_cta: string | null;
  description: string | null;
  logo_url: string | null;
  background_url: string | null;
  terms_text: string | null;
  privacy_policy_url: string | null;
  privacy_policy_version: string | null;
  terms_version: string | null;
  destination_url: string | null;
  status: string | null;
};

type Stage = "form" | "otp" | "verified";

export default function MobileQRLanding() {
  const { qrRef = "" } = useParams();
  const [qr, setQr] = useState<PublicQr | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("form");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [challenge, setChallenge] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");
  const startedRef = useRef(false);
  const sessionId = useMemo(() => getSessionId(), []);

  const track = async (event_type: string) => {
    try {
      await supabase.functions.invoke("mobile-qr-track", {
        body: {
          qr_ref: qrRef,
          event_type,
          session_id: sessionId,
          landing_page: trackingPath(qrRef),
          referrer: document.referrer || null,
        },
      });
    } catch {
      /* tracking must never block the experience */
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.rpc("get_mobile_qr_public", { _qr_ref: qrRef });
      if (!active) return;
      const row = (Array.isArray(data) ? data[0] : data) as PublicQr | undefined;
      setQr(row ?? null);
      setLoading(false);
      if (row) {
        document.title = `${row.landing_title || row.name || "Special Offer"} | ${row.brand_name || "TrioTag"}`;
        await track("scan");
        await track("landing_view");
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrRef]);

  const onFocusNumber = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    track("form_start");
  };

  const sendCode = async () => {
    setError("");
    const normalized = normalizePhMobile(mobile);
    if (!normalized) return setError("Enter a valid Philippine mobile number.");
    if (!consent) return setError("Please accept the consent statement to continue.");
    setBusy(true);
    const { data, error: fnError } = await supabase.functions.invoke("mobile-qr-otp", {
      body: { action: "send", qr_ref: qrRef, mobile_number: normalized, session_id: sessionId },
    });
    setBusy(false);
    if (fnError || data?.error) return setError(data?.error || "Could not send your code. Try again.");
    setChallenge(data.challenge);
    setDevCode(data.dev_code || "");
    setStage("otp");
  };

  const verifyCode = async () => {
    setError("");
    if (code.trim().length !== 6) return setError("Enter the 6-digit code.");
    setBusy(true);
    const { data, error: fnError } = await supabase.functions.invoke("mobile-qr-otp", {
      body: {
        action: "verify",
        qr_ref: qrRef,
        code: code.trim(),
        challenge,
        consent_marketing: consent,
        session_id: sessionId,
      },
    });
    setBusy(false);
    if (fnError || data?.error) return setError(data?.error || "Verification failed.");
    setStage("verified");
  };

  const viewOffer = async () => {
    const normalized = normalizePhMobile(mobile);
    await supabase.functions.invoke("mobile-qr-otp", {
      body: { action: "redeem", qr_ref: qrRef, mobile_number: normalized, session_id: sessionId },
    });
    if (qr?.destination_url) window.location.href = qr.destination_url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1220]">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!qr) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1220] px-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-xl font-semibold text-white">Offer unavailable</h1>
          <p className="mt-2 text-sm text-slate-400">
            This Mobile QR is not active right now. Please check with the advertiser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-white">
      <div
        className="min-h-screen bg-cover bg-center"
        style={qr.background_url ? { backgroundImage: `url(${qr.background_url})` } : undefined}
      >
        <div className="min-h-screen bg-gradient-to-b from-[#0B1220]/90 via-[#0B1220]/95 to-[#0B1220] px-5 py-10 flex flex-col items-center">
          <div className="w-full max-w-sm">
            {qr.logo_url ? (
              <img
                src={qr.logo_url}
                alt={`${qr.brand_name || "Advertiser"} logo`}
                className="h-12 w-auto mx-auto object-contain"
                loading="lazy"
              />
            ) : (
              <p className="text-center text-sm font-semibold tracking-widest text-cyan-400">
                {(qr.brand_name || "TRIOTAG").toUpperCase()}
              </p>
            )}

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold tracking-widest text-cyan-300">
                <Sparkles className="h-3 w-3" /> SPECIAL OFFER
              </div>

              <h1 className="mt-4 text-2xl font-bold leading-tight">
                {qr.landing_title || "Get your exclusive offer."}
              </h1>
              {qr.description && (
                <p className="mt-2 text-sm text-slate-300">{qr.description}</p>
              )}

              {stage === "form" && (
                <div className="mt-6 space-y-4">
                  <p className="text-sm text-slate-300">Enter your mobile number to continue.</p>
                  <div className="flex gap-2">
                    <div className="flex h-11 w-16 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sm font-medium text-slate-200">
                      +63
                    </div>
                    <Input
                      inputMode="numeric"
                      autoComplete="tel"
                      aria-label="Mobile number"
                      value={mobile}
                      onFocus={onFocusNumber}
                      onChange={(e) => setMobile(e.target.value)}
                      className="h-11 flex-1 rounded-xl border-white/15 bg-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <label className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
                    <Checkbox
                      checked={consent}
                      onCheckedChange={(v) => setConsent(v === true)}
                      className="mt-0.5 border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />
                    <span>
                      I agree to receive communications and promotional offers from{" "}
                      {qr.brand_name || "the advertiser"}.
                    </span>
                  </label>

                  {error && <p className="text-xs text-red-400">{error}</p>}

                  <Button
                    onClick={sendCode}
                    disabled={busy}
                    className="h-12 w-full rounded-xl bg-cyan-500 text-[#0B1220] hover:bg-cyan-400"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="ml-1 h-4 w-4" /></>}
                  </Button>
                </div>
              )}

              {stage === "otp" && (
                <div className="mt-6 space-y-4">
                  <p className="text-sm text-slate-300">
                    We sent a 6-digit verification code to your number.
                  </p>
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    aria-label="Verification code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="h-12 rounded-xl border-white/15 bg-white/10 text-center text-xl tracking-[0.4em] text-white"
                  />
                  {devCode && (
                    <p className="text-[11px] text-slate-500">
                      Staging mode — no SMS provider connected. Code: {devCode}
                    </p>
                  )}
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <Button
                    onClick={verifyCode}
                    disabled={busy}
                    className="h-12 w-full rounded-xl bg-cyan-500 text-[#0B1220] hover:bg-cyan-400"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                  </Button>
                  <button
                    onClick={() => { setStage("form"); setCode(""); setError(""); }}
                    className="w-full text-xs text-slate-400 underline"
                  >
                    Use a different number
                  </button>
                </div>
              )}

              {stage === "verified" && (
                <div className="mt-6 space-y-4 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-cyan-400" />
                  <p className="text-lg font-semibold">You're verified ✓</p>
                  <p className="text-sm text-slate-300">Your offer is ready.</p>
                  <Button
                    onClick={viewOffer}
                    className="h-12 w-full rounded-xl bg-cyan-500 text-[#0B1220] hover:bg-cyan-400"
                  >
                    {qr.offer_cta || "View Offer"}
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="h-3 w-3" /> Verified by TrioTag
            </div>

            <div className="mt-3 flex justify-center gap-4 text-[11px] text-slate-400">
              <a href={qr.privacy_policy_url || "/privacy"} className="underline">Privacy Policy</a>
              <a href="/terms" className="underline">Terms &amp; Conditions</a>
            </div>

            {qr.terms_text && (
              <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-600">
                {qr.terms_text}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
