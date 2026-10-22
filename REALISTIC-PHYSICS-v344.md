# Breakaway Cycling v3.4.4 — Realistic cycling physics

Based on the **v3.4.3 Chrome-based Web Edition** with the Zwift Click 15-second keepalive and v3.4.2 overlay-follow changes preserved. No DMG required.

## New physics
- Integrates forward speed and distance with small (up to 50 ms) steps.
- Measured power provides propulsion, including from a standing start.
- Gravity accelerates on downhills and slows riders on climbs.
- Aerodynamic drag and rolling resistance gradually slow the rider when coasting on flats.
- Speed cannot go below zero; route completion still stops the ride.
- FTMS resistance and Zwift Click shifting logic are unchanged.

## Mac startup
Extract the ZIP and run **Start GPX Trainer with Overlay.command**. Requires Node.js as with the previous Web Edition. Open the browser at localhost:5173 if needed.

## Test
Ride on a flat, release the pedals and check for gradual deceleration while distance advances. Repeat on a descent to see continued rolling/acceleration, and on a climb to see rapid deceleration. Test Click after 5–10 minutes of inactivity and confirm overlay rider tracking.

Note: coasting is simulated *virtual road motion*; it does not cause the trainer flywheel to spin itself. This has not been tested on physical trainer hardware.
