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

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + '/auth/confirm?next=/' },
    });

    if (error) {
      setError(error.message);
    } else if (data.session) {
      window.location.assign('/');
      return;
    } else {
      setMessage('Account created. Check your email to confirm access, then sign in.');
    }
    setBusy(false);
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
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          <button disabled={busy} className="w-full bg-white text-black py-3 font-semibold disabled:opacity-50">
            {busy ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <a href="/login" className="block mt-6 text-xs text-zinc-400 hover:text-white">Back to authentication</a>
      </div>
    </main>
  );
}
