# Pedalkin — approved color palette

Source: user-uploaded four-stripe reference image, October 31, 2026.

| Token | Hex | RGB | Intended role |
| --- | --- | --- | --- |
| Deep forest | **#0F292F** | 15, 41, 47 | Main text, dark elevations, backdrop accents |
| Forest teal | **#21484E** | 33, 72, 78 | Configuration panel, header / navigation, primary actions |
| Peach | **#FBC5AB** | 251, 197, 171 | Borders, accent buttons, active route indicators |
| White | **#FFFFFF** | 255, 255, 255 | Main canvas, input backgrounds, cards |

This palette is saved as the Pedalkin design reference; do not change the
live user-created Illustrator SVGs for the Explore or Encounter screens
just to recolor them.

## 01 Create Route

Reuses the **same Classic route layout and dimensions (2048 × 1044 reference)**
with the same responsive CSS grid and the original route-generator, preview
chart, upload, seed and navigation controls. Pedalkin overrides color and
copy only. As previously directed, hide Difficulty in Pedalkin without
removing the underlying control, and show Terrain, Distance, Total Elevation,
Route Seed and Lock within the same two-column Classic field area.

## Implementation

- Shared component: `src/classic-route-reference.ts`
- Shared layout: `src/classic-route-reference.css`
- Pedalkin-only colors, banner and field placement: `src/pedalkin-classic-route.css`
- Classic navigation: `src/classic-cockpit.ts`
- Pedalkin 03 Ride continues to use the uploaded Illustrator designs unchanged.
