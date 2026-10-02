import { NextRequest, NextResponse } from 'next/server';
import { dbConfigured, listRecords, upsertRecords } from '@/lib/db/server';

const allowed = new Set(['companies','contacts','leads','clients','client_dna','projects','tasks','services','offers','outreach','messages','emails','research','knowledge','memory','workflows','workflow_runs','activities','goals_kpis','documents','integrations','settings']);

function toCamelKey(key: string) { return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()); }
function toSnakeKey(key: string) { return key.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase()); }
function mapKeys(value: unknown, mapper: (key: string) => string): unknown {
  if (Array.isArray(value)) return value.map(item => mapKeys(item, mapper));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [mapper(key), mapKeys(item, mapper)]));
  return value;
}
function sanitizeIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeIds);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = { ...(value as Record<string, unknown>) };
    if (typeof out.id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(out.id)) delete out.id;
    return Object.fromEntries(Object.entries(out).map(([key, item]) => [key, sanitizeIds(item)]));
  }
  return value;
}

function getCollection(request: NextRequest) {
  const value = request.nextUrl.searchParams.get('collection');
  return value && allowed.has(value) ? value : null;
}

export async function GET(request: NextRequest) {
  const table = getCollection(request);
  if (!table) return NextResponse.json({ error: 'Invalid collection.' }, { status: 400 });
  if (!dbConfigured) return NextResponse.json({ configured: false, records: [] }, { status: 503 });
  const workspaceId = request.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id is required.' }, { status: 400 });
  try { return NextResponse.json({ configured: true, records: await listRecords(table, workspaceId) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Database read failed.' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const table = getCollection(request);
  if (!table) return NextResponse.json({ error: 'Invalid collection.' }, { status: 400 });
  if (!dbConfigured) return NextResponse.json({ configured: false }, { status: 503 });
  try {
    const body = await request.json();
    const records = Array.isArray(body) ? body : [body];
    const workspaceId = process.env.MOSES_WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: 'MOSES_WORKSPACE_ID is not configured.' }, { status: 503 });
    const normalized = records.map((record) => ({ ...mapKeys(sanitizeIds(record), toSnakeKey) as Record<string, unknown>, workspace_id: workspaceId }));
    const saved = await upsertRecords(table, normalized);
    return NextResponse.json({ configured: true, records: mapKeys(saved, toCamelKey) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Database write failed.' }, { status: 500 }); }
}
