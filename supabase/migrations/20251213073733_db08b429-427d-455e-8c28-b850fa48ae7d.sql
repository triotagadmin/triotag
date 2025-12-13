-- The existing admin DELETE policies should already exist, but let's verify they work
-- Drop and recreate admin delete policies to ensure they're correct

-- For ad_spaces - admin delete policy already exists, skip
-- For agent_services - admin delete policy already exists, skip  
-- For campaigns - admin delete policy already exists, skip

-- The issue might be that admin policies exist but aren't being matched
-- Let's check by querying - actually the policies show "Admins can delete" for all tables

-- The real issue: the handleDelete uses the Supabase client which authenticates as the logged-in user
-- The admin needs to have the admin role properly set

-- No schema changes needed - the RLS policies already allow admins to delete
-- The issue is likely in the frontend code or the admin role check

SELECT 1; -- No-op migration since policies already exist