import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const AUTH_CHECK_TIMEOUT_MS = 8000;

function loginRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function isTimeoutError(error: unknown) {
  return error instanceof Error &&
    (error.name === 'AbortError' || error.name === 'TimeoutError' ||
      /timeout|aborted/i.test(error.message));
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const publicPath =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/auth/');

  if (publicPath) return NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new NextResponse('Supabase authentication is not configured.', { status: 500 });
  }

  // Avoid a network round-trip for anonymous requests. Protected routes still
  // require a valid Supabase claim before the request is allowed through.
  const hasAuthCookie = request.cookies.getAll().some(({ name }) =>
    /^sb-.+-auth-token(?:\.\d+)?$/.test(name)
  );
  if (!hasAuthCookie) return loginRedirect(request);

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: (input, init) => fetch(input, {
        ...init,
        signal: AbortSignal.timeout(AUTH_CHECK_TIMEOUT_MS),
      }),
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        }
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.getClaims();

    if (error) {
      if (isTimeoutError(error)) {
        return new NextResponse('Authentication service timed out. Please retry shortly.', {
          status: 503,
          headers: { 'Retry-After': '5', 'Cache-Control': 'no-store' },
        });
      }
      return loginRedirect(request);
    }

    if (!data?.claims) return loginRedirect(request);
    return response;
  } catch (error) {
    if (isTimeoutError(error)) {
      return new NextResponse('Authentication service timed out. Please retry shortly.', {
        status: 503,
        headers: { 'Retry-After': '5', 'Cache-Control': 'no-store' },
      });
    }
    console.error('[middleware] Supabase session check failed:', error);
    return loginRedirect(request);
  }
}
