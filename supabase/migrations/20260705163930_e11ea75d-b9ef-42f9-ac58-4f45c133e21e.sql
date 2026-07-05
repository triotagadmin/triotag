
ALTER TABLE public.publisher_profiles
  ADD COLUMN IF NOT EXISTS managed_by_agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.publisher_profiles
  ALTER COLUMN user_id DROP NOT NULL;

-- publisher_profiles agent policies
CREATE POLICY "Agents can view their managed clients"
  ON public.publisher_profiles FOR SELECT
  USING (managed_by_agent_id = auth.uid());

CREATE POLICY "Agents can update their managed clients"
  ON public.publisher_profiles FOR UPDATE
  USING (managed_by_agent_id = auth.uid());

CREATE POLICY "Agents can insert clients they manage"
  ON public.publisher_profiles FOR INSERT
  WITH CHECK (managed_by_agent_id = auth.uid());

-- ad_spaces agent policies
CREATE POLICY "Agents can view managed clients' ad spaces"
  ON public.ad_spaces FOR SELECT
  USING (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE managed_by_agent_id = auth.uid()));

CREATE POLICY "Agents can insert managed clients' ad spaces"
  ON public.ad_spaces FOR INSERT
  WITH CHECK (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE managed_by_agent_id = auth.uid()));

CREATE POLICY "Agents can update managed clients' ad spaces"
  ON public.ad_spaces FOR UPDATE
  USING (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE managed_by_agent_id = auth.uid()));

-- retailer_creatives agent policies
CREATE POLICY "Agents can view managed clients' creatives"
  ON public.retailer_creatives FOR SELECT
  USING (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE managed_by_agent_id = auth.uid()));

CREATE POLICY "Agents can insert managed clients' creatives"
  ON public.retailer_creatives FOR INSERT
  WITH CHECK (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE managed_by_agent_id = auth.uid()));

CREATE POLICY "Agents can update managed clients' creatives"
  ON public.retailer_creatives FOR UPDATE
  USING (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE managed_by_agent_id = auth.uid()));

-- house_ad_schedules agent policies
CREATE POLICY "Agents can view managed clients' house ads"
  ON public.house_ad_schedules FOR SELECT
  USING (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE managed_by_agent_id = auth.uid()));

CREATE POLICY "Agents can insert managed clients' house ads"
  ON public.house_ad_schedules FOR INSERT
  WITH CHECK (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE managed_by_agent_id = auth.uid()));

CREATE POLICY "Agents can update managed clients' house ads"
  ON public.house_ad_schedules FOR UPDATE
  USING (publisher_id IN (SELECT id FROM public.publisher_profiles WHERE managed_by_agent_id = auth.uid()));
