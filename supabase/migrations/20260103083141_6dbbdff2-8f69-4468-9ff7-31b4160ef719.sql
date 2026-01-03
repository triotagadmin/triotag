-- Add compliance and campaign details fields to activations table
ALTER TABLE public.activations 
ADD COLUMN IF NOT EXISTS campaign_objective text,
ADD COLUMN IF NOT EXISTS brand_category text,
ADD COLUMN IF NOT EXISTS competitive_conflict_declaration text,
ADD COLUMN IF NOT EXISTS creative_compliance_confirmed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS restricted_content text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS legal_permissions_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sensitive_theme_flag text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS campaign_manager_name text,
ADD COLUMN IF NOT EXISTS campaign_manager_email text,
ADD COLUMN IF NOT EXISTS campaign_manager_phone text,
ADD COLUMN IF NOT EXISTS onsite_installation_contact text,
ADD COLUMN IF NOT EXISTS emergency_contact text,
ADD COLUMN IF NOT EXISTS require_installation_photos boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS require_proof_of_play boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reporting_frequency text DEFAULT 'end-of-campaign',
ADD COLUMN IF NOT EXISTS estimated_publisher_payout numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS compliance_completed boolean DEFAULT false;