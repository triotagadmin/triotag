-- Create activation status enum
CREATE TYPE public.activation_status AS ENUM ('design', 'pending_approval', 'approved', 'printing', 'payment_pending', 'completed', 'rejected');

-- Create activation type enum for color coding
CREATE TYPE public.activation_type AS ENUM ('sticker', 'table_tent', 'poster', 'flyer', 'banner', 'other');

-- Create activations table
CREATE TABLE public.activations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_space_id uuid NOT NULL REFERENCES public.ad_spaces(id) ON DELETE CASCADE,
    advertiser_id uuid NOT NULL,
    publisher_id uuid NOT NULL,
    status activation_status NOT NULL DEFAULT 'design',
    activation_type activation_type DEFAULT 'other',
    ad_design_url text,
    ad_unit_sku text,
    start_date date,
    end_date date,
    quantity integer DEFAULT 100,
    print_order_id text,
    rejection_reason text,
    total_amount numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activations

-- Advertisers can view their own activations
CREATE POLICY "Advertisers can view own activations"
ON public.activations FOR SELECT
USING (advertiser_id = auth.uid());

-- Advertisers can insert their own activations
CREATE POLICY "Advertisers can insert own activations"
ON public.activations FOR INSERT
WITH CHECK (advertiser_id = auth.uid());

-- Advertisers can update their own activations
CREATE POLICY "Advertisers can update own activations"
ON public.activations FOR UPDATE
USING (advertiser_id = auth.uid());

-- Publishers can view activations for their ad spaces
CREATE POLICY "Publishers can view activations for their spaces"
ON public.activations FOR SELECT
USING (
    publisher_id IN (
        SELECT pp.user_id FROM publisher_profiles pp WHERE pp.user_id = auth.uid()
    )
);

-- Publishers can update activations for their ad spaces (for approval)
CREATE POLICY "Publishers can update activations for their spaces"
ON public.activations FOR UPDATE
USING (
    publisher_id IN (
        SELECT pp.user_id FROM publisher_profiles pp WHERE pp.user_id = auth.uid()
    )
);

-- Admins can view all activations
CREATE POLICY "Admins can view all activations"
ON public.activations FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all activations
CREATE POLICY "Admins can update all activations"
ON public.activations FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_activations_updated_at
    BEFORE UPDATE ON public.activations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for activations
ALTER PUBLICATION supabase_realtime ADD TABLE public.activations;