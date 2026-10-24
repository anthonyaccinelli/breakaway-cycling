# Ride Breakaway development workflow

- `main` is the production branch powering ridebreakaway.com. Do not push unapproved changes to main.
- `development` is the testing branch. Make all UI and feature changes here first.
- Vercel should build a preview deployment from development. Share its preview URL with the owner for review.
- Do not merge into main until the owner explicitly approves the specific preview.
- Run the production build and inspect the preview before requesting approval.
- Do not use production data for destructive tests. Keep schema changes backward-compatible and isolate any test writes.
- If a preview fails, fix development only; production stays untouched.
