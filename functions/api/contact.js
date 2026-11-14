// Cloudflare Pages Function: receives the contact form and emails it to the office
// through Resend. Needs the RESEND_API_KEY variable in the Pages project settings.
// Optional variables: MAIL_TO (recipient) and MAIL_FROM (sender shown in the inbox).

const DEFAULT_TO = 'office@altynzaman-im.com';
const DEFAULT_FROM = 'Altyn Zaman website <onboarding@resend.dev>';

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // Hidden field that people never see; only bots fill it in.
  if (data.website) return json({ ok: true });

  const email = String(data.email || '').trim();
  const message = String(data.message || '').trim();

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }
  if (!message || message.length > 5000) {
    return json({ ok: false, error: 'invalid_message' }, 400);
  }
  if (!env.RESEND_API_KEY) {
    return json({ ok: false, error: 'not_configured' }, 500);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.MAIL_FROM || DEFAULT_FROM,
      to: [env.MAIL_TO || DEFAULT_TO],
      reply_to: email,
      subject: 'Website message from ' + email,
      text: 'From: ' + email + '\n\n' + message
    })
  });

  if (!res.ok) return json({ ok: false, error: 'send_failed' }, 502);
  return json({ ok: true });
}
