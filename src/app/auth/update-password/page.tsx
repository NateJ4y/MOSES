'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else setMessage('Password updated. You can now continue into MOSES.');
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-white/10 bg-white/[0.04] p-8">
        <div className="text-xs tracking-[0.3em] text-zinc-500 mb-3">MOSES // COALESCE OS</div>
        <h1 className="text-3xl font-semibold tracking-tight">RESET PASSWORD</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input aria-label="New password" type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" className="w-full bg-white/[0.06] border border-white/10 px-4 py-3 outline-none focus:border-white/40" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          <button className="w-full bg-white text-black py-3 font-semibold">UPDATE PASSWORD</button>
        </form>
      </div>
    </main>
  );
}
