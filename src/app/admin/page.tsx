'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

interface Member { workspaceId: string; workspaceName: string; userId: string; email: string | null; role: string; status: string }
interface Workspace { id: string; name: string }
interface Creator { userId: string; email: string | null }

async function call(method: string, url: string, body?: unknown) {
  const response = await fetch(url, {
    method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Request failed (' + response.status + ').');
  return data;
}

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [role, setRole] = useState('member');
  const [creatorEmail, setCreatorEmail] = useState('');

  const load = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([call('GET', '/api/admin/members'), call('GET', '/api/admin/creators')]);
      setMembers(m.members || []); setWorkspaces(m.workspaces || []); setCreators(c.creators || []);
      setWorkspaceId((current) => current || m.workspaces?.[0]?.id || '');
      setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load admin data.'); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function run(action: () => Promise<unknown>) {
    try { await action(); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Action failed.'); }
  }
  const setStatus = (m: Member, status: string) => run(() => call('PATCH', '/api/admin/members', { workspaceId: m.workspaceId, userId: m.userId, status }));
  const addMember = (e: FormEvent) => { e.preventDefault(); void run(async () => { await call('POST', '/api/admin/members', { email, workspaceId, role }); setEmail(''); }); };
  const setCreator = (e: FormEvent, approved: boolean, target = creatorEmail) => { e.preventDefault(); void run(async () => { await call('PUT', '/api/admin/creators', { email: target, approved }); setCreatorEmail(''); }); };

  const btn = 'px-2.5 py-1 rounded-full border border-zinc-300 text-[11px] font-semibold hover:bg-zinc-100';
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Platform administration</h1>
          <a href="/" className="text-xs underline">Back to MOSES</a>
        </header>
        {error && <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider">Give a user access</h2>
          <form onSubmit={addMember} className="flex flex-wrap gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Account email" type="email" required className="border border-zinc-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]" />
            <select value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} className="border border-zinc-300 rounded-lg px-3 py-2 text-sm">
              {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="border border-zinc-300 rounded-lg px-3 py-2 text-sm">
              {['owner', 'admin', 'member', 'viewer'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold">Approve &amp; add</button>
          </form>
          <p className="text-[11px] text-zinc-500">The person must already have created an account. Access is active immediately.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider">Memberships</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-wider text-zinc-500"><tr><th className="p-3">User</th><th className="p-3">Workspace</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.workspaceId + m.userId} className="border-t border-zinc-100">
                    <td className="p-3">{m.email || m.userId}</td><td className="p-3">{m.workspaceName}</td><td className="p-3">{m.role}</td><td className="p-3 font-semibold">{m.status}</td>
                    <td className="p-3 flex flex-wrap gap-1.5">
                      {m.status !== 'active' && <button className={btn} onClick={() => setStatus(m, 'active')}>Approve</button>}
                      {m.status === 'pending' && <button className={btn} onClick={() => setStatus(m, 'rejected')}>Reject</button>}
                      {m.status === 'active' && <button className={btn} onClick={() => setStatus(m, 'suspended')}>Suspend</button>}
                    </td>
                  </tr>
                ))}
                {!members.length && <tr><td className="p-3 text-zinc-500" colSpan={5}>No memberships yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider">Approved workspace owners</h2>
          <form onSubmit={(e) => setCreator(e, true)} className="flex gap-2">
            <input value={creatorEmail} onChange={(e) => setCreatorEmail(e.target.value)} placeholder="Account email" type="email" required className="border border-zinc-300 rounded-lg px-3 py-2 text-sm flex-1" />
            <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold">Approve owner</button>
          </form>
          <ul className="text-sm space-y-1">
            {creators.map((c) => (
              <li key={c.userId} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2">
                <span>{c.email || c.userId}</span>
                <button className={btn} onClick={(e) => c.email && setCreator(e as unknown as FormEvent, false, c.email)}>Revoke</button>
              </li>
            ))}
            {!creators.length && <li className="text-zinc-500">None approved.</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}
