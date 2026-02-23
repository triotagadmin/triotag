import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin using anon client with user's token
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claimsData.claims.sub;

    // Use service role client for admin operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller has admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUserId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { agentProfileId } = await req.json();
    if (!agentProfileId) {
      return new Response(JSON.stringify({ error: "agentProfileId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[delete-agent] Admin ${callerUserId} deleting agent profile ${agentProfileId}`);

    // Get the agent profile to find user_id
    const { data: agentProfile, error: profileError } = await adminClient
      .from("publisher_profiles")
      .select("user_id, business_name, contact_email")
      .eq("id", agentProfileId)
      .eq("publisher_type", "agent")
      .single();

    if (profileError || !agentProfile) {
      return new Response(JSON.stringify({ error: "Agent profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const agentUserId = agentProfile.user_id;
    console.log(`[delete-agent] Found agent user_id: ${agentUserId}, email: ${agentProfile.contact_email}`);

    // 1. Delete agent's ad spaces
    const { error: adSpacesError } = await adminClient
      .from("ad_spaces")
      .delete()
      .eq("publisher_id", agentProfileId);
    if (adSpacesError) console.error("[delete-agent] Error deleting ad_spaces:", adSpacesError);

    // 2. Delete agent's services
    const { error: servicesError } = await adminClient
      .from("agent_services")
      .delete()
      .eq("publisher_id", agentProfileId);
    if (servicesError) console.error("[delete-agent] Error deleting agent_services:", servicesError);

    // 3. Delete agent's service files
    const { error: filesError } = await adminClient
      .from("agent_service_files")
      .delete()
      .eq("owner_id", agentUserId);
    if (filesError) console.error("[delete-agent] Error deleting agent_service_files:", filesError);

    // 4. Delete verification documents
    const { error: docsError } = await adminClient
      .from("verification_documents")
      .delete()
      .eq("publisher_id", agentProfileId);
    if (docsError) console.error("[delete-agent] Error deleting verification_documents:", docsError);

    // 5. Delete notifications for the agent
    const { error: notifsError } = await adminClient
      .from("notifications")
      .delete()
      .eq("user_id", agentUserId);
    if (notifsError) console.error("[delete-agent] Error deleting notifications:", notifsError);

    // 6. Delete messages
    const { error: msgsError } = await adminClient
      .from("messages")
      .delete()
      .or(`sender_id.eq.${agentUserId},recipient_id.eq.${agentUserId}`);
    if (msgsError) console.error("[delete-agent] Error deleting messages:", msgsError);

    // 7. Delete user role
    const { error: roleError } = await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", agentUserId);
    if (roleError) console.error("[delete-agent] Error deleting user_roles:", roleError);

    // 8. Delete publisher profile
    const { error: profileDelError } = await adminClient
      .from("publisher_profiles")
      .delete()
      .eq("id", agentProfileId);
    if (profileDelError) console.error("[delete-agent] Error deleting publisher_profiles:", profileDelError);

    // 9. Delete auth user (removes credentials entirely)
    const { error: authError } = await adminClient.auth.admin.deleteUser(agentUserId);
    if (authError) {
      console.error("[delete-agent] Error deleting auth user:", authError);
      return new Response(JSON.stringify({ error: "Failed to delete auth user", details: authError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[delete-agent] Successfully deleted agent ${agentProfile.contact_email} (${agentUserId})`);

    return new Response(
      JSON.stringify({ success: true, message: `Agent ${agentProfile.contact_email} has been permanently deleted` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[delete-agent] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
