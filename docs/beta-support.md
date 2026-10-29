# Beta support

The homepage shows a concise compatibility notice and separate capability checks for Web Bluetooth and Document Picture-in-Picture. These check API availability only; they do not claim a trainer is connected. Cycle Quest access instructions show the existing beta password and retain the original gate.

The report button appears in the home header and as a floating button in the main app's other screens. It opens four fields: trainer model, editable browser/OS, current mode, and what happened. No trainer telemetry, character saves, or ride recordings are collected. The release identifier is `4.0.9-beta-support-20261029`.

Reports are sent over HTTPS to `public.beta_bug_reports` in the existing Breakaway Cycling Supabase project. Review them in the project's authenticated Table Editor. There is no public report listing. Anonymous and authenticated clients can insert bounded report fields, but cannot select, update, delete, set timestamps, or set report IDs. RLS is enabled. Provisioning SQL is recorded in `database/beta-bug-reports.sql` and was applied through the provider migration API.

The existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are used. No server secret is placed in the browser. Failed submissions retain text in the form; success is shown only after the server accepts the write. The static design preview's local-only report behavior is not used in the live application.
