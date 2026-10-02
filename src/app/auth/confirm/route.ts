import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const next = request.nextUrl.searchParams.get('next') || '/';

  if (!tokenHash) {
    return NextResponse.redirect(new URL('/login?error=missing_confirmation_token', request.url));
  }

  const supabase = await createClient();
  const type = request.nextUrl.searchParams.get('type') || 'email';
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'email' | 'recovery' });

  if (error) {
    return NextResponse.redirect(new URL('/login?error=confirmation_failed', request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
