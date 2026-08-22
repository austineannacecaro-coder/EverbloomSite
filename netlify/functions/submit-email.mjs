const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function serverError(message) {
  return Response.json({ error: message }, { status: 500 });
}

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(null, {
      status: 405,
      headers: { Allow: 'POST' }
    });
  }

  let email;
  try {
    ({ email } = await request.json());
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (
    typeof email !== 'string' ||
    email.length > 254 ||
    !emailPattern.test(email.trim())
  ) {
    return Response.json({ error: 'Invalid email address.' }, { status: 400 });
  }

  const {
    MAKE_WEBHOOK_URL,
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    EMAILJS_PUBLIC_KEY,
    EMAILJS_PRIVATE_KEY
  } = process.env;

  if (
    !MAKE_WEBHOOK_URL ||
    !EMAILJS_SERVICE_ID ||
    !EMAILJS_TEMPLATE_ID ||
    !EMAILJS_PUBLIC_KEY
  ) {
    return serverError('Email delivery is not configured.');
  }

  const templatePayload = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: EMAILJS_PUBLIC_KEY,
    template_params: { user_email: email.trim() }
  };

  if (EMAILJS_PRIVATE_KEY) {
    templatePayload.accessToken = EMAILJS_PRIVATE_KEY;
  }

  try {
    const [webhookResponse, emailResponse] = await Promise.all([
      fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      }),
      fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templatePayload)
      })
    ]);

    if (!webhookResponse.ok || !emailResponse.ok) {
      throw new Error('Email provider request failed.');
    }
  } catch (error) {
    console.error('Unable to submit email:', error);
    return serverError('Unable to submit email.');
  }

  return Response.json({ ok: true });
};
