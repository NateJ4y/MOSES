import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get('token_hash');
  const code = params.get('code');
  const requestedNext = params.get('next') || '/';
  // Only allow local paths; never turn an auth link into an open redirect.
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//')
    ? requestedNext
    : '/';

  const supabase = await createClient();
  let error: { message: string } | null = null;

  // Supabase can return either a PKCE code (the standard flow) or a token_hash
  // (when the email template uses the token-hash verification URL).
  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else if (tokenHash) {
    const requestedType = params.get('type') || 'email';
    const allowedTypes = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email', 'sms', 'phone_change'];
    const type = allowedTypes.includes(requestedType) ? requestedType : 'email';
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email' | 'sms' | 'phone_change',
    });
    error = result.error;
  } else {
    return NextResponse.redirect(new URL('/login?error=missing_confirmation_token', request.url));
  }

  if (error) {
    const destination = new URL('/login', request.url);
    destination.searchParams.set('error', 'confirmation_failed');
    destination.searchParams.set('reason', error.message.slice(0, 180));
    return NextResponse.redirect(destination);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
