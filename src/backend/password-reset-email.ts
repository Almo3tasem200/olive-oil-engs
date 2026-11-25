import 'server-only';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] as string);
}

export function passwordResetIsConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
    process.env.RESEND_FROM_EMAIL &&
    /^[a-fA-F0-9]{64}$/.test(process.env.APP_ENCRYPTION_KEY ?? ''),
  );
}

export async function sendPasswordResetCode(email: string, name: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from || !passwordResetIsConfigured()) return false;

  const safeName = escapeHtml(name || '');
  const html = `<div style="font-family:Arial,sans-serif;color:#243323;line-height:1.6"><p>Hello${safeName ? ` ${safeName}` : ''},</p><p>Use this code to reset your El Mohandeseen Olive Oil account password:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>The code expires in 10 minutes and can only be used once. If you did not request a password reset, you can ignore this message.</p></div>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Your password reset code',
        html,
        text: `Hello${name ? ` ${name}` : ''}, your password reset code is ${code}. It expires in 10 minutes and can only be used once. If you did not request a reset, ignore this email.`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error('Password reset email delivery failed.');
      return false;
    }
    return true;
  } catch {
    console.error('Password reset email delivery failed.');
    return false;
  }
}
