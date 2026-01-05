-- Add new activation status values for Ad Request workflow
ALTER TYPE public.activation_status ADD VALUE IF NOT EXISTS 'pending_submission';
ALTER TYPE public.activation_status ADD VALUE IF NOT EXISTS 'under_review';

-- Add columns to track Ad Request workflow details
ALTER TABLE public.activations 
ADD COLUMN IF NOT EXISTS reviewer_id UUID,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;