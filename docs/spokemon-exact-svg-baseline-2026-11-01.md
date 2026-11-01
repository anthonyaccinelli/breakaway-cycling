# Spokemon — exact SVG visual baseline (2026-11-01)

## User-approved workflow
- Use the user's uploaded SVG as the sole source of visual truth. Do not redesign, redraw, recolor, or reposition it without approval.
- When a playable preview is requested: modify the existing Breakaway GitHub project, deploy to its EXISTING Vercel project, verify READY, supply direct real-site preview URL.
- Don't create separate simplified demo projects. Don't merge to main without approval.

## Exact file provenance
The uploads `gamescreens_Explore Screen(4).svg` and `gamescreens_Encounter Screen(4).svg` were byte-identical to the existing files committed in `public/pedalkin/` on 2026-11-01.

- Explore: `public/pedalkin/explore.svg`, 1,533,322 bytes, SHA256 `8c18256d25189174b9fa4a2901028c8b046a218bb4d86400cb04053f0d9834ce`, Git blob SHA `fbe48707afecef0840b3d8664c728aec06e38ea1`.
- Encounter: `public/pedalkin/encounter.svg`, 770,634 bytes, SHA256 `1660fb4ad9d16e9e516526735abed099ab99b18ebfd55e48487ceb8eeeffd143`, Git blob SHA `549e2feeff8cd440623002711383e72f5ebefd2d`.
- Both are native 1920 × 1080 SVGs and embed their bitmap art as data URIs. No substitute art needed.

## Implementation
- Baseline branch: `feature/spokemon-exact-svg-2026-11-01`.
- `src/pedalkin-ride.ts` defaults to exact-artboard approval mode (do not call runtime SVG DOM transformations). It uses `<img src="/pedalkin/explore.svg">` / `<img src="/pedalkin/encounter.svg">`, changing the image only when the scene changes.
- `src/pedalkin-ride.css` uniformly scales the whole 16:9 image within the viewport; it hides the external development toolbar and ride navigation.
- Keyboard navigation in the exact visual view: `E` Encounter, `X` Explore, `1` Route, `2` Devices. Original transparent menu hit targets remain interactive.
- The old dynamic SVG transformation code is retained behind `?spokemonDynamic=1` for reference only and is not the approved visual output. Do not reactivate before separate user approval.
- `?pedalkinPreview=explore` and `?pedalkinPreview=encounter` provide trainer-free preview entry (no route/device gate).
- Current Route and Devices implementation are inherited unchanged from `feature/pedalkin-route-studio`.
- Production `main` and ridebreakaway.com have not been modified by this baseline.

## Recovery
- Historical pre-new-chat commit: `995878294a4991443d39cf7a95798d6f8474d591`.
- Historical preservation branch: `recovery/spokemon-pre-new-chat-2026-11-01`.
- Avoid further experimental styling on either the recovered historical branch or the exact visual baseline. Make additional work on a NEW feature branch.
- Grade palette (FOR FUTURE APPROVED DYNAMIC WORK, not baked into the exact untouched artboards): downhill `#F6D58C`; 0–1% `#9ECA96`; 1–4% `#6AAD38`; 4–8% `#989141`; 8–12% `#C6744A`; 12%+ `#F45853`.

## Remaining work
- User visual approval of EXACT artboards first.
- Once approved, add live metrics/Trust/Patience/grade visualization in ways that do not visibly deviate from the approved masters.
- Reconfirm that `03 Ride` remains accessible without a trainer in test/play mode, and that real ride recording/control still requires valid hardware data.

## Context-transfer rule
At the first sign this conversation is getting lengthy, provide the user a concise copyable handoff containing this document path, current branch, commit SHA, Vercel URL, what has been approved, and what remains unapproved. Do this BEFORE the chat length cap.
