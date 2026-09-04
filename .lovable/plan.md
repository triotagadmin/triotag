# Agent Center for Super Admins

A dedicated place where a Super Admin (currently the TinyStickyAds account) can invite, verify, suspend, reactivate and remove their own agents — and nobody else's.

## What you'll get

**New sidebar item "Agent Center"** in the admin sidebar, right under the dashboard, opening `/admin/agents`. Only visible and reachable for accounts that are an active Super Admin of a tenant.

**Agent Center page** with:
- Header "Agent Center" and subtitle "Manage your advertising agents, invitations, access, and account status."
- Four counters: Total, Active, Pending Verification, Suspended/Inactive.
- A "+ Create Agent" button.
- A searchable, status-filterable list showing Agent Name, Email, Account Status, Date Invited, Last Login, and per-row actions (View, Resend Verification, Suspend, Reactivate, Remove).
- Statuses: Pending Verification, Active, Suspended, Removed, Expired.

**Create Agent form**: first name, last name, email, optional phone and position. No tenant, role or password fields — those are decided on the server.

**Invitation email via Resend**, branded TrioTag, subject "Your TRIOTAG Agent Account Requires Verification", with a single-use expiring "Verify & Activate Account" button plus a plain fallback link and the expiry date.

**Verification page** at `/verify/agent?token=…`. The invited person signs in with Google using the invited email; the server checks the token, activates the agent, and sends them to the agent dashboard.

**Dashboard card** on `/admin/dashboard`: "Agent Center — N active agents — Manage Agents →", using live data.

## Technical approach

Reuses the existing tenant system (`tenants`, `tenant_members`, `tenant_invitations`, `audit_logs`, `send-tenant-invitation`) — no parallel user system.

**Migration**
- Add to `tenant_invitations`: `first_name`, `last_name`, `phone`, `position`, `token_hash` (sha256 of the token, via pgcrypto), `last_sent_at`, `send_count`. New agent invitations store only the hash; the plaintext token exists only in the email link. The legacy `token` column stays for already-issued Super Admin invites.
- Add `last_login_at` and `removed_at` to `tenant_members`; allow `status` values `active`, `suspended`, `removed`.
- RLS: Super Admins may read/update `tenant_members` and `tenant_invitations` only where `tenant_id = current_tenant_id()` and `member_role = 'agent'`; Webmaster keeps global access. No policy path lets a Super Admin write `tenant_id`.

**Edge function `agent-manage`** (service role, caller identity from the session):
- `list` — agents + pending invitations for the caller's tenant, enriched with last sign-in time from the auth admin API.
- `create` — validates email, blocks duplicate active/pending agents, generates a 32-byte random token, stores the hash, sets a 7-day expiry, forces `role = agent` and `tenant_id` from the caller's membership, then sends the Resend email.
- `resend` — pending invitations only; invalidates the old token, issues a new one and expiry, rate limited (max 5 sends per invitation per hour). On Resend failure the status stays Pending and an error is returned.
- `suspend` / `reactivate` / `remove` — soft status changes on `tenant_members`; no operational, campaign, inventory or financial records are deleted.
- Every branch verifies the caller is an active `super_admin` (or Webmaster) and that the target's `tenant_id` matches; otherwise 403.

**Edge function `agent-verify`** — takes the token from the verification page after Google sign-in, hashes and matches it, checks not expired / not used / status pending / role agent, requires the signed-in email to equal the invited email, then creates the `tenant_members` row (`agent`, tenant from the invitation), sets `user_roles.role = 'agent'`, marks the invitation accepted, clears the hash, and logs the event. Role and tenant never come from the request.

**Access enforcement in the app**: existing agent guards additionally reject `status != 'active'`, so suspended and removed agents lose dashboard access immediately while their data remains.

**Audit logging** via existing `audit_logs`: AGENT_INVITED, AGENT_VERIFICATION_SENT, AGENT_VERIFICATION_RESENT, AGENT_EMAIL_VERIFIED, AGENT_ACTIVATED, AGENT_SUSPENDED, AGENT_REACTIVATED, AGENT_REMOVED — with actor, tenant, target and metadata, visible in the Webmaster audit view.

**Verification after build**: two-tenant isolation checks (a second test tenant + agent), token reuse, expired token, cross-tenant access and tenant_id tampering attempts, all expected to be denied server-side.

## Notes

Sign-in is Google-only today, so agents activate by signing in with Google using the invited address — no passwords are created or emailed. If you'd rather they set a password, that's a separate change to the sign-in method.
