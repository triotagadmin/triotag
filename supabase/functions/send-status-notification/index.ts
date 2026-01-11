import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  recipientEmail: string;
  recipientName: string;
  submissionType: string;
  status: string;
  rejectionReason?: string;
  requestedInfo?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { userId, recipientEmail, recipientName, submissionType, status, rejectionReason, requestedInfo }: NotificationRequest = await req.json();

    let subject = "";
    let message = "";
    let notificationTitle = "";
    let notificationType = "";

    if (status === "approved" || status === "verified") {
      subject = `${submissionType} Approved! 🎉`;
      message = `Congratulations ${recipientName}! Your ${submissionType} has been approved and is now live on the platform.`;
      notificationTitle = `${submissionType} Approved`;
      notificationType = "approval";
    } else if (status === "rejected") {
      subject = `${submissionType} Update Required`;
      message = `Hello ${recipientName}, your ${submissionType} requires some updates. ${rejectionReason ? `Reason: ${rejectionReason}` : 'Please review and resubmit.'}`;
      notificationTitle = `${submissionType} Needs Updates`;
      notificationType = "rejection";
    } else if (requestedInfo) {
      subject = `More Information Needed for ${submissionType}`;
      message = `Hello ${recipientName}, we need additional information about your ${submissionType}: ${requestedInfo}`;
      notificationTitle = "Additional Information Requested";
      notificationType = "info_request";
    }

    // Dedupe safeguard: avoid sending multiple notifications for the same status update
    const dedupeSince = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: existingNotifications, error: existingError } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", notificationType)
      .eq("title", notificationTitle)
      .gte("created_at", dedupeSince)
      .limit(1);

    if (existingError) {
      console.error("Dedupe lookup error:", existingError);
    }

    if (existingNotifications && existingNotifications.length > 0) {
      return new Response(
        JSON.stringify({ success: true, deduped: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "TinyStickyAds <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <p style="color: #666; line-height: 1.6;">${message}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This is an automated message from TinyStickyAds platform.
          </p>
        </div>
      `,
    });

    console.log("Email sent:", emailResponse);

    // Create in-app notification
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title: notificationTitle,
        message: message,
        type: notificationType,
      });

    if (notificationError) {
      console.error("Notification creation error:", notificationError);
    }

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});