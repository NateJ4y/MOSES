# MOSES Context Engine — Repository Audit

Audit date: 2026-11-08
Branch reviewed: main

## Executive summary

The Context Engine is partially implemented. The chat route authenticates the user, resolves the workspace membership, and retrieves seven collections from the server-side database before calling Gemini. Browser-supplied business records are not trusted by the chat route.

The current AI context is incomplete: only 7 of the 22 collections in the data API allow-list are retrieved.

## Collection inventory

| Collection | Frontend persistence | AI retrieval | Audit notes |
|---|---|---|---|
| companies | Not implemented | No | API allow-listed only |
| contacts | Not implemented | No | API allow-listed only |
| leads | Implemented | Yes | App-level hydration and replacement persistence |
| clients | Not implemented | No | API allow-listed only |
| client_dna | Implemented | Yes | App-level hydration and replacement persistence |
| projects | Implemented | Yes | App-level hydration and replacement persistence |
| tasks | Partial | No | Task records are currently embedded in project records; separate collection is not wired |
| services | Not implemented | No | API allow-listed only |
| offers | Not implemented | No | API allow-listed only |
| outreach | Not implemented | No | Outreach drafts are local component state |
| messages | Implemented | Yes | App-level hydration and replacement persistence |
| emails | Implemented | Yes | App-level hydration and replacement persistence |
| research | Not implemented | No | Research endpoint returns results; Research view does not persist them |
| knowledge | Implemented | Yes | Knowledge view independently reads/writes API |
| memory | Implemented | Yes | Memory view independently reads/writes API |
| workflows | Not implemented | No | Workflow nodes/edges are local component state and initial blueprint data |
| workflow_runs | Not implemented | No | No complete persistence workflow found |
| activities | Not implemented | No | API allow-listed only |
| goals_kpis | Not implemented | No | API allow-listed only |
| documents | Not implemented | No | API allow-listed only |
| integrations | Not implemented | No | API allow-listed only; credentials must never enter AI context |
| settings | Not implemented | No | API allow-listed only; setting values require secret filtering |

"Implemented" here means a frontend read/write path exists in source code. It does not mean authenticated live persistence has been verified.

## Important architecture findings

1. The chat API retrieves leads, projects, emails, client DNA, messages, memory and knowledge using the authenticated workspace ID.
2. The chat API ignores browser-supplied business context. The browser still sends a context object, but the server does not trust or use it.
3. The current context builder only counts six collections and caps records without reporting unavailable collections or truncation.
4. The committed Supabase migrations create 22 individual business tables plus workspaces and workspace_members. They do not create the generic `moses_records` table or the `replace_moses_collection` RPC referenced by the current server data layer.
5. The live Supabase project may contain those generic objects from manual setup or a migration not committed to this repository. This must be checked against the live schema before changing the database. No database changes were made during this audit.
6. Some initial workflow/WhatsApp blueprints are static application configuration, not live customer or business records. They must never be reported as executed workflows or real activity.
7. No authenticated end-to-end Supabase/Gemini runtime test was performed as part of this source audit.

## Implementation sequence

- Phase 1: repository/schema/persistence audit (this document).
- Phase 2: server-side retrieval of all 22 allow-listed collections, explicit per-collection status, bounded context, provenance metadata, and secret redaction.
- Phase 3: Gemini instruction and context integration, including explicit treatment of stored content as untrusted data.
- Phase 4: context diagnostics that show actual loaded/empty/unavailable/truncated states.
- Phase 5: authenticated runtime verification, workspace isolation, clean-state checks, and AI response validation.

## Data integrity constraints

- Do not seed or recreate any business records. The database has been intentionally cleared.
- Never convert unavailable data into an empty collection.
- Never treat static blueprints as executed activity.
- Never expose integration credentials, API keys, tokens, passwords, or secrets to Gemini.
- Do not claim live verification from source inspection or deployment status alone.
