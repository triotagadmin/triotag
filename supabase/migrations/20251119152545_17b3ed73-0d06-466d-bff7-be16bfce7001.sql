-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'publisher');

-- Create publisher type enum
CREATE TYPE public.publisher_type AS ENUM ('venue', 'digital', 'agent');

-- Create agent role enum
CREATE TYPE public.agent_role AS ENUM ('guerrilla', 'influencer', 'model', 'artist');

-- Create approval status enum
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create publisher_profiles table
CREATE TABLE public.publisher_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    publisher_type publisher_type NOT NULL,
    agent_role agent_role,
    business_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    location TEXT,
    description TEXT,
    verification_status approval_status DEFAULT 'pending' NOT NULL,
    rejection_reason TEXT,
    social_media JSONB,
    portfolio_media JSONB,
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    CHECK (
        (publisher_type != 'agent') OR 
        (publisher_type = 'agent' AND agent_role IS NOT NULL)
    )
);

ALTER TABLE public.publisher_profiles ENABLE ROW LEVEL SECURITY;

-- Create verification_documents table
CREATE TABLE public.verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publisher_id UUID REFERENCES public.publisher_profiles(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- Create ad_spaces table
CREATE TABLE public.ad_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publisher_id UUID REFERENCES public.publisher_profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    media_urls JSONB,
    specifications JSONB,
    pricing JSONB,
    availability_status TEXT DEFAULT 'available',
    approval_status approval_status DEFAULT 'pending' NOT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.ad_spaces ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
    ON public.user_roles FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for publisher_profiles
CREATE POLICY "Publishers can view their own profile"
    ON public.publisher_profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
    ON public.publisher_profiles FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view approved profiles"
    ON public.publisher_profiles FOR SELECT
    TO authenticated
    USING (verification_status = 'approved');

CREATE POLICY "Publishers can insert their own profile"
    ON public.publisher_profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Publishers can update their own profile"
    ON public.publisher_profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update all profiles"
    ON public.publisher_profiles FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for verification_documents
CREATE POLICY "Publishers can view their own documents"
    ON public.verification_documents FOR SELECT
    TO authenticated
    USING (
        publisher_id IN (
            SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all documents"
    ON public.verification_documents FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Publishers can insert their own documents"
    ON public.verification_documents FOR INSERT
    TO authenticated
    WITH CHECK (
        publisher_id IN (
            SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for ad_spaces
CREATE POLICY "Publishers can view their own ad spaces"
    ON public.ad_spaces FOR SELECT
    TO authenticated
    USING (
        publisher_id IN (
            SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all ad spaces"
    ON public.ad_spaces FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view approved ad spaces"
    ON public.ad_spaces FOR SELECT
    TO authenticated
    USING (approval_status = 'approved');

CREATE POLICY "Publishers can insert their own ad spaces"
    ON public.ad_spaces FOR INSERT
    TO authenticated
    WITH CHECK (
        publisher_id IN (
            SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Publishers can update their own ad spaces"
    ON public.ad_spaces FOR UPDATE
    TO authenticated
    USING (
        publisher_id IN (
            SELECT id FROM public.publisher_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update all ad spaces"
    ON public.ad_spaces FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-documents', 'verification-documents', false);

-- Storage policies for verification documents
CREATE POLICY "Publishers can upload their own verification documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'verification-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Publishers can view their own verification documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'verification-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can view all verification documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'verification-documents' AND
        public.has_role(auth.uid(), 'admin')
    );

-- Create storage bucket for ad space media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ad-space-media', 'ad-space-media', true);

-- Storage policies for ad space media
CREATE POLICY "Publishers can upload ad space media"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'ad-space-media' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view ad space media"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'ad-space-media');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_publisher_profiles_updated_at
    BEFORE UPDATE ON public.publisher_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_spaces_updated_at
    BEFORE UPDATE ON public.ad_spaces
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();