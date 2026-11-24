# Phase 2 — SKEEM as a native layer, with saved outreach and activity history

## What changed
- **`src/lib/skeem/`** — one shared module with the seven SKEEM stages, guardrails, cadence maths (Day 1 / 4 / 10, stop after three, 60-day re-engagement, post-concept timing), stage gating, and the AI instruction text. The Outreach screen and the AI both read it, so they cannot disagree.
- **Saved records** — `outreach` and `activities` are now loaded and saved like leads (no SQL migration; the existing records table already accepts them).
- **Outreach screen** — seven stages; Save draft; Copy (never marks anything sent); "I sent this" with an explicit confirmation; log a prospect reply; record or clear an opt-out; set a follow-up date from the cadence; commercial state (concept, proposal, payment) kept separate from the CRM status.
- **AI** — SKEEM questions now pull leads, outreach, activities and messages. The server also computes a pipeline summary (stage, cadence, due dates) from the full saved history, so the AI does not guess dates.
- **Lead fields (all optional, additive):** `skeemStage`, `contactRestriction`, `problemVerified`, `conceptStatus`, `conceptUrl`, `proposalStatus`, `paymentVerificationStatus`.
- Marking a lead **Won** in the CRM now asks for confirmation if payment is not verified.
- Prompt budget raised from 12,000 to 16,000 characters to fit the summary.
- Added `vitest` and `npm test` (20 tests).

## Rules the code enforces
Nothing is ever sent by MOSES. A draft is not sent; copying is not sending. A concept is only "quality-checked" or "delivered" with a link. The concept stage needs a verified need. An opt-out cancels drafts, clears the follow-up date and blocks all contact stages.

## Not decided (left unguessed)
Prices and packages, commission on recurring payments, who approves concepts, turnaround, onboarding/deposit terms, regional pricebooks. The Day 1/4/10 cadence is read as calendar days from the first outreach — please confirm.

## Known limits
- Saves replace the whole collection (same pattern as leads). Two browser tabs editing at once can overwrite each other.
- Deleting a lead keeps its outreach and activity history (kept as an audit trail; it is ignored by the pipeline summary).
- The AI summary covers up to 500 leads/records and shows the 10 most urgent leads.
- The Outreach screen has not been exercised against a live database in my sandbox.
