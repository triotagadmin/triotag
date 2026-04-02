## Phase 1: Database Schema + Auth + Rename

### Part A: Rename "Advertiser" → "Brand Advertiser"
- Update all UI labels in Navigation, Auth, Dashboard pages
- Update brand.ts or create role display name mapping
- Keep internal role value as `advertiser` (no DB change needed)

### Part B: Print Partner Database Schema
Create these tables with RLS:
1. **print_partner_profiles** - company info, logo, service areas, approval status
2. **print_partner_clients** - CRM client records
3. **print_partner_campaigns** - campaign records with status workflow
4. **print_partner_campaign_locations** - branch/location entries per campaign
5. **print_partner_material_pricing** - custom pricing per material type
6. **print_partner_jobs** - job records linked to campaigns
7. **print_partner_branch_jobs** - per-branch job tracking
8. **print_partner_proofs** - proof of completion uploads
9. **print_partner_files** - artwork/file management
10. **print_partner_checkout_links** - tokenized public checkout pages

### Part C: Auth Flow Updates
- Add "Print Partner" option to signup form
- Create print_partner profile on signup via DB trigger update
- Add print_partner login routing → `/print-partner/dashboard`
- Add admin approval flow (pending status)
- Add print_partner nav items

### Part D: Basic Dashboard Shell
- Create `/print-partner/dashboard` with summary cards
- Create sidebar navigation layout
- Create placeholder pages for each module

### Future Phases (not in this batch):
- Phase 2: Client CRM + Campaign Builder
- Phase 3: Checkout Link Generator + PayMongo integration
- Phase 4: Job Management + Production Workflow
- Phase 5: Revenue Dashboard + Files + Settings
