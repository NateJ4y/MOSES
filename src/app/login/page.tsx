'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    window.location.assign(next);
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-white/10 bg-white/[0.04] p-8">
        <div className="text-xs tracking-[0.3em] text-zinc-500 mb-3">MOSES // COALESCE OS</div>
        <h1 className="text-3xl font-semibold tracking-tight">AUTHENTICATE</h1>
        <p className="text-sm text-zinc-400 mt-2">Sign in to access the command center.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <input aria-label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-white/[0.06] border border-white/10 px-4 py-3 outline-none focus:border-white/40" />
          <input aria-label="Password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-white/[0.06] border border-white/10 px-4 py-3 outline-none focus:border-white/40" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          <button disabled={busy} className="w-full bg-white text-black py-3 font-semibold disabled:opacity-50">
            {busy ? 'AUTHENTICATING...' : 'ENTER MOSES'}
          </button>
        </form>

        <div className="mt-6 flex justify-between text-xs text-zinc-400">
          <a href="/signup" className="hover:text-white">Create account</a>
          <a href="/forgot-password" className="hover:text-white">Recover access</a>
        </div>
      </div>
    </main>
  );
}
