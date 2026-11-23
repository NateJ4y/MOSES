import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
export const dbConfigured = Boolean(url && key);

const allowedTables = new Set(['workspaces', 'workspace_members', 'moses_records', 'platform_admins', 'workspace_creators']);

export const WORKSPACE_COOKIE = 'moses_workspace';
export type MembershipStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export const MEMBERSHIP_STATUSES: MembershipStatus[] = ['pending', 'active', 'rejected', 'suspended'];
export const WORKSPACE_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;

export function isSameOriginRequest(request: Request) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  if (origin) {
    try { return new URL(origin).origin === expectedOrigin; } catch { return false; }
  }
  const referer = request.headers.get('referer');
  if (referer) {
    try { return new URL(referer).origin === expectedOrigin; } catch { return false; }
  }
  return false;
}

export function workspaceCookieOptions() {
  return { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 };
}

export type WorkspaceErrorCode =
  | 'NO_ACTIVE_WORKSPACE'
  | 'ACCESS_PENDING'
  | 'WORKSPACE_SELECTION_REQUIRED'
  | 'NOT_A_MEMBER'
  | 'FORBIDDEN';

export class WorkspaceAuthorizationError extends Error {
  code: WorkspaceErrorCode;
  constructor(message: string, code: WorkspaceErrorCode = 'FORBIDDEN') {
    super(message);
    this.name = 'WorkspaceAuthorizationError';
    this.code = code;
  }
}

function check(table: string) {
  const base = table.split('?')[0];
  if (!allowedTables.has(base) && base !== 'rpc/replace_moses_collection') throw new Error('Unsupported database table or RPC.');
  if (!dbConfigured) throw new Error('MOSES database is not configured.');
}

export async function dbRequest(table: string, init: RequestInit = {}) {
  check(table);
  const response = await fetch(url + '/rest/v1/' + table, {
    ...init,
    headers: {
      apikey: key!,
      Authorization: 'Bearer ' + key!,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Supabase ' + response.status + ': ' + (await response.text()).slice(0, 500));
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function listRecords(collection: string, workspaceId: string, limit?: number) {
  const limitQuery = Number.isInteger(limit) && (limit ?? 0) > 0
    ? '&limit=' + Math.min(limit as number, 500)
    : '';
  const rows = await dbRequest(
    'moses_records?select=data&collection=eq.' + encodeURIComponent(collection) +
    '&workspace_id=eq.' + encodeURIComponent(workspaceId) + '&order=updated_at.desc' + limitQuery,
    { method: 'GET' }
  );
  if (!Array.isArray(rows)) throw new Error('Unexpected database response while reading ' + collection + '.');
  return rows.map((row: { data: unknown }) => row.data);
}

function normalizeRecords(records: unknown[], workspaceId: string, collection: string) {
  return records.map((record) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new Error('Every database record must be a JSON object.');
    }
    const data = { ...(record as Record<string, unknown>) };
    const id = typeof data.id === 'string' && data.id.trim() ? data.id : randomUUID();
    data.id = id;
    return { workspace_id: workspaceId, collection, record_key: id, data };
  });
}

export async function upsertRecords(collection: string, workspaceId: string, records: unknown[]) {
  const normalized = normalizeRecords(records, workspaceId, collection);
  if (!normalized.length) return [];
  return dbRequest('moses_records?on_conflict=workspace_id,collection,record_key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(normalized)
  });
}

export async function replaceRecords(collection: string, workspaceId: string, records: unknown[]) {
  const response = await dbRequest('rpc/replace_moses_collection', {
    method: 'POST',
    body: JSON.stringify({
      p_workspace_id: workspaceId,
      p_collection: collection,
      p_records: normalizeRecords(records, workspaceId, collection).map((record) => ({
        id: record.record_key,
        data: record.data
      }))
    })
  });
  return response ?? [];
}

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getWorkspaceMembership(userId: string, workspaceId: string) {
  const rows = await dbRequest(
    'workspace_members?select=workspace_id,role&user_id=eq.' + encodeURIComponent(userId) +
    '&workspace_id=eq.' + encodeURIComponent(workspaceId) + '&status=eq.active&limit=1',
    { method: 'GET' }
  );
  if (!Array.isArray(rows) || !rows[0]) return null;
  return {
    workspaceId: rows[0].workspace_id as string,
    role: typeof rows[0].role === 'string' ? rows[0].role.toUpperCase() : ''
  };
}

export interface UserWorkspace {
  id: string;
  name: string;
  role: string;
  status: MembershipStatus;
}

export async function listUserWorkspaces(userId: string): Promise<UserWorkspace[]> {
  const memberships = await dbRequest(
    'workspace_members?select=workspace_id,role,status&user_id=eq.' + encodeURIComponent(userId) + '&order=created_at.asc',
    { method: 'GET' }
  );
  if (!Array.isArray(memberships) || !memberships.length) return [];
  const ids = memberships.map((row: { workspace_id: string }) => row.workspace_id);
  const workspaces = await dbRequest(
    'workspaces?select=id,name&id=in.(' + ids.map(encodeURIComponent).join(',') + ')',
    { method: 'GET' }
  );
  const names = new Map<string, string>(
    (Array.isArray(workspaces) ? workspaces : []).map((w: { id: string; name: string }) => [w.id, w.name])
  );
  return memberships.map((row: { workspace_id: string; role: string; status: MembershipStatus }) => ({
    id: row.workspace_id,
    name: names.get(row.workspace_id) || 'Workspace',
    role: String(row.role || '').toUpperCase(),
    status: row.status
  }));
}

export async function isPlatformAdmin(userId: string) {
  const rows = await dbRequest(
    'platform_admins?select=user_id&user_id=eq.' + encodeURIComponent(userId) + '&limit=1',
    { method: 'GET' }
  );
  return Array.isArray(rows) && rows.length > 0;
}

export async function isApprovedWorkspaceCreator(userId: string) {
  const rows = await dbRequest(
    'workspace_creators?select=user_id&user_id=eq.' + encodeURIComponent(userId) + '&limit=1',
    { method: 'GET' }
  );
  return Array.isArray(rows) && rows.length > 0;
}

export async function requirePlatformAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) return { user: null, error: 'Authentication required.', status: 401 as const };
  if (!dbConfigured) return { user: null, error: 'Database is not connected.', status: 503 as const };
  if (!(await isPlatformAdmin(user.id))) return { user: null, error: 'Platform administrator access required.', status: 403 as const };
  return { user, error: null, status: 200 as const };
}

/**
 * Resolve the workspace for this request. READ-ONLY: it never creates a
 * workspace or a membership. The selected workspace comes from the
 * `moses_workspace` cookie and is only honoured when the signed-in user has an
 * ACTIVE membership in it; otherwise it is ignored. With no valid selection, a
 * user with exactly one active membership uses it; several require an explicit
 * choice; none means access has not been granted yet.
 */
export async function resolveWorkspaceForUser(userId: string): Promise<string> {
  if (!dbConfigured) throw new Error('MOSES database is not configured.');
  const workspaces = await listUserWorkspaces(userId);
  const active = workspaces.filter((w) => w.status === 'active');

  const selected = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  if (selected && active.some((w) => w.id === selected)) return selected;

  if (active.length === 1) return active[0].id;
  if (active.length > 1) {
    throw new WorkspaceAuthorizationError('Choose which workspace to open.', 'WORKSPACE_SELECTION_REQUIRED');
  }
  if (workspaces.some((w) => w.status === 'pending')) {
    throw new WorkspaceAuthorizationError('Your access request is waiting for approval.', 'ACCESS_PENDING');
  }
  throw new WorkspaceAuthorizationError(
    'You do not have access to a workspace yet. A platform administrator must approve your account.',
    'NO_ACTIVE_WORKSPACE'
  );
}

async function authAdminFetch(path: string) {
  if (!url || !key) throw new Error('MOSES database is not configured.');
  const response = await fetch(url + '/auth/v1/admin/' + path, {
    headers: { apikey: key, Authorization: 'Bearer ' + key },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Supabase auth ' + response.status);
  return response.json();
}

export async function getAuthUserEmail(userId: string): Promise<string | null> {
  try {
    const user = await authAdminFetch('users/' + encodeURIComponent(userId));
    return typeof user?.email === 'string' ? user.email : null;
  } catch {
    return null;
  }
}

export async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const wanted = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const body = await authAdminFetch('users?page=' + page + '&per_page=200');
    const users: Array<{ id: string; email?: string }> = Array.isArray(body?.users) ? body.users : [];
    const match = users.find((u) => (u.email || '').toLowerCase() === wanted);
    if (match) return match.id;
    if (users.length < 200) break;
  }
  return null;
}
