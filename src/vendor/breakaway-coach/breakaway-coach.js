const Ae = "breakaway.coach.profile.v1", xt = "breakaway.coach.history.v1", $e = { ftp: 200, hours: 5, days: 3, restDay: 6, goal: "fitness", experience: "beginner" };
function xe(e) {
  const t = e && typeof e == "object" ? e : {}, n = (a, i, o, d) => typeof a == "number" && Number.isFinite(a) ? Math.min(o, Math.max(i, a)) : d;
  return {
    ftp: Math.round(n(t.ftp, 75, 550, $e.ftp)),
    hours: n(t.hours, 1, 20, $e.hours),
    days: Math.round(n(t.days, 2, 6, $e.days)),
    restDay: Math.round(n(t.restDay, 0, 6, $e.restDay)),
    goal: ["fitness", "ftp", "endurance", "race"].includes(String(t.goal)) ? t.goal : "fitness",
    experience: ["beginner", "intermediate", "advanced"].includes(String(t.experience)) ? t.experience : "beginner"
  };
}
const W = (e, t, n, a) => ({ name: e, minutes: t, low: n, high: a });
function kt(e) {
  const t = xe(e), n = t.experience === "beginner", a = Math.max(20, Math.min(n ? 45 : t.experience === "intermediate" ? 75 : 110, Math.round(t.hours * 60 / t.days) - 15));
  return [
    {
      id: "recovery",
      name: "Recovery Spin",
      description: "Easy spinning and relaxed cadence.",
      category: "Recovery",
      segments: [W("Ease in", 5, 0.4, 0.5), W("Easy spin", n ? 15 : 25, 0.45, 0.58), W("Cool down", 5, 0.35, 0.45)]
    },
    {
      id: "endurance",
      name: "Aerobic Builder",
      description: "Build endurance with an achievable steady effort.",
      category: "Endurance",
      segments: [W("Warm up", 8, 0.45, 0.6), W("Zone 2 cruise", a, 0.56, 0.75), W("Cool down", 7, 0.4, 0.5)]
    },
    {
      id: "tempo",
      name: "Tempo Builder",
      description: "Practice sustained, controlled work with recovery.",
      category: "Tempo",
      segments: [W("Warm up", 10, 0.45, 0.65), W("Tempo 1", n ? 5 : 10, 0.76, 0.87), W("Recovery", 4, 0.45, 0.6), W("Tempo 2", n ? 5 : 10, 0.76, 0.87), W("Cool down", 6, 0.4, 0.5)]
    },
    {
      id: "sweetspot",
      name: "Sweet Spot Builder",
      description: "Develop sustainable power without maximal efforts.",
      category: "Threshold",
      segments: [W("Warm up", 10, 0.45, 0.7), W("Sweet Spot 1", 8, 0.88, 0.94), W("Recovery", 5, 0.45, 0.58), W("Sweet Spot 2", 8, 0.88, 0.94), W("Cool down", 8, 0.4, 0.55)]
    },
    {
      id: "vo2",
      name: "VO2 Intervals",
      description: "Short hard efforts separated by easy recovery.",
      category: "High intensity",
      segments: [W("Warm up", 10, 0.45, 0.7), W("Work 1", 3, 1.05, 1.15), W("Recovery 1", 4, 0.43, 0.55), W("Work 2", 3, 1.05, 1.15), W("Recovery 2", 4, 0.43, 0.55), W("Work 3", 3, 1.05, 1.15), W("Cool down", 8, 0.4, 0.5)]
    },
    {
      id: "preview",
      name: "Coach Test Ride",
      description: "A short session to try live coaching and trainer control.",
      category: "Test",
      segments: [W("Warm up", 2, 0.45, 0.55), W("Steady", 2, 0.65, 0.75), W("Recovery", 1, 0.4, 0.5), W("Tempo", 2, 0.77, 0.85), W("Cool down", 1, 0.4, 0.5)]
    }
  ];
}
function X(e) {
  return Math.round(e.segments.reduce((t, n) => t + n.minutes * 60, 0));
}
function Ke(e, t) {
  const n = X(e), a = Math.max(0, Math.min(n, t));
  let i = 0;
  for (let o = 0; o < e.segments.length; o++) {
    const d = e.segments[o], s = i + d.minutes * 60;
    if (a < s || o === e.segments.length - 1)
      return { segment: d, index: o, remaining: Math.max(0, s - a), progress: Math.min(1, Math.max(0, (a - i) / (s - i))), total: n, done: t >= n };
    i = s;
  }
  throw Error("The workout must have at least one interval");
}
function ln(e, t) {
  const n = Math.max(0, Math.round(t.minutes * 60)), a = Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0"), i = Math.round(e * t.low), o = Math.round(e * t.high), d = De(e, t);
  return {
    duration: a,
    lowWatts: i,
    highWatts: o,
    target: d,
    range: i + "–" + o + " W",
    ftpRange: Math.round(t.low * 100) + "–" + Math.round(t.high * 100) + "% FTP"
  };
}
function De(e, t, n = 1) {
  const a = (t.low + t.high) / 2;
  return Math.max(30, Math.min(1e3, Math.round(e * a * n)));
}
function dn(e, t, n, a = 1) {
  return Number.isFinite(e) && e >= t * n.low * a * 0.95 && e <= t * n.high * a * 1.05;
}
function Gn(e) {
  return ["structured", "guided"];
}
function Rn(e, t = !1) {
  const n = xe(e), a = n.days === 2 ? [1, 4] : n.days === 3 ? [1, 3, 6] : n.days === 4 ? [1, 2, 4, 6] : n.days === 5 ? [0, 1, 3, 4, 6] : n.days === 6 ? [0, 1, 2, 3, 4, 6] : [0, 1, 2, 3, 4, 5, 6];
  if (n.days < 7 && a.includes(n.restDay)) {
    const o = Array.from({ length: 7 }, (d, s) => s).filter((d) => d !== n.restDay && !a.includes(d)).sort((d, s) => Math.abs(d - n.restDay) - Math.abs(s - n.restDay))[0];
    o !== void 0 && a.splice(a.indexOf(n.restDay), 1, o), a.sort((d, s) => d - s);
  }
  const i = n.experience === "beginner" ? "tempo" : n.goal === "race" ? "vo2" : "sweetspot";
  return Array.from({ length: 7 }, (o, d) => {
    const s = a.indexOf(d);
    if (s < 0) return { day: d, workoutId: null, reason: "Rest or optional easy movement" };
    const m = t ? s === 0 ? "recovery" : "endurance" : s === 0 ? i : s === a.length - 1 ? "endurance" : s % 3 === 0 ? "tempo" : s % 2 === 0 ? "recovery" : "endurance";
    return { day: d, workoutId: m, reason: t ? "Reduced intensity after a difficult session" : "Planned training session" };
  });
}
function Ot(e, t, n = [], a = []) {
  const i = xe(e), o = n.some((s) => Number.isFinite(s.start) && s.start <= t && t - s.start <= 36 * 36e5 && Number.isFinite(s.elapsed) && s.elapsed >= 1800 && s.avgPower !== null && Number.isFinite(s.avgPower) && s.avgPower >= i.ftp * 0.8), d = a.some((s) => Number.isFinite(s.date) && s.date <= t && t - s.date <= 48 * 36e5 && s.rpe !== null && s.rpe >= 9);
  return { demandingRide: o, veryHardFeedback: d, fatigued: o || d };
}
function un(e, t, n = [], a = [], i) {
  const o = xe(e), d = t.getTime(), s = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(), m = (i == null ? void 0 : i.find((l) => l.day === t.getDay())) ?? Rn(o, !1)[t.getDay()], y = n.filter((l) => Number.isFinite(l.start) && l.start <= d && Number.isFinite(l.elapsed) && l.elapsed > 0 && l.start >= d - 7 * 864e5), v = y.some((l) => l.start >= s && l.elapsed >= 900), { demandingRide: S, veryHardFeedback: I } = Ot(o, d, y, a);
  if (v) return {
    workoutId: null,
    status: "completed",
    reason: "You already recorded a ride today. Coach is not stacking another prescribed session. Rest, or choose an optional workout."
  };
  if (!m.workoutId) return {
    workoutId: null,
    status: "rest",
    reason: "Today is outside your " + o.days + " planned training days. Rest supports consistency. You can still choose an optional workout."
  };
  if (S || I) return {
    workoutId: "recovery",
    status: "recovery",
    reason: S ? "A demanding ride was recorded recently. Coach has replaced the planned workout with an easy recovery spin based on duration and average power." : "Your recent workout feedback indicated very high effort. Coach has selected an easier recovery spin."
  };
  const f = {
    fitness: "regular riding and consistency",
    ftp: "building sustainable power",
    endurance: "aerobic endurance",
    race: "preparing for your cycling event"
  };
  return {
    workoutId: m.workoutId,
    status: "planned",
    reason: i && m.reason ? "Event-based plan: " + m.reason : "Your " + o.days + "-day weekly schedule calls for this session to support " + f[o.goal] + ". The recommendation uses your rider profile and basic scheduling rules."
  };
}
function Tt(e, t = 30) {
  const n = e.segments.reduce((v, S) => v + S.minutes, 0), a = Math.max(12, Math.min(t, n));
  if (n <= a) return e;
  const i = e.segments.length;
  if (i >= a) return e;
  const o = a - i, d = e.segments.map((v) => Math.max(0, v.minutes - 1)), s = d.reduce((v, S) => v + S, 0), m = e.segments.map((v, S) => ({
    ...v,
    minutes: Math.max(1, Math.floor((1 + (s ? d[S] / s * o : 0)) * 2) / 2)
  }));
  let y = m.reduce((v, S) => v + S.minutes, 0);
  for (let v = 0; y + 0.5 <= a; v = (v + 1) % m.length)
    m[v].minutes += 0.5, y += 0.5;
  return {
    ...e,
    id: e.id + "-short",
    name: e.name + " · Short",
    segments: m,
    description: "Shortened version: " + e.description
  };
}
function jn(e) {
  return e === null ? "Rate how the session felt so future recommendations have more context." : e >= 9 ? "That felt very hard. Consider recovery or rest next; do not stack another demanding workout." : e >= 7 ? "Challenging session completed. Check your fatigue before the next hard effort." : e <= 3 ? "Comfortable effort. Keep building consistency rather than chasing extra intensity." : "Good training. Keep the next session aligned with your weekly plan.";
}
const We = (e) => typeof e == "number" && Number.isFinite(e), et = (e) => {
  if (e == null || e === "") return null;
  const t = Number(e);
  return We(t) ? t : null;
}, te = (e, t = 1e8) => {
  const n = et(e);
  return n !== null && n >= 0 && n <= t ? n : null;
}, ue = (e, t = 1e8) => {
  const n = et(e);
  return n !== null && n > 0 && n <= t ? n : null;
}, ht = (e) => {
  if (e instanceof Date) return Number.isFinite(e.getTime()) ? e.getTime() : null;
  if (typeof e == "number") return Number.isFinite(e) && e > 1e11 ? e : null;
  if (typeof e != "string" || !e.trim()) return null;
  const t = Date.parse(e);
  return Number.isFinite(t) ? t : null;
};
function hn(...e) {
  for (const t of e) {
    const n = et(t);
    if (n !== null) return n;
  }
  return null;
}
function Wt(e) {
  const t = String(e ?? "").trim().toLowerCase().replace(/[\s_-]/g, "");
  return ["ride", "cycling", "biking", "2", "virtualride", "virtualcycling", "ebikeride", "mountainbikeride", "gravelride", "handcycle", "velomobile", "e-mountainbikeride", "emtbride"].includes(t);
}
function Kn(e) {
  return typeof e == "string" && e.trim() ? e.trim().slice(0, 120) : "Cycling activity";
}
function Vn(e) {
  const t = ue(e.duration, 604800), n = ht(e.start);
  if (n === null || n < 9466848e5 || n > Date.now() + 864e5 || t === null || t < 60) throw Error("Invalid ride date or duration.");
  if (!["FIT", "TCX", "GPX", "CSV"].includes(e.source)) throw Error("Unknown recording format.");
  const a = te(e.avgPower, 2500), i = te(e.avgHeartRate, 240), o = te(e.avgCadence, 250), d = te(e.best20minWatts, 2e3), s = te(e.distanceMeters, 1e7), m = te(e.elevationMeters, 1e5), y = ue(e.movingSeconds, 7 * 86400);
  return {
    key: e.stravaId ? "strava:" + e.stravaId : "ride:" + Math.round(n / 1e3) + ":" + Math.round(t),
    stravaId: e.stravaId ? String(e.stravaId).slice(0, 30) : null,
    name: Kn(e.name),
    start: n,
    duration: Math.round(t),
    movingSeconds: y === null ? null : Math.round(Math.min(t, y)),
    distanceMeters: s,
    elevationMeters: m,
    avgPower: a,
    avgHeartRate: i,
    avgCadence: o,
    best20minWatts: d,
    source: e.source,
    indoor: !!e.indoor
  };
}
function Yt(e, t) {
  return Vn({
    name: t.name || "Cycling activity",
    start: t.start || 0,
    duration: t.duration || 0,
    movingSeconds: t.movingSeconds ?? null,
    distanceMeters: t.distanceMeters ?? null,
    elevationMeters: t.elevationMeters ?? null,
    avgPower: t.avgPower ?? null,
    avgHeartRate: t.avgHeartRate ?? null,
    avgCadence: t.avgCadence ?? null,
    best20minWatts: t.best20minWatts ?? null,
    source: e,
    indoor: !!t.indoor,
    stravaId: t.stravaId ?? null
  });
}
function He(e, ...t) {
  for (const n of t) {
    const a = ht(e[n]);
    if (a !== null) return a;
  }
  return null;
}
function An(e) {
  let t = [], n = 0, a = 0, i = 0, o = 0;
  for (let d = 1; d < e.length; d++) {
    const s = e[d - 1], m = e[d], y = (m.t - s.t) / 1e3;
    if (!(!We(y) || y <= 0)) {
      if (y > 10) {
        t = [], n = 0, a = 0, i = 0;
        continue;
      }
      if (!(!We(s.power) || s.power < 0 || s.power > 2e3)) {
        for (t.push({ duration: y, power: s.power }), a += y, i += y * s.power; a > 1200 && n < t.length; ) {
          const v = t[n], S = a - 1200;
          v.duration <= S + 1e-8 ? (a -= v.duration, i -= v.duration * v.power, n++) : (v.duration -= S, a -= S, i -= S * v.power);
        }
        n > 200 && (t = t.slice(n), n = 0), a >= 1199.9 && (o = Math.max(o, i / a));
      }
    }
  }
  return o > 0 ? Math.round(o) : null;
}
function _n(e, t = "Activity.fit", n, a = null) {
  var Y;
  const i = e.sessions || e.sessionMesgs || (e.session ? [e.session] : []), o = Array.isArray(i) ? i[0] : null;
  if (!o) throw Error("FIT activity has no session.");
  const d = o.sport ?? e.sport ?? ((Y = e.file_id) == null ? void 0 : Y.sport);
  if (!Wt(d)) throw Error("Not a cycling activity.");
  const s = e.records || e.recordMesgs || [], m = Array.isArray(s) ? s : [];
  if (m.length > 16e4) throw Error("FIT activity has too many samples.");
  const y = He(o, "start_time", "startTime") ?? He(e, "start_time", "startTime") ?? (m.length ? He(m[0], "timestamp") : null), v = He(o, "timestamp") ?? (m.length ? He(m[m.length - 1], "timestamp") : null), S = hn(o.total_elapsed_time, o.totalElapsedTime, o.total_timer_time, o.totalTimerTime), I = S && S > 0 ? S : y !== null && v !== null ? (v - y) / 1e3 : 0, f = m.map((D) => ({ t: He(D, "timestamp") ?? NaN, power: hn(D.power, D.watts) ?? NaN })).filter((D) => We(D.t));
  let l = 0, T = 0, E = 0, N = 0, R = 0, x = 0;
  for (const D of m) {
    const k = te(D.power ?? D.watts, 2500);
    k !== null && (l += k, T++);
    const ce = ue(D.heart_rate ?? D.heartRate, 240);
    ce !== null && (E += ce, N++);
    const he = ue(D.cadence, 250);
    he !== null && (R += he, x++);
  }
  const P = String(o.sub_sport ?? o.subSport ?? "").toLowerCase();
  return Yt("FIT", {
    name: n || t,
    start: y ?? 0,
    duration: I,
    stravaId: a,
    indoor: /indoor|virtual|trainer/.test(P),
    movingSeconds: ue(o.total_timer_time ?? o.totalTimerTime, 7 * 86400),
    distanceMeters: te(o.total_distance ?? o.totalDistance, 1e7),
    elevationMeters: te(o.total_ascent ?? o.totalAscent, 1e5),
    avgPower: te(o.avg_power ?? o.avgPower, 2500) ?? (T ? l / T : null),
    avgHeartRate: ue(o.avg_heart_rate ?? o.avgHeartRate, 240) ?? (N ? E / N : null),
    avgCadence: ue(o.avg_cadence ?? o.avgCadence, 250) ?? (x ? R / x : null),
    best20minWatts: An(f)
  });
}
const st = (e, t) => Array.from(e.getElementsByTagNameNS("*", t));
function Ee(e, ...t) {
  var n;
  for (const a of t) {
    const i = e.getElementsByTagNameNS("*", a)[0];
    if ((n = i == null ? void 0 : i.textContent) != null && n.trim()) return i.textContent.trim();
  }
  return null;
}
function zn(e, ...t) {
  const n = Ee(e, ...t);
  return n ? ht(n) : null;
}
const pn = (e) => e === null ? null : et(e);
function Xn(e, t) {
  if (e.lat === null || e.lon === null || t.lat === null || t.lon === null) return 0;
  const n = Math.PI / 180, a = (t.lat - e.lat) * n, i = (t.lon - e.lon) * n, o = Math.sin(a / 2) ** 2 + Math.cos(e.lat * n) * Math.cos(t.lat * n) * Math.sin(i / 2) ** 2;
  return 12742e3 * Math.asin(Math.min(1, Math.sqrt(o)));
}
function Zn(e, t = "Activity.gpx", n, a = null) {
  var R;
  if (/<!DOCTYPE|<!ENTITY/i.test(e)) throw Error("XML DTD or entity declarations are not supported.");
  const i = new DOMParser().parseFromString(e, "application/xml");
  if (!i.documentElement || st(i.documentElement, "parsererror").length) throw Error("Invalid activity XML.");
  const o = /\.tcx$/i.test(t), d = st(i.documentElement, o ? "Trackpoint" : "trkpt");
  if (d.length < 2 || d.length > 16e4) throw Error("Activity needs timestamped ride samples.");
  if (o) {
    const x = st(i.documentElement, "Activity");
    if (x.length !== 1 || !Wt(x[0].getAttribute("Sport"))) throw Error("Not a single cycling TCX activity.");
  }
  const s = [];
  for (const x of d) {
    const P = zn(x, o ? "Time" : "time");
    if (P === null) continue;
    const Y = o ? st(x, "Position")[0] : null;
    s.push({
      t: P,
      hr: ue(Ee(x, "HeartRateBpm", "Value", "hr"), 240),
      power: te(Ee(x, "Watts", "watts", "PowerInWatts", "power"), 2500) ?? NaN,
      cad: ue(Ee(x, "Cadence", "cad", "RunCadence"), 250),
      ele: et(Ee(x, "AltitudeMeters", "ele")),
      distance: te(Ee(x, "DistanceMeters", "distance"), 1e7),
      lat: pn(o ? Y ? Ee(Y, "LatitudeDegrees") : null : x.getAttribute("lat")),
      lon: pn(o ? Y ? Ee(Y, "LongitudeDegrees") : null : x.getAttribute("lon"))
    });
  }
  if (s.length < 2) throw Error("No timestamped GPS/trackpoint data.");
  s.sort((x, P) => x.t - P.t);
  let m = 0, y = 0;
  for (let x = 1; x < s.length; x++) {
    const P = s[x - 1], Y = s[x], D = Y.distance !== null && P.distance !== null && Y.distance >= P.distance ? Y.distance - P.distance : Xn(P, Y);
    D >= 0 && D < 5e3 && (m += D), P.ele !== null && Y.ele !== null && Y.ele > P.ele && Y.ele - P.ele < 200 && (y += Y.ele - P.ele);
  }
  const v = (s[s.length - 1].t - s[0].t) / 1e3;
  let S = 0, I = 0, f = 0, l = 0, T = 0, E = 0;
  for (const x of s)
    We(x.power) && (S += x.power, I++), x.hr !== null && (f += x.hr, l++), x.cad !== null && (T += x.cad, E++);
  const N = Ee(i.documentElement, "name");
  return Yt(o ? "TCX" : "GPX", {
    name: n || N || t,
    start: s[0].t,
    duration: v,
    stravaId: a,
    distanceMeters: m || ((R = s.at(-1)) == null ? void 0 : R.distance) || null,
    elevationMeters: y || null,
    movingSeconds: null,
    avgPower: I ? S / I : null,
    avgHeartRate: l ? f / l : null,
    avgCadence: E ? T / E : null,
    best20minWatts: An(s.filter((x) => We(x.power)).map((x) => ({ t: x.t, power: x.power })))
  });
}
function $n(e, t = 1e5) {
  var d;
  if (e.length > 32 * 1024 * 1024) throw Error("CSV index is too large.");
  const n = [];
  let a = [], i = "", o = !1;
  for (let s = 0; s < e.length; s++) {
    const m = e[s];
    if (m === '"')
      o && e[s + 1] === '"' ? (i += '"', s++) : o = !o;
    else if (m === "," && !o)
      a.push(i), i = "";
    else if ((m === `
` || m === "\r") && !o) {
      if (m === "\r" && e[s + 1] === `
` && s++, a.push(i), i = "", a.some((y) => y.trim()) && n.push(a), a = [], n.length > t) throw Error("Too many activities in CSV.");
    } else i += m;
  }
  if (o) throw Error("Unclosed quoted field in CSV.");
  return a.push(i), a.some((s) => s.trim()) && n.push(a), (d = n[0]) != null && d[0] && (n[0][0] = n[0][0].replace(/^\uFEFF/, "")), n;
}
function Jn(e) {
  const t = $n(e), n = (t.shift() || []).map((o) => o.toLowerCase().replace(/\s/g, "").replace(/[^a-z0-9]/g, "")), a = (o, ...d) => {
    for (const s of d) {
      const m = n.indexOf(s);
      if (m >= 0) return o[m] || "";
    }
    return "";
  }, i = [];
  for (const o of t) {
    if (!Wt(a(o, "activitytype", "type", "sporttype"))) continue;
    const d = ht(a(o, "activitydate", "startdate", "startdatetime"));
    if (d === null) continue;
    const s = ue(a(o, "elapsedtime", "movingtime"), 7 * 86400);
    if (s !== null)
      try {
        const m = a(o, "activityid") || null, y = a(o, "filename") || null, v = Yt("CSV", {
          name: a(o, "activityname", "name") || "Ride",
          start: d,
          duration: s,
          stravaId: m,
          indoor: /virtual/.test(a(o, "activitytype", "type").toLowerCase()),
          movingSeconds: ue(a(o, "movingtime"), 7 * 86400),
          distanceMeters: te(a(o, "distance"), 1e7),
          elevationMeters: te(a(o, "elevationgain"), 1e5),
          avgPower: te(a(o, "averagewatts", "avgpower"), 2500),
          avgHeartRate: te(a(o, "averageheartrate"), 240),
          avgCadence: te(a(o, "averagecadence"), 250)
        });
        i.push({ ride: v, file: y });
      } catch {
      }
  }
  return i;
}
function Qn(e, t) {
  if (e.stravaId && t.stravaId && e.stravaId === t.stravaId) return !0;
  const n = Math.min(300, Math.max(90, Math.min(e.duration, t.duration) * 0.07));
  return Math.abs(e.start - t.start) > 12e4 || Math.abs(e.duration - t.duration) > n ? !1 : e.distanceMeters !== null && t.distanceMeters !== null ? Math.abs(e.distanceMeters - t.distanceMeters) <= Math.max(500, Math.min(e.distanceMeters, t.distanceMeters) * 0.08) : !0;
}
const gn = (e) => ({ FIT: 4, TCX: 3, GPX: 2, CSV: 1 })[e];
function ea(e, t) {
  const n = (d) => [d.avgPower, d.best20minWatts, d.avgHeartRate, d.avgCadence, d.distanceMeters, d.elevationMeters].filter((s) => s !== null).length, a = n(t) > n(e) || n(t) === n(e) && gn(t.source) > gn(e.source), i = a ? t : e, o = a ? e : t;
  return {
    ...i,
    key: e.key,
    stravaId: e.stravaId ?? t.stravaId,
    name: e.source === "CSV" && e.name !== "Ride" ? e.name : i.name,
    avgPower: i.avgPower ?? o.avgPower,
    avgHeartRate: i.avgHeartRate ?? o.avgHeartRate,
    avgCadence: i.avgCadence ?? o.avgCadence,
    best20minWatts: i.best20minWatts ?? o.best20minWatts,
    distanceMeters: i.distanceMeters ?? o.distanceMeters,
    elevationMeters: i.elevationMeters ?? o.elevationMeters,
    movingSeconds: i.movingSeconds ?? o.movingSeconds
  };
}
function Dn(e, t) {
  const n = [...e];
  let a = 0, i = 0, o = 0;
  for (const d of t) {
    const s = n.findIndex((m) => Qn(m, d));
    if (s >= 0) {
      o++;
      const m = ea(n[s], d);
      JSON.stringify(m) !== JSON.stringify(n[s]) && (n[s] = m, i++);
    } else
      n.push(d), a++;
  }
  return n.sort((d, s) => s.start - d.start), { rides: n, added: a, updated: i, duplicates: o };
}
function ta(e, t = Date.now()) {
  var d;
  const n = Array.from({ length: 8 }, (s, m) => {
    const y = new Date(t);
    return y.setHours(0, 0, 0, 0), y.setDate(y.getDate() - y.getDay() - (7 - m) * 7), { start: y.getTime(), hours: 0, rides: 0 };
  });
  for (const s of e) for (const m of n) if (s.start >= m.start && s.start < m.start + 6048e5) {
    m.hours += s.duration / 3600, m.rides++;
    break;
  }
  const a = n.reduce((s, m) => s + m.hours, 0) / 8, i = e.filter((s) => s.start <= t && s.start > t - 56 * 864e5), o = e.filter((s) => s.start > t - 120 * 864e5 && s.start <= t).reduce((s, m) => m.best20minWatts !== null && (s === null || m.best20minWatts > s) ? m.best20minWatts : s, null);
  return {
    total: e.length,
    recent: i.length,
    weeklyHours: Math.round(a * 10) / 10,
    weeks: n,
    suggestedFtp: o !== null && o > 100 ? Math.round(o * 0.95) : null,
    powerRides: e.filter((s) => s.avgPower !== null).length,
    latest: ((d = e[0]) == null ? void 0 : d.start) ?? null,
    allHours: Math.round(e.reduce((s, m) => s + m.duration / 3600, 0))
  };
}
const na = "breakaway.account.owner.v1";
let aa = "";
function oa(e) {
  let t = aa;
  try {
    t || (t = localStorage.getItem(na) || "");
  } catch {
  }
  return t ? e + "-" + t : e;
}
const sa = "breakaway-coach-training-history-v1", Ie = "rides", ia = 1, Nn = 600 * 1024 * 1024, Fe = 32 * 1024 * 1024, mn = 32 * 1024 * 1024, Lt = 1e4, Pt = new TextDecoder("utf-8", { fatal: !1 });
function Bt() {
  return new Promise((e, t) => {
    if (!("indexedDB" in window)) {
      t(Error("This browser does not support local history storage."));
      return;
    }
    const n = indexedDB.open(oa(sa), ia);
    n.onupgradeneeded = () => {
      n.result.objectStoreNames.contains(Ie) || n.result.createObjectStore(Ie, { keyPath: "key" });
    }, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error || Error("Could not open local history database."));
  });
}
async function xn() {
  const e = await Bt();
  try {
    return await new Promise((t, n) => {
      const a = e.transaction(Ie, "readonly"), i = a.objectStore(Ie).getAll();
      i.onsuccess = () => t(i.result.sort((o, d) => d.start - o.start)), i.onerror = () => n(i.error || Error("Could not read history."));
    });
  } finally {
    e.close();
  }
}
async function ra(e) {
  if (e.length > 15e3) throw Error("Local activity limit reached. Contact support before importing more rides.");
  const t = await Bt();
  try {
    return await new Promise((n, a) => {
      const i = t.transaction(Ie, "readwrite"), o = i.objectStore(Ie);
      o.clear();
      for (const d of e) o.put(d);
      i.oncomplete = () => n(), i.onerror = () => a(i.error || Error("Could not save imported activities.")), i.onabort = () => a(i.error || Error("Activity import was rolled back."));
    });
  } finally {
    t.close();
  }
}
async function ca() {
  const e = await Bt();
  try {
    return await new Promise((t, n) => {
      const a = e.transaction(Ie, "readwrite");
      a.objectStore(Ie).clear(), a.oncomplete = () => t(), a.onerror = () => n(a.error || Error("Unable to clear history."));
    });
  } finally {
    e.close();
  }
}
function me(e, t) {
  if (t < 0 || t + 2 > e.byteLength) throw Error("Truncated ZIP file.");
  return e.getUint16(t, !0);
}
function Se(e, t) {
  if (t < 0 || t + 4 > e.byteLength) throw Error("Truncated ZIP file.");
  return e.getUint32(t, !0);
}
function la(e) {
  if (e.byteLength > Nn) throw Error("This archive exceeds the 600 MB preview limit. Import smaller batches of FIT, TCX, or GPX files.");
  const t = new DataView(e.buffer, e.byteOffset, e.byteLength);
  let n = -1;
  for (let m = e.length - 22; m >= Math.max(0, e.length - 22 - 65535); m--)
    if (Se(t, m) === 101010256 && m + 22 + me(t, m + 20) <= e.length) {
      n = m;
      break;
    }
  if (n < 0) throw Error("Not a valid ZIP archive or its directory is missing.");
  const a = me(t, n + 10), i = Se(t, n + 12), o = Se(t, n + 16);
  if (a === 65535 || o === 4294967295 || i === 4294967295 || me(t, n + 4) !== 0) throw Error("Multi-disk or ZIP64 archives are not supported in this preview.");
  if (a > Lt || o + i > e.length) throw Error("ZIP directory exceeds safe limits.");
  const d = [];
  let s = o;
  for (let m = 0; m < a; m++) {
    if (Se(t, s) !== 33639248) throw Error("Invalid ZIP directory entry.");
    const y = me(t, s + 8), v = me(t, s + 10), S = Se(t, s + 16), I = Se(t, s + 20), f = Se(t, s + 24), l = me(t, s + 28), T = me(t, s + 30), E = me(t, s + 32), N = Se(t, s + 42), R = s + 46 + l + T + E;
    if (R > e.length) throw Error("Truncated ZIP entry.");
    const x = Pt.decode(e.subarray(s + 46, s + 46 + l));
    if (s = R, N === 4294967295) continue;
    if (Se(t, N) !== 67324752) throw Error("Invalid ZIP member offset.");
    const P = N + 30 + me(t, N + 26) + me(t, N + 28);
    if (P + I > e.length) throw Error("Truncated ZIP member data.");
    d.push({ name: x, compressed: I, expanded: f, method: v, crc: S, start: P, encrypted: !!(y & 1) });
  }
  return d;
}
const da = (() => {
  const e = new Uint32Array(256);
  for (let t = 0; t < 256; t++) {
    let n = t;
    for (let a = 0; a < 8; a++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
    e[t] = n >>> 0;
  }
  return e;
})();
function ua(e) {
  let t = 4294967295;
  for (const n of e) t = da[(t ^ n) & 255] ^ t >>> 8;
  return (t ^ 4294967295) >>> 0;
}
async function On(e, t, n) {
  if (typeof DecompressionStream > "u") throw Error("Compressed archives require a current Chrome or Edge browser.");
  let a;
  try {
    a = new Blob([new Uint8Array(e)]).stream().pipeThrough(new DecompressionStream(t));
  } catch {
    throw Error("This browser cannot expand " + t + " files. Try a recent Chrome or Edge.");
  }
  const i = a.getReader(), o = [];
  let d = 0;
  try {
    for (; ; ) {
      const { value: y, done: v } = await i.read();
      if (v) break;
      if (y) {
        if (d += y.byteLength, d > n)
          throw await i.cancel(), Error("Decompressed activity exceeds the safe file size limit.");
        o.push(y);
      }
    }
  } finally {
    i.releaseLock();
  }
  const s = new Uint8Array(d);
  let m = 0;
  for (const y of o)
    s.set(y, m), m += y.length;
  return s;
}
async function yn(e, t) {
  if (t.encrypted) throw Error("Encrypted archive entries are unsupported.");
  if (t.expanded > Fe) throw Error("Activity is larger than the 32 MB per-file limit.");
  if (t.method !== 0 && t.method !== 8) throw Error("Unsupported ZIP compression method: " + t.method);
  const n = e.subarray(t.start, t.start + t.compressed), a = t.method === 0 ? new Uint8Array(n) : await On(n, "deflate-raw", Fe);
  if (a.length !== t.expanded || ua(a) !== t.crc) throw Error("ZIP member failed integrity verification.");
  return a;
}
const vn = (e) => /\.(fit|tcx|gpx)(\.gz)?$/i.test(e), fn = (e) => /(^|\/)activities\.csv$/i.test(e), Ve = (e) => e.trim().replace(/\\/g, "/").replace(/^\.?\//, "").toLowerCase(), ha = () => new Promise((e) => setTimeout(e, 0));
async function pa(e, t) {
  return /\.gz$/i.test(e) ? On(t, "gzip", Fe) : t;
}
async function ga(e, t = () => {
}) {
  if (!e.length) throw Error("Choose an activity archive or individual ride files.");
  if (e.length > Lt) throw Error("Select fewer than 10,000 files at a time.");
  const n = [], a = [];
  let i = 0;
  for (const l of e)
    if (/\.zip$/i.test(l.name)) {
      if (i++, l.size > Nn) throw Error("This ZIP archive exceeds the 600 MB preview limit.");
      const T = new Uint8Array(await l.arrayBuffer());
      for (const E of la(T)) {
        const N = Ve(E.name);
        fn(N) && E.expanded <= mn ? a.push({ name: E.name, bytes: () => yn(T, E) }) : vn(N) && /(^|\/)activities\//i.test(N) && E.expanded <= Fe && n.push({ name: E.name, bytes: () => yn(T, E) });
      }
    } else fn(l.name) && l.size <= mn ? a.push({ name: l.name, bytes: async () => new Uint8Array(await l.arrayBuffer()) }) : vn(l.name) && l.size <= Fe && n.push({ name: l.name, bytes: async () => new Uint8Array(await l.arrayBuffer()) });
  if (!n.length && !a.length) throw Error("No supported cycling recordings or activities.csv were found.");
  if (n.length > Lt) throw Error("There are too many activity files in this archive.");
  const o = [], d = [];
  let s = 0, m = 0, y = 0;
  for (const l of a)
    try {
      o.push(...Jn(Pt.decode(await l.bytes())));
    } catch (T) {
      d.push("activities.csv: " + String(T instanceof Error ? T.message : T));
    }
  const v = /* @__PURE__ */ new Map();
  for (const l of o) l.file && (v.set(Ve(l.file), l), v.set(Ve(l.file).split("/").pop() || "", l));
  const S = [], I = n.length;
  t({ done: y, total: I, current: "Reading activity files", accepted: 0, skipped: s });
  for (const l of n) {
    try {
      const T = await pa(l.name, await l.bytes());
      if (T.byteLength > Fe) throw Error("Activity exceeds 32 MB.");
      const E = v.get(Ve(l.name)) || v.get(Ve(l.name).split("/").pop() || ""), N = l.name.replace(/^.*\//, "").replace(/\.(fit|gpx|tcx)(\.gz)?$/i, "");
      let R;
      if (/\.fit(\.gz)?$/i.test(l.name)) {
        const x = "/coach-fit-decoder.js", { decodeFIT: P } = await import(
          /* @vite-ignore */
          x
        );
        R = _n(await P(T), N, E == null ? void 0 : E.ride.name, (E == null ? void 0 : E.ride.stravaId) ?? null);
      } else R = Zn(Pt.decode(T), N.replace(/\.gz$/i, ""), E == null ? void 0 : E.ride.name, (E == null ? void 0 : E.ride.stravaId) ?? null);
      S.push(R), m++;
    } catch (T) {
      s++, d.length < 15 && d.push(l.name.slice(-80) + ": " + String(T instanceof Error ? T.message : T));
    }
    y++, (y % 5 === 0 || y === I) && (t({ done: y, total: I, current: l.name.slice(-70), accepted: m, skipped: s }), await ha());
  }
  return { rides: Dn([], S.concat(o.map((l) => l.ride))).rides, read: m, skipped: s, errors: d, csvRides: o.length, archives: i };
}
const ma = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, A = (e) => e.replace(/[&<>"']/g, (t) => ma[t]), ee = (e) => {
  try {
    return JSON.parse(localStorage.getItem(e) || "null");
  } catch {
    return null;
  }
}, de = (e, t) => {
  try {
    return localStorage.setItem(e, JSON.stringify(t)), !0;
  } catch {
    return !1;
  }
}, Ne = (e) => [e.getFullYear(), String(e.getMonth() + 1).padStart(2, "0"), String(e.getDate()).padStart(2, "0")].join("-"), lt = (e) => {
  if (typeof e != "string") return "";
  const t = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(e);
  if (!t) return "";
  const n = Number(t[1]), a = Number(t[2]), i = Number(t[3]), o = new Date(n, a - 1, i);
  return o.getFullYear() !== n || o.getMonth() + 1 !== a || o.getDate() !== i ? "" : [t[1], String(a).padStart(2, "0"), String(i).padStart(2, "0")].join("-");
};
function ya(e, t) {
  let n = [], a = null, i = !1;
  e.innerHTML = '<div class="coach-section-top"><span class="coach-tag">05 / RIDER HISTORY</span><span class="coach-tag">YOUR FILES · YOUR DEVICE</span></div><h2>BRING YOUR HISTORY.</h2><p class="coach-small">Import your Strava account export or original cycling recordings. No Strava account connection, API, or server upload.</p><div class="coach-history-import-zone" id="coachImportZone" tabindex="0" role="group" aria-label="Choose a Strava archive or ride files"><div class="coach-upload-icon">⇧</div><strong>DROP A STRAVA ZIP OR RIDE FILES HERE</strong><span>ZIP · activities.csv · FIT · TCX · GPX · FIT.GZ · TCX.GZ · GPX.GZ</span><label for="coachImportFiles" class="coach-upload-button">CHOOSE FILES</label><input id="coachImportFiles" type="file" multiple accept=".zip,.csv,.fit,.tcx,.gpx,.gz" hidden></div><div class="coach-import-stage" id="coachImportStage" aria-live="polite"></div><div id="coachHistoryStats"><p class="coach-small">Loading saved activities…</p></div><p class="coach-small coach-history-privacy">The browser reads activity files locally. Only summarized ride metrics are saved in this browser’s IndexedDB; GPS tracks and original files are not retained. Imported history is not uploaded, synced or used by a hosted AI model.</p><div class="coach-history-footer"><button type="button" id="coachHistoryClear">CLEAR IMPORTED HISTORY</button><a href="https://support.strava.com/en-us/articles/15401919-how-do-i-export-my-strava-data" rel="noopener noreferrer" target="_blank">How to export from Strava ↗</a></div>';
  const o = (l) => e.querySelector("#" + l), d = o("coachImportFiles"), s = o("coachImportStage"), m = o("coachImportZone"), y = o("coachHistoryClear");
  function v() {
    var E, N;
    const l = ta(n), T = l.weeks.map((R, x) => ({ hours: R.hours, week: new Date(R.start).toLocaleDateString(void 0, { month: "short", day: "numeric" }), height: Math.max(2, Math.round(R.hours / Math.max(1, ...l.weeks.map((P) => P.hours)) * 100)), index: x }));
    o("coachHistoryStats").innerHTML = '<div class="coach-history-stats"><div><strong>' + l.total.toLocaleString() + "</strong><span>Historical rides</span></div><div><strong>" + l.weeklyHours.toFixed(1) + " h</strong><span>Avg / week · last 8 weeks</span></div><div><strong>" + l.powerRides.toLocaleString() + '</strong><span>Rides with power</span></div></div><div class="coach-history-bars" role="img" aria-label="Training hours in the last eight calendar weeks">' + T.map((R) => '<div class="coach-history-bar-wrap"><span>' + R.hours.toFixed(1) + 'h</span><div class="coach-history-bar-track"><div style="height:' + R.height + '%"></div></div><small>' + A(R.week) + "</small></div>").join("") + '</div><div class="coach-history-insights"><div><strong>RECENT TRAINING VOLUME</strong><p>' + l.weeklyHours.toFixed(1) + " hours per week on average over the past eight calendar weeks.</p></div><div><strong>POWER HISTORY</strong><p>" + (l.suggestedFtp === null ? "Not enough recent 20-minute recorded power for an FTP estimate." : "Candidate FTP ~" + l.suggestedFtp + " W, calculated as 95% of the best recorded 20-minute power in the last 120 days. Confirm with an FTP test.") + "</p></div></div>" + (l.total ? '<div class="coach-history-suggestions">' + (l.weeklyHours >= 1 ? '<button id="coachUseHours" type="button">USE ' + Math.min(20, Math.max(1, Math.round(l.weeklyHours * 2) / 2)) + " H/WEEK</button>" : "") + (l.suggestedFtp !== null ? '<button id="coachUseFtp" type="button">REVIEW FTP ' + l.suggestedFtp + " W</button>" : "") + "</div>" : "") + (l.total ? '<div class="coach-history-latest"><strong>LATEST IMPORTS</strong>' + n.slice(0, 5).map((R) => "<div><span>" + A(new Date(R.start).toLocaleDateString()) + " · " + A(R.name) + "</span><small>" + A(R.source) + " · " + Math.round(R.duration / 60) + " min</small></div>").join("") + "</div>" : '<p class="coach-small">No imported rides yet. Upload your Strava archive to see fitness history here.</p>'), (E = o("coachUseHours")) == null || E.addEventListener("click", () => {
      l.weeklyHours < 1 || (t.applySuggestion({ hours: Math.min(20, Math.max(1, Math.round(l.weeklyHours * 2) / 2)) }), s.textContent = "Weekly training hours updated in your Coach profile. You can edit them anytime.");
    }), (N = o("coachUseFtp")) == null || N.addEventListener("click", () => {
      l.suggestedFtp !== null && confirm("Apply the historical FTP estimate of " + l.suggestedFtp + " W to Coach? This is not a substitute for an FTP test.") && (t.applySuggestion({ ftp: l.suggestedFtp }), s.textContent = "FTP updated in Coach. Verify your training zones with a recent test.");
    });
  }
  async function S() {
    try {
      n = await xn(), v();
    } catch (l) {
      o("coachHistoryStats").textContent = "Could not open local history: " + String(l instanceof Error ? l.message : l);
    }
  }
  function I(l) {
    const T = Dn(n, l.rides), E = T.added, N = T.updated;
    s.innerHTML = '<div class="coach-import-result"><strong>READY TO SAVE · ' + E + " NEW RIDES</strong><p>" + l.read + " recordings parsed · " + l.csvRides + " CSV cycling rows · " + l.skipped + " files skipped · " + N + " existing rides enhanced · " + T.duplicates + " duplicates matched.</p>" + (l.errors.length ? "<details><summary>Import warnings (" + l.errors.length + " shown)</summary><ul>" + l.errors.map((R) => "<li>" + A(R) + "</li>").join("") + "</ul></details>" : "") + '<div class="coach-import-actions"><button type="button" id="coachConfirmImport">SAVE HISTORY TO THIS DEVICE</button><button type="button" id="coachCancelImport">CANCEL</button></div></div>', a = T.rides, o("coachConfirmImport").addEventListener("click", async () => {
      if (!a || i) return;
      i = !0;
      const R = a, x = o("coachConfirmImport");
      x.disabled = !0;
      try {
        await ra(R), n = R, a = null, s.textContent = "Saved " + E + " new rides and enhanced " + N + " activities on this device.", v(), window.dispatchEvent(new Event("breakaway:history-updated"));
      } catch (P) {
        s.textContent = "Save failed (nothing was changed): " + String(P instanceof Error ? P.message : P);
      } finally {
        i = !1;
      }
    }), o("coachCancelImport").addEventListener("click", () => {
      a = null, s.textContent = "Import canceled. Your saved history was not changed.";
    });
  }
  async function f(l) {
    if (!(i || !l.length)) {
      i = !0, a = null, y.disabled = !0, m.setAttribute("aria-busy", "true"), s.textContent = "Reading activity files locally…";
      try {
        const T = await ga(l, (E) => {
          s.textContent = "Reading " + E.done + " / " + E.total + " files · " + E.accepted + " cycling recordings · " + E.skipped + " skipped";
        });
        T.rides.length ? I(T) : s.textContent = "No valid cycling rides were found. " + (T.errors[0] || "Try a Strava archive or individual activity recordings.");
      } catch (T) {
        s.textContent = "Import could not finish: " + String(T instanceof Error ? T.message : T);
      } finally {
        i = !1, y.disabled = !1, m.removeAttribute("aria-busy"), d.value = "";
      }
    }
  }
  d.addEventListener("change", () => void f(Array.from(d.files || [])));
  for (const l of ["dragenter", "dragover"]) m.addEventListener(l, (T) => {
    T.preventDefault(), m.classList.add("coach-drop-active");
  });
  return m.addEventListener("dragleave", (l) => {
    l.preventDefault(), m.classList.remove("coach-drop-active");
  }), m.addEventListener("drop", (l) => {
    var E;
    l.preventDefault(), m.classList.remove("coach-drop-active");
    const T = Array.from(((E = l.dataTransfer) == null ? void 0 : E.files) || []);
    f(T);
  }), m.addEventListener("keydown", (l) => {
    l.target === m && l.key === "Enter" && (l.preventDefault(), d.click());
  }), y.addEventListener("click", async () => {
    if (!i && confirm("Delete all historical rides imported into Breakaway Coach on this device? Your original Strava files are not affected.")) {
      i = !0, y.disabled = !0;
      try {
        await ca(), a = null, n = [], s.textContent = "Imported history deleted from this device.", v(), window.dispatchEvent(new Event("breakaway:history-updated"));
      } catch (l) {
        s.textContent = "Delete failed: " + String(l instanceof Error ? l.message : l);
      } finally {
        i = !1, y.disabled = !1;
      }
    }
  }), S(), { reload: S };
}
const bn = "breakaway.coach.strength.settings.v1", wn = "breakaway.coach.strength.history.v1", Ln = { enabled: !1, equipment: ["bodyweight"], experience: "beginner", sessions: 1, minutes: 30, notes: "" }, Pn = [
  { id: "bodyweight", label: "Bodyweight", detail: "Floor space only" },
  { id: "dumbbells", label: "Dumbbells", detail: "Fixed or adjustable" },
  { id: "kettlebells", label: "Kettlebells", detail: "Single or paired" },
  { id: "bands", label: "Resistance bands", detail: "Light to heavy" },
  { id: "barbell", label: "Squat rack + barbell", detail: "With plates" },
  { id: "bench", label: "Weight bench", detail: "Flat or adjustable" },
  { id: "pullup", label: "Pull-up bar", detail: "Safe, securely mounted" }
];
function Qe(e) {
  const t = e && typeof e == "object" ? e : {}, n = Array.isArray(t.equipment) ? t.equipment.filter((i) => Pn.some((o) => o.id === i)) : [], a = Array.from(/* @__PURE__ */ new Set(["bodyweight", ...n]));
  return {
    enabled: t.enabled === !0,
    equipment: a,
    experience: ["beginner", "intermediate", "advanced"].includes(String(t.experience)) ? t.experience : "beginner",
    sessions: t.sessions === 2 ? 2 : 1,
    minutes: [20, 30, 45].includes(Number(t.minutes)) ? Number(t.minutes) : 30,
    notes: typeof t.notes == "string" ? t.notes.slice(0, 150) : ""
  };
}
const va = [
  { id: "body-squat", name: "Tempo Bodyweight Squat", pattern: "Squat", equipment: ["bodyweight"], reps: "8–12", loadHint: "Bodyweight", instructions: "Move slowly with controlled range; stop if form deteriorates." },
  { id: "split-squat", name: "Supported Split Squat", pattern: "Squat", equipment: ["bodyweight"], reps: "8 / side", loadHint: "Bodyweight", instructions: "Hold a stable support for balance; lower only as far as controlled." },
  { id: "db-goblet", name: "Dumbbell Goblet Squat", pattern: "Squat", equipment: ["dumbbells"], reps: "6–10", loadHint: "Choose a manageable dumbbell", instructions: "Hold the dumbbell near the chest; maintain a stable trunk." },
  { id: "kb-goblet", name: "Kettlebell Goblet Squat", pattern: "Squat", equipment: ["kettlebells"], reps: "6–10", loadHint: "Choose a manageable kettlebell", instructions: "Hold the bell in front of the chest and squat under control." },
  { id: "bar-squat", name: "Barbell Back Squat", pattern: "Squat", equipment: ["barbell"], reps: "5–8", loadHint: "Begin conservatively; avoid grinding reps", instructions: "Use the rack safeties and an appropriate practiced technique." },
  { id: "hip-bridge", name: "Glute Bridge", pattern: "Hinge", equipment: ["bodyweight"], reps: "10–15", loadHint: "Bodyweight", instructions: "Drive through the feet and extend hips without arching the back." },
  { id: "single-bridge", name: "Single-Leg Glute Bridge", pattern: "Hinge", equipment: ["bodyweight"], reps: "8 / side", loadHint: "Bodyweight", instructions: "Keep pelvis level and use smooth controlled reps." },
  { id: "db-rdl", name: "Dumbbell Romanian Deadlift", pattern: "Hinge", equipment: ["dumbbells"], reps: "8–10", loadHint: "Two comfortable dumbbells", instructions: "Hinge at hips, soft knees, keep weights close and back neutral." },
  { id: "kb-deadlift", name: "Kettlebell Deadlift", pattern: "Hinge", equipment: ["kettlebells"], reps: "8–10", loadHint: "Comfortable kettlebell", instructions: "Hinge from hips with the bell near the feet and stand tall." },
  { id: "bar-rdl", name: "Barbell Romanian Deadlift", pattern: "Hinge", equipment: ["barbell"], reps: "6–8", loadHint: "Comfortable barbell load", instructions: "Control the hinge, keep the bar close and do not round the lower back." },
  { id: "pushup", name: "Incline or Floor Push-Up", pattern: "Push", equipment: ["bodyweight"], reps: "6–12", loadHint: "Bodyweight", instructions: "Use a stable elevated surface if needed; keep body aligned." },
  { id: "db-press", name: "Dumbbell Floor Press", pattern: "Push", equipment: ["dumbbells"], reps: "8–12", loadHint: "Light dumbbells to start", instructions: "Keep upper arms controlled on the floor and press smoothly." },
  { id: "kb-press", name: "Kettlebell Floor Press", pattern: "Push", equipment: ["kettlebells"], reps: "8 / side", loadHint: "Light kettlebell to start", instructions: "Press one arm at a time and keep wrist neutral." },
  { id: "bar-bench", name: "Barbell Bench Press", pattern: "Push", equipment: ["barbell", "bench"], reps: "6–10", loadHint: "Use a spotter or suitable safeties", instructions: "Practice bench setup and use a spotter or safeties." },
  { id: "prone-ytw", name: "Prone Y–T–W Raises", pattern: "Pull", equipment: ["bodyweight"], reps: "8 each", loadHint: "Bodyweight shoulder control", instructions: "Lift arms gently in Y, T, W shapes. Not a substitute for heavy pulling." },
  { id: "band-row", name: "Anchored Band Row", pattern: "Pull", equipment: ["bands"], reps: "10–15", loadHint: "Secure band anchor", instructions: "Use a secure anchor and pull shoulder blades back under control." },
  { id: "db-row", name: "Single-Arm Dumbbell Row", pattern: "Pull", equipment: ["dumbbells"], reps: "8–12 / side", loadHint: "Comfortable dumbbell", instructions: "Support yourself and pull elbow toward the hip without twisting." },
  { id: "kb-row", name: "Single-Arm Kettlebell Row", pattern: "Pull", equipment: ["kettlebells"], reps: "8–12 / side", loadHint: "Comfortable kettlebell", instructions: "Hinge with a stable torso; pull elbow near the rib cage." },
  { id: "bar-row", name: "Barbell Bent-Over Row", pattern: "Pull", equipment: ["barbell"], reps: "6–10", loadHint: "Controlled barbell load", instructions: "Hinge and brace; row without jerking or rounding the back." },
  { id: "pull-up", name: "Assisted or Strict Pull-Up", pattern: "Pull", equipment: ["pullup"], reps: "3–8", loadHint: "Bodyweight or assisted", instructions: "Use a secure bar and an assisted version if needed." },
  { id: "dead-bug", name: "Dead Bug", pattern: "Core", equipment: ["bodyweight"], reps: "8 / side", loadHint: "Bodyweight", instructions: "Brace gently and extend opposing limbs without arching the back." },
  { id: "side-plank", name: "Side Plank", pattern: "Core", equipment: ["bodyweight"], reps: "20–30 sec / side", loadHint: "Bodyweight", instructions: "Keep hips stacked and use knees-down variation when needed." },
  { id: "suitcase", name: "Suitcase Carry", pattern: "Core", equipment: ["dumbbells"], reps: "30 sec / side", loadHint: "Manageable dumbbell", instructions: "Walk slowly without leaning toward the weight." },
  { id: "kb-suitcase", name: "Kettlebell Suitcase Carry", pattern: "Core", equipment: ["kettlebells"], reps: "30 sec / side", loadHint: "Manageable kettlebell", instructions: "Stay tall, avoid leaning and take small controlled steps." },
  { id: "calf-raise", name: "Standing Calf Raise", pattern: "Calf", equipment: ["bodyweight"], reps: "10–15", loadHint: "Bodyweight", instructions: "Raise and lower heels smoothly, with stable support if needed." }
];
function dt(e, t) {
  const n = new Set(Qe(e).equipment);
  return va.filter((a) => (!t || a.pattern === t) && a.equipment.every((i) => n.has(i)));
}
const fa = (e, t, n) => {
  const a = dt(e, t);
  return n.map((i) => a.find((o) => o.id === i)).find(Boolean) || a[0];
};
function Ht(e, t = "A", n = !1) {
  const a = Qe(e), i = a.experience === "beginner", o = n ? 1 : i ? 2 : 3, d = ["Squat", "Hinge", "Push", "Pull", "Core"], s = {
    Squat: t === "A" ? ["bar-squat", "db-goblet", "kb-goblet", "body-squat"] : ["split-squat", "db-goblet", "kb-goblet", "body-squat", "bar-squat"],
    Hinge: t === "A" ? ["bar-rdl", "db-rdl", "kb-deadlift", "hip-bridge"] : ["single-bridge", "db-rdl", "kb-deadlift", "hip-bridge"],
    Push: t === "A" ? ["bar-bench", "db-press", "kb-press", "pushup"] : ["pushup", "db-press", "kb-press", "bar-bench"],
    Pull: t === "A" ? ["db-row", "kb-row", "bar-row", "band-row", "pull-up", "prone-ytw"] : ["band-row", "pull-up", "db-row", "kb-row", "bar-row", "prone-ytw"],
    Core: t === "A" ? ["dead-bug", "suitcase", "kb-suitcase", "side-plank"] : ["side-plank", "suitcase", "kb-suitcase", "dead-bug"]
  };
  return {
    id: "strength-" + t.toLowerCase(),
    title: n ? "Recovery Strength & Mobility" : "Full Body Strength " + t,
    minutes: n ? 20 : a.minutes,
    light: n,
    note: n ? "Recent fatigue suggests a very easy session or rest. Skip if sore or unwell." : "Leave about 2–3 repetitions in reserve and prioritize control over heavy loads.",
    exercises: d.map((m) => {
      const y = fa(a, m, s[m]);
      return {
        ...y,
        sets: m === "Core" ? Math.max(1, o - 1) : o,
        restSeconds: n ? 45 : i ? 60 : 90,
        alternatives: dt(a, m).filter((v) => v.id !== y.id).map((v) => v.id)
      };
    })
  };
}
function ba(e, t, n, a) {
  const i = Qe(t), o = Math.round(Math.max(60, e.hours * 60)), d = n.map((f) => ({
    day: f.day,
    cyclingId: f.workoutId,
    cyclingMinutes: f.workoutId ? a(f.workoutId) : 0,
    strength: null,
    strengthMinutes: 0,
    reason: f.reason
  }));
  if (!i.enabled) {
    let f = d.reduce((E, N) => E + N.cyclingMinutes, 0);
    if (f <= o) return { days: d, budgetMinutes: o, plannedMinutes: f, note: "Strength training is turned off." };
    const l = (E) => E.cyclingId === "recovery" ? 0 : E.cyclingId === "endurance" ? 1 : E.cyclingId === "tempo" ? 2 : 3, T = [...d].filter((E) => E.cyclingId).sort((E, N) => l(E) - l(N));
    for (const E of T) {
      if (f <= o) break;
      const N = Math.min(Math.max(0, E.cyclingMinutes - 15), f - o);
      E.cyclingMinutes -= N, f -= N;
    }
    for (const E of T) {
      if (f <= o) break;
      f -= E.cyclingMinutes, E.cyclingMinutes = 0, E.cyclingId = null, E.reason = "Removed because the selected weekly hours cannot fit all rides.";
    }
    return {
      days: d,
      budgetMinutes: o,
      plannedMinutes: f,
      note: "Strength is off. Cycling was adjusted to fit your available weekly hours."
    };
  }
  const s = d.filter((f) => f.cyclingId && f.day !== e.restDay).sort((f, l) => (f.cyclingId === "endurance" || f.cyclingId === "recovery" ? -1 : 1) - (l.cyclingId === "endurance" || l.cyclingId === "recovery" ? -1 : 1)), m = [];
  for (const f of s) {
    if (m.length >= i.sessions) break;
    m.some((l) => Math.abs(l.day - f.day) === 1) || m.push(f);
  }
  let y = 0;
  for (const f of m)
    f.strength = y ? "B" : "A", f.strengthMinutes = i.minutes, y++;
  let v = d.reduce((f, l) => f + l.cyclingMinutes + l.strengthMinutes, 0);
  if (v > o) {
    const f = [...d].filter((l) => l.cyclingId).sort((l, T) => {
      const E = (N) => N.cyclingId === "recovery" ? 0 : N.cyclingId === "endurance" ? 1 : N.cyclingId === "tempo" ? 2 : 3;
      return E(l) - E(T);
    });
    for (const l of f) {
      if (v <= o) break;
      const T = l.strength ? 0 : 15, E = Math.min(l.cyclingMinutes - T, v - o);
      E > 0 && (l.cyclingMinutes -= E, v -= E, l.cyclingMinutes === 0 && (l.cyclingId = null));
    }
    for (const l of [...m].reverse()) {
      if (v <= o) break;
      const T = Math.max(0, l.strengthMinutes - 15), E = Math.min(T, v - o);
      l.strengthMinutes -= E, v -= E, v > o && (v -= l.strengthMinutes, l.strengthMinutes = 0, l.strength = null);
    }
    for (const l of f) {
      if (v <= o) break;
      const T = Math.min(l.cyclingMinutes, v - o);
      l.cyclingMinutes -= T, v -= T, l.cyclingMinutes === 0 && (l.cyclingId = null);
    }
  }
  const S = d.reduce((f, l) => f + l.cyclingMinutes + l.strengthMinutes, 0), I = d.filter((f) => f.strength).length;
  return { days: d, budgetMinutes: o, plannedMinutes: S, note: I ? i.sessions > I ? "Limited time or available training days reduced strength frequency." : "Strength sessions are included in your total weekly time budget." : "Not enough available time or separate training days for strength. Consider increasing your weekly training time or lowering other sessions." };
}
function wa(e, t) {
  let n = Qe(ee(bn) || Ln);
  const a = ee(wn);
  let i = Array.isArray(a) ? a.filter((b) => b && typeof b.routine == "string" && Array.isArray(b.sets)).slice(-150) : [], o = !1, d = "A", s = !1, m = 0, y = "", v = 30, S = [], I = Ht(n, "A", !1);
  const f = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Map();
  let T = null, E = 0, N = null;
  const R = document.createElement("section");
  R.className = "coach-strength-overlay", R.id = "coachStrengthOverlay", R.hidden = !0, R.setAttribute("role", "dialog"), R.setAttribute("aria-modal", "true"), R.setAttribute("aria-label", "Guided strength session"), document.body.append(R);
  function x() {
    e.innerHTML = '<div class="coach-section-top"><span class="coach-tag">STRENGTH TRAINING</span><span class="coach-tag">OPTIONAL · LOCAL ONLY</span></div><h3>Train with what you own.</h3><p class="coach-small">Set your available equipment. Strength sessions share your weekly training time budget.</p><label class="coach-strength-toggle"><input id="strengthEnabled" type="checkbox" ' + (n.enabled ? "checked" : "") + '><span>Include strength in my training plan</span></label><span class="coach-label">AVAILABLE EQUIPMENT</span><div class="coach-equipment-grid">' + Pn.map((b) => '<label class="coach-gear-choice"><input type="checkbox" data-gear="' + b.id + '" ' + (n.equipment.includes(b.id) ? "checked" : "") + " " + (b.id === "bodyweight" ? "disabled" : "") + "><span><strong>" + A(b.label) + "</strong><small>" + A(b.detail) + "</small></span></label>").join("") + '</div><div class="coach-strength-fields"><label>EXPERIENCE<select id="strengthExperience"><option value="beginner">New to lifting</option><option value="intermediate">Some experience</option><option value="advanced">Experienced</option></select></label><label>SESSIONS / WEEK<select id="strengthSessions"><option value="1">1 session</option><option value="2">2 sessions</option></select></label><label>TIME / SESSION<select id="strengthMinutes"><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option></select></label><label>AVAILABLE WEIGHTS (OPTIONAL)<input type="text" id="strengthWeights" maxlength="150" placeholder="e.g. 25 lb DB, 35 lb KB"></label></div><p id="strengthSaved" class="coach-small" role="status">Your strength setup is saved with your cycling settings using Save My Plan.</p>', e.querySelector("#strengthExperience").value = n.experience, e.querySelector("#strengthSessions").value = String(n.sessions), e.querySelector("#strengthMinutes").value = String(n.minutes), e.querySelector("#strengthWeights").value = n.notes;
  }
  function P() {
    const b = Array.from(e.querySelectorAll("[data-gear]")).filter((M) => M.checked).map((M) => M.dataset.gear), C = Qe({
      enabled: e.querySelector("#strengthEnabled").checked,
      equipment: b,
      experience: e.querySelector("#strengthExperience").value,
      sessions: Number(e.querySelector("#strengthSessions").value),
      minutes: Number(e.querySelector("#strengthMinutes").value),
      notes: e.querySelector("#strengthWeights").value
    });
    return de(bn, C) ? (n = C, x(), e.querySelector("#strengthSaved").textContent = "Equipment settings saved.", !0) : (e.querySelector("#strengthSaved").textContent = "Local storage unavailable. Nothing saved.", !1);
  }
  function Y() {
    T !== null && window.clearInterval(T), T = null, E = 0;
  }
  function D(b) {
    T !== null && window.clearInterval(T), E = Date.now() + b * 1e3;
    const C = () => {
      const M = Math.max(0, Math.ceil((E - Date.now()) / 1e3)), O = R.querySelector("#strengthRestLabel");
      O && (O.textContent = M ? "Rest: " + M + " seconds" : "Rest complete. Ready for the next set."), M || (T !== null && window.clearInterval(T), T = null);
    };
    T = window.setInterval(C, 500), C();
  }
  const k = (b, C) => b + ":" + C;
  function ce() {
    if (!o) return;
    const b = R.scrollTop, C = S.reduce((M, O) => M + O.sets, 0);
    if (R.innerHTML = '<div class="coach-strength-session"><header class="coach-strength-session-head"><div><span>BREAKAWAY COACH / STRENGTH</span><h2>' + A(I.title) + "</h2><p>" + v + " min planned · " + f.size + " / " + C + ' sets logged</p></div><button type="button" id="strengthExit">← BACK TO COACH</button></header><div class="coach-strength-session-note">' + A(I.note) + ' Warm up for 5 minutes. Stop or modify anything painful; use a load you can control.</div><div class="coach-strength-progress"><div style="width:' + Math.round(100 * f.size / Math.max(C, 1)) + '%"></div></div><div class="coach-strength-rest"><span id="strengthRestLabel">Rest as needed between sets.</span><button type="button" id="strengthRestStart">START 60s REST</button></div><div class="coach-strength-list">' + S.map((M, O) => {
      const c = dt(n, M.pattern);
      return '<section class="coach-strength-exercise"><div class="coach-strength-exercise-header"><div><small>' + (O + 1) + " / " + S.length + " · " + A(M.pattern.toUpperCase()) + "</small><h3>" + A(M.name) + '</h3></div><label>SWAP EXERCISE<select data-strength-sub="' + O + '">' + c.map((F) => '<option value="' + F.id + '" ' + (F.id === M.id ? "selected" : "") + ">" + A(F.name) + "</option>").join("") + "</select></label></div><p>" + A(M.instructions) + '</p><p class="coach-strength-dose">' + M.sets + " sets · " + A(M.reps) + " · Rest " + M.restSeconds + "s · " + A(M.loadHint) + '</p><div class="coach-strength-sets">' + Array.from({ length: M.sets }, (F, q) => {
        const Z = k(O, q);
        return '<div class="coach-strength-set"><span>SET ' + (q + 1) + '</span><input aria-label="Repetitions: set ' + (q + 1) + " " + A(M.name) + '" data-reps="' + Z + '" maxlength="30" placeholder="' + A(M.reps) + '"><input aria-label="Weight: set ' + (q + 1) + " " + A(M.name) + '" data-load="' + Z + '" maxlength="32" placeholder="Load (lb / kg / BW)"><button type="button" aria-pressed="' + f.has(Z) + '" data-check="' + Z + '">' + (f.has(Z) ? "✓ DONE" : "MARK DONE") + "</button></div>";
      }).join("") + "</div></section>";
    }).join("") + '</div><div class="coach-strength-complete"><label>SESSION EFFORT<select id="strengthRpe"><option value="">Select effort</option><option value="3">Easy</option><option value="5">Moderate</option><option value="7">Hard</option><option value="9">Very hard</option></select></label><button type="button" id="strengthFinish">FINISH & SAVE SESSION →</button><p id="strengthSessionError" role="status"></p></div></div>', R.querySelectorAll("[data-reps],[data-load]").forEach((M) => {
      const O = M.hasAttribute("data-reps") ? "reps" : "load";
      M.value = l.get(O + ":" + M.getAttribute("data-" + O)) || "";
    }), R.querySelector("#strengthRpe").value = y, R.scrollTop = b, T !== null && E > Date.now()) {
      const M = R.querySelector("#strengthRestLabel");
      M && (M.textContent = "Rest: " + Math.ceil((E - Date.now()) / 1e3) + " seconds");
    }
  }
  R.addEventListener("input", (b) => {
    const C = b.target;
    if (C instanceof HTMLInputElement)
      for (const M of ["reps", "load"]) C.hasAttribute("data-" + M) && l.set(M + ":" + C.getAttribute("data-" + M), C.value);
  }), R.addEventListener("change", (b) => {
    const C = b.target;
    if (!(C instanceof HTMLSelectElement)) return;
    if (C.id === "strengthRpe") {
      y = C.value;
      return;
    }
    if (!C.hasAttribute("data-strength-sub")) return;
    const M = Number(C.dataset.strengthSub), O = S[M];
    if (!O) return;
    const c = dt(n, O.pattern).find((F) => F.id === C.value);
    if (c) {
      S[M] = { ...c, sets: O.sets, restSeconds: O.restSeconds, alternatives: O.alternatives };
      for (let F = 0; F < O.sets; F++) {
        const q = k(M, F);
        f.delete(q), l.delete("reps:" + q), l.delete("load:" + q);
      }
      ce();
    }
  }), R.addEventListener("click", (b) => {
    var O;
    const C = b.target;
    if (!(C instanceof Element)) return;
    if (C.closest("#strengthExit")) {
      if (f.size && !confirm("Leave without saving your sets?")) return;
      V();
      return;
    }
    const M = C.closest("[data-check]");
    if (M) {
      const c = M.dataset.check;
      if (f.has(c) ? f.delete(c) : f.add(c), f.has(c)) {
        const F = Number(c.split(":")[0]);
        D(((O = S[F]) == null ? void 0 : O.restSeconds) || 60);
      }
      ce();
      return;
    }
    if (C.closest("#strengthRestStart")) {
      D(60);
      return;
    }
    C.closest("#strengthFinish") && he();
  });
  function he() {
    if (!f.size) {
      R.querySelector("#strengthSessionError").textContent = "Complete at least one set to save this session.";
      return;
    }
    const b = [];
    S.forEach((O, c) => {
      for (let F = 0; F < O.sets; F++) {
        const q = k(c, F);
        b.push({ exerciseId: O.id, set: F + 1, reps: l.get("reps:" + q) || "", load: l.get("load:" + q) || "", done: f.has(q) });
      }
    });
    const C = {
      id: (/* @__PURE__ */ new Date()).toISOString() + ":" + I.id,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      routine: I.title,
      minutes: Math.max(1, Math.round((Date.now() - m) / 6e4)),
      completedSets: f.size,
      plannedSets: b.length,
      rpe: y ? Number(y) : null,
      sets: b
    }, M = i.concat(C).slice(-150);
    if (!de(wn, M)) {
      R.querySelector("#strengthSessionError").textContent = "Could not save. Check local browser storage.";
      return;
    }
    i = M, V(), t.finished();
  }
  function V() {
    Y(), o = !1, R.hidden = !0, N == null || N.focus(), N = null;
  }
  function ye(b = "A", C = !1, M) {
    var O;
    return n.enabled ? (d = b, v = Math.min(n.minutes, Math.max(15, M || n.minutes)), s = C || v < 20, I = Ht(n, d, s), S = I.exercises, v < n.minutes && (S = S.map((c) => ({ ...c, sets: Math.max(1, Math.min(c.sets, v < 25 ? 1 : 2)) }))), N = document.activeElement instanceof HTMLElement ? document.activeElement : null, o = !0, f.clear(), l.clear(), y = "", m = Date.now(), Y(), R.hidden = !1, ce(), R.scrollTop = 0, (O = R.querySelector("#strengthExit")) == null || O.focus(), !0) : !1;
  }
  return R.addEventListener("keydown", (b) => {
    if (!o) return;
    if (b.key === "Escape") {
      b.preventDefault();
      const c = R.querySelector("#strengthExit");
      c == null || c.click();
      return;
    }
    if (b.key !== "Tab") return;
    const C = Array.from(R.querySelectorAll("button:not(:disabled),input:not(:disabled),select:not(:disabled)"));
    if (!C.length) return;
    const M = C[0], O = C[C.length - 1];
    b.shiftKey && document.activeElement === M ? (b.preventDefault(), O.focus()) : !b.shiftKey && document.activeElement === O && (b.preventDefault(), M.focus());
  }), x(), {
    get settings() {
      return n;
    },
    get history() {
      return i;
    },
    open: ye,
    close: V,
    renderSettings: x,
    saveSettings: P,
    get active() {
      return o;
    },
    completedToday() {
      return i.some((b) => Ne(new Date(b.date)) === Ne(/* @__PURE__ */ new Date()));
    }
  };
}
function Sa(e, t, n, a) {
  const i = [];
  for (let o = 0; o < 7; o++) {
    const d = new Date(e.getFullYear(), e.getMonth(), e.getDate() + o), s = t.find((T) => T.day === d.getDay()), m = o === 0 && a.status === "completed";
    let y = s != null && s.cyclingId && s.cyclingMinutes > 0 ? s.cyclingId : null;
    o === 0 && (m || a.status === "rest" || !y ? y = null : a.workoutId && (y = a.workoutId));
    const v = n.find((T) => T.id === y), S = (s == null ? void 0 : s.cyclingId) === y ? s.cyclingMinutes : 0, I = v ? Math.max(0, S || Math.round(v.segments.reduce((T, E) => T + E.minutes, 0))) : 0, f = o === 0 ? "Today" : new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d), l = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
    i.push({
      date: d,
      key: l,
      isToday: o === 0,
      label: f + " " + (d.getMonth() + 1) + "/" + d.getDate(),
      title: new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(d),
      rideId: (v == null ? void 0 : v.id) || null,
      rideName: (v == null ? void 0 : v.name) || null,
      rideMinutes: I,
      rideDescription: (v == null ? void 0 : v.description) || null,
      strength: (s == null ? void 0 : s.strength) || null,
      strengthMinutes: (s == null ? void 0 : s.strengthMinutes) || 0,
      completedRide: m,
      reason: o === 0 ? a.reason : (s == null ? void 0 : s.reason) || "Scheduled recovery day"
    });
  }
  return i;
}
const Sn = "breakaway.coach.moved-workouts.v1", Ea = (e, t) => Object.prototype.hasOwnProperty.call(e, t);
function ka(e) {
  const t = {};
  if (!e || typeof e != "object" || Array.isArray(e)) return t;
  for (const [n, a] of Object.entries(e).slice(-365)) {
    if (lt(n) !== n || !a || typeof a != "object") continue;
    const i = a;
    i.cyclingId !== null && (typeof i.cyclingId != "string" || !/^[a-z0-9_-]{1,80}$/i.test(i.cyclingId)) || typeof i.cyclingMinutes != "number" || !Number.isInteger(i.cyclingMinutes) || i.cyclingMinutes < 0 || i.cyclingMinutes > 1440 || i.cyclingId === null == (i.cyclingMinutes === 0) && (t[n] = { cyclingId: i.cyclingId, cyclingMinutes: i.cyclingMinutes });
  }
  return t;
}
function En(e, t, n) {
  return Ea(n, e) ? { ...t, ...n[e], reason: "Manually rescheduled by you. " + t.reason } : t;
}
function Ta(e, t, n, a, i) {
  return t === n || lt(t) !== t || lt(n) !== n || !a.cyclingId || a.cyclingMinutes <= 0 ? e : {
    ...e,
    [t]: { cyclingId: i.cyclingId, cyclingMinutes: i.cyclingMinutes },
    [n]: { cyclingId: a.cyclingId, cyclingMinutes: a.cyclingMinutes }
  };
}
const Ma = /* @__PURE__ */ new Set(["tempo", "sweetspot", "vo2"]), Je = (e) => !!e.rideId && (Ma.has(e.rideId) || e.rideMinutes >= 120 && e.rideId !== "recovery"), kn = (e) => {
  const [t, n, a] = e.split("-").map(Number);
  return Date.UTC(t, n - 1, a) / 864e5;
};
function Mt(e) {
  const t = [...e].sort((a, i) => a.key.localeCompare(i.key)), n = /* @__PURE__ */ new Set();
  for (let a = 1; a < t.length; a++) {
    const i = t[a - 1], o = t[a];
    kn(o.key) - kn(i.key) === 1 && Je(i) && Je(o) && n.add(i.key + "|" + o.key);
  }
  return n;
}
const Tn = (e, t, n) => {
  const a = e.find((o) => o.key === t), i = e.find((o) => o.key === n);
  return e.map((o) => o.key === t ? { ...o, rideId: i.rideId, rideMinutes: i.rideMinutes } : o.key === n ? { ...o, rideId: a.rideId, rideMinutes: a.rideMinutes } : o);
};
function Ia(e, t, n) {
  const a = e.find((S) => S.key === t), i = e.find((S) => S.key === n);
  if (!a || !i || !a.rideId || t === n) return { warning: null, suggestedKey: null };
  const o = Mt(e), d = Tn(e, t, n), s = [...Mt(d)].filter((S) => !o.has(S)), m = d.filter((S) => [t, n].includes(S.key) && Je(S) && S.strengthMinutes >= 30 && !e.some((I) => I.key === S.key && Je(I) && I.strengthMinutes >= 30));
  if (!s.length && !m.length) return { warning: null, suggestedKey: null };
  const y = [
    s.length ? "This change creates demanding rides on consecutive days (" + s.map((S) => S.split("|").join(" and ")).join("; ") + ")." : "",
    m.length ? "It also places a demanding ride on a strength-training day." : ""
  ].filter(Boolean).join(" "), v = e.filter((S) => S.key !== t && S.key !== n && !S.rideId && !S.completedRide && !S.eventDay && S.key >= t).find((S) => {
    const I = Tn(e, t, S.key);
    return [...Mt(I)].every((f) => o.has(f)) && !I.some((f) => f.key === S.key && Je(f) && f.strengthMinutes >= 30);
  });
  return {
    warning: y + " Consider an easier day between demanding efforts when possible. You can keep your selected move if needed.",
    suggestedKey: (v == null ? void 0 : v.key) || null
  };
}
const Hn = 864e5;
function _e(e) {
  return [e.getFullYear(), String(e.getMonth() + 1).padStart(2, "0"), String(e.getDate()).padStart(2, "0")].join("-");
}
const Ca = (e, t) => Number.isFinite(e.start) && e.start <= t && e.start >= t - 14 * Hn && Number.isFinite(e.elapsed) && e.elapsed >= 900;
function It(e) {
  return Math.max(0, Math.round(e.elapsed / 60));
}
function Ra(e) {
  var ce, he, V, ye;
  const { now: t, week: n, today: a, ftp: i, ftpKnown: o } = e, d = _e(t), s = t.getTime(), m = new Set(e.skipped), y = e.rides.filter((b) => Ca(b, s)), v = new Date(t.getFullYear(), t.getMonth(), t.getDate() - t.getDay()), S = [];
  for (let b = 0; b < 14; b++) {
    const C = new Date(v.getFullYear(), v.getMonth(), v.getDate() + b), M = _e(C), O = C.getDay(), c = ((ce = e.planForDate) == null ? void 0 : ce.call(e, C)) ?? n.find((se) => se.day === O), F = (he = e.event) != null && he.startDate && /^\d{4}-\d{2}-\d{2}$/.test(e.event.startDate) ? /* @__PURE__ */ new Date(e.event.startDate + "T12:00:00") : null, q = F ? Math.round((new Date(C.getFullYear(), C.getMonth(), C.getDate(), 12).getTime() - F.getTime()) / Hn) : -1, Z = q >= 0 && q < Math.max(1, ((V = e.event) == null ? void 0 : V.stages) || 1) ? q + 1 : 0, j = c != null && c.cyclingId && c.cyclingMinutes > 0 ? c.cyclingId : null, ve = j ? c.cyclingMinutes : 0, Ye = C.getTime(), fe = y.filter((se) => _e(new Date(se.start)) === M), Oe = fe.reduce((se, Re) => se + It(Re), 0), Ce = Ye < new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(), Le = M === d;
    let oe = j, le = ve, re = j ? "planned" : "rest", pe = (c == null ? void 0 : c.reason) || "Recovery day";
    if ((Ce || Le) && fe.length)
      oe = null, le = 0, re = "completed", pe = "A ride was recorded on this date. Coach does not prescribe a duplicate session.";
    else if (Z)
      oe = null, le = 0, re = "event", pe = "Event stage " + Z + " of " + Math.max(1, ((ye = e.event) == null ? void 0 : ye.stages) || 1) + ". No additional indoor workout is prescribed. Follow your event pacing and fueling plan.";
    else if ((Ce || Le) && m.has(M))
      oe = null, le = 0, re = "skipped", pe = "You skipped this session. Coach will not stack it onto a later day.";
    else if (Ce)
      oe = null, le = 0, re = j ? "missed" : "rest", pe = j ? "This scheduled ride was not recorded and has not been rescheduled." : "Scheduled rest day.";
    else if (Le)
      oe = a.workoutId, re = a.status === "completed" ? "completed" : oe ? a.status === "recovery" ? "recovery" : "planned" : "rest", le = oe ? oe === "recovery" && j !== "recovery" ? Math.min(ve || e.recoveryMinutes, e.recoveryMinutes) : ve : 0, pe = a.reason;
    else if (j) {
      const se = new Date(C.getFullYear(), C.getMonth(), C.getDate(), 9).getTime(), Re = y.some(($) => $.start < se && se - $.start <= 36 * 36e5 && (It($) >= 120 || o && $.avgPower !== null && Number.isFinite($.avgPower) && $.elapsed >= 1800 && $.avgPower >= i * 0.8)), ke = e.feedback.some(($) => Number.isFinite($.date) && $.date < se && se - $.date <= 48 * 36e5 && $.rpe !== null && $.rpe >= 9);
      (Re || ke) && j !== "recovery" && (oe = "recovery", le = Math.min(ve, e.recoveryMinutes), re = "recovery", pe = ke ? "Very hard recent workout feedback prompted a recovery spin instead of the planned workout." : "A demanding or long ride was recorded before this session. Coach replaced it with easier recovery riding.");
    }
    S.push({
      key: M,
      date: C,
      weekday: O,
      originalId: j,
      workoutId: oe,
      originalMinutes: ve,
      minutes: le,
      recordedMinutes: Oe,
      status: re,
      reason: pe,
      changed: re === "completed" || oe !== j || le !== ve,
      strength: Z ? null : (c == null ? void 0 : c.strength) || null,
      strengthMinutes: Z ? 0 : (c == null ? void 0 : c.strengthMinutes) || 0
    });
  }
  const f = S.filter((b) => b.date.getTime() <= s && b.date.getTime() >= v.getTime()).filter((b) => y.some((C) => _e(new Date(C.start)) === b.key)), l = f.reduce((b, C) => b + y.filter((M) => _e(new Date(M.start)) === C.key).reduce((M, O) => M + It(O), 0), 0), T = f.reduce((b, C) => b + C.originalMinutes, 0), E = Math.max(0, l - T), N = S.slice(0, 7).reduce((b, C) => b + C.originalMinutes + C.strengthMinutes, 0), R = Math.max(0, e.budgetMinutes - N), x = S.slice(0, 7).filter((b) => b.status === "recovery" && b.date.getTime() >= new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()).reduce((b, C) => b + Math.max(0, C.originalMinutes - C.minutes), 0);
  let P = Math.max(0, E - R - x);
  const Y = new Date(v.getFullYear(), v.getMonth(), v.getDate() + 7).getTime(), D = S.filter((b) => b.date.getTime() >= new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime() && b.date.getTime() < Y && b.workoutId && b.status !== "completed" && b.status !== "skipped").sort((b, C) => {
    const M = (O) => O.workoutId === "recovery" ? 0 : O.workoutId === "endurance" ? 1 : 2;
    return M(b) - M(C) || b.date.getTime() - C.date.getTime();
  });
  for (const b of D) {
    if (P <= 0) break;
    const C = Math.max(0, b.minutes - 15), M = Math.min(C, P);
    M <= 0 || (b.minutes -= M, P -= M, b.minutes !== b.originalMinutes && (b.status = b.status === "recovery" ? "recovery" : "shortened", b.changed = !0, b.reason += " Additional riding exceeded your remaining weekly time by " + (E - R - x) + " minutes, so Coach shortened this session by " + M + " minutes. Strength and rest days stay unchanged."));
  }
  const k = S.filter((b) => b.date.getTime() < Y && (b.changed || b.status === "skipped" && m.has(b.key))).map((b) => ({
    key: b.key,
    originalId: b.originalId,
    workoutId: b.workoutId,
    beforeMinutes: b.originalMinutes,
    afterMinutes: b.status === "completed" ? b.recordedMinutes : b.minutes,
    reason: b.reason,
    kind: b.status === "completed" ? "completed" : b.status === "skipped" ? "skipped" : b.status === "shortened" ? "shortened" : b.status === "missed" ? "missed" : b.status === "event" ? "event" : "recovery"
  }));
  return { days: S, changes: k, extraMinutes: E };
}
const Aa = (e) => {
  const t = e.match(/\b(\d{1,2}):([0-5]\d):([0-5]\d)\b/);
  if (t) return Math.round((Number(t[1]) * 3600 + Number(t[2]) * 60 + Number(t[3])) / 60);
  const n = e.match(/\b(\d{1,2}):([0-5]\d)\b/);
  if (n) return Number(n[1]) * 60 + Number(n[2]);
  const a = e.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr|h)\b/i), i = e.match(/\b(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)\b/i), o = (a ? Number(a[1]) * 60 : 0) + (i ? Number(i[1]) : 0);
  return o > 0 ? Math.round(o) : null;
};
function Mn(e) {
  const t = e.trim().slice(0, 3e3), n = Aa(t), a = /\b(steady|base|endurance|easy aerobic|consistent|continuous)\b/i.test(t), i = t.match(/\b(?:heart[\s-]*rate|hr)?\s*(?:between|from)\s*(\d{2,3})\s*(?:and|to|[-–—])\s*(\d{2,3})\s*(?:bpm)?\b/i), o = t.match(/\b(?:heart[\s-]*rate|hr)?\s*(\d{2,3})\s*(?:-|–|—|to)\s*(\d{2,3})\s*bpm\b/i), d = t.match(/\b(\d{2,4})\s*(?:-|–|—|to)\s*(\d{2,4})\s*(?:w|watts)\b/i), s = i || o;
  let m = null;
  if (s) {
    const I = Number(s[1]), f = Number(s[2]);
    I >= 35 && f <= 240 && I < f && (m = { kind: "heart-rate", minBpm: I, maxBpm: f });
  } else if (d) {
    const I = Number(d[1]), f = Number(d[2]);
    I >= 20 && f <= 1200 && I < f && (m = { kind: "power", lowWatts: I, highWatts: f });
  }
  const y = [];
  n === null && y.push("Duration not specified. Enter a total workout time."), m === null && y.push("No valid heart-rate or wattage range found. Add an intensity target."), /\bwarm[\s-]?up\b/i.test(t) || y.push("Warmup not specified — no separate warmup was added."), /\bcool[\s-]?down\b/i.test(t) || y.push("Cooldown not specified — no separate cooldown was added."), (m == null ? void 0 : m.kind) === "heart-rate" && (y.push("No power target provided. Breakaway will not convert heart rate into watts."), y.push("A compatible heart-rate monitor is needed for live guidance.")), n !== null && (n < 1 || n > 600) && y.push("Duration must be between 1 and 600 minutes.");
  const v = n !== null && n >= 1 && n <= 600 && m !== null;
  return {
    title: /\b(base|endurance)\b/i.test(t) ? "Base" : "Steady Heart-Rate Ride",
    sport: "cycling",
    durationMinutes: n,
    target: m,
    description: t,
    pace: a ? "steady" : "unspecified",
    notes: a ? ["One continuous, steady session."] : [],
    warnings: y,
    ready: v
  };
}
const Ct = "Ride for 2 hours at a steady pace. Keep heart rate between 103 and 114 bpm.", In = "breakaway.coach.imported-workouts.v1", it = (e) => e === null ? "—" : Math.floor(e / 60) + ":" + String(e % 60).padStart(2, "0") + ":00";
function Da(e) {
  e.innerHTML = `
    <div class="ci-head">
      <div><span class="ci-eyebrow">WORKOUT STUDIO / BREAKAWAY COACH</span><h2>Turn a workout into a ride.</h2>
      <p>Describe a workout from Garmin Coach or any training plan. Review exactly what Coach understood.</p></div>
      <span class="ci-preview-tag">FEATURE PREVIEW</span>
    </div>
    <div class="ci-grid">
      <section class="ci-card">
        <div class="ci-card-title"><span class="ci-step">01</span><div><h3>Tell Coach what to ride</h3><p>Plain English works. Just include duration and intensity.</p></div></div>
        <div class="ci-source" role="tablist" aria-label="Import method">
          <button type="button" id="ciTabText" role="tab" aria-selected="true" aria-controls="ciPanelText">✎ Describe</button>
          <button type="button" id="ciTabImage" role="tab" aria-selected="false" aria-controls="ciPanelImage">▣ Screenshot</button>
          <button type="button" id="ciTabFile" role="tab" aria-selected="false" aria-controls="ciPanelFile">↥ Workout file</button>
        </div>
        <div id="ciPanelText" role="tabpanel" aria-labelledby="ciTabText">
          <label class="ci-label" for="ciDescription">YOUR WORKOUT DESCRIPTION</label>
          <textarea id="ciDescription" rows="6" spellcheck="true" placeholder="Ride for 2 hours at a steady pace. Keep heart rate between 103 and 114 bpm."></textarea>
          <div class="ci-helper"><span>Include total time and heart-rate or power targets.</span><button id="ciExample" type="button">RESET TO GARMIN EXAMPLE ↺</button></div>
        </div>
        <div id="ciPanelImage" role="tabpanel" aria-labelledby="ciTabImage" hidden>
          <div class="ci-upload"><div class="ci-upload-icon">▣</div><strong>Have a Garmin workout screenshot?</strong>
          <p>Preview an image here. Automatic screenshot extraction is not yet connected; use Describe to enter the requirements.</p>
          <label for="ciImage" class="ci-file-label">CHOOSE SCREENSHOT</label><input id="ciImage" type="file" accept="image/png,image/jpeg,image/webp" hidden>
          <span id="ciImageStatus">No file selected</span><img id="ciImagePreview" alt="Uploaded workout screenshot preview" hidden></div>
        </div>
        <div id="ciPanelFile" role="tabpanel" aria-labelledby="ciTabFile" hidden>
          <div class="ci-upload"><div class="ci-upload-icon">▤</div><strong>Structured workout files</strong>
          <p>FIT and ZWO workout conversion is planned, but not available in this preview.</p>
          <button type="button" id="ciBackToText" class="ci-outline">DESCRIBE INSTEAD →</button></div>
        </div>
        <div class="ci-note"><span class="ci-note-dot"></span> Coach only extracts values explicitly supplied. It does not guess FTP or power from heart rate.</div>
      </section>

      <section class="ci-card ci-result">
        <div class="ci-card-title"><span class="ci-step">02</span><div><h3>Review your workout</h3><p>Check the details before saving.</p></div></div>
        <div class="ci-result-heading"><div><span class="ci-eyebrow">CYCLING · IMPORTED WORKOUT</span><h4 id="ciTitle">Base</h4>
          <p id="ciSubtitle">One continuous steady cycling interval</p></div>
          <span id="ciStatus" class="ci-status">READY TO REVIEW</span></div>
        <div class="ci-stats">
          <div><span aria-hidden="true">◷</span><strong id="ciDuration">2:00:00</strong><small>DURATION</small></div>
          <div><span aria-hidden="true">♡</span><strong id="ciTarget">103–114</strong><small id="ciTargetUnit">TARGET BPM</small></div>
          <div><span aria-hidden="true">▥</span><strong>1</strong><small>WORKOUT STEP</small></div>
        </div>
        <div class="ci-timeline-heading"><strong>Workout timeline</strong><span id="ciTimelineType">Heart-rate target</span></div>
        <div class="ci-timeline" id="ciTimeline" role="img" aria-label="Continuous cycling workout lasting two hours with a heart rate target of 103 to 114 bpm">
          <div class="ci-timeline-top"><span>STEADY RIDE</span><span id="ciTimelineMinutes">120 MIN</span></div>
          <div class="ci-timeline-bar"><strong id="ciTimelineTarget">♡ 103–114 BPM</strong><span>MAINTAIN THROUGHOUT</span></div>
          <div class="ci-timeline-times"><span>0:00</span><span id="ciTimelineMiddle">1:00:00</span><span id="ciTimelineEnd">2:00:00</span></div>
        </div>
        <div class="ci-breakdown">
          <h5>Workout details</h5>
          <div><span>Sport</span><strong>Cycling</strong></div>
          <div><span>Structure</span><strong id="ciStructure">One continuous block</strong></div>
          <div><span>Trainer mode</span><strong id="ciTrainerMode">SIM / manual resistance</strong></div>
        </div>
        <div class="ci-warnings"><strong>Review these details</strong><ul id="ciWarnings"></ul></div>
        <button id="ciSave" type="button" class="ci-save">SAVE WORKOUT DRAFT →</button>
        <p id="ciSaveStatus" role="status" aria-live="polite"></p>
        <p class="ci-limit">In this preview, saving drafts works. Live heart-rate coaching and starting imported workouts in Classic are not yet implemented.</p>
      </section>
    </div>
  `;
  const t = (y) => e.querySelector("#" + y), n = t("ciDescription"), a = t("ciImage"), i = t("ciImagePreview");
  let o = null, d = Mn(Ct);
  n.value = Ct;
  const s = (y) => {
    for (const v of ["Text", "Image", "File"])
      t("ciTab" + v).setAttribute("aria-selected", String(v === y)), t("ciPanel" + v).hidden = v !== y;
  };
  t("ciTabText").addEventListener("click", () => s("Text")), t("ciTabImage").addEventListener("click", () => s("Image")), t("ciTabFile").addEventListener("click", () => s("File")), t("ciBackToText").addEventListener("click", () => s("Text")), t("ciExample").addEventListener("click", () => {
    n.value = Ct, m();
  });
  function m() {
    d = Mn(n.value);
    const y = d.target, v = (y == null ? void 0 : y.kind) === "heart-rate", S = (y == null ? void 0 : y.kind) === "power", I = v ? y.minBpm + "–" + y.maxBpm : S ? y.lowWatts + "–" + y.highWatts : "—", f = v ? "BPM" : S ? "WATTS" : "MISSING";
    t("ciTitle").textContent = d.title, t("ciSubtitle").textContent = d.pace === "steady" ? "One continuous steady cycling interval" : "One continuous cycling interval", t("ciDuration").textContent = it(d.durationMinutes), t("ciTarget").textContent = I, t("ciTargetUnit").textContent = "TARGET " + f, t("ciTimelineTarget").textContent = I + " " + f, t("ciTimelineType").textContent = v ? "Heart-rate target" : S ? "Power target" : "Intensity not specified", t("ciTimelineMinutes").textContent = d.durationMinutes !== null ? d.durationMinutes + " MIN" : "TIME MISSING", t("ciTimelineMiddle").textContent = d.durationMinutes !== null ? it(Math.floor(d.durationMinutes / 2)) : "—", t("ciTimelineEnd").textContent = it(d.durationMinutes), t("ciTrainerMode").textContent = v ? "SIM / manual resistance" : S ? "Power guidance / ERG optional" : "Intensity not specified", t("ciStructure").textContent = "One " + (d.pace === "steady" ? "steady " : "") + "block", t("ciWarnings").innerHTML = d.warnings.map((l) => "<li>" + A(l) + "</li>").join(""), t("ciStatus").textContent = d.ready ? "READY TO REVIEW" : "NEEDS DETAILS", t("ciStatus").classList.toggle("is-incomplete", !d.ready), t("ciSave").disabled = !d.ready, t("ciTimeline").setAttribute("aria-label", "Continuous cycling workout lasting " + it(d.durationMinutes) + " with target " + I + " " + f), t("ciSaveStatus").textContent = "";
  }
  n.addEventListener("input", m), a.addEventListener("change", () => {
    var v;
    const y = (v = a.files) == null ? void 0 : v[0];
    if (o && (URL.revokeObjectURL(o), o = null), i.hidden = !0, i.removeAttribute("src"), !y) {
      t("ciImageStatus").textContent = "No file selected";
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(y.type) || y.size > 8 * 1024 * 1024) {
      t("ciImageStatus").textContent = "Please select a JPG, PNG or WebP under 8 MB.";
      return;
    }
    o = URL.createObjectURL(y), i.src = o, i.hidden = !1, t("ciImageStatus").textContent = y.name + " · image preview only";
  }), t("ciSave").addEventListener("click", () => {
    if (d.ready)
      try {
        const y = JSON.parse(localStorage.getItem(In) || "[]"), v = Array.isArray(y) ? y : [];
        localStorage.setItem(In, JSON.stringify([...v.slice(-24), { ...d, id: "import-" + Date.now(), savedAt: (/* @__PURE__ */ new Date()).toISOString() }])), t("ciSaveStatus").textContent = "✓ Saved on this device. Imported-workout execution is not yet available.";
      } catch {
        t("ciSaveStatus").textContent = "Unable to save. Please enable browser storage.";
      }
  }), m();
}
const Rt = "breakaway.coach.morning.v1", ze = "breakaway.coach.ftp-known.v1", rt = (e, t, n) => typeof e == "number" && Number.isFinite(e) && Number.isInteger(e) && e >= t && e <= n ? e : null;
function At(e, t) {
  if (!e || typeof e != "object") return null;
  const n = e, a = typeof n.date == "string" ? /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(n.date) : null;
  if ((a ? [a[1], a[2].padStart(2, "0"), a[3].padStart(2, "0")].join("-") : null) !== t || !["tired", "okay", "great"].includes(String(n.feeling))) return null;
  for (const [o, d, s] of [["bodyBattery", 0, 100], ["sleepScore", 0, 100], ["hrvMs", 1, 300]])
    if (n[o] !== null && n[o] !== void 0 && rt(n[o], d, s) === null) return null;
  return {
    date: t,
    feeling: n.feeling,
    bodyBattery: rt(n.bodyBattery, 0, 100),
    sleepScore: rt(n.sleepScore, 0, 100),
    hrvMs: rt(n.hrvMs, 1, 300)
  };
}
function Fn(e) {
  if (!e) return { label: "Not checked in", detail: "Morning check-in is optional. Coach is using your schedule and recent rides.", suggestEasy: !1 };
  if (e.feeling === "tired") return { label: "Check your energy", detail: "You reported feeling tired. Consider an easy session; Body Battery, Sleep Score and HRV alone are not diagnostic.", suggestEasy: !0 };
  const t = [e.bodyBattery, e.sleepScore, e.hrvMs].filter((n) => n !== null).length;
  return {
    label: e.feeling === "great" ? "Feeling good" : "Feeling okay",
    detail: t ? "Your Garmin-style readings are recorded for reference. Personalized recovery thresholds need a baseline, so these numbers do not automatically change workouts." : "Your self-check is saved; there are no device readings today.",
    suggestEasy: !1
  };
}
function Na(e, t) {
  return !Fn(t).suggestEasy || e.status !== "planned" || !e.workoutId || e.workoutId === "recovery" ? e : { workoutId: "recovery", status: "recovery", reason: "You reported feeling tired during your morning check-in. Coach suggests an easier recovery spin instead of your planned session. This is a training suggestion, not a medical assessment." };
}
function xa(e, t, n = !1) {
  return n ? { color: "green", label: "Training complete", detail: "You have already ridden today. No additional prescribed workout is needed." } : !e && !t.demandingRide && !t.veryHardFeedback ? { color: "neutral", label: "Check-in optional", detail: "Coach has no reported fatigue today, but no check-in or personal recovery baseline is available. Follow the plan if you feel well, and adjust as needed." } : (e == null ? void 0 : e.feeling) === "tired" && (t.demandingRide || t.veryHardFeedback) ? { color: "red", label: "Recovery recommended", detail: "You reported fatigue and recent training was demanding. Coach recommends rest or gentle recovery rather than another hard effort." } : (e == null ? void 0 : e.feeling) === "tired" || t.demandingRide || t.veryHardFeedback ? { color: "yellow", label: "Take it easy", detail: (e == null ? void 0 : e.feeling) === "tired" ? "You reported fatigue. Coach suggests a lighter session based on your check-in." : "Recent demanding training suggests a lighter session. Coach uses recorded effort, not Garmin score cutoffs." } : { color: "green", label: "Follow your plan", detail: (e == null ? void 0 : e.feeling) === "great" ? "You feel good today. Follow your planned session without adding extra intensity." : "No fatigue flag was found in available inputs. Missing Garmin data does not mean you are fully recovered." };
}
const Cn = "breakaway.coach.event-goal.v1", Oa = { discipline: "general", name: "", date: "", distanceKm: null, elevationM: null, durationMinutes: null, stages: 1, priority: "A", objective: "finish", terrain: "road" }, ut = { general: "General cycling fitness", criterium: "Criterium", road: "Road race", tt: "Time trial", xco: "Mountain bike XCO / short track", xcm: "Mountain bike marathon", gravel: "Gravel race", cyclocross: "Cyclocross", "gran-fondo": "Gran Fondo / century", ultra: "Ultra-endurance", "stage-race": "Multi-day stage race" }, Dt = (e, t) => e === "" || e === null || e === void 0 ? null : Number.isFinite(Number(e)) && Number(e) > 0 && Number(e) <= t ? Number(e) : null;
function Nt(e) {
  const t = e && typeof e == "object" ? e : {}, n = Object.hasOwn(ut, String(t.discipline)) ? t.discipline : "general", a = typeof t.date == "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && !Number.isNaN((/* @__PURE__ */ new Date(t.date + "T12:00:00")).getTime()) && (/* @__PURE__ */ new Date(t.date + "T12:00:00")).toISOString().slice(0, 10) === t.date ? t.date : "";
  return {
    discipline: n,
    name: typeof t.name == "string" ? t.name.trim().slice(0, 100) : "",
    date: a,
    distanceKm: Dt(t.distanceKm, 5e3),
    elevationM: Dt(t.elevationM, 1e5),
    durationMinutes: Dt(t.durationMinutes, 3e4),
    stages: n === "stage-race" ? Math.max(2, Math.min(30, Math.round(Number(t.stages) || 2))) : 1,
    priority: ["A", "B", "C"].includes(String(t.priority)) ? t.priority : "A",
    objective: t.objective === "perform" ? "perform" : "finish",
    terrain: ["road", "gravel", "trail", "mixed"].includes(String(t.terrain)) ? t.terrain : "road"
  };
}
function Ft(e, t) {
  if (!e.date || e.discipline === "general") return { phase: "foundation", weeksLeft: null, description: "Build consistency, comfortable endurance and repeatable training habits." };
  const n = /* @__PURE__ */ new Date(e.date + "T12:00:00"), a = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12), i = Math.round((n.getTime() - a.getTime()) / 864e5), o = e.discipline === "stage-race" ? Math.max(2, e.stages) : 1, d = Math.max(0, Math.ceil(i / 7)), s = i < -(o - 1) ? "post-event" : i <= 0 ? "event" : i <= 7 ? "taper" : i <= 28 ? "specific" : i <= 70 ? "build" : "base";
  return { phase: s, weeksLeft: d, description: { base: "Build a sustainable aerobic foundation before race-specific sessions.", build: "Develop the power and endurance needed for your event.", specific: "Practice efforts that resemble your event while managing fatigue.", taper: "Reduce accumulated fatigue; preserve fitness and arrive ready.", event: "Event day: follow your pacing, fueling and safety plan.", "post-event": "Recover after the event before setting a new primary goal." }[s] };
}
function La(e, t, n) {
  const { phase: a } = Ft(t, n), o = [...e.days === 2 ? [1, 4] : e.days === 3 ? [1, 3, 6] : e.days === 4 ? [1, 2, 4, 6] : e.days === 5 ? [0, 1, 3, 4, 6] : [0, 1, 2, 3, 4, 6]];
  if (o.includes(e.restDay)) {
    const I = Array.from({ length: 7 }, (f, l) => l).find((f) => f !== e.restDay && !o.includes(f));
    I !== void 0 && o.splice(o.indexOf(e.restDay), 1, I);
  }
  o.sort((I, f) => I - f);
  const d = ["criterium", "xco", "cyclocross"].includes(t.discipline), s = ["ultra", "stage-race", "xcm", "gravel", "gran-fondo"].includes(t.discipline), m = d ? "vo2" : s ? "tempo" : t.discipline === "tt" ? "sweetspot" : "tempo", y = e.experience === "beginner" ? "tempo" : m, v = a === "build" || a === "specific", S = a === "taper" || a === "post-event" || a === "event";
  return Array.from({ length: 7 }, (I, f) => {
    const l = o.indexOf(f);
    if (l < 0) return { day: f, workoutId: null, reason: "Scheduled recovery day" };
    const T = S ? l === 0 ? "recovery" : "endurance" : l === o.length - 1 ? "endurance" : l === 0 ? v ? y : "endurance" : l === 2 && v && d && e.experience === "advanced" ? "tempo" : l % 2 === 0 ? "recovery" : "endurance", E = a === "foundation" ? "General development" : ut[t.discipline] + " · " + a;
    return { day: f, workoutId: T, reason: E + " preparation. " + (S ? "Keep the session easy and avoid chasing workload." : v ? "Match the event demands while maintaining recovery." : "Build consistent aerobic training.") };
  });
}
function Xe() {
  const e = ee(xt);
  return Array.isArray(e) ? e.filter((t) => t && typeof t.workout == "string" && typeof t.date == "string").slice(-150) : [];
}
const ct = (e) => {
  const t = Math.max(0, Math.ceil(e));
  return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
}, Ze = (e, t) => e.querySelector("#" + t);
function Ha(e) {
  let n = xe(ee(Ae) || $e), a = Nt(ee(Cn) || Oa), i = kt(n), o = "endurance", d = !1, s = null, m = "", y = null, v = [], S = null, I = [], f = ka(ee(Sn)), l = null, T = null, E = null, N = "structured";
  const R = "breakaway.coach.skipped-days.v1";
  function x() {
    const r = ee(R);
    return Array.isArray(r) ? [...new Set(r.map(lt).filter(Boolean))].slice(-90) : [];
  }
  let P = ee(ze) === !0 || ee(ze) === null && !!ee(Ae), Y = [], D = null, k = null, ce = "", he = 0, V = !1, ye = null, b = 130;
  const C = document.getElementById("screenRoute"), M = document.createElement("section");
  M.id = "breakawayCoachScreen", M.className = "coach-screen coach-v2", M.hidden = !0, M.innerHTML = `
<header class="coach-top">
  <div class="coach-identity">
    <div class="coach-eyebrow">RIDE BREAKAWAY <span>/</span> CLASSIC <span>/</span> COACH</div>
    <h1>Breakaway <em>Coach.</em></h1>
    <p>Train with a plan. Enjoy the ride.</p>
  </div>
  <div class="coach-header-actions">
    <button type="button" data-navigate-coach="settings" id="coachHeaderFtp" class="coach-ftp-chip" title="FTP means Functional Threshold Power. Edit this in My Setup." aria-label="Edit your FTP and training settings">FTP 200 W</button>
    <button type="button" class="coach-back" id="coachBack">← BACK TO CLASSIC</button>
  </div>
</header>
<nav class="coach-nav" role="tablist" aria-label="Breakaway Coach navigation">
  <button type="button" id="coachTabToday" role="tab" aria-controls="coachViewToday" aria-selected="true" tabindex="0" data-coach-tab="today">◉ <span>Today</span></button>
  <button type="button" id="coachTabPlan" role="tab" aria-controls="coachViewPlan" aria-selected="false" tabindex="-1" data-coach-tab="plan">▦ <span>My Week</span></button>
  <button type="button" id="coachTabHistory" role="tab" aria-controls="coachViewHistory" aria-selected="false" tabindex="-1" data-coach-tab="history">▥ <span>Progress</span></button>
  <button type="button" id="coachTabSettings" role="tab" aria-controls="coachViewSettings" aria-selected="false" tabindex="-1" data-coach-tab="settings">⚙ <span>My Setup</span></button>
  <button type="button" id="coachTabImport" role="tab" aria-controls="coachViewImport" aria-selected="false" tabindex="-1" data-coach-tab="import">✎ <span>Create Workout</span></button>
</nav>
<div class="coach-main" role="main">
  <section class="coach-view" id="coachViewToday" role="tabpanel" aria-labelledby="coachTabToday" data-coach-view="today">
    <div class="coach-page-lead"><div><span class="coach-tag">YOUR NEXT SESSION</span><h2>Today's training.</h2><p id="coachSuggestion">Coach selects your session from your weekly plan and recent riding.</p></div><button type="button" class="coach-subtle-link" data-navigate-coach="plan">View my week →</button></div>
    <div id="coachFirstRun" class="coach-first-run" hidden>
      <div><strong>New to indoor cycling? Start here.</strong><p>Tell Coach your goal, how many days you can ride, and what equipment you have. No power-meter knowledge is required to begin. You can try an eight-minute trainer-free demonstration in My Setup.</p></div>
      <div class="coach-first-run-actions"><button type="button" data-navigate-coach="settings">SET UP MY PLAN →</button><button type="button" id="coachFirstRunDemo" class="coach-demo-secondary">TRY WITHOUT A TRAINER</button></div>
    </div>
    <section class="coach-panel coach-morning" aria-label="Optional morning check-in">
      <div class="coach-section-top"><span class="coach-tag">DAILY CHECK-IN · OPTIONAL</span><span id="coachReadinessLabel">Not checked in</span></div>
      <p id="coachReadinessExplanation" class="coach-small">How you feel matters. Garmin metrics are optional and do not use fixed cutoffs.</p>
      <details id="coachCheckinDetails"><summary>How are you feeling today? <span>Update recovery inputs</span></summary>
        <div class="coach-checkin-fields">
          <label>How do you feel?<select id="coachFeeling"><option value="okay">Okay</option><option value="tired">Tired</option><option value="great">Great</option></select></label>
          <label>Morning Body Battery (0–100)<input id="coachBattery" type="number" min="0" max="100" placeholder="Optional"></label>
          <label>Garmin Sleep Score (0–100)<input id="coachSleep" type="number" min="0" max="100" placeholder="Optional"></label>
          <label>HRV (ms)<input id="coachHrv" type="number" min="1" max="300" placeholder="Optional"></label>
        </div>
        <p class="coach-small">Enter morning readings only. HRV needs a personal baseline; Body Battery and sleep can overlap with it. Never use these numbers as a medical diagnosis.</p>
        <button type="button" class="coach-classic-start" id="coachSaveCheckin">SAVE TODAY'S CHECK-IN</button>
        <p id="coachCheckinFeedback" role="status" aria-live="polite"></p>
      </details>
    </section>
    <div class="coach-goal-headline" aria-live="polite"><div><span class="coach-tag">YOUR PRIMARY GOAL</span><strong id="coachGoalHeadlineLabel">Balanced cycling fitness</strong><span id="coachGoalHeadlineMeta">Build consistency and endurance</span></div><button type="button" data-navigate-coach="settings" class="coach-subtle-link">Edit goal →</button></div>
    <div id="coachAdaptiveToday" class="coach-adaptive-summary" role="status" aria-live="polite" hidden></div>
    <div class="coach-calendar" aria-label="Next seven days of training">
      <div class="coach-calendar-heading"><span class="coach-tag">YOUR NEXT 7 DAYS</span><span class="coach-calendar-hint">Drag a ride to a new day, or select Move</span></div>
      <div class="coach-calendar-strip" id="coachCalendarStrip" role="group" aria-label="Next seven calendar days"></div>
      <section class="coach-calendar-details" id="coachCalendarDetails" aria-label="Selected day's planned workouts" role="region" hidden></section>
    </div>
    <div class="coach-today-grid">
      <section class="coach-panel coach-workout-card">
        <div class="coach-section-top"><span class="coach-tag">COACH RECOMMENDS</span><span id="coachRecommendationLabel" class="coach-feature-pill">YOUR PLAN</span></div>
        <h3 id="coachRecommendedName" class="coach-recommended-name">Aerobic Builder</h3>
        <div id="coachWhy" class="coach-why"></div>
        <div id="coachChangeDetail" class="coach-change-detail" role="status" aria-live="polite" hidden></div>
        <div id="coachRestState" class="coach-rest-state" hidden><p id="coachRestReason"></p><button type="button" id="coachBrowseOptional">CHOOSE AN OPTIONAL RIDE →</button></div>
        <div id="coachWorkoutControls">
        <div id="coachWorkoutInfo" class="coach-workout-info"></div>
        <div class="coach-interval-readout" id="coachIntervalDetails" aria-live="polite" aria-atomic="true"></div>
        <div id="coachSegments" class="coach-segments" role="group" aria-label="Workout blocks: hover, focus, or tap a block to inspect its duration and wattage requirements"></div>
        <details class="coach-trainer-options"><summary>Trainer options <span>Automatic power (recommended)</span></summary>
          <div class="coach-start-controls"><label for="coachControl">HOW THE TRAINER BEHAVES</label>
            <select id="coachControl" class="coach-select">
              <option value="structured">Automatic power — ERG</option>
              <option value="guided">Ride by feel — SIM</option>
            </select>
            <p><strong>Automatic power (ERG)</strong> adjusts trainer resistance to help you meet a power target. <strong>Ride by feel (SIM)</strong> lets you change your effort yourself. If you are unsure, keep the recommended automatic option.</p>
          </div>
        </details>
        <button type="button" id="coachStartClassic" class="coach-classic-start"><span id="coachStartLabel">CONNECT MY TRAINER</span> <span aria-hidden="true">→</span></button>
        <p class="coach-start-note">Next: connect your trainer and confirm the connection and optional heart-rate monitor. Pedaling starts the workout. New rider? Try the eight-minute trainer-free demo in My Setup first.</p>
        <div class="coach-quick"><button type="button" data-coach-question="tired">Feeling tired?</button><button type="button" data-coach-question="short">Short on time?</button><button type="button" data-coach-question="why">Why this ride?</button></div>
        <p id="coachAnswer" class="coach-feedback" aria-live="polite">Your workout is based on your saved FTP and experience.</p>
        <p id="coachStatus" class="coach-status" role="status"></p>
        </div>
        <div class="coach-swap-actions">
          <button type="button" id="coachSwapToggle" class="coach-subtle-link" aria-expanded="false" aria-controls="coachSwapPanel">Swap workout →</button>
          <button type="button" id="coachUseRecommendation" class="coach-subtle-link" hidden>Use Coach's recommendation ↺</button>
          <button type="button" id="coachSkipToday" class="coach-subtle-link">Skip today's session</button>
        </div>
        <div id="coachSwapPanel" class="coach-swap-panel" hidden>
          <p>Prefer something else? Choosing a different workout is optional and won't rewrite your weekly plan.</p>
          <div id="coachSwapList" class="coach-swap-list"></div>
        </div>
      </section>
      <aside class="coach-today-side">
        <section class="coach-panel coach-strength-today" id="coachStrengthToday" hidden></section>
        <section class="coach-panel coach-mini-card">
          <div class="coach-section-top"><span class="coach-tag">MY TRAINING</span><button type="button" class="coach-subtle-link" data-navigate-coach="settings">Edit →</button></div>
          <div id="coachProfileSummary" class="coach-profile-summary"></div>
        </section>
        <section class="coach-panel coach-mini-card">
          <div class="coach-section-top"><span class="coach-tag">NEXT UP</span><button type="button" class="coach-subtle-link" data-navigate-coach="plan">Full week →</button></div>
          <h3>Coming up</h3><div id="coachNextUp"></div>
        </section>
      </aside>
    </div>
  </section>
  <section class="coach-view" id="coachViewImport" role="tabpanel" aria-labelledby="coachTabImport" data-coach-view="import" hidden>
    <div id="coachImportRoot"></div>
  </section>
  <section class="coach-view" id="coachViewPlan" role="tabpanel" aria-labelledby="coachTabPlan" data-coach-view="plan" hidden>
    <div class="coach-page-lead"><div><span class="coach-tag">BUILD CONSISTENCY</span><h2>Your training week.</h2><p>Your rides, strength sessions, and rest days in one place.</p></div><button type="button" class="coach-subtle-link" data-navigate-coach="settings">Edit my plan →</button></div>
    <div id="coachAdaptiveWeek" class="coach-adaptive-summary" aria-label="Adaptive schedule changes" hidden></div>
    <div class="coach-plan-grid">
      <section class="coach-panel"><div class="coach-section-top"><span class="coach-tag">MY NEXT 7 DAYS · SAME PLAN AS TODAY</span></div><p id="coachPlanBudget" class="coach-plan-summary"></p><div id="coachWeek" class="coach-week-integrated"></div></section>
      <section class="coach-panel coach-plan-explain"><div class="coach-section-top"><span class="coach-tag">HOW TO USE YOUR WEEK</span></div>
        <h3>Coach makes the plan. You choose when to go.</h3>
        <p>Tap a cycling session to review it on Today. Tap a strength session to open its guided workout. Your rest day stays free.</p>
        <button type="button" class="coach-classic-start" data-navigate-coach="today">GO TO TODAY →</button>
        <details class="coach-library-disclosure"><summary>Browse other cycling workouts</summary>
          <p class="coach-small">Optional: choose a different ride without replacing your full weekly plan.</p>
          <div id="coachPlanLibrary" class="coach-library-list"></div>
        </details>
      </section>
    </div>
  </section>
  <section class="coach-view" id="coachViewHistory" role="tabpanel" aria-labelledby="coachTabHistory" data-coach-view="history" hidden>
    <div class="coach-page-lead"><div><span class="coach-tag">TRACK YOUR PROGRESS</span><h2>Your progress.</h2><p>See completed rides and strength workouts. Import past cycling activity here too.</p></div></div>
    <div class="coach-history-grid">
      <section class="coach-panel coach-history-host" id="coachHistoryImport"></section>
      <div class="coach-history-side">
        <section class="coach-panel"><div class="coach-section-top"><span class="coach-tag">ALL BREAKAWAY RIDES</span></div><div id="coachPlatformHistory"><p class="coach-small">Loading local rides…</p></div></section>
        <section class="coach-panel"><div class="coach-section-top"><span class="coach-tag">COACHED RIDES</span></div><div id="coachHistory"></div></section>
        <section class="coach-panel"><div class="coach-section-top"><span class="coach-tag">STRENGTH TRAINING LOG</span></div><div id="coachStrengthHistory"></div></section>
      </div>
    </div>
  </section>
  <section class="coach-view" id="coachViewSettings" role="tabpanel" aria-labelledby="coachTabSettings" data-coach-view="settings" hidden>
    <div class="coach-page-lead"><div><span class="coach-tag">PERSONALIZE</span><h2>My setup.</h2><p>Set your goals, schedule, and equipment. Save everything with one button.</p></div></div>
    <div class="coach-setup-toolbar">
      <div><strong>One plan. One save.</strong><p>Changes to cycling and strength settings save together.</p></div>
      <button type="button" id="coachSaveProfile" class="coach-classic-start">SAVE MY PLAN →</button>
      <p id="coachSettingsFeedback" class="coach-settings-feedback" role="status"></p>
    </div>
    <div class="coach-settings-grid">
      <div class="coach-setup-left">
      <section class="coach-panel coach-goal-setup" aria-label="Your training goal">
        <div class="coach-section-top"><span class="coach-tag">STEP 1 · YOUR GOAL</span><span class="coach-tag">EVENT-BASED PLAN</span></div>
        <h3>What are you training for?</h3>
        <p class="coach-small">Your event changes the training emphasis. No race planned? Choose general cycling fitness.</p>
        <div class="coach-fields">
          <label>EVENT OR GOAL TYPE<select id="coachEventDiscipline">${Object.entries(ut).map(([r, u]) => '<option value="' + r + '">' + u + "</option>").join("")}</select></label>
          <label>EVENT NAME (OPTIONAL)<input id="coachEventName" type="text" maxlength="100" placeholder="e.g. Five-day gravel stage race"></label>
          <label>FIRST DAY OF EVENT (IF KNOWN)<input id="coachEventDate" type="date"></label>
          <label>YOUR PRIORITY<select id="coachEventPriority"><option value="A">A — primary goal</option><option value="B">B — preparation event</option><option value="C">C — training event</option></select></label>
          <label>YOUR OBJECTIVE<select id="coachEventObjective"><option value="finish">Finish comfortably</option><option value="perform">Perform / compete</option></select></label>
          <label>TERRAIN<select id="coachEventTerrain"><option value="road">Paved road</option><option value="gravel">Gravel</option><option value="trail">MTB trail</option><option value="mixed">Mixed</option></select></label>
          <label>TOTAL EVENT DISTANCE (MILES, OPTIONAL)<input id="coachEventDistance" type="number" min="0.1" max="3106" step="any"></label>
          <label>TOTAL ESTIMATED RIDING TIME (MINUTES, OPTIONAL)<input id="coachEventDuration" type="number" min="1" max="30000" step="1"></label>
          <label>TOTAL CLIMBING (FEET, OPTIONAL)<input id="coachEventElevation" type="number" min="0" max="328084" step="1"></label>
          <label id="coachEventStagesWrap">NUMBER OF CONSECUTIVE STAGES<input id="coachEventStages" type="number" min="2" max="30" step="1" value="2"></label>
        </div>
        <p class="coach-small" id="coachGoalPhaseSummary"></p>
        <p class="coach-small" id="coachEventStageHint" hidden>For a multi-day race, enter the total distance, total climbing, and the first stage date. Individual stage profiles will be added in the next planning iteration.</p>
        <p class="coach-small">Planning preview: event discipline and date currently guide the weekly emphasis and phase. Course metrics, objective, terrain and race priority are saved but not yet used to prescribe race-specific intervals. Coach still adapts your weekly schedule around actual rides.</p>
      </section>
      <section class="coach-panel">
        <div class="coach-section-top"><span class="coach-tag">YOUR RIDER PROFILE</span><span class="coach-tag">STEP 2</span><span class="coach-tag">LOCAL ONLY</span></div>
        <div class="coach-fields">
          <label>Do you know your measured or estimated FTP?<select id="coachFtpKnown"><option value="no">No — I'm new to power training</option><option value="yes">Yes — I'll enter it below</option></select></label>
          <label>FTP (W)<input id="coachFtp" type="number" min="75" max="550" step="1" aria-describedby="coachFtpHelp"></label>
          <label>TOTAL TRAINING HOURS / WEEK<input id="coachHours" type="number" min="1" max="20" step=".5"></label>
          <label>DAYS / WEEK<input id="coachDays" type="number" min="2" max="6" step="1"></label>
          <label>REST DAY<select id="coachRestDay"><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select></label>
          <label>LEVEL<select id="coachExperience"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
          <label id="coachGeneralFocusWrap">GENERAL FITNESS FOCUS (NO RACE EVENT)<select id="coachGoal"><option value="fitness">Ride consistently</option><option value="ftp">Increase FTP</option><option value="endurance">Build endurance</option><option value="race">Prepare to race</option></select></label>
        </div>
        <p id="coachFtpHelp" class="coach-small"><strong>New to FTP?</strong> Functional Threshold Power is an estimate of your sustainable cycling power. The starting 200 W is a placeholder, <strong>not a measurement of your fitness</strong>. Set a known FTP if you have one; otherwise start with the trainer-free demo and use easy efforts until you establish a suitable training baseline. Avoid treating placeholder watt targets as personalized prescriptions.</p><p class="coach-small">Your weekly training hours include both cycling and strength. You can change them any time.</p>
        <p class="coach-small"><strong>Saved on this browser only:</strong> clearing site data, using private browsing, or switching computers can remove your plan. Account sync is not currently available.</p>
      </section>
      <section class="coach-panel coach-howto">
        <span class="coach-tag">HOW COACH WORKS</span><h3>Start in three steps</h3>
        <div class="coach-howto-step"><strong>1. Set your schedule</strong><p>Choose your goal, available days, and time. FTP means an estimate of sustainable power; the initial 200 W is only a placeholder.</p></div>
        <div class="coach-howto-step"><strong>2. Review today's recommendation</strong><p>Coach selects your scheduled session. You can shorten, ease, or swap it when needed.</p></div>
        <div class="coach-howto-step"><strong>3. Start your workout</strong><p>Connect your trainer for a ride. Strength workouts need no trainer.</p></div>
        <button type="button" class="coach-subtle-link" data-navigate-coach="today">Go to Today →</button>
        <button type="button" id="coachDemo" class="coach-demo-button">TRY A TRAINER-FREE DEMO <small>8 MINUTES · NO HARDWARE REQUIRED →</small></button>
      </section>
      </div>
      <div class="coach-setup-right">
        <section class="coach-panel coach-strength-settings" id="coachStrengthSettings"></section>
      </div>
    </div>
  </section>
</div>
`, document.body.append(M);
  const O = document.createElement("aside");
  O.id = "breakawayCoachHud", O.className = "coach-hud", O.hidden = !0, O.setAttribute("aria-label", "Live Breakaway Coach"), O.innerHTML = '<div class="coach-hud-top"><strong>◆ BREAKAWAY COACH</strong><span id="coachHudState">WAITING FOR PEDALS</span><button type="button" id="coachMinimize" aria-label="Minimize coaching panel">−</button></div><div class="coach-hud-core"><div><small>ACTUAL</small><strong id="coachActual">—<span> W</span></strong></div><div><small>TARGET</small><strong id="coachTarget">—<span> W</span></strong></div><div><small>REMAINING</small><strong id="coachRemaining">—</strong></div></div><div class="coach-interval-line"><span id="coachInterval">WARM UP</span><span id="coachSessionClock">0:00</span></div><div class="coach-progress"><div id="coachProgressBar"></div></div><p id="coachPrompt" aria-live="polite">Connect a trainer, then start pedaling.</p><div class="coach-hud-actions"><button type="button" id="coachLighter">−5% EFFORT</button><button type="button" id="coachHarder">+5% EFFORT</button><button type="button" id="coachEnd">END COACHING</button></div>', document.body.append(O);
  const c = (r) => Ze(M, r), F = (r) => Ze(O, r), q = c("coachControl"), Z = ["today", "plan", "history", "settings", "import"];
  function j(r, u = !1) {
    M.querySelectorAll("[data-coach-tab]").forEach((p) => {
      const g = p.dataset.coachTab === r;
      p.setAttribute("aria-selected", String(g)), p.tabIndex = g ? 0 : -1, g && u && p.focus();
    }), M.querySelectorAll("[data-coach-view]").forEach((p) => {
      p.hidden = p.dataset.coachView !== r;
    }), M.scrollTop = 0, r === "history" && mt();
  }
  M.querySelectorAll("[data-coach-tab]").forEach((r) => {
    r.addEventListener("click", () => j(r.dataset.coachTab)), r.addEventListener("keydown", (u) => {
      const p = Z.indexOf(r.dataset.coachTab);
      let g = -1;
      u.key === "ArrowRight" && (g = (p + 1) % Z.length), u.key === "ArrowLeft" && (g = (p + Z.length - 1) % Z.length), u.key === "Home" && (g = 0), u.key === "End" && (g = Z.length - 1), g >= 0 && (u.preventDefault(), j(Z[g], !0));
    });
  }), M.querySelectorAll("[data-navigate-coach]").forEach((r) => r.addEventListener("click", () => {
    const u = r.dataset.navigateCoach;
    Z.includes(u) && j(u, !0);
  }));
  function ve() {
    if (P = ee(ze) === !0 || ee(ze) === null && !!ee(Ae), k) {
      O.hidden = !1;
      return;
    }
    M.hidden = !1, document.body.classList.add("coach-planning"), j("today"), le(), c("coachFtpKnown").dispatchEvent(new Event("change")), P || (N = "guided", q.value = "guided");
    const r = At(ee(Rt), Ne(/* @__PURE__ */ new Date()));
    if (r) {
      c("coachFeeling").value = r.feeling;
      for (const [u, p] of [["coachBattery", r.bodyBattery], ["coachSleep", r.sleepScore], ["coachHrv", r.hrvMs]]) c(u).value = p === null ? "" : String(p);
    } else {
      c("coachFeeling").value = "okay";
      for (const u of ["coachBattery", "coachSleep", "coachHrv"]) c(u).value = "";
    }
    ne(), mt(), window.scrollTo(0, 0);
  }
  function Ye() {
    M.hidden = !0, document.body.classList.remove("coach-planning");
  }
  C == null || C.addEventListener("click", (r) => {
    const u = r.target;
    u instanceof Element && u.closest("#openBreakawayCoach") && ve();
  }), c("coachBack").addEventListener("click", Ye);
  function fe(r = /* @__PURE__ */ new Date()) {
    return ba(
      n,
      (D == null ? void 0 : D.settings) || Ln,
      a.discipline === "general" ? Rn(n, !1) : La(n, a, r),
      (u) => Math.round(X(i.find((p) => p.id === u) || i[0]) / 60)
    );
  }
  function Oe() {
    const r = Y.map((w) => ({ start: w.start, elapsed: w.elapsed, avgPower: w.avgPower })), u = v.filter((w) => !r.some((L) => Math.abs(L.start - w.start) < 12e4)).map((w) => ({ start: w.start, elapsed: w.duration, avgPower: w.avgPower, source: "import" })), p = r.concat(u), g = Xe().filter((w) => w.mode === "classic" && w.elapsedSeconds > 0).map((w) => ({
      start: Date.parse(w.date) - w.elapsedSeconds * 1e3,
      elapsed: w.elapsedSeconds,
      avgPower: w.averageWatts,
      source: "classic"
    })).filter((w) => Number.isFinite(w.start) && !p.some((L) => Math.abs(L.start - w.start) < 12e4));
    return p.concat(g);
  }
  function Ce() {
    return Xe().map((r) => ({ date: Date.parse(r.date), rpe: r.rpe }));
  }
  function Le() {
    const r = Ce().concat(((D == null ? void 0 : D.history) || []).map((u) => ({ date: Date.parse(u.date), rpe: u.rpe })));
    return Ot(n, Date.now(), P ? Oe() : Oe().map((u) => ({ ...u, avgPower: null })), r).fatigued;
  }
  function oe() {
    const r = c("coachEventDiscipline").value;
    c("coachEventStagesWrap").hidden = r !== "stage-race", c("coachEventStages").disabled = r !== "stage-race", r === "stage-race" && Number(c("coachEventStages").value) < 2 && (c("coachEventStages").value = "2"), c("coachEventStageHint").hidden = r !== "stage-race", c("coachGeneralFocusWrap").hidden = r !== "general";
    const u = Nt({ discipline: r, date: c("coachEventDate").value }), p = Ft(u, /* @__PURE__ */ new Date());
    c("coachGoalPhaseSummary").textContent = u.discipline === "general" ? "General fitness: build a sustainable weekly routine." : p.weeksLeft === null ? "Set an event date to calculate training phases." : p.weeksLeft + " weeks remaining · " + p.phase.toUpperCase() + " phase. " + p.description;
  }
  function le() {
    c("coachFtp").value = String(n.ftp), c("coachFtpKnown").value = P ? "yes" : "no", c("coachHours").value = String(n.hours), c("coachDays").value = String(n.days), c("coachRestDay").value = String(n.restDay), c("coachExperience").value = n.experience, c("coachGoal").value = n.goal, c("coachEventDiscipline").value = a.discipline, c("coachEventName").value = a.name, c("coachEventDate").value = a.date, c("coachEventPriority").value = a.priority, c("coachEventObjective").value = a.objective, c("coachEventTerrain").value = a.terrain;
    for (const [r, u] of [["coachEventDistance", a.distanceKm === null ? null : Math.round(a.distanceKm / 1.609344 * 10) / 10], ["coachEventDuration", a.durationMinutes], ["coachEventElevation", a.elevationM === null ? null : Math.round(a.elevationM / 0.3048)], ["coachEventStages", a.stages]]) c(r).value = u === null ? "" : String(u);
    oe();
  }
  function re() {
    if (y) return y;
    const r = i.find((w) => w.id === o) || i[0];
    if (d) {
      const w = s;
      return w !== null && w >= 15 && w * 60 < X(r) ? Tt(r, w) : r;
    }
    const u = fe().days.find((w) => w.day === (/* @__PURE__ */ new Date()).getDay()), p = D != null && D.settings.enabled && (u == null ? void 0 : u.cyclingId) === r.id && u.cyclingMinutes > 0 ? u.cyclingMinutes : 1 / 0, g = Math.min(E ?? 1 / 0, p);
    return Number.isFinite(g) && g >= 15 && g * 60 < X(r) ? Tt(r, g) : r;
  }
  function pe(r) {
    const u = re(), p = u.segments[r];
    if (!p) return;
    const g = ln(n.ftp, p);
    c("coachIntervalDetails").innerHTML = '<div class="coach-interval-identity"><span class="coach-interval-kicker">BLOCK ' + (r + 1) + " / " + u.segments.length + "</span><strong>" + A(p.name) + "</strong><small>" + g.ftpRange + '</small></div><div class="coach-interval-numbers"><div><span>DURATION</span><strong>' + g.duration + "</strong></div><div><span>POWER RANGE</span><strong>" + g.range + "</strong></div><div><span>ERG TARGET</span><strong>" + g.target + " W</strong></div></div>", c("coachSegments").querySelectorAll("[data-coach-segment]").forEach((w) => {
      w.setAttribute("aria-pressed", String(Number(w.dataset.coachSegment) === r));
    });
  }
  const se = c("coachSegments"), Re = (r) => {
    const u = r.target;
    if (!(u instanceof Element)) return;
    const p = u.closest("[data-coach-segment]");
    p && se.contains(p) && pe(Number(p.dataset.coachSegment));
  };
  se.addEventListener("pointerover", Re), se.addEventListener("focusin", Re), se.addEventListener("click", Re);
  function ke() {
    const r = c("coachCalendarStrip"), u = c("coachCalendarDetails"), p = I.findIndex((U) => U.key === S);
    r.innerHTML = I.map((U, Be) => {
      const bt = U.reason.startsWith("Event stage "), ge = U.rideName || (U.completedRide ? "Ride completed" : bt ? "Event day" : null), Te = U.isToday && (D == null ? void 0 : D.completedToday()) === !0, _ = U.strength ? Te ? "✓ Strength completed" : "Full Body Strength " + U.strength : null, ae = [ge, _].filter(Boolean);
      return '<button type="button" class="coach-calendar-pill' + (U.isToday ? " is-today" : "") + '" data-calendar-index="' + Be + '" draggable="' + !!(U.rideId && !U.completedRide) + '" aria-expanded="' + (U.key === S) + '" aria-controls="coachCalendarDetails" aria-label="' + A(U.title + ": " + (ae.join(", ") || "Rest day") + ". " + (U.key === S ? "Collapse details." : "Expand details.")) + '"><span class="coach-calendar-date">' + A(U.label) + '</span><span class="coach-calendar-activity">' + A(ge || (_ ? "" : "Rest day")) + "</span>" + (_ ? '<span class="coach-calendar-strength">' + A(_) + "</span>" : "") + '<span class="coach-calendar-chevron" aria-hidden="true">' + (U.key === S ? "⌃" : "⌄") + "</span></button>";
    }).join("");
    const g = I[p];
    if (u.hidden = !g, !g) {
      u.innerHTML = "";
      return;
    }
    u.setAttribute("aria-label", "Workouts for " + g.title);
    const w = g.rideId ? i.find((U) => U.id === g.rideId) : null, L = w ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">CYCLING</span><strong>' + A(w.name) + "</strong><p>" + g.rideMinutes + " min · " + A(w.description) + "</p><p>" + A(g.reason) + '</p></div><div class="coach-calendar-session-actions"><button type="button" data-calendar-action="ride" data-calendar-index="' + p + '">' + (g.isToday ? "VIEW TODAY’S RIDE" : "USE THIS RIDE TODAY (OPTIONAL)") + ' →</button><button type="button" data-calendar-action="move" data-calendar-index="' + p + '">' + (l === g.key ? "CANCEL MOVE" : "MOVE WORKOUT") + "</button></div></div>" : g.completedRide ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">CYCLING</span><strong>Ride completed today</strong><p>Coach will account for your recorded ride.</p></div></div>' : "", G = g.isToday && (D == null ? void 0 : D.completedToday()) === !0, ie = g.strength ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">' + (G ? "STRENGTH · COMPLETED" : "STRENGTH · NO TRAINER NEEDED") + "</span><strong>Full Body Strength " + g.strength + "</strong><p>" + g.strengthMinutes + " min · Exercises matched to your saved equipment</p></div>" + (G ? "" : '<button type="button" data-calendar-action="strength" data-calendar-index="' + p + '">' + (g.isToday ? "START STRENGTH" : "START STRENGTH TODAY (OPTIONAL)") + " →</button>") + "</div>" : "", K = g.reason.startsWith("Event stage "), z = !L && !ie ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">' + (K ? "EVENT DAY" : "RECOVERY") + "</span><strong>" + (K ? "Race or stage day" : "Rest day") + "</strong><p>" + (K ? A(g.reason) : "No workout is scheduled. Recovery is part of your plan.") + "</p></div></div>" : "";
    u.innerHTML = '<div class="coach-calendar-detail-head"><div><span class="coach-calendar-type">DAY DETAILS</span><h3>' + A(g.title) + '</h3></div><button type="button" class="coach-calendar-close" data-calendar-action="close" aria-label="Close calendar day details">✕</button></div><div class="coach-calendar-detail-grid">' + L + ie + z + "</div>" + (l ? '<p class="coach-move-hint">Select a destination day above. Cycling sessions swap if both days have rides; strength stays put.</p>' : "");
  }
  c("coachCalendarStrip").addEventListener("click", (r) => {
    var w;
    const u = r.target;
    if (!(u instanceof Element)) return;
    const p = u.closest("[data-calendar-index]");
    if (!p) return;
    const g = I[Number(p.dataset.calendarIndex)];
    if (g) {
      if (l && g.key !== l) {
        $(l, g.key);
        return;
      }
      S = S === g.key ? null : g.key, ke(), (w = c("coachCalendarStrip").querySelectorAll("[data-calendar-index]")[Number(p.dataset.calendarIndex)]) == null || w.focus();
    }
  });
  function $(r, u, p = !1) {
    var G;
    if (!p) {
      const ie = I.map((z) => ({
        key: z.key,
        rideId: z.rideId,
        rideMinutes: z.rideMinutes,
        strengthMinutes: z.strengthMinutes,
        completedRide: z.completedRide,
        eventDay: z.reason.startsWith("Event stage ")
      })), K = Ia(ie, r, u);
      if (K.warning) {
        T = { from: r, to: u, suggestedKey: K.suggestedKey };
        const z = c("coachMoveRecoveryWarning");
        z.innerHTML = "<strong>RECOVERY CHECK</strong><p>" + A(K.warning) + "</p>" + (K.suggestedKey ? '<button type="button" data-move-decision="suggested">MOVE TO ' + A(K.suggestedKey) + " INSTEAD</button>" : "") + '<button type="button" data-move-decision="proceed">MOVE ANYWAY</button><button type="button" data-move-decision="cancel">KEEP CURRENT PLAN</button>', z.hidden = !1, z.scrollIntoView({ block: "nearest", behavior: "smooth" }), (G = z.querySelector('[data-move-decision="cancel"]')) == null || G.focus();
        return;
      }
    }
    T = null, c("coachMoveRecoveryWarning").hidden = !0;
    const g = I.find((ie) => ie.key === r), w = I.find((ie) => ie.key === u);
    if (!g || !w || !g.rideId || g.completedRide || w.completedRide || g.reason.startsWith("Event stage ") || w.reason.startsWith("Event stage ")) return;
    const L = Ta(
      f,
      r,
      u,
      { cyclingId: g.rideId, cyclingMinutes: g.rideMinutes },
      { cyclingId: w.rideId, cyclingMinutes: w.rideMinutes }
    );
    if (L !== f) {
      if (!de(Sn, L)) {
        alert("Unable to save this calendar change. Check browser storage.");
        return;
      }
      f = L, l = null, S = u, d = !1, ne();
    }
  }
  const be = document.createElement("section");
  be.id = "coachMoveRecoveryWarning", be.className = "coach-move-recovery-warning", be.setAttribute("role", "alert"), be.setAttribute("aria-label", "Recovery-aware scheduling warning"), be.hidden = !0, c("coachCalendarDetails").after(be), be.addEventListener("click", (r) => {
    var w;
    const u = r.target;
    if (!(u instanceof Element)) return;
    const p = (w = u.closest("[data-move-decision]")) == null ? void 0 : w.dataset.moveDecision;
    if (!p || !T) return;
    const g = T;
    if (p === "cancel") {
      T = null, be.hidden = !0, l = null, ke();
      return;
    }
    if (p === "suggested" && g.suggestedKey) {
      T = null, be.hidden = !0, $(g.from, g.suggestedKey);
      return;
    }
    p === "proceed" && $(g.from, g.to, !0);
  });
  const tt = c("coachCalendarStrip");
  tt.addEventListener("dragstart", (r) => {
    const u = r.target;
    if (!(u instanceof Element)) return;
    const p = u.closest("[data-calendar-index]"), g = I[Number(p == null ? void 0 : p.dataset.calendarIndex)];
    if (!(g != null && g.rideId) || g.completedRide) {
      r.preventDefault();
      return;
    }
    l = g.key, r.dataTransfer && (r.dataTransfer.effectAllowed = "move", r.dataTransfer.setData("text/plain", g.key));
  }), tt.addEventListener("dragover", (r) => {
    r.target instanceof Element && r.target.closest("[data-calendar-index]") && r.preventDefault();
  }), tt.addEventListener("drop", (r) => {
    r.preventDefault();
    const u = r.target;
    if (!(u instanceof Element)) return;
    const p = u.closest("[data-calendar-index]"), g = I[Number(p == null ? void 0 : p.dataset.calendarIndex)];
    g && l && $(l, g.key);
  }), tt.addEventListener("dragend", () => {
    T || (l = null);
  }), c("coachCalendarDetails").addEventListener("click", (r) => {
    var w;
    const u = r.target;
    if (!(u instanceof Element)) return;
    const p = u.closest("[data-calendar-action]");
    if (!p) return;
    if (p.dataset.calendarAction === "close") {
      const L = I.findIndex((G) => G.key === S);
      S = null, ke(), L >= 0 && ((w = c("coachCalendarStrip").querySelectorAll("[data-calendar-index]")[L]) == null || w.focus());
      return;
    }
    const g = I[Number(p.dataset.calendarIndex)];
    if (g) {
      if (p.dataset.calendarAction === "move" && g.rideId) {
        l = l === g.key ? null : g.key, ke();
        return;
      }
      p.dataset.calendarAction === "ride" && g.rideId ? (o = g.rideId, d = !0, s = g.rideMinutes, y = null, S = null, ne(), c("coachRecommendedName").scrollIntoView({ block: "center", behavior: "smooth" })) : p.dataset.calendarAction === "strength" && g.strength && pt(g.strength, g.strengthMinutes);
    }
  });
  function ne() {
    var rn, cn;
    i = kt(n);
    const r = /* @__PURE__ */ new Date(), u = Ne(r);
    u !== m && (m = u, d = !1, s = null, y = null, S = null);
    const p = Oe(), g = Ce(), w = P ? p : p.map((h) => ({ ...h, avgPower: null })), L = At(ee(Rt), u), G = Fn(L), ie = xa(L, Ot(n, r.getTime(), w, g), p.some((h) => h.start >= new Date(r.getFullYear(), r.getMonth(), r.getDate()).getTime() && h.elapsed >= 900));
    c("coachReadinessLabel").textContent = ie.label, c("coachReadinessLabel").setAttribute("data-day-color", ie.color), c("coachReadinessExplanation").textContent = ie.detail + " " + G.detail;
    const K = fe(r), z = K.days.find((h) => h.day === r.getDay()), U = En(u, z, f), Be = un(
      n,
      r,
      w,
      g,
      K.days.map((h) => ({
        day: h.day,
        workoutId: h.day === r.getDay() ? U.cyclingId : h.cyclingId,
        reason: h.day === r.getDay() ? U.reason : h.reason
      }))
    ), bt = Object.prototype.hasOwnProperty.call(f, u), ge = Na(bt && Be.status !== "completed" ? { ...Be, workoutId: U.cyclingId, status: U.cyclingId ? "planned" : "rest", reason: U.reason } : Be, L), Te = Ra({
      now: r,
      week: K.days,
      rides: p,
      feedback: g,
      skipped: x(),
      ftp: n.ftp,
      ftpKnown: P,
      budgetMinutes: K.budgetMinutes,
      today: ge,
      recoveryMinutes: Math.round(X(i.find((h) => h.id === "recovery")) / 60),
      planForDate: (h) => {
        const H = fe(h).days.find((B) => B.day === h.getDay());
        return H ? En(Ne(h), H, f) : void 0;
      },
      event: a.discipline !== "general" && a.date ? { startDate: a.date, stages: a.discipline === "stage-race" ? a.stages : 1 } : void 0
    }), _ = Te.days.find((h) => h.key === u) ?? {
      weekday: r.getDay(),
      originalId: ((rn = K.days.find((h) => h.day === r.getDay())) == null ? void 0 : rn.cyclingId) ?? null,
      workoutId: ge.workoutId,
      minutes: ge.workoutId ? Math.round(X(i.find((h) => h.id === ge.workoutId) || i[0]) / 60) : 0,
      status: ge.status === "recovery" ? "recovery" : ge.workoutId ? "planned" : "rest",
      reason: ge.reason,
      strength: null,
      strengthMinutes: 0
    };
    E = _.minutes;
    const ae = {
      workoutId: _.workoutId,
      status: _.status === "completed" ? "completed" : _.status === "recovery" ? "recovery" : _.status === "rest" || _.status === "skipped" ? "rest" : "planned",
      reason: _.reason
    }, Bn = x().includes(u);
    c("coachSkipToday").textContent = Bn ? "Undo skipped session" : "Skip today's session", I = Sa(r, K.days, i, ae).map((h) => {
      const H = Te.days.find((J) => J.key === h.key);
      if (!H) return h;
      const B = i.find((J) => J.id === H.workoutId);
      return {
        ...h,
        rideId: (B == null ? void 0 : B.id) || null,
        rideName: (B == null ? void 0 : B.name) || null,
        rideDescription: (B == null ? void 0 : B.description) || null,
        rideMinutes: H.minutes,
        strength: H.strength,
        strengthMinutes: H.strengthMinutes,
        completedRide: H.status === "completed",
        reason: H.reason
      };
    }), ke();
    const zt = (h) => {
      var J, Q;
      const H = ((J = i.find((Pe) => Pe.id === h.originalId)) == null ? void 0 : J.name) || (h.originalId ? "Planned ride" : "Rest day"), B = ((Q = i.find((Pe) => Pe.id === h.workoutId)) == null ? void 0 : Q.name) || (h.kind === "completed" ? "Ride recorded" : h.kind === "skipped" ? "Skipped" : h.kind === "missed" ? "Not completed" : h.kind === "event" ? "Race or event day" : "No ride scheduled");
      return "<li><strong>" + A(h.key) + "</strong> · " + A(H) + " (" + h.beforeMinutes + " min) → " + A(B) + " (" + h.afterMinutes + " min)<p>" + A(h.reason) + "</p></li>";
    }, qe = Te.changes.filter((h) => h.key >= u), Xt = c("coachAdaptiveToday");
    Xt.hidden = qe.length === 0, Xt.innerHTML = qe.length ? "<strong>YOUR UPDATED TRAINING WEEK · " + qe.length + " CHANGE" + (qe.length === 1 ? "" : "S") + "</strong><p>Coach accounts for extra rides and recovery without adding make-up sessions.</p><ul>" + qe.map(zt).join("") + "</ul>" : "";
    const wt = Te.changes.filter((h) => h.key <= Te.days[6].key), Zt = c("coachAdaptiveWeek");
    Zt.hidden = wt.length === 0, Zt.innerHTML = wt.length ? "<strong>WHAT CHANGED IN YOUR WEEK</strong><p>Workout adjustments are date-specific. Your strength sessions and chosen rest day stay protected.</p><ul>" + wt.map(zt).join("") + "</ul>" : "", K.days[r.getDay()];
    const St = !!_.strength, Et = (D == null ? void 0 : D.completedToday()) || !1, Me = St && !_.workoutId, $t = Le();
    d || (o = ae.workoutId || "recovery", y = null), i.some((h) => h.id === o) || (o = "recovery", y = null);
    const at = !d && (!ae.workoutId || Me);
    c("coachRestState").hidden = !at, c("coachWorkoutControls").hidden = at, c("coachRecommendedName").textContent = at ? _.status === "event" ? "Race / event day" : Me ? "Strength training day" : ae.status === "completed" ? "Ride already completed" : "Rest day" : re().name, c("coachRecommendationLabel").textContent = d ? "YOUR CHOICE" : _.status === "event" ? "EVENT DAY" : Me ? "STRENGTH DAY" : ae.status === "recovery" ? "RECOVERY ADJUSTMENT" : ae.status === "rest" || ae.status === "completed" ? "REST RECOMMENDED" : "FROM YOUR PLAN", c("coachWhy").textContent = _.status === "event" && !d ? "Your event takes priority. There is no additional prescribed trainer ride today." : Me && !d ? "Your plan includes strength today. No cycling workout is scheduled." : at ? "Coach recommends rest today." : d ? "You chose an optional alternative for today. Coach originally recommended: " + ae.reason : "Why Coach chose this: " + ae.reason;
    const ot = ((cn = K.days.find((h) => h.day === r.getDay())) == null ? void 0 : cn.cyclingId) || null, Jt = !d && ae.status === "recovery" && ot && ot !== ae.workoutId;
    if (c("coachChangeDetail").hidden = !Jt, Jt) {
      const h = i.find((Q) => Q.id === ot), H = i.find((Q) => Q.id === ae.workoutId), B = h ? Math.round(X(h) / 60) : null, J = H ? Math.round(X(H) / 60) : null;
      c("coachChangeDetail").innerHTML = '<strong>WHY TODAY CHANGED</strong><div class="coach-change-pair"><span>ORIGINAL: ' + A((h == null ? void 0 : h.name) || ot) + (B === null ? "" : " · " + B + " min") + "</span><span>RECOMMENDED: " + A((H == null ? void 0 : H.name) || "Recovery spin") + (J === null ? "" : " · " + J + " min") + "</span></div><p>" + A(ae.reason) + "</p><p>See the updated training week for any changes to upcoming sessions. To ride the original workout today, select it under Swap workout.</p>";
    }
    c("coachRestReason").textContent = _.status === "event" ? _.reason : Me ? "Your strength session is ready above. No trainer needed. You can still pick an optional cycling workout." : ae.reason, c("coachUseRecommendation").hidden = !d;
    const Ue = re(), qn = X(Ue);
    c("coachWorkoutInfo").innerHTML = "<div><strong>" + A(Ue.category.toUpperCase()) + "</strong><span>" + Math.round(qn / 60) + " MINUTES · " + Ue.segments.length + " SEGMENTS</span></div><p>" + A(Ue.description) + "</p>" + (P ? "" : "<p><strong>FTP not yet established:</strong> displayed watt values are examples, not individualized targets. Keep the first ride conversational and use guided SIM mode, not ERG.</p>"), c("coachSegments").innerHTML = Ue.segments.map((h, H) => {
      const B = h.low < 0.6 ? "#86b5da" : h.low < 0.8 ? "#63d8bd" : h.low < 1 ? "#f9be70" : "#fb7489", J = Math.max(24, Math.min(100, Math.round(h.high * 80))), Q = ln(n.ftp, h), Pe = h.name + " — " + Q.duration + " duration, " + Q.range + " power range, " + Q.target + " W ERG target (" + Q.ftpRange + ")";
      return '<button type="button" class="coach-segment" data-coach-segment="' + H + '" aria-pressed="false" aria-label="' + A(Pe) + '" title="' + A(Pe) + '" style="flex:' + h.minutes + '"><span class="coach-segment-bar" aria-hidden="true" style="height:' + J + "%;background:" + B + '"></span></button>';
    }).join(""), pe(0), q.value = N;
    const Qt = Xe();
    r.getDay();
    const en = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"], Ge = Ft(a, r);
    c("coachGoalHeadlineLabel").textContent = a.discipline === "general" ? "Balanced cycling fitness" : a.name || ut[a.discipline], c("coachGoalHeadlineMeta").textContent = a.discipline === "general" ? "Build consistency and endurance" : (Ge.phase === "event" ? "Event underway" : Ge.phase === "post-event" ? "Event completed" : Ge.weeksLeft === null ? "Set an event date" : Ge.weeksLeft + " weeks to go") + " · " + Ge.phase.toUpperCase() + " PHASE", c("coachHeaderFtp").textContent = P ? "FTP " + n.ftp + " W" : "FTP NOT SET";
    const tn = !!ee(Ae);
    c("coachFirstRun").hidden = tn, c("coachStartLabel").textContent = tn ? "CONNECT MY TRAINER" : "SET UP MY PLAN TO START", c("coachProfileSummary").innerHTML = "<div><strong>" + (P ? n.ftp + " W" : "Not set") + "</strong><span>FTP</span></div><div><strong>" + n.hours + " h</strong><span>Per week</span></div><div><strong>" + n.days + " days</strong><span>Training days</span></div>";
    const nn = I.slice(1).flatMap((h) => {
      const H = [];
      return h.rideId && h.rideMinutes > 0 && H.push({ key: h.key, weekday: h.date.getDay(), name: h.rideName || "Cycling ride", type: "ride", id: h.rideId, minutes: h.rideMinutes }), h.strength && h.strengthMinutes > 0 && H.push({ key: h.key, weekday: h.date.getDay(), name: "Full Body Strength " + h.strength, type: "strength", id: h.strength, minutes: h.strengthMinutes }), H;
    }).slice(0, 3);
    c("coachNextUp").innerHTML = nn.length ? nn.map(
      (h) => '<button type="button" class="coach-upcoming-item" data-upcoming-key="' + h.key + '" data-upcoming-type="' + h.type + '" data-upcoming-workout="' + A(h.id) + '"><strong>' + en[h.weekday] + "</strong><span>" + A(h.name) + "<small>" + h.minutes + " min · " + (h.type === "ride" ? "Ride" : "Strength") + " · " + h.key + '</small></span><span aria-hidden="true">→</span></button>'
    ).join("") : '<p class="coach-small">No more workouts in your next seven days. Rest or review your plan.</p>', c("coachPlanLibrary").innerHTML = i.map((h) => {
      const H = Math.round(X(h) / 60);
      return '<button type="button" class="coach-library-item" data-library-workout="' + A(h.id) + '"><span><strong>' + A(h.name) + "</strong><small>" + A(h.category) + " · " + H + ' min</small></span><span aria-hidden="true">→</span></button>';
    }).join("");
    const an = I.map((h) => {
      const H = Te.days.find((Q) => Q.key === h.key), B = !!h.rideId && h.rideMinutes > 0, J = B ? i.find((Q) => Q.id === h.rideId) : void 0;
      return {
        key: h.key,
        weekday: h.date.getDay(),
        workoutId: B ? h.rideId : null,
        name: (J == null ? void 0 : J.name) ?? null,
        minutes: B ? h.rideMinutes : 0,
        strength: h.strength,
        strengthMinutes: h.strengthMinutes,
        status: (H == null ? void 0 : H.status) ?? "rest",
        reason: h.reason,
        changed: (H == null ? void 0 : H.changed) ?? !1,
        missingWorkout: B && !J
      };
    }), Un = an.reduce((h, H) => h + H.minutes + H.strengthMinutes, 0);
    c("coachPlanBudget").textContent = "Next 7 days cycling + strength: " + (Un / 60).toFixed(1) + " h · Weekly time goal: " + (K.budgetMinutes / 60).toFixed(1) + " h · " + K.note, c("coachWeek").innerHTML = an.map((h) => {
      const H = h.key < u, B = h.workoutId && h.name && h.minutes > 0 && !H ? '<button type="button" data-day-workout="' + A(h.workoutId) + '" data-day-key="' + h.key + '"><span><strong>🚴 ' + A(h.name) + "</strong><small>" + h.minutes + " min · " + (h.changed ? "Adjusted · " : "") + 'Classic cycling</small></span><span aria-hidden="true">→</span></button>' : h.missingWorkout ? '<span class="coach-day-warning">Workout missing from library — review your setup</span>' : h.status === "completed" ? '<span class="coach-day-rest">✓ Ride recorded</span>' : h.status === "skipped" ? '<span class="coach-day-rest">Skipped by you · not rescheduled</span>' : h.status === "missed" ? '<span class="coach-day-rest">Not completed · not rescheduled</span>' : h.status === "event" ? '<span class="coach-day-event">🏁 Event day · no indoor session scheduled</span>' : "", J = h.strength && !H ? '<button type="button" class="coach-day-strength" data-strength-day="' + h.weekday + '" data-strength-variation="' + h.strength + '"><span><strong>▥ Full Body Strength ' + h.strength + "</strong><small>" + h.strengthMinutes + " min" + (h.key === u ? "" : " · Start today (optional)") + " · " + A(((D == null ? void 0 : D.settings.equipment) || []).filter((Q) => Q !== "bodyweight").join(", ") || "Bodyweight") + '</small></span><span aria-hidden="true">→</span></button>' : h.strength ? '<span class="coach-day-rest">Strength was scheduled</span>' : "";
      return '<div class="coach-day-row ' + (h.key === u ? "coach-week-today" : "") + '"><span class="coach-day-label">' + en[h.weekday] + "<small>" + A(h.key.slice(5)) + '</small></span><div class="coach-day-items">' + (B + J || '<span class="coach-day-rest">Rest day</span>') + (h.changed ? '<small class="coach-adaptive-inline">' + A(h.reason) + "</small>" : "") + "</div></div>";
    }).join("");
    const je = c("coachStrengthToday"), on = c("coachViewToday").querySelector(".coach-today-grid"), sn = c("coachViewToday").querySelector(".coach-today-side");
    if (Me ? on.insertBefore(je, on.firstElementChild) : sn.insertBefore(je, sn.firstElementChild), je.classList.toggle("coach-strength-primary", Me), je.hidden = !St, St) {
      const h = Ht(D.settings, _.strength, $t);
      je.innerHTML = '<div class="coach-section-top"><span class="coach-tag">TODAY · STRENGTH</span><span class="coach-tag">' + (Et ? "COMPLETED" : "NO TRAINER NEEDED") + "</span></div><h3>" + A(h.title) + "</h3><p>" + _.strengthMinutes + " minutes · " + h.exercises.length + " movements · Matched to your available equipment." + ($t ? " Recent fatigue suggests going easy or skipping." : "") + '</p><button type="button" id="coachStartStrength" ' + (Et ? "disabled" : "") + ">" + (Et ? "✓ SESSION LOGGED" : "START STRENGTH WORKOUT →") + "</button>";
    }
    c("coachStrengthHistory").innerHTML = D != null && D.history.length ? '<div class="coach-strength-history">' + D.history.slice(-6).reverse().map((h) => "<div><span><strong>" + A(h.routine) + "</strong><br>" + new Date(h.date).toLocaleDateString() + "</span><small>" + h.completedSets + "/" + h.plannedSets + " sets · " + h.minutes + " min</small></div>").join("") + "</div>" : '<p class="coach-small">Completed strength training sessions will appear here.</p>', c("coachHistory").innerHTML = Qt.length ? Qt.slice(-5).reverse().map((h) => '<div class="coach-history-row"><strong>' + A(h.workout) + "</strong><span>" + new Date(h.date).toLocaleDateString() + " · " + Math.round(h.elapsedSeconds / 60) + " min · " + A(h.mode.toUpperCase()) + "</span></div>").join("") : '<p class="coach-small">Your coached rides will appear here.</p>', c("coachSuggestion").textContent = Me ? "Your strength workout is ready. No smart trainer needed." : D != null && D.settings.enabled ? "Your next workout is ready. Cycling and strength fit within your weekly time." : "Your next workout is ready. Coach considers your schedule and recent riding.", c("coachSwapList").innerHTML = i.filter((h) => h.id !== "preview").map((h) => '<button type="button" data-swap-workout="' + A(h.id) + '"><span><strong>' + A(h.name) + "</strong><small>" + A(h.category) + " · " + Math.round(X(h) / 60) + ' min</small></span><span aria-hidden="true">→</span></button>').join("");
  }
  function qt(r, u) {
    i.some((p) => p.id === r) && (o = r, d = !0, s = null, y = null, c("coachSwapPanel").hidden = !0, c("coachSwapToggle").setAttribute("aria-expanded", "false"), ne(), c("coachAnswer").textContent = u);
  }
  c("coachSkipToday").addEventListener("click", () => {
    const r = Ne(/* @__PURE__ */ new Date()), u = new Set(x());
    if (u.has(r) ? u.delete(r) : u.add(r), !de(R, Array.from(u).slice(-90))) {
      c("coachStatus").textContent = "Could not save the skipped session. Check browser storage.";
      return;
    }
    d = !1, s = null, y = null, ne();
  }), c("coachSwapToggle").addEventListener("click", () => {
    const r = c("coachSwapPanel");
    r.hidden = !r.hidden, c("coachSwapToggle").setAttribute("aria-expanded", String(!r.hidden));
  }), c("coachBrowseOptional").addEventListener("click", () => {
    c("coachSwapPanel").hidden = !1, c("coachSwapToggle").setAttribute("aria-expanded", "true");
  }), c("coachUseRecommendation").addEventListener("click", () => {
    d = !1, s = null, y = null, ne(), c("coachAnswer").textContent = "Back to your Coach recommendation.";
  }), c("coachSwapList").addEventListener("click", (r) => {
    const u = r.target;
    if (!(u instanceof Element)) return;
    const p = u.closest("[data-swap-workout]");
    p != null && p.dataset.swapWorkout && qt(p.dataset.swapWorkout, "Workout swapped for today. Your weekly plan has not changed.");
  }), M.querySelectorAll("[data-coach-question]").forEach((r) => r.addEventListener("click", () => {
    const u = r.dataset.coachQuestion;
    if (u === "tired") qt("recovery", "Easy recovery selected for today. Rest instead if you feel unusually fatigued or unwell.");
    else if (u === "short") {
      const p = re(), g = Math.max(15, Math.min(30, Math.floor(X(p) / 60 * 0.65))), w = Tt(p, g);
      w === p ? c("coachAnswer").textContent = "This workout is already brief. You can swap to Recovery Spin or take a rest day." : (y = w, d = !0, ne(), c("coachAnswer").textContent = "Shorter session prepared. Coach kept the power ranges and reduced interval durations.");
    } else {
      const p = fe(), g = un(n, /* @__PURE__ */ new Date(), Oe(), Ce(), p.days.map((w) => ({ day: w.day, workoutId: w.cyclingId, reason: w.reason })));
      c("coachAnswer").textContent = g.reason + (d ? " You have selected an alternative for today." : "");
    }
  }));
  function pt(r, u) {
    if (D != null && D.settings.enabled) {
      if (e.isRiding()) {
        alert("Finish your active cycling session before starting strength training.");
        return;
      }
      D.open(r, Le(), u);
    }
  }
  c("coachWeek").addEventListener("click", (r) => {
    const u = r.target;
    if (!(u instanceof Element)) return;
    const p = u.closest("[data-strength-variation]");
    if (p) {
      const w = Number(p.dataset.strengthDay), G = fe().days[w];
      G != null && G.strength && pt(G.strength, G.strengthMinutes);
      return;
    }
    const g = u.closest("[data-day-workout]");
    if (g != null && g.dataset.dayWorkout) {
      const w = I.find((L) => L.key === g.dataset.dayKey);
      o = g.dataset.dayWorkout, d = !0, s = (w == null ? void 0 : w.rideMinutes) ?? null, y = null, ne(), j("today");
    }
  }), c("coachStrengthToday").addEventListener("click", (r) => {
    const u = r.target;
    if (!(u instanceof Element) || !u.closest("#coachStartStrength")) return;
    const g = fe().days[(/* @__PURE__ */ new Date()).getDay()];
    g != null && g.strength && pt(g.strength, g.strengthMinutes);
  }), c("coachPlanLibrary").addEventListener("click", (r) => {
    const u = r.target.closest("[data-library-workout]");
    u != null && u.dataset.libraryWorkout && (o = u.dataset.libraryWorkout, d = !0, s = null, y = null, ne(), j("today"));
  }), c("coachNextUp").addEventListener("click", (r) => {
    const u = r.target.closest("[data-upcoming-workout]");
    if (u != null && u.dataset.upcomingWorkout)
      if (u.dataset.upcomingType === "strength")
        j("plan", !0);
      else {
        const p = I.find((g) => g.key === u.dataset.upcomingKey);
        o = u.dataset.upcomingWorkout, d = !0, s = (p == null ? void 0 : p.rideMinutes) ?? null, y = null, ne(), j("today");
      }
  }), q.addEventListener("change", () => {
    N = q.value, !P && N === "structured" && (N = "guided", q.value = "guided", c("coachStatus").textContent = "Set a reliable FTP in My Setup before selecting automatic ERG. Ride by feel is available now.");
  }), c("coachFtpKnown").addEventListener("change", () => {
    const r = c("coachFtpKnown").value === "yes";
    c("coachFtp").disabled = !r, c("coachFtpHelp").textContent = r ? "Enter the FTP from your latest reliable assessment." : "No FTP required for your first demo. Indoor rides will default to guided SIM, not automatic ERG watt targets.";
  });
  function gt(r, u, p) {
    const g = c(r);
    if (!g.value.trim()) return null;
    const w = Number(g.value);
    if (!Number.isInteger(w) || w < u || w > p) throw Error(r + " must be a whole number from " + u + " to " + p + ".");
    return w;
  }
  c("coachSaveCheckin").addEventListener("click", () => {
    try {
      const r = /* @__PURE__ */ new Date(), u = Ne(r), p = {
        date: u,
        feeling: c("coachFeeling").value,
        bodyBattery: gt("coachBattery", 0, 100),
        sleepScore: gt("coachSleep", 0, 100),
        hrvMs: gt("coachHrv", 1, 300)
      }, g = At(p, u);
      if (!g || !de(Rt, g)) throw Error("Could not save check-in. Verify browser storage.");
      c("coachCheckinFeedback").textContent = "Saved for today. Your recommendation has been refreshed.", ne();
    } catch (r) {
      c("coachCheckinFeedback").textContent = r instanceof Error ? r.message : "Invalid check-in.";
    }
  }), c("coachEventDiscipline").addEventListener("change", oe), c("coachEventDate").addEventListener("change", oe), c("coachSaveProfile").addEventListener("click", () => {
    const r = Nt({ discipline: c("coachEventDiscipline").value, name: c("coachEventName").value, date: c("coachEventDate").value, priority: c("coachEventPriority").value, objective: c("coachEventObjective").value, terrain: c("coachEventTerrain").value, distanceKm: c("coachEventDistance").value ? Number(c("coachEventDistance").value) * 1.609344 : "", durationMinutes: c("coachEventDuration").value, elevationM: c("coachEventElevation").value ? Number(c("coachEventElevation").value) * 0.3048 : "", stages: c("coachEventStages").value });
    if (c("coachEventDate").value && !r.date) {
      c("coachSettingsFeedback").textContent = "Please enter a valid event date.";
      return;
    }
    const u = [["coachEventDistance", "event distance"], ["coachEventElevation", "total climbing"], ["coachEventDuration", "estimated riding time"]];
    r.discipline === "stage-race" && u.push(["coachEventStages", "number of stages"]);
    const p = u.find(([w]) => !c(w).checkValidity());
    if (p) {
      const w = c(p[0]);
      c("coachSettingsFeedback").textContent = "Please check " + p[1] + ": " + (w.validationMessage || "enter a valid value") + ".", w.focus();
      return;
    }
    if (!de(Cn, r)) {
      c("coachSettingsFeedback").textContent = "Could not save your event goal. Check browser storage.";
      return;
    }
    a = r;
    const g = xe({
      ftp: Number(c("coachFtp").value),
      hours: Number(c("coachHours").value),
      days: Number(c("coachDays").value),
      restDay: Number(c("coachRestDay").value),
      experience: c("coachExperience").value,
      goal: c("coachGoal").value
    });
    if (!(D != null && D.saveSettings())) {
      c("coachSettingsFeedback").textContent = "Could not save strength equipment. Check your browser storage and try again.";
      return;
    }
    if (n = g, P = c("coachFtpKnown").value === "yes", !de(Ae, n)) {
      c("coachSettingsFeedback").textContent = "Strength equipment saved, but cycling settings could not be stored. Enable browser storage and retry.";
      return;
    }
    if (!de(ze, P)) {
      c("coachSettingsFeedback").textContent = "Could not save FTP status. Check browser storage.";
      return;
    }
    P || (N = "guided"), q.value = N, d = !1, s = null, y = null, le(), ne(), c("coachSettingsFeedback").textContent = "✓ Saved! Your cycling, strength, and weekly plan are updated.", j("today", !0), c("coachAnswer").textContent = "Your plan is saved. Coach has prepared today’s recommendation.";
  });
  function Ut() {
    (k == null ? void 0 : k.control) === "structured" && !V && e.setMode("sim");
  }
  async function mt() {
    const r = c("coachPlatformHistory");
    try {
      Y = await e.getPlatformRides();
      try {
        v = await xn();
      } catch {
        v = [];
      }
      const u = Y.filter((w) => Number.isFinite(w.start) && w.start >= Date.now() - 7 * 864e5 && w.start <= Date.now()), p = u.reduce((w, L) => w + Math.max(0, L.elapsed), 0) / 3600, g = ["classic", "survival", "cyclequest"];
      r.innerHTML = '<p class="coach-small">' + Y.length + " locally saved rides · " + p.toFixed(1) + " hours in the last 7 days. All three riding modes contribute to your training history. Only Classic uses prescribed workouts.</p>" + g.map((w) => '<div class="coach-history-row"><strong>' + { classic: "CLASSIC", survival: "SURVIVAL", cyclequest: "CYCLE QUEST" }[w] + "</strong><span>" + u.filter((L) => L.mode === w).length + " rides · " + (u.filter((L) => L.mode === w).reduce((L, G) => L + G.elapsed, 0) / 3600).toFixed(1) + " hours this week</span></div>").join("") + '<p class="coach-small">Older rides without a mode label count toward total hours. A potential hard-game-day alert uses duration and average power, not a clinical recovery assessment.</p>', ne();
    } catch (u) {
      r.textContent = "Local ride history could not be loaded: " + String(u instanceof Error ? u.message : u);
    }
  }
  function yt() {
    k && k.elapsed > 0 && !V && _t(k, null), Ut(), k = null, V = !1, vt(), O.hidden = !0, Ye();
  }
  F("coachEnd").addEventListener("click", yt), F("coachMinimize").addEventListener("click", () => {
    O.classList.toggle("coach-hud-minimized"), F("coachMinimize").textContent = O.classList.contains("coach-hud-minimized") ? "+" : "−";
  });
  function Gt(r) {
    k && (k.adjusted = Math.round(Math.min(1.25, Math.max(0.7, k.adjusted + r)) * 100) / 100, k.control === "structured" && !V && e.setTarget(De(k.ftp, Ke(k.workout, k.elapsed).segment, k.adjusted)), ft());
  }
  F("coachLighter").addEventListener("click", () => Gt(-0.05)), F("coachHarder").addEventListener("click", () => Gt(0.05));
  function jt(r, u, p, g = !1) {
    if (k || e.isRiding()) {
      c("coachStatus").textContent = "Finish the current ride or coaching session before starting a new one.";
      return;
    }
    const L = Gn().includes(p) ? p : "structured";
    k = { workout: r, mode: u, control: L, ftp: n.ftp, elapsed: 0, adjusted: 1, measured: 0, inRange: 0, sumWatts: 0, countWatts: 0, done: !1, previousIndex: -1 }, ce = "", V = g, Ye(), O.hidden = !1, O.classList.remove("coach-hud-minimized"), F("coachMinimize").textContent = "−", g || (e.setMode(L === "structured" ? "target" : "sim"), L === "structured" && e.setTarget(De(n.ftp, r.segments[0])), e.makeRoute(X(r), L === "structured"), e.launchMode("classic")), ft();
  }
  c("coachStartClassic").addEventListener("click", () => {
    if (!ee(Ae)) {
      j("settings", !0);
      return;
    }
    !P && N === "structured" && (N = "guided", q.value = "guided", c("coachStatus").textContent = "FTP is not set. Starting guided ride-by-feel instead of automatic watt targets."), jt(re(), "classic", N);
  });
  let nt = null;
  const we = document.createElement("div");
  we.id = "coachDemoControls", we.hidden = !0, we.innerHTML = '<label>SIMULATED POWER <input id="coachDemoPower" type="range" min="0" max="450" step="5" value="130"></label><span id="coachDemoWatts">130 W</span><button type="button" id="coachDemoStop">STOP DEMO</button>', O.append(we), nt = we.querySelector("#coachDemoPower"), nt.addEventListener("input", () => {
    b = Number(nt.value), Ze(we, "coachDemoWatts").textContent = b + " W";
  }), Ze(we, "coachDemoStop").addEventListener("click", () => {
    yt(), ve();
  });
  function Kt() {
    const r = kt(n).find((p) => p.id === "preview");
    b = 130, nt.value = "130", jt(r, "classic", N, !0), vt(), we.hidden = !1;
    let u = performance.now();
    ye = window.setInterval(() => {
      const p = performance.now(), g = Math.min(1.5, (p - u) / 1e3);
      u = p, Vt(g, b, 85, !0);
    }, 250);
  }
  c("coachDemo").addEventListener("click", Kt), c("coachFirstRunDemo").addEventListener("click", Kt);
  function vt() {
    ye !== null && window.clearInterval(ye), ye = null, we.hidden = !0;
  }
  function ft(r = null) {
    if (!k) return;
    const u = k.workout, p = Ke(u, k.elapsed), g = p.done || k.done, w = De(k.ftp, p.segment, k.adjusted);
    F("coachHudState").textContent = V ? "SIMULATED DEMO" : g ? "WORKOUT COMPLETE" : k.elapsed === 0 ? "WAITING FOR PEDALS" : k.control === "structured" ? "ERG CONTROL" : k.control === "guided" ? "GUIDED SIM" : "RECORD ONLY", F("coachActual").innerHTML = (r === null ? "—" : String(Math.round(r))) + "<span> W</span>", F("coachTarget").innerHTML = String(w) + "<span> W</span>", F("coachRemaining").textContent = g ? "DONE" : ct(p.remaining), F("coachInterval").textContent = p.segment.name.toUpperCase() + " · " + Math.round(p.segment.low * 100) + "–" + Math.round(p.segment.high * 100) + "% FTP", F("coachSessionClock").textContent = ct(k.elapsed) + " / " + ct(X(u)), F("coachProgressBar").style.width = Math.round(k.elapsed / X(u) * 100) + "%";
    let L = "Connect a trainer, then start pedaling.";
    V ? L = "SIMULATED telemetry only — no physical trainer or ride record." : g ? L = "Workout complete! Finish your ride when ready." : k.elapsed > 0 && r !== null && (L = dn(r, k.ftp, p.segment, k.adjusted) ? "On target. Smooth and controlled." : r < k.ftp * p.segment.low * k.adjusted ? "Below target. Build effort gradually." : "Above target. Ease back to your prescribed effort."), F("coachPrompt").textContent = L;
  }
  function Vt(r, u, p, g) {
    if (!k || k.done || !Number.isFinite(r) || r <= 0 || !g && !V || !V && (!Number.isFinite(p) || p < 10)) return;
    const w = Ke(k.workout, k.elapsed);
    k.previousIndex !== w.index && (k.previousIndex = w.index, k.control === "structured" && !V && e.setTarget(De(k.ftp, w.segment, k.adjusted)));
    const L = Math.min(3, r, X(k.workout) - k.elapsed);
    if (L <= 0) return;
    Number.isFinite(u) && u >= 0 && (k.sumWatts += u * L, k.countWatts += L, k.measured += L, dn(u, k.ftp, w.segment, k.adjusted) && (k.inRange += L)), k.elapsed += L;
    const G = Ke(k.workout, k.elapsed);
    G.index !== w.index && k.control === "structured" && !V && e.setTarget(De(k.ftp, G.segment, k.adjusted)), k.elapsed >= X(k.workout) && (k.done = !0, k.control === "structured" && !V && e.setTarget(Math.max(30, Math.round(k.ftp * 0.45))), V && vt()), (performance.now() - he > 250 || k.done) && (he = performance.now(), ft(u));
  }
  function _t(r, u) {
    const p = Xe(), g = {
      id: (/* @__PURE__ */ new Date()).toISOString() + ":" + r.workout.id,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      workoutId: r.workout.id,
      workout: r.workout.name,
      mode: r.mode,
      control: r.control,
      elapsedSeconds: Math.round(r.elapsed),
      plannedSeconds: X(r.workout),
      measuredSeconds: Math.round(r.measured),
      inRangeSeconds: Math.round(r.inRange),
      averageWatts: r.countWatts ? Math.round(r.sumWatts / r.countWatts) : null,
      rpe: u,
      complete: r.done
    };
    return p.push(g), de(xt, p.slice(-150)), g;
  }
  function Wn() {
    if (!k || V) return null;
    const r = k;
    if (Ut(), k = null, O.hidden = !0, r.elapsed < 5) return null;
    ce = _t(r, null).id;
    const p = document.createElement("section");
    p.className = "coach-finish-review";
    const g = r.measured ? Math.round(r.inRange / r.measured * 100) : null;
    return p.innerHTML = "<h2>BREAKAWAY COACH / SESSION REVIEW</h2><p><strong>" + A(r.workout.name) + "</strong> · " + Math.round(r.elapsed / 60) + " minutes of " + Math.round(X(r.workout) / 60) + " planned</p><p>" + (g === null ? "No coached power adherence available." : "Time in prescribed power range: " + g + "% of measured time.") + '</p><p>How hard did the workout feel? Rate your overall effort.</p><div class="coach-rpe-buttons"><button type="button" data-coach-rpe="2">Easy</button><button type="button" data-coach-rpe="5">Moderate</button><button type="button" data-coach-rpe="8">Hard</button><button type="button" data-coach-rpe="10">Maximal</button></div><p id="coachReviewMessage">Feedback stays in this browser and informs your next suggested week.</p>', p.querySelectorAll("[data-coach-rpe]").forEach((w) => w.addEventListener("click", () => {
      const L = Number(w.dataset.coachRpe), G = Xe(), ie = G.slice().reverse().find((z) => z.id === ce);
      if (!ie) return;
      ie.rpe = L, de(xt, G);
      const K = Ze(p, "coachReviewMessage");
      K.textContent = jn(L), p.querySelectorAll("[data-coach-rpe]").forEach((z) => z.setAttribute("aria-pressed", String(z === w)));
    })), p;
  }
  function Yn() {
    if (!k) return null;
    const r = Ke(k.workout, k.elapsed);
    return { name: k.workout.name, mode: k.mode, control: k.control, remaining: ct(r.remaining), target: De(k.ftp, r.segment, k.adjusted), done: k.done };
  }
  return window.addEventListener("breakaway:history-updated", () => {
    mt();
  }), D = wa(c("coachStrengthSettings"), { finished: () => {
    ne(), j("history");
  } }), Da(c("coachImportRoot")), le(), ne(), ya(c("coachHistoryImport"), { applySuggestion: (r) => {
    n = xe({ ...n, ...r }), de(Ae, n), le(), ne();
  } }), { tick: Vt, finish: Wn, endCoaching: yt, snapshot: Yn, get mode() {
    return (k == null ? void 0 : k.mode) || null;
  }, get active() {
    return !!k;
  } };
}
export {
  Ha as mountCoach
};
