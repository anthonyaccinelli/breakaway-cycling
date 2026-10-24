# Breakaway design directions

## Option 1 — Breakaway Atelier (preserved)
Midnight ink, slate-blue panels, electric citron primary buttons, glacier teal secondary accents, Manrope headings and DM Sans interface typography, rounded corners and soft depth.

Saved implementation: commit `4e8a97ae3a936fabc7e9ebdf3022bffa97cbd893` (development). To restore for side-by-side review, use the CSS section beginning `/* BREAKAWAY ATELIER` from that commit. This option is NOT approved for production.

## Option 2 — Editorial Teal (current development preview)
Reference: the two Adobe Express template collage screenshots provided by the owner on October 23, 2026, plus https://express.adobe.com/explore/templates?assetCollection=urn%3Aaaid%3Asc%3AVA6C2%3Aadaa347f-7996-45e3-9c92-c4c26e3273e0

Observed visual motifs: deep forest teal, ocean teal, seafoam and mint, pale cream, occasional chartreuse; bold condensed-feeling sans headlines, selective editorial serif, strong asymmetrical visual hierarchy, graphic color blocks, tight purposeful radii, large typography, clean charts. The implementation uses Outfit for bold titles, DM Sans for UI and DM Serif Display selectively for editorial headings.

Current implementation: commit `a6e60acc0009708a7568fb7de549fd40f6e05a16` on development, in `src/style.css`. Styling-only first pass; no ride logic changes.

**Release rule:** Neither design is approved for production. Develop on `development` and obtain explicit owner approval before merging to `main`.
