import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const requestedNext = params.get('next') || '/';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//')
    ? requestedNext
    : '/';

  const providerError = params.get('error_description') || params.get('error');
  if (providerError) {
    const destination = new URL('/login', request.url);
    destination.searchParams.set('error', 'google_sign_in_failed');
    destination.searchParams.set('reason', providerError.slice(0, 160));
    return NextResponse.redirect(destination);
  }

  const code = params.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_oauth_code', request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const destination = new URL('/login', request.url);
    destination.searchParams.set('error', 'google_sign_in_failed');
    destination.searchParams.set('reason', error.message.slice(0, 160));
    return NextResponse.redirect(destination);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
