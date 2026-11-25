'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { WorkspaceSwitcher, type AccessWorkspace } from './WorkspaceSwitcher';
import { AccessContext } from './AccessContext';

interface Access {
  authenticated?: boolean;
  user?: { id: string; email?: string };
  workspaces?: AccessWorkspace[];
  workspaceId?: string | null;
  code?: string;
  message?: string;
  error?: string;
  isPlatformAdmin?: boolean;
  canCreateWorkspaces?: boolean;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-white/10 bg-white/[0.04] p-8 space-y-5">
        <div className="text-xs tracking-[0.3em] text-zinc-500">MOSES // COALESCE OS</div>
        {children}
      </div>
    </main>
  );
}

/**
 * Renders the app only when the signed-in user has an active workspace.
 * Otherwise shows the right state: waiting for approval, choose a workspace,
 * or create one (approved owners only).
 */
export function AccessGate({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<Access | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (response) => {
        const body: Access = await response.json().catch(() => ({}));
        if (response.status === 401) { window.location.assign('/login'); return; }
        if (!cancelled) setAccess(body);
      })
      .catch(() => { if (!cancelled) setAccess({ error: 'Could not reach MOSES. Check your connection and retry.' }); });
    return () => { cancelled = true; };
  }, []);

  async function createWorkspace(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || 'Could not create the workspace.');
      window.location.assign('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the workspace.');
      setBusy(false);
    }
  }

  if (!access) return <Shell><p className="text-sm text-zinc-400">Checking access…</p></Shell>;
  if (access.workspaceId) {
    return <AccessContext.Provider value={{ isPlatformAdmin: !!access.isPlatformAdmin, email: access.user?.email }}>{children}</AccessContext.Provider>;
  }

  const footer = (
    <div className="flex justify-between text-xs text-zinc-400 pt-2">
      {access.isPlatformAdmin ? <a href="/admin" className="hover:text-white">Admin</a> : <span />}
      <a href="/logout?next=/login" className="hover:text-white">Sign out / switch account</a>
    </div>
  );

  if (access.error) {
    return <Shell><h1 className="text-xl font-semibold">Something went wrong</h1><p className="text-sm text-zinc-400">{access.error}</p>{footer}</Shell>;
  }

  if (access.code === 'WORKSPACE_SELECTION_REQUIRED') {
    return (
      <Shell>
        <h1 className="text-xl font-semibold">Choose a workspace</h1>
        <WorkspaceSwitcher dark workspaces={access.workspaces || []} />
        {footer}
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-xl font-semibold">{access.code === 'ACCESS_PENDING' ? 'Waiting for approval' : 'No workspace access yet'}</h1>
      <p className="text-sm text-zinc-400">
        {access.message || 'A platform administrator must approve your account.'}
        {access.user?.email ? ` You are signed in as ${access.user.email}.` : ''}
      </p>
      {access.canCreateWorkspaces && (
        <form onSubmit={createWorkspace} className="space-y-3 border-t border-white/10 pt-4">
          <p className="text-xs text-zinc-400">You are an approved owner, so you can create a workspace.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Workspace name"
            className="w-full bg-black border border-white/20 px-3 py-2 text-sm" />
          <button type="submit" disabled={busy || !name.trim()} className="w-full bg-white text-black text-sm font-semibold py-2 disabled:opacity-50">
            {busy ? 'Creating…' : 'Create workspace'}
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>
      )}
      {footer}
    </Shell>
  );
}
