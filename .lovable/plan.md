# Remaining 45 Security Linter Warnings — Disposition

## Status
The 94 original findings were reduced to 45. The remaining 45 are all one of two linter rule types:

- **0028** (13): `SECURITY DEFINER` functions executable by anonymous users
- **0029** (32): `SECURITY DEFINER` functions executable by signed-in users

## Why they remain
Every function on the list backs a live feature:

- **Public functions (13)** — public inventory browsing (`get_active_inventory_all`, `search_nearby_listings`, branch-count helpers), guest bookings (`set_guest_booking_session`, `get_client_checkout_by_token`), ticket validation (`validate_publisher_ticket`, `get_venue_ticket_by_code`), public mobile QR landing pages (`get_mobile_qr_public`), and RLS permission helpers (`has_role`, `is_verified_admin`, etc.).
- **Authenticated functions (32)** — tenant/Webmaster RPCs (`create_tenant`, `invite_member`, `accept_invitation`, `webmaster_*`), tenant context helpers (`current_tenant_id`, `current_tenant_role`, `is_tenant_super_admin`, `is_webmaster`), role self-assignment (`set_own_role`, `claim_webmaster`), and branch upserts.

Revoking `EXECUTE` on any of these would break the corresponding feature, so they are intentional and accepted as reviewed.

## Plan
1. No code or database changes required.
2. Optionally: mark these findings as acknowledged/ignored in the security findings UI so future scans start from a clean baseline.
3. Re-run the linter after any future migration that adds new `SECURITY DEFINER` functions to keep the baseline at 45.
