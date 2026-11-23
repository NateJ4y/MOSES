'use client';

import { useEffect, useState } from 'react';

export interface AccessWorkspace { id: string; name: string; role: string; status: string }

export function WorkspaceSwitcher({ workspaces, activeId }: { workspaces: AccessWorkspace[]; activeId?: string | null }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const active = workspaces.filter((w) => w.status === 'active');

  async function choose(workspaceId: string) {
    setBusy(workspaceId);
    setError('');
    try {
      const response = await fetch('/api/workspaces/select', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || 'Could not switch workspace.');
      window.location.assign('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not switch workspace.');
      setBusy(null);
    }
  }

  if (!active.length) return null;
  return (
    <div className="space-y-2">
      {active.map((w) => (
        <button key={w.id} type="button" disabled={busy !== null || w.id === activeId} onClick={() => choose(w.id)}
          className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${w.id === activeId ? 'border-black bg-zinc-100' : 'border-zinc-300 hover:border-zinc-500'} disabled:opacity-60`}>
          <span className="font-semibold">{w.name}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">{w.id === activeId ? 'Active · ' : ''}{w.role}</span>
        </button>
      ))}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function WorkspaceSettingsCard() {
  const [workspaces, setWorkspaces] = useState<AccessWorkspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => { setWorkspaces(b.workspaces || []); setActiveId(b.workspaceId || null); setIsAdmin(Boolean(b.isPlatformAdmin)); })
      .catch(() => undefined);
  }, []);

  const active = workspaces.filter((w) => w.status === 'active');
  if (active.length < 2 && !isAdmin) return null;
  return (
    <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-zinc-900 uppercase tracking-wider">Workspace</h3>
        {isAdmin && <a href="/admin" className="text-[11px] font-semibold underline">Platform admin</a>}
      </div>
      {active.length > 1 && <WorkspaceSwitcher workspaces={workspaces} activeId={activeId} />}
    </div>
  );
}
