const Ae = "breakaway.coach.profile.v1", Ot = "breakaway.coach.history.v1", $e = { ftp: 200, hours: 5, days: 3, restDay: 6, goal: "fitness", experience: "beginner" };
function Ne(e) {
  const t = e && typeof e == "object" ? e : {}, n = (a, r, o, d) => typeof a == "number" && Number.isFinite(a) ? Math.min(o, Math.max(r, a)) : d;
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
function Tt(e) {
  const t = Ne(e), n = t.experience === "beginner", a = Math.max(20, Math.min(n ? 45 : t.experience === "intermediate" ? 75 : 110, Math.round(t.hours * 60 / t.days) - 15));
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
function Ve(e, t) {
  const n = X(e), a = Math.max(0, Math.min(n, t));
  let r = 0;
  for (let o = 0; o < e.segments.length; o++) {
    const d = e.segments[o], s = r + d.minutes * 60;
    if (a < s || o === e.segments.length - 1)
      return { segment: d, index: o, remaining: Math.max(0, s - a), progress: Math.min(1, Math.max(0, (a - r) / (s - r))), total: n, done: t >= n };
    r = s;
  }
  throw Error("The workout must have at least one interval");
}
function dn(e, t) {
  const n = Math.max(0, Math.round(t.minutes * 60)), a = Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0"), r = Math.round(e * t.low), o = Math.round(e * t.high), d = xe(e, t);
  return {
    duration: a,
    lowWatts: r,
    highWatts: o,
    target: d,
    range: r + "–" + o + " W",
    ftpRange: Math.round(t.low * 100) + "–" + Math.round(t.high * 100) + "% FTP"
  };
}
function xe(e, t, n = 1) {
  const a = (t.low + t.high) / 2;
  return Math.max(30, Math.min(1e3, Math.round(e * a * n)));
}
function un(e, t, n, a = 1) {
  return Number.isFinite(e) && e >= t * n.low * a * 0.95 && e <= t * n.high * a * 1.05;
}
function Vn(e) {
  return ["structured", "guided"];
}
function Rn(e, t = !1) {
  const n = Ne(e), a = n.days === 2 ? [1, 4] : n.days === 3 ? [1, 3, 6] : n.days === 4 ? [1, 2, 4, 6] : n.days === 5 ? [0, 1, 3, 4, 6] : n.days === 6 ? [0, 1, 2, 3, 4, 6] : [0, 1, 2, 3, 4, 5, 6];
  if (n.days < 7 && a.includes(n.restDay)) {
    const o = Array.from({ length: 7 }, (d, s) => s).filter((d) => d !== n.restDay && !a.includes(d)).sort((d, s) => Math.abs(d - n.restDay) - Math.abs(s - n.restDay))[0];
    o !== void 0 && a.splice(a.indexOf(n.restDay), 1, o), a.sort((d, s) => d - s);
  }
  const r = n.experience === "beginner" ? "tempo" : n.goal === "race" ? "vo2" : "sweetspot";
  return Array.from({ length: 7 }, (o, d) => {
    const s = a.indexOf(d);
    if (s < 0) return { day: d, workoutId: null, reason: "Rest or optional easy movement" };
    const m = t ? s === 0 ? "recovery" : "endurance" : s === 0 ? r : s === a.length - 1 ? "endurance" : s % 3 === 0 ? "tempo" : s % 2 === 0 ? "recovery" : "endurance";
    return { day: d, workoutId: m, reason: t ? "Reduced intensity after a difficult session" : "Planned training session" };
  });
}
function Lt(e, t, n = [], a = []) {
  const r = Ne(e), o = n.some((s) => Number.isFinite(s.start) && s.start <= t && t - s.start <= 36 * 36e5 && Number.isFinite(s.elapsed) && s.elapsed >= 1800 && s.avgPower !== null && Number.isFinite(s.avgPower) && s.avgPower >= r.ftp * 0.8), d = a.some((s) => Number.isFinite(s.date) && s.date <= t && t - s.date <= 48 * 36e5 && s.rpe !== null && s.rpe >= 9);
  return { demandingRide: o, veryHardFeedback: d, fatigued: o || d };
}
function hn(e, t, n = [], a = [], r) {
  const o = Ne(e), d = t.getTime(), s = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(), m = (r == null ? void 0 : r.find((l) => l.day === t.getDay())) ?? Rn(o, !1)[t.getDay()], y = n.filter((l) => Number.isFinite(l.start) && l.start <= d && Number.isFinite(l.elapsed) && l.elapsed > 0 && l.start >= d - 7 * 864e5), v = y.some((l) => l.start >= s && l.elapsed >= 900), { demandingRide: S, veryHardFeedback: I } = Lt(o, d, y, a);
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
    reason: r && m.reason ? "Event-based plan: " + m.reason : "Your " + o.days + "-day weekly schedule calls for this session to support " + f[o.goal] + ". The recommendation uses your rider profile and basic scheduling rules."
  };
}
function Mt(e, t = 30) {
  const n = e.segments.reduce((v, S) => v + S.minutes, 0), a = Math.max(12, Math.min(t, n));
  if (n <= a) return e;
  const r = e.segments.length;
  if (r >= a) return e;
  const o = a - r, d = e.segments.map((v) => Math.max(0, v.minutes - 1)), s = d.reduce((v, S) => v + S, 0), m = e.segments.map((v, S) => ({
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
function Kn(e) {
  return e === null ? "Rate how the session felt so future recommendations have more context." : e >= 9 ? "That felt very hard. Consider recovery or rest next; do not stack another demanding workout." : e >= 7 ? "Challenging session completed. Check your fatigue before the next hard effort." : e <= 3 ? "Comfortable effort. Keep building consistency rather than chasing extra intensity." : "Good training. Keep the next session aligned with your weekly plan.";
}
const We = (e) => typeof e == "number" && Number.isFinite(e), tt = (e) => {
  if (e == null || e === "") return null;
  const t = Number(e);
  return We(t) ? t : null;
}, te = (e, t = 1e8) => {
  const n = tt(e);
  return n !== null && n >= 0 && n <= t ? n : null;
}, ue = (e, t = 1e8) => {
  const n = tt(e);
  return n !== null && n > 0 && n <= t ? n : null;
}, gt = (e) => {
  if (e instanceof Date) return Number.isFinite(e.getTime()) ? e.getTime() : null;
  if (typeof e == "number") return Number.isFinite(e) && e > 1e11 ? e : null;
  if (typeof e != "string" || !e.trim()) return null;
  const t = Date.parse(e);
  return Number.isFinite(t) ? t : null;
};
function pn(...e) {
  for (const t of e) {
    const n = tt(t);
    if (n !== null) return n;
  }
  return null;
}
function Yt(e) {
  const t = String(e ?? "").trim().toLowerCase().replace(/[\s_-]/g, "");
  return ["ride", "cycling", "biking", "2", "virtualride", "virtualcycling", "ebikeride", "mountainbikeride", "gravelride", "handcycle", "velomobile", "e-mountainbikeride", "emtbride"].includes(t);
}
function _n(e) {
  return typeof e == "string" && e.trim() ? e.trim().slice(0, 120) : "Cycling activity";
}
function zn(e) {
  const t = ue(e.duration, 604800), n = gt(e.start);
  if (n === null || n < 9466848e5 || n > Date.now() + 864e5 || t === null || t < 60) throw Error("Invalid ride date or duration.");
  if (!["FIT", "TCX", "GPX", "CSV"].includes(e.source)) throw Error("Unknown recording format.");
  const a = te(e.avgPower, 2500), r = te(e.avgHeartRate, 240), o = te(e.avgCadence, 250), d = te(e.best20minWatts, 2e3), s = te(e.distanceMeters, 1e7), m = te(e.elevationMeters, 1e5), y = ue(e.movingSeconds, 7 * 86400);
  return {
    key: e.stravaId ? "strava:" + e.stravaId : "ride:" + Math.round(n / 1e3) + ":" + Math.round(t),
    stravaId: e.stravaId ? String(e.stravaId).slice(0, 30) : null,
    name: _n(e.name),
    start: n,
    duration: Math.round(t),
    movingSeconds: y === null ? null : Math.round(Math.min(t, y)),
    distanceMeters: s,
    elevationMeters: m,
    avgPower: a,
    avgHeartRate: r,
    avgCadence: o,
    best20minWatts: d,
    source: e.source,
    indoor: !!e.indoor
  };
}
function Bt(e, t) {
  return zn({
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
    const a = gt(e[n]);
    if (a !== null) return a;
  }
  return null;
}
function Dn(e) {
  let t = [], n = 0, a = 0, r = 0, o = 0;
  for (let d = 1; d < e.length; d++) {
    const s = e[d - 1], m = e[d], y = (m.t - s.t) / 1e3;
    if (!(!We(y) || y <= 0)) {
      if (y > 10) {
        t = [], n = 0, a = 0, r = 0;
        continue;
      }
      if (!(!We(s.power) || s.power < 0 || s.power > 2e3)) {
        for (t.push({ duration: y, power: s.power }), a += y, r += y * s.power; a > 1200 && n < t.length; ) {
          const v = t[n], S = a - 1200;
          v.duration <= S + 1e-8 ? (a -= v.duration, r -= v.duration * v.power, n++) : (v.duration -= S, a -= S, r -= S * v.power);
        }
        n > 200 && (t = t.slice(n), n = 0), a >= 1199.9 && (o = Math.max(o, r / a));
      }
    }
  }
  return o > 0 ? Math.round(o) : null;
}
function Xn(e, t = "Activity.fit", n, a = null) {
  var Y;
  const r = e.sessions || e.sessionMesgs || (e.session ? [e.session] : []), o = Array.isArray(r) ? r[0] : null;
  if (!o) throw Error("FIT activity has no session.");
  const d = o.sport ?? e.sport ?? ((Y = e.file_id) == null ? void 0 : Y.sport);
  if (!Yt(d)) throw Error("Not a cycling activity.");
  const s = e.records || e.recordMesgs || [], m = Array.isArray(s) ? s : [];
  if (m.length > 16e4) throw Error("FIT activity has too many samples.");
  const y = He(o, "start_time", "startTime") ?? He(e, "start_time", "startTime") ?? (m.length ? He(m[0], "timestamp") : null), v = He(o, "timestamp") ?? (m.length ? He(m[m.length - 1], "timestamp") : null), S = pn(o.total_elapsed_time, o.totalElapsedTime, o.total_timer_time, o.totalTimerTime), I = S && S > 0 ? S : y !== null && v !== null ? (v - y) / 1e3 : 0, f = m.map((A) => ({ t: He(A, "timestamp") ?? NaN, power: pn(A.power, A.watts) ?? NaN })).filter((A) => We(A.t));
  let l = 0, T = 0, E = 0, x = 0, R = 0, N = 0;
  for (const A of m) {
    const k = te(A.power ?? A.watts, 2500);
    k !== null && (l += k, T++);
    const ce = ue(A.heart_rate ?? A.heartRate, 240);
    ce !== null && (E += ce, x++);
    const he = ue(A.cadence, 250);
    he !== null && (R += he, N++);
  }
  const P = String(o.sub_sport ?? o.subSport ?? "").toLowerCase();
  return Bt("FIT", {
    name: n || t,
    start: y ?? 0,
    duration: I,
    stravaId: a,
    indoor: /indoor|virtual|trainer/.test(P),
    movingSeconds: ue(o.total_timer_time ?? o.totalTimerTime, 7 * 86400),
    distanceMeters: te(o.total_distance ?? o.totalDistance, 1e7),
    elevationMeters: te(o.total_ascent ?? o.totalAscent, 1e5),
    avgPower: te(o.avg_power ?? o.avgPower, 2500) ?? (T ? l / T : null),
    avgHeartRate: ue(o.avg_heart_rate ?? o.avgHeartRate, 240) ?? (x ? E / x : null),
    avgCadence: ue(o.avg_cadence ?? o.avgCadence, 250) ?? (N ? R / N : null),
    best20minWatts: Dn(f)
  });
}
const rt = (e, t) => Array.from(e.getElementsByTagNameNS("*", t));
function Ee(e, ...t) {
  var n;
  for (const a of t) {
    const r = e.getElementsByTagNameNS("*", a)[0];
    if ((n = r == null ? void 0 : r.textContent) != null && n.trim()) return r.textContent.trim();
  }
  return null;
}
function Zn(e, ...t) {
  const n = Ee(e, ...t);
  return n ? gt(n) : null;
}
const gn = (e) => e === null ? null : tt(e);
function $n(e, t) {
  if (e.lat === null || e.lon === null || t.lat === null || t.lon === null) return 0;
  const n = Math.PI / 180, a = (t.lat - e.lat) * n, r = (t.lon - e.lon) * n, o = Math.sin(a / 2) ** 2 + Math.cos(e.lat * n) * Math.cos(t.lat * n) * Math.sin(r / 2) ** 2;
  return 12742e3 * Math.asin(Math.min(1, Math.sqrt(o)));
}
function Jn(e, t = "Activity.gpx", n, a = null) {
  var R;
  if (/<!DOCTYPE|<!ENTITY/i.test(e)) throw Error("XML DTD or entity declarations are not supported.");
  const r = new DOMParser().parseFromString(e, "application/xml");
  if (!r.documentElement || rt(r.documentElement, "parsererror").length) throw Error("Invalid activity XML.");
  const o = /\.tcx$/i.test(t), d = rt(r.documentElement, o ? "Trackpoint" : "trkpt");
  if (d.length < 2 || d.length > 16e4) throw Error("Activity needs timestamped ride samples.");
  if (o) {
    const N = rt(r.documentElement, "Activity");
    if (N.length !== 1 || !Yt(N[0].getAttribute("Sport"))) throw Error("Not a single cycling TCX activity.");
  }
  const s = [];
  for (const N of d) {
    const P = Zn(N, o ? "Time" : "time");
    if (P === null) continue;
    const Y = o ? rt(N, "Position")[0] : null;
    s.push({
      t: P,
      hr: ue(Ee(N, "HeartRateBpm", "Value", "hr"), 240),
      power: te(Ee(N, "Watts", "watts", "PowerInWatts", "power"), 2500) ?? NaN,
      cad: ue(Ee(N, "Cadence", "cad", "RunCadence"), 250),
      ele: tt(Ee(N, "AltitudeMeters", "ele")),
      distance: te(Ee(N, "DistanceMeters", "distance"), 1e7),
      lat: gn(o ? Y ? Ee(Y, "LatitudeDegrees") : null : N.getAttribute("lat")),
      lon: gn(o ? Y ? Ee(Y, "LongitudeDegrees") : null : N.getAttribute("lon"))
    });
  }
  if (s.length < 2) throw Error("No timestamped GPS/trackpoint data.");
  s.sort((N, P) => N.t - P.t);
  let m = 0, y = 0;
  for (let N = 1; N < s.length; N++) {
    const P = s[N - 1], Y = s[N], A = Y.distance !== null && P.distance !== null && Y.distance >= P.distance ? Y.distance - P.distance : $n(P, Y);
    A >= 0 && A < 5e3 && (m += A), P.ele !== null && Y.ele !== null && Y.ele > P.ele && Y.ele - P.ele < 200 && (y += Y.ele - P.ele);
  }
  const v = (s[s.length - 1].t - s[0].t) / 1e3;
  let S = 0, I = 0, f = 0, l = 0, T = 0, E = 0;
  for (const N of s)
    We(N.power) && (S += N.power, I++), N.hr !== null && (f += N.hr, l++), N.cad !== null && (T += N.cad, E++);
  const x = Ee(r.documentElement, "name");
  return Bt(o ? "TCX" : "GPX", {
    name: n || x || t,
    start: s[0].t,
    duration: v,
    stravaId: a,
    distanceMeters: m || ((R = s.at(-1)) == null ? void 0 : R.distance) || null,
    elevationMeters: y || null,
    movingSeconds: null,
    avgPower: I ? S / I : null,
    avgHeartRate: l ? f / l : null,
    avgCadence: E ? T / E : null,
    best20minWatts: Dn(s.filter((N) => We(N.power)).map((N) => ({ t: N.t, power: N.power })))
  });
}
function Qn(e, t = 1e5) {
  var d;
  if (e.length > 32 * 1024 * 1024) throw Error("CSV index is too large.");
  const n = [];
  let a = [], r = "", o = !1;
  for (let s = 0; s < e.length; s++) {
    const m = e[s];
    if (m === '"')
      o && e[s + 1] === '"' ? (r += '"', s++) : o = !o;
    else if (m === "," && !o)
      a.push(r), r = "";
    else if ((m === `
` || m === "\r") && !o) {
      if (m === "\r" && e[s + 1] === `
` && s++, a.push(r), r = "", a.some((y) => y.trim()) && n.push(a), a = [], n.length > t) throw Error("Too many activities in CSV.");
    } else r += m;
  }
  if (o) throw Error("Unclosed quoted field in CSV.");
  return a.push(r), a.some((s) => s.trim()) && n.push(a), (d = n[0]) != null && d[0] && (n[0][0] = n[0][0].replace(/^\uFEFF/, "")), n;
}
function ea(e) {
  const t = Qn(e), n = (t.shift() || []).map((o) => o.toLowerCase().replace(/\s/g, "").replace(/[^a-z0-9]/g, "")), a = (o, ...d) => {
    for (const s of d) {
      const m = n.indexOf(s);
      if (m >= 0) return o[m] || "";
    }
    return "";
  }, r = [];
  for (const o of t) {
    if (!Yt(a(o, "activitytype", "type", "sporttype"))) continue;
    const d = gt(a(o, "activitydate", "startdate", "startdatetime"));
    if (d === null) continue;
    const s = ue(a(o, "elapsedtime", "movingtime"), 7 * 86400);
    if (s !== null)
      try {
        const m = a(o, "activityid") || null, y = a(o, "filename") || null, v = Bt("CSV", {
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
        r.push({ ride: v, file: y });
      } catch {
      }
  }
  return r;
}
function ta(e, t) {
  if (e.stravaId && t.stravaId && e.stravaId === t.stravaId) return !0;
  const n = Math.min(300, Math.max(90, Math.min(e.duration, t.duration) * 0.07));
  return Math.abs(e.start - t.start) > 12e4 || Math.abs(e.duration - t.duration) > n ? !1 : e.distanceMeters !== null && t.distanceMeters !== null ? Math.abs(e.distanceMeters - t.distanceMeters) <= Math.max(500, Math.min(e.distanceMeters, t.distanceMeters) * 0.08) : !0;
}
const mn = (e) => ({ FIT: 4, TCX: 3, GPX: 2, CSV: 1 })[e];
function na(e, t) {
  const n = (d) => [d.avgPower, d.best20minWatts, d.avgHeartRate, d.avgCadence, d.distanceMeters, d.elevationMeters].filter((s) => s !== null).length, a = n(t) > n(e) || n(t) === n(e) && mn(t.source) > mn(e.source), r = a ? t : e, o = a ? e : t;
  return {
    ...r,
    key: e.key,
    stravaId: e.stravaId ?? t.stravaId,
    name: e.source === "CSV" && e.name !== "Ride" ? e.name : r.name,
    avgPower: r.avgPower ?? o.avgPower,
    avgHeartRate: r.avgHeartRate ?? o.avgHeartRate,
    avgCadence: r.avgCadence ?? o.avgCadence,
    best20minWatts: r.best20minWatts ?? o.best20minWatts,
    distanceMeters: r.distanceMeters ?? o.distanceMeters,
    elevationMeters: r.elevationMeters ?? o.elevationMeters,
    movingSeconds: r.movingSeconds ?? o.movingSeconds
  };
}
function An(e, t) {
  const n = [...e];
  let a = 0, r = 0, o = 0;
  for (const d of t) {
    const s = n.findIndex((m) => ta(m, d));
    if (s >= 0) {
      o++;
      const m = na(n[s], d);
      JSON.stringify(m) !== JSON.stringify(n[s]) && (n[s] = m, r++);
    } else
      n.push(d), a++;
  }
  return n.sort((d, s) => s.start - d.start), { rides: n, added: a, updated: r, duplicates: o };
}
function aa(e, t = Date.now()) {
  var d;
  const n = Array.from({ length: 8 }, (s, m) => {
    const y = new Date(t);
    return y.setHours(0, 0, 0, 0), y.setDate(y.getDate() - y.getDay() - (7 - m) * 7), { start: y.getTime(), hours: 0, rides: 0 };
  });
  for (const s of e) for (const m of n) if (s.start >= m.start && s.start < m.start + 6048e5) {
    m.hours += s.duration / 3600, m.rides++;
    break;
  }
  const a = n.reduce((s, m) => s + m.hours, 0) / 8, r = e.filter((s) => s.start <= t && s.start > t - 56 * 864e5), o = e.filter((s) => s.start > t - 120 * 864e5 && s.start <= t).reduce((s, m) => m.best20minWatts !== null && (s === null || m.best20minWatts > s) ? m.best20minWatts : s, null);
  return {
    total: e.length,
    recent: r.length,
    weeklyHours: Math.round(a * 10) / 10,
    weeks: n,
    suggestedFtp: o !== null && o > 100 ? Math.round(o * 0.95) : null,
    powerRides: e.filter((s) => s.avgPower !== null).length,
    latest: ((d = e[0]) == null ? void 0 : d.start) ?? null,
    allHours: Math.round(e.reduce((s, m) => s + m.duration / 3600, 0))
  };
}
const oa = "breakaway.account.owner.v1";
let sa = "";
function ia(e) {
  let t = sa;
  try {
    t || (t = localStorage.getItem(oa) || "");
  } catch {
  }
  return t ? e + "-" + t : e;
}
const ra = "breakaway-coach-training-history-v1", Ce = "rides", ca = 1, xn = 600 * 1024 * 1024, Fe = 32 * 1024 * 1024, yn = 32 * 1024 * 1024, Pt = 1e4, Ht = new TextDecoder("utf-8", { fatal: !1 });
function qt() {
  return new Promise((e, t) => {
    if (!("indexedDB" in window)) {
      t(Error("This browser does not support local history storage."));
      return;
    }
    const n = indexedDB.open(ia(ra), ca);
    n.onupgradeneeded = () => {
      n.result.objectStoreNames.contains(Ce) || n.result.createObjectStore(Ce, { keyPath: "key" });
    }, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error || Error("Could not open local history database."));
  });
}
async function Nn() {
  const e = await qt();
  try {
    return await new Promise((t, n) => {
      const a = e.transaction(Ce, "readonly"), r = a.objectStore(Ce).getAll();
      r.onsuccess = () => t(r.result.sort((o, d) => d.start - o.start)), r.onerror = () => n(r.error || Error("Could not read history."));
    });
  } finally {
    e.close();
  }
}
async function la(e) {
  if (e.length > 15e3) throw Error("Local activity limit reached. Contact support before importing more rides.");
  const t = await qt();
  try {
    return await new Promise((n, a) => {
      const r = t.transaction(Ce, "readwrite"), o = r.objectStore(Ce);
      o.clear();
      for (const d of e) o.put(d);
      r.oncomplete = () => n(), r.onerror = () => a(r.error || Error("Could not save imported activities.")), r.onabort = () => a(r.error || Error("Activity import was rolled back."));
    });
  } finally {
    t.close();
  }
}
async function da() {
  const e = await qt();
  try {
    return await new Promise((t, n) => {
      const a = e.transaction(Ce, "readwrite");
      a.objectStore(Ce).clear(), a.oncomplete = () => t(), a.onerror = () => n(a.error || Error("Unable to clear history."));
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
function ua(e) {
  if (e.byteLength > xn) throw Error("This archive exceeds the 600 MB preview limit. Import smaller batches of FIT, TCX, or GPX files.");
  const t = new DataView(e.buffer, e.byteOffset, e.byteLength);
  let n = -1;
  for (let m = e.length - 22; m >= Math.max(0, e.length - 22 - 65535); m--)
    if (Se(t, m) === 101010256 && m + 22 + me(t, m + 20) <= e.length) {
      n = m;
      break;
    }
  if (n < 0) throw Error("Not a valid ZIP archive or its directory is missing.");
  const a = me(t, n + 10), r = Se(t, n + 12), o = Se(t, n + 16);
  if (a === 65535 || o === 4294967295 || r === 4294967295 || me(t, n + 4) !== 0) throw Error("Multi-disk or ZIP64 archives are not supported in this preview.");
  if (a > Pt || o + r > e.length) throw Error("ZIP directory exceeds safe limits.");
  const d = [];
  let s = o;
  for (let m = 0; m < a; m++) {
    if (Se(t, s) !== 33639248) throw Error("Invalid ZIP directory entry.");
    const y = me(t, s + 8), v = me(t, s + 10), S = Se(t, s + 16), I = Se(t, s + 20), f = Se(t, s + 24), l = me(t, s + 28), T = me(t, s + 30), E = me(t, s + 32), x = Se(t, s + 42), R = s + 46 + l + T + E;
    if (R > e.length) throw Error("Truncated ZIP entry.");
    const N = Ht.decode(e.subarray(s + 46, s + 46 + l));
    if (s = R, x === 4294967295) continue;
    if (Se(t, x) !== 67324752) throw Error("Invalid ZIP member offset.");
    const P = x + 30 + me(t, x + 26) + me(t, x + 28);
    if (P + I > e.length) throw Error("Truncated ZIP member data.");
    d.push({ name: N, compressed: I, expanded: f, method: v, crc: S, start: P, encrypted: !!(y & 1) });
  }
  return d;
}
const ha = (() => {
  const e = new Uint32Array(256);
  for (let t = 0; t < 256; t++) {
    let n = t;
    for (let a = 0; a < 8; a++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
    e[t] = n >>> 0;
  }
  return e;
})();
function pa(e) {
  let t = 4294967295;
  for (const n of e) t = ha[(t ^ n) & 255] ^ t >>> 8;
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
  const r = a.getReader(), o = [];
  let d = 0;
  try {
    for (; ; ) {
      const { value: y, done: v } = await r.read();
      if (v) break;
      if (y) {
        if (d += y.byteLength, d > n)
          throw await r.cancel(), Error("Decompressed activity exceeds the safe file size limit.");
        o.push(y);
      }
    }
  } finally {
    r.releaseLock();
  }
  const s = new Uint8Array(d);
  let m = 0;
  for (const y of o)
    s.set(y, m), m += y.length;
  return s;
}
async function vn(e, t) {
  if (t.encrypted) throw Error("Encrypted archive entries are unsupported.");
  if (t.expanded > Fe) throw Error("Activity is larger than the 32 MB per-file limit.");
  if (t.method !== 0 && t.method !== 8) throw Error("Unsupported ZIP compression method: " + t.method);
  const n = e.subarray(t.start, t.start + t.compressed), a = t.method === 0 ? new Uint8Array(n) : await On(n, "deflate-raw", Fe);
  if (a.length !== t.expanded || pa(a) !== t.crc) throw Error("ZIP member failed integrity verification.");
  return a;
}
const fn = (e) => /\.(fit|tcx|gpx)(\.gz)?$/i.test(e), bn = (e) => /(^|\/)activities\.csv$/i.test(e), Ke = (e) => e.trim().replace(/\\/g, "/").replace(/^\.?\//, "").toLowerCase(), ga = () => new Promise((e) => setTimeout(e, 0));
async function ma(e, t) {
  return /\.gz$/i.test(e) ? On(t, "gzip", Fe) : t;
}
async function ya(e, t = () => {
}) {
  if (!e.length) throw Error("Choose an activity archive or individual ride files.");
  if (e.length > Pt) throw Error("Select fewer than 10,000 files at a time.");
  const n = [], a = [];
  let r = 0;
  for (const l of e)
    if (/\.zip$/i.test(l.name)) {
      if (r++, l.size > xn) throw Error("This ZIP archive exceeds the 600 MB preview limit.");
      const T = new Uint8Array(await l.arrayBuffer());
      for (const E of ua(T)) {
        const x = Ke(E.name);
        bn(x) && E.expanded <= yn ? a.push({ name: E.name, bytes: () => vn(T, E) }) : fn(x) && /(^|\/)activities\//i.test(x) && E.expanded <= Fe && n.push({ name: E.name, bytes: () => vn(T, E) });
      }
    } else bn(l.name) && l.size <= yn ? a.push({ name: l.name, bytes: async () => new Uint8Array(await l.arrayBuffer()) }) : fn(l.name) && l.size <= Fe && n.push({ name: l.name, bytes: async () => new Uint8Array(await l.arrayBuffer()) });
  if (!n.length && !a.length) throw Error("No supported cycling recordings or activities.csv were found.");
  if (n.length > Pt) throw Error("There are too many activity files in this archive.");
  const o = [], d = [];
  let s = 0, m = 0, y = 0;
  for (const l of a)
    try {
      o.push(...ea(Ht.decode(await l.bytes())));
    } catch (T) {
      d.push("activities.csv: " + String(T instanceof Error ? T.message : T));
    }
  const v = /* @__PURE__ */ new Map();
  for (const l of o) l.file && (v.set(Ke(l.file), l), v.set(Ke(l.file).split("/").pop() || "", l));
  const S = [], I = n.length;
  t({ done: y, total: I, current: "Reading activity files", accepted: 0, skipped: s });
  for (const l of n) {
    try {
      const T = await ma(l.name, await l.bytes());
      if (T.byteLength > Fe) throw Error("Activity exceeds 32 MB.");
      const E = v.get(Ke(l.name)) || v.get(Ke(l.name).split("/").pop() || ""), x = l.name.replace(/^.*\//, "").replace(/\.(fit|gpx|tcx)(\.gz)?$/i, "");
      let R;
      if (/\.fit(\.gz)?$/i.test(l.name)) {
        const N = "/coach-fit-decoder.js", { decodeFIT: P } = await import(
          /* @vite-ignore */
          N
        );
        R = Xn(await P(T), x, E == null ? void 0 : E.ride.name, (E == null ? void 0 : E.ride.stravaId) ?? null);
      } else R = Jn(Ht.decode(T), x.replace(/\.gz$/i, ""), E == null ? void 0 : E.ride.name, (E == null ? void 0 : E.ride.stravaId) ?? null);
      S.push(R), m++;
    } catch (T) {
      s++, d.length < 15 && d.push(l.name.slice(-80) + ": " + String(T instanceof Error ? T.message : T));
    }
    y++, (y % 5 === 0 || y === I) && (t({ done: y, total: I, current: l.name.slice(-70), accepted: m, skipped: s }), await ga());
  }
  return { rides: An([], S.concat(o.map((l) => l.ride))).rides, read: m, skipped: s, errors: d, csvRides: o.length, archives: r };
}
const va = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, D = (e) => e.replace(/[&<>"']/g, (t) => va[t]), ee = (e) => {
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
}, ke = (e) => [e.getFullYear(), String(e.getMonth() + 1).padStart(2, "0"), String(e.getDate()).padStart(2, "0")].join("-"), Qe = (e) => {
  if (typeof e != "string") return "";
  const t = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(e);
  if (!t) return "";
  const n = Number(t[1]), a = Number(t[2]), r = Number(t[3]), o = new Date(n, a - 1, r);
  return o.getFullYear() !== n || o.getMonth() + 1 !== a || o.getDate() !== r ? "" : [t[1], String(a).padStart(2, "0"), String(r).padStart(2, "0")].join("-");
};
function fa(e, t) {
  let n = [], a = null, r = !1;
  e.innerHTML = '<div class="coach-section-top"><span class="coach-tag">05 / RIDER HISTORY</span><span class="coach-tag">YOUR FILES · YOUR DEVICE</span></div><h2>BRING YOUR HISTORY.</h2><p class="coach-small">Import your Strava account export or original cycling recordings. No Strava account connection, API, or server upload.</p><div class="coach-history-import-zone" id="coachImportZone" tabindex="0" role="group" aria-label="Choose a Strava archive or ride files"><div class="coach-upload-icon">⇧</div><strong>DROP A STRAVA ZIP OR RIDE FILES HERE</strong><span>ZIP · activities.csv · FIT · TCX · GPX · FIT.GZ · TCX.GZ · GPX.GZ</span><label for="coachImportFiles" class="coach-upload-button">CHOOSE FILES</label><input id="coachImportFiles" type="file" multiple accept=".zip,.csv,.fit,.tcx,.gpx,.gz" hidden></div><div class="coach-import-stage" id="coachImportStage" aria-live="polite"></div><div id="coachHistoryStats"><p class="coach-small">Loading saved activities…</p></div><p class="coach-small coach-history-privacy">The browser reads activity files locally. Only summarized ride metrics are saved in this browser’s IndexedDB; GPS tracks and original files are not retained. Imported history is not uploaded, synced or used by a hosted AI model.</p><div class="coach-history-footer"><button type="button" id="coachHistoryClear">CLEAR IMPORTED HISTORY</button><a href="https://support.strava.com/en-us/articles/15401919-how-do-i-export-my-strava-data" rel="noopener noreferrer" target="_blank">How to export from Strava ↗</a></div>';
  const o = (l) => e.querySelector("#" + l), d = o("coachImportFiles"), s = o("coachImportStage"), m = o("coachImportZone"), y = o("coachHistoryClear");
  function v() {
    var E, x;
    const l = aa(n), T = l.weeks.map((R, N) => ({ hours: R.hours, week: new Date(R.start).toLocaleDateString(void 0, { month: "short", day: "numeric" }), height: Math.max(2, Math.round(R.hours / Math.max(1, ...l.weeks.map((P) => P.hours)) * 100)), index: N }));
    o("coachHistoryStats").innerHTML = '<div class="coach-history-stats"><div><strong>' + l.total.toLocaleString() + "</strong><span>Historical rides</span></div><div><strong>" + l.weeklyHours.toFixed(1) + " h</strong><span>Avg / week · last 8 weeks</span></div><div><strong>" + l.powerRides.toLocaleString() + '</strong><span>Rides with power</span></div></div><div class="coach-history-bars" role="img" aria-label="Training hours in the last eight calendar weeks">' + T.map((R) => '<div class="coach-history-bar-wrap"><span>' + R.hours.toFixed(1) + 'h</span><div class="coach-history-bar-track"><div style="height:' + R.height + '%"></div></div><small>' + D(R.week) + "</small></div>").join("") + '</div><div class="coach-history-insights"><div><strong>RECENT TRAINING VOLUME</strong><p>' + l.weeklyHours.toFixed(1) + " hours per week on average over the past eight calendar weeks.</p></div><div><strong>POWER HISTORY</strong><p>" + (l.suggestedFtp === null ? "Not enough recent 20-minute recorded power for an FTP estimate." : "Candidate FTP ~" + l.suggestedFtp + " W, calculated as 95% of the best recorded 20-minute power in the last 120 days. Confirm with an FTP test.") + "</p></div></div>" + (l.total ? '<div class="coach-history-suggestions">' + (l.weeklyHours >= 1 ? '<button id="coachUseHours" type="button">USE ' + Math.min(20, Math.max(1, Math.round(l.weeklyHours * 2) / 2)) + " H/WEEK</button>" : "") + (l.suggestedFtp !== null ? '<button id="coachUseFtp" type="button">REVIEW FTP ' + l.suggestedFtp + " W</button>" : "") + "</div>" : "") + (l.total ? '<div class="coach-history-latest"><strong>LATEST IMPORTS</strong>' + n.slice(0, 5).map((R) => "<div><span>" + D(new Date(R.start).toLocaleDateString()) + " · " + D(R.name) + "</span><small>" + D(R.source) + " · " + Math.round(R.duration / 60) + " min</small></div>").join("") + "</div>" : '<p class="coach-small">No imported rides yet. Upload your Strava archive to see fitness history here.</p>'), (E = o("coachUseHours")) == null || E.addEventListener("click", () => {
      l.weeklyHours < 1 || (t.applySuggestion({ hours: Math.min(20, Math.max(1, Math.round(l.weeklyHours * 2) / 2)) }), s.textContent = "Weekly training hours updated in your Coach profile. You can edit them anytime.");
    }), (x = o("coachUseFtp")) == null || x.addEventListener("click", () => {
      l.suggestedFtp !== null && confirm("Apply the historical FTP estimate of " + l.suggestedFtp + " W to Coach? This is not a substitute for an FTP test.") && (t.applySuggestion({ ftp: l.suggestedFtp }), s.textContent = "FTP updated in Coach. Verify your training zones with a recent test.");
    });
  }
  async function S() {
    try {
      n = await Nn(), v();
    } catch (l) {
      o("coachHistoryStats").textContent = "Could not open local history: " + String(l instanceof Error ? l.message : l);
    }
  }
  function I(l) {
    const T = An(n, l.rides), E = T.added, x = T.updated;
    s.innerHTML = '<div class="coach-import-result"><strong>READY TO SAVE · ' + E + " NEW RIDES</strong><p>" + l.read + " recordings parsed · " + l.csvRides + " CSV cycling rows · " + l.skipped + " files skipped · " + x + " existing rides enhanced · " + T.duplicates + " duplicates matched.</p>" + (l.errors.length ? "<details><summary>Import warnings (" + l.errors.length + " shown)</summary><ul>" + l.errors.map((R) => "<li>" + D(R) + "</li>").join("") + "</ul></details>" : "") + '<div class="coach-import-actions"><button type="button" id="coachConfirmImport">SAVE HISTORY TO THIS DEVICE</button><button type="button" id="coachCancelImport">CANCEL</button></div></div>', a = T.rides, o("coachConfirmImport").addEventListener("click", async () => {
      if (!a || r) return;
      r = !0;
      const R = a, N = o("coachConfirmImport");
      N.disabled = !0;
      try {
        await la(R), n = R, a = null, s.textContent = "Saved " + E + " new rides and enhanced " + x + " activities on this device.", v(), window.dispatchEvent(new Event("breakaway:history-updated"));
      } catch (P) {
        s.textContent = "Save failed (nothing was changed): " + String(P instanceof Error ? P.message : P);
      } finally {
        r = !1;
      }
    }), o("coachCancelImport").addEventListener("click", () => {
      a = null, s.textContent = "Import canceled. Your saved history was not changed.";
    });
  }
  async function f(l) {
    if (!(r || !l.length)) {
      r = !0, a = null, y.disabled = !0, m.setAttribute("aria-busy", "true"), s.textContent = "Reading activity files locally…";
      try {
        const T = await ya(l, (E) => {
          s.textContent = "Reading " + E.done + " / " + E.total + " files · " + E.accepted + " cycling recordings · " + E.skipped + " skipped";
        });
        T.rides.length ? I(T) : s.textContent = "No valid cycling rides were found. " + (T.errors[0] || "Try a Strava archive or individual activity recordings.");
      } catch (T) {
        s.textContent = "Import could not finish: " + String(T instanceof Error ? T.message : T);
      } finally {
        r = !1, y.disabled = !1, m.removeAttribute("aria-busy"), d.value = "";
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
    if (!r && confirm("Delete all historical rides imported into Breakaway Coach on this device? Your original Strava files are not affected.")) {
      r = !0, y.disabled = !0;
      try {
        await da(), a = null, n = [], s.textContent = "Imported history deleted from this device.", v(), window.dispatchEvent(new Event("breakaway:history-updated"));
      } catch (l) {
        s.textContent = "Delete failed: " + String(l instanceof Error ? l.message : l);
      } finally {
        r = !1, y.disabled = !1;
      }
    }
  }), S(), { reload: S };
}
const wn = "breakaway.coach.strength.settings.v1", Sn = "breakaway.coach.strength.history.v1", Ln = { enabled: !1, equipment: ["bodyweight"], experience: "beginner", sessions: 1, minutes: 30, notes: "" }, Pn = [
  { id: "bodyweight", label: "Bodyweight", detail: "Floor space only" },
  { id: "dumbbells", label: "Dumbbells", detail: "Fixed or adjustable" },
  { id: "kettlebells", label: "Kettlebells", detail: "Single or paired" },
  { id: "bands", label: "Resistance bands", detail: "Light to heavy" },
  { id: "barbell", label: "Squat rack + barbell", detail: "With plates" },
  { id: "bench", label: "Weight bench", detail: "Flat or adjustable" },
  { id: "pullup", label: "Pull-up bar", detail: "Safe, securely mounted" }
];
function et(e) {
  const t = e && typeof e == "object" ? e : {}, n = Array.isArray(t.equipment) ? t.equipment.filter((r) => Pn.some((o) => o.id === r)) : [], a = Array.from(/* @__PURE__ */ new Set(["bodyweight", ...n]));
  return {
    enabled: t.enabled === !0,
    equipment: a,
    experience: ["beginner", "intermediate", "advanced"].includes(String(t.experience)) ? t.experience : "beginner",
    sessions: t.sessions === 2 ? 2 : 1,
    minutes: [20, 30, 45].includes(Number(t.minutes)) ? Number(t.minutes) : 30,
    notes: typeof t.notes == "string" ? t.notes.slice(0, 150) : ""
  };
}
const ba = [
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
function ht(e, t) {
  const n = new Set(et(e).equipment);
  return ba.filter((a) => (!t || a.pattern === t) && a.equipment.every((r) => n.has(r)));
}
const wa = (e, t, n) => {
  const a = ht(e, t);
  return n.map((r) => a.find((o) => o.id === r)).find(Boolean) || a[0];
};
function Ft(e, t = "A", n = !1) {
  const a = et(e), r = a.experience === "beginner", o = n ? 1 : r ? 2 : 3, d = ["Squat", "Hinge", "Push", "Pull", "Core"], s = {
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
      const y = wa(a, m, s[m]);
      return {
        ...y,
        sets: m === "Core" ? Math.max(1, o - 1) : o,
        restSeconds: n ? 45 : r ? 60 : 90,
        alternatives: ht(a, m).filter((v) => v.id !== y.id).map((v) => v.id)
      };
    })
  };
}
function Sa(e, t, n, a) {
  const r = et(t), o = Math.round(Math.max(60, e.hours * 60)), d = n.map((f) => ({
    day: f.day,
    cyclingId: f.workoutId,
    cyclingMinutes: f.workoutId ? a(f.workoutId) : 0,
    strength: null,
    strengthMinutes: 0,
    reason: f.reason
  }));
  if (!r.enabled) {
    let f = d.reduce((E, x) => E + x.cyclingMinutes, 0);
    if (f <= o) return { days: d, budgetMinutes: o, plannedMinutes: f, note: "Strength training is turned off." };
    const l = (E) => E.cyclingId === "recovery" ? 0 : E.cyclingId === "endurance" ? 1 : E.cyclingId === "tempo" ? 2 : 3, T = [...d].filter((E) => E.cyclingId).sort((E, x) => l(E) - l(x));
    for (const E of T) {
      if (f <= o) break;
      const x = Math.min(Math.max(0, E.cyclingMinutes - 15), f - o);
      E.cyclingMinutes -= x, f -= x;
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
    if (m.length >= r.sessions) break;
    m.some((l) => Math.abs(l.day - f.day) === 1) || m.push(f);
  }
  let y = 0;
  for (const f of m)
    f.strength = y ? "B" : "A", f.strengthMinutes = r.minutes, y++;
  let v = d.reduce((f, l) => f + l.cyclingMinutes + l.strengthMinutes, 0);
  if (v > o) {
    const f = [...d].filter((l) => l.cyclingId).sort((l, T) => {
      const E = (x) => x.cyclingId === "recovery" ? 0 : x.cyclingId === "endurance" ? 1 : x.cyclingId === "tempo" ? 2 : 3;
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
  return { days: d, budgetMinutes: o, plannedMinutes: S, note: I ? r.sessions > I ? "Limited time or available training days reduced strength frequency." : "Strength sessions are included in your total weekly time budget." : "Not enough available time or separate training days for strength. Consider increasing your weekly training time or lowering other sessions." };
}
function Ea(e, t) {
  let n = et(ee(wn) || Ln);
  const a = ee(Sn);
  let r = Array.isArray(a) ? a.filter((b) => b && typeof b.routine == "string" && Array.isArray(b.sets)).slice(-150) : [], o = !1, d = "A", s = !1, m = 0, y = "", v = 30, S = [], I = Ft(n, "A", !1);
  const f = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Map();
  let T = null, E = 0, x = null;
  const R = document.createElement("section");
  R.className = "coach-strength-overlay", R.id = "coachStrengthOverlay", R.hidden = !0, R.setAttribute("role", "dialog"), R.setAttribute("aria-modal", "true"), R.setAttribute("aria-label", "Guided strength session"), document.body.append(R);
  function N() {
    e.innerHTML = '<div class="coach-section-top"><span class="coach-tag">STRENGTH TRAINING</span><span class="coach-tag">OPTIONAL · LOCAL ONLY</span></div><h3>Train with what you own.</h3><p class="coach-small">Set your available equipment. Strength sessions share your weekly training time budget.</p><label class="coach-strength-toggle"><input id="strengthEnabled" type="checkbox" ' + (n.enabled ? "checked" : "") + '><span>Include strength in my training plan</span></label><span class="coach-label">AVAILABLE EQUIPMENT</span><div class="coach-equipment-grid">' + Pn.map((b) => '<label class="coach-gear-choice"><input type="checkbox" data-gear="' + b.id + '" ' + (n.equipment.includes(b.id) ? "checked" : "") + " " + (b.id === "bodyweight" ? "disabled" : "") + "><span><strong>" + D(b.label) + "</strong><small>" + D(b.detail) + "</small></span></label>").join("") + '</div><div class="coach-strength-fields"><label>EXPERIENCE<select id="strengthExperience"><option value="beginner">New to lifting</option><option value="intermediate">Some experience</option><option value="advanced">Experienced</option></select></label><label>SESSIONS / WEEK<select id="strengthSessions"><option value="1">1 session</option><option value="2">2 sessions</option></select></label><label>TIME / SESSION<select id="strengthMinutes"><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option></select></label><label>AVAILABLE WEIGHTS (OPTIONAL)<input type="text" id="strengthWeights" maxlength="150" placeholder="e.g. 25 lb DB, 35 lb KB"></label></div><p id="strengthSaved" class="coach-small" role="status">Your strength setup is saved with your cycling settings using Save My Plan.</p>', e.querySelector("#strengthExperience").value = n.experience, e.querySelector("#strengthSessions").value = String(n.sessions), e.querySelector("#strengthMinutes").value = String(n.minutes), e.querySelector("#strengthWeights").value = n.notes;
  }
  function P() {
    const b = Array.from(e.querySelectorAll("[data-gear]")).filter((M) => M.checked).map((M) => M.dataset.gear), C = et({
      enabled: e.querySelector("#strengthEnabled").checked,
      equipment: b,
      experience: e.querySelector("#strengthExperience").value,
      sessions: Number(e.querySelector("#strengthSessions").value),
      minutes: Number(e.querySelector("#strengthMinutes").value),
      notes: e.querySelector("#strengthWeights").value
    });
    return de(wn, C) ? (n = C, N(), e.querySelector("#strengthSaved").textContent = "Equipment settings saved.", !0) : (e.querySelector("#strengthSaved").textContent = "Local storage unavailable. Nothing saved.", !1);
  }
  function Y() {
    T !== null && window.clearInterval(T), T = null, E = 0;
  }
  function A(b) {
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
    if (R.innerHTML = '<div class="coach-strength-session"><header class="coach-strength-session-head"><div><span>BREAKAWAY COACH / STRENGTH</span><h2>' + D(I.title) + "</h2><p>" + v + " min planned · " + f.size + " / " + C + ' sets logged</p></div><button type="button" id="strengthExit">← BACK TO COACH</button></header><div class="coach-strength-session-note">' + D(I.note) + ' Warm up for 5 minutes. Stop or modify anything painful; use a load you can control.</div><div class="coach-strength-progress"><div style="width:' + Math.round(100 * f.size / Math.max(C, 1)) + '%"></div></div><div class="coach-strength-rest"><span id="strengthRestLabel">Rest as needed between sets.</span><button type="button" id="strengthRestStart">START 60s REST</button></div><div class="coach-strength-list">' + S.map((M, O) => {
      const c = ht(n, M.pattern);
      return '<section class="coach-strength-exercise"><div class="coach-strength-exercise-header"><div><small>' + (O + 1) + " / " + S.length + " · " + D(M.pattern.toUpperCase()) + "</small><h3>" + D(M.name) + '</h3></div><label>SWAP EXERCISE<select data-strength-sub="' + O + '">' + c.map((F) => '<option value="' + F.id + '" ' + (F.id === M.id ? "selected" : "") + ">" + D(F.name) + "</option>").join("") + "</select></label></div><p>" + D(M.instructions) + '</p><p class="coach-strength-dose">' + M.sets + " sets · " + D(M.reps) + " · Rest " + M.restSeconds + "s · " + D(M.loadHint) + '</p><div class="coach-strength-sets">' + Array.from({ length: M.sets }, (F, q) => {
        const Z = k(O, q);
        return '<div class="coach-strength-set"><span>SET ' + (q + 1) + '</span><input aria-label="Repetitions: set ' + (q + 1) + " " + D(M.name) + '" data-reps="' + Z + '" maxlength="30" placeholder="' + D(M.reps) + '"><input aria-label="Weight: set ' + (q + 1) + " " + D(M.name) + '" data-load="' + Z + '" maxlength="32" placeholder="Load (lb / kg / BW)"><button type="button" aria-pressed="' + f.has(Z) + '" data-check="' + Z + '">' + (f.has(Z) ? "✓ DONE" : "MARK DONE") + "</button></div>";
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
    const c = ht(n, O.pattern).find((F) => F.id === C.value);
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
      K();
      return;
    }
    const M = C.closest("[data-check]");
    if (M) {
      const c = M.dataset.check;
      if (f.has(c) ? f.delete(c) : f.add(c), f.has(c)) {
        const F = Number(c.split(":")[0]);
        A(((O = S[F]) == null ? void 0 : O.restSeconds) || 60);
      }
      ce();
      return;
    }
    if (C.closest("#strengthRestStart")) {
      A(60);
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
    }, M = r.concat(C).slice(-150);
    if (!de(Sn, M)) {
      R.querySelector("#strengthSessionError").textContent = "Could not save. Check local browser storage.";
      return;
    }
    r = M, K(), t.finished();
  }
  function K() {
    Y(), o = !1, R.hidden = !0, x == null || x.focus(), x = null;
  }
  function ye(b = "A", C = !1, M) {
    var O;
    return n.enabled ? (d = b, v = Math.min(n.minutes, Math.max(15, M || n.minutes)), s = C || v < 20, I = Ft(n, d, s), S = I.exercises, v < n.minutes && (S = S.map((c) => ({ ...c, sets: Math.max(1, Math.min(c.sets, v < 25 ? 1 : 2)) }))), x = document.activeElement instanceof HTMLElement ? document.activeElement : null, o = !0, f.clear(), l.clear(), y = "", m = Date.now(), Y(), R.hidden = !1, ce(), R.scrollTop = 0, (O = R.querySelector("#strengthExit")) == null || O.focus(), !0) : !1;
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
  }), N(), {
    get settings() {
      return n;
    },
    get history() {
      return r;
    },
    open: ye,
    close: K,
    renderSettings: N,
    saveSettings: P,
    get active() {
      return o;
    },
    completedToday() {
      return r.some((b) => ke(new Date(b.date)) === ke(/* @__PURE__ */ new Date()));
    }
  };
}
function ka(e, t, n, a) {
  const r = [];
  for (let o = 0; o < 7; o++) {
    const d = new Date(e.getFullYear(), e.getMonth(), e.getDate() + o), s = t.find((T) => T.day === d.getDay()), m = o === 0 && a.status === "completed";
    let y = s != null && s.cyclingId && s.cyclingMinutes > 0 ? s.cyclingId : null;
    o === 0 && (m || a.status === "rest" || !y ? y = null : a.workoutId && (y = a.workoutId));
    const v = n.find((T) => T.id === y), S = (s == null ? void 0 : s.cyclingId) === y ? s.cyclingMinutes : 0, I = v ? Math.max(0, S || Math.round(v.segments.reduce((T, E) => T + E.minutes, 0))) : 0, f = o === 0 ? "Today" : new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d), l = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
    r.push({
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
  return r;
}
const ct = "breakaway.coach.moved-workouts.v1", Hn = (e, t) => Object.prototype.hasOwnProperty.call(e, t);
function Fn(e) {
  const t = {};
  if (!e || typeof e != "object" || Array.isArray(e)) return t;
  for (const [n, a] of Object.entries(e).slice(-365)) {
    if (Qe(n) !== n || !a || typeof a != "object") continue;
    const r = a;
    r.cyclingId !== null && (typeof r.cyclingId != "string" || !/^[a-z0-9_-]{1,80}$/i.test(r.cyclingId)) || typeof r.cyclingMinutes != "number" || !Number.isInteger(r.cyclingMinutes) || r.cyclingMinutes < 0 || r.cyclingMinutes > 1440 || r.cyclingId === null == (r.cyclingMinutes === 0) && (t[n] = { cyclingId: r.cyclingId, cyclingMinutes: r.cyclingMinutes });
  }
  return t;
}
function En(e, t, n) {
  return Hn(n, e) ? { ...t, ...n[e], reason: "Manually rescheduled by you. " + t.reason } : t;
}
function Ta(e, t, n, a, r) {
  return t === n || Qe(t) !== t || Qe(n) !== n || !a.cyclingId || a.cyclingMinutes <= 0 ? e : {
    ...e,
    [t]: { cyclingId: r.cyclingId, cyclingMinutes: r.cyclingMinutes },
    [n]: { cyclingId: a.cyclingId, cyclingMinutes: a.cyclingMinutes }
  };
}
function Ma(e, t, n) {
  if (Qe(t) !== t) return e;
  const a = Fn({ [t]: n });
  return Hn(a, t) ? { ...e, [t]: a[t] } : e;
}
const Ia = /* @__PURE__ */ new Set(["tempo", "sweetspot", "vo2"]), Je = (e) => !!e.rideId && (Ia.has(e.rideId) || e.rideMinutes >= 120 && e.rideId !== "recovery"), kn = (e) => {
  const [t, n, a] = e.split("-").map(Number);
  return Date.UTC(t, n - 1, a) / 864e5;
};
function It(e) {
  const t = [...e].sort((a, r) => a.key.localeCompare(r.key)), n = /* @__PURE__ */ new Set();
  for (let a = 1; a < t.length; a++) {
    const r = t[a - 1], o = t[a];
    kn(o.key) - kn(r.key) === 1 && Je(r) && Je(o) && n.add(r.key + "|" + o.key);
  }
  return n;
}
const Tn = (e, t, n) => {
  const a = e.find((o) => o.key === t), r = e.find((o) => o.key === n);
  return e.map((o) => o.key === t ? { ...o, rideId: r.rideId, rideMinutes: r.rideMinutes } : o.key === n ? { ...o, rideId: a.rideId, rideMinutes: a.rideMinutes } : o);
};
function Ca(e, t, n) {
  const a = e.find((S) => S.key === t), r = e.find((S) => S.key === n);
  if (!a || !r || !a.rideId || t === n) return { warning: null, suggestedKey: null };
  const o = It(e), d = Tn(e, t, n), s = [...It(d)].filter((S) => !o.has(S)), m = d.filter((S) => [t, n].includes(S.key) && Je(S) && S.strengthMinutes >= 30 && !e.some((I) => I.key === S.key && Je(I) && I.strengthMinutes >= 30));
  if (!s.length && !m.length) return { warning: null, suggestedKey: null };
  const y = [
    s.length ? "This change creates demanding rides on consecutive days (" + s.map((S) => S.split("|").join(" and ")).join("; ") + ")." : "",
    m.length ? "It also places a demanding ride on a strength-training day." : ""
  ].filter(Boolean).join(" "), v = e.filter((S) => S.key !== t && S.key !== n && !S.rideId && !S.completedRide && !S.eventDay && S.key >= t).find((S) => {
    const I = Tn(e, t, S.key);
    return [...It(I)].every((f) => o.has(f)) && !I.some((f) => f.key === S.key && Je(f) && f.strengthMinutes >= 30);
  });
  return {
    warning: y + " Consider an easier day between demanding efforts when possible. You can keep your selected move if needed.",
    suggestedKey: (v == null ? void 0 : v.key) || null
  };
}
const Wn = 864e5;
function _e(e) {
  return [e.getFullYear(), String(e.getMonth() + 1).padStart(2, "0"), String(e.getDate()).padStart(2, "0")].join("-");
}
const Ra = (e, t) => Number.isFinite(e.start) && e.start <= t && e.start >= t - 14 * Wn && Number.isFinite(e.elapsed) && e.elapsed >= 900;
function Ct(e) {
  return Math.max(0, Math.round(e.elapsed / 60));
}
function Da(e) {
  var ce, he, K, ye;
  const { now: t, week: n, today: a, ftp: r, ftpKnown: o } = e, d = _e(t), s = t.getTime(), m = new Set(e.skipped), y = e.rides.filter((b) => Ra(b, s)), v = new Date(t.getFullYear(), t.getMonth(), t.getDate() - t.getDay()), S = [];
  for (let b = 0; b < 14; b++) {
    const C = new Date(v.getFullYear(), v.getMonth(), v.getDate() + b), M = _e(C), O = C.getDay(), c = ((ce = e.planForDate) == null ? void 0 : ce.call(e, C)) ?? n.find((se) => se.day === O), F = (he = e.event) != null && he.startDate && /^\d{4}-\d{2}-\d{2}$/.test(e.event.startDate) ? /* @__PURE__ */ new Date(e.event.startDate + "T12:00:00") : null, q = F ? Math.round((new Date(C.getFullYear(), C.getMonth(), C.getDate(), 12).getTime() - F.getTime()) / Wn) : -1, Z = q >= 0 && q < Math.max(1, ((K = e.event) == null ? void 0 : K.stages) || 1) ? q + 1 : 0, j = c != null && c.cyclingId && c.cyclingMinutes > 0 ? c.cyclingId : null, ve = j ? c.cyclingMinutes : 0, Ye = C.getTime(), fe = y.filter((se) => _e(new Date(se.start)) === M), Oe = fe.reduce((se, De) => se + Ct(De), 0), Re = Ye < new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(), Le = M === d;
    let oe = j, le = ve, re = j ? "planned" : "rest", pe = (c == null ? void 0 : c.reason) || "Recovery day";
    if ((Re || Le) && fe.length)
      oe = null, le = 0, re = "completed", pe = "A ride was recorded on this date. Coach does not prescribe a duplicate session.";
    else if (Z)
      oe = null, le = 0, re = "event", pe = "Event stage " + Z + " of " + Math.max(1, ((ye = e.event) == null ? void 0 : ye.stages) || 1) + ". No additional indoor workout is prescribed. Follow your event pacing and fueling plan.";
    else if ((Re || Le) && m.has(M))
      oe = null, le = 0, re = "skipped", pe = "You skipped this session. Coach will not stack it onto a later day.";
    else if (Re)
      oe = null, le = 0, re = j ? "missed" : "rest", pe = j ? "This scheduled ride was not recorded and has not been rescheduled." : "Scheduled rest day.";
    else if (Le)
      oe = a.workoutId, re = a.status === "completed" ? "completed" : oe ? a.status === "recovery" ? "recovery" : "planned" : "rest", le = oe ? oe === "recovery" && j !== "recovery" ? Math.min(ve || e.recoveryMinutes, e.recoveryMinutes) : ve : 0, pe = a.reason;
    else if (j) {
      const se = new Date(C.getFullYear(), C.getMonth(), C.getDate(), 9).getTime(), De = y.some(($) => $.start < se && se - $.start <= 36 * 36e5 && (Ct($) >= 120 || o && $.avgPower !== null && Number.isFinite($.avgPower) && $.elapsed >= 1800 && $.avgPower >= r * 0.8)), Te = e.feedback.some(($) => Number.isFinite($.date) && $.date < se && se - $.date <= 48 * 36e5 && $.rpe !== null && $.rpe >= 9);
      (De || Te) && j !== "recovery" && (oe = "recovery", le = Math.min(ve, e.recoveryMinutes), re = "recovery", pe = Te ? "Very hard recent workout feedback prompted a recovery spin instead of the planned workout." : "A demanding or long ride was recorded before this session. Coach replaced it with easier recovery riding.");
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
  const f = S.filter((b) => b.date.getTime() <= s && b.date.getTime() >= v.getTime()).filter((b) => y.some((C) => _e(new Date(C.start)) === b.key)), l = f.reduce((b, C) => b + y.filter((M) => _e(new Date(M.start)) === C.key).reduce((M, O) => M + Ct(O), 0), 0), T = f.reduce((b, C) => b + C.originalMinutes, 0), E = Math.max(0, l - T), x = S.slice(0, 7).reduce((b, C) => b + C.originalMinutes + C.strengthMinutes, 0), R = Math.max(0, e.budgetMinutes - x), N = S.slice(0, 7).filter((b) => b.status === "recovery" && b.date.getTime() >= new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()).reduce((b, C) => b + Math.max(0, C.originalMinutes - C.minutes), 0);
  let P = Math.max(0, E - R - N);
  const Y = new Date(v.getFullYear(), v.getMonth(), v.getDate() + 7).getTime(), A = S.filter((b) => b.date.getTime() >= new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime() && b.date.getTime() < Y && b.workoutId && b.status !== "completed" && b.status !== "skipped").sort((b, C) => {
    const M = (O) => O.workoutId === "recovery" ? 0 : O.workoutId === "endurance" ? 1 : 2;
    return M(b) - M(C) || b.date.getTime() - C.date.getTime();
  });
  for (const b of A) {
    if (P <= 0) break;
    const C = Math.max(0, b.minutes - 15), M = Math.min(C, P);
    M <= 0 || (b.minutes -= M, P -= M, b.minutes !== b.originalMinutes && (b.status = b.status === "recovery" ? "recovery" : "shortened", b.changed = !0, b.reason += " Additional riding exceeded your remaining weekly time by " + (E - R - N) + " minutes, so Coach shortened this session by " + M + " minutes. Strength and rest days stay unchanged."));
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
  const a = e.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr|h)\b/i), r = e.match(/\b(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)\b/i), o = (a ? Number(a[1]) * 60 : 0) + (r ? Number(r[1]) : 0);
  return o > 0 ? Math.round(o) : null;
};
function Mn(e) {
  const t = e.trim().slice(0, 3e3), n = Aa(t), a = /\b(steady|base|endurance|easy aerobic|consistent|continuous)\b/i.test(t), r = t.match(/\b(?:heart[\s-]*rate|hr)?\s*(?:between|from)\s*(\d{2,3})\s*(?:and|to|[-–—])\s*(\d{2,3})\s*(?:bpm)?\b/i), o = t.match(/\b(?:heart[\s-]*rate|hr)?\s*(\d{2,3})\s*(?:-|–|—|to)\s*(\d{2,3})\s*bpm\b/i), d = t.match(/\b(\d{2,4})\s*(?:-|–|—|to)\s*(\d{2,4})\s*(?:w|watts)\b/i), s = r || o;
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
const Rt = "Ride for 2 hours at a steady pace. Keep heart rate between 103 and 114 bpm.", In = "breakaway.coach.imported-workouts.v1", lt = (e) => e === null ? "—" : Math.floor(e / 60) + ":" + String(e % 60).padStart(2, "0") + ":00";
function xa(e) {
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
  const t = (y) => e.querySelector("#" + y), n = t("ciDescription"), a = t("ciImage"), r = t("ciImagePreview");
  let o = null, d = Mn(Rt);
  n.value = Rt;
  const s = (y) => {
    for (const v of ["Text", "Image", "File"])
      t("ciTab" + v).setAttribute("aria-selected", String(v === y)), t("ciPanel" + v).hidden = v !== y;
  };
  t("ciTabText").addEventListener("click", () => s("Text")), t("ciTabImage").addEventListener("click", () => s("Image")), t("ciTabFile").addEventListener("click", () => s("File")), t("ciBackToText").addEventListener("click", () => s("Text")), t("ciExample").addEventListener("click", () => {
    n.value = Rt, m();
  });
  function m() {
    d = Mn(n.value);
    const y = d.target, v = (y == null ? void 0 : y.kind) === "heart-rate", S = (y == null ? void 0 : y.kind) === "power", I = v ? y.minBpm + "–" + y.maxBpm : S ? y.lowWatts + "–" + y.highWatts : "—", f = v ? "BPM" : S ? "WATTS" : "MISSING";
    t("ciTitle").textContent = d.title, t("ciSubtitle").textContent = d.pace === "steady" ? "One continuous steady cycling interval" : "One continuous cycling interval", t("ciDuration").textContent = lt(d.durationMinutes), t("ciTarget").textContent = I, t("ciTargetUnit").textContent = "TARGET " + f, t("ciTimelineTarget").textContent = I + " " + f, t("ciTimelineType").textContent = v ? "Heart-rate target" : S ? "Power target" : "Intensity not specified", t("ciTimelineMinutes").textContent = d.durationMinutes !== null ? d.durationMinutes + " MIN" : "TIME MISSING", t("ciTimelineMiddle").textContent = d.durationMinutes !== null ? lt(Math.floor(d.durationMinutes / 2)) : "—", t("ciTimelineEnd").textContent = lt(d.durationMinutes), t("ciTrainerMode").textContent = v ? "SIM / manual resistance" : S ? "Power guidance / ERG optional" : "Intensity not specified", t("ciStructure").textContent = "One " + (d.pace === "steady" ? "steady " : "") + "block", t("ciWarnings").innerHTML = d.warnings.map((l) => "<li>" + D(l) + "</li>").join(""), t("ciStatus").textContent = d.ready ? "READY TO REVIEW" : "NEEDS DETAILS", t("ciStatus").classList.toggle("is-incomplete", !d.ready), t("ciSave").disabled = !d.ready, t("ciTimeline").setAttribute("aria-label", "Continuous cycling workout lasting " + lt(d.durationMinutes) + " with target " + I + " " + f), t("ciSaveStatus").textContent = "";
  }
  n.addEventListener("input", m), a.addEventListener("change", () => {
    var v;
    const y = (v = a.files) == null ? void 0 : v[0];
    if (o && (URL.revokeObjectURL(o), o = null), r.hidden = !0, r.removeAttribute("src"), !y) {
      t("ciImageStatus").textContent = "No file selected";
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(y.type) || y.size > 8 * 1024 * 1024) {
      t("ciImageStatus").textContent = "Please select a JPG, PNG or WebP under 8 MB.";
      return;
    }
    o = URL.createObjectURL(y), r.src = o, r.hidden = !1, t("ciImageStatus").textContent = y.name + " · image preview only";
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
const Dt = "breakaway.coach.morning.v1", ze = "breakaway.coach.ftp-known.v1", dt = (e, t, n) => typeof e == "number" && Number.isFinite(e) && Number.isInteger(e) && e >= t && e <= n ? e : null;
function At(e, t) {
  if (!e || typeof e != "object") return null;
  const n = e, a = typeof n.date == "string" ? /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(n.date) : null;
  if ((a ? [a[1], a[2].padStart(2, "0"), a[3].padStart(2, "0")].join("-") : null) !== t || !["tired", "okay", "great"].includes(String(n.feeling))) return null;
  for (const [o, d, s] of [["bodyBattery", 0, 100], ["sleepScore", 0, 100], ["hrvMs", 1, 300]])
    if (n[o] !== null && n[o] !== void 0 && dt(n[o], d, s) === null) return null;
  return {
    date: t,
    feeling: n.feeling,
    bodyBattery: dt(n.bodyBattery, 0, 100),
    sleepScore: dt(n.sleepScore, 0, 100),
    hrvMs: dt(n.hrvMs, 1, 300)
  };
}
function Yn(e) {
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
  return !Yn(t).suggestEasy || e.status !== "planned" || !e.workoutId || e.workoutId === "recovery" ? e : { workoutId: "recovery", status: "recovery", reason: "You reported feeling tired during your morning check-in. Coach suggests an easier recovery spin instead of your planned session. This is a training suggestion, not a medical assessment." };
}
function Oa(e, t, n = !1) {
  return n ? { color: "green", label: "Training complete", detail: "You have already ridden today. No additional prescribed workout is needed." } : !e && !t.demandingRide && !t.veryHardFeedback ? { color: "neutral", label: "Check-in optional", detail: "Coach has no reported fatigue today, but no check-in or personal recovery baseline is available. Follow the plan if you feel well, and adjust as needed." } : (e == null ? void 0 : e.feeling) === "tired" && (t.demandingRide || t.veryHardFeedback) ? { color: "red", label: "Recovery recommended", detail: "You reported fatigue and recent training was demanding. Coach recommends rest or gentle recovery rather than another hard effort." } : (e == null ? void 0 : e.feeling) === "tired" || t.demandingRide || t.veryHardFeedback ? { color: "yellow", label: "Take it easy", detail: (e == null ? void 0 : e.feeling) === "tired" ? "You reported fatigue. Coach suggests a lighter session based on your check-in." : "Recent demanding training suggests a lighter session. Coach uses recorded effort, not Garmin score cutoffs." } : { color: "green", label: "Follow your plan", detail: (e == null ? void 0 : e.feeling) === "great" ? "You feel good today. Follow your planned session without adding extra intensity." : "No fatigue flag was found in available inputs. Missing Garmin data does not mean you are fully recovered." };
}
const Cn = "breakaway.coach.event-goal.v1", La = { discipline: "general", name: "", date: "", distanceKm: null, elevationM: null, durationMinutes: null, stages: 1, priority: "A", objective: "finish", terrain: "road" }, pt = { general: "General cycling fitness", criterium: "Criterium", road: "Road race", tt: "Time trial", xco: "Mountain bike XCO / short track", xcm: "Mountain bike marathon", gravel: "Gravel race", cyclocross: "Cyclocross", "gran-fondo": "Gran Fondo / century", ultra: "Ultra-endurance", "stage-race": "Multi-day stage race" }, xt = (e, t) => e === "" || e === null || e === void 0 ? null : Number.isFinite(Number(e)) && Number(e) > 0 && Number(e) <= t ? Number(e) : null;
function Nt(e) {
  const t = e && typeof e == "object" ? e : {}, n = Object.hasOwn(pt, String(t.discipline)) ? t.discipline : "general", a = typeof t.date == "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && !Number.isNaN((/* @__PURE__ */ new Date(t.date + "T12:00:00")).getTime()) && (/* @__PURE__ */ new Date(t.date + "T12:00:00")).toISOString().slice(0, 10) === t.date ? t.date : "";
  return {
    discipline: n,
    name: typeof t.name == "string" ? t.name.trim().slice(0, 100) : "",
    date: a,
    distanceKm: xt(t.distanceKm, 5e3),
    elevationM: xt(t.elevationM, 1e5),
    durationMinutes: xt(t.durationMinutes, 3e4),
    stages: n === "stage-race" ? Math.max(2, Math.min(30, Math.round(Number(t.stages) || 2))) : 1,
    priority: ["A", "B", "C"].includes(String(t.priority)) ? t.priority : "A",
    objective: t.objective === "perform" ? "perform" : "finish",
    terrain: ["road", "gravel", "trail", "mixed"].includes(String(t.terrain)) ? t.terrain : "road"
  };
}
function Wt(e, t) {
  if (!e.date || e.discipline === "general") return { phase: "foundation", weeksLeft: null, description: "Build consistency, comfortable endurance and repeatable training habits." };
  const n = /* @__PURE__ */ new Date(e.date + "T12:00:00"), a = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12), r = Math.round((n.getTime() - a.getTime()) / 864e5), o = e.discipline === "stage-race" ? Math.max(2, e.stages) : 1, d = Math.max(0, Math.ceil(r / 7)), s = r < -(o - 1) ? "post-event" : r <= 0 ? "event" : r <= 7 ? "taper" : r <= 28 ? "specific" : r <= 70 ? "build" : "base";
  return { phase: s, weeksLeft: d, description: { base: "Build a sustainable aerobic foundation before race-specific sessions.", build: "Develop the power and endurance needed for your event.", specific: "Practice efforts that resemble your event while managing fatigue.", taper: "Reduce accumulated fatigue; preserve fitness and arrive ready.", event: "Event day: follow your pacing, fueling and safety plan.", "post-event": "Recover after the event before setting a new primary goal." }[s] };
}
function Pa(e, t, n) {
  const { phase: a } = Wt(t, n), o = [...e.days === 2 ? [1, 4] : e.days === 3 ? [1, 3, 6] : e.days === 4 ? [1, 2, 4, 6] : e.days === 5 ? [0, 1, 3, 4, 6] : [0, 1, 2, 3, 4, 6]];
  if (o.includes(e.restDay)) {
    const I = Array.from({ length: 7 }, (f, l) => l).find((f) => f !== e.restDay && !o.includes(f));
    I !== void 0 && o.splice(o.indexOf(e.restDay), 1, I);
  }
  o.sort((I, f) => I - f);
  const d = ["criterium", "xco", "cyclocross"].includes(t.discipline), s = ["ultra", "stage-race", "xcm", "gravel", "gran-fondo"].includes(t.discipline), m = d ? "vo2" : s ? "tempo" : t.discipline === "tt" ? "sweetspot" : "tempo", y = e.experience === "beginner" ? "tempo" : m, v = a === "build" || a === "specific", S = a === "taper" || a === "post-event" || a === "event";
  return Array.from({ length: 7 }, (I, f) => {
    const l = o.indexOf(f);
    if (l < 0) return { day: f, workoutId: null, reason: "Scheduled recovery day" };
    const T = S ? l === 0 ? "recovery" : "endurance" : l === o.length - 1 ? "endurance" : l === 0 ? v ? y : "endurance" : l === 2 && v && d && e.experience === "advanced" ? "tempo" : l % 2 === 0 ? "recovery" : "endurance", E = a === "foundation" ? "General development" : pt[t.discipline] + " · " + a;
    return { day: f, workoutId: T, reason: E + " preparation. " + (S ? "Keep the session easy and avoid chasing workload." : v ? "Match the event demands while maintaining recovery." : "Build consistent aerobic training.") };
  });
}
function Xe() {
  const e = ee(Ot);
  return Array.isArray(e) ? e.filter((t) => t && typeof t.workout == "string" && typeof t.date == "string").slice(-150) : [];
}
const ut = (e) => {
  const t = Math.max(0, Math.ceil(e));
  return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
}, Ze = (e, t) => e.querySelector("#" + t);
function Fa(e) {
  let n = Ne(ee(Ae) || $e), a = Nt(ee(Cn) || La), r = Tt(n), o = "endurance", d = !1, s = null, m = "", y = null, v = [], S = null, I = [], f = Fn(ee(ct)), l = null, T = null, E = null, x = "structured";
  const R = "breakaway.coach.skipped-days.v1";
  function N() {
    const i = ee(R);
    return Array.isArray(i) ? [...new Set(i.map(Qe).filter(Boolean))].slice(-90) : [];
  }
  let P = ee(ze) === !0 || ee(ze) === null && !!ee(Ae), Y = [], A = null, k = null, ce = "", he = 0, K = !1, ye = null, b = 130;
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
          <p>Select a replacement to save it for today. Your other training days stay unchanged.</p>
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
          <label>EVENT OR GOAL TYPE<select id="coachEventDiscipline">${Object.entries(pt).map(([i, u]) => '<option value="' + i + '">' + u + "</option>").join("")}</select></label>
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
  const c = (i) => Ze(M, i), F = (i) => Ze(O, i), q = c("coachControl"), Z = ["today", "plan", "history", "settings", "import"];
  function j(i, u = !1) {
    M.querySelectorAll("[data-coach-tab]").forEach((g) => {
      const p = g.dataset.coachTab === i;
      g.setAttribute("aria-selected", String(p)), g.tabIndex = p ? 0 : -1, p && u && g.focus();
    }), M.querySelectorAll("[data-coach-view]").forEach((g) => {
      g.hidden = g.dataset.coachView !== i;
    }), M.scrollTop = 0, i === "history" && vt();
  }
  M.querySelectorAll("[data-coach-tab]").forEach((i) => {
    i.addEventListener("click", () => j(i.dataset.coachTab)), i.addEventListener("keydown", (u) => {
      const g = Z.indexOf(i.dataset.coachTab);
      let p = -1;
      u.key === "ArrowRight" && (p = (g + 1) % Z.length), u.key === "ArrowLeft" && (p = (g + Z.length - 1) % Z.length), u.key === "Home" && (p = 0), u.key === "End" && (p = Z.length - 1), p >= 0 && (u.preventDefault(), j(Z[p], !0));
    });
  }), M.querySelectorAll("[data-navigate-coach]").forEach((i) => i.addEventListener("click", () => {
    const u = i.dataset.navigateCoach;
    Z.includes(u) && j(u, !0);
  }));
  function ve() {
    if (P = ee(ze) === !0 || ee(ze) === null && !!ee(Ae), k) {
      O.hidden = !1;
      return;
    }
    M.hidden = !1, document.body.classList.add("coach-planning"), j("today"), le(), c("coachFtpKnown").dispatchEvent(new Event("change")), P || (x = "guided", q.value = "guided");
    const i = At(ee(Dt), ke(/* @__PURE__ */ new Date()));
    if (i) {
      c("coachFeeling").value = i.feeling;
      for (const [u, g] of [["coachBattery", i.bodyBattery], ["coachSleep", i.sleepScore], ["coachHrv", i.hrvMs]]) c(u).value = g === null ? "" : String(g);
    } else {
      c("coachFeeling").value = "okay";
      for (const u of ["coachBattery", "coachSleep", "coachHrv"]) c(u).value = "";
    }
    ne(), vt(), window.scrollTo(0, 0);
  }
  function Ye() {
    M.hidden = !0, document.body.classList.remove("coach-planning");
  }
  C == null || C.addEventListener("click", (i) => {
    const u = i.target;
    u instanceof Element && u.closest("#openBreakawayCoach") && ve();
  }), c("coachBack").addEventListener("click", Ye);
  function fe(i = /* @__PURE__ */ new Date()) {
    return Sa(
      n,
      (A == null ? void 0 : A.settings) || Ln,
      a.discipline === "general" ? Rn(n, !1) : Pa(n, a, i),
      (u) => Math.round(X(r.find((g) => g.id === u) || r[0]) / 60)
    );
  }
  function Oe() {
    const i = Y.map((w) => ({ start: w.start, elapsed: w.elapsed, avgPower: w.avgPower })), u = v.filter((w) => !i.some((L) => Math.abs(L.start - w.start) < 12e4)).map((w) => ({ start: w.start, elapsed: w.duration, avgPower: w.avgPower, source: "import" })), g = i.concat(u), p = Xe().filter((w) => w.mode === "classic" && w.elapsedSeconds > 0).map((w) => ({
      start: Date.parse(w.date) - w.elapsedSeconds * 1e3,
      elapsed: w.elapsedSeconds,
      avgPower: w.averageWatts,
      source: "classic"
    })).filter((w) => Number.isFinite(w.start) && !g.some((L) => Math.abs(L.start - w.start) < 12e4));
    return g.concat(p);
  }
  function Re() {
    return Xe().map((i) => ({ date: Date.parse(i.date), rpe: i.rpe }));
  }
  function Le() {
    const i = Re().concat(((A == null ? void 0 : A.history) || []).map((u) => ({ date: Date.parse(u.date), rpe: u.rpe })));
    return Lt(n, Date.now(), P ? Oe() : Oe().map((u) => ({ ...u, avgPower: null })), i).fatigued;
  }
  function oe() {
    const i = c("coachEventDiscipline").value;
    c("coachEventStagesWrap").hidden = i !== "stage-race", c("coachEventStages").disabled = i !== "stage-race", i === "stage-race" && Number(c("coachEventStages").value) < 2 && (c("coachEventStages").value = "2"), c("coachEventStageHint").hidden = i !== "stage-race", c("coachGeneralFocusWrap").hidden = i !== "general";
    const u = Nt({ discipline: i, date: c("coachEventDate").value }), g = Wt(u, /* @__PURE__ */ new Date());
    c("coachGoalPhaseSummary").textContent = u.discipline === "general" ? "General fitness: build a sustainable weekly routine." : g.weeksLeft === null ? "Set an event date to calculate training phases." : g.weeksLeft + " weeks remaining · " + g.phase.toUpperCase() + " phase. " + g.description;
  }
  function le() {
    c("coachFtp").value = String(n.ftp), c("coachFtpKnown").value = P ? "yes" : "no", c("coachHours").value = String(n.hours), c("coachDays").value = String(n.days), c("coachRestDay").value = String(n.restDay), c("coachExperience").value = n.experience, c("coachGoal").value = n.goal, c("coachEventDiscipline").value = a.discipline, c("coachEventName").value = a.name, c("coachEventDate").value = a.date, c("coachEventPriority").value = a.priority, c("coachEventObjective").value = a.objective, c("coachEventTerrain").value = a.terrain;
    for (const [i, u] of [["coachEventDistance", a.distanceKm === null ? null : Math.round(a.distanceKm / 1.609344 * 10) / 10], ["coachEventDuration", a.durationMinutes], ["coachEventElevation", a.elevationM === null ? null : Math.round(a.elevationM / 0.3048)], ["coachEventStages", a.stages]]) c(i).value = u === null ? "" : String(u);
    oe();
  }
  function re() {
    if (y) return y;
    const i = r.find((w) => w.id === o) || r[0];
    if (d) {
      const w = s;
      return w !== null && w >= 15 && w * 60 < X(i) ? Mt(i, w) : i;
    }
    const u = fe().days.find((w) => w.day === (/* @__PURE__ */ new Date()).getDay()), g = A != null && A.settings.enabled && (u == null ? void 0 : u.cyclingId) === i.id && u.cyclingMinutes > 0 ? u.cyclingMinutes : 1 / 0, p = Math.min(E ?? 1 / 0, g);
    return Number.isFinite(p) && p >= 15 && p * 60 < X(i) ? Mt(i, p) : i;
  }
  function pe(i) {
    const u = re(), g = u.segments[i];
    if (!g) return;
    const p = dn(n.ftp, g);
    c("coachIntervalDetails").innerHTML = '<div class="coach-interval-identity"><span class="coach-interval-kicker">BLOCK ' + (i + 1) + " / " + u.segments.length + "</span><strong>" + D(g.name) + "</strong><small>" + p.ftpRange + '</small></div><div class="coach-interval-numbers"><div><span>DURATION</span><strong>' + p.duration + "</strong></div><div><span>POWER RANGE</span><strong>" + p.range + "</strong></div><div><span>ERG TARGET</span><strong>" + p.target + " W</strong></div></div>", c("coachSegments").querySelectorAll("[data-coach-segment]").forEach((w) => {
      w.setAttribute("aria-pressed", String(Number(w.dataset.coachSegment) === i));
    });
  }
  const se = c("coachSegments"), De = (i) => {
    const u = i.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-coach-segment]");
    g && se.contains(g) && pe(Number(g.dataset.coachSegment));
  };
  se.addEventListener("pointerover", De), se.addEventListener("focusin", De), se.addEventListener("click", De);
  function Te() {
    const i = c("coachCalendarStrip"), u = c("coachCalendarDetails"), g = I.findIndex((U) => U.key === S);
    i.innerHTML = I.map((U, Be) => {
      const ot = U.reason.startsWith("Event stage "), ge = U.rideName || (U.completedRide ? "Ride completed" : ot ? "Event day" : null), Me = U.isToday && (A == null ? void 0 : A.completedToday()) === !0, _ = U.strength ? Me ? "✓ Strength completed" : "Full Body Strength " + U.strength : null, ae = [ge, _].filter(Boolean);
      return '<button type="button" class="coach-calendar-pill' + (U.isToday ? " is-today" : "") + '" data-calendar-index="' + Be + '" draggable="' + !!(U.rideId && !U.completedRide) + '" aria-expanded="' + (U.key === S) + '" aria-controls="coachCalendarDetails" aria-label="' + D(U.title + ": " + (ae.join(", ") || "Rest day") + ". " + (U.key === S ? "Collapse details." : "Expand details.")) + '"><span class="coach-calendar-date">' + D(U.label) + '</span><span class="coach-calendar-activity">' + D(ge || (_ ? "" : "Rest day")) + "</span>" + (_ ? '<span class="coach-calendar-strength">' + D(_) + "</span>" : "") + '<span class="coach-calendar-chevron" aria-hidden="true">' + (U.key === S ? "⌃" : "⌄") + "</span></button>";
    }).join("");
    const p = I[g];
    if (u.hidden = !p, !p) {
      u.innerHTML = "";
      return;
    }
    u.setAttribute("aria-label", "Workouts for " + p.title);
    const w = p.rideId ? r.find((U) => U.id === p.rideId) : null, L = w ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">CYCLING</span><strong>' + D(w.name) + "</strong><p>" + p.rideMinutes + " min · " + D(w.description) + "</p><p>" + D(p.reason) + '</p></div><div class="coach-calendar-session-actions"><button type="button" data-calendar-action="ride" data-calendar-index="' + g + '">' + (p.isToday ? "VIEW TODAY’S RIDE" : "USE THIS RIDE TODAY (OPTIONAL)") + ' →</button><button type="button" data-calendar-action="move" data-calendar-index="' + g + '">' + (l === p.key ? "CANCEL MOVE" : "MOVE WORKOUT") + "</button></div></div>" : p.completedRide ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">CYCLING</span><strong>Ride completed today</strong><p>Coach will account for your recorded ride.</p></div></div>' : "", G = p.isToday && (A == null ? void 0 : A.completedToday()) === !0, ie = p.strength ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">' + (G ? "STRENGTH · COMPLETED" : "STRENGTH · NO TRAINER NEEDED") + "</span><strong>Full Body Strength " + p.strength + "</strong><p>" + p.strengthMinutes + " min · Exercises matched to your saved equipment</p></div>" + (G ? "" : '<button type="button" data-calendar-action="strength" data-calendar-index="' + g + '">' + (p.isToday ? "START STRENGTH" : "START STRENGTH TODAY (OPTIONAL)") + " →</button>") + "</div>" : "", V = p.reason.startsWith("Event stage "), z = !L && !ie ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">' + (V ? "EVENT DAY" : "RECOVERY") + "</span><strong>" + (V ? "Race or stage day" : "Rest day") + "</strong><p>" + (V ? D(p.reason) : "No workout is scheduled. Recovery is part of your plan.") + "</p></div></div>" : "";
    u.innerHTML = '<div class="coach-calendar-detail-head"><div><span class="coach-calendar-type">DAY DETAILS</span><h3>' + D(p.title) + '</h3></div><button type="button" class="coach-calendar-close" data-calendar-action="close" aria-label="Close calendar day details">✕</button></div><div class="coach-calendar-detail-grid">' + L + ie + z + "</div>" + (l ? '<p class="coach-move-hint">Select a destination day above. Cycling sessions swap if both days have rides; strength stays put.</p>' : "");
  }
  c("coachCalendarStrip").addEventListener("click", (i) => {
    var w;
    const u = i.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-calendar-index]");
    if (!g) return;
    const p = I[Number(g.dataset.calendarIndex)];
    if (p) {
      if (l && p.key !== l) {
        $(l, p.key);
        return;
      }
      S = S === p.key ? null : p.key, Te(), (w = c("coachCalendarStrip").querySelectorAll("[data-calendar-index]")[Number(g.dataset.calendarIndex)]) == null || w.focus();
    }
  });
  function $(i, u, g = !1) {
    var G;
    if (!g) {
      const ie = I.map((z) => ({
        key: z.key,
        rideId: z.rideId,
        rideMinutes: z.rideMinutes,
        strengthMinutes: z.strengthMinutes,
        completedRide: z.completedRide,
        eventDay: z.reason.startsWith("Event stage ")
      })), V = Ca(ie, i, u);
      if (V.warning) {
        T = { from: i, to: u, suggestedKey: V.suggestedKey };
        const z = c("coachMoveRecoveryWarning");
        z.innerHTML = "<strong>RECOVERY CHECK</strong><p>" + D(V.warning) + "</p>" + (V.suggestedKey ? '<button type="button" data-move-decision="suggested">MOVE TO ' + D(V.suggestedKey) + " INSTEAD</button>" : "") + '<button type="button" data-move-decision="proceed">MOVE ANYWAY</button><button type="button" data-move-decision="cancel">KEEP CURRENT PLAN</button>', z.hidden = !1, z.scrollIntoView({ block: "nearest", behavior: "smooth" }), (G = z.querySelector('[data-move-decision="cancel"]')) == null || G.focus();
        return;
      }
    }
    T = null, c("coachMoveRecoveryWarning").hidden = !0;
    const p = I.find((ie) => ie.key === i), w = I.find((ie) => ie.key === u);
    if (!p || !w || !p.rideId || p.completedRide || w.completedRide || p.reason.startsWith("Event stage ") || w.reason.startsWith("Event stage ")) return;
    const L = Ta(
      f,
      i,
      u,
      { cyclingId: p.rideId, cyclingMinutes: p.rideMinutes },
      { cyclingId: w.rideId, cyclingMinutes: w.rideMinutes }
    );
    if (L !== f) {
      if (!de(ct, L)) {
        alert("Unable to save this calendar change. Check browser storage.");
        return;
      }
      f = L, l = null, S = u, d = !1, ne();
    }
  }
  const be = document.createElement("section");
  be.id = "coachMoveRecoveryWarning", be.className = "coach-move-recovery-warning", be.setAttribute("role", "alert"), be.setAttribute("aria-label", "Recovery-aware scheduling warning"), be.hidden = !0, c("coachCalendarDetails").after(be), be.addEventListener("click", (i) => {
    var w;
    const u = i.target;
    if (!(u instanceof Element)) return;
    const g = (w = u.closest("[data-move-decision]")) == null ? void 0 : w.dataset.moveDecision;
    if (!g || !T) return;
    const p = T;
    if (g === "cancel") {
      T = null, be.hidden = !0, l = null, Te();
      return;
    }
    if (g === "suggested" && p.suggestedKey) {
      T = null, be.hidden = !0, $(p.from, p.suggestedKey);
      return;
    }
    g === "proceed" && $(p.from, p.to, !0);
  });
  const nt = c("coachCalendarStrip");
  nt.addEventListener("dragstart", (i) => {
    const u = i.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-calendar-index]"), p = I[Number(g == null ? void 0 : g.dataset.calendarIndex)];
    if (!(p != null && p.rideId) || p.completedRide) {
      i.preventDefault();
      return;
    }
    l = p.key, i.dataTransfer && (i.dataTransfer.effectAllowed = "move", i.dataTransfer.setData("text/plain", p.key));
  }), nt.addEventListener("dragover", (i) => {
    i.target instanceof Element && i.target.closest("[data-calendar-index]") && i.preventDefault();
  }), nt.addEventListener("drop", (i) => {
    i.preventDefault();
    const u = i.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-calendar-index]"), p = I[Number(g == null ? void 0 : g.dataset.calendarIndex)];
    p && l && $(l, p.key);
  }), nt.addEventListener("dragend", () => {
    T || (l = null);
  }), c("coachCalendarDetails").addEventListener("click", (i) => {
    var w;
    const u = i.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-calendar-action]");
    if (!g) return;
    if (g.dataset.calendarAction === "close") {
      const L = I.findIndex((G) => G.key === S);
      S = null, Te(), L >= 0 && ((w = c("coachCalendarStrip").querySelectorAll("[data-calendar-index]")[L]) == null || w.focus());
      return;
    }
    const p = I[Number(g.dataset.calendarIndex)];
    if (p) {
      if (g.dataset.calendarAction === "move" && p.rideId) {
        l = l === p.key ? null : p.key, Te();
        return;
      }
      g.dataset.calendarAction === "ride" && p.rideId ? (o = p.rideId, d = !0, s = p.rideMinutes, y = null, S = null, ne(), c("coachRecommendedName").scrollIntoView({ block: "center", behavior: "smooth" })) : g.dataset.calendarAction === "strength" && p.strength && mt(p.strength, p.strengthMinutes);
    }
  });
  function ne() {
    var cn, ln;
    r = Tt(n);
    const i = /* @__PURE__ */ new Date(), u = ke(i);
    u !== m && (m = u, d = !1, s = null, y = null, S = null);
    const g = Oe(), p = Re(), w = P ? g : g.map((h) => ({ ...h, avgPower: null })), L = At(ee(Dt), u), G = Yn(L), ie = Oa(L, Lt(n, i.getTime(), w, p), g.some((h) => h.start >= new Date(i.getFullYear(), i.getMonth(), i.getDate()).getTime() && h.elapsed >= 900));
    c("coachReadinessLabel").textContent = ie.label, c("coachReadinessLabel").setAttribute("data-day-color", ie.color), c("coachReadinessExplanation").textContent = ie.detail + " " + G.detail;
    const V = fe(i), z = V.days.find((h) => h.day === i.getDay()), U = En(u, z, f), Be = hn(
      n,
      i,
      w,
      p,
      V.days.map((h) => ({
        day: h.day,
        workoutId: h.day === i.getDay() ? U.cyclingId : h.cyclingId,
        reason: h.day === i.getDay() ? U.reason : h.reason
      }))
    ), ot = Object.prototype.hasOwnProperty.call(f, u), ge = ot && Be.status !== "completed" ? { ...Be, workoutId: U.cyclingId, status: U.cyclingId ? "planned" : "rest", reason: U.reason } : Na(Be, L), Me = Da({
      now: i,
      week: V.days,
      rides: g,
      feedback: p,
      skipped: N(),
      ftp: n.ftp,
      ftpKnown: P,
      budgetMinutes: V.budgetMinutes,
      today: ge,
      recoveryMinutes: Math.round(X(r.find((h) => h.id === "recovery")) / 60),
      planForDate: (h) => {
        const H = fe(h).days.find((B) => B.day === h.getDay());
        return H ? En(ke(h), H, f) : void 0;
      },
      event: a.discipline !== "general" && a.date ? { startDate: a.date, stages: a.discipline === "stage-race" ? a.stages : 1 } : void 0
    }), _ = Me.days.find((h) => h.key === u) ?? {
      weekday: i.getDay(),
      originalId: ((cn = V.days.find((h) => h.day === i.getDay())) == null ? void 0 : cn.cyclingId) ?? null,
      workoutId: ge.workoutId,
      minutes: ge.workoutId ? Math.round(X(r.find((h) => h.id === ge.workoutId) || r[0]) / 60) : 0,
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
    }, Un = N().includes(u);
    c("coachSkipToday").textContent = Un ? "Undo skipped session" : "Skip today's session", I = ka(i, V.days, r, ae).map((h) => {
      const H = Me.days.find((J) => J.key === h.key);
      if (!H) return h;
      const B = r.find((J) => J.id === H.workoutId);
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
    }), Te();
    const Xt = (h) => {
      var J, Q;
      const H = ((J = r.find((Pe) => Pe.id === h.originalId)) == null ? void 0 : J.name) || (h.originalId ? "Planned ride" : "Rest day"), B = ((Q = r.find((Pe) => Pe.id === h.workoutId)) == null ? void 0 : Q.name) || (h.kind === "completed" ? "Ride recorded" : h.kind === "skipped" ? "Skipped" : h.kind === "missed" ? "Not completed" : h.kind === "event" ? "Race or event day" : "No ride scheduled");
      return "<li><strong>" + D(h.key) + "</strong> · " + D(H) + " (" + h.beforeMinutes + " min) → " + D(B) + " (" + h.afterMinutes + " min)<p>" + D(h.reason) + "</p></li>";
    }, qe = Me.changes.filter((h) => h.key >= u), Zt = c("coachAdaptiveToday");
    Zt.hidden = qe.length === 0, Zt.innerHTML = qe.length ? "<strong>YOUR UPDATED TRAINING WEEK · " + qe.length + " CHANGE" + (qe.length === 1 ? "" : "S") + "</strong><p>Coach accounts for extra rides and recovery without adding make-up sessions.</p><ul>" + qe.map(Xt).join("") + "</ul>" : "";
    const St = Me.changes.filter((h) => h.key <= Me.days[6].key), $t = c("coachAdaptiveWeek");
    $t.hidden = St.length === 0, $t.innerHTML = St.length ? "<strong>WHAT CHANGED IN YOUR WEEK</strong><p>Workout adjustments are date-specific. Your strength sessions and chosen rest day stay protected.</p><ul>" + St.map(Xt).join("") + "</ul>" : "", V.days[i.getDay()];
    const Et = !!_.strength, kt = (A == null ? void 0 : A.completedToday()) || !1, Ie = Et && !_.workoutId, Jt = Le();
    d || (o = ae.workoutId || "recovery", y = null), r.some((h) => h.id === o) || (o = "recovery", y = null);
    const st = !d && (!ae.workoutId || Ie);
    c("coachRestState").hidden = !st, c("coachWorkoutControls").hidden = st, c("coachRecommendedName").textContent = st ? _.status === "event" ? "Race / event day" : Ie ? "Strength training day" : ae.status === "completed" ? "Ride already completed" : "Rest day" : re().name, c("coachRecommendationLabel").textContent = d ? "YOUR CHOICE" : _.status === "event" ? "EVENT DAY" : Ie ? "STRENGTH DAY" : ae.status === "recovery" ? "RECOVERY ADJUSTMENT" : ae.status === "rest" || ae.status === "completed" ? "REST RECOMMENDED" : "FROM YOUR PLAN", c("coachWhy").textContent = _.status === "event" && !d ? "Your event takes priority. There is no additional prescribed trainer ride today." : Ie && !d ? "Your plan includes strength today. No cycling workout is scheduled." : st ? "Coach recommends rest today." : d ? "You chose an optional alternative for today. Coach originally recommended: " + ae.reason : "Why Coach chose this: " + ae.reason;
    const it = ((ln = V.days.find((h) => h.day === i.getDay())) == null ? void 0 : ln.cyclingId) || null, Qt = !d && ae.status === "recovery" && it && it !== ae.workoutId;
    if (c("coachChangeDetail").hidden = !Qt, Qt) {
      const h = r.find((Q) => Q.id === it), H = r.find((Q) => Q.id === ae.workoutId), B = h ? Math.round(X(h) / 60) : null, J = H ? Math.round(X(H) / 60) : null;
      c("coachChangeDetail").innerHTML = '<strong>WHY TODAY CHANGED</strong><div class="coach-change-pair"><span>ORIGINAL: ' + D((h == null ? void 0 : h.name) || it) + (B === null ? "" : " · " + B + " min") + "</span><span>RECOMMENDED: " + D((H == null ? void 0 : H.name) || "Recovery spin") + (J === null ? "" : " · " + J + " min") + "</span></div><p>" + D(ae.reason) + "</p><p>See the updated training week for any changes to upcoming sessions. To ride the original workout today, select it under Swap workout.</p>";
    }
    c("coachRestReason").textContent = _.status === "event" ? _.reason : Ie ? "Your strength session is ready above. No trainer needed. You can still pick an optional cycling workout." : ae.reason, c("coachUseRecommendation").hidden = !d && !ot;
    const Ue = re(), Gn = X(Ue);
    c("coachWorkoutInfo").innerHTML = "<div><strong>" + D(Ue.category.toUpperCase()) + "</strong><span>" + Math.round(Gn / 60) + " MINUTES · " + Ue.segments.length + " SEGMENTS</span></div><p>" + D(Ue.description) + "</p>" + (P ? "" : "<p><strong>FTP not yet established:</strong> displayed watt values are examples, not individualized targets. Keep the first ride conversational and use guided SIM mode, not ERG.</p>"), c("coachSegments").innerHTML = Ue.segments.map((h, H) => {
      const B = h.low < 0.6 ? "#86b5da" : h.low < 0.8 ? "#63d8bd" : h.low < 1 ? "#f9be70" : "#fb7489", J = Math.max(24, Math.min(100, Math.round(h.high * 80))), Q = dn(n.ftp, h), Pe = h.name + " — " + Q.duration + " duration, " + Q.range + " power range, " + Q.target + " W ERG target (" + Q.ftpRange + ")";
      return '<button type="button" class="coach-segment" data-coach-segment="' + H + '" aria-pressed="false" aria-label="' + D(Pe) + '" title="' + D(Pe) + '" style="flex:' + h.minutes + '"><span class="coach-segment-bar" aria-hidden="true" style="height:' + J + "%;background:" + B + '"></span></button>';
    }).join(""), pe(0), q.value = x;
    const en = Xe();
    i.getDay();
    const tn = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"], Ge = Wt(a, i);
    c("coachGoalHeadlineLabel").textContent = a.discipline === "general" ? "Balanced cycling fitness" : a.name || pt[a.discipline], c("coachGoalHeadlineMeta").textContent = a.discipline === "general" ? "Build consistency and endurance" : (Ge.phase === "event" ? "Event underway" : Ge.phase === "post-event" ? "Event completed" : Ge.weeksLeft === null ? "Set an event date" : Ge.weeksLeft + " weeks to go") + " · " + Ge.phase.toUpperCase() + " PHASE", c("coachHeaderFtp").textContent = P ? "FTP " + n.ftp + " W" : "FTP NOT SET";
    const nn = !!ee(Ae);
    c("coachFirstRun").hidden = nn, c("coachStartLabel").textContent = nn ? "CONNECT MY TRAINER" : "SET UP MY PLAN TO START", c("coachProfileSummary").innerHTML = "<div><strong>" + (P ? n.ftp + " W" : "Not set") + "</strong><span>FTP</span></div><div><strong>" + n.hours + " h</strong><span>Per week</span></div><div><strong>" + n.days + " days</strong><span>Training days</span></div>";
    const an = I.slice(1).flatMap((h) => {
      const H = [];
      return h.rideId && h.rideMinutes > 0 && H.push({ key: h.key, weekday: h.date.getDay(), name: h.rideName || "Cycling ride", type: "ride", id: h.rideId, minutes: h.rideMinutes }), h.strength && h.strengthMinutes > 0 && H.push({ key: h.key, weekday: h.date.getDay(), name: "Full Body Strength " + h.strength, type: "strength", id: h.strength, minutes: h.strengthMinutes }), H;
    }).slice(0, 3);
    c("coachNextUp").innerHTML = an.length ? an.map(
      (h) => '<button type="button" class="coach-upcoming-item" data-upcoming-key="' + h.key + '" data-upcoming-type="' + h.type + '" data-upcoming-workout="' + D(h.id) + '"><strong>' + tn[h.weekday] + "</strong><span>" + D(h.name) + "<small>" + h.minutes + " min · " + (h.type === "ride" ? "Ride" : "Strength") + " · " + h.key + '</small></span><span aria-hidden="true">→</span></button>'
    ).join("") : '<p class="coach-small">No more workouts in your next seven days. Rest or review your plan.</p>', c("coachPlanLibrary").innerHTML = r.map((h) => {
      const H = Math.round(X(h) / 60);
      return '<button type="button" class="coach-library-item" data-library-workout="' + D(h.id) + '"><span><strong>' + D(h.name) + "</strong><small>" + D(h.category) + " · " + H + ' min</small></span><span aria-hidden="true">→</span></button>';
    }).join("");
    const on = I.map((h) => {
      const H = Me.days.find((Q) => Q.key === h.key), B = !!h.rideId && h.rideMinutes > 0, J = B ? r.find((Q) => Q.id === h.rideId) : void 0;
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
    }), jn = on.reduce((h, H) => h + H.minutes + H.strengthMinutes, 0);
    c("coachPlanBudget").textContent = "Next 7 days cycling + strength: " + (jn / 60).toFixed(1) + " h · Weekly time goal: " + (V.budgetMinutes / 60).toFixed(1) + " h · " + V.note, c("coachWeek").innerHTML = on.map((h) => {
      const H = h.key < u, B = h.workoutId && h.name && h.minutes > 0 && !H ? '<button type="button" data-day-workout="' + D(h.workoutId) + '" data-day-key="' + h.key + '"><span><strong>🚴 ' + D(h.name) + "</strong><small>" + h.minutes + " min · " + (h.changed ? "Adjusted · " : "") + 'Classic cycling</small></span><span aria-hidden="true">→</span></button>' : h.missingWorkout ? '<span class="coach-day-warning">Workout missing from library — review your setup</span>' : h.status === "completed" ? '<span class="coach-day-rest">✓ Ride recorded</span>' : h.status === "skipped" ? '<span class="coach-day-rest">Skipped by you · not rescheduled</span>' : h.status === "missed" ? '<span class="coach-day-rest">Not completed · not rescheduled</span>' : h.status === "event" ? '<span class="coach-day-event">🏁 Event day · no indoor session scheduled</span>' : "", J = h.strength && !H ? '<button type="button" class="coach-day-strength" data-strength-day="' + h.weekday + '" data-strength-variation="' + h.strength + '"><span><strong>▥ Full Body Strength ' + h.strength + "</strong><small>" + h.strengthMinutes + " min" + (h.key === u ? "" : " · Start today (optional)") + " · " + D(((A == null ? void 0 : A.settings.equipment) || []).filter((Q) => Q !== "bodyweight").join(", ") || "Bodyweight") + '</small></span><span aria-hidden="true">→</span></button>' : h.strength ? '<span class="coach-day-rest">Strength was scheduled</span>' : "";
      return '<div class="coach-day-row ' + (h.key === u ? "coach-week-today" : "") + '"><span class="coach-day-label">' + tn[h.weekday] + "<small>" + D(h.key.slice(5)) + '</small></span><div class="coach-day-items">' + (B + J || '<span class="coach-day-rest">Rest day</span>') + (h.changed ? '<small class="coach-adaptive-inline">' + D(h.reason) + "</small>" : "") + "</div></div>";
    }).join("");
    const je = c("coachStrengthToday"), sn = c("coachViewToday").querySelector(".coach-today-grid"), rn = c("coachViewToday").querySelector(".coach-today-side");
    if (Ie ? sn.insertBefore(je, sn.firstElementChild) : rn.insertBefore(je, rn.firstElementChild), je.classList.toggle("coach-strength-primary", Ie), je.hidden = !Et, Et) {
      const h = Ft(A.settings, _.strength, Jt);
      je.innerHTML = '<div class="coach-section-top"><span class="coach-tag">TODAY · STRENGTH</span><span class="coach-tag">' + (kt ? "COMPLETED" : "NO TRAINER NEEDED") + "</span></div><h3>" + D(h.title) + "</h3><p>" + _.strengthMinutes + " minutes · " + h.exercises.length + " movements · Matched to your available equipment." + (Jt ? " Recent fatigue suggests going easy or skipping." : "") + '</p><button type="button" id="coachStartStrength" ' + (kt ? "disabled" : "") + ">" + (kt ? "✓ SESSION LOGGED" : "START STRENGTH WORKOUT →") + "</button>";
    }
    c("coachStrengthHistory").innerHTML = A != null && A.history.length ? '<div class="coach-strength-history">' + A.history.slice(-6).reverse().map((h) => "<div><span><strong>" + D(h.routine) + "</strong><br>" + new Date(h.date).toLocaleDateString() + "</span><small>" + h.completedSets + "/" + h.plannedSets + " sets · " + h.minutes + " min</small></div>").join("") + "</div>" : '<p class="coach-small">Completed strength training sessions will appear here.</p>', c("coachHistory").innerHTML = en.length ? en.slice(-5).reverse().map((h) => '<div class="coach-history-row"><strong>' + D(h.workout) + "</strong><span>" + new Date(h.date).toLocaleDateString() + " · " + Math.round(h.elapsedSeconds / 60) + " min · " + D(h.mode.toUpperCase()) + "</span></div>").join("") : '<p class="coach-small">Your coached rides will appear here.</p>', c("coachSuggestion").textContent = Ie ? "Your strength workout is ready. No smart trainer needed." : A != null && A.settings.enabled ? "Your next workout is ready. Cycling and strength fit within your weekly time." : "Your next workout is ready. Coach considers your schedule and recent riding.", c("coachSwapList").innerHTML = r.filter((h) => h.id !== "preview").map((h) => '<button type="button" data-swap-workout="' + D(h.id) + '"><span><strong>' + D(h.name) + "</strong><small>" + D(h.category) + " · " + Math.round(X(h) / 60) + ' min</small></span><span aria-hidden="true">→</span></button>').join("");
  }
  function Ut(i, u) {
    const g = r.find((w) => w.id === i);
    if (!g) return;
    const p = Ma(f, ke(/* @__PURE__ */ new Date()), {
      cyclingId: i,
      cyclingMinutes: Math.round(X(g) / 60)
    });
    if (p === f || !de(ct, p)) {
      c("coachStatus").textContent = "Could not save your replacement workout. Check browser storage.";
      return;
    }
    f = p, o = i, d = !1, s = null, y = null, c("coachSwapPanel").hidden = !0, c("coachSwapToggle").setAttribute("aria-expanded", "false"), ne(), c("coachAnswer").textContent = u, c("coachStatus").textContent = "Saved for today. Your calendar and workout are updated.";
  }
  c("coachSkipToday").addEventListener("click", () => {
    const i = ke(/* @__PURE__ */ new Date()), u = new Set(N());
    if (u.has(i) ? u.delete(i) : u.add(i), !de(R, Array.from(u).slice(-90))) {
      c("coachStatus").textContent = "Could not save the skipped session. Check browser storage.";
      return;
    }
    d = !1, s = null, y = null, ne();
  }), c("coachSwapToggle").addEventListener("click", () => {
    const i = c("coachSwapPanel");
    i.hidden = !i.hidden, c("coachSwapToggle").setAttribute("aria-expanded", String(!i.hidden));
  }), c("coachBrowseOptional").addEventListener("click", () => {
    c("coachSwapPanel").hidden = !1, c("coachSwapToggle").setAttribute("aria-expanded", "true");
  }), c("coachUseRecommendation").addEventListener("click", () => {
    const i = ke(/* @__PURE__ */ new Date());
    if (Object.prototype.hasOwnProperty.call(f, i)) {
      const u = { ...f };
      if (delete u[i], !de(ct, u)) {
        c("coachStatus").textContent = "Could not restore the original recommendation. Check browser storage.";
        return;
      }
      f = u;
    }
    d = !1, s = null, y = null, ne(), c("coachAnswer").textContent = "Back to your Coach recommendation.";
  }), c("coachSwapList").addEventListener("click", (i) => {
    const u = i.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-swap-workout]");
    g != null && g.dataset.swapWorkout && Ut(g.dataset.swapWorkout, "Replacement workout saved for today. Other days are unchanged.");
  }), M.querySelectorAll("[data-coach-question]").forEach((i) => i.addEventListener("click", () => {
    const u = i.dataset.coachQuestion;
    if (u === "tired") Ut("recovery", "Easy recovery selected for today. Rest instead if you feel unusually fatigued or unwell.");
    else if (u === "short") {
      const g = re(), p = Math.max(15, Math.min(30, Math.floor(X(g) / 60 * 0.65))), w = Mt(g, p);
      w === g ? c("coachAnswer").textContent = "This workout is already brief. You can swap to Recovery Spin or take a rest day." : (y = w, d = !0, ne(), c("coachAnswer").textContent = "Shorter session prepared. Coach kept the power ranges and reduced interval durations.");
    } else {
      const g = fe(), p = hn(n, /* @__PURE__ */ new Date(), Oe(), Re(), g.days.map((w) => ({ day: w.day, workoutId: w.cyclingId, reason: w.reason })));
      c("coachAnswer").textContent = p.reason + (d ? " You have selected an alternative for today." : "");
    }
  }));
  function mt(i, u) {
    if (A != null && A.settings.enabled) {
      if (e.isRiding()) {
        alert("Finish your active cycling session before starting strength training.");
        return;
      }
      A.open(i, Le(), u);
    }
  }
  c("coachWeek").addEventListener("click", (i) => {
    const u = i.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-strength-variation]");
    if (g) {
      const w = Number(g.dataset.strengthDay), G = fe().days[w];
      G != null && G.strength && mt(G.strength, G.strengthMinutes);
      return;
    }
    const p = u.closest("[data-day-workout]");
    if (p != null && p.dataset.dayWorkout) {
      const w = I.find((L) => L.key === p.dataset.dayKey);
      o = p.dataset.dayWorkout, d = !0, s = (w == null ? void 0 : w.rideMinutes) ?? null, y = null, ne(), j("today");
    }
  }), c("coachStrengthToday").addEventListener("click", (i) => {
    const u = i.target;
    if (!(u instanceof Element) || !u.closest("#coachStartStrength")) return;
    const p = fe().days[(/* @__PURE__ */ new Date()).getDay()];
    p != null && p.strength && mt(p.strength, p.strengthMinutes);
  }), c("coachPlanLibrary").addEventListener("click", (i) => {
    const u = i.target.closest("[data-library-workout]");
    u != null && u.dataset.libraryWorkout && (o = u.dataset.libraryWorkout, d = !0, s = null, y = null, ne(), j("today"));
  }), c("coachNextUp").addEventListener("click", (i) => {
    const u = i.target.closest("[data-upcoming-workout]");
    if (u != null && u.dataset.upcomingWorkout)
      if (u.dataset.upcomingType === "strength")
        j("plan", !0);
      else {
        const g = I.find((p) => p.key === u.dataset.upcomingKey);
        o = u.dataset.upcomingWorkout, d = !0, s = (g == null ? void 0 : g.rideMinutes) ?? null, y = null, ne(), j("today");
      }
  }), q.addEventListener("change", () => {
    x = q.value, !P && x === "structured" && (x = "guided", q.value = "guided", c("coachStatus").textContent = "Set a reliable FTP in My Setup before selecting automatic ERG. Ride by feel is available now.");
  }), c("coachFtpKnown").addEventListener("change", () => {
    const i = c("coachFtpKnown").value === "yes";
    c("coachFtp").disabled = !i, c("coachFtpHelp").textContent = i ? "Enter the FTP from your latest reliable assessment." : "No FTP required for your first demo. Indoor rides will default to guided SIM, not automatic ERG watt targets.";
  });
  function yt(i, u, g) {
    const p = c(i);
    if (!p.value.trim()) return null;
    const w = Number(p.value);
    if (!Number.isInteger(w) || w < u || w > g) throw Error(i + " must be a whole number from " + u + " to " + g + ".");
    return w;
  }
  c("coachSaveCheckin").addEventListener("click", () => {
    try {
      const i = /* @__PURE__ */ new Date(), u = ke(i), g = {
        date: u,
        feeling: c("coachFeeling").value,
        bodyBattery: yt("coachBattery", 0, 100),
        sleepScore: yt("coachSleep", 0, 100),
        hrvMs: yt("coachHrv", 1, 300)
      }, p = At(g, u);
      if (!p || !de(Dt, p)) throw Error("Could not save check-in. Verify browser storage.");
      c("coachCheckinFeedback").textContent = "Saved for today. Your recommendation has been refreshed.", ne();
    } catch (i) {
      c("coachCheckinFeedback").textContent = i instanceof Error ? i.message : "Invalid check-in.";
    }
  }), c("coachEventDiscipline").addEventListener("change", oe), c("coachEventDate").addEventListener("change", oe), c("coachSaveProfile").addEventListener("click", () => {
    const i = Nt({ discipline: c("coachEventDiscipline").value, name: c("coachEventName").value, date: c("coachEventDate").value, priority: c("coachEventPriority").value, objective: c("coachEventObjective").value, terrain: c("coachEventTerrain").value, distanceKm: c("coachEventDistance").value ? Number(c("coachEventDistance").value) * 1.609344 : "", durationMinutes: c("coachEventDuration").value, elevationM: c("coachEventElevation").value ? Number(c("coachEventElevation").value) * 0.3048 : "", stages: c("coachEventStages").value });
    if (c("coachEventDate").value && !i.date) {
      c("coachSettingsFeedback").textContent = "Please enter a valid event date.";
      return;
    }
    const u = [["coachEventDistance", "event distance"], ["coachEventElevation", "total climbing"], ["coachEventDuration", "estimated riding time"]];
    i.discipline === "stage-race" && u.push(["coachEventStages", "number of stages"]);
    const g = u.find(([w]) => !c(w).checkValidity());
    if (g) {
      const w = c(g[0]);
      c("coachSettingsFeedback").textContent = "Please check " + g[1] + ": " + (w.validationMessage || "enter a valid value") + ".", w.focus();
      return;
    }
    if (!de(Cn, i)) {
      c("coachSettingsFeedback").textContent = "Could not save your event goal. Check browser storage.";
      return;
    }
    a = i;
    const p = Ne({
      ftp: Number(c("coachFtp").value),
      hours: Number(c("coachHours").value),
      days: Number(c("coachDays").value),
      restDay: Number(c("coachRestDay").value),
      experience: c("coachExperience").value,
      goal: c("coachGoal").value
    });
    if (!(A != null && A.saveSettings())) {
      c("coachSettingsFeedback").textContent = "Could not save strength equipment. Check your browser storage and try again.";
      return;
    }
    if (n = p, P = c("coachFtpKnown").value === "yes", !de(Ae, n)) {
      c("coachSettingsFeedback").textContent = "Strength equipment saved, but cycling settings could not be stored. Enable browser storage and retry.";
      return;
    }
    if (!de(ze, P)) {
      c("coachSettingsFeedback").textContent = "Could not save FTP status. Check browser storage.";
      return;
    }
    P || (x = "guided"), q.value = x, d = !1, s = null, y = null, le(), ne(), c("coachSettingsFeedback").textContent = "✓ Saved! Your cycling, strength, and weekly plan are updated.", j("today", !0), c("coachAnswer").textContent = "Your plan is saved. Coach has prepared today’s recommendation.";
  });
  function Gt() {
    (k == null ? void 0 : k.control) === "structured" && !K && e.setMode("sim");
  }
  async function vt() {
    const i = c("coachPlatformHistory");
    try {
      Y = await e.getPlatformRides();
      try {
        v = await Nn();
      } catch {
        v = [];
      }
      const u = Y.filter((w) => Number.isFinite(w.start) && w.start >= Date.now() - 7 * 864e5 && w.start <= Date.now()), g = u.reduce((w, L) => w + Math.max(0, L.elapsed), 0) / 3600, p = ["classic", "survival", "cyclequest"];
      i.innerHTML = '<p class="coach-small">' + Y.length + " locally saved rides · " + g.toFixed(1) + " hours in the last 7 days. All three riding modes contribute to your training history. Only Classic uses prescribed workouts.</p>" + p.map((w) => '<div class="coach-history-row"><strong>' + { classic: "CLASSIC", survival: "SURVIVAL", cyclequest: "CYCLE QUEST" }[w] + "</strong><span>" + u.filter((L) => L.mode === w).length + " rides · " + (u.filter((L) => L.mode === w).reduce((L, G) => L + G.elapsed, 0) / 3600).toFixed(1) + " hours this week</span></div>").join("") + '<p class="coach-small">Older rides without a mode label count toward total hours. A potential hard-game-day alert uses duration and average power, not a clinical recovery assessment.</p>', ne();
    } catch (u) {
      i.textContent = "Local ride history could not be loaded: " + String(u instanceof Error ? u.message : u);
    }
  }
  function ft() {
    k && k.elapsed > 0 && !K && zt(k, null), Gt(), k = null, K = !1, bt(), O.hidden = !0, Ye();
  }
  F("coachEnd").addEventListener("click", ft), F("coachMinimize").addEventListener("click", () => {
    O.classList.toggle("coach-hud-minimized"), F("coachMinimize").textContent = O.classList.contains("coach-hud-minimized") ? "+" : "−";
  });
  function jt(i) {
    k && (k.adjusted = Math.round(Math.min(1.25, Math.max(0.7, k.adjusted + i)) * 100) / 100, k.control === "structured" && !K && e.setTarget(xe(k.ftp, Ve(k.workout, k.elapsed).segment, k.adjusted)), wt());
  }
  F("coachLighter").addEventListener("click", () => jt(-0.05)), F("coachHarder").addEventListener("click", () => jt(0.05));
  function Vt(i, u, g, p = !1) {
    if (k || e.isRiding()) {
      c("coachStatus").textContent = "Finish the current ride or coaching session before starting a new one.";
      return;
    }
    const L = Vn().includes(g) ? g : "structured";
    k = { workout: i, mode: u, control: L, ftp: n.ftp, elapsed: 0, adjusted: 1, measured: 0, inRange: 0, sumWatts: 0, countWatts: 0, done: !1, previousIndex: -1 }, ce = "", K = p, Ye(), O.hidden = !1, O.classList.remove("coach-hud-minimized"), F("coachMinimize").textContent = "−", p || (e.setMode(L === "structured" ? "target" : "sim"), L === "structured" && e.setTarget(xe(n.ftp, i.segments[0])), e.makeRoute(X(i), L === "structured"), e.launchMode("classic")), wt();
  }
  c("coachStartClassic").addEventListener("click", () => {
    if (!ee(Ae)) {
      j("settings", !0);
      return;
    }
    !P && x === "structured" && (x = "guided", q.value = "guided", c("coachStatus").textContent = "FTP is not set. Starting guided ride-by-feel instead of automatic watt targets."), Vt(re(), "classic", x);
  });
  let at = null;
  const we = document.createElement("div");
  we.id = "coachDemoControls", we.hidden = !0, we.innerHTML = '<label>SIMULATED POWER <input id="coachDemoPower" type="range" min="0" max="450" step="5" value="130"></label><span id="coachDemoWatts">130 W</span><button type="button" id="coachDemoStop">STOP DEMO</button>', O.append(we), at = we.querySelector("#coachDemoPower"), at.addEventListener("input", () => {
    b = Number(at.value), Ze(we, "coachDemoWatts").textContent = b + " W";
  }), Ze(we, "coachDemoStop").addEventListener("click", () => {
    ft(), ve();
  });
  function Kt() {
    const i = Tt(n).find((g) => g.id === "preview");
    b = 130, at.value = "130", Vt(i, "classic", x, !0), bt(), we.hidden = !1;
    let u = performance.now();
    ye = window.setInterval(() => {
      const g = performance.now(), p = Math.min(1.5, (g - u) / 1e3);
      u = g, _t(p, b, 85, !0);
    }, 250);
  }
  c("coachDemo").addEventListener("click", Kt), c("coachFirstRunDemo").addEventListener("click", Kt);
  function bt() {
    ye !== null && window.clearInterval(ye), ye = null, we.hidden = !0;
  }
  function wt(i = null) {
    if (!k) return;
    const u = k.workout, g = Ve(u, k.elapsed), p = g.done || k.done, w = xe(k.ftp, g.segment, k.adjusted);
    F("coachHudState").textContent = K ? "SIMULATED DEMO" : p ? "WORKOUT COMPLETE" : k.elapsed === 0 ? "WAITING FOR PEDALS" : k.control === "structured" ? "ERG CONTROL" : k.control === "guided" ? "GUIDED SIM" : "RECORD ONLY", F("coachActual").innerHTML = (i === null ? "—" : String(Math.round(i))) + "<span> W</span>", F("coachTarget").innerHTML = String(w) + "<span> W</span>", F("coachRemaining").textContent = p ? "DONE" : ut(g.remaining), F("coachInterval").textContent = g.segment.name.toUpperCase() + " · " + Math.round(g.segment.low * 100) + "–" + Math.round(g.segment.high * 100) + "% FTP", F("coachSessionClock").textContent = ut(k.elapsed) + " / " + ut(X(u)), F("coachProgressBar").style.width = Math.round(k.elapsed / X(u) * 100) + "%";
    let L = "Connect a trainer, then start pedaling.";
    K ? L = "SIMULATED telemetry only — no physical trainer or ride record." : p ? L = "Workout complete! Finish your ride when ready." : k.elapsed > 0 && i !== null && (L = un(i, k.ftp, g.segment, k.adjusted) ? "On target. Smooth and controlled." : i < k.ftp * g.segment.low * k.adjusted ? "Below target. Build effort gradually." : "Above target. Ease back to your prescribed effort."), F("coachPrompt").textContent = L;
  }
  function _t(i, u, g, p) {
    if (!k || k.done || !Number.isFinite(i) || i <= 0 || !p && !K || !K && (!Number.isFinite(g) || g < 10)) return;
    const w = Ve(k.workout, k.elapsed);
    k.previousIndex !== w.index && (k.previousIndex = w.index, k.control === "structured" && !K && e.setTarget(xe(k.ftp, w.segment, k.adjusted)));
    const L = Math.min(3, i, X(k.workout) - k.elapsed);
    if (L <= 0) return;
    Number.isFinite(u) && u >= 0 && (k.sumWatts += u * L, k.countWatts += L, k.measured += L, un(u, k.ftp, w.segment, k.adjusted) && (k.inRange += L)), k.elapsed += L;
    const G = Ve(k.workout, k.elapsed);
    G.index !== w.index && k.control === "structured" && !K && e.setTarget(xe(k.ftp, G.segment, k.adjusted)), k.elapsed >= X(k.workout) && (k.done = !0, k.control === "structured" && !K && e.setTarget(Math.max(30, Math.round(k.ftp * 0.45))), K && bt()), (performance.now() - he > 250 || k.done) && (he = performance.now(), wt(u));
  }
  function zt(i, u) {
    const g = Xe(), p = {
      id: (/* @__PURE__ */ new Date()).toISOString() + ":" + i.workout.id,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      workoutId: i.workout.id,
      workout: i.workout.name,
      mode: i.mode,
      control: i.control,
      elapsedSeconds: Math.round(i.elapsed),
      plannedSeconds: X(i.workout),
      measuredSeconds: Math.round(i.measured),
      inRangeSeconds: Math.round(i.inRange),
      averageWatts: i.countWatts ? Math.round(i.sumWatts / i.countWatts) : null,
      rpe: u,
      complete: i.done
    };
    return g.push(p), de(Ot, g.slice(-150)), p;
  }
  function Bn() {
    if (!k || K) return null;
    const i = k;
    if (Gt(), k = null, O.hidden = !0, i.elapsed < 5) return null;
    ce = zt(i, null).id;
    const g = document.createElement("section");
    g.className = "coach-finish-review";
    const p = i.measured ? Math.round(i.inRange / i.measured * 100) : null;
    return g.innerHTML = "<h2>BREAKAWAY COACH / SESSION REVIEW</h2><p><strong>" + D(i.workout.name) + "</strong> · " + Math.round(i.elapsed / 60) + " minutes of " + Math.round(X(i.workout) / 60) + " planned</p><p>" + (p === null ? "No coached power adherence available." : "Time in prescribed power range: " + p + "% of measured time.") + '</p><p>How hard did the workout feel? Rate your overall effort.</p><div class="coach-rpe-buttons"><button type="button" data-coach-rpe="2">Easy</button><button type="button" data-coach-rpe="5">Moderate</button><button type="button" data-coach-rpe="8">Hard</button><button type="button" data-coach-rpe="10">Maximal</button></div><p id="coachReviewMessage">Feedback stays in this browser and informs your next suggested week.</p>', g.querySelectorAll("[data-coach-rpe]").forEach((w) => w.addEventListener("click", () => {
      const L = Number(w.dataset.coachRpe), G = Xe(), ie = G.slice().reverse().find((z) => z.id === ce);
      if (!ie) return;
      ie.rpe = L, de(Ot, G);
      const V = Ze(g, "coachReviewMessage");
      V.textContent = Kn(L), g.querySelectorAll("[data-coach-rpe]").forEach((z) => z.setAttribute("aria-pressed", String(z === w)));
    })), g;
  }
  function qn() {
    if (!k) return null;
    const i = Ve(k.workout, k.elapsed);
    return { name: k.workout.name, mode: k.mode, control: k.control, remaining: ut(i.remaining), target: xe(k.ftp, i.segment, k.adjusted), done: k.done };
  }
  return window.addEventListener("breakaway:history-updated", () => {
    vt();
  }), A = Ea(c("coachStrengthSettings"), { finished: () => {
    ne(), j("history");
  } }), xa(c("coachImportRoot")), le(), ne(), fa(c("coachHistoryImport"), { applySuggestion: (i) => {
    n = Ne({ ...n, ...i }), de(Ae, n), le(), ne();
  } }), { tick: _t, finish: Bn, endCoaching: ft, snapshot: qn, get mode() {
    return (k == null ? void 0 : k.mode) || null;
  }, get active() {
    return !!k;
  } };
}
export {
  Fa as mountCoach
};
