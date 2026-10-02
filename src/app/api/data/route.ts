import { NextRequest, NextResponse } from 'next/server';
import { dbConfigured, ensureWorkspaceId, listRecords, replaceRecords } from '@/lib/db/server';

const allowed = new Set(['companies','contacts','leads','clients','client_dna','projects','tasks','services','offers','outreach','messages','emails','research','knowledge','memory','workflows','workflow_runs','activities','goals_kpis','documents','integrations','settings']);

function toCamelKey(key: string) { return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()); }
function toSnakeKey(key: string) { return key.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase()); }
function mapKeys(value: unknown, mapper: (key: string) => string): unknown {
  if (Array.isArray(value)) return value.map(item => mapKeys(item, mapper));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [mapper(key), mapKeys(item, mapper)]));
  return value;
}
function adaptFromDb(table: string, value: unknown): unknown {
  if (Array.isArray(value)) return value.map(item => adaptFromDb(table, item));
  if (!value || typeof value !== 'object') return value;
  const row = value as Record<string, unknown>;
  if (table === 'messages' && 'content' in row && !('text' in row)) { row.text = row.content; }
  if (table === 'emails') {
    if ('fromAddress' in row) row.from = row.fromAddress;
    if ('toAddress' in row) row.to = row.toAddress;
    if ('messageDate' in row) row.date = row.messageDate;
  }
  return row;
}
function adaptToDb(table: string, value: unknown): unknown {
  if (Array.isArray(value)) return value.map(item => adaptToDb(table, item));
  if (!value || typeof value !== 'object') return value;
  const row = value as Record<string, unknown>;
  if (table === 'messages' && 'text' in row && !('content' in row)) row.content = row.text;
  if (table === 'emails') {
    if ('from' in row && !('fromAddress' in row)) row.fromAddress = row.from;
    if ('to' in row && !('toAddress' in row)) row.toAddress = row.to;
    if ('date' in row && !('messageDate' in row)) row.messageDate = row.date;
  }
  return row;
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
  const workspaceId = await ensureWorkspaceId();
  try { return NextResponse.json({ configured: true, records: adaptFromDb(table, mapKeys(await listRecords(table, workspaceId), toCamelKey)) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Database read failed.' }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  const table = getCollection(request);
  if (!table) return NextResponse.json({ error: 'Invalid collection.' }, { status: 400 });
  if (!dbConfigured) return NextResponse.json({ configured: false }, { status: 503 });
  const workspaceId = await ensureWorkspaceId();
  try {
    const body = await request.json();
    const records = Array.isArray(body) ? body : [body];
    const normalized = records.map((record) => ({ ...mapKeys(adaptToDb(table, sanitizeIds(record)), toSnakeKey) as Record<string, unknown>, workspace_id: workspaceId }));
    const saved = await replaceRecords(table, workspaceId, normalized);
    return NextResponse.json({ configured: true, records: adaptFromDb(table, mapKeys(saved, toCamelKey)) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Database replacement failed.' }, { status: 500 }); }
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
