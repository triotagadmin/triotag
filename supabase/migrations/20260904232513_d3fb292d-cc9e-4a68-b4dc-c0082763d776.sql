ALTER TABLE public.ad_spaces DISABLE TRIGGER USER;
UPDATE public.ad_spaces
SET tenant_id = (SELECT id FROM public.tenants WHERE code='T001'),
    agent_id = '436f0ac5-1fa6-4b05-ab39-5f4326fa2a3a'
WHERE publisher_id = '1a3501d9-54bd-4344-be50-3d24a5d41ea3';
ALTER TABLE public.ad_spaces ENABLE TRIGGER USER;