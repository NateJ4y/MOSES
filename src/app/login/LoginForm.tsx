'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get('next') || '/';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState('');

  async function signInWithGoogle() {
    setGoogleBusy(true);
    setError('');

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!url || !key || url.includes('YOUR_PROJECT') || key.includes('YOUR_SUPABASE')) {
        throw new Error('Supabase is not configured for this deployment. Add the Supabase URL and publishable key in Vercel.');
      }

      const supabase = createClient();
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('next', next);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: { prompt: 'select_account' },
        },
      });

      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in could not be started. Please try again.');
      setGoogleBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!url || !key || url.includes('YOUR_PROJECT') || key.includes('YOUR_SUPABASE')) {
        throw new Error(
          'Supabase is not configured for this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel, then redeploy.'
        );
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      window.location.assign(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.toLowerCase().includes('fetch') || message.toLowerCase().includes('network')) {
        setError(
          'Could not reach Supabase. Check the Supabase URL, publishable key, and project status in Vercel environment variables.'
        );
      } else {
        setError(message || 'Sign-in failed unexpectedly. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={busy || googleBusy}
        className="w-full flex items-center justify-center gap-3 border border-white/15 bg-white text-black py-3 font-semibold disabled:opacity-50 hover:bg-zinc-200 transition-colors"
      >
        <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.06 13.22l7.98 6.19C12.93 13.72 18.01 9.5 24 9.5Z" transform="translate(0 4)"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.28 5.65c4.25-3.92 7.5-9.7 7.5-17.3Z"/>
          <path fill="#FBBC05" d="M10.04 28.59A14.4 14.4 0 0 1 9.27 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.58 10.78l7.46-6.19Z" transform="translate(0 0)"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.28-5.65c-2.02 1.36-4.6 2.17-8.62 2.17-5.99 0-11.07-4.22-12.96-9.91l-7.98 6.19C6.51 43.62 14.62 48 24 48Z" transform="translate(0 -4)"/>
        </svg>
        {googleBusy ? 'CONNECTING TO GOOGLE...' : 'CONTINUE WITH GOOGLE'}
      </button>

      <div className="flex items-center gap-3 my-6 text-[10px] tracking-[0.2em] text-zinc-600">
        <span className="h-px flex-1 bg-white/10" />
        OR WITH EMAIL
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <input aria-label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-white/[0.06] border border-white/10 px-4 py-3 outline-none focus:border-white/40" />
        <input aria-label="Password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-white/[0.06] border border-white/10 px-4 py-3 outline-none focus:border-white/40" />
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button disabled={busy || googleBusy} className="w-full bg-white text-black py-3 font-semibold disabled:opacity-50">
          {busy ? 'AUTHENTICATING...' : 'ENTER MOSES'}
        </button>
      </form>
    </div>
  );
}
