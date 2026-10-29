# Breakaway Coach — Claude cleanup applied

**Scope:** Coach implementation on preview branch only. No changes to Survival, Cycle Quest, Ride Breakaway production, or `main`.

## Changes
- **Unified fatigue decisions** in `src/coach-engine.ts`: `fatigueSignals()` supplies recent-ride and high-effort feedback checks for the Coach recommendation, the strength card, and the guided strength player. Previously these pathways used different thresholds or sources.
- **Protected unsaved rider setup edits**: the profile fields now synchronize when Coach opens, when a profile is successfully saved, and when a history-based profile suggestion is applied. General `render()` calls no longer overwrite typed edits.
- **Accurate strength session labels:** the guided strength routine is calculated once on opening and used consistently for the title, instructions, sets, and saved workout record, even if a short allocation triggers a light routine.
- **Shared DOM helpers:** `src/coach-dom.ts` centralizes HTML escaping, local JSON storage helpers, and local day-key formatting.
- **Less duplicated scheduling logic:** `weekPlan()`, `recentRides()`, `recentFeedback()`, and `strengthShouldBeLight()` are used throughout Coach.

## Verification
- TypeScript and Vite build checks on preview branch.
- GitHub automated test suite, including added fatigue/recovery regression tests.
- A browser-level visual and device test is still recommended before any production merge.

## Possible future work (not included)
- Replace source-string assertions with behavior-level/UI tests before a larger file split.
- Consolidate stacked Coach CSS with visual regression screenshots.
- Separate large `render()` into per-tab render functions.
- Replace remaining blocking `alert()` and `confirm()` interactions with accessible dialogs.
