/* MNG Summit — application intake handler
   Receives a JSON POST from the get-involved.html intake wizards,
   sends a confirmation email to the applicant and a notification to
   the team via Resend. Runs as a Netlify Function.

   Requires the environment variable RESEND_API_KEY (set it in the
   Netlify dashboard — never commit the key to the repo).
*/

const FROM = 'MNG Summit <noreply@mngsummit.org>';
const TEAM = 'contact@mngsummit.org';

const LABELS = {
  'sp-name': 'Name', 'sp-email': 'Email', 'sp-link': 'LinkedIn / resume',
  'sp-role': 'Role', 'sp-topic': 'Talk', 'sp-format': 'Format',
  'vol-name': 'Name', 'vol-email': 'Email', 'vol-link': 'LinkedIn / resume',
  'vol-city': 'City / timezone', 'vol-area': 'Area', 'vol-why': 'Why MNG Summit'
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  const key = process.env.RESEND_API_KEY;
  if (!key) return json({ ok: false, error: 'RESEND_API_KEY is not set' }, 500);

  let data = {};
  try { data = await req.json(); } catch (e) { /* empty body */ }

  const kind = data.form === 'speaker' ? 'speaker application'
    : data.form === 'volunteer' ? 'volunteer application'
    : 'application';
  const name = data['sp-name'] || data['vol-name'] || 'there';
  const email = data['sp-email'] || data['vol-email'] || '';

  const summary = Object.keys(data)
    .filter((k) => k !== 'form' && String(data[k] || '').trim())
    .map((k) => (LABELS[k] || k) + ': ' + data[k])
    .join('\n');

  const send = (payload) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  try {
    // 1. Confirmation to the applicant
    if (email) {
      await send({
        from: FROM,
        to: [email],
        subject: 'We received your ' + kind + ' — MNG Summit',
        text: 'Hi ' + name + ',\n\n'
          + 'Thanks for your ' + kind + ' to MNG Summit. We have it, and the team '
          + 'will be in touch soon.\n\nUnited for impact,\nThe MNG Summit team'
      });
    }
    // 2. Notification to the team
    await send({
      from: FROM,
      to: [TEAM],
      reply_to: email || undefined,
      subject: 'New ' + kind + ': ' + name,
      text: (summary || 'New submission.') + '\n\n— mngsummit.org'
    });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'Email send failed' }, 502);
  }
};
