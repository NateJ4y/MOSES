# Phase 4 — approval-based access and multi-workspace

Policy: membership is approved by **platform admins only**; workspaces are created by **approved owners** (and platform admins).

## Deploy order (important)
1. Edit `supabase/migrations/202611240001_phase4_workspace_approval.sql`: replace `<YOUR_LOGIN_EMAIL>` with the email you sign in with.
2. Run it in the Supabase SQL editor (back up / use a branch first). It is additive: existing members become `active`, you become the first platform admin, existing owners become approved owners.
3. Verify: `select * from public.platform_admins;` returns your row.
4. Only then deploy this branch. The code reads `workspace_members.status`, `platform_admins` and `workspace_creators`.
5. Remove `MOSES_WORKSPACE_ID` from Vercel (no longer used).

## Behaviour
- No request creates a workspace or a membership as a side effect. `GET /api/auth/me` is read-only.
- Active workspace = `moses_workspace` cookie, honoured only with an ACTIVE membership; one active membership is used automatically; several require a choice.
- Users without access see a waiting screen; approved owners can create a workspace there.
- `/admin` (platform admins): add/approve/reject/suspend members, approve owners. The last active owner of a workspace cannot be suspended or rejected.
- Account switch signs out first (`/logout?next=/login`, and `/login?switch=1` also signs out).

## Not included
No self-service "request access" flow yet; admins add people by email after they sign up. RLS policies for end users are unchanged (server routes remain the only DB boundary).
