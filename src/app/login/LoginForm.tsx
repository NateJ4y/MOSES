'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
    <form onSubmit={submit} className="mt-8 space-y-4">
      <input aria-label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-white/[0.06] border border-white/10 px-4 py-3 outline-none focus:border-white/40" />
      <input aria-label="Password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-white/[0.06] border border-white/10 px-4 py-3 outline-none focus:border-white/40" />
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <button disabled={busy} className="w-full bg-white text-black py-3 font-semibold disabled:opacity-50">
        {busy ? 'AUTHENTICATING...' : 'ENTER MOSES'}
      </button>
    </form>
  );
}
