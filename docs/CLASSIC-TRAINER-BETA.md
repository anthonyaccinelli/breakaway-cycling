# Classic trainer support — beta plan

## Agreed behavior
- **Power meter (first priority):** read standard BLE Cycling Power service 0x1818, measurement 0x2A63; simulate route gradient with measured watts, rider+bike mass, aerodynamic drag and rolling resistance. No automatic trainer resistance.
- **Wheel speed sensor (second priority):** read Cycling Speed and Cadence service 0x1816, measurement 0x2A5B; compute physical wheel speed from wheel circumference and wheel revolution event times. Advance route by measured speed regardless of grade by default. Allow an explicitly opt-in virtual climb simulation later.
- **Cadence-only (third priority):** approximate effort, only after calibration and with clear estimated-data labels. Cadence is not power.
- **Heart-rate-only (fourth priority):** approximate recreational mode only, requiring individual calibration, smoothing, and safety limits. Heart rate lags and is not a power meter.

## UX
On Connect Trainer offer **Smart trainer** (existing FTMS, default) and **Classic trainer** (power, wheel-speed, cadence, or HR sensor). The classic path must not request FTMS control or expose automatic resistance/ERG controls. Show sensor connectivity, last packet time, estimated vs measured data labels, and a manual-resistance reminder for climbs. Preserve current desktop UI for smart trainers.

## Implementation gates
1. Unit test CSC rollover, counter rollover, short packets, no movement, and power packets.
2. Integrate separate BLE device selection/notifications and disconnect handling with ride lifecycle.
3. Add explicit ride start, pause, resume, recovery, and TCX provenance for classic modes.
4. Verify trainer-independent operation with physical BLE sensors on desktop Chrome/Edge.
5. Keep unsupported iOS browser BLE messaging; native iOS work remains a separate track.

`src/classic-trainer.ts` provides pure decoding/physics primitives only. **Classic trainer connections and riding are not enabled yet.** No existing FTMS behavior has been changed.
