
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path TO public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path TO public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path TO public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path TO public, pgmq;

DO $$
DECLARE
  fn record;
  internal_names text[] := ARRAY[
    -- trigger functions
    'assign_tenant_ownership','email_queue_wake','enforce_single_webmaster','guard_ad_space_approval',
    'handle_new_admin','handle_new_advertiser','handle_new_agent','handle_new_print_partner',
    'handle_new_publisher','handle_new_user_profile','handle_new_user_role','limit_agent_photos',
    'link_pending_listings','log_ad_space_submission','notify_admins_new_advertiser_print_order',
    'notify_admins_new_print_order','seed_print_partner_materials','update_updated_at_column',
    'update_venue_updated_at_column',
    -- server-only helpers
    'enqueue_email','read_email_batch','delete_email','move_to_dlq','email_queue_dispatch','log_audit'
  ];
  anon_only_names text[] := ARRAY[
    'check_cross_branch_duplicate','upsert_advertiser_branch','get_client_checkout_by_token'
  ];
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    IF fn.proname = ANY(internal_names) THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
    ELSIF fn.proname = ANY(anon_only_names) THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn.sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn.sig);
    END IF;
  END LOOP;
END $$;
