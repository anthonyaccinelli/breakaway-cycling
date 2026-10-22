# Breakaway Cycling v3.4.7 — Chaotic Routes

Procedural routes now use seeded variable-length climb/descent segments, independently randomized grade peaks, asymmetric crests and nonuniform undulations instead of repeating sine waves. The fixed-route target ascent uses the same 80-meter sample intervals as the generated route, so its elevation gain is calibrated to the requested feet (within numeric rounding). The ±12% grade cap is preserved, and impossible ascent requests are rejected. Endless routes continue to generate on demand.

Launch `Start GPX Trainer with Overlay.command` as before. Generate a fixed 5-mile route with 200 feet of ascent, then change the seed to see a different distribution of climbs.

Note: untested with physical trainer; no changes to trainer or Zwift Click protocols.
