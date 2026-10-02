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
    <form onSubmit={submit} className="mt-8 space-y-4">
      <input aria-label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-white/[0.06] border border-white/10 px-4 py-3 outline-none focus:border-white/40" />
      <input aria-label="Password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-white/[0.06] border border-white/10 px-4 py-3 outline-none focus:border-white/40" />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button disabled={busy} className="w-full bg-white text-black py-3 font-semibold disabled:opacity-50">
        {busy ? 'AUTHENTICATING...' : 'ENTER MOSES'}
      </button>
    </form>
  );
}
