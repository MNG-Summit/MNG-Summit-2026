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
  if (!key) {
    console.error('RESEND_API_KEY env var not set in Netlify — function cannot send mail');
    return json({
      ok: false,
      error: "We couldn't sign you up right now. Please email contact@mngsummit.org directly."
    }, 503);
  }

  let data = {};
  try { data = await req.json(); } catch (e) { /* empty body */ }

  const email = String(data.email || '').trim();
  const source = String(data.source || 'website footer').slice(0, 120);
  const referrer = String(data.referrer || '').slice(0, 200);

  // Optional richer fields collected from the early-list modal
  const name = String(data.name || '').trim().slice(0, 120);
  const linkedin = String(data.linkedin || '').trim().slice(0, 200);
  const city = String(data.city || '').trim().slice(0, 120);
  const industry = String(data.industry || '').trim().slice(0, 120);
  const hoping = String(data.hoping || '').trim().slice(0, 500);

  // Whether this signup came from an "early list" entry point (vs. the footer
  // newsletter). Declared here so it's available to the welcome-email builder
  // below as well as the team-notification builder further down.
  const isEarlyList = /early/i.test(source);

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

  // Branded shell — yellow header bar + dark headline + body + footer
  // (matches apply.mjs and the website design system)
  const welcomeTitle = isEarlyList
    ? 'You\'re on <em style="font-style:italic;color:#1A3B8B;font-weight:900;">the early list.</em>'
    : 'You\'re on <em style="font-style:italic;color:#1A3B8B;font-weight:900;">the list.</em>';
  const welcomeHtml = ''
    + '<!doctype html><html><body style="margin:0;padding:0;background:#F4ECD8;">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4ECD8;padding:32px 16px;">'
    +   '<tr><td align="center">'
    +     '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:20px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">'
    +       '<tr><td style="background:#F5B71A;padding:24px 32px;">'
    +         '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'
    +           '<tr>'
    +             '<td style="font-size:13px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#0A0A0A;">MNG Summit</td>'
    +             '<td align="right" style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#0A0A0A;">Vol. XII · 2026</td>'
    +           '</tr>'
    +         '</table>'
    +       '</td></tr>'
    +       '<tr><td style="padding:36px 32px 12px;">'
    +         '<h1 style="margin:0;font-size:30px;font-weight:900;line-height:1.05;letter-spacing:-.02em;color:#0A0A0A;">' + welcomeTitle + '</h1>'
    +       '</td></tr>'
    +       '<tr><td style="padding:8px 32px 24px;font-size:15px;line-height:1.65;color:#3A3A3A;">'
    +         '<p style="margin:0 0 14px;">MNG Summit is a year-round community of programs for the global Mongolian diaspora — a flagship summit every fall, a speech competition over a decade old, a digital platform, and a permanent NYC chapter from 2026.</p>'
    +         '<p style="margin:0 0 14px;">You\'ll hear from us <b style="color:#0A0A0A;">weekly on Wednesdays</b>. We keep it short — events, opportunities, and the people building the room. Unsubscribe any time by replying.</p>'
    +         '<p style="margin:18px 0 0;color:#5A5A5A;">Until next time,<br/>The MNG Summit team</p>'
    +       '</td></tr>'
    +       '<tr><td style="padding:0 32px;"><div style="border-top:1px solid #E5E5E5;"></div></td></tr>'
    +       '<tr><td style="padding:18px 32px 28px;font-size:11px;color:#9A9A9A;letter-spacing:.04em;line-height:1.6;">'
    +         '<a href="https://mngsummit.org" style="color:#9A9A9A;text-decoration:none;">mngsummit.org</a>'
    +         ' · 501(c)(3) non-profit · volunteer-run since 2014<br/>'
    +         'NYC · Oct 9–11, 2026 · Human Intelligence over Artificial Intelligence'
    +       '</td></tr>'
    +     '</table>'
    +   '</td></tr>'
    + '</table>'
    + '</body></html>';

  const headline = isEarlyList ? 'New early-list signup' : 'New newsletter signup';

  // Build text lines + HTML rows from whatever fields the user filled in
  const fields = [
    ['Name', name],
    ['Email', email],
    ['LinkedIn', linkedin],
    ['City', city],
    ['Industry', industry],
    ['Hoping to find', hoping],
    ['Source', source],
    ['Referrer', referrer],
    ['When', new Date().toISOString()]
  ].filter(([, v]) => v);

  const teamText = headline + '\n\n'
    + fields.map(([k, v]) => k + ': ' + v).join('\n')
    + '\n\n— mngsummit.org';

  const teamHtml = ''
    + '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#0A0A0A;font-size:14px;line-height:1.5;">'
    +   '<p style="margin:0 0 12px;"><b>' + headline + '</b></p>'
    +   '<table style="border-collapse:collapse;font-size:13px;">'
    +     fields.map(([k, v]) => {
            const val = (k === 'Email')
              ? '<a href="mailto:' + escapeHtml(v) + '">' + escapeHtml(v) + '</a>'
              : escapeHtml(v);
            return '<tr><td style="padding:4px 12px 4px 0;color:#5A5A5A;vertical-align:top;">' + k + '</td>'
                 + '<td style="padding:4px 0;">' + val + '</td></tr>';
          }).join('')
    +   '</table>'
    + '</div>';

  try {
    // 1. Welcome to the subscriber
    await send({
      from: FROM,
      to: [email],
      subject: isEarlyList
        ? "You're on the MNG Summit 2026 early list"
        : 'Welcome to MNG Summit',
      text: welcomeText,
      html: welcomeHtml
    });
    // 2. Notification to the team (so signups are trackable in the inbox)
    await send({
      from: FROM,
      to: [TEAM],
      reply_to: email,
      subject: (isEarlyList ? 'Early list: ' : 'Subscribe: ') + (name || email),
      text: teamText,
      html: teamHtml
    });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'Email send failed' }, 502);
  }
};
