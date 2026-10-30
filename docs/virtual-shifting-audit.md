# Virtual drivetrain investigation — 30 October 2026

## Finding

The 24 ratios already matched Zwift. The resistance algorithm did not implement those ratios as a drivetrain. Virtual SIM added `(ratio / 2.40 - 1) * (4 + avatarSpeed² * .08)` to the route gradient and sent FTMS slope commands. This ignored cadence, wheel rollout, rider mass in the control calculation, and the physical gearing/flywheel mapping. A remaining positive commanded gradient can be very heavy in a large physical gear. Avatar-speed feedback and gradient slew also made response depend on ride history.

The separate virtual ERG approximation used `1.5 * (90 + slope * 11) * ratio / 2.40 * max(40, cadence) / 85`. It omitted mass and aerodynamic speed dependence. Battle holds froze wattage, so easing cadence could increase torque instead of easing load. Removing the extra low-gear assistance in PR #57 did not repair any of these structural problems.

The road-motion solver also divided power by at least 1.5 m/s. At low speed this imposed an artificial uphill launch threshold; below it, a 35W/30rpm floor sometimes supplied artificial movement. Replace both with an energy-balance solver.

## Public comparisons

These are public product descriptions, not access to proprietary source code or trainer-lab measurements. Exact numerical control loops remain unpublished for most products.

| Product | Publicly documented approach | Implication |
| --- | --- | --- |
| Zwift | Trainer determines physical gearing from cadence and flywheel velocity at startup; 24 standard gears. | Sending a gear-derived slope offset is not equivalent to calibrated virtual gearing. |
| ROUVY | Trainer-controlled virtual shifting; documents physical gear and wheel-circumference effects. | Hardware configuration can change feel despite identical on-screen gear numbers. |
| BikeTerra | Native trainer shifting when available; otherwise continuously computed ERG targets from gear, cadence and gradient; custom ratios. | A cadence-based power fallback is a documented practical alternative. |
| MyWhoosh | MyShift has 30 gears, default 15; adjusts trainer resistance. | Gear count is not a wattage formula; exact math not published in the reviewed guide. |
| TrainingPeaks Virtual | Virtual cassette adjusts resistance, independently of avatar speed; physical gear setup and compatibility mode documented. | Keep trainer feel separate from measured-power route progress. |
| BikeControl | Controls the trainer and relays it to the riding app; custom ratios; SIM shifting differs from ERG watt adjustments. | Clearly distinguish free-ride gears from fixed-power training. |
| QZ | Author's guide requires correct real chainring and cog settings. | A physical gear mapping is essential for gear-based native/slope solutions. |
| Incyclist | Uses native trainer virtual shifting when available. | Native control is a separate implementation path, not ordinary FTMS slope commands. |
| icTrainer | Documents virtual-shifter/controller support. | No numerical ratio or control formula established from the reviewed FAQ. |

Primary sources:

- Zwift staff explanation: https://forums.zwift.com/t/announcing-virtual-shifting-on-the-wahoo-kickr-core-zwift-one/623803/95
- Zwift gearing options: https://support.zwift.com/fr_ca/shift-style-and-gear-range-rksYezzIC
- ROUVY: https://support.rouvy.com/hc/en-us/articles/32452137189393-Virtual-Shifting-Setup-and-Troubleshooting
- BikeTerra: https://biketerra.com/blog/virtual-shifting-explained
- MyWhoosh: https://mywhoosh.com/myshift-mywhooshs-virtual-shifting-explained/
- TrainingPeaks: https://help.trainingpeaks.com/hc/en-us/articles/31340775240717-TrainingPeaks-Virtual-Trainer-Settings-Trainer-Feel-Virtual-Gearing
- BikeControl: https://bikecontrol.app/virtual-shifting/
- QZ: https://github.com/cagnulein/qdomyos-zwift/wiki/Virtual-Gearing-on-QZ-with-Zwift,-Rouvy,-Mywhoosh-and-Traning-Peaks
- Incyclist: https://incyclist.com/
- icTrainer: https://ictrainer.de/en/faqs-2/
- Road power model validation: Martin et al., https://pubmed.ncbi.nlm.nih.gov/28121252/

## Replacement implemented

Keep Zwift's standard 0.75–5.49 ratio table. Use 2.105m virtual wheel circumference, 1.225kg/m³ air density, CdA 0.38m² and efficiency 0.975, matching existing route assumptions. With cadence `n`, gear ratio `r`, slope angle `a = atan(gradePercent / 100)`:

```
v = n / 60 * r * 2.105
F = massKg * 9.80665 * (sin(a) + Crr * cos(a)) + 0.5 * 1.225 * 0.38 * v²
P = max(0, F * v / 0.975)
```

The target is recalculated from cadence; avatar speed does not feed trainer load. Both virtual route-control selections use FTMS target-power commands. Traditional SIM still uses slope; fixed-wattage ERG still ignores shifting. No native proprietary protocol is claimed or added.

Targets are bounded at 2000W and cadence at 200rpm. Zero cadence, stale cadence after 3 seconds and negative required road power request zero braking power, subject to trainer firmware and its physical minimum resistance. One in-flight virtual-power request prevents queues of obsolete targets; normal requests are limited to 4Hz. Shifts can request immediate updates. A battle freezes slope, while cadence and gears remain live.

Actual avatar progress still uses measured power and actual terrain, with no gear-based speed gift or difficulty scaling. Its low-speed solver uses an implicit kinetic-energy balance, allowing any positive measured power to launch uphill.

## Numerical checks

Assumptions: rider 205lb, bike 22lb, cadence 90rpm, Crr .004, difficulty 100%. Values are calculated crank-power targets, not measured trainer results.

| Grade | Gear 1 | Gear 6 | Gear 12 |
| --- | ---: | ---: | ---: |
| 0% | 13W | 38W | 135W |
| 4% | 111W | 218W | 449W |
| 8% | 209W | 398W | 761W |
| 12% | 305W | 575W | 1070W |

Gear 1 at 4%, 80rpm: approximately 98W. At 90rpm: virtual rollout 8.53km/h / 5.30mph and approximately 111W. At 60rpm it requires less power and climbs more slowly. It does not make maintaining a high road speed on a hill cost less energy.

Regression tests cover ratio values, all-gear ordering, mass/slope/cadence effects, zero/stale cadence, command bytes for both virtual modes, fixed ERG isolation, battle shifting and cadence easing, request coalescing, low-power launch, downhill coasting and convergence to the calculated equilibrium.

## Remaining hardware validation

A real Elite Direto XR-T ride is still needed to check firmware target tracking, minimum achievable low-gear resistance, cadence quality and command latency. The app cannot overcome the trainer's mechanical resistance floor. Compare gear 1 at 4% at 60/80/90rpm, repeat during a battle, shift 1→6→1, stop/restart pedaling, and verify that fixed ERG still holds its selected watts. Native trainer virtual shifting is a separate future path requiring protocol support and calibration, not simulated by this fallback.
