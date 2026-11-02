# Adaptive Training & Garmin Morning Check-In — Breakaway Coach (Preview MVP)

**Branch:** `feat/coach-adaptive-readiness`  
**Status:** Working preview; not production. All changes scoped to Breakaway Coach in Classic.  
**Critical caveat:** Heuristics are transparent product defaults, not clinically validated fatigue scores, and not TrainerRoad AI.

## Rider experience

1. Open Classic → Breakaway Coach → Today.
2. Enter morning Garmin Sleep Score (0–100), overnight HRV (ms), Garmin HRV Status, and optionally personal HRV baseline (lower and upper limits). Save.
3. Coach recomputes today's workout and the next 6 days, with a colored status:
   - **Green:** no additional restriction detected from available data. **Not a medical clearance.**
   - **Yellow:** avoid high intensity. Replace hard intervals with endurance (up to 45 min), shorten longer endurance sessions, and reduce strength duration to 20 min.
   - **Red:** rest recommended. Remove cycling and strength sessions scheduled on that day.
4. Calendar pills and My Week reflect actual adaptations, including before/after workout names and minutes.
5. The "What Coach changed" panel shows original versus updated sessions, the cause, and a reversible **Keep original workout** override.
6. Manually mark a recent planned training day as **Missed** or **Skipped**; it is never automatically added on the following day.
7. Recorded rides from the platform's Classic, Survival, Cycle Quest and supported historical imports influence the plan even when the ride did not match Coach's recommendation.
8. Sessions logged on the current day prevent a second automatic cycling prescription.

## Data interpretation

Garmin supplies Sleep Score categories in the 0–100 range. Garmin HRV Status uses the individual's own historical baseline. **Never compare a rider's absolute overnight HRV with someone else's.**

Transparent, conservative V1 defaults:
- Sleep Score below 70: yellow caution.
- HRV Status unbalanced, low, or poor, or an entered overnight HRV below the rider-provided baseline: yellow caution.
- Sleep below 45 together with HRV substantially below personal baseline or Garmin Low/Poor status: red rest recommendation.
- 3 hard rides in 48h (duration ≥30m and avg power ≥80% FTP): red; 1 hard ride within 36h: yellow.
- Effort feedback ≥9/10 within 48h: yellow.
- ≥3 explicit missed/skipped training days within prior week: yellow re-entry advice.
- Red today can conservatively cause yellow tomorrow. No future sleep/HRV values are predicted.
- Users can keep their original workouts; this is displayed as an explicit override and remains reversible.

These cutoffs are **unvalidated initial settings**, not a diagnosis or proof that a workout is safe. Sleep loss, illness, stress, and other symptoms matter even on a green day. The app should not autonomously prescribe intensity increases based solely on higher HRV or an unusually high Sleep Score.

## Data retention

Morning data, missed-day flags and overrides are stored locally in browser storage on this device (no Garmin API integration in this version). Users can edit the same day's morning data or clear it.

## Known limitations and follow-ups

- Only a rolling seven-day window is adapted. TrainerRoad's current AI simulation analyzes 28 days; this prototype does **not** duplicate that algorithm.
- No automatic Garmin Connect syncing or Garmin Training Readiness integration; entered readings are manual.
- No personalized chronic training stress model, HRV trend calibration, progression-level prediction, predicted FTP, or confidence-based model training.
- Missed days are explicitly logged rather than inferred from missing sync data, to avoid treating missing imports as missed workouts.
- No automatic "make up" rides.
- Needs full visual/keyboard, real trainer, and historical data QA before production.

## Inspiration and scientific framing

- TrainerRoad Fatigue Detection: https://support.trainerroad.com/hc/trainerroad-support/articles/20753792083995-what-is-trainerroad-s-fatigue-detection
- TrainerRoad AI Training Simulation: https://support.trainerroad.com/hc/trainerroad-support/articles/41652509070619-how-to-use-ai-training-simulation
- TrainerRoad Recovery and Rest: https://support.trainerroad.com/hc/trainerroad-support/articles/41653427929371-how-does-recovery-work-in-the-ai-training-simulation
- TrainerRoad schedule adjustment: https://support.trainerroad.com/hc/trainerroad-support/articles/36185898667291-how-to-edit-your-training-plan-schedule
- Garmin HRV Status and personal baseline: https://www.garmin.com/en-US/blog/fitness/understanding-the-hrv-status-on-your-garmin-smartwatch/
- Garmin Sleep Score guide: https://support.garmin.com/en-IN/?faq=mBRMf4ks7XAQ03qtsbI8J6
