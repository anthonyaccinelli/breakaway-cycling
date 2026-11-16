# Breakaway Cycling v3.4.5 — Ride dashboard

Based on v3.4.4 Chrome + Electron helper (not DMG).

- Elevation dashboard tile replaced with **elapsed moving/active ride time** (HH:MM:SS; paused time excluded).
- Power tile shows a rolling, time-weighted **3-second average** of actual FTMS power readings.
- Total ascent is the **climbing actually ridden**, including retained climbing history on endless routes, not planned route gain.
- Calories estimated from measured power: mechanical joules / 0.24 gross efficiency / 4184 J per kcal.
- Beers earned = estimated kcal / 150 kcal per illustrative beer. Fractional beers shown; calorie estimates are approximate and not dietary advice.
- TCX Calories field uses estimated calories.
- Original gradient, speed, cadence, HR, virtual gear, routes, Click keepalive and overlay preserved.

Run **Start GPX Trainer with Overlay.command** on Mac.
