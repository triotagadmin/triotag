import type { BidRequest, Imp } from "./openrtb-types.ts";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Structural validation of an incoming OpenRTB bid request, scoped to
 * what a DOOH-only bidder actually needs to check. This is deliberately
 * strict on the DOOH-specific rules (per IAB spec: a bid request with a
 * DOOH object must NOT contain a site or app object) since silently
 * accepting a malformed request is how discrepancies and rejected bids
 * happen downstream.
 *
 * This does NOT validate every optional field in the spec — it validates
 * the fields this bidder actually depends on to make a correct decision.
 */
export function validateBidRequest(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof body !== "object" || body === null) {
    return { valid: false, errors: ["Request body must be a JSON object"] };
  }

  const req = body as Partial<BidRequest>;

  if (!req.id || typeof req.id !== "string") {
    errors.push("Missing or invalid required field: id");
  }

  if (!Array.isArray(req.imp) || req.imp.length === 0) {
    errors.push("Missing or empty required field: imp (must be a non-empty array)");
  } else {
    req.imp.forEach((imp: Imp, idx: number) => {
      if (!imp.id || typeof imp.id !== "string") {
        errors.push(`imp[${idx}]: missing required field id`);
      }

      if (!imp.banner && !imp.video && !imp.audio) {
        errors.push(`imp[${idx}]: must contain at least one of banner, video, or audio`);
      }
    });
  }

  // Per IAB spec: DOOH, site, and app are mutually exclusive.
  const contentObjects = [req.dooh, req.site, req.app].filter(Boolean);
  if (contentObjects.length === 0) {
    errors.push("Request must contain exactly one of dooh, site, or app — none present");
  } else if (contentObjects.length > 1) {
    errors.push("Request must contain exactly one of dooh, site, or app — multiple present (spec violation)");
  }

  // This bidder only handles DOOH/AOOH inventory — reject anything else early
  // rather than silently no-bidding, so misrouted requests are visible in logs.
  if (!req.dooh) {
    errors.push("This bidder only accepts requests with a dooh object");
  } else {
    // DOOH-specific requirements per IAB implementation guidance:
    // geo lat/lon is required since DOOH devices sit on walled-garden
    // networks where IP-based geolocation is unreliable or unavailable.
    const geo = req.device?.geo;
    if (!geo || typeof geo.lat !== "number" || typeof geo.lon !== "number") {
      errors.push("dooh requests require device.geo.lat and device.geo.lon");
    }
  }

  // tmax matters a lot for DOOH: if the exchange doesn't tell us our time
  // budget, we default conservatively rather than assuming we have plenty of time.
  if (req.tmax !== undefined && (typeof req.tmax !== "number" || req.tmax <= 0)) {
    errors.push("tmax, if present, must be a positive number");
  }

  return { valid: errors.length === 0, errors };
}

/** Conservative default if the exchange doesn't specify tmax. */
export const DEFAULT_TMAX_MS = 150;

/**
 * Reserve a safety margin below the actual tmax for serialization,
 * network write, and any logging — don't spend the entire budget on
 * computation alone or you risk timing out the response.
 */
export function effectiveTimeBudgetMs(tmax?: number): number {
  const budget = tmax && tmax > 0 ? tmax : DEFAULT_TMAX_MS;
  const safetyMarginMs = 30;
  return Math.max(budget - safetyMarginMs, 20);
}
