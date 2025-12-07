-- Allow anyone to view approved advertiser profiles (needed for campaigns display)
CREATE POLICY "Anyone can view approved advertiser profiles" 
ON public.advertiser_profiles 
FOR SELECT 
USING (status = 'approved'::approval_status);

-- Create messages table for communication between accounts
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  listing_id UUID,
  listing_type TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can update messages they received (mark as read)
CREATE POLICY "Users can update messages they received"
ON public.messages
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Users can delete messages they sent or received
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);