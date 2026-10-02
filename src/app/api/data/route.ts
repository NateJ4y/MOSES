import { NextRequest, NextResponse } from 'next/server';
import { dbConfigured, listRecords, upsertRecords } from '@/lib/db/server';

const allowed = new Set(['companies','contacts','leads','clients','client_dna','projects','tasks','services','offers','outreach','messages','emails','research','knowledge','memory','workflows','workflow_runs','activities','goals_kpis','documents','integrations','settings']);

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
    return NextResponse.json({ configured: true, records: await upsertRecords(table, records) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Database write failed.' }, { status: 500 }); }
}
