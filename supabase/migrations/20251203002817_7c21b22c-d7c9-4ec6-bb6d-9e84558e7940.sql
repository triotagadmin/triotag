-- Create QR code analytics table
CREATE TABLE public.qr_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    destination_url text NOT NULL,
    short_code text UNIQUE NOT NULL,
    name text,
    created_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true
);

-- Create QR code scans table for analytics
CREATE TABLE public.qr_code_scans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_id uuid REFERENCES public.qr_codes(id) ON DELETE CASCADE NOT NULL,
    scanned_at timestamp with time zone DEFAULT now(),
    device_type text,
    browser text,
    operating_system text,
    country text,
    city text,
    ip_hash text,
    user_agent text,
    referrer text
);

-- Enable RLS
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_code_scans ENABLE ROW LEVEL SECURITY;

-- QR codes policies - anyone can create and view their own, public can view for scanning
CREATE POLICY "Anyone can create QR codes" ON public.qr_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own QR codes" ON public.qr_codes FOR SELECT USING (created_by = auth.uid() OR created_by IS NULL);
CREATE POLICY "Public can view QR codes for scanning" ON public.qr_codes FOR SELECT USING (is_active = true);
CREATE POLICY "Users can update their own QR codes" ON public.qr_codes FOR UPDATE USING (created_by = auth.uid() OR created_by IS NULL);

-- QR scans policies - anyone can insert scans, users can view scans for their QR codes
CREATE POLICY "Anyone can record scans" ON public.qr_code_scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view scans for their QR codes" ON public.qr_code_scans FOR SELECT 
    USING (qr_code_id IN (SELECT id FROM public.qr_codes WHERE created_by = auth.uid() OR created_by IS NULL));

-- Create indexes for performance
CREATE INDEX idx_qr_codes_short_code ON public.qr_codes(short_code);
CREATE INDEX idx_qr_code_scans_qr_code_id ON public.qr_code_scans(qr_code_id);
CREATE INDEX idx_qr_code_scans_scanned_at ON public.qr_code_scans(scanned_at);