import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-white/10 bg-white/[0.04] p-8">
        <div className="text-xs tracking-[0.3em] text-zinc-500 mb-3">MOSES // COALESCE OS</div>
        <h1 className="text-3xl font-semibold tracking-tight">AUTHENTICATE</h1>
        <p className="text-sm text-zinc-400 mt-2">Sign in to access the command center.</p>

        <Suspense fallback={<div className="mt-8 h-32 animate-pulse bg-white/[0.03]" />}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 flex justify-between text-xs text-zinc-400">
          <a href="/signup" className="hover:text-white">Create account</a>
          <a href="/forgot-password" className="hover:text-white">Recover access</a>
        </div>
      </div>
    </main>
  );
}
