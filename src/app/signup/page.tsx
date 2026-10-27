'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key || url.includes('YOUR_PROJECT') || key.includes('YOUR_SUPABASE')) {
        throw new Error('Supabase is not configured for this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel, then redeploy.');
      }

      const supabase = createClient();
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin + '/auth/confirm?next=/' },
      });

      if (signupError) {
        setError(signupError.message);
      } else if (data.session) {
        window.location.assign('/');
        return;
      } else {
        setMessage('Account created. Check your inbox and spam folder for the confirmation email. If nothing arrives, email delivery must be checked in Supabase Auth.');
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : '';
      setError(reason.toLowerCase().includes('fetch') || reason.toLowerCase().includes('network')
        ? 'Could not reach Supabase. Check the Supabase URL, publishable key, and project status in Vercel.'
        : reason || 'Account creation failed unexpectedly. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-white/10 bg-white/[0.04] p-8">
        <div className="text-xs tracking-[0.3em] text-zinc-500 mb-3">MOSES // COALESCE OS</div>
        <h1 className="text-3xl font-semibold tracking-tight">CREATE IDENTITY</h1>
        <p className="text-sm text-zinc-400 mt-2">Create the first authenticated MOSES identity.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input aria-label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-white/[0.06] border border-white/10 px-4 py-3 outline-none focus:border-white/40" />
          <input aria-label="Password" type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (6+ characters)" className="w-full bg-white/[0.06] border border-white/10 px-4 py-3 outline-none focus:border-white/40" />
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          {message && <p role="status" className="text-sm text-emerald-400">{message}</p>}
          <button disabled={busy} className="w-full bg-white text-black py-3 font-semibold disabled:opacity-50">
            {busy ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <a href="/login" className="block mt-6 text-xs text-zinc-400 hover:text-white">Back to authentication</a>
      </div>
    </main>
  );
}
