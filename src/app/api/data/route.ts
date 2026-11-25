import { NextRequest, NextResponse } from 'next/server';
import {
  dbConfigured,
  resolveWorkspaceForUser,
  getAuthenticatedUser,
  getWorkspaceMembership,
  listRecords,
  replaceRecords,
  upsertRecords,
  isPlatformAdmin,
  WorkspaceAuthorizationError,
  isSameOriginRequest
} from '@/lib/db/server';

import { conceptChangeAllowed } from '@/lib/skeem';

export const dynamic = 'force-dynamic';

// Only the super admin may approve a concept or set its turnaround. This is
// checked here, on the server, so it cannot be bypassed from the browser.
async function conceptApprovalViolation(collection: string, userId: string, workspaceId: string, records: unknown[]): Promise<string | null> {
  if (collection !== 'leads') return null;
  if (await isPlatformAdmin(userId)) return null;
  let existing: Array<Record<string, unknown>> = [];
  try { existing = await listRecords('leads', workspaceId, 500) as Array<Record<string, unknown>>; } catch { existing = []; }
  const byId = new Map(existing.map((l) => [String(l.id), l]));
  for (const record of records as Array<Record<string, unknown>>) {
    const prev = byId.get(String(record?.id));
    const verdict = conceptChangeAllowed(
      prev as Parameters<typeof conceptChangeAllowed>[0],
      record as Parameters<typeof conceptChangeAllowed>[1],
      false
    );
    if (!verdict.ok) return verdict.reason || 'Not allowed.';
  }
  return null;
}

const allowed = new Set([
  'companies', 'contacts', 'leads', 'clients', 'client_dna', 'projects', 'tasks',
  'services', 'offers', 'outreach', 'messages', 'emails', 'research', 'knowledge',
  'memory', 'workflows', 'workflow_runs', 'activities', 'goals_kpis', 'documents',
  'integrations', 'settings'
]);

function getCollection(request: NextRequest) {
  const value = request.nextUrl.searchParams.get('collection');
  return value && allowed.has(value) ? value : null;
}

async function authenticatedWorkspace() {
  const user = await getAuthenticatedUser();
  if (!user) return { user: null, workspaceId: null, role: null };

  const workspaceId = await resolveWorkspaceForUser(user.id);
  const membership = await getWorkspaceMembership(user.id, workspaceId);
  if (!membership) {
    throw new WorkspaceAuthorizationError('You do not have an active membership in this MOSES workspace.');
  }

  return { user, workspaceId, role: membership.role };
}

function recordsFromBody(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') return [body];
  throw new Error('Request body must be a record or an array of records.');
}

function workspaceErrorResponse(error: unknown, fallback: string) {
  if (error instanceof WorkspaceAuthorizationError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 403 });
  }
  return NextResponse.json({
    error: error instanceof Error ? error.message : fallback
  }, { status: 500 });
}

function canWrite(role: string | null) {
  return role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
}

export async function GET(request: NextRequest) {
  const collection = getCollection(request);
  if (!collection) return NextResponse.json({ error: 'Invalid collection.' }, { status: 400 });
  if (!dbConfigured) {
    return NextResponse.json({ configured: false, records: [], error: 'Database is not connected.' }, { status: 503 });
  }

  try {
    const { user, workspaceId } = await authenticatedWorkspace();
    if (!user || !workspaceId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    return NextResponse.json({ configured: true, records: await listRecords(collection, workspaceId) });
  } catch (error) {
    return workspaceErrorResponse(error, 'Database read failed.');
  }
}

export async function PUT(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  const collection = getCollection(request);
  if (!collection) return NextResponse.json({ error: 'Invalid collection.' }, { status: 400 });
  if (!dbConfigured) return NextResponse.json({ configured: false, error: 'Database is not connected.' }, { status: 503 });

  try {
    const { user, workspaceId, role } = await authenticatedWorkspace();
    if (!user || !workspaceId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    if (!canWrite(role)) return NextResponse.json({ error: 'Your workspace role does not allow changes.' }, { status: 403 });

    const records = recordsFromBody(await request.json());
    const violation = await conceptApprovalViolation(collection, user.id, workspaceId, records);
    if (violation) return NextResponse.json({ error: violation }, { status: 403 });
    const result = await replaceRecords(collection, workspaceId, records);
    return NextResponse.json({ configured: true, result });
  } catch (error) {
    return workspaceErrorResponse(error, 'Database replacement failed.');
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  const collection = getCollection(request);
  if (!collection) return NextResponse.json({ error: 'Invalid collection.' }, { status: 400 });
  if (!dbConfigured) return NextResponse.json({ configured: false, error: 'Database is not connected.' }, { status: 503 });

  try {
    const { user, workspaceId, role } = await authenticatedWorkspace();
    if (!user || !workspaceId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    if (!canWrite(role)) return NextResponse.json({ error: 'Your workspace role does not allow changes.' }, { status: 403 });

    const records = recordsFromBody(await request.json());
    const violation = await conceptApprovalViolation(collection, user.id, workspaceId, records);
    if (violation) return NextResponse.json({ error: violation }, { status: 403 });
    const result = await upsertRecords(collection, workspaceId, records);
    return NextResponse.json({ configured: true, result });
  } catch (error) {
    return workspaceErrorResponse(error, 'Database write failed.');
  }
}
