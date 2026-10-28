# Verification of Claude's review

Reviewed the uploaded review-fixes archive against main e4c167ca6b2dad41950f381106be22ae5d06d521, rather than replacing current files with its older snapshot.

| Finding | Disposition |
| --- | --- |
| XP can exceed the validator limit | Confirmed. Use one shared 10,000,000 XP limit for earned and workout XP. Recover finite legacy over-limit XP, preserving the original stored JSON in `cycle-quest-character-v1-xp-limit-backup` before autosave. Display the limit explicitly. This preserves the existing ceiling; extending endgame progression remains separate work. |
| Invalid saves overwritten by a new character | Already fixed on main: pause gameplay and autosave, retain and export the original raw save. Retained that safer behavior. |
| Stored HTML injection | Most name fields already escaped. Fixed the remaining enemy level and climb category interpolations, and telemetry values used in HTML. Validate per-enemy levels. Escaping is done where HTML is generated instead of stripping legitimate names. |
| Import overwrites current character silently | Confirmed. Require confirmation for an existing save; back up its original JSON before replacing it. Abort if backup fails or another tab has changed the save, including while reading the file. Existing 8 MB limit and unfinished-ride protection retained. |
| No standard test command or CI | Confirmed. Add npm test (including generated test assets) and a read-only GitHub Actions build/test workflow. |
| Survival tests fail | Already fixed on main; current tests pass. |
| Positional stat selectors | Real maintenance risk. Replace array offsets with named data-stat hooks in main and overlay. Missing stat nodes no longer throw; reordering does not change the target. |
| Autoplay asset drift and no-op lookup | Already addressed by the shared asset manifest, guarded builders, and previous cleanup. Retained those changes. |

The archive does not include concrete findings for its brief mention of later items such as bestiary numbers, share-card quota, or login rate limiting. Bestiary and summary error handling already changed on main; no speculative changes were applied.

Research: OWASP's DOM XSS Prevention Cheat Sheet recommends safe DOM text insertion or context-appropriate escaping; GitHub's Building and Testing Node.js guide describes setup-node, npm ci, and build/test workflows. Neither supports replacing modern game files with an older snapshot.

Validation: production build and full test suite, with new regression coverage for XP boundary/recovery, hostile enemy levels, named stat hooks, import cancellation, stale tabs, and failed backup writes.
