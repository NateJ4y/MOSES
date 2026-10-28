import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function validEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'You must be signed in to send email.' }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return NextResponse.json({
      error: 'Outbound email is not configured yet. Set RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel, then redeploy.',
      code: 'EMAIL_PROVIDER_NOT_CONFIGURED',
    }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Email payload is required.' }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const to = payload.to;
  const subject = payload.subject;
  const message = payload.text;

  if (!validEmail(to)) {
    return NextResponse.json({ error: 'A valid recipient email is required.' }, { status: 400 });
  }
  if (typeof subject !== 'string' || !subject.trim() || subject.length > 240) {
    return NextResponse.json({ error: 'Subject is required and must be 240 characters or fewer.' }, { status: 400 });
  }
  if (typeof message !== 'string' || !message.trim() || message.length > 20000) {
    return NextResponse.json({ error: 'Email message is required and must be 20,000 characters or fewer.' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: subject.trim(),
        text: message,
        ...(validEmail(user.email) ? { reply_to: user.email } : {}),
      }),
      cache: 'no-store',
    });

    const result = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
    if (!response.ok) {
      return NextResponse.json({
        error: result.message || 'The email provider rejected the message.',
        code: result.name || 'EMAIL_PROVIDER_ERROR',
      }, { status: response.status >= 400 && response.status < 500 ? 502 : 503 });
    }

    return NextResponse.json({
      ok: true,
      provider: 'Resend',
      messageId: result.id || null,
      status: 'accepted',
      message: 'Resend accepted the email request. This does not confirm delivery to the recipient inbox.',
    });
  } catch {
    return NextResponse.json({ error: 'Could not reach the email provider. Please try again.' }, { status: 502 });
  }
}
