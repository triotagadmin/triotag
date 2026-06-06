import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      toEmail,
      campaignName,
      campaignType,
      location,
      startDate,
      endDate,
      budget,
      isGuest,
    } = await req.json();

    if (!toEmail || !campaignName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const budgetDisplay =
      !budget || budget === 'Flexible'
        ? 'Flexible'
        : '₱' + Number(budget).toLocaleString();

    const detailsBlock = `
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;font-family:Arial,sans-serif;">
        <p style="margin:4px 0;"><strong>Campaign:</strong> ${campaignName}</p>
        <p style="margin:4px 0;"><strong>Type:</strong> ${campaignType}</p>
        <p style="margin:4px 0;"><strong>Location:</strong> ${location || '-'}</p>
        <p style="margin:4px 0;"><strong>Dates:</strong> ${startDate || '?'} → ${endDate || '?'}</p>
        <p style="margin:4px 0;"><strong>Budget:</strong> ${budgetDisplay}</p>
      </div>
    `;

    // 1) Confirmation to submitter
    await resend.emails.send({
      from: 'TrioTag <onboarding@resend.dev>',
      to: [toEmail],
      subject: `Your Campaign Request is Live — ${campaignName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
          <h2 style="color:#16a34a;">Campaign Request Submitted!</h2>
          <p>Your campaign request has been posted on the TrioTag Campaign Marketplace. Retailers and ad space owners with matching inventory will reach out to you at this email address.</p>
          ${detailsBlock}
          <p>When a retailer submits a proposal on your campaign, you will receive an email notification at this address. View your listing at <a href="https://triotag.com/campaigns">triotag.com/campaigns</a>.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#666;font-size:12px;">TrioTag · Micro Advertising · www.triotag.com</p>
        </div>
      `,
    });

    // 2) Internal notification
    await resend.emails.send({
      from: 'TrioTag <onboarding@resend.dev>',
      to: ['tinystickyads@gmail.com'],
      subject: `[TrioTag] New Campaign Request — ${campaignName} (${campaignType})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;">
          <h2>New Campaign Request</h2>
          <p><strong>Submitter:</strong> ${toEmail}</p>
          <p>${isGuest ? 'This was submitted by a guest user (email verified via OTP).' : 'Submitted by a registered user.'}</p>
          ${detailsBlock}
        </div>
      `,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('notify-campaign-submission error', err);
    return new Response(JSON.stringify({ error: err?.message || 'unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
