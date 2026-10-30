# Story and soundtrack release integration

Combines PR #55 (fixed Story routes and Freeroam) and #56 (soundtrack and animated enemies). Story uses ten fixed 100-mile seed recipes; Freeroam is the default for newly generated rides and does not advance chapter mileage. Existing Story/adventure saves normalize onto their current fixed chapter route while retaining accumulated chapter miles.

Integration fixes:
- Keep both Story and music modules in the protected/autoplay asset manifest.
- Keep Rest at Inn, animation support, the shared mute controls and page soundtrack notifications.
- Hold Story route completion at 100 miles until its chapter boss is resolved; finite Freeroam routes retain normal end-of-ride handling.
- Restore the rider position when returning from Freeroam to Story.
- Load the next chapter's route after a boss victory and reset the distance baseline.
- After the tenth boss, retain the final route, mark Story complete and allow Freeroam rather than rendering a null elevation profile.
- Preserve invalid save recovery protections and regenerate autoplay from combined sources.

The chapter-banner image redesign and New Game+ are not introduced by these PRs.

Validation: 178 automated tests and production build pass, including deterministic Story routes/ascent, saved position, boss endpoint gating, completion rewards, save migration, soundtrack transitions, animated asset structure and existing trainer regression coverage. Physical trainer ride testing is still required for hardware behavior.
