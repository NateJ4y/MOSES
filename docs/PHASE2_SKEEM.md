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


---

## Update: owner decisions and the AI coach

**Confirmed by the owner (now in the code):**
- **Counting days:** Monday to Saturday. Sunday is not counted. Day 4 is three counting days after the first outreach; Day 10 is nine. (South African time.)
- **Prices:** Local (South Africa) R1,600; Africa outside South Africa $100; International (outside Africa) $1,000. Set per lead as a *price region*.
- **Commission:** 15%.
- **Concepts:** the super admin approves every concept request and sets the turnaround. Anyone can request; only the super admin can approve or set a due date. This is enforced on the server as well as in the screen.

**Still not recorded (so SKEEM will not guess):** what each price buys (scope), whether it is once-off or recurring, whether 15% applies to recurring payments, onboarding/deposit terms.

**The screen was rebuilt around a conversation:**
- A prospect list that sorts by who needs you today (due, overdue, not started).
- A "next move" card that says what is due and offers one click to have SKEEM do it.
- A coach you can talk to: "Draft my next message", "They replied…" (logs their reply and gets advice), "Handle an objection", "Plan my follow-up", or free text.
- Replies from the coach are structured: what is going on, the stage and why, advice, editable drafts, what it needs from you, and the next move.
- Every draft is checked automatically (opt-out, claiming a concept that does not exist, wrong price for the region, unknown links, "free website" wording).
- If the AI is unavailable, a template "Quick draft" still works.

**How the AI is grounded:** the server reads the lead and its history from the database itself, works out the cadence, and gives the AI only those facts. The AI cannot send anything or write records. Anything pasted by a prospect is treated as data, not instructions.

**Limits:** the coach conversation itself is not saved (the history and activity are); concept approval is enforced for new changes but older records are not re-checked; there is no browser test of the screen yet (it is render-tested).
