/* MNG Summit — newsletter subscribe handler
   Receives a JSON POST from the footer newsletter form, sends a welcome
   email to the subscriber and a notification to the team via Resend so
   signups land in the team inbox for tracking. Runs as a Netlify Function.

   Requires the environment variable RESEND_API_KEY (already set in the
   Netlify dashboard for the apply.mjs function — reused here).
*/

const FROM = 'MNG Summit <noreply@mngsummit.org>';
const TEAM = 'contact@mngsummit.org';

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function isLikelyEmail(s) {
  return typeof s === 'string'
    && s.length > 3 && s.length < 254
    && s.indexOf('@') > 0
    && s.indexOf('.') > s.indexOf('@');
}

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  const key = process.env.RESEND_API_KEY;
  if (!key) return json({ ok: false, error: 'RESEND_API_KEY is not set' }, 500);

  let data = {};
  try { data = await req.json(); } catch (e) { /* empty body */ }

  const email = String(data.email || '').trim();
  const source = String(data.source || 'website footer').slice(0, 120);
  const referrer = String(data.referrer || '').slice(0, 200);

  if (!isLikelyEmail(email)) {
    return json({ ok: false, error: 'A valid email is required' }, 400);
  }

  const send = (payload) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const welcomeText = ''
    + 'You are on the list.\n\n'
    + 'MNG Summit is a year-round community of programs for the global Mongolian diaspora — '
    + 'a flagship summit every fall, a speech competition over a decade old, a digital '
    + 'platform, and a permanent NYC chapter from 2026.\n\n'
    + 'You will hear from us weekly on Wednesdays. We keep it short — events, opportunities, '
    + 'and the people building it. Unsubscribe anytime by replying to this email.\n\n'
    + 'Until next time,\n'
    + 'The MNG Summit team\n\n'
    + 'mngsummit.org · 501(c)(3) non-profit · volunteer-run since 2014';

  const welcomeHtml = ''
    + '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#0A0A0A;max-width:560px;line-height:1.55;">'
    +   '<h1 style="font-size:24px;font-weight:900;letter-spacing:-.02em;margin:0 0 16px;">You are on the list.</h1>'
    +   '<p style="margin:0 0 16px;font-size:15px;">MNG Summit is a year-round community of programs for the global Mongolian diaspora — a flagship summit every fall, a speech competition over a decade old, a digital platform, and a permanent NYC chapter from 2026.</p>'
    +   '<p style="margin:0 0 16px;font-size:15px;">You will hear from us <b>weekly on Wednesdays</b>. We keep it short — events, opportunities, and the people building it. Unsubscribe anytime by replying.</p>'
    +   '<p style="margin:24px 0 0;font-size:13px;color:#5A5A5A;">Until next time,<br/>The MNG Summit team</p>'
    +   '<hr style="border:0;border-top:1px solid #E5E5E5;margin:24px 0;" />'
    +   '<p style="margin:0;font-size:11px;color:#9A9A9A;letter-spacing:.04em;">'
    +     '<a href="https://mngsummit.org" style="color:#9A9A9A;text-decoration:none;">mngsummit.org</a> · '
    +     '501(c)(3) non-profit · volunteer-run since 2014'
    +   '</p>'
    + '</div>';

  const teamText = 'New newsletter signup\n\n'
    + 'Email: ' + email + '\n'
    + 'Source: ' + source + '\n'
    + (referrer ? 'Referrer: ' + referrer + '\n' : '')
    + 'When: ' + new Date().toISOString() + '\n\n'
    + '— mngsummit.org';

  const teamHtml = ''
    + '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#0A0A0A;font-size:14px;line-height:1.5;">'
    +   '<p style="margin:0 0 12px;"><b>New newsletter signup</b></p>'
    +   '<table style="border-collapse:collapse;font-size:13px;">'
    +     '<tr><td style="padding:4px 12px 4px 0;color:#5A5A5A;">Email</td><td style="padding:4px 0;"><a href="mailto:' + escapeHtml(email) + '">' + escapeHtml(email) + '</a></td></tr>'
    +     '<tr><td style="padding:4px 12px 4px 0;color:#5A5A5A;">Source</td><td style="padding:4px 0;">' + escapeHtml(source) + '</td></tr>'
    +     (referrer ? '<tr><td style="padding:4px 12px 4px 0;color:#5A5A5A;">Referrer</td><td style="padding:4px 0;">' + escapeHtml(referrer) + '</td></tr>' : '')
    +     '<tr><td style="padding:4px 12px 4px 0;color:#5A5A5A;">When</td><td style="padding:4px 0;">' + new Date().toISOString() + '</td></tr>'
    +   '</table>'
    + '</div>';

  try {
    // 1. Welcome to the subscriber
    await send({
      from: FROM,
      to: [email],
      subject: 'Welcome to MNG Summit',
      text: welcomeText,
      html: welcomeHtml
    });
    // 2. Notification to the team (so signups are trackable in the inbox)
    await send({
      from: FROM,
      to: [TEAM],
      reply_to: email,
      subject: 'New newsletter signup: ' + email,
      text: teamText,
      html: teamHtml
    });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'Email send failed' }, 502);
  }
};
