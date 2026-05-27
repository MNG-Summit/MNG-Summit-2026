/* MNG Summit — get-involved application handler
   Receives JSON POSTs from the get-involved.html modal forms (attend,
   speak, mentor, volunteer, contact), sends a branded confirmation email
   to the applicant and a notification to the team via Resend.

   Requires env var RESEND_API_KEY (set in Netlify dashboard).
*/

const FROM = 'MNG Summit <noreply@mngsummit.org>';
const TEAM = 'contact@mngsummit.org';
const REPLY_TO = 'contact@mngsummit.org';

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

// Form-type configs — confirmation copy + field labels.
// All emails share the same branded shell (see emailShell below).
const FORM_CONFIG = {
  attend: {
    label: 'early-list signup',
    confirmSubject: "You're on the MNG Summit 2026 early list",
    confirmTitle: 'You\'re on <em>the early list.</em>',
    confirmBody: 'Three days, 100 seats, NYC, October 9–11, 2026. When we open ticket sales, the early list hears first — before public release.\n\nIn the meantime, we send a short note every Wednesday. Events, opportunities, and the people building the room. Reply to this email any time to unsubscribe.\n\nUntil October,\nThe MNG Summit team',
    teamSubject: function (n) { return 'Early list: ' + n; }
  },
  speak: {
    label: 'speaker application',
    confirmSubject: 'We received your speaker application — MNG Summit',
    confirmTitle: 'Speaker application <em>received.</em>',
    confirmBody: "Thanks for raising your hand to take the stage at MNG Summit 2026. We close the call for speakers by June 2026, and the program committee reviews every application personally.\n\nYou'll hear back from us with next steps — whether that's a follow-up call, a request for more material, or scheduling. Expect a reply within two weeks of submission.\n\nIf you've got supporting material (deck, recording, prior talks), feel free to reply to this email with it.\n\nGratefully,\nThe MNG Summit program committee",
    teamSubject: function (n) { return 'Speaker app: ' + n; }
  },
  mentor: {
    label: 'mentor intake',
    confirmSubject: 'Mentor intake received — MNG Summit',
    confirmTitle: 'Welcome to the <em>mentor pool.</em>',
    confirmBody: 'Thanks for stepping up. Mentor matching is hand-curated — we pair mentors and mentees by industry, career stage, and time-zone, in cohorts of three months.\n\nThe next matching cycle opens with the Digital Platform launch in 2026. We\'ll reach out when matching begins, with a short scheduling call to confirm your availability and area focus.\n\nReply to this email if anything changes about your availability between now and then.\n\nThank you,\nThe MNG Summit team',
    teamSubject: function (n) { return 'Mentor intake: ' + n; }
  },
  volunteer: {
    label: 'volunteer intake',
    confirmSubject: 'Welcome to the MNG Summit volunteer crew',
    confirmTitle: 'Welcome to <em>the crew.</em>',
    confirmBody: "MNG Summit runs on volunteers. Every event, every program, every newsletter — it's the volunteers who make it happen. Thank you for raising your hand.\n\nA program lead will reach out within a week with intake details: how we work, what we need most right now, and which crew best matches your skills. Expect ~4 hrs/week, flexible scheduling, lots of Slack.\n\nIf urgent, you can also reply directly to this email.\n\nUnited for impact,\nThe MNG Summit working board",
    teamSubject: function (n) { return 'Volunteer intake: ' + n; }
  },
  contact: {
    label: 'message',
    confirmSubject: 'We got your message — MNG Summit',
    confirmTitle: 'Message <em>received.</em>',
    confirmBody: "We saw it, and a real person on the working board will reply — usually within 48 hours.\n\nIf this is time-sensitive (sponsorship deadline, venue logistics, press request), reply to this email and flag it in the subject.\n\nThanks for reaching out,\nThe MNG Summit team",
    teamSubject: function (n) { return 'Inquiry: ' + n; }
  }
};

// Human-friendly label mapping for the team-notification table
const FIELD_LABELS = {
  name: 'Name',
  email: 'Email',
  linkedin: 'LinkedIn',
  city: 'City',
  industry: 'Industry',
  hoping: 'Hoping to find',
  format: 'Format',
  topic: 'Topic',
  pitch: '1-line pitch',
  stage: 'Career stage',
  location: 'City / time-zone',
  skills: 'Skills / areas',
  hours: 'Hours per week',
  notes: 'Notes',
  message: 'Message',
  role: 'Role',
  area: 'Area'
};

// ===== Email shell — shared branded chrome for all confirmations =====
function emailShell(opts) {
  // opts: { title, bodyHtml, ctaUrl?, ctaLabel? }
  const cta = (opts.ctaUrl && opts.ctaLabel)
    ? '<tr><td style="padding:0 32px 32px;">'
      + '<a href="' + opts.ctaUrl + '" style="display:inline-block;background:#0A0A0A;color:#F5B71A;text-decoration:none;font-size:13px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;padding:14px 22px;border-radius:999px;">'
      + opts.ctaLabel + '</a></td></tr>'
    : '';

  return ''
    + '<!doctype html><html><body style="margin:0;padding:0;background:#F4ECD8;">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4ECD8;padding:32px 16px;">'
    +   '<tr><td align="center">'
    +     '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:20px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">'

    // Yellow header bar
    +       '<tr><td style="background:#F5B71A;padding:24px 32px;">'
    +         '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">'
    +           '<tr>'
    +             '<td style="font-size:13px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#0A0A0A;">MNG Summit</td>'
    +             '<td align="right" style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#0A0A0A;">Vol. XII · 2026</td>'
    +           '</tr>'
    +         '</table>'
    +       '</td></tr>'

    // Headline
    +       '<tr><td style="padding:36px 32px 12px;">'
    +         '<h1 style="margin:0;font-size:30px;font-weight:900;line-height:1.05;letter-spacing:-.02em;color:#0A0A0A;">'
    +           opts.title
    +         '</h1>'
    +       '</td></tr>'

    // Body
    +       '<tr><td style="padding:8px 32px 24px;font-size:15px;line-height:1.65;color:#3A3A3A;">'
    +         opts.bodyHtml
    +       '</td></tr>'

    + cta

    // Hairline divider
    +       '<tr><td style="padding:0 32px;"><div style="border-top:1px solid #E5E5E5;"></div></td></tr>'

    // Footer
    +       '<tr><td style="padding:18px 32px 28px;font-size:11px;color:#9A9A9A;letter-spacing:.04em;line-height:1.6;">'
    +         '<a href="https://mngsummit.org" style="color:#9A9A9A;text-decoration:none;">mngsummit.org</a>'
    +         ' · 501(c)(3) non-profit · volunteer-run since 2014<br/>'
    +         'NYC · Oct 9–11, 2026 · Human Intelligence over Artificial Intelligence'
    +       '</td></tr>'

    +     '</table>'
    +   '</td></tr>'
    + '</table>'
    + '</body></html>';
}

// Convert a body string (plain text with paragraphs separated by \n\n) into <p> blocks
function bodyToHtml(s) {
  return String(s).split(/\n\n+/).map(function (p) {
    return '<p style="margin:0 0 14px;">' + escapeHtml(p).replace(/\n/g, '<br/>') + '</p>';
  }).join('');
}

// Italic emphasis substitution: replace <em>text</em> tokens that come from confirmTitle
function renderTitle(s) {
  return s.replace(/<em>(.*?)<\/em>/g, '<em style="font-style:italic;color:#1A3B8B;font-weight:900;">$1</em>');
}

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('RESEND_API_KEY env var not set in Netlify — function cannot send mail');
    return json({
      ok: false,
      error: "We couldn't send right now. Please email contact@mngsummit.org directly."
    }, 503);
  }

  let data = {};
  try { data = await req.json(); } catch (e) { /* empty body */ }

  const formType = String(data.form || data.form_type || '').toLowerCase();
  const config = FORM_CONFIG[formType];
  if (!config) {
    return json({ ok: false, error: 'Unknown form type: ' + formType }, 400);
  }

  const name = String(data.name || '').trim().slice(0, 120);
  const email = String(data.email || '').trim();
  if (!isLikelyEmail(email)) {
    return json({ ok: false, error: 'A valid email is required' }, 400);
  }

  // Build the team-notification table from whatever fields the user submitted.
  const presentFields = Object.keys(data)
    .filter(function (k) { return k !== 'form' && k !== 'form_type' && k !== 'referrer' && k !== 'source'; })
    .filter(function (k) { return String(data[k] || '').trim().length > 0; });

  const send = function (payload) {
    return fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  };

  // ===== Confirmation email to applicant (branded shell) =====
  const confirmHtml = emailShell({
    title: renderTitle(config.confirmTitle),
    bodyHtml: bodyToHtml(config.confirmBody)
  });
  const confirmText = config.confirmTitle.replace(/<\/?em>/g, '') + '\n\n'
    + config.confirmBody + '\n\n'
    + 'mngsummit.org · 501(c)(3) non-profit · volunteer-run since 2014';

  // ===== Team-notification email (table of submitted fields) =====
  const tableRows = presentFields.map(function (k) {
    const label = FIELD_LABELS[k] || (k.charAt(0).toUpperCase() + k.slice(1));
    const val = String(data[k]);
    const cell = (k === 'email')
      ? '<a href="mailto:' + escapeHtml(val) + '" style="color:#1A3B8B;text-decoration:none;">' + escapeHtml(val) + '</a>'
      : (k === 'linkedin' && /^https?:\/\//i.test(val))
        ? '<a href="' + escapeHtml(val) + '" style="color:#1A3B8B;text-decoration:none;">' + escapeHtml(val) + '</a>'
        : escapeHtml(val);
    return '<tr>'
      + '<td style="padding:8px 16px 8px 0;color:#5A5A5A;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;vertical-align:top;white-space:nowrap;">' + label + '</td>'
      + '<td style="padding:8px 0;color:#0A0A0A;font-size:14px;line-height:1.5;">' + cell + '</td>'
      + '</tr>';
  }).join('');

  const teamHtml = emailShell({
    title: 'New ' + escapeHtml(config.label) + '.',
    bodyHtml: ''
      + '<p style="margin:0 0 14px;">From <b>' + escapeHtml(name || email) + '</b> via the get-involved form.</p>'
      + '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;margin-top:6px;">'
      + tableRows
      + '</table>'
  });
  const teamText = 'New ' + config.label + '\n\n'
    + presentFields.map(function (k) {
        const label = FIELD_LABELS[k] || k;
        return label + ': ' + String(data[k]);
      }).join('\n')
    + '\n\n— mngsummit.org';

  try {
    // 1. Confirmation to applicant
    await send({
      from: FROM,
      to: [email],
      reply_to: REPLY_TO,
      subject: config.confirmSubject,
      text: confirmText,
      html: confirmHtml
    });
    // 2. Notification to team
    await send({
      from: FROM,
      to: [TEAM],
      reply_to: email,
      subject: config.teamSubject(name || email),
      text: teamText,
      html: teamHtml
    });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'Email send failed' }, 502);
  }
};
