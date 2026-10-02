import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureWorkspaceForUser } from '@/lib/db/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ authenticated: false }, { status: 401 });

  try {
    const workspaceId = await ensureWorkspaceForUser(user.id);
    return NextResponse.json({ authenticated: true, user: { id: user.id, email: user.email }, workspaceId });
  } catch (workspaceError) {
    return NextResponse.json({ authenticated: true, user: { id: user.id, email: user.email }, error: workspaceError instanceof Error ? workspaceError.message : 'Workspace initialization failed.' }, { status: 500 });
  }
}
