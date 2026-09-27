# ALUNSINA NEWS: Feature: Story Pitch / Claim Board (run on: Mac, website repo)

> Provided by the product owner 2026-09-27. Laya and OpenCode are not installed on this machine (separate server-PC setup). Cross-references use `ALUNSINA_NEWS_Master_App_Spec.md` (spec) and `ALUNSINA_NEWS_Product_Context_v2.md` (rationale).
> **Owner decision (2026-09-27):** there are no contributor logins; the site owner manages contributors and records pitches/status changes through an admin panel. Pre-screen unavailable → hold until screened.

## Story Pitch / Claim Board

Extends §8/§9 (Independent Journalists & Expert Contributors). The governing principle: **verification is a one-time identity/expertise gate (already built in §8/§9), never a per-story approval.** A verified journalist pitches and publishes on any topic without asking permission for that specific topic. The only gate left after verification is an automated content-safety pre-screen (run by Laya, set up on the separate server PC): harassment, doxxing, targeted-defamation patterns, never a topic or viewpoint check. Getting this distinction right is what keeps the feature legally defensible.

### Data model

New table `pitches`: pitch_id; reporter_id → Contributor Profile (§9); topic (free text); region (optional, region taxonomy); angle (free text, what specifically they're investigating); timeframe (free text, e.g. "this week", "ongoing"); status: pitched | in_progress | published; linked_blindspot_id (optional, FK to a detected Blindspot, §7); linked_story_id (set once published, links to the resulting Story); created_at / updated_at.

No `approved_by` or `approval_status` field: there is no approval step. A pitch is visible the moment it's posted (subject only to the automated pre-screen).

### UI placement

New sub-tab under **Explore → Experts & Commentary** (§5): "Reporting in Progress."

```
REPORTING IN PROGRESS

[Journalist name] · Independent Journalist · Cebu
Pitched: Cebu port congestion cargo delays: knock-on effects for Bohol produce shipping
Status: In Progress · Started 2 days ago

[Journalist name] · Independent Journalist · Zamboanga
Pitched: Flooding recovery in Zamboanga (no independent coverage detected yet: linked to an open Geographic Blindspot)
Status: Pitched · Posted today
```

Each card: reporter name/credentials (link to Contributor Profile, §9), topic, region, status, time posted. Blindspot-linked pitches get a small "linked to an open Blindspot" tag: **informational only**, never a required or exclusive path to pitching.

### Rules to implement exactly as stated

- Posting a pitch requires an already-verified Contributor account (§8), nothing else. No moderator sign-off on the pitch itself.
- Blindspot-linking is optional and system-suggested, never mandatory. A journalist can pitch anything.
- The automated pre-screen (Laya's `guard_questions()` / `moderation_questions()` presets) runs on the pitch text at submission and the published piece at publish time. It checks for jailbreak/injection patterns and harassment/threat/doxxing patterns; not topic, not viewpoint, not whether an official is named.
- A published pitch flows into the normal Independent Journalist source pipeline (§6 taxonomy) exactly like any other Independent Journalist piece: eligible for Magnified News (§11) on its own merits, no special boost for having been "assigned."
- Status changes (pitched → in_progress → published) are self-reported by the journalist, not system-inferred.
