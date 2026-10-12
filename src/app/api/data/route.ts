import { NextRequest, NextResponse } from 'next/server';
import { dbConfigured, ensureWorkspaceForUser, getAuthenticatedUser, listRecords, replaceRecords, upsertRecords } from '@/lib/db/server';

export const dynamic = 'force-dynamic';

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
  if (!user) return { user: null, workspaceId: null as string | null };
  const workspaceId = await ensureWorkspaceForUser(user.id);
  return { user, workspaceId };
}

function recordsFromBody(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') return [body];
  throw new Error('Request body must be a record or an array of records.');
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
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Database read failed.'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const collection = getCollection(request);
  if (!collection) return NextResponse.json({ error: 'Invalid collection.' }, { status: 400 });
  if (!dbConfigured) return NextResponse.json({ configured: false, error: 'Database is not connected.' }, { status: 503 });

  try {
    const { user, workspaceId } = await authenticatedWorkspace();
    if (!user || !workspaceId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const records = recordsFromBody(await request.json());
    const result = await replaceRecords(collection, workspaceId, records);
    return NextResponse.json({ configured: true, result });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Database replacement failed.'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const collection = getCollection(request);
  if (!collection) return NextResponse.json({ error: 'Invalid collection.' }, { status: 400 });
  if (!dbConfigured) return NextResponse.json({ configured: false, error: 'Database is not connected.' }, { status: 503 });

  try {
    const { user, workspaceId } = await authenticatedWorkspace();
    if (!user || !workspaceId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const records = recordsFromBody(await request.json());
    const result = await upsertRecords(collection, workspaceId, records);
    return NextResponse.json({ configured: true, result });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Database write failed.'
    }, { status: 500 });
  }
}
