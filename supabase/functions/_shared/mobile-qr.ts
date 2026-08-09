// Shared helpers for the Mobile QR lead capture system.

export function normalizePhNumber(raw: string): string | null {
  const digits = String(raw || "").replace(/[^\d+]/g, "");
  let n = digits.replace(/^\+/, "");
  if (n.startsWith("0")) n = "63" + n.slice(1);
  if (n.startsWith("9") && n.length === 10) n = "63" + n;
  if (!/^639\d{9}$/.test(n)) return null;
  return "+" + n;
}

const enc = new TextEncoder();

async function hmacKey(secret: string) {
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function b64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
  return Array.from(sig).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Stateless OTP challenge — the code itself is never persisted anywhere. */
export async function signChallenge(secret: string, payload: Record<string, unknown>): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await hmacHex(secret, body);
  return `${body}.${sig}`;
}

export async function verifyChallenge(
  secret: string,
  token: string,
): Promise<Record<string, unknown> | null> {
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;
  const expected = await hmacHex(secret, body);
  if (expected !== sig) return null;
  try {
    const json = JSON.parse(
      atob(body.replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (typeof json.exp === "number" && json.exp < Date.now()) return null;
    return json;
  } catch {
    return null;
  }
}

export function maskNumber(n: string): string {
  if (!n || n.length < 6) return "•••";
  return `${n.slice(0, 6)} *** ${n.slice(-4)}`;
}
