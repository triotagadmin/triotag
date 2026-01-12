-- Fix activations RLS policies for publishers (publisher_id stores publisher_profiles.id)

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.activations ENABLE ROW LEVEL SECURITY;

-- Replace incorrect publisher policies that compared publisher_id to publisher_profiles.user_id
DROP POLICY IF EXISTS "Publishers can view activations for their spaces" ON public.activations;
CREATE POLICY "Publishers can view activations for their spaces"
ON public.activations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.publisher_profiles pp
    WHERE pp.id = activations.publisher_id
      AND pp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Publishers can update activations for their spaces" ON public.activations;
CREATE POLICY "Publishers can update activations for their spaces"
ON public.activations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.publisher_profiles pp
    WHERE pp.id = activations.publisher_id
      AND pp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.publisher_profiles pp
    WHERE pp.id = activations.publisher_id
      AND pp.user_id = auth.uid()
  )
);
