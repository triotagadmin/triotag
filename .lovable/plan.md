

# Bug Fix Plan: Document Viewing, Location Search, and Payment Gate

## Bug 1: Publisher Documents Cannot Be Viewed (404 Error)

**Root Cause:** The `verification-documents` storage bucket is configured as **private** (not public), but the code uses `getPublicUrl()` when saving file URLs to the database. Public URLs for private buckets always return 404 errors.

**Fix:**
1. **VenueRegistration.tsx** and **VenueVerification.tsx**: Change the upload flow to store only the **storage path** (e.g., `publisherId/filename.ext`) in the `file_url` column instead of the full public URL.
2. **SubmissionDetailsDialog.tsx**: Instead of rendering `file_url` as a direct link, generate a **signed URL on demand** using `supabase.storage.from('verification-documents').createSignedUrl(path, 3600)` when the admin clicks "View Document."
3. **AdminDashboard.tsx**: Add an inline image/document preview when viewing verification documents. For image files (jpg, png), display them directly using the signed URL. For PDFs, open in a new tab via the signed URL.
4. **Existing data migration**: For already-stored URLs, extract the storage path from the full URL pattern and generate signed URLs at display time.

---

## Bug 2: Location Search Not Loading Listings + Radius Change + Text Input

**Root Cause:** The `search_nearby_listings` RPC function works correctly, but the issue may be related to how results are processed. Additionally, the radius needs to change from 50km to 10km, and a manual text input bar is needed.

**Fixes:**
1. **LocationSearchModal.tsx**: 
   - Change `radiusKm` default from `50` to `10`.
   - Update the circle radius on the map to reflect 10km.
   - Add a text input field for manual location entry using a geocoding approach (search by city/address name using the OpenStreetMap Nominatim API, which is free and requires no API key).
   - When a user types a location and presses search, geocode the text to lat/lng coordinates and place the pin accordingly.

2. **Marketplace.tsx**: 
   - Change `radius_km: 50` to `radius_km: 10` in the `handleLocationSearch` RPC call.
   - Update the UI text from "50 km" to "10 km" in all display strings.
   - Remove the filter that only shows `category === "venue"` results -- include agent services too (they are returned by the RPC).
   - Debug the result mapping to ensure `media_urls` (returned as JSON from the RPC) is handled correctly (it may need parsing).

3. **search_nearby_listings RPC**: Update the default `radius_km` parameter from `50` to `10` via a database migration.

---

## Bug 3: Advertiser Payment Should Be Blocked Until Admin Approves Print Order

**Root Cause:** In `ActivateListing.tsx`, the "Proceed to Payment" button (line 1133-1140) is always visible once a print order is submitted, regardless of whether the admin has approved it on `/admin/orders`. There is no check for the print order's `order_status`.

**Fixes:**
1. **ActivateListing.tsx**:
   - After a print order is submitted, fetch the `print_orders` record to check its `order_status`.
   - Subscribe to realtime changes on the `print_orders` table for the specific order to detect when admin approves.
   - **Disable/hide the "Proceed to Payment" button** unless `order_status === "in_production"` (which means admin has approved).
   - Show a clear message: "Waiting for admin approval before you can proceed to payment."
   - When the admin approves (status changes to `in_production`), the button becomes active automatically.

2. **PaymentGateway.tsx**:
   - Add a server-side check: before creating the checkout session, verify the print order status is `in_production` or later. This acts as a safety net even if the UI is bypassed.

---

## Technical Details

### Files to modify:
- `src/pages/VenueRegistration.tsx` -- Store storage path instead of public URL
- `src/pages/VenueVerification.tsx` -- Store storage path instead of public URL  
- `src/components/SubmissionDetailsDialog.tsx` -- Generate signed URLs for document viewing, add image preview
- `src/components/marketplace/LocationSearchModal.tsx` -- Add text input, change radius to 10km, add geocoding
- `src/pages/Marketplace.tsx` -- Update radius, fix result filtering
- `src/pages/ActivateListing.tsx` -- Gate payment step behind admin approval of print order
- `src/components/activation/PaymentGateway.tsx` -- Add server-side approval check
- Database migration: Update `search_nearby_listings` default radius from 50 to 10

### No new dependencies needed
- Geocoding uses the free OpenStreetMap Nominatim API (fetch-based, no library needed)

