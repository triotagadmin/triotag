

## Plan: Duplicate Advertiser Role + Print Partner Client Checkout Flow

This is a large feature set with two main tracks: (A) role duplication and renaming, and (B) a client-facing checkout system for Print Partners. Here is the implementation plan.

---

### Track A: Role Duplication and Renaming

**Database Changes (1 migration)**

1. Add `print_partner` to the `app_role` enum:
   ```sql
   ALTER TYPE public.app_role ADD VALUE 'print_partner';
   ```

2. Create a new table `client_checkouts` (needed for Track B, but created here):
   ```sql
   CREATE TABLE public.client_checkouts (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
     print_partner_id uuid NOT NULL,
     activation_id uuid REFERENCES activations(id),
     ad_space_id uuid,
     client_name text NOT NULL,
     client_email text NOT NULL,
     client_company text,
     listing_title text,
     campaign_dates text,
     line_items jsonb NOT NULL DEFAULT '[]',
     lease_total numeric DEFAULT 0,
     material_total numeric DEFAULT 0,
     grand_total numeric DEFAULT 0,
     currency text DEFAULT 'PHP',
     status text DEFAULT 'draft',
     paymongo_checkout_session_id text,
     payment_method text,
     paid_at timestamptz,
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz DEFAULT now()
   );
   ALTER TABLE public.client_checkouts ENABLE ROW LEVEL SECURITY;
   -- Print partners can manage their own checkouts
   CREATE POLICY "print_partners_manage_own" ON public.client_checkouts
     FOR ALL TO authenticated
     USING (print_partner_id = auth.uid());
   -- Public can view by token (for the checkout page)
   CREATE POLICY "public_view_by_token" ON public.client_checkouts
     FOR SELECT TO public USING (true);
   -- Admins can manage all
   CREATE POLICY "admins_manage_all" ON public.client_checkouts
     FOR ALL TO authenticated
     USING (has_role(auth.uid(), 'admin'));
   ```

**Backend Changes**

3. Update `handle_new_user_role` trigger function to handle `print_partner` user_type by mapping it to the `print_partner` role.

4. Create a new trigger function `handle_new_print_partner` (similar to `handle_new_advertiser`) that creates an `advertiser_profiles` row for `print_partner` users -- since they share the same profile/functionality.

5. Update all RLS policies and DB functions that check `role = 'advertiser'` to also accept `'print_partner'`. Key places:
   - `advertiser_profiles` policies
   - `activations` policies
   - `campaigns` policies
   - `advertiser_print_orders` policies
   - `franchise_branches` policies (advertiser checks)
   - `has_role` calls in edge functions

**Frontend: UI Renaming**

6. **Auth page** (`src/pages/Auth.tsx`):
   - Change signup options from `"Advertiser"` to two options: `"Franchise Partner"` (value: `advertiser`) and `"Print Partner"` (value: `print_partner`)

7. **Brand config** (`src/lib/brand.ts`): Add role display name map:
   ```typescript
   export const ROLE_DISPLAY_NAMES: Record<string, string> = {
     advertiser: "Franchise Partner",
     print_partner: "Print Partner",
     publisher: "Agent",
     admin: "Admin",
     talent: "Talent",
   };
   ```

8. **Navigation** (`src/components/Navigation.tsx`):
   - `getDashboardLink`: add `print_partner` mapping to `/advertiser-dashboard`
   - Display correct role label

9. **AdvertiserDashboard** (`src/pages/AdvertiserDashboard.tsx`):
   - Accept both `advertiser` and `print_partner` roles
   - Show "Franchise Partner Dashboard" or "Print Partner Dashboard" based on role
   - Change role check from `roles.role !== "advertiser"` to `!["advertiser", "print_partner"].includes(roles.role)`

10. **AdvertiserSettings** (`src/pages/AdvertiserSettings.tsx`): Same role check update + title rename

11. **All user-facing "Advertiser" text**: Search and replace display text across ~38 files where "Advertiser" appears in UI labels (not DB/logic references). Key files:
    - Dashboard headers, navigation labels, toast messages
    - Terms of service, onboarding text

12. **Auth sign-in routing**: In `handleSignIn`, add `print_partner` case that routes to `/advertiser-dashboard` (same as advertiser).

---

### Track B: Print Partner Client Checkout Flow

**Frontend Changes**

13. **ActivateListing.tsx -- Custom pricing for Print Partners**:
    - Detect if current user role is `print_partner`
    - In Step 2 (Print Order), make unit price editable per material line item (add Input field next to each material row)
    - Store custom prices in state alongside material configs
    - Auto-calculate line totals from custom price x quantity

14. **New Step 3: Client Checkout Preparation** (in ActivateListing.tsx):
    - Add a new step after Print Order for `print_partner` role only
    - Form fields: client name, client email, client company (optional)
    - Review summary: ad space fees, print material fees with custom prices, grand total
    - Button: "Generate Client Checkout Page"
    - On click: call edge function to create `client_checkouts` record, return token
    - Show generated URL, copy button, preview button, payment status badge

15. **New page: `src/pages/ClientCheckout.tsx`** (public, no auth required):
    - Route: `/checkout/:token`
    - Fetches checkout record by token from `client_checkouts`
    - Displays branded TrioTag checkout page with:
      - Campaign/booking title
      - "Prepared by [Print Partner name]"
      - Client name
      - Ad space details, campaign dates
      - Print material line items with custom prices (read-only)
      - Pricing breakdown: lease fees, print fees, grand total
      - "Proceed to Payment" button
    - On payment click: calls `create-checkout` edge function with checkout token
    - Redirects to PayMongo hosted checkout

16. **New page: `src/pages/ClientPaymentSuccess.tsx`**:
    - Route: `/checkout/success`
    - Shows payment confirmation to client

17. **Print Partner Dashboard section**: Add "Client Checkouts" tab showing list of generated checkout pages with status, link copy, and payment status.

**App.tsx Routes**

18. Add routes:
    ```
    /checkout/:token → ClientCheckout
    /checkout/success → ClientPaymentSuccess
    ```

**Edge Function Changes**

19. **New edge function: `create-client-checkout`**:
    - Accepts: activation details, line items, client info, custom prices
    - Creates `client_checkouts` record
    - Returns: token, public URL

20. **Update `create-checkout` edge function**:
    - Accept optional `checkoutToken` parameter
    - When present, fetch pricing from `client_checkouts` instead of computing from activation
    - Create PayMongo session with the client checkout's line items and total
    - Update `client_checkouts` with PayMongo session ID

21. **Update `paymongo-webhook`**:
    - Check metadata for `type: "client_checkout"`
    - On success: update `client_checkouts.status` to `paid`, create activation/job record, send notification to Print Partner
    - Send email notification to `tinystickyads@gmail.com`

---

### Summary of Files to Create/Edit

| Action | File |
|--------|------|
| Edit | `src/lib/brand.ts` -- add role display names |
| Edit | `src/pages/Auth.tsx` -- add Print Partner signup option, routing |
| Edit | `src/components/Navigation.tsx` -- support print_partner role |
| Edit | `src/pages/AdvertiserDashboard.tsx` -- accept both roles, dynamic title |
| Edit | `src/pages/AdvertiserSettings.tsx` -- accept both roles |
| Edit | `src/pages/ActivateListing.tsx` -- custom pricing + client checkout step |
| Create | `src/pages/ClientCheckout.tsx` -- public branded checkout page |
| Create | `src/pages/ClientPaymentSuccess.tsx` -- payment success page |
| Edit | `src/App.tsx` -- add new routes |
| Create | `supabase/functions/create-client-checkout/index.ts` |
| Edit | `supabase/functions/create-checkout/index.ts` -- support client checkout token |
| Edit | `supabase/functions/paymongo-webhook/index.ts` -- handle client checkout payments |
| Migration | Add `print_partner` enum value, `client_checkouts` table, update trigger functions, update RLS policies |
| Edit | ~10 more files for "Advertiser" -> "Franchise Partner" UI text |

---

### Technical Constraints

- The `app_role` enum currently has: `admin`, `publisher`, `advertiser`, `talent`. Adding `print_partner` requires a DB migration.
- Print Partner reuses `advertiser_profiles` table -- no new profile table needed.
- Custom pricing is stored in `client_checkouts.line_items` JSON, not in the materials table.
- The public checkout page uses token-based access, no auth required.
- All existing advertiser workflows remain untouched -- this is purely additive.

