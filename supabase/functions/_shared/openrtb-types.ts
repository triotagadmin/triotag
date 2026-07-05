/**
 * OpenRTB 2.5 types with the OpenRTB 2.6 DOOH addendum bolted on.
 *
 * Broadsign SSP (Reach) and most current DOOH exchanges run OpenRTB 2.5
 * as the base protocol version, with the `dooh` object and DOOH-specific
 * `Qty` impression multiplier (formalized in 2.6) added as an extension.
 * This file reflects that real-world hybrid rather than a pure spec version.
 *
 * Source: IAB Tech Lab openrtb2.x spec (2.6.md, implementation.md),
 * https://github.com/InteractiveAdvertisingBureau/openrtb2.x
 *
 * IMPORTANT: verify field names/casing against Broadsign's own Reach
 * documentation once you have partner access — exchanges sometimes deviate
 * slightly from the base spec in their actual wire format.
 */

// ---------- Top-level Bid Request ----------

export interface BidRequest {
  id: string; // Unique bid request ID, required
  imp: Imp[]; // Array of impression objects, required, at least 1
  dooh?: DOOH; // Present for DOOH inventory. Mutually exclusive with site/app.
  site?: Site;
  app?: AppObj;
  device?: Device; // Recommended, required in practice for DOOH
  user?: User;
  test?: 0 | 1; // 0 = live, 1 = test mode (not billable)
  at?: 1 | 2; // Auction type: 1 = first price, 2 = second price plus. Default 2.
  tmax?: number; // Max time in ms the exchange allows for bid response. CRITICAL for DOOH.
  wseat?: string[]; // Allowed buyer seats
  bseat?: string[]; // Blocked buyer seats
  cur?: string[]; // Allowed currencies, e.g. ["PHP", "USD"]
  bcat?: string[]; // Blocked advertiser categories
  cattax?: number; // Category taxonomy in use
  badv?: string[]; // Blocked advertiser domains
  bapp?: string[];
  regs?: Regs;
  source?: Source;
  ext?: Record<string, unknown>;
}

// ---------- Impression ----------

export interface Imp {
  id: string; // Required, unique within the bid request
  banner?: Banner;
  video?: Video;
  audio?: Audio; // Relevant for AOOH
  displaymanager?: string;
  displaymanagerver?: string;
  instl?: 0 | 1;
  tagid?: string;
  bidfloor?: number; // Minimum CPM, default 0
  bidfloorcur?: string; // Default "USD"
  secure?: 0 | 1;
  qty?: Qty; // DOOH impression multiplier object — see below
  ext?: Record<string, unknown>;
}

/**
 * DOOH-specific: represents that one ad play may be viewed by more than
 * one person. Do NOT use this to adjust your bid CPM — bid your normal
 * CPM. The exchange/publisher applies the multiplier for billing.
 */
export interface Qty {
  multiplier?: number; // e.g. 14.2 — estimated viewers per play
  sourcetype?: 1 | 2 | 3; // 1 = Publisher measured, 2 = Media Owner measured, 3 = Media Owner modeled
  vendor?: string; // Domain of measurement vendor, if 3rd-party
}

export interface Banner {
  w?: number;
  h?: number;
  format?: { w: number; h: number }[];
  mimes?: string[];
  api?: number[];
}

export interface Video {
  mimes: string[]; // Required
  minduration?: number;
  maxduration?: number;
  protocols?: number[]; // VAST versions supported
  w?: number;
  h?: number;
  linearity?: 1 | 2;
  maxextended?: number;
  minbitrate?: number;
  maxbitrate?: number;
}

export interface Audio {
  mimes: string[]; // Required — relevant for AOOH (in-store audio)
  minduration?: number;
  maxduration?: number;
  poddur?: number;
  protocols?: number[];
}

// ---------- DOOH Object (the key addition for this build) ----------

export interface DOOH {
  id?: string; // Exchange-provided placement/screen ID
  name?: string; // Human-readable placement name
  venuetype?: string[]; // OpenOOH Venue Taxonomy category codes, e.g. ["transit.airport.terminal"]
  venuetypetax?: number; // Taxonomy version in use. Default: OpenOOH Venue Taxonomy v1.0 if omitted.
  publisher?: Publisher;
  domain?: string;
  keywords?: string;
  content?: Content;
  ext?: Record<string, unknown>;
}

export interface Publisher {
  id?: string;
  name?: string;
  cat?: string[];
  domain?: string;
}

export interface Content {
  id?: string;
  title?: string;
  cat?: string[];
}

export interface Site {
  id?: string;
  name?: string;
  domain?: string;
  page?: string;
}

export interface AppObj {
  id?: string;
  name?: string;
  bundle?: string;
}

// ---------- Device (device.type = 8 for DOOH per IAB spec) ----------

export interface Device {
  ua?: string;
  geo?: Geo; // lat/lon REQUIRED for DOOH — no IP-based geo since screens sit on walled-garden networks
  ip?: string; // Often absent/unreliable for DOOH — geo.lat/lon is the source of truth
  devicetype?: number; // 8 = "Set Top Box" per legacy list; DOOH uses connected/OOH device type per exchange convention — verify against Broadsign's actual enum
  make?: string;
  model?: string;
  os?: string;
  osv?: string;
  h?: number; // Screen height in pixels
  w?: number; // Screen width in pixels
  ppi?: number; // Pixels per inch — combine with h/w to get physical screen size in inches
  language?: string;
  ifa?: string;
}

export interface Geo {
  lat: number; // REQUIRED for DOOH
  lon: number; // REQUIRED for DOOH
  type?: 1 | 2 | 3; // 1 = GPS/location services, 2 = IP address, 3 = user provided. Recommended for DOOH.
  accuracy?: number;
  country?: string;
  region?: string;
  city?: string;
}

export interface User {
  id?: string;
  buyeruid?: string;
}

export interface Regs {
  coppa?: 0 | 1;
  ext?: Record<string, unknown>;
}

export interface Source {
  fd?: 0 | 1;
  tid?: string;
  pchain?: string;
  schain?: unknown; // SupplyChain object — implement fully before going live; omitted here for brevity
}

// ---------- Bid Response ----------

export interface BidResponse {
  id: string; // Must echo BidRequest.id
  seatbid?: SeatBid[];
  bidid?: string;
  cur?: string; // Currency of bid, default USD
  customdata?: string;
  nbr?: NoBidReason; // Only present when NOT bidding (and returning 200 instead of 204)
  ext?: Record<string, unknown>;
}

export interface SeatBid {
  bid: Bid[];
  seat?: string;
  group?: 0 | 1;
}

export interface Bid {
  id: string; // Bidder-generated bid ID, unique within the response
  impid: string; // Must match the Imp.id being bid on
  price: number; // CPM in the response currency — this is your ACTUAL bid, do not scale by qty.multiplier
  adid?: string;
  nurl?: string; // Win notice URL
  burl?: string; // Billing notice URL (fired on billable event)
  lurl?: string; // Loss notice URL
  adm?: string; // Ad markup (creative payload / VAST XML for video, or a direct image URL depending on exchange convention)
  adomain?: string[]; // Advertiser domain, required by most exchanges for brand safety
  cid?: string; // Campaign ID
  crid?: string; // Creative ID — required by most exchanges
  w?: number;
  h?: number;
  attr?: number[]; // Creative attributes (e.g. autoplay, etc.)
  exp?: number; // Bid expiry in seconds
  ext?: Record<string, unknown>;
}

// No-bid reason codes per OpenRTB spec
export enum NoBidReason {
  UNKNOWN_ERROR = 0,
  TECHNICAL_ERROR = 1,
  INVALID_REQUEST = 2,
  KNOWN_WEB_SPIDER = 3,
  SUSPECTED_NON_HUMAN_TRAFFIC = 4,
  CLOUD_DATACENTER_PROXY_IP = 5,
  UNSUPPORTED_DEVICE = 6,
  BLOCKED_PUBLISHER_SITE = 7,
  UNMATCHED_USER = 8,
  DAILY_READER_CAP = 9,
  DAILY_DOMAIN_CAP = 10,
  ADS_TXT_AUTHORIZATION_UNAVAILABLE = 11,
  ADS_TXT_AUTHORIZATION_VIOLATION = 12,
  ADS_CERT_AUTHENTICATION_UNAVAILABLE = 13,
  ADS_CERT_AUTHENTICATION_VIOLATION = 14,
  INSUFFICIENT_AUDIENCE_QUANTITY = 15, // DOOH-relevant: not enough of your targeted audience
  NO_ELIGIBLE_MATCHING_CAMPAIGN = 16, // Most common no-bid reason you'll return
}
