-- Create conversations table for messaging system
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id uuid NOT NULL,
  participant_2_id uuid NOT NULL,
  last_message_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(participant_1_id, participant_2_id)
);

-- Create conversation_messages table
CREATE TABLE public.conversation_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  notification_reference_id uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create issue_reports table for "Report Issue to Admin"
CREATE TABLE public.issue_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can create conversations they participate in"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can update their own conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Conversation messages policies
CREATE POLICY "Users can view messages in their conversations"
ON public.conversation_messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their conversations"
ON public.conversation_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT id FROM conversations
    WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages (mark as read)"
ON public.conversation_messages FOR UPDATE
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
  )
);

-- Issue reports policies
CREATE POLICY "Users can view their own issue reports"
ON public.issue_reports FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create issue reports"
ON public.issue_reports FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update issue reports"
ON public.issue_reports FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Notifications policy for deleting own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());

-- Enable realtime for messages and conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;