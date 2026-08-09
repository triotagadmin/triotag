export const MOBILE_QR_STATUSES = ["draft", "active", "paused", "expired", "archived"] as const;
export type MobileQrStatus = (typeof MOBILE_QR_STATUSES)[number];

export const MOBILE_QR_EVENT_TYPES = [
  "scan",
  "landing_view",
  "form_start",
  "form_submit",
  "otp_sent",
  "otp_verified",
  "lead_created",
  "offer_redeemed",
] as const;
export type MobileQrEventType = (typeof MOBILE_QR_EVENT_TYPES)[number];

export function trackingPath(qrRef: string) {
  return `/qr/mobile/${qrRef}`;
}

export function trackingUrl(qrRef: string) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://triotag.com";
  return `${origin}${trackingPath(qrRef)}`;
}

export function maskMobile(n?: string | null) {
  if (!n) return "—";
  const clean = n.replace(/\s+/g, "");
  if (clean.length < 8) return "•••";
  return `${clean.slice(0, 4)} ${clean.slice(4, 7)} *** ${clean.slice(-4)}`;
}

export function formatMobile(n?: string | null) {
  if (!n) return "—";
  const clean = n.replace(/\s+/g, "");
  if (!clean.startsWith("+63") || clean.length !== 13) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
}

export function normalizePhMobile(raw: string): string | null {
  let n = String(raw || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (n.startsWith("0")) n = "63" + n.slice(1);
  if (n.startsWith("9") && n.length === 10) n = "63" + n;
  if (!/^639\d{9}$/.test(n)) return null;
  return "+" + n;
}

export function getSessionId(): string {
  const key = "triotag_mqr_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export type FunnelCounts = {
  scan: number;
  landing_view: number;
  form_start: number;
  form_submit: number;
  otp_sent: number;
  otp_verified: number;
  lead_created: number;
  offer_redeemed: number;
  unique_sessions: number;
};

export function emptyFunnel(): FunnelCounts {
  return {
    scan: 0,
    landing_view: 0,
    form_start: 0,
    form_submit: 0,
    otp_sent: 0,
    otp_verified: 0,
    lead_created: 0,
    offer_redeemed: 0,
    unique_sessions: 0,
  };
}

export function buildFunnel(
  events: { event_type: string; session_id: string | null }[],
): FunnelCounts {
  const f = emptyFunnel();
  const sessions = new Set<string>();
  for (const e of events) {
    if (e.event_type in f) (f as any)[e.event_type] += 1;
    if (e.session_id) sessions.add(e.session_id);
  }
  f.unique_sessions = sessions.size;
  return f;
}

export function statusBadgeClass(status?: string | null) {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
    case "paused":
      return "bg-amber-500/15 text-amber-600 border-amber-500/30";
    case "expired":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "archived":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-primary/10 text-primary border-primary/30";
  }
}
