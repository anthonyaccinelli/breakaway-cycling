# Agent development contract — Spokemon

Read docs/CURRENT_STATUS.md and SPOKEMON_DEVELOPMENT.md before any coding or deployment work.

Only Spokemon is in this branch. Do not reintroduce Classic, Survival, Cycle Quest or Breakaway Coach dependencies.

The approved Illustrator SVG artboards in public/pedalkin/ are pixel-for-pixel authoritative. Never regenerate or alter them without an explicit request. Dynamic values and sprites belong in separate overlays or controlled SVG native fields.

Never change recorded power, cadence, speed, grade or distance to simulate a test ride. Simulated rides are visibly labeled and must not produce real TCX activities.

Cadence-only support is required: no power measurement, FTMS or resistance control should be mandatory to progress. Fresh wheel speed overrides cadence-derived virtual speed, and stale telemetry must stop progression. Trust at 100% always means capture.

Every change must pass npm test, npm run build and npm run test:browser; actual Bluetooth/SIM/ERG and shifting changes additionally require physical trainer/sensor verification.

Separate PRs and explicit deployment targets. Do not merge this branch into anthonyaccinelli/breakaway-cycling main. Do not delete legacy Spokemon before verifying export/import and a replacement deployment.

For chats: inspect the branch and CI head and docs/CURRENT_STATUS.md first; summarize any new decisions there rather than relying on chat history.
