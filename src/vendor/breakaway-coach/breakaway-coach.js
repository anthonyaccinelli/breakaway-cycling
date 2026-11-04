const je = "breakaway.coach.profile.v1", mn = "breakaway.coach.history.v1", bt = { ftp: 200, hours: 5, days: 3, restDay: 6, goal: "fitness", experience: "beginner" };
function Ke(e) {
  const t = e && typeof e == "object" ? e : {}, n = (a, r, o, u) => typeof a == "number" && Number.isFinite(a) ? Math.min(o, Math.max(r, a)) : u;
  return {
    ftp: Math.round(n(t.ftp, 75, 550, bt.ftp)),
    hours: n(t.hours, 1, 20, bt.hours),
    days: Math.round(n(t.days, 2, 6, bt.days)),
    restDay: Math.round(n(t.restDay, 0, 6, bt.restDay)),
    goal: ["fitness", "ftp", "endurance", "race"].includes(String(t.goal)) ? t.goal : "fitness",
    experience: ["beginner", "intermediate", "advanced"].includes(String(t.experience)) ? t.experience : "beginner"
  };
}
const G = (e, t, n, a) => ({ name: e, minutes: t, low: n, high: a });
function rn(e) {
  const t = Ke(e), n = t.experience === "beginner", a = Math.max(20, Math.min(n ? 45 : t.experience === "intermediate" ? 75 : 110, Math.round(t.hours * 60 / t.days) - 15));
  return [
    {
      id: "recovery",
      name: "Recovery Spin",
      description: "Easy spinning and relaxed cadence.",
      category: "Recovery",
      segments: [G("Ease in", 5, 0.4, 0.5), G("Easy spin", n ? 15 : 25, 0.45, 0.58), G("Cool down", 5, 0.35, 0.45)]
    },
    {
      id: "endurance",
      name: "Aerobic Builder",
      description: "Build endurance with an achievable steady effort.",
      category: "Endurance",
      segments: [G("Warm up", 8, 0.45, 0.6), G("Zone 2 cruise", a, 0.56, 0.75), G("Cool down", 7, 0.4, 0.5)]
    },
    {
      id: "tempo",
      name: "Tempo Builder",
      description: "Practice sustained, controlled work with recovery.",
      category: "Tempo",
      segments: [G("Warm up", 10, 0.45, 0.65), G("Tempo 1", n ? 5 : 10, 0.76, 0.87), G("Recovery", 4, 0.45, 0.6), G("Tempo 2", n ? 5 : 10, 0.76, 0.87), G("Cool down", 6, 0.4, 0.5)]
    },
    {
      id: "sweetspot",
      name: "Sweet Spot Builder",
      description: "Develop sustainable power without maximal efforts.",
      category: "Threshold",
      segments: [G("Warm up", 10, 0.45, 0.7), G("Sweet Spot 1", 8, 0.88, 0.94), G("Recovery", 5, 0.45, 0.58), G("Sweet Spot 2", 8, 0.88, 0.94), G("Cool down", 8, 0.4, 0.55)]
    },
    {
      id: "vo2",
      name: "VO2 Intervals",
      description: "Short hard efforts separated by easy recovery.",
      category: "High intensity",
      segments: [G("Warm up", 10, 0.45, 0.7), G("Work 1", 3, 1.05, 1.15), G("Recovery 1", 4, 0.43, 0.55), G("Work 2", 3, 1.05, 1.15), G("Recovery 2", 4, 0.43, 0.55), G("Work 3", 3, 1.05, 1.15), G("Cool down", 8, 0.4, 0.5)]
    },
    {
      id: "preview",
      name: "Coach Test Ride",
      description: "A short session to try live coaching and trainer control.",
      category: "Test",
      segments: [G("Warm up", 2, 0.45, 0.55), G("Steady", 2, 0.65, 0.75), G("Recovery", 1, 0.4, 0.5), G("Tempo", 2, 0.77, 0.85), G("Cool down", 1, 0.4, 0.5)]
    }
  ];
}
function Z(e) {
  return Math.round(e.segments.reduce((t, n) => t + n.minutes * 60, 0));
}
function gt(e, t) {
  const n = Z(e), a = Math.max(0, Math.min(n, t));
  let r = 0;
  for (let o = 0; o < e.segments.length; o++) {
    const u = e.segments[o], i = r + u.minutes * 60;
    if (a < i || o === e.segments.length - 1)
      return { segment: u, index: o, remaining: Math.max(0, i - a), progress: Math.min(1, Math.max(0, (a - r) / (i - r))), total: n, done: t >= n };
    r = i;
  }
  throw Error("The workout must have at least one interval");
}
function _n(e, t) {
  const n = Math.max(0, Math.round(t.minutes * 60)), a = Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0"), r = Math.round(e * t.low), o = Math.round(e * t.high), u = Ve(e, t);
  return {
    duration: a,
    lowWatts: r,
    highWatts: o,
    target: u,
    range: r + "–" + o + " W",
    ftpRange: Math.round(t.low * 100) + "–" + Math.round(t.high * 100) + "% FTP"
  };
}
function Ve(e, t, n = 1) {
  const a = (t.low + t.high) / 2;
  return Math.max(30, Math.min(1e3, Math.round(e * a * n)));
}
function zn(e, t, n, a = 1) {
  return Number.isFinite(e) && e >= t * n.low * a * 0.95 && e <= t * n.high * a * 1.05;
}
function Aa(e) {
  return ["structured", "guided"];
}
function ua(e, t = !1) {
  const n = Ke(e), a = n.days === 2 ? [1, 4] : n.days === 3 ? [1, 3, 6] : n.days === 4 ? [1, 2, 4, 6] : n.days === 5 ? [0, 1, 3, 4, 6] : n.days === 6 ? [0, 1, 2, 3, 4, 6] : [0, 1, 2, 3, 4, 5, 6];
  if (n.days < 7 && a.includes(n.restDay)) {
    const o = Array.from({ length: 7 }, (u, i) => i).filter((u) => u !== n.restDay && !a.includes(u)).sort((u, i) => Math.abs(u - n.restDay) - Math.abs(i - n.restDay))[0];
    o !== void 0 && a.splice(a.indexOf(n.restDay), 1, o), a.sort((u, i) => u - i);
  }
  const r = n.experience === "beginner" ? "tempo" : n.goal === "race" ? "vo2" : "sweetspot";
  return Array.from({ length: 7 }, (o, u) => {
    const i = a.indexOf(u);
    if (i < 0) return { day: u, workoutId: null, reason: "Rest or optional easy movement" };
    const g = t ? i === 0 ? "recovery" : "endurance" : i === 0 ? r : i === a.length - 1 ? "endurance" : i % 3 === 0 ? "tempo" : i % 2 === 0 ? "recovery" : "endurance";
    return { day: u, workoutId: g, reason: t ? "Reduced intensity after a difficult session" : "Planned training session" };
  });
}
function yn(e, t, n = [], a = []) {
  const r = Ke(e), o = n.some((i) => Number.isFinite(i.start) && i.start <= t && t - i.start <= 36 * 36e5 && Number.isFinite(i.elapsed) && i.elapsed >= 1800 && i.avgPower !== null && Number.isFinite(i.avgPower) && i.avgPower >= r.ftp * 0.8), u = a.some((i) => Number.isFinite(i.date) && i.date <= t && t - i.date <= 48 * 36e5 && i.rpe !== null && i.rpe >= 9);
  return { demandingRide: o, veryHardFeedback: u, fatigued: o || u };
}
function Xn(e, t, n = [], a = [], r) {
  const o = Ke(e), u = t.getTime(), i = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(), g = (r == null ? void 0 : r.find((l) => l.day === t.getDay())) ?? ua(o, !1)[t.getDay()], m = n.filter((l) => Number.isFinite(l.start) && l.start <= u && Number.isFinite(l.elapsed) && l.elapsed > 0 && l.start >= u - 7 * 864e5), w = m.some((l) => l.start >= i && l.elapsed >= 900), { demandingRide: S, veryHardFeedback: I } = yn(o, u, m, a);
  if (w) return {
    workoutId: null,
    status: "completed",
    reason: "You already recorded a ride today. Coach is not stacking another prescribed session. Rest, or choose an optional workout."
  };
  if (!g.workoutId) return {
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
    workoutId: g.workoutId,
    status: "planned",
    reason: r && g.reason ? "Event-based plan: " + g.reason : "Your " + o.days + "-day weekly schedule calls for this session to support " + f[o.goal] + ". The recommendation uses your rider profile and basic scheduling rules."
  };
}
function Pt(e, t = 30) {
  const n = e.segments.reduce((w, S) => w + S.minutes, 0), a = Math.max(12, Math.min(t, n));
  if (n <= a) return e;
  const r = e.segments.length;
  if (r >= a) return e;
  const o = a - r, u = e.segments.map((w) => Math.max(0, w.minutes - 1)), i = u.reduce((w, S) => w + S, 0), g = e.segments.map((w, S) => ({
    ...w,
    minutes: Math.max(1, Math.floor((1 + (i ? u[S] / i * o : 0)) * 2) / 2)
  }));
  let m = g.reduce((w, S) => w + S.minutes, 0);
  for (let w = 0; m + 0.5 <= a; w = (w + 1) % g.length)
    g[w].minutes += 0.5, m += 0.5;
  return {
    ...e,
    id: e.id + "-short",
    name: e.name + " · Short",
    segments: g,
    description: "Shortened version: " + e.description
  };
}
function xa(e) {
  return e === null ? "Rate how the session felt so future recommendations have more context." : e >= 9 ? "That felt very hard. Consider recovery or rest next; do not stack another demanding workout." : e >= 7 ? "Challenging session completed. Check your fatigue before the next hard effort." : e <= 3 ? "Comfortable effort. Keep building consistency rather than chasing extra intensity." : "Good training. Keep the next session aligned with your weekly plan.";
}
const ot = (e) => typeof e == "number" && Number.isFinite(e), Et = (e) => {
  if (e == null || e === "") return null;
  const t = Number(e);
  return ot(t) ? t : null;
}, ae = (e, t = 1e8) => {
  const n = Et(e);
  return n !== null && n >= 0 && n <= t ? n : null;
}, we = (e, t = 1e8) => {
  const n = Et(e);
  return n !== null && n > 0 && n <= t ? n : null;
}, jt = (e) => {
  if (e instanceof Date) return Number.isFinite(e.getTime()) ? e.getTime() : null;
  if (typeof e == "number") return Number.isFinite(e) && e > 1e11 ? e : null;
  if (typeof e != "string" || !e.trim()) return null;
  const t = Date.parse(e);
  return Number.isFinite(t) ? t : null;
};
function Zn(...e) {
  for (const t of e) {
    const n = Et(t);
    if (n !== null) return n;
  }
  return null;
}
function wn(e) {
  const t = String(e ?? "").trim().toLowerCase().replace(/[\s_-]/g, "");
  return ["ride", "cycling", "biking", "2", "virtualride", "virtualcycling", "ebikeride", "mountainbikeride", "gravelride", "handcycle", "velomobile", "e-mountainbikeride", "emtbride"].includes(t);
}
function Na(e) {
  return typeof e == "string" && e.trim() ? e.trim().slice(0, 120) : "Cycling activity";
}
function La(e) {
  const t = we(e.duration, 604800), n = jt(e.start);
  if (n === null || n < 9466848e5 || n > Date.now() + 864e5 || t === null || t < 60) throw Error("Invalid ride date or duration.");
  if (!["FIT", "TCX", "GPX", "CSV"].includes(e.source)) throw Error("Unknown recording format.");
  const a = ae(e.avgPower, 2500), r = ae(e.avgHeartRate, 240), o = ae(e.avgCadence, 250), u = ae(e.best20minWatts, 2e3), i = ae(e.distanceMeters, 1e7), g = ae(e.elevationMeters, 1e5), m = we(e.movingSeconds, 7 * 86400);
  return {
    key: e.stravaId ? "strava:" + e.stravaId : "ride:" + Math.round(n / 1e3) + ":" + Math.round(t),
    stravaId: e.stravaId ? String(e.stravaId).slice(0, 30) : null,
    name: Na(e.name),
    start: n,
    duration: Math.round(t),
    movingSeconds: m === null ? null : Math.round(Math.min(t, m)),
    distanceMeters: i,
    elevationMeters: g,
    avgPower: a,
    avgHeartRate: r,
    avgCadence: o,
    best20minWatts: u,
    source: e.source,
    indoor: !!e.indoor
  };
}
function Sn(e, t) {
  return La({
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
function tt(e, ...t) {
  for (const n of t) {
    const a = jt(e[n]);
    if (a !== null) return a;
  }
  return null;
}
function ha(e) {
  let t = [], n = 0, a = 0, r = 0, o = 0;
  for (let u = 1; u < e.length; u++) {
    const i = e[u - 1], g = e[u], m = (g.t - i.t) / 1e3;
    if (!(!ot(m) || m <= 0)) {
      if (m > 10) {
        t = [], n = 0, a = 0, r = 0;
        continue;
      }
      if (!(!ot(i.power) || i.power < 0 || i.power > 2e3)) {
        for (t.push({ duration: m, power: i.power }), a += m, r += m * i.power; a > 1200 && n < t.length; ) {
          const w = t[n], S = a - 1200;
          w.duration <= S + 1e-8 ? (a -= w.duration, r -= w.duration * w.power, n++) : (w.duration -= S, a -= S, r -= S * w.power);
        }
        n > 200 && (t = t.slice(n), n = 0), a >= 1199.9 && (o = Math.max(o, r / a));
      }
    }
  }
  return o > 0 ? Math.round(o) : null;
}
function Oa(e, t = "Activity.fit", n, a = null) {
  var F;
  const r = e.sessions || e.sessionMesgs || (e.session ? [e.session] : []), o = Array.isArray(r) ? r[0] : null;
  if (!o) throw Error("FIT activity has no session.");
  const u = o.sport ?? e.sport ?? ((F = e.file_id) == null ? void 0 : F.sport);
  if (!wn(u)) throw Error("Not a cycling activity.");
  const i = e.records || e.recordMesgs || [], g = Array.isArray(i) ? i : [];
  if (g.length > 16e4) throw Error("FIT activity has too many samples.");
  const m = tt(o, "start_time", "startTime") ?? tt(e, "start_time", "startTime") ?? (g.length ? tt(g[0], "timestamp") : null), w = tt(o, "timestamp") ?? (g.length ? tt(g[g.length - 1], "timestamp") : null), S = Zn(o.total_elapsed_time, o.totalElapsedTime, o.total_timer_time, o.totalTimerTime), I = S && S > 0 ? S : m !== null && w !== null ? (w - m) / 1e3 : 0, f = g.map((V) => ({ t: tt(V, "timestamp") ?? NaN, power: Zn(V.power, V.watts) ?? NaN })).filter((V) => ot(V.t));
  let l = 0, E = 0, T = 0, x = 0, C = 0, A = 0;
  for (const V of g) {
    const O = ae(V.power ?? V.watts, 2500);
    O !== null && (l += O, E++);
    const M = we(V.heart_rate ?? V.heartRate, 240);
    M !== null && (T += M, x++);
    const ve = we(V.cadence, 250);
    ve !== null && (C += ve, A++);
  }
  const Y = String(o.sub_sport ?? o.subSport ?? "").toLowerCase();
  return Sn("FIT", {
    name: n || t,
    start: m ?? 0,
    duration: I,
    stravaId: a,
    indoor: /indoor|virtual|trainer/.test(Y),
    movingSeconds: we(o.total_timer_time ?? o.totalTimerTime, 7 * 86400),
    distanceMeters: ae(o.total_distance ?? o.totalDistance, 1e7),
    elevationMeters: ae(o.total_ascent ?? o.totalAscent, 1e5),
    avgPower: ae(o.avg_power ?? o.avgPower, 2500) ?? (E ? l / E : null),
    avgHeartRate: we(o.avg_heart_rate ?? o.avgHeartRate, 240) ?? (x ? T / x : null),
    avgCadence: we(o.avg_cadence ?? o.avgCadence, 250) ?? (A ? C / A : null),
    best20minWatts: ha(f)
  });
}
const Ht = (e, t) => Array.from(e.getElementsByTagNameNS("*", t));
function Ne(e, ...t) {
  var n;
  for (const a of t) {
    const r = e.getElementsByTagNameNS("*", a)[0];
    if ((n = r == null ? void 0 : r.textContent) != null && n.trim()) return r.textContent.trim();
  }
  return null;
}
function Pa(e, ...t) {
  const n = Ne(e, ...t);
  return n ? jt(n) : null;
}
const $n = (e) => e === null ? null : Et(e);
function Ha(e, t) {
  if (e.lat === null || e.lon === null || t.lat === null || t.lon === null) return 0;
  const n = Math.PI / 180, a = (t.lat - e.lat) * n, r = (t.lon - e.lon) * n, o = Math.sin(a / 2) ** 2 + Math.cos(e.lat * n) * Math.cos(t.lat * n) * Math.sin(r / 2) ** 2;
  return 12742e3 * Math.asin(Math.min(1, Math.sqrt(o)));
}
function Fa(e, t = "Activity.gpx", n, a = null) {
  var C;
  if (/<!DOCTYPE|<!ENTITY/i.test(e)) throw Error("XML DTD or entity declarations are not supported.");
  const r = new DOMParser().parseFromString(e, "application/xml");
  if (!r.documentElement || Ht(r.documentElement, "parsererror").length) throw Error("Invalid activity XML.");
  const o = /\.tcx$/i.test(t), u = Ht(r.documentElement, o ? "Trackpoint" : "trkpt");
  if (u.length < 2 || u.length > 16e4) throw Error("Activity needs timestamped ride samples.");
  if (o) {
    const A = Ht(r.documentElement, "Activity");
    if (A.length !== 1 || !wn(A[0].getAttribute("Sport"))) throw Error("Not a single cycling TCX activity.");
  }
  const i = [];
  for (const A of u) {
    const Y = Pa(A, o ? "Time" : "time");
    if (Y === null) continue;
    const F = o ? Ht(A, "Position")[0] : null;
    i.push({
      t: Y,
      hr: we(Ne(A, "HeartRateBpm", "Value", "hr"), 240),
      power: ae(Ne(A, "Watts", "watts", "PowerInWatts", "power"), 2500) ?? NaN,
      cad: we(Ne(A, "Cadence", "cad", "RunCadence"), 250),
      ele: Et(Ne(A, "AltitudeMeters", "ele")),
      distance: ae(Ne(A, "DistanceMeters", "distance"), 1e7),
      lat: $n(o ? F ? Ne(F, "LatitudeDegrees") : null : A.getAttribute("lat")),
      lon: $n(o ? F ? Ne(F, "LongitudeDegrees") : null : A.getAttribute("lon"))
    });
  }
  if (i.length < 2) throw Error("No timestamped GPS/trackpoint data.");
  i.sort((A, Y) => A.t - Y.t);
  let g = 0, m = 0;
  for (let A = 1; A < i.length; A++) {
    const Y = i[A - 1], F = i[A], V = F.distance !== null && Y.distance !== null && F.distance >= Y.distance ? F.distance - Y.distance : Ha(Y, F);
    V >= 0 && V < 5e3 && (g += V), Y.ele !== null && F.ele !== null && F.ele > Y.ele && F.ele - Y.ele < 200 && (m += F.ele - Y.ele);
  }
  const w = (i[i.length - 1].t - i[0].t) / 1e3;
  let S = 0, I = 0, f = 0, l = 0, E = 0, T = 0;
  for (const A of i)
    ot(A.power) && (S += A.power, I++), A.hr !== null && (f += A.hr, l++), A.cad !== null && (E += A.cad, T++);
  const x = Ne(r.documentElement, "name");
  return Sn(o ? "TCX" : "GPX", {
    name: n || x || t,
    start: i[0].t,
    duration: w,
    stravaId: a,
    distanceMeters: g || ((C = i.at(-1)) == null ? void 0 : C.distance) || null,
    elevationMeters: m || null,
    movingSeconds: null,
    avgPower: I ? S / I : null,
    avgHeartRate: l ? f / l : null,
    avgCadence: T ? E / T : null,
    best20minWatts: ha(i.filter((A) => ot(A.power)).map((A) => ({ t: A.t, power: A.power })))
  });
}
function Wa(e, t = 1e5) {
  var u;
  if (e.length > 32 * 1024 * 1024) throw Error("CSV index is too large.");
  const n = [];
  let a = [], r = "", o = !1;
  for (let i = 0; i < e.length; i++) {
    const g = e[i];
    if (g === '"')
      o && e[i + 1] === '"' ? (r += '"', i++) : o = !o;
    else if (g === "," && !o)
      a.push(r), r = "";
    else if ((g === `
` || g === "\r") && !o) {
      if (g === "\r" && e[i + 1] === `
` && i++, a.push(r), r = "", a.some((m) => m.trim()) && n.push(a), a = [], n.length > t) throw Error("Too many activities in CSV.");
    } else r += g;
  }
  if (o) throw Error("Unclosed quoted field in CSV.");
  return a.push(r), a.some((i) => i.trim()) && n.push(a), (u = n[0]) != null && u[0] && (n[0][0] = n[0][0].replace(/^\uFEFF/, "")), n;
}
function Ya(e) {
  const t = Wa(e), n = (t.shift() || []).map((o) => o.toLowerCase().replace(/\s/g, "").replace(/[^a-z0-9]/g, "")), a = (o, ...u) => {
    for (const i of u) {
      const g = n.indexOf(i);
      if (g >= 0) return o[g] || "";
    }
    return "";
  }, r = [];
  for (const o of t) {
    if (!wn(a(o, "activitytype", "type", "sporttype"))) continue;
    const u = jt(a(o, "activitydate", "startdate", "startdatetime"));
    if (u === null) continue;
    const i = we(a(o, "elapsedtime", "movingtime"), 7 * 86400);
    if (i !== null)
      try {
        const g = a(o, "activityid") || null, m = a(o, "filename") || null, w = Sn("CSV", {
          name: a(o, "activityname", "name") || "Ride",
          start: u,
          duration: i,
          stravaId: g,
          indoor: /virtual/.test(a(o, "activitytype", "type").toLowerCase()),
          movingSeconds: we(a(o, "movingtime"), 7 * 86400),
          distanceMeters: ae(a(o, "distance"), 1e7),
          elevationMeters: ae(a(o, "elevationgain"), 1e5),
          avgPower: ae(a(o, "averagewatts", "avgpower"), 2500),
          avgHeartRate: ae(a(o, "averageheartrate"), 240),
          avgCadence: ae(a(o, "averagecadence"), 250)
        });
        r.push({ ride: w, file: m });
      } catch {
      }
  }
  return r;
}
function qa(e, t) {
  if (e.stravaId && t.stravaId && e.stravaId === t.stravaId) return !0;
  const n = Math.min(300, Math.max(90, Math.min(e.duration, t.duration) * 0.07));
  return Math.abs(e.start - t.start) > 12e4 || Math.abs(e.duration - t.duration) > n ? !1 : e.distanceMeters !== null && t.distanceMeters !== null ? Math.abs(e.distanceMeters - t.distanceMeters) <= Math.max(500, Math.min(e.distanceMeters, t.distanceMeters) * 0.08) : !0;
}
const Jn = (e) => ({ FIT: 4, TCX: 3, GPX: 2, CSV: 1 })[e];
function Ba(e, t) {
  const n = (u) => [u.avgPower, u.best20minWatts, u.avgHeartRate, u.avgCadence, u.distanceMeters, u.elevationMeters].filter((i) => i !== null).length, a = n(t) > n(e) || n(t) === n(e) && Jn(t.source) > Jn(e.source), r = a ? t : e, o = a ? e : t;
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
function pa(e, t) {
  const n = [...e];
  let a = 0, r = 0, o = 0;
  for (const u of t) {
    const i = n.findIndex((g) => qa(g, u));
    if (i >= 0) {
      o++;
      const g = Ba(n[i], u);
      JSON.stringify(g) !== JSON.stringify(n[i]) && (n[i] = g, r++);
    } else
      n.push(u), a++;
  }
  return n.sort((u, i) => i.start - u.start), { rides: n, added: a, updated: r, duplicates: o };
}
function Ua(e, t = Date.now()) {
  var u;
  const n = Array.from({ length: 8 }, (i, g) => {
    const m = new Date(t);
    return m.setHours(0, 0, 0, 0), m.setDate(m.getDate() - m.getDay() - (7 - g) * 7), { start: m.getTime(), hours: 0, rides: 0 };
  });
  for (const i of e) for (const g of n) if (i.start >= g.start && i.start < g.start + 6048e5) {
    g.hours += i.duration / 3600, g.rides++;
    break;
  }
  const a = n.reduce((i, g) => i + g.hours, 0) / 8, r = e.filter((i) => i.start <= t && i.start > t - 56 * 864e5), o = e.filter((i) => i.start > t - 120 * 864e5 && i.start <= t).reduce((i, g) => g.best20minWatts !== null && (i === null || g.best20minWatts > i) ? g.best20minWatts : i, null);
  return {
    total: e.length,
    recent: r.length,
    weeklyHours: Math.round(a * 10) / 10,
    weeks: n,
    suggestedFtp: o !== null && o > 100 ? Math.round(o * 0.95) : null,
    powerRides: e.filter((i) => i.avgPower !== null).length,
    latest: ((u = e[0]) == null ? void 0 : u.start) ?? null,
    allHours: Math.round(e.reduce((i, g) => i + g.duration / 3600, 0))
  };
}
const Ga = "breakaway.account.owner.v1";
let ja = "";
function Va(e) {
  let t = ja;
  try {
    t || (t = localStorage.getItem(Ga) || "");
  } catch {
  }
  return t ? e + "-" + t : e;
}
const Ka = "breakaway-coach-training-history-v1", Fe = "rides", _a = 1, ga = 600 * 1024 * 1024, at = 32 * 1024 * 1024, Qn = 32 * 1024 * 1024, vn = 1e4, fn = new TextDecoder("utf-8", { fatal: !1 });
function kn() {
  return new Promise((e, t) => {
    if (!("indexedDB" in window)) {
      t(Error("This browser does not support local history storage."));
      return;
    }
    const n = indexedDB.open(Va(Ka), _a);
    n.onupgradeneeded = () => {
      n.result.objectStoreNames.contains(Fe) || n.result.createObjectStore(Fe, { keyPath: "key" });
    }, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error || Error("Could not open local history database."));
  });
}
async function ma() {
  const e = await kn();
  try {
    return await new Promise((t, n) => {
      const a = e.transaction(Fe, "readonly"), r = a.objectStore(Fe).getAll();
      r.onsuccess = () => t(r.result.sort((o, u) => u.start - o.start)), r.onerror = () => n(r.error || Error("Could not read history."));
    });
  } finally {
    e.close();
  }
}
async function za(e) {
  if (e.length > 15e3) throw Error("Local activity limit reached. Contact support before importing more rides.");
  const t = await kn();
  try {
    return await new Promise((n, a) => {
      const r = t.transaction(Fe, "readwrite"), o = r.objectStore(Fe);
      o.clear();
      for (const u of e) o.put(u);
      r.oncomplete = () => n(), r.onerror = () => a(r.error || Error("Could not save imported activities.")), r.onabort = () => a(r.error || Error("Activity import was rolled back."));
    });
  } finally {
    t.close();
  }
}
async function Xa() {
  const e = await kn();
  try {
    return await new Promise((t, n) => {
      const a = e.transaction(Fe, "readwrite");
      a.objectStore(Fe).clear(), a.oncomplete = () => t(), a.onerror = () => n(a.error || Error("Unable to clear history."));
    });
  } finally {
    e.close();
  }
}
function ke(e, t) {
  if (t < 0 || t + 2 > e.byteLength) throw Error("Truncated ZIP file.");
  return e.getUint16(t, !0);
}
function xe(e, t) {
  if (t < 0 || t + 4 > e.byteLength) throw Error("Truncated ZIP file.");
  return e.getUint32(t, !0);
}
function Za(e) {
  if (e.byteLength > ga) throw Error("This archive exceeds the 600 MB preview limit. Import smaller batches of FIT, TCX, or GPX files.");
  const t = new DataView(e.buffer, e.byteOffset, e.byteLength);
  let n = -1;
  for (let g = e.length - 22; g >= Math.max(0, e.length - 22 - 65535); g--)
    if (xe(t, g) === 101010256 && g + 22 + ke(t, g + 20) <= e.length) {
      n = g;
      break;
    }
  if (n < 0) throw Error("Not a valid ZIP archive or its directory is missing.");
  const a = ke(t, n + 10), r = xe(t, n + 12), o = xe(t, n + 16);
  if (a === 65535 || o === 4294967295 || r === 4294967295 || ke(t, n + 4) !== 0) throw Error("Multi-disk or ZIP64 archives are not supported in this preview.");
  if (a > vn || o + r > e.length) throw Error("ZIP directory exceeds safe limits.");
  const u = [];
  let i = o;
  for (let g = 0; g < a; g++) {
    if (xe(t, i) !== 33639248) throw Error("Invalid ZIP directory entry.");
    const m = ke(t, i + 8), w = ke(t, i + 10), S = xe(t, i + 16), I = xe(t, i + 20), f = xe(t, i + 24), l = ke(t, i + 28), E = ke(t, i + 30), T = ke(t, i + 32), x = xe(t, i + 42), C = i + 46 + l + E + T;
    if (C > e.length) throw Error("Truncated ZIP entry.");
    const A = fn.decode(e.subarray(i + 46, i + 46 + l));
    if (i = C, x === 4294967295) continue;
    if (xe(t, x) !== 67324752) throw Error("Invalid ZIP member offset.");
    const Y = x + 30 + ke(t, x + 26) + ke(t, x + 28);
    if (Y + I > e.length) throw Error("Truncated ZIP member data.");
    u.push({ name: A, compressed: I, expanded: f, method: w, crc: S, start: Y, encrypted: !!(m & 1) });
  }
  return u;
}
const $a = (() => {
  const e = new Uint32Array(256);
  for (let t = 0; t < 256; t++) {
    let n = t;
    for (let a = 0; a < 8; a++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
    e[t] = n >>> 0;
  }
  return e;
})();
function Ja(e) {
  let t = 4294967295;
  for (const n of e) t = $a[(t ^ n) & 255] ^ t >>> 8;
  return (t ^ 4294967295) >>> 0;
}
async function ya(e, t, n) {
  if (typeof DecompressionStream > "u") throw Error("Compressed archives require a current Chrome or Edge browser.");
  let a;
  try {
    a = new Blob([new Uint8Array(e)]).stream().pipeThrough(new DecompressionStream(t));
  } catch {
    throw Error("This browser cannot expand " + t + " files. Try a recent Chrome or Edge.");
  }
  const r = a.getReader(), o = [];
  let u = 0;
  try {
    for (; ; ) {
      const { value: m, done: w } = await r.read();
      if (w) break;
      if (m) {
        if (u += m.byteLength, u > n)
          throw await r.cancel(), Error("Decompressed activity exceeds the safe file size limit.");
        o.push(m);
      }
    }
  } finally {
    r.releaseLock();
  }
  const i = new Uint8Array(u);
  let g = 0;
  for (const m of o)
    i.set(m, g), g += m.length;
  return i;
}
async function ea(e, t) {
  if (t.encrypted) throw Error("Encrypted archive entries are unsupported.");
  if (t.expanded > at) throw Error("Activity is larger than the 32 MB per-file limit.");
  if (t.method !== 0 && t.method !== 8) throw Error("Unsupported ZIP compression method: " + t.method);
  const n = e.subarray(t.start, t.start + t.compressed), a = t.method === 0 ? new Uint8Array(n) : await ya(n, "deflate-raw", at);
  if (a.length !== t.expanded || Ja(a) !== t.crc) throw Error("ZIP member failed integrity verification.");
  return a;
}
const ta = (e) => /\.(fit|tcx|gpx)(\.gz)?$/i.test(e), na = (e) => /(^|\/)activities\.csv$/i.test(e), mt = (e) => e.trim().replace(/\\/g, "/").replace(/^\.?\//, "").toLowerCase(), Qa = () => new Promise((e) => setTimeout(e, 0));
async function eo(e, t) {
  return /\.gz$/i.test(e) ? ya(t, "gzip", at) : t;
}
async function to(e, t = () => {
}) {
  if (!e.length) throw Error("Choose an activity archive or individual ride files.");
  if (e.length > vn) throw Error("Select fewer than 10,000 files at a time.");
  const n = [], a = [];
  let r = 0;
  for (const l of e)
    if (/\.zip$/i.test(l.name)) {
      if (r++, l.size > ga) throw Error("This ZIP archive exceeds the 600 MB preview limit.");
      const E = new Uint8Array(await l.arrayBuffer());
      for (const T of Za(E)) {
        const x = mt(T.name);
        na(x) && T.expanded <= Qn ? a.push({ name: T.name, bytes: () => ea(E, T) }) : ta(x) && /(^|\/)activities\//i.test(x) && T.expanded <= at && n.push({ name: T.name, bytes: () => ea(E, T) });
      }
    } else na(l.name) && l.size <= Qn ? a.push({ name: l.name, bytes: async () => new Uint8Array(await l.arrayBuffer()) }) : ta(l.name) && l.size <= at && n.push({ name: l.name, bytes: async () => new Uint8Array(await l.arrayBuffer()) });
  if (!n.length && !a.length) throw Error("No supported cycling recordings or activities.csv were found.");
  if (n.length > vn) throw Error("There are too many activity files in this archive.");
  const o = [], u = [];
  let i = 0, g = 0, m = 0;
  for (const l of a)
    try {
      o.push(...Ya(fn.decode(await l.bytes())));
    } catch (E) {
      u.push("activities.csv: " + String(E instanceof Error ? E.message : E));
    }
  const w = /* @__PURE__ */ new Map();
  for (const l of o) l.file && (w.set(mt(l.file), l), w.set(mt(l.file).split("/").pop() || "", l));
  const S = [], I = n.length;
  t({ done: m, total: I, current: "Reading activity files", accepted: 0, skipped: i });
  for (const l of n) {
    try {
      const E = await eo(l.name, await l.bytes());
      if (E.byteLength > at) throw Error("Activity exceeds 32 MB.");
      const T = w.get(mt(l.name)) || w.get(mt(l.name).split("/").pop() || ""), x = l.name.replace(/^.*\//, "").replace(/\.(fit|gpx|tcx)(\.gz)?$/i, "");
      let C;
      if (/\.fit(\.gz)?$/i.test(l.name)) {
        const A = "/coach-fit-decoder.js", { decodeFIT: Y } = await import(
          /* @vite-ignore */
          A
        );
        C = Oa(await Y(E), x, T == null ? void 0 : T.ride.name, (T == null ? void 0 : T.ride.stravaId) ?? null);
      } else C = Fa(fn.decode(E), x.replace(/\.gz$/i, ""), T == null ? void 0 : T.ride.name, (T == null ? void 0 : T.ride.stravaId) ?? null);
      S.push(C), g++;
    } catch (E) {
      i++, u.length < 15 && u.push(l.name.slice(-80) + ": " + String(E instanceof Error ? E.message : E));
    }
    m++, (m % 5 === 0 || m === I) && (t({ done: m, total: I, current: l.name.slice(-70), accepted: g, skipped: i }), await Qa());
  }
  return { rides: pa([], S.concat(o.map((l) => l.ride))).rides, read: g, skipped: i, errors: u, csvRides: o.length, archives: r };
}
const no = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, R = (e) => e.replace(/[&<>"']/g, (t) => no[t]), ne = (e) => {
  try {
    return JSON.parse(localStorage.getItem(e) || "null");
  } catch {
    return null;
  }
}, pe = (e, t) => {
  try {
    return localStorage.setItem(e, JSON.stringify(t)), !0;
  } catch {
    return !1;
  }
}, Le = (e) => [e.getFullYear(), String(e.getMonth() + 1).padStart(2, "0"), String(e.getDate()).padStart(2, "0")].join("-"), St = (e) => {
  if (typeof e != "string") return "";
  const t = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(e);
  if (!t) return "";
  const n = Number(t[1]), a = Number(t[2]), r = Number(t[3]), o = new Date(n, a - 1, r);
  return o.getFullYear() !== n || o.getMonth() + 1 !== a || o.getDate() !== r ? "" : [t[1], String(a).padStart(2, "0"), String(r).padStart(2, "0")].join("-");
};
function ao(e, t) {
  let n = [], a = null, r = !1;
  e.innerHTML = '<div class="coach-section-top"><span class="coach-tag">05 / RIDER HISTORY</span><span class="coach-tag">YOUR FILES · YOUR DEVICE</span></div><h2>BRING YOUR HISTORY.</h2><p class="coach-small">Import your Strava account export or original cycling recordings. No Strava account connection, API, or server upload.</p><div class="coach-history-import-zone" id="coachImportZone" tabindex="0" role="group" aria-label="Choose a Strava archive or ride files"><div class="coach-upload-icon">⇧</div><strong>DROP A STRAVA ZIP OR RIDE FILES HERE</strong><span>ZIP · activities.csv · FIT · TCX · GPX · FIT.GZ · TCX.GZ · GPX.GZ</span><label for="coachImportFiles" class="coach-upload-button">CHOOSE FILES</label><input id="coachImportFiles" type="file" multiple accept=".zip,.csv,.fit,.tcx,.gpx,.gz" hidden></div><div class="coach-import-stage" id="coachImportStage" aria-live="polite"></div><div id="coachHistoryStats"><p class="coach-small">Loading saved activities…</p></div><p class="coach-small coach-history-privacy">The browser reads activity files locally. Only summarized ride metrics are saved in this browser’s IndexedDB; GPS tracks and original files are not retained. Imported history is not uploaded, synced or used by a hosted AI model.</p><div class="coach-history-footer"><button type="button" id="coachHistoryClear">CLEAR IMPORTED HISTORY</button><a href="https://support.strava.com/en-us/articles/15401919-how-do-i-export-my-strava-data" rel="noopener noreferrer" target="_blank">How to export from Strava ↗</a></div>';
  const o = (l) => e.querySelector("#" + l), u = o("coachImportFiles"), i = o("coachImportStage"), g = o("coachImportZone"), m = o("coachHistoryClear");
  function w() {
    var T, x;
    const l = Ua(n), E = l.weeks.map((C, A) => ({ hours: C.hours, week: new Date(C.start).toLocaleDateString(void 0, { month: "short", day: "numeric" }), height: Math.max(2, Math.round(C.hours / Math.max(1, ...l.weeks.map((Y) => Y.hours)) * 100)), index: A }));
    o("coachHistoryStats").innerHTML = '<div class="coach-history-stats"><div><strong>' + l.total.toLocaleString() + "</strong><span>Historical rides</span></div><div><strong>" + l.weeklyHours.toFixed(1) + " h</strong><span>Avg / week · last 8 weeks</span></div><div><strong>" + l.powerRides.toLocaleString() + '</strong><span>Rides with power</span></div></div><div class="coach-history-bars" role="img" aria-label="Training hours in the last eight calendar weeks">' + E.map((C) => '<div class="coach-history-bar-wrap"><span>' + C.hours.toFixed(1) + 'h</span><div class="coach-history-bar-track"><div style="height:' + C.height + '%"></div></div><small>' + R(C.week) + "</small></div>").join("") + '</div><div class="coach-history-insights"><div><strong>RECENT TRAINING VOLUME</strong><p>' + l.weeklyHours.toFixed(1) + " hours per week on average over the past eight calendar weeks.</p></div><div><strong>POWER HISTORY</strong><p>" + (l.suggestedFtp === null ? "Not enough recent 20-minute recorded power for an FTP estimate." : "Candidate FTP ~" + l.suggestedFtp + " W, calculated as 95% of the best recorded 20-minute power in the last 120 days. Confirm with an FTP test.") + "</p></div></div>" + (l.total ? '<div class="coach-history-suggestions">' + (l.weeklyHours >= 1 ? '<button id="coachUseHours" type="button">USE ' + Math.min(20, Math.max(1, Math.round(l.weeklyHours * 2) / 2)) + " H/WEEK</button>" : "") + (l.suggestedFtp !== null ? '<button id="coachUseFtp" type="button">REVIEW FTP ' + l.suggestedFtp + " W</button>" : "") + "</div>" : "") + (l.total ? '<div class="coach-history-latest"><strong>LATEST IMPORTS</strong>' + n.slice(0, 5).map((C) => "<div><span>" + R(new Date(C.start).toLocaleDateString()) + " · " + R(C.name) + "</span><small>" + R(C.source) + " · " + Math.round(C.duration / 60) + " min</small></div>").join("") + "</div>" : '<p class="coach-small">No imported rides yet. Upload your Strava archive to see fitness history here.</p>'), (T = o("coachUseHours")) == null || T.addEventListener("click", () => {
      l.weeklyHours < 1 || (t.applySuggestion({ hours: Math.min(20, Math.max(1, Math.round(l.weeklyHours * 2) / 2)) }), i.textContent = "Weekly training hours updated in your Coach profile. You can edit them anytime.");
    }), (x = o("coachUseFtp")) == null || x.addEventListener("click", () => {
      l.suggestedFtp !== null && confirm("Apply the historical FTP estimate of " + l.suggestedFtp + " W to Coach? This is not a substitute for an FTP test.") && (t.applySuggestion({ ftp: l.suggestedFtp }), i.textContent = "FTP updated in Coach. Verify your training zones with a recent test.");
    });
  }
  async function S() {
    try {
      n = await ma(), w();
    } catch (l) {
      o("coachHistoryStats").textContent = "Could not open local history: " + String(l instanceof Error ? l.message : l);
    }
  }
  function I(l) {
    const E = pa(n, l.rides), T = E.added, x = E.updated;
    i.innerHTML = '<div class="coach-import-result"><strong>READY TO SAVE · ' + T + " NEW RIDES</strong><p>" + l.read + " recordings parsed · " + l.csvRides + " CSV cycling rows · " + l.skipped + " files skipped · " + x + " existing rides enhanced · " + E.duplicates + " duplicates matched.</p>" + (l.errors.length ? "<details><summary>Import warnings (" + l.errors.length + " shown)</summary><ul>" + l.errors.map((C) => "<li>" + R(C) + "</li>").join("") + "</ul></details>" : "") + '<div class="coach-import-actions"><button type="button" id="coachConfirmImport">SAVE HISTORY TO THIS DEVICE</button><button type="button" id="coachCancelImport">CANCEL</button></div></div>', a = E.rides, o("coachConfirmImport").addEventListener("click", async () => {
      if (!a || r) return;
      r = !0;
      const C = a, A = o("coachConfirmImport");
      A.disabled = !0;
      try {
        await za(C), n = C, a = null, i.textContent = "Saved " + T + " new rides and enhanced " + x + " activities on this device.", w(), window.dispatchEvent(new Event("breakaway:history-updated"));
      } catch (Y) {
        i.textContent = "Save failed (nothing was changed): " + String(Y instanceof Error ? Y.message : Y);
      } finally {
        r = !1;
      }
    }), o("coachCancelImport").addEventListener("click", () => {
      a = null, i.textContent = "Import canceled. Your saved history was not changed.";
    });
  }
  async function f(l) {
    if (!(r || !l.length)) {
      r = !0, a = null, m.disabled = !0, g.setAttribute("aria-busy", "true"), i.textContent = "Reading activity files locally…";
      try {
        const E = await to(l, (T) => {
          i.textContent = "Reading " + T.done + " / " + T.total + " files · " + T.accepted + " cycling recordings · " + T.skipped + " skipped";
        });
        E.rides.length ? I(E) : i.textContent = "No valid cycling rides were found. " + (E.errors[0] || "Try a Strava archive or individual activity recordings.");
      } catch (E) {
        i.textContent = "Import could not finish: " + String(E instanceof Error ? E.message : E);
      } finally {
        r = !1, m.disabled = !1, g.removeAttribute("aria-busy"), u.value = "";
      }
    }
  }
  u.addEventListener("change", () => void f(Array.from(u.files || [])));
  for (const l of ["dragenter", "dragover"]) g.addEventListener(l, (E) => {
    E.preventDefault(), g.classList.add("coach-drop-active");
  });
  return g.addEventListener("dragleave", (l) => {
    l.preventDefault(), g.classList.remove("coach-drop-active");
  }), g.addEventListener("drop", (l) => {
    var T;
    l.preventDefault(), g.classList.remove("coach-drop-active");
    const E = Array.from(((T = l.dataTransfer) == null ? void 0 : T.files) || []);
    f(E);
  }), g.addEventListener("keydown", (l) => {
    l.target === g && l.key === "Enter" && (l.preventDefault(), u.click());
  }), m.addEventListener("click", async () => {
    if (!r && confirm("Delete all historical rides imported into Breakaway Coach on this device? Your original Strava files are not affected.")) {
      r = !0, m.disabled = !0;
      try {
        await Xa(), a = null, n = [], i.textContent = "Imported history deleted from this device.", w(), window.dispatchEvent(new Event("breakaway:history-updated"));
      } catch (l) {
        i.textContent = "Delete failed: " + String(l instanceof Error ? l.message : l);
      } finally {
        r = !1, m.disabled = !1;
      }
    }
  }), S(), { reload: S };
}
const aa = "breakaway.coach.strength.settings.v1", oa = "breakaway.coach.strength.history.v1", va = { enabled: !1, equipment: ["bodyweight"], experience: "beginner", sessions: 1, minutes: 30, notes: "" }, fa = [
  { id: "bodyweight", label: "Bodyweight", detail: "Floor space only" },
  { id: "dumbbells", label: "Dumbbells", detail: "Fixed or adjustable" },
  { id: "kettlebells", label: "Kettlebells", detail: "Single or paired" },
  { id: "bands", label: "Resistance bands", detail: "Light to heavy" },
  { id: "barbell", label: "Squat rack + barbell", detail: "With plates" },
  { id: "bench", label: "Weight bench", detail: "Flat or adjustable" },
  { id: "pullup", label: "Pull-up bar", detail: "Safe, securely mounted" }
];
function kt(e) {
  const t = e && typeof e == "object" ? e : {}, n = Array.isArray(t.equipment) ? t.equipment.filter((r) => fa.some((o) => o.id === r)) : [], a = Array.from(/* @__PURE__ */ new Set(["bodyweight", ...n]));
  return {
    enabled: t.enabled === !0,
    equipment: a,
    experience: ["beginner", "intermediate", "advanced"].includes(String(t.experience)) ? t.experience : "beginner",
    sessions: t.sessions === 2 ? 2 : 1,
    minutes: [20, 30, 45].includes(Number(t.minutes)) ? Number(t.minutes) : 30,
    notes: typeof t.notes == "string" ? t.notes.slice(0, 150) : ""
  };
}
const oo = [
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
function Ut(e, t) {
  const n = new Set(kt(e).equipment);
  return oo.filter((a) => (!t || a.pattern === t) && a.equipment.every((r) => n.has(r)));
}
const so = (e, t, n) => {
  const a = Ut(e, t);
  return n.map((r) => a.find((o) => o.id === r)).find(Boolean) || a[0];
};
function bn(e, t = "A", n = !1) {
  const a = kt(e), r = a.experience === "beginner", o = n ? 1 : r ? 2 : 3, u = ["Squat", "Hinge", "Push", "Pull", "Core"], i = {
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
    exercises: u.map((g) => {
      const m = so(a, g, i[g]);
      return {
        ...m,
        sets: g === "Core" ? Math.max(1, o - 1) : o,
        restSeconds: n ? 45 : r ? 60 : 90,
        alternatives: Ut(a, g).filter((w) => w.id !== m.id).map((w) => w.id)
      };
    })
  };
}
function io(e, t, n, a) {
  const r = kt(t), o = Math.round(Math.max(60, e.hours * 60)), u = n.map((f) => ({
    day: f.day,
    cyclingId: f.workoutId,
    cyclingMinutes: f.workoutId ? a(f.workoutId) : 0,
    strength: null,
    strengthMinutes: 0,
    reason: f.reason
  }));
  if (!r.enabled) {
    let f = u.reduce((T, x) => T + x.cyclingMinutes, 0);
    if (f <= o) return { days: u, budgetMinutes: o, plannedMinutes: f, note: "Strength training is turned off." };
    const l = (T) => T.cyclingId === "recovery" ? 0 : T.cyclingId === "endurance" ? 1 : T.cyclingId === "tempo" ? 2 : 3, E = [...u].filter((T) => T.cyclingId).sort((T, x) => l(T) - l(x));
    for (const T of E) {
      if (f <= o) break;
      const x = Math.min(Math.max(0, T.cyclingMinutes - 15), f - o);
      T.cyclingMinutes -= x, f -= x;
    }
    for (const T of E) {
      if (f <= o) break;
      f -= T.cyclingMinutes, T.cyclingMinutes = 0, T.cyclingId = null, T.reason = "Removed because the selected weekly hours cannot fit all rides.";
    }
    return {
      days: u,
      budgetMinutes: o,
      plannedMinutes: f,
      note: "Strength is off. Cycling was adjusted to fit your available weekly hours."
    };
  }
  const i = u.filter((f) => f.cyclingId && f.day !== e.restDay).sort((f, l) => (f.cyclingId === "endurance" || f.cyclingId === "recovery" ? -1 : 1) - (l.cyclingId === "endurance" || l.cyclingId === "recovery" ? -1 : 1)), g = [];
  for (const f of i) {
    if (g.length >= r.sessions) break;
    g.some((l) => Math.abs(l.day - f.day) === 1) || g.push(f);
  }
  let m = 0;
  for (const f of g)
    f.strength = m ? "B" : "A", f.strengthMinutes = r.minutes, m++;
  let w = u.reduce((f, l) => f + l.cyclingMinutes + l.strengthMinutes, 0);
  if (w > o) {
    const f = [...u].filter((l) => l.cyclingId).sort((l, E) => {
      const T = (x) => x.cyclingId === "recovery" ? 0 : x.cyclingId === "endurance" ? 1 : x.cyclingId === "tempo" ? 2 : 3;
      return T(l) - T(E);
    });
    for (const l of f) {
      if (w <= o) break;
      const E = l.strength ? 0 : 15, T = Math.min(l.cyclingMinutes - E, w - o);
      T > 0 && (l.cyclingMinutes -= T, w -= T, l.cyclingMinutes === 0 && (l.cyclingId = null));
    }
    for (const l of [...g].reverse()) {
      if (w <= o) break;
      const E = Math.max(0, l.strengthMinutes - 15), T = Math.min(E, w - o);
      l.strengthMinutes -= T, w -= T, w > o && (w -= l.strengthMinutes, l.strengthMinutes = 0, l.strength = null);
    }
    for (const l of f) {
      if (w <= o) break;
      const E = Math.min(l.cyclingMinutes, w - o);
      l.cyclingMinutes -= E, w -= E, l.cyclingMinutes === 0 && (l.cyclingId = null);
    }
  }
  const S = u.reduce((f, l) => f + l.cyclingMinutes + l.strengthMinutes, 0), I = u.filter((f) => f.strength).length;
  return { days: u, budgetMinutes: o, plannedMinutes: S, note: I ? r.sessions > I ? "Limited time or available training days reduced strength frequency." : "Strength sessions are included in your total weekly time budget." : "Not enough available time or separate training days for strength. Consider increasing your weekly training time or lowering other sessions." };
}
function ro(e, t) {
  let n = kt(ne(aa) || va);
  const a = ne(oa);
  let r = Array.isArray(a) ? a.filter((L) => L && typeof L.routine == "string" && Array.isArray(L.sets)).slice(-150) : [], o = !1, u = "A", i = !1, g = 0, m = "", w = 30, S = [], I = bn(n, "A", !1);
  const f = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Map();
  let E = null, T = 0, x = null;
  const C = document.createElement("section");
  C.className = "coach-strength-overlay", C.id = "coachStrengthOverlay", C.hidden = !0, C.setAttribute("role", "dialog"), C.setAttribute("aria-modal", "true"), C.setAttribute("aria-label", "Guided strength session"), document.body.append(C);
  function A() {
    e.innerHTML = '<div class="coach-section-top"><span class="coach-tag">STRENGTH TRAINING</span><span class="coach-tag">OPTIONAL · LOCAL ONLY</span></div><h3>Train with what you own.</h3><p class="coach-small">Set your available equipment. Strength sessions share your weekly training time budget.</p><label class="coach-strength-toggle"><input id="strengthEnabled" type="checkbox" ' + (n.enabled ? "checked" : "") + '><span>Include strength in my training plan</span></label><span class="coach-label">AVAILABLE EQUIPMENT</span><div class="coach-equipment-grid">' + fa.map((L) => '<label class="coach-gear-choice"><input type="checkbox" data-gear="' + L.id + '" ' + (n.equipment.includes(L.id) ? "checked" : "") + " " + (L.id === "bodyweight" ? "disabled" : "") + "><span><strong>" + R(L.label) + "</strong><small>" + R(L.detail) + "</small></span></label>").join("") + '</div><div class="coach-strength-fields"><label>EXPERIENCE<select id="strengthExperience"><option value="beginner">New to lifting</option><option value="intermediate">Some experience</option><option value="advanced">Experienced</option></select></label><label>SESSIONS / WEEK<select id="strengthSessions"><option value="1">1 session</option><option value="2">2 sessions</option></select></label><label>TIME / SESSION<select id="strengthMinutes"><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option></select></label><label>AVAILABLE WEIGHTS (OPTIONAL)<input type="text" id="strengthWeights" maxlength="150" placeholder="e.g. 25 lb DB, 35 lb KB"></label></div><p id="strengthSaved" class="coach-small" role="status">Your strength setup is saved with your cycling settings using Save My Plan.</p>', e.querySelector("#strengthExperience").value = n.experience, e.querySelector("#strengthSessions").value = String(n.sessions), e.querySelector("#strengthMinutes").value = String(n.minutes), e.querySelector("#strengthWeights").value = n.notes;
  }
  function Y() {
    const L = Array.from(e.querySelectorAll("[data-gear]")).filter((b) => b.checked).map((b) => b.dataset.gear), P = kt({
      enabled: e.querySelector("#strengthEnabled").checked,
      equipment: L,
      experience: e.querySelector("#strengthExperience").value,
      sessions: Number(e.querySelector("#strengthSessions").value),
      minutes: Number(e.querySelector("#strengthMinutes").value),
      notes: e.querySelector("#strengthWeights").value
    });
    return pe(aa, P) ? (n = P, A(), e.querySelector("#strengthSaved").textContent = "Equipment settings saved.", !0) : (e.querySelector("#strengthSaved").textContent = "Local storage unavailable. Nothing saved.", !1);
  }
  function F() {
    E !== null && window.clearInterval(E), E = null, T = 0;
  }
  function V(L) {
    E !== null && window.clearInterval(E), T = Date.now() + L * 1e3;
    const P = () => {
      const b = Math.max(0, Math.ceil((T - Date.now()) / 1e3)), k = C.querySelector("#strengthRestLabel");
      k && (k.textContent = b ? "Rest: " + b + " seconds" : "Rest complete. Ready for the next set."), b || (E !== null && window.clearInterval(E), E = null);
    };
    E = window.setInterval(P, 500), P();
  }
  const O = (L, P) => L + ":" + P;
  function M() {
    if (!o) return;
    const L = C.scrollTop, P = S.reduce((b, k) => b + k.sets, 0);
    if (C.innerHTML = '<div class="coach-strength-session"><header class="coach-strength-session-head"><div><span>BREAKAWAY COACH / STRENGTH</span><h2>' + R(I.title) + "</h2><p>" + w + " min planned · " + f.size + " / " + P + ' sets logged</p></div><button type="button" id="strengthExit">← BACK TO COACH</button></header><div class="coach-strength-session-note">' + R(I.note) + ' Warm up for 5 minutes. Stop or modify anything painful; use a load you can control.</div><div class="coach-strength-progress"><div style="width:' + Math.round(100 * f.size / Math.max(P, 1)) + '%"></div></div><div class="coach-strength-rest"><span id="strengthRestLabel">Rest as needed between sets.</span><button type="button" id="strengthRestStart">START 60s REST</button></div><div class="coach-strength-list">' + S.map((b, k) => {
      const H = Ut(n, b.pattern);
      return '<section class="coach-strength-exercise"><div class="coach-strength-exercise-header"><div><small>' + (k + 1) + " / " + S.length + " · " + R(b.pattern.toUpperCase()) + "</small><h3>" + R(b.name) + '</h3></div><label>SWAP EXERCISE<select data-strength-sub="' + k + '">' + H.map((U) => '<option value="' + U.id + '" ' + (U.id === b.id ? "selected" : "") + ">" + R(U.name) + "</option>").join("") + "</select></label></div><p>" + R(b.instructions) + '</p><p class="coach-strength-dose">' + b.sets + " sets · " + R(b.reps) + " · Rest " + b.restSeconds + "s · " + R(b.loadHint) + '</p><div class="coach-strength-sets">' + Array.from({ length: b.sets }, (U, W) => {
        const Te = O(k, W);
        return '<div class="coach-strength-set"><span>SET ' + (W + 1) + '</span><input aria-label="Repetitions: set ' + (W + 1) + " " + R(b.name) + '" data-reps="' + Te + '" maxlength="30" placeholder="' + R(b.reps) + '"><input aria-label="Weight: set ' + (W + 1) + " " + R(b.name) + '" data-load="' + Te + '" maxlength="32" placeholder="Load (lb / kg / BW)"><button type="button" aria-pressed="' + f.has(Te) + '" data-check="' + Te + '">' + (f.has(Te) ? "✓ DONE" : "MARK DONE") + "</button></div>";
      }).join("") + "</div></section>";
    }).join("") + '</div><div class="coach-strength-complete"><label>SESSION EFFORT<select id="strengthRpe"><option value="">Select effort</option><option value="3">Easy</option><option value="5">Moderate</option><option value="7">Hard</option><option value="9">Very hard</option></select></label><button type="button" id="strengthFinish">FINISH & SAVE SESSION →</button><p id="strengthSessionError" role="status"></p></div></div>', C.querySelectorAll("[data-reps],[data-load]").forEach((b) => {
      const k = b.hasAttribute("data-reps") ? "reps" : "load";
      b.value = l.get(k + ":" + b.getAttribute("data-" + k)) || "";
    }), C.querySelector("#strengthRpe").value = m, C.scrollTop = L, E !== null && T > Date.now()) {
      const b = C.querySelector("#strengthRestLabel");
      b && (b.textContent = "Rest: " + Math.ceil((T - Date.now()) / 1e3) + " seconds");
    }
  }
  C.addEventListener("input", (L) => {
    const P = L.target;
    if (P instanceof HTMLInputElement)
      for (const b of ["reps", "load"]) P.hasAttribute("data-" + b) && l.set(b + ":" + P.getAttribute("data-" + b), P.value);
  }), C.addEventListener("change", (L) => {
    const P = L.target;
    if (!(P instanceof HTMLSelectElement)) return;
    if (P.id === "strengthRpe") {
      m = P.value;
      return;
    }
    if (!P.hasAttribute("data-strength-sub")) return;
    const b = Number(P.dataset.strengthSub), k = S[b];
    if (!k) return;
    const H = Ut(n, k.pattern).find((U) => U.id === P.value);
    if (H) {
      S[b] = { ...H, sets: k.sets, restSeconds: k.restSeconds, alternatives: k.alternatives };
      for (let U = 0; U < k.sets; U++) {
        const W = O(b, U);
        f.delete(W), l.delete("reps:" + W), l.delete("load:" + W);
      }
      M();
    }
  }), C.addEventListener("click", (L) => {
    var k;
    const P = L.target;
    if (!(P instanceof Element)) return;
    if (P.closest("#strengthExit")) {
      if (f.size && !confirm("Leave without saving your sets?")) return;
      Ee();
      return;
    }
    const b = P.closest("[data-check]");
    if (b) {
      const H = b.dataset.check;
      if (f.has(H) ? f.delete(H) : f.add(H), f.has(H)) {
        const U = Number(H.split(":")[0]);
        V(((k = S[U]) == null ? void 0 : k.restSeconds) || 60);
      }
      M();
      return;
    }
    if (P.closest("#strengthRestStart")) {
      V(60);
      return;
    }
    P.closest("#strengthFinish") && ve();
  });
  function ve() {
    if (!f.size) {
      C.querySelector("#strengthSessionError").textContent = "Complete at least one set to save this session.";
      return;
    }
    const L = [];
    S.forEach((k, H) => {
      for (let U = 0; U < k.sets; U++) {
        const W = O(H, U);
        L.push({ exerciseId: k.id, set: U + 1, reps: l.get("reps:" + W) || "", load: l.get("load:" + W) || "", done: f.has(W) });
      }
    });
    const P = {
      id: (/* @__PURE__ */ new Date()).toISOString() + ":" + I.id,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      routine: I.title,
      minutes: Math.max(1, Math.round((Date.now() - g) / 6e4)),
      completedSets: f.size,
      plannedSets: L.length,
      rpe: m ? Number(m) : null,
      sets: L
    }, b = r.concat(P).slice(-150);
    if (!pe(oa, b)) {
      C.querySelector("#strengthSessionError").textContent = "Could not save. Check local browser storage.";
      return;
    }
    r = b, Ee(), t.finished();
  }
  function Ee() {
    F(), o = !1, C.hidden = !0, x == null || x.focus(), x = null;
  }
  function $(L = "A", P = !1, b) {
    var k;
    return n.enabled ? (u = L, w = Math.min(n.minutes, Math.max(15, b || n.minutes)), i = P || w < 20, I = bn(n, u, i), S = I.exercises, w < n.minutes && (S = S.map((H) => ({ ...H, sets: Math.max(1, Math.min(H.sets, w < 25 ? 1 : 2)) }))), x = document.activeElement instanceof HTMLElement ? document.activeElement : null, o = !0, f.clear(), l.clear(), m = "", g = Date.now(), F(), C.hidden = !1, M(), C.scrollTop = 0, (k = C.querySelector("#strengthExit")) == null || k.focus(), !0) : !1;
  }
  return C.addEventListener("keydown", (L) => {
    if (!o) return;
    if (L.key === "Escape") {
      L.preventDefault();
      const H = C.querySelector("#strengthExit");
      H == null || H.click();
      return;
    }
    if (L.key !== "Tab") return;
    const P = Array.from(C.querySelectorAll("button:not(:disabled),input:not(:disabled),select:not(:disabled)"));
    if (!P.length) return;
    const b = P[0], k = P[P.length - 1];
    L.shiftKey && document.activeElement === b ? (L.preventDefault(), k.focus()) : !L.shiftKey && document.activeElement === k && (L.preventDefault(), b.focus());
  }), A(), {
    get settings() {
      return n;
    },
    get history() {
      return r;
    },
    open: $,
    close: Ee,
    renderSettings: A,
    saveSettings: Y,
    get active() {
      return o;
    },
    completedToday() {
      return r.some((L) => Le(new Date(L.date)) === Le(/* @__PURE__ */ new Date()));
    }
  };
}
function co(e, t, n, a) {
  const r = [];
  for (let o = 0; o < 7; o++) {
    const u = new Date(e.getFullYear(), e.getMonth(), e.getDate() + o), i = t.find((E) => E.day === u.getDay()), g = o === 0 && a.status === "completed";
    let m = i != null && i.cyclingId && i.cyclingMinutes > 0 ? i.cyclingId : null;
    o === 0 && (g || a.status === "rest" || !m ? m = null : a.workoutId && (m = a.workoutId));
    const w = n.find((E) => E.id === m), S = (i == null ? void 0 : i.cyclingId) === m ? i.cyclingMinutes : 0, I = w ? Math.max(0, S || Math.round(w.segments.reduce((E, T) => E + T.minutes, 0))) : 0, f = o === 0 ? "Today" : new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(u), l = [u.getFullYear(), String(u.getMonth() + 1).padStart(2, "0"), String(u.getDate()).padStart(2, "0")].join("-");
    r.push({
      date: u,
      key: l,
      isToday: o === 0,
      label: f + " " + (u.getMonth() + 1) + "/" + u.getDate(),
      title: new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(u),
      rideId: (w == null ? void 0 : w.id) || null,
      rideName: (w == null ? void 0 : w.name) || null,
      rideMinutes: I,
      rideDescription: (w == null ? void 0 : w.description) || null,
      strength: (i == null ? void 0 : i.strength) || null,
      strengthMinutes: (i == null ? void 0 : i.strengthMinutes) || 0,
      completedRide: g,
      reason: o === 0 ? a.reason : (i == null ? void 0 : i.reason) || "Scheduled recovery day"
    });
  }
  return r;
}
const Ft = "breakaway.coach.moved-workouts.v1", ba = (e, t) => Object.prototype.hasOwnProperty.call(e, t);
function wa(e) {
  const t = {};
  if (!e || typeof e != "object" || Array.isArray(e)) return t;
  for (const [n, a] of Object.entries(e).slice(-365)) {
    if (St(n) !== n || !a || typeof a != "object") continue;
    const r = a;
    r.cyclingId !== null && (typeof r.cyclingId != "string" || !/^[a-z0-9_-]{1,80}$/i.test(r.cyclingId)) || typeof r.cyclingMinutes != "number" || !Number.isInteger(r.cyclingMinutes) || r.cyclingMinutes < 0 || r.cyclingMinutes > 1440 || r.cyclingId === null == (r.cyclingMinutes === 0) && (t[n] = { cyclingId: r.cyclingId, cyclingMinutes: r.cyclingMinutes });
  }
  return t;
}
function sa(e, t, n) {
  return ba(n, e) ? { ...t, ...n[e], reason: "Manually rescheduled by you. " + t.reason } : t;
}
function lo(e, t, n, a, r) {
  return t === n || St(t) !== t || St(n) !== n || !a.cyclingId || a.cyclingMinutes <= 0 ? e : {
    ...e,
    [t]: { cyclingId: r.cyclingId, cyclingMinutes: r.cyclingMinutes },
    [n]: { cyclingId: a.cyclingId, cyclingMinutes: a.cyclingMinutes }
  };
}
function uo(e, t, n) {
  if (St(t) !== t) return e;
  const a = wa({ [t]: n });
  return ba(a, t) ? { ...e, [t]: a[t] } : e;
}
const ho = /* @__PURE__ */ new Set(["tempo", "sweetspot", "vo2"]), wt = (e) => !!e.rideId && (ho.has(e.rideId) || e.rideMinutes >= 120 && e.rideId !== "recovery"), ia = (e) => {
  const [t, n, a] = e.split("-").map(Number);
  return Date.UTC(t, n - 1, a) / 864e5;
};
function cn(e) {
  const t = [...e].sort((a, r) => a.key.localeCompare(r.key)), n = /* @__PURE__ */ new Set();
  for (let a = 1; a < t.length; a++) {
    const r = t[a - 1], o = t[a];
    ia(o.key) - ia(r.key) === 1 && wt(r) && wt(o) && n.add(r.key + "|" + o.key);
  }
  return n;
}
const ra = (e, t, n) => {
  const a = e.find((o) => o.key === t), r = e.find((o) => o.key === n);
  return e.map((o) => o.key === t ? { ...o, rideId: r.rideId, rideMinutes: r.rideMinutes } : o.key === n ? { ...o, rideId: a.rideId, rideMinutes: a.rideMinutes } : o);
};
function po(e, t, n) {
  const a = e.find((S) => S.key === t), r = e.find((S) => S.key === n);
  if (!a || !r || !a.rideId || t === n) return { warning: null, suggestedKey: null };
  const o = cn(e), u = ra(e, t, n), i = [...cn(u)].filter((S) => !o.has(S)), g = u.filter((S) => [t, n].includes(S.key) && wt(S) && S.strengthMinutes >= 30 && !e.some((I) => I.key === S.key && wt(I) && I.strengthMinutes >= 30));
  if (!i.length && !g.length) return { warning: null, suggestedKey: null };
  const m = [
    i.length ? "This change creates demanding rides on consecutive days (" + i.map((S) => S.split("|").join(" and ")).join("; ") + ")." : "",
    g.length ? "It also places a demanding ride on a strength-training day." : ""
  ].filter(Boolean).join(" "), w = e.filter((S) => S.key !== t && S.key !== n && !S.rideId && !S.completedRide && !S.eventDay && S.key >= t).find((S) => {
    const I = ra(e, t, S.key);
    return [...cn(I)].every((f) => o.has(f)) && !I.some((f) => f.key === S.key && wt(f) && f.strengthMinutes >= 30);
  });
  return {
    warning: m + " Consider an easier day between demanding efforts when possible. You can keep your selected move if needed.",
    suggestedKey: (w == null ? void 0 : w.key) || null
  };
}
const Sa = 864e5;
function nt(e) {
  return [e.getFullYear(), String(e.getMonth() + 1).padStart(2, "0"), String(e.getDate()).padStart(2, "0")].join("-");
}
const go = (e, t) => Number.isFinite(e.start) && e.start <= t && e.start >= t - 14 * Sa && Number.isFinite(e.elapsed) && e.elapsed >= 900;
function ln(e) {
  return Math.max(0, Math.round(e.elapsed / 60));
}
function mo(e) {
  var ve, Ee, $, L, P;
  const { now: t, week: n, today: a, ftp: r, ftpKnown: o } = e, u = nt(t), i = t.getTime(), g = new Set(e.skipped), m = new Set(e.manualOverrides || []), w = e.rides.filter((b) => go(b, i)), S = new Date(t.getFullYear(), t.getMonth(), t.getDate() - t.getDay()), I = [];
  for (let b = 0; b < 14; b++) {
    const k = new Date(S.getFullYear(), S.getMonth(), S.getDate() + b), H = nt(k), U = k.getDay(), W = ((ve = e.planForDate) == null ? void 0 : ve.call(e, k)) ?? n.find((ye) => ye.day === U), Te = (Ee = e.event) != null && Ee.startDate && /^\d{4}-\d{2}-\d{2}$/.test(e.event.startDate) ? /* @__PURE__ */ new Date(e.event.startDate + "T12:00:00") : null, Me = Te ? Math.round((new Date(k.getFullYear(), k.getMonth(), k.getDate(), 12).getTime() - Te.getTime()) / Sa) : -1, he = Me >= 0 && Me < Math.max(1, (($ = e.event) == null ? void 0 : $.stages) || 1) ? Me + 1 : 0, ee = W != null && W.cyclingId && W.cyclingMinutes > 0 ? W.cyclingId : null, le = (L = e.originalPlanForDate) == null ? void 0 : L.call(e, k), _e = le != null && le.cyclingId && le.cyclingMinutes > 0 ? le.cyclingId : null, We = m.has(H) && !!le && (_e !== ee || ((le == null ? void 0 : le.cyclingMinutes) || 0) !== ((W == null ? void 0 : W.cyclingMinutes) || 0)), Ie = ee ? W.cyclingMinutes : 0, Vt = k.getTime(), st = w.filter((ye) => nt(new Date(ye.start)) === H), En = st.reduce((ye, de) => ye + ln(de), 0), ze = Vt < new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(), Ye = H === u;
    let ge = ee, me = Ie, J = ee ? "planned" : "rest", ie = (W == null ? void 0 : W.reason) || "Recovery day";
    if (We && (ie = "You manually changed this workout. " + ie), (ze || Ye) && st.length)
      ge = null, me = 0, J = "completed", ie = "A ride was recorded on this date. Coach does not prescribe a duplicate session.";
    else if (he)
      ge = null, me = 0, J = "event", ie = "Event stage " + he + " of " + Math.max(1, ((P = e.event) == null ? void 0 : P.stages) || 1) + ". No additional indoor workout is prescribed. Follow your event pacing and fueling plan.";
    else if ((ze || Ye) && g.has(H))
      ge = null, me = 0, J = "skipped", ie = "You skipped this session. Coach will not stack it onto a later day.";
    else if (ze)
      ge = null, me = 0, J = ee ? "missed" : "rest", ie = ee ? "This scheduled ride was not recorded and has not been rescheduled." : "Scheduled rest day.";
    else if (Ye)
      ge = a.workoutId, J = a.status === "completed" ? "completed" : ge ? a.status === "recovery" ? "recovery" : "planned" : "rest", me = ge ? ge === "recovery" && ee !== "recovery" ? Math.min(Ie || e.recoveryMinutes, e.recoveryMinutes) : Ie : 0, ie = a.reason;
    else if (ee) {
      const ye = new Date(k.getFullYear(), k.getMonth(), k.getDate(), 9).getTime(), de = w.some((q) => q.start < ye && ye - q.start <= 36 * 36e5 && (ln(q) >= 120 || o && q.avgPower !== null && Number.isFinite(q.avgPower) && q.elapsed >= 1800 && q.avgPower >= r * 0.8)), Tt = e.feedback.some((q) => Number.isFinite(q.date) && q.date < ye && ye - q.date <= 48 * 36e5 && q.rpe !== null && q.rpe >= 9), Ce = new Date(k.getFullYear(), k.getMonth(), k.getDate() - 1), Xe = nt(Ce), Ze = I.find((q) => q.key === Xe), Mt = m.has(Xe) && Ze && (Ze.workoutId === "vo2" || Ze.workoutId === "sweetspot") && (ee === "vo2" || ee === "sweetspot" || ee === "tempo");
      (de || Tt || Mt) && ee !== "recovery" && !m.has(H) && (ge = "recovery", me = Math.min(Ie, e.recoveryMinutes), J = "recovery", ie = Tt ? "Very hard recent workout feedback prompted a recovery spin instead of the planned workout." : Mt ? "Your manually selected high-intensity workout on the previous day would stack demanding sessions. Coach substituted recovery to protect adaptation." : "A demanding or long ride was recorded before this session. Coach replaced it with easier recovery riding.");
    }
    We && J === "planned" && (ie = "You manually changed this workout. " + ((W == null ? void 0 : W.reason) || "Your chosen workout is saved.")), I.push({
      key: H,
      date: k,
      weekday: U,
      originalId: We ? _e : ee,
      workoutId: ge,
      originalMinutes: We ? (le == null ? void 0 : le.cyclingMinutes) || 0 : Ie,
      minutes: me,
      recordedMinutes: En,
      status: J,
      reason: ie,
      changed: We || J === "completed" || ge !== ee || me !== Ie,
      strength: he ? null : (W == null ? void 0 : W.strength) || null,
      strengthMinutes: he ? 0 : (W == null ? void 0 : W.strengthMinutes) || 0
    });
  }
  const l = I.filter((b) => b.date.getTime() <= i && b.date.getTime() >= S.getTime()).filter((b) => w.some((k) => nt(new Date(k.start)) === b.key)), E = l.reduce((b, k) => b + w.filter((H) => nt(new Date(H.start)) === k.key).reduce((H, U) => H + ln(U), 0), 0), T = l.reduce((b, k) => b + k.originalMinutes, 0), x = Math.max(0, E - T), C = I.slice(0, 7).reduce((b, k) => b + k.originalMinutes + k.strengthMinutes, 0), A = Math.max(0, e.budgetMinutes - C), Y = I.slice(0, 7).filter((b) => b.status === "recovery" && b.date.getTime() >= new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()).reduce((b, k) => b + Math.max(0, k.originalMinutes - k.minutes), 0);
  let F = Math.max(0, x - A - Y);
  const V = new Date(S.getFullYear(), S.getMonth(), S.getDate() + 7).getTime(), O = I.filter((b) => b.date.getTime() >= new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime() && b.date.getTime() < V && b.workoutId && b.status !== "completed" && b.status !== "skipped").sort((b, k) => {
    const H = (U) => U.workoutId === "recovery" ? 0 : U.workoutId === "endurance" ? 1 : 2;
    return H(b) - H(k) || b.date.getTime() - k.date.getTime();
  });
  for (const b of O) {
    if (F <= 0) break;
    const k = Math.max(0, b.minutes - 15), H = Math.min(k, F);
    H <= 0 || (b.minutes -= H, F -= H, b.minutes !== b.originalMinutes && (b.status = b.status === "recovery" ? "recovery" : "shortened", b.changed = !0, b.reason += " Additional riding exceeded your remaining weekly time by " + (x - A - Y) + " minutes, so Coach shortened this session by " + H + " minutes. Strength and rest days stay unchanged."));
  }
  const M = I.filter((b) => b.date.getTime() < V && (b.changed || b.status === "skipped" && g.has(b.key))).map((b) => ({
    key: b.key,
    originalId: b.originalId,
    workoutId: b.workoutId,
    beforeMinutes: b.originalMinutes,
    afterMinutes: b.status === "completed" ? b.recordedMinutes : b.minutes,
    reason: b.reason,
    kind: b.status === "completed" ? "completed" : b.status === "skipped" ? "skipped" : b.status === "shortened" ? "shortened" : b.status === "missed" ? "missed" : b.status === "event" ? "event" : m.has(b.key) && b.reason.startsWith("You manually changed") ? "manual" : "recovery"
  }));
  return { days: I, changes: M, extraMinutes: x };
}
const yo = (e) => {
  const t = e.match(/\b(\d{1,2}):([0-5]\d):([0-5]\d)\b/);
  if (t) return Math.round((Number(t[1]) * 3600 + Number(t[2]) * 60 + Number(t[3])) / 60);
  const n = e.match(/\b(\d{1,2}):([0-5]\d)\b/);
  if (n) return Number(n[1]) * 60 + Number(n[2]);
  const a = e.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr|h)\b/i), r = e.match(/\b(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)\b/i), o = (a ? Number(a[1]) * 60 : 0) + (r ? Number(r[1]) : 0);
  return o > 0 ? Math.round(o) : null;
};
function ca(e) {
  const t = e.trim().slice(0, 3e3), n = yo(t), a = /\b(steady|base|endurance|easy aerobic|consistent|continuous)\b/i.test(t), r = t.match(/\b(?:heart[\s-]*rate|hr)?\s*(?:between|from)\s*(\d{2,3})\s*(?:and|to|[-–—])\s*(\d{2,3})\s*(?:bpm)?\b/i), o = t.match(/\b(?:heart[\s-]*rate|hr)?\s*(\d{2,3})\s*(?:-|–|—|to)\s*(\d{2,3})\s*bpm\b/i), u = t.match(/\b(\d{2,4})\s*(?:-|–|—|to)\s*(\d{2,4})\s*(?:w|watts)\b/i), i = r || o;
  let g = null;
  if (i) {
    const I = Number(i[1]), f = Number(i[2]);
    I >= 35 && f <= 240 && I < f && (g = { kind: "heart-rate", minBpm: I, maxBpm: f });
  } else if (u) {
    const I = Number(u[1]), f = Number(u[2]);
    I >= 20 && f <= 1200 && I < f && (g = { kind: "power", lowWatts: I, highWatts: f });
  }
  const m = [];
  n === null && m.push("Duration not specified. Enter a total workout time."), g === null && m.push("No valid heart-rate or wattage range found. Add an intensity target."), /\bwarm[\s-]?up\b/i.test(t) || m.push("Warmup not specified — no separate warmup was added."), /\bcool[\s-]?down\b/i.test(t) || m.push("Cooldown not specified — no separate cooldown was added."), (g == null ? void 0 : g.kind) === "heart-rate" && (m.push("No power target provided. Breakaway will not convert heart rate into watts."), m.push("A compatible heart-rate monitor is needed for live guidance.")), n !== null && (n < 1 || n > 600) && m.push("Duration must be between 1 and 600 minutes.");
  const w = n !== null && n >= 1 && n <= 600 && g !== null;
  return {
    title: /\b(base|endurance)\b/i.test(t) ? "Base" : "Steady Heart-Rate Ride",
    sport: "cycling",
    durationMinutes: n,
    target: g,
    description: t,
    pace: a ? "steady" : "unspecified",
    notes: a ? ["One continuous, steady session."] : [],
    warnings: m,
    ready: w
  };
}
const dn = "Ride for 2 hours at a steady pace. Keep heart rate between 103 and 114 bpm.", la = "breakaway.coach.imported-workouts.v1", Wt = (e) => e === null ? "—" : Math.floor(e / 60) + ":" + String(e % 60).padStart(2, "0") + ":00";
function vo(e) {
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
  const t = (m) => e.querySelector("#" + m), n = t("ciDescription"), a = t("ciImage"), r = t("ciImagePreview");
  let o = null, u = ca(dn);
  n.value = dn;
  const i = (m) => {
    for (const w of ["Text", "Image", "File"])
      t("ciTab" + w).setAttribute("aria-selected", String(w === m)), t("ciPanel" + w).hidden = w !== m;
  };
  t("ciTabText").addEventListener("click", () => i("Text")), t("ciTabImage").addEventListener("click", () => i("Image")), t("ciTabFile").addEventListener("click", () => i("File")), t("ciBackToText").addEventListener("click", () => i("Text")), t("ciExample").addEventListener("click", () => {
    n.value = dn, g();
  });
  function g() {
    u = ca(n.value);
    const m = u.target, w = (m == null ? void 0 : m.kind) === "heart-rate", S = (m == null ? void 0 : m.kind) === "power", I = w ? m.minBpm + "–" + m.maxBpm : S ? m.lowWatts + "–" + m.highWatts : "—", f = w ? "BPM" : S ? "WATTS" : "MISSING";
    t("ciTitle").textContent = u.title, t("ciSubtitle").textContent = u.pace === "steady" ? "One continuous steady cycling interval" : "One continuous cycling interval", t("ciDuration").textContent = Wt(u.durationMinutes), t("ciTarget").textContent = I, t("ciTargetUnit").textContent = "TARGET " + f, t("ciTimelineTarget").textContent = I + " " + f, t("ciTimelineType").textContent = w ? "Heart-rate target" : S ? "Power target" : "Intensity not specified", t("ciTimelineMinutes").textContent = u.durationMinutes !== null ? u.durationMinutes + " MIN" : "TIME MISSING", t("ciTimelineMiddle").textContent = u.durationMinutes !== null ? Wt(Math.floor(u.durationMinutes / 2)) : "—", t("ciTimelineEnd").textContent = Wt(u.durationMinutes), t("ciTrainerMode").textContent = w ? "SIM / manual resistance" : S ? "Power guidance / ERG optional" : "Intensity not specified", t("ciStructure").textContent = "One " + (u.pace === "steady" ? "steady " : "") + "block", t("ciWarnings").innerHTML = u.warnings.map((l) => "<li>" + R(l) + "</li>").join(""), t("ciStatus").textContent = u.ready ? "READY TO REVIEW" : "NEEDS DETAILS", t("ciStatus").classList.toggle("is-incomplete", !u.ready), t("ciSave").disabled = !u.ready, t("ciTimeline").setAttribute("aria-label", "Continuous cycling workout lasting " + Wt(u.durationMinutes) + " with target " + I + " " + f), t("ciSaveStatus").textContent = "";
  }
  n.addEventListener("input", g), a.addEventListener("change", () => {
    var w;
    const m = (w = a.files) == null ? void 0 : w[0];
    if (o && (URL.revokeObjectURL(o), o = null), r.hidden = !0, r.removeAttribute("src"), !m) {
      t("ciImageStatus").textContent = "No file selected";
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(m.type) || m.size > 8 * 1024 * 1024) {
      t("ciImageStatus").textContent = "Please select a JPG, PNG or WebP under 8 MB.";
      return;
    }
    o = URL.createObjectURL(m), r.src = o, r.hidden = !1, t("ciImageStatus").textContent = m.name + " · image preview only";
  }), t("ciSave").addEventListener("click", () => {
    if (u.ready)
      try {
        const m = JSON.parse(localStorage.getItem(la) || "[]"), w = Array.isArray(m) ? m : [];
        localStorage.setItem(la, JSON.stringify([...w.slice(-24), { ...u, id: "import-" + Date.now(), savedAt: (/* @__PURE__ */ new Date()).toISOString() }])), t("ciSaveStatus").textContent = "✓ Saved on this device. Imported-workout execution is not yet available.";
      } catch {
        t("ciSaveStatus").textContent = "Unable to save. Please enable browser storage.";
      }
  }), g();
}
const un = "breakaway.coach.morning.v1", yt = "breakaway.coach.ftp-known.v1", Yt = (e, t, n) => typeof e == "number" && Number.isFinite(e) && Number.isInteger(e) && e >= t && e <= n ? e : null;
function hn(e, t) {
  if (!e || typeof e != "object") return null;
  const n = e, a = typeof n.date == "string" ? /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(n.date) : null;
  if ((a ? [a[1], a[2].padStart(2, "0"), a[3].padStart(2, "0")].join("-") : null) !== t || !["tired", "okay", "great"].includes(String(n.feeling))) return null;
  for (const [o, u, i] of [["bodyBattery", 0, 100], ["sleepScore", 0, 100], ["hrvMs", 1, 300]])
    if (n[o] !== null && n[o] !== void 0 && Yt(n[o], u, i) === null) return null;
  return {
    date: t,
    feeling: n.feeling,
    bodyBattery: Yt(n.bodyBattery, 0, 100),
    sleepScore: Yt(n.sleepScore, 0, 100),
    hrvMs: Yt(n.hrvMs, 1, 300)
  };
}
function ka(e) {
  if (!e) return { label: "Not checked in", detail: "Morning check-in is optional. Coach is using your schedule and recent rides.", suggestEasy: !1 };
  if (e.feeling === "tired") return { label: "Check your energy", detail: "You reported feeling tired. Consider an easy session; Body Battery, Sleep Score and HRV alone are not diagnostic.", suggestEasy: !0 };
  const t = [e.bodyBattery, e.sleepScore, e.hrvMs].filter((n) => n !== null).length;
  return {
    label: e.feeling === "great" ? "Feeling good" : "Feeling okay",
    detail: t ? "Your Garmin-style readings are recorded for reference. Personalized recovery thresholds need a baseline, so these numbers do not automatically change workouts." : "Your self-check is saved; there are no device readings today.",
    suggestEasy: !1
  };
}
function fo(e, t) {
  return !ka(t).suggestEasy || e.status !== "planned" || !e.workoutId || e.workoutId === "recovery" ? e : { workoutId: "recovery", status: "recovery", reason: "You reported feeling tired during your morning check-in. Coach suggests an easier recovery spin instead of your planned session. This is a training suggestion, not a medical assessment." };
}
function bo(e, t, n = !1) {
  return n ? { color: "green", label: "Training complete", detail: "You have already ridden today. No additional prescribed workout is needed." } : !e && !t.demandingRide && !t.veryHardFeedback ? { color: "neutral", label: "Check-in optional", detail: "Coach has no reported fatigue today, but no check-in or personal recovery baseline is available. Follow the plan if you feel well, and adjust as needed." } : (e == null ? void 0 : e.feeling) === "tired" && (t.demandingRide || t.veryHardFeedback) ? { color: "red", label: "Recovery recommended", detail: "You reported fatigue and recent training was demanding. Coach recommends rest or gentle recovery rather than another hard effort." } : (e == null ? void 0 : e.feeling) === "tired" || t.demandingRide || t.veryHardFeedback ? { color: "yellow", label: "Take it easy", detail: (e == null ? void 0 : e.feeling) === "tired" ? "You reported fatigue. Coach suggests a lighter session based on your check-in." : "Recent demanding training suggests a lighter session. Coach uses recorded effort, not Garmin score cutoffs." } : { color: "green", label: "Follow your plan", detail: (e == null ? void 0 : e.feeling) === "great" ? "You feel good today. Follow your planned session without adding extra intensity." : "No fatigue flag was found in available inputs. Missing Garmin data does not mean you are fully recovered." };
}
const da = "breakaway.coach.event-goal.v1", wo = { discipline: "general", name: "", date: "", distanceKm: null, elevationM: null, durationMinutes: null, stages: 1, priority: "A", objective: "finish", terrain: "road" }, Gt = { general: "General cycling fitness", criterium: "Criterium", road: "Road race", tt: "Time trial", xco: "Mountain bike XCO / short track", xcm: "Mountain bike marathon", gravel: "Gravel race", cyclocross: "Cyclocross", "gran-fondo": "Gran Fondo / century", ultra: "Ultra-endurance", "stage-race": "Multi-day stage race" }, pn = (e, t) => e === "" || e === null || e === void 0 ? null : Number.isFinite(Number(e)) && Number(e) > 0 && Number(e) <= t ? Number(e) : null;
function gn(e) {
  const t = e && typeof e == "object" ? e : {}, n = Object.hasOwn(Gt, String(t.discipline)) ? t.discipline : "general", a = typeof t.date == "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && !Number.isNaN((/* @__PURE__ */ new Date(t.date + "T12:00:00")).getTime()) && (/* @__PURE__ */ new Date(t.date + "T12:00:00")).toISOString().slice(0, 10) === t.date ? t.date : "";
  return {
    discipline: n,
    name: typeof t.name == "string" ? t.name.trim().slice(0, 100) : "",
    date: a,
    distanceKm: pn(t.distanceKm, 5e3),
    elevationM: pn(t.elevationM, 1e5),
    durationMinutes: pn(t.durationMinutes, 3e4),
    stages: n === "stage-race" ? Math.max(2, Math.min(30, Math.round(Number(t.stages) || 2))) : 1,
    priority: ["A", "B", "C"].includes(String(t.priority)) ? t.priority : "A",
    objective: t.objective === "perform" ? "perform" : "finish",
    terrain: ["road", "gravel", "trail", "mixed"].includes(String(t.terrain)) ? t.terrain : "road"
  };
}
function Bt(e, t) {
  if (!e.date || e.discipline === "general") return { phase: "foundation", weeksLeft: null, description: "Build consistency, comfortable endurance and repeatable training habits." };
  const n = /* @__PURE__ */ new Date(e.date + "T12:00:00"), a = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12), r = Math.round((n.getTime() - a.getTime()) / 864e5), o = e.discipline === "stage-race" ? Math.max(2, e.stages) : 1, u = Math.max(0, Math.ceil(r / 7)), i = r < -(o - 1) ? "post-event" : r <= 0 ? "event" : r <= 7 ? "taper" : r <= 28 ? "specific" : r <= 70 ? "build" : "base";
  return { phase: i, weeksLeft: u, description: { base: "Build a sustainable aerobic foundation before race-specific sessions.", build: "Develop the power and endurance needed for your event.", specific: "Practice efforts that resemble your event while managing fatigue.", taper: "Reduce accumulated fatigue; preserve fitness and arrive ready.", event: "Event day: follow your pacing, fueling and safety plan.", "post-event": "Recover after the event before setting a new primary goal." }[i] };
}
function So(e, t, n) {
  const { phase: a } = Bt(t, n), o = [...e.days === 2 ? [1, 4] : e.days === 3 ? [1, 3, 6] : e.days === 4 ? [1, 2, 4, 6] : e.days === 5 ? [0, 1, 3, 4, 6] : [0, 1, 2, 3, 4, 6]];
  if (o.includes(e.restDay)) {
    const I = Array.from({ length: 7 }, (f, l) => l).find((f) => f !== e.restDay && !o.includes(f));
    I !== void 0 && o.splice(o.indexOf(e.restDay), 1, I);
  }
  o.sort((I, f) => I - f);
  const u = ["criterium", "xco", "cyclocross"].includes(t.discipline), i = ["ultra", "stage-race", "xcm", "gravel", "gran-fondo"].includes(t.discipline), g = u ? "vo2" : i ? "tempo" : t.discipline === "tt" ? "sweetspot" : "tempo", m = e.experience === "beginner" ? "tempo" : g, w = a === "build" || a === "specific", S = a === "taper" || a === "post-event" || a === "event";
  return Array.from({ length: 7 }, (I, f) => {
    const l = o.indexOf(f);
    if (l < 0) return { day: f, workoutId: null, reason: "Scheduled recovery day" };
    const E = S ? l === 0 ? "recovery" : "endurance" : l === o.length - 1 ? "endurance" : l === 0 ? w ? m : "endurance" : l === 2 && w && u && e.experience === "advanced" ? "tempo" : l % 2 === 0 ? "recovery" : "endurance", T = a === "foundation" ? "General development" : Gt[t.discipline] + " · " + a;
    return { day: f, workoutId: E, reason: T + " preparation. " + (S ? "Keep the session easy and avoid chasing workload." : w ? "Match the event demands while maintaining recovery." : "Build consistent aerobic training.") };
  });
}
function vt() {
  const e = ne(mn);
  return Array.isArray(e) ? e.filter((t) => t && typeof t.workout == "string" && typeof t.date == "string").slice(-150) : [];
}
const qt = (e) => {
  const t = Math.max(0, Math.ceil(e));
  return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
}, ft = (e, t) => e.querySelector("#" + t);
function Eo(e) {
  var On;
  let n = Ke(ne(je) || bt), a = gn(ne(da) || wo), r = rn(n), o = "endurance", u = !1, i = null, g = "", m = null, w = [], S = null, I = null, f = [], l = wa(ne(Ft)), E = null, T = null, x = null, C = "structured";
  const A = "breakaway.coach.skipped-days.v1";
  function Y() {
    const s = ne(A);
    return Array.isArray(s) ? [...new Set(s.map(St).filter(Boolean))].slice(-90) : [];
  }
  let F = ne(yt) === !0 || ne(yt) === null && !!ne(je), V = [], O = null, M = null, ve = "", Ee = 0, $ = !1, L = null, P = 130;
  const b = document.getElementById("screenRoute"), k = document.createElement("section");
  k.id = "breakawayCoachScreen", k.className = "coach-screen coach-v2", k.hidden = !0, k.innerHTML = `
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
    <div class="coach-page-lead"><div><span class="coach-tag">YOUR NEXT SESSION</span><h2>Good morning, Coach.</h2><p id="coachSuggestion">Coach selects your session from your weekly plan and recent riding.</p></div><button type="button" class="coach-subtle-link" data-navigate-coach="plan">View my week →</button></div>
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
          <label>EVENT OR GOAL TYPE<select id="coachEventDiscipline">${Object.entries(Gt).map(([s, d]) => '<option value="' + s + '">' + d + "</option>").join("")}</select></label>
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
`, document.body.append(k);
  const H = k.querySelector(".coach-top"), U = k.querySelector(".coach-nav");
  k.insertBefore(U, H);
  const W = document.createElement("span");
  W.className = "coach-dashboard-brand-kicker", W.textContent = "RIDE BREAKAWAY", U.prepend(W), U.append(H.querySelector(".coach-header-actions")), k.querySelector("#coachTabToday").innerHTML = "⌂ <span>Dashboard</span>", k.querySelector("#coachTabPlan").innerHTML = "▣ <span>Training</span>", k.querySelector("#coachTabHistory").innerHTML = "▥ <span>Progress</span>", k.querySelector("#coachTabSettings").innerHTML = "⚙ <span>Settings</span>", k.querySelector("#coachTabImport").classList.add("coach-dashboard-import-nav");
  const Me = document.createElement("button");
  Me.type = "button", Me.className = "coach-subtle-link coach-dashboard-create-link", Me.dataset.navigateCoach = "import", Me.textContent = "Create a workout →", k.querySelector("#coachViewPlan .coach-page-lead").append(Me);
  const he = k.querySelector("#coachViewToday"), ee = he.querySelector(".coach-today-grid"), le = ee.querySelector(".coach-today-side"), _e = he.querySelector(".coach-morning");
  le.prepend(_e), he.classList.add("coach-preview-one");
  const We = he.querySelector(".coach-goal-headline"), Ie = he.querySelector("#coachAdaptiveToday");
  ee.after(We, Ie);
  const Vt = he.querySelector("#coachFirstRun");
  Ie.after(Vt);
  const st = () => {
    const s = Math.max(320, k.clientWidth || window.innerWidth);
    k.style.setProperty("--coach-artboard-scale", String(Math.min(1, s / 1920)));
  };
  st(), window.addEventListener("resize", st);
  const ze = he.querySelector(".coach-page-lead").querySelector("p"), Ye = document.createElement("p");
  Ye.className = "coach-dashboard-intro", Ye.textContent = "Here’s your training for this week. Stay consistent, build fitness, and enjoy the ride.", ze.before(Ye), ze.classList.add("coach-dashboard-original-suggestion");
  const me = ee.querySelector(".coach-workout-card").querySelector("#coachWorkoutControls"), J = document.createElement("div");
  J.className = "coach-dashboard-expanded", J.id = "coachDashboardExpanded", J.hidden = !0;
  for (const s of ["#coachIntervalDetails", ".coach-trainer-options", ".coach-start-note", ".coach-quick", "#coachAnswer", "#coachStatus"]) {
    const d = me.querySelector(s);
    d && J.append(d);
  }
  const ie = document.createElement("div");
  ie.className = "coach-dashboard-actions";
  const ye = k.querySelector("#coachStartClassic"), de = document.createElement("button");
  de.type = "button", de.id = "coachDashboardDetails", de.className = "coach-dashboard-details-button", de.setAttribute("aria-expanded", "false"), de.setAttribute("aria-controls", "coachDashboardExpanded"), de.textContent = "▣ View Details";
  const Tt = k.querySelector("#coachSwapToggle");
  ie.append(ye, de, Tt), me.append(J), me.after(ie), ie.setAttribute("aria-label", "Workout controls"), de.addEventListener("click", () => {
    J.hidden = !J.hidden, de.setAttribute("aria-expanded", String(!J.hidden)), de.textContent = J.hidden ? "▣ View Details" : "▣ Hide Details";
  });
  const Ce = document.createElement("div");
  Ce.className = "coach-dashboard-moods", Ce.setAttribute("role", "group"), Ce.setAttribute("aria-label", "How are you feeling today?"), Ce.innerHTML = "<h3>How are you feeling today?</h3>" + [["Low", "tired"], ["Below", "tired"], ["Okay", "okay"], ["Good", "great"], ["Great", "great"]].map(([s, d]) => '<button type="button" data-mood-value="' + d + '" data-mood-label="' + s + '" aria-pressed="false">' + s + "</button>").join(""), (On = _e.querySelector(".coach-section-top")) == null || On.after(Ce);
  const Xe = document.createElement("section");
  Xe.className = "coach-panel coach-dashboard-summary", Xe.innerHTML = '<div class="coach-section-top"><span class="coach-tag">WEEK SUMMARY</span></div><div class="coach-dashboard-stats"><div><strong id="coachDashWorkoutCount">—</strong><span>Workouts</span></div><div><strong id="coachDashWeekHours">—</strong><span>Total time</span></div><div><strong id="coachDashTss">—</strong><span>Estimated TSS</span></div><div><strong id="coachDashPhase">—</strong><span>Training phase</span></div></div><div id="coachDashLoadBars" class="coach-dashboard-load" aria-label="Weekly cycling intensity overview"></div><p class="coach-dashboard-estimate">TSS is an estimate from planned intervals, not recorded training load.</p>', _e.after(Xe);
  const Ze = he.querySelector(".coach-calendar-heading"), Oe = document.createElement("button");
  Oe.type = "button", Oe.className = "coach-dashboard-move-selected", Oe.textContent = "Move selected workout", Ze.append(Oe), Oe.addEventListener("click", () => {
    const s = f.find((d) => d.key === I) || f.find((d) => d.isToday);
    if (!(s != null && s.rideId)) {
      Oe.textContent = "Select a ride to move";
      return;
    }
    E = s.key, Oe.textContent = "Choose destination day above", rt();
  });
  const Mt = Ze.querySelector(".coach-tag");
  Mt.textContent = "This Week", Ce.addEventListener("click", (s) => {
    var v;
    const d = s.target.closest("[data-mood-value]");
    if (!d) return;
    const p = k.querySelector("#coachFeeling");
    p.value = d.dataset.moodValue || "okay", Ce.querySelectorAll("button").forEach((y) => y.setAttribute("aria-pressed", String(y === d))), (v = k.querySelector("#coachSaveCheckin")) == null || v.click();
  });
  const q = document.createElement("aside");
  q.id = "breakawayCoachHud", q.className = "coach-hud", q.hidden = !0, q.setAttribute("aria-label", "Live Breakaway Coach"), q.innerHTML = '<div class="coach-hud-top"><strong>◆ BREAKAWAY COACH</strong><span id="coachHudState">WAITING FOR PEDALS</span><button type="button" id="coachMinimize" aria-label="Minimize coaching panel">−</button></div><div class="coach-hud-core"><div><small>ACTUAL</small><strong id="coachActual">—<span> W</span></strong></div><div><small>TARGET</small><strong id="coachTarget">—<span> W</span></strong></div><div><small>REMAINING</small><strong id="coachRemaining">—</strong></div></div><div class="coach-interval-line"><span id="coachInterval">WARM UP</span><span id="coachSessionClock">0:00</span></div><div class="coach-progress"><div id="coachProgressBar"></div></div><p id="coachPrompt" aria-live="polite">Connect a trainer, then start pedaling.</p><div class="coach-hud-actions"><button type="button" id="coachLighter">−5% EFFORT</button><button type="button" id="coachHarder">+5% EFFORT</button><button type="button" id="coachEnd">END COACHING</button></div>', document.body.append(q);
  const h = (s) => ft(k, s), ue = (s) => ft(q, s), qe = h("coachControl"), Be = ["today", "plan", "history", "settings", "import"];
  function fe(s, d = !1) {
    k.classList.toggle("coach-artboard-mode", s === "today" || s === "plan"), k.classList.toggle("coach-training-mode", s === "plan"), k.querySelectorAll("[data-coach-tab]").forEach((p) => {
      const v = p.dataset.coachTab === s;
      p.setAttribute("aria-selected", String(v)), p.tabIndex = v ? 0 : -1, v && d && p.focus();
    }), k.querySelectorAll("[data-coach-view]").forEach((p) => {
      p.hidden = p.dataset.coachView !== s;
    }), k.scrollTop = 0, s === "history" && Jt();
  }
  k.querySelectorAll("[data-coach-tab]").forEach((s) => {
    s.addEventListener("click", () => fe(s.dataset.coachTab)), s.addEventListener("keydown", (d) => {
      const p = Be.indexOf(s.dataset.coachTab);
      let v = -1;
      d.key === "ArrowRight" && (v = (p + 1) % Be.length), d.key === "ArrowLeft" && (v = (p + Be.length - 1) % Be.length), d.key === "Home" && (v = 0), d.key === "End" && (v = Be.length - 1), v >= 0 && (d.preventDefault(), fe(Be[v], !0));
    });
  }), k.querySelectorAll("[data-navigate-coach]").forEach((s) => s.addEventListener("click", () => {
    const d = s.dataset.navigateCoach;
    Be.includes(d) && fe(d, !0);
  }));
  function Tn() {
    if (F = ne(yt) === !0 || ne(yt) === null && !!ne(je), M) {
      q.hidden = !1;
      return;
    }
    k.hidden = !1, document.body.classList.add("coach-planning"), fe("today"), Ct(), h("coachFtpKnown").dispatchEvent(new Event("change")), F || (C = "guided", qe.value = "guided");
    const s = hn(ne(un), Le(/* @__PURE__ */ new Date()));
    if (s) {
      h("coachFeeling").value = s.feeling;
      for (const [d, p] of [["coachBattery", s.bodyBattery], ["coachSleep", s.sleepScore], ["coachHrv", s.hrvMs]]) h(d).value = p === null ? "" : String(p);
    } else {
      h("coachFeeling").value = "okay";
      for (const d of ["coachBattery", "coachSleep", "coachHrv"]) h(d).value = "";
    }
    te(), Jt(), window.scrollTo(0, 0);
  }
  function Kt() {
    k.hidden = !0, document.body.classList.remove("coach-planning");
  }
  b == null || b.addEventListener("click", (s) => {
    const d = s.target;
    d instanceof Element && d.closest("#openBreakawayCoach") && Tn();
  }), h("coachBack").addEventListener("click", Kt);
  function Ue(s = /* @__PURE__ */ new Date()) {
    return io(
      n,
      (O == null ? void 0 : O.settings) || va,
      a.discipline === "general" ? ua(n, !1) : So(n, a, s),
      (d) => Math.round(Z(r.find((p) => p.id === d) || r[0]) / 60)
    );
  }
  function It() {
    const s = V.map((y) => ({ start: y.start, elapsed: y.elapsed, avgPower: y.avgPower })), d = w.filter((y) => !s.some((D) => Math.abs(D.start - y.start) < 12e4)).map((y) => ({ start: y.start, elapsed: y.duration, avgPower: y.avgPower, source: "import" })), p = s.concat(d), v = vt().filter((y) => y.mode === "classic" && y.elapsedSeconds > 0).map((y) => ({
      start: Date.parse(y.date) - y.elapsedSeconds * 1e3,
      elapsed: y.elapsedSeconds,
      avgPower: y.averageWatts,
      source: "classic"
    })).filter((y) => Number.isFinite(y.start) && !p.some((D) => Math.abs(D.start - y.start) < 12e4));
    return p.concat(v);
  }
  function _t() {
    return vt().map((s) => ({ date: Date.parse(s.date), rpe: s.rpe }));
  }
  function Mn() {
    const s = _t().concat(((O == null ? void 0 : O.history) || []).map((d) => ({ date: Date.parse(d.date), rpe: d.rpe })));
    return yn(n, Date.now(), F ? It() : It().map((d) => ({ ...d, avgPower: null })), s).fatigued;
  }
  function zt() {
    const s = h("coachEventDiscipline").value;
    h("coachEventStagesWrap").hidden = s !== "stage-race", h("coachEventStages").disabled = s !== "stage-race", s === "stage-race" && Number(h("coachEventStages").value) < 2 && (h("coachEventStages").value = "2"), h("coachEventStageHint").hidden = s !== "stage-race", h("coachGeneralFocusWrap").hidden = s !== "general";
    const d = gn({ discipline: s, date: h("coachEventDate").value }), p = Bt(d, /* @__PURE__ */ new Date());
    h("coachGoalPhaseSummary").textContent = d.discipline === "general" ? "General fitness: build a sustainable weekly routine." : p.weeksLeft === null ? "Set an event date to calculate training phases." : p.weeksLeft + " weeks remaining · " + p.phase.toUpperCase() + " phase. " + p.description;
  }
  function Ct() {
    h("coachFtp").value = String(n.ftp), h("coachFtpKnown").value = F ? "yes" : "no", h("coachHours").value = String(n.hours), h("coachDays").value = String(n.days), h("coachRestDay").value = String(n.restDay), h("coachExperience").value = n.experience, h("coachGoal").value = n.goal, h("coachEventDiscipline").value = a.discipline, h("coachEventName").value = a.name, h("coachEventDate").value = a.date, h("coachEventPriority").value = a.priority, h("coachEventObjective").value = a.objective, h("coachEventTerrain").value = a.terrain;
    for (const [s, d] of [["coachEventDistance", a.distanceKm === null ? null : Math.round(a.distanceKm / 1.609344 * 10) / 10], ["coachEventDuration", a.durationMinutes], ["coachEventElevation", a.elevationM === null ? null : Math.round(a.elevationM / 0.3048)], ["coachEventStages", a.stages]]) h(s).value = d === null ? "" : String(d);
    zt();
  }
  function it() {
    if (I) {
      const y = f.find((j) => j.key === I), D = y != null && y.rideId ? r.find((j) => j.id === y.rideId) : null;
      if (D) return y.rideMinutes >= 15 && y.rideMinutes * 60 < Z(D) ? Pt(D, y.rideMinutes) : D;
    }
    if (m) return m;
    const s = r.find((y) => y.id === o) || r[0];
    if (u) {
      const y = i;
      return y !== null && y >= 15 && y * 60 < Z(s) ? Pt(s, y) : s;
    }
    const d = Ue().days.find((y) => y.day === (/* @__PURE__ */ new Date()).getDay()), p = O != null && O.settings.enabled && (d == null ? void 0 : d.cyclingId) === s.id && d.cyclingMinutes > 0 ? d.cyclingMinutes : 1 / 0, v = Math.min(x ?? 1 / 0, p);
    return Number.isFinite(v) && v >= 15 && v * 60 < Z(s) ? Pt(s, v) : s;
  }
  function In(s) {
    const d = it(), p = d.segments[s];
    if (!p) return;
    const v = _n(n.ftp, p);
    h("coachIntervalDetails").innerHTML = '<div class="coach-interval-identity"><span class="coach-interval-kicker">BLOCK ' + (s + 1) + " / " + d.segments.length + "</span><strong>" + R(p.name) + "</strong><small>" + v.ftpRange + '</small></div><div class="coach-interval-numbers"><div><span>DURATION</span><strong>' + v.duration + "</strong></div><div><span>POWER RANGE</span><strong>" + v.range + "</strong></div><div><span>ERG TARGET</span><strong>" + v.target + " W</strong></div></div>", h("coachSegments").querySelectorAll("[data-coach-segment]").forEach((y) => {
      y.setAttribute("aria-pressed", String(Number(y.dataset.coachSegment) === s));
    });
  }
  const Rt = h("coachSegments"), Xt = (s) => {
    const d = s.target;
    if (!(d instanceof Element)) return;
    const p = d.closest("[data-coach-segment]");
    p && Rt.contains(p) && In(Number(p.dataset.coachSegment));
  };
  Rt.addEventListener("pointerover", Xt), Rt.addEventListener("focusin", Xt), Rt.addEventListener("click", Xt);
  function Dt(s, d = !1) {
    return d ? "completed" : s ? s === "recovery" ? "recovery" : s === "vo2" ? "intensity" : s === "sweetspot" ? "threshold" : s === "tempo" ? "tempo" : "endurance" : "rest";
  }
  function rt() {
    var $e;
    const s = h("coachCalendarStrip"), d = h("coachCalendarDetails"), p = f.findIndex((K) => K.key === S), v = I || (($e = f.find((K) => K.isToday)) == null ? void 0 : $e.key);
    s.innerHTML = f.map((K, Ae) => {
      const Pe = K.reason.startsWith("Event stage "), Q = K.rideName || (K.completedRide ? "Ride completed" : Pe ? "Event day" : null), oe = K.isToday && (O == null ? void 0 : O.completedToday()) === !0, Je = K.strength ? oe ? "✓ Strength completed" : "Full Body Strength " + K.strength : null, Lt = [Q, Je].filter(Boolean);
      return '<button type="button" class="coach-calendar-pill' + (K.key === v ? " is-today" : "") + '" data-workout-color="' + Dt(K.rideId, K.completedRide) + '" data-calendar-index="' + Ae + '" draggable="' + !!(K.rideId && !K.completedRide) + '" aria-expanded="' + (K.key === S) + '" aria-controls="coachCalendarDetails" aria-label="' + R(K.title + ": " + (Lt.join(", ") || "Rest day") + ". " + (K.key === S ? "Collapse details." : "Expand details.")) + '"><span class="coach-calendar-date">' + R(K.label) + '</span><span class="coach-calendar-activity">' + R(Q || (Je ? "" : "Rest day")) + "</span>" + (Je ? '<span class="coach-calendar-strength">' + R(Je) + "</span>" : "") + '<span class="coach-calendar-chevron" aria-hidden="true">' + (K.key === S ? "⌃" : "⌄") + "</span></button>";
    }).join("");
    const y = f[p];
    if (d.hidden = !y, !y) {
      d.innerHTML = "";
      return;
    }
    d.setAttribute("aria-label", "Workouts for " + y.title);
    const D = y.rideId ? r.find((K) => K.id === y.rideId) : null, j = D ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">CYCLING</span><strong>' + R(D.name) + "</strong><p>" + y.rideMinutes + " min · " + R(D.description) + "</p><p>" + R(y.reason) + '</p></div><div class="coach-calendar-session-actions"><button type="button" data-calendar-action="ride" data-calendar-index="' + p + '">' + (y.isToday ? "VIEW TODAY’S RIDE" : "USE THIS RIDE TODAY (OPTIONAL)") + ' →</button><button type="button" data-calendar-action="move" data-calendar-index="' + p + '">' + (E === y.key ? "CANCEL MOVE" : "MOVE WORKOUT") + "</button></div></div>" : y.completedRide ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">CYCLING</span><strong>Ride completed today</strong><p>Coach will account for your recorded ride.</p></div></div>' : "", re = y.isToday && (O == null ? void 0 : O.completedToday()) === !0, X = y.strength ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">' + (re ? "STRENGTH · COMPLETED" : "STRENGTH · NO TRAINER NEEDED") + "</span><strong>Full Body Strength " + y.strength + "</strong><p>" + y.strengthMinutes + " min · Exercises matched to your saved equipment</p></div>" + (re ? "" : '<button type="button" data-calendar-action="strength" data-calendar-index="' + p + '">' + (y.isToday ? "START STRENGTH" : "START STRENGTH TODAY (OPTIONAL)") + " →</button>") + "</div>" : "", z = y.reason.startsWith("Event stage "), Ge = !j && !X ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">' + (z ? "EVENT DAY" : "RECOVERY") + "</span><strong>" + (z ? "Race or stage day" : "Rest day") + "</strong><p>" + (z ? R(y.reason) : "No workout is scheduled. Recovery is part of your plan.") + "</p></div></div>" : "";
    d.innerHTML = '<div class="coach-calendar-detail-head"><div><span class="coach-calendar-type">DAY DETAILS</span><h3>' + R(y.title) + '</h3></div><button type="button" class="coach-calendar-close" data-calendar-action="close" aria-label="Close calendar day details">✕</button></div><div class="coach-calendar-detail-grid">' + j + X + Ge + "</div>" + (E ? '<p class="coach-move-hint">Select a destination day above. Cycling sessions swap if both days have rides; strength stays put.</p>' : "");
  }
  h("coachCalendarStrip").addEventListener("click", (s) => {
    var y;
    const d = s.target;
    if (!(d instanceof Element)) return;
    const p = d.closest("[data-calendar-index]");
    if (!p) return;
    const v = f[Number(p.dataset.calendarIndex)];
    if (v) {
      if (E && v.key !== E) {
        At(E, v.key);
        return;
      }
      I = v.isToday ? null : v.key, S = null, h("coachDashboardExpanded").hidden = !0, h("coachDashboardDetails").setAttribute("aria-expanded", "false"), te(), (y = h("coachCalendarStrip").querySelectorAll("[data-calendar-index]")[Number(p.dataset.calendarIndex)]) == null || y.focus();
    }
  });
  function At(s, d, p = !1) {
    var j;
    if (!p) {
      const re = f.map((z) => ({
        key: z.key,
        rideId: z.rideId,
        rideMinutes: z.rideMinutes,
        strengthMinutes: z.strengthMinutes,
        completedRide: z.completedRide,
        eventDay: z.reason.startsWith("Event stage ")
      })), X = po(re, s, d);
      if (X.warning) {
        T = { from: s, to: d, suggestedKey: X.suggestedKey };
        const z = h("coachMoveRecoveryWarning");
        z.innerHTML = "<strong>RECOVERY CHECK</strong><p>" + R(X.warning) + "</p>" + (X.suggestedKey ? '<button type="button" data-move-decision="suggested">MOVE TO ' + R(X.suggestedKey) + " INSTEAD</button>" : "") + '<button type="button" data-move-decision="proceed">MOVE ANYWAY</button><button type="button" data-move-decision="cancel">KEEP CURRENT PLAN</button>', z.hidden = !1, z.scrollIntoView({ block: "nearest", behavior: "smooth" }), (j = z.querySelector('[data-move-decision="cancel"]')) == null || j.focus();
        return;
      }
    }
    T = null, h("coachMoveRecoveryWarning").hidden = !0;
    const v = f.find((re) => re.key === s), y = f.find((re) => re.key === d);
    if (!v || !y || !v.rideId || v.completedRide || y.completedRide || v.reason.startsWith("Event stage ") || y.reason.startsWith("Event stage ")) return;
    const D = lo(
      l,
      s,
      d,
      { cyclingId: v.rideId, cyclingMinutes: v.rideMinutes },
      { cyclingId: y.rideId, cyclingMinutes: y.rideMinutes }
    );
    if (D !== l) {
      if (!pe(Ft, D)) {
        alert("Unable to save this calendar change. Check browser storage.");
        return;
      }
      l = D, E = null, S = d, u = !1, te();
    }
  }
  const Re = document.createElement("section");
  Re.id = "coachMoveRecoveryWarning", Re.className = "coach-move-recovery-warning", Re.setAttribute("role", "alert"), Re.setAttribute("aria-label", "Recovery-aware scheduling warning"), Re.hidden = !0, h("coachCalendarDetails").after(Re), Re.addEventListener("click", (s) => {
    var y;
    const d = s.target;
    if (!(d instanceof Element)) return;
    const p = (y = d.closest("[data-move-decision]")) == null ? void 0 : y.dataset.moveDecision;
    if (!p || !T) return;
    const v = T;
    if (p === "cancel") {
      T = null, Re.hidden = !0, E = null, rt();
      return;
    }
    if (p === "suggested" && v.suggestedKey) {
      T = null, Re.hidden = !0, At(v.from, v.suggestedKey);
      return;
    }
    p === "proceed" && At(v.from, v.to, !0);
  });
  const xt = h("coachCalendarStrip");
  xt.addEventListener("dragstart", (s) => {
    const d = s.target;
    if (!(d instanceof Element)) return;
    const p = d.closest("[data-calendar-index]"), v = f[Number(p == null ? void 0 : p.dataset.calendarIndex)];
    if (!(v != null && v.rideId) || v.completedRide) {
      s.preventDefault();
      return;
    }
    E = v.key, s.dataTransfer && (s.dataTransfer.effectAllowed = "move", s.dataTransfer.setData("text/plain", v.key));
  }), xt.addEventListener("dragover", (s) => {
    s.target instanceof Element && s.target.closest("[data-calendar-index]") && s.preventDefault();
  }), xt.addEventListener("drop", (s) => {
    s.preventDefault();
    const d = s.target;
    if (!(d instanceof Element)) return;
    const p = d.closest("[data-calendar-index]"), v = f[Number(p == null ? void 0 : p.dataset.calendarIndex)];
    v && E && At(E, v.key);
  }), xt.addEventListener("dragend", () => {
    T || (E = null);
  }), h("coachCalendarDetails").addEventListener("click", (s) => {
    var y;
    const d = s.target;
    if (!(d instanceof Element)) return;
    const p = d.closest("[data-calendar-action]");
    if (!p) return;
    if (p.dataset.calendarAction === "close") {
      const D = f.findIndex((j) => j.key === S);
      S = null, rt(), D >= 0 && ((y = h("coachCalendarStrip").querySelectorAll("[data-calendar-index]")[D]) == null || y.focus());
      return;
    }
    const v = f[Number(p.dataset.calendarIndex)];
    if (v) {
      if (p.dataset.calendarAction === "move" && v.rideId) {
        E = E === v.key ? null : v.key, rt();
        return;
      }
      p.dataset.calendarAction === "ride" && v.rideId ? (o = v.rideId, u = !0, i = v.rideMinutes, m = null, S = null, te(), h("coachRecommendedName").scrollIntoView({ block: "center", behavior: "smooth" })) : p.dataset.calendarAction === "strength" && v.strength && Zt(v.strength, v.strengthMinutes);
    }
  });
  function te() {
    var Vn, Kn;
    r = rn(n);
    const s = /* @__PURE__ */ new Date(), d = Le(s);
    d !== g && (g = d, u = !1, i = null, m = null, S = null, I = null);
    const p = It(), v = _t(), y = F ? p : p.map((c) => ({ ...c, avgPower: null })), D = hn(ne(un), d), j = ka(D), re = bo(D, yn(n, s.getTime(), y, v), p.some((c) => c.start >= new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime() && c.elapsed >= 900));
    h("coachReadinessLabel").textContent = re.label, h("coachReadinessLabel").setAttribute("data-day-color", re.color), h("coachReadinessExplanation").textContent = re.detail + " " + j.detail;
    const X = Ue(s), z = X.days.find((c) => c.day === s.getDay()), Ge = sa(d, z, l), $e = Xn(
      n,
      s,
      y,
      v,
      X.days.map((c) => ({
        day: c.day,
        workoutId: c.day === s.getDay() ? Ge.cyclingId : c.cyclingId,
        reason: c.day === s.getDay() ? Ge.reason : c.reason
      }))
    ), K = Object.prototype.hasOwnProperty.call(l, d), Ae = K && $e.status !== "completed" ? { ...$e, workoutId: Ge.cyclingId, status: Ge.cyclingId ? "planned" : "rest", reason: Ge.reason } : fo($e, D), Pe = mo({
      now: s,
      week: X.days,
      rides: p,
      feedback: v,
      skipped: Y(),
      ftp: n.ftp,
      ftpKnown: F,
      budgetMinutes: X.budgetMinutes,
      today: Ae,
      recoveryMinutes: Math.round(Z(r.find((c) => c.id === "recovery")) / 60),
      planForDate: (c) => {
        const N = Ue(c).days.find((B) => B.day === c.getDay());
        return N ? sa(Le(c), N, l) : void 0;
      },
      originalPlanForDate: (c) => Ue(c).days.find((N) => N.day === c.getDay()),
      manualOverrides: Object.keys(l),
      event: a.discipline !== "general" && a.date ? { startDate: a.date, stages: a.discipline === "stage-race" ? a.stages : 1 } : void 0
    }), Q = Pe.days.find((c) => c.key === d) ?? {
      weekday: s.getDay(),
      originalId: ((Vn = X.days.find((c) => c.day === s.getDay())) == null ? void 0 : Vn.cyclingId) ?? null,
      workoutId: Ae.workoutId,
      minutes: Ae.workoutId ? Math.round(Z(r.find((c) => c.id === Ae.workoutId) || r[0]) / 60) : 0,
      status: Ae.status === "recovery" ? "recovery" : Ae.workoutId ? "planned" : "rest",
      reason: Ae.reason,
      strength: null,
      strengthMinutes: 0
    };
    x = Q.minutes;
    const oe = {
      workoutId: Q.workoutId,
      status: Q.status === "completed" ? "completed" : Q.status === "recovery" ? "recovery" : Q.status === "rest" || Q.status === "skipped" ? "rest" : "planned",
      reason: Q.reason
    }, Je = Y().includes(d);
    h("coachSkipToday").textContent = Je ? "Undo skipped session" : "Skip today's session", f = co(s, X.days, r, oe).map((c) => {
      const N = Pe.days.find((_) => _.key === c.key);
      if (!N) return c;
      const B = r.find((_) => _.id === N.workoutId);
      return {
        ...c,
        rideId: (B == null ? void 0 : B.id) || null,
        rideName: (B == null ? void 0 : B.name) || null,
        rideDescription: (B == null ? void 0 : B.description) || null,
        rideMinutes: N.minutes,
        strength: N.strength,
        strengthMinutes: N.strengthMinutes,
        completedRide: N.status === "completed",
        reason: N.reason
      };
    }), I && !f.some((c) => c.key === I) && (I = null), rt();
    const Lt = (c) => {
      var _, se;
      const N = ((_ = r.find((be) => be.id === c.originalId)) == null ? void 0 : _.name) || (c.originalId ? "Planned ride" : "Rest day"), B = ((se = r.find((be) => be.id === c.workoutId)) == null ? void 0 : se.name) || (c.kind === "completed" ? "Ride recorded" : c.kind === "skipped" ? "Skipped" : c.kind === "missed" ? "Not completed" : c.kind === "event" ? "Race or event day" : "No ride scheduled");
      return "<li><strong>" + R(c.key) + "</strong> · " + R(N) + " (" + c.beforeMinutes + " min) → " + R(B) + " (" + c.afterMinutes + " min)<p>" + R(c.reason) + "</p></li>";
    }, ct = Pe.changes.filter((c) => c.key >= d), Pn = h("coachAdaptiveToday");
    Pn.hidden = ct.length === 0, Pn.innerHTML = ct.length ? "<strong>YOUR UPDATED TRAINING WEEK · " + ct.length + " CHANGE" + (ct.length === 1 ? "" : "S") + "</strong><p>Coach checks swaps, completed rides, fatigue, and recovery. Unchanged days stay as planned.</p><ul>" + ct.map(Lt).join("") + "</ul>" : "";
    const nn = Pe.changes.filter((c) => c.key <= Pe.days[6].key), Hn = h("coachAdaptiveWeek");
    Hn.hidden = nn.length === 0, Hn.innerHTML = nn.length ? "<strong>WHAT CHANGED IN YOUR WEEK</strong><p>Manual swaps and recovery adjustments are date-specific. Strength sessions and rest days stay protected.</p><ul>" + nn.map(Lt).join("") + "</ul>" : "", X.days[s.getDay()];
    const an = !!Q.strength, on = (O == null ? void 0 : O.completedToday()) || !1, He = an && !Q.workoutId, Fn = Mn();
    u || (o = oe.workoutId || "recovery", m = null), r.some((c) => c.id === o) || (o = "recovery", m = null);
    const ce = I ? f.find((c) => c.key === I) : null, Qe = ce != null && ce.rideId ? r.find((c) => c.id === ce.rideId) : null, et = ce ? !Qe : !u && (!oe.workoutId || He);
    h("coachRestState").hidden = !et, h("coachWorkoutControls").hidden = et, h("coachStartClassic").hidden = et, h("coachDashboardDetails").hidden = et, h("coachRecommendedName").textContent = ce ? (Qe == null ? void 0 : Qe.name) || "Rest day" : et ? Q.status === "event" ? "Race / event day" : He ? "Strength training day" : oe.status === "completed" ? "Ride already completed" : "Rest day" : it().name, h("coachRecommendationLabel").textContent = ce ? "SELECTED DAY · " + ce.label : u ? "YOUR CHOICE" : Q.status === "event" ? "EVENT DAY" : He ? "STRENGTH DAY" : oe.status === "recovery" ? "RECOVERY ADJUSTMENT" : oe.status === "rest" || oe.status === "completed" ? "REST RECOMMENDED" : "FROM YOUR PLAN", h("coachWhy").textContent = ce ? Qe ? (ce.rideDescription || Qe.description) + " · " + ce.rideMinutes + " min. Start this ride today only if you choose to; its scheduled date will not change." : "No cycling workout is scheduled for " + ce.label + "." : Q.status === "event" && !u ? "Your event takes priority. There is no additional prescribed trainer ride today." : He && !u ? "Your plan includes strength today. No cycling workout is scheduled." : et ? "Coach recommends rest today." : u ? "You chose an optional alternative for today. Coach originally recommended: " + oe.reason : "Why Coach chose this: " + oe.reason;
    const Ot = ((Kn = X.days.find((c) => c.day === s.getDay())) == null ? void 0 : Kn.cyclingId) || null, Wn = !u && oe.status === "recovery" && Ot && Ot !== oe.workoutId;
    if (h("coachChangeDetail").hidden = !Wn, Wn) {
      const c = r.find((se) => se.id === Ot), N = r.find((se) => se.id === oe.workoutId), B = c ? Math.round(Z(c) / 60) : null, _ = N ? Math.round(Z(N) / 60) : null;
      h("coachChangeDetail").innerHTML = '<strong>WHY TODAY CHANGED</strong><div class="coach-change-pair"><span>ORIGINAL: ' + R((c == null ? void 0 : c.name) || Ot) + (B === null ? "" : " · " + B + " min") + "</span><span>RECOMMENDED: " + R((N == null ? void 0 : N.name) || "Recovery spin") + (_ === null ? "" : " · " + _ + " min") + "</span></div><p>" + R(oe.reason) + "</p><p>See the updated training week for any changes to upcoming sessions. To ride the original workout today, select it under Swap workout.</p>";
    }
    h("coachRestReason").textContent = ce ? "This is " + ce.label + " on your training calendar. Selecting it does not modify your schedule." : Q.status === "event" ? Q.reason : He ? "Your strength session is ready above. No trainer needed. You can still pick an optional cycling workout." : oe.reason, h("coachUseRecommendation").hidden = !!ce || !u && !K;
    const lt = it(), Ma = Z(lt);
    h("coachWorkoutInfo").innerHTML = "<div><strong>" + R(lt.category.toUpperCase()) + "</strong><span>" + Math.round(Ma / 60) + " MINUTES · " + lt.segments.length + " SEGMENTS</span></div><p>" + R(lt.description) + "</p>" + (F ? "" : "<p><strong>FTP not yet established:</strong> displayed watt values are examples, not individualized targets. Keep the first ride conversational and use guided SIM mode, not ERG.</p>"), h("coachSegments").innerHTML = lt.segments.map((c, N) => {
      const B = (c.low + c.high) / 2, _ = B < 0.65 ? "easy" : B < 0.75 ? "steady" : "work", se = _ === "work" ? "#FFAC4C" : _ === "steady" ? "#78AEDD" : "#598FC8", be = Math.max(8, Math.min(100, Math.round(B * 100))), Se = _n(n.ftp, c), pt = c.name + " — " + Se.duration + " duration, " + Se.range + " power range, " + Se.target + " W ERG target (" + Se.ftpRange + ")";
      return '<button type="button" class="coach-segment" data-effort="' + _ + '" data-coach-segment="' + N + '" aria-pressed="false" aria-label="' + R(pt) + '" title="' + R(pt) + '" style="flex:' + c.minutes + '"><span class="coach-segment-bar" aria-hidden="true" style="height:' + be + "%;background:" + se + '"></span></button>';
    }).join(""), In(0), qe.value = C;
    const Yn = vt();
    s.getDay();
    const qn = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"], dt = Bt(a, s);
    h("coachGoalHeadlineLabel").textContent = a.discipline === "general" ? "Balanced cycling fitness" : a.name || Gt[a.discipline], h("coachGoalHeadlineMeta").textContent = a.discipline === "general" ? "Build consistency and endurance" : (dt.phase === "event" ? "Event underway" : dt.phase === "post-event" ? "Event completed" : dt.weeksLeft === null ? "Set an event date" : dt.weeksLeft + " weeks to go") + " · " + dt.phase.toUpperCase() + " PHASE", h("coachHeaderFtp").textContent = F ? "FTP " + n.ftp + " W" : "FTP NOT SET";
    const Bn = !!ne(je);
    h("coachFirstRun").hidden = Bn, h("coachStartLabel").textContent = Bn ? "CONNECT MY TRAINER" : "SET UP MY PLAN TO START", h("coachProfileSummary").innerHTML = "<div><strong>" + (F ? n.ftp + " W" : "Not set") + "</strong><span>FTP</span></div><div><strong>" + n.hours + " h</strong><span>Per week</span></div><div><strong>" + n.days + " days</strong><span>Training days</span></div>";
    const Un = f.slice(1).flatMap((c) => {
      const N = [];
      return c.rideId && c.rideMinutes > 0 && N.push({ key: c.key, weekday: c.date.getDay(), name: c.rideName || "Cycling ride", type: "ride", id: c.rideId, minutes: c.rideMinutes }), c.strength && c.strengthMinutes > 0 && N.push({ key: c.key, weekday: c.date.getDay(), name: "Full Body Strength " + c.strength, type: "strength", id: c.strength, minutes: c.strengthMinutes }), N;
    }).slice(0, 3);
    h("coachNextUp").innerHTML = Un.length ? Un.map(
      (c) => '<button type="button" class="coach-upcoming-item" data-workout-color="' + (c.type === "ride" ? Dt(c.id) : "strength") + '" data-upcoming-key="' + c.key + '" data-upcoming-type="' + c.type + '" data-upcoming-workout="' + R(c.id) + '"><strong>' + qn[c.weekday] + "</strong><span>" + R(c.name) + "<small>" + c.minutes + " min · " + (c.type === "ride" ? "Ride" : "Strength") + " · " + c.key + '</small></span><span aria-hidden="true">→</span></button>'
    ).join("") : '<p class="coach-small">No more workouts in your next seven days. Rest or review your plan.</p>', h("coachPlanLibrary").innerHTML = r.map((c) => {
      const N = Math.round(Z(c) / 60);
      return '<button type="button" class="coach-library-item" data-library-workout="' + R(c.id) + '"><span><strong>' + R(c.name) + "</strong><small>" + R(c.category) + " · " + N + ' min</small></span><span aria-hidden="true">→</span></button>';
    }).join("");
    const ut = f.map((c) => {
      const N = Pe.days.find((se) => se.key === c.key), B = !!c.rideId && c.rideMinutes > 0, _ = B ? r.find((se) => se.id === c.rideId) : void 0;
      return {
        key: c.key,
        weekday: c.date.getDay(),
        workoutId: B ? c.rideId : null,
        name: (_ == null ? void 0 : _.name) ?? null,
        minutes: B ? c.rideMinutes : 0,
        strength: c.strength,
        strengthMinutes: c.strengthMinutes,
        status: (N == null ? void 0 : N.status) ?? "rest",
        reason: c.reason,
        changed: (N == null ? void 0 : N.changed) ?? !1,
        missingWorkout: B && !_
      };
    }), Ia = ut.reduce((c, N) => c + N.minutes + N.strengthMinutes, 0), sn = ut.filter((c) => c.workoutId && c.minutes > 0), Ca = sn.reduce((c, N) => c + N.minutes, 0), Ra = ut.reduce((c, N) => c + N.strengthMinutes, 0), Da = sn.reduce((c, N) => {
      const B = r.find((be) => be.id === N.workoutId);
      if (!B) return c;
      const _ = B.segments.reduce((be, Se) => be + Se.minutes, 0);
      if (!_) return c;
      const se = B.segments.reduce((be, Se) => {
        const pt = (Se.low + Se.high) / 2;
        return be + Se.minutes / 60 * pt * pt * 100;
      }, 0);
      return c + se * (N.minutes / _);
    }, 0);
    h("coachDashWorkoutCount").textContent = String(sn.length), h("coachDashWeekHours").textContent = ((Ca + Ra) / 60).toFixed(1) + " h", h("coachDashTss").textContent = Math.round(Da).toString(), h("coachDashPhase").textContent = Bt(a, s).phase.replace(/(^|-)\w/g, (c) => c.replace("-", " ").toUpperCase()), h("coachDashLoadBars").innerHTML = ut.map(
      (c) => '<span class="coach-dashboard-load-item" data-workout-color="' + Dt(c.workoutId, c.status === "completed") + '" title="' + R(c.name || "Rest") + '"></span>'
    ).join(""), h("coachPlanBudget").textContent = "Next 7 days cycling + strength: " + (Ia / 60).toFixed(1) + " h · Weekly time goal: " + (X.budgetMinutes / 60).toFixed(1) + " h · " + X.note, h("coachWeek").innerHTML = ut.map((c) => {
      const N = c.key < d, B = c.workoutId && c.name && c.minutes > 0 && !N ? '<button type="button" data-day-workout="' + R(c.workoutId) + '" data-workout-color="' + Dt(c.workoutId) + '" data-day-key="' + c.key + '"><span><strong>🚴 ' + R(c.name) + "</strong><small>" + c.minutes + " min · " + (c.changed ? "Adjusted · " : "") + 'Classic cycling</small></span><span aria-hidden="true">→</span></button>' : c.missingWorkout ? '<span class="coach-day-warning">Workout missing from library — review your setup</span>' : c.status === "completed" ? '<span class="coach-day-rest">✓ Ride recorded</span>' : c.status === "skipped" ? '<span class="coach-day-rest">Skipped by you · not rescheduled</span>' : c.status === "missed" ? '<span class="coach-day-rest">Not completed · not rescheduled</span>' : c.status === "event" ? '<span class="coach-day-event">🏁 Event day · no indoor session scheduled</span>' : "", _ = c.strength && !N ? '<button type="button" class="coach-day-strength" data-strength-day="' + c.weekday + '" data-strength-variation="' + c.strength + '"><span><strong>▥ Full Body Strength ' + c.strength + "</strong><small>" + c.strengthMinutes + " min" + (c.key === d ? "" : " · Start today (optional)") + " · " + R(((O == null ? void 0 : O.settings.equipment) || []).filter((se) => se !== "bodyweight").join(", ") || "Bodyweight") + '</small></span><span aria-hidden="true">→</span></button>' : c.strength ? '<span class="coach-day-rest">Strength was scheduled</span>' : "";
      return '<div class="coach-day-row ' + (c.key === d ? "coach-week-today" : "") + '"><span class="coach-day-label">' + qn[c.weekday] + "<small>" + R(c.key.slice(5)) + '</small></span><div class="coach-day-items">' + (B + _ || '<span class="coach-day-rest">Rest day</span>') + (c.changed ? '<small class="coach-adaptive-inline">' + R(c.reason) + "</small>" : "") + "</div></div>";
    }).join("");
    const ht = h("coachStrengthToday"), Gn = h("coachViewToday").querySelector(".coach-today-grid"), jn = h("coachViewToday").querySelector(".coach-today-side");
    if (He ? Gn.insertBefore(ht, Gn.firstElementChild) : jn.insertBefore(ht, jn.firstElementChild), ht.classList.toggle("coach-strength-primary", He), ht.hidden = !an, an) {
      const c = bn(O.settings, Q.strength, Fn);
      ht.innerHTML = '<div class="coach-section-top"><span class="coach-tag">TODAY · STRENGTH</span><span class="coach-tag">' + (on ? "COMPLETED" : "NO TRAINER NEEDED") + "</span></div><h3>" + R(c.title) + "</h3><p>" + Q.strengthMinutes + " minutes · " + c.exercises.length + " movements · Matched to your available equipment." + (Fn ? " Recent fatigue suggests going easy or skipping." : "") + '</p><button type="button" id="coachStartStrength" ' + (on ? "disabled" : "") + ">" + (on ? "✓ SESSION LOGGED" : "START STRENGTH WORKOUT →") + "</button>";
    }
    h("coachStrengthHistory").innerHTML = O != null && O.history.length ? '<div class="coach-strength-history">' + O.history.slice(-6).reverse().map((c) => "<div><span><strong>" + R(c.routine) + "</strong><br>" + new Date(c.date).toLocaleDateString() + "</span><small>" + c.completedSets + "/" + c.plannedSets + " sets · " + c.minutes + " min</small></div>").join("") + "</div>" : '<p class="coach-small">Completed strength training sessions will appear here.</p>', h("coachHistory").innerHTML = Yn.length ? Yn.slice(-5).reverse().map((c) => '<div class="coach-history-row"><strong>' + R(c.workout) + "</strong><span>" + new Date(c.date).toLocaleDateString() + " · " + Math.round(c.elapsedSeconds / 60) + " min · " + R(c.mode.toUpperCase()) + "</span></div>").join("") : '<p class="coach-small">Your coached rides will appear here.</p>', h("coachSuggestion").textContent = He ? "Your strength workout is ready. No smart trainer needed." : O != null && O.settings.enabled ? "Your next workout is ready. Cycling and strength fit within your weekly time." : "Your next workout is ready. Coach considers your schedule and recent riding.", h("coachSwapList").innerHTML = r.filter((c) => c.id !== "preview").map((c) => '<button type="button" data-swap-workout="' + R(c.id) + '"><span><strong>' + R(c.name) + "</strong><small>" + R(c.category) + " · " + Math.round(Z(c) / 60) + ' min</small></span><span aria-hidden="true">→</span></button>').join("");
  }
  function Cn(s, d) {
    const p = r.find((y) => y.id === s);
    if (!p) return;
    const v = uo(l, Le(/* @__PURE__ */ new Date()), {
      cyclingId: s,
      cyclingMinutes: Math.round(Z(p) / 60)
    });
    if (v === l || !pe(Ft, v)) {
      h("coachStatus").textContent = "Could not save your replacement workout. Check browser storage.";
      return;
    }
    l = v, I = null, o = s, u = !1, i = null, m = null, h("coachSwapPanel").hidden = !0, h("coachSwapToggle").setAttribute("aria-expanded", "false"), te(), h("coachAnswer").textContent = d, h("coachStatus").textContent = "Saved for today. Coach rechecked upcoming recovery; review What Changed in Your Week for any adjustments.";
  }
  h("coachSkipToday").addEventListener("click", () => {
    const s = Le(/* @__PURE__ */ new Date()), d = new Set(Y());
    if (d.has(s) ? d.delete(s) : d.add(s), !pe(A, Array.from(d).slice(-90))) {
      h("coachStatus").textContent = "Could not save the skipped session. Check browser storage.";
      return;
    }
    u = !1, i = null, m = null, te();
  }), h("coachSwapToggle").addEventListener("click", () => {
    const s = h("coachSwapPanel");
    s.hidden = !s.hidden, h("coachSwapToggle").setAttribute("aria-expanded", String(!s.hidden));
  }), h("coachBrowseOptional").addEventListener("click", () => {
    h("coachSwapPanel").hidden = !1, h("coachSwapToggle").setAttribute("aria-expanded", "true");
  }), h("coachUseRecommendation").addEventListener("click", () => {
    const s = Le(/* @__PURE__ */ new Date());
    if (Object.prototype.hasOwnProperty.call(l, s)) {
      const d = { ...l };
      if (delete d[s], !pe(Ft, d)) {
        h("coachStatus").textContent = "Could not restore the original recommendation. Check browser storage.";
        return;
      }
      l = d;
    }
    u = !1, i = null, m = null, te(), h("coachAnswer").textContent = "Back to your Coach recommendation.";
  }), h("coachSwapList").addEventListener("click", (s) => {
    const d = s.target;
    if (!(d instanceof Element)) return;
    const p = d.closest("[data-swap-workout]");
    p != null && p.dataset.swapWorkout && Cn(p.dataset.swapWorkout, "Replacement workout saved for today. Other days are unchanged.");
  }), k.querySelectorAll("[data-coach-question]").forEach((s) => s.addEventListener("click", () => {
    const d = s.dataset.coachQuestion;
    if (d === "tired") Cn("recovery", "Easy recovery selected for today. Rest instead if you feel unusually fatigued or unwell.");
    else if (d === "short") {
      const p = it(), v = Math.max(15, Math.min(30, Math.floor(Z(p) / 60 * 0.65))), y = Pt(p, v);
      y === p ? h("coachAnswer").textContent = "This workout is already brief. You can swap to Recovery Spin or take a rest day." : (m = y, u = !0, te(), h("coachAnswer").textContent = "Shorter session prepared. Coach kept the power ranges and reduced interval durations.");
    } else {
      const p = Ue(), v = Xn(n, /* @__PURE__ */ new Date(), It(), _t(), p.days.map((y) => ({ day: y.day, workoutId: y.cyclingId, reason: y.reason })));
      h("coachAnswer").textContent = v.reason + (u ? " You have selected an alternative for today." : "");
    }
  }));
  function Zt(s, d) {
    if (O != null && O.settings.enabled) {
      if (e.isRiding()) {
        alert("Finish your active cycling session before starting strength training.");
        return;
      }
      O.open(s, Mn(), d);
    }
  }
  h("coachWeek").addEventListener("click", (s) => {
    const d = s.target;
    if (!(d instanceof Element)) return;
    const p = d.closest("[data-strength-variation]");
    if (p) {
      const y = Number(p.dataset.strengthDay), j = Ue().days[y];
      j != null && j.strength && Zt(j.strength, j.strengthMinutes);
      return;
    }
    const v = d.closest("[data-day-workout]");
    if (v != null && v.dataset.dayWorkout) {
      const y = f.find((D) => D.key === v.dataset.dayKey);
      o = v.dataset.dayWorkout, u = !0, i = (y == null ? void 0 : y.rideMinutes) ?? null, m = null, te(), fe("today");
    }
  }), h("coachStrengthToday").addEventListener("click", (s) => {
    const d = s.target;
    if (!(d instanceof Element) || !d.closest("#coachStartStrength")) return;
    const v = Ue().days[(/* @__PURE__ */ new Date()).getDay()];
    v != null && v.strength && Zt(v.strength, v.strengthMinutes);
  }), h("coachPlanLibrary").addEventListener("click", (s) => {
    const d = s.target.closest("[data-library-workout]");
    d != null && d.dataset.libraryWorkout && (o = d.dataset.libraryWorkout, u = !0, i = null, m = null, te(), fe("today"));
  }), h("coachNextUp").addEventListener("click", (s) => {
    const d = s.target.closest("[data-upcoming-workout]");
    if (d != null && d.dataset.upcomingWorkout)
      if (d.dataset.upcomingType === "strength")
        fe("plan", !0);
      else {
        const p = f.find((v) => v.key === d.dataset.upcomingKey);
        o = d.dataset.upcomingWorkout, u = !0, i = (p == null ? void 0 : p.rideMinutes) ?? null, m = null, te(), fe("today");
      }
  }), qe.addEventListener("change", () => {
    C = qe.value, !F && C === "structured" && (C = "guided", qe.value = "guided", h("coachStatus").textContent = "Set a reliable FTP in My Setup before selecting automatic ERG. Ride by feel is available now.");
  }), h("coachFtpKnown").addEventListener("change", () => {
    const s = h("coachFtpKnown").value === "yes";
    h("coachFtp").disabled = !s, h("coachFtpHelp").textContent = s ? "Enter the FTP from your latest reliable assessment." : "No FTP required for your first demo. Indoor rides will default to guided SIM, not automatic ERG watt targets.";
  });
  function $t(s, d, p) {
    const v = h(s);
    if (!v.value.trim()) return null;
    const y = Number(v.value);
    if (!Number.isInteger(y) || y < d || y > p) throw Error(s + " must be a whole number from " + d + " to " + p + ".");
    return y;
  }
  h("coachSaveCheckin").addEventListener("click", () => {
    try {
      const s = /* @__PURE__ */ new Date(), d = Le(s), p = {
        date: d,
        feeling: h("coachFeeling").value,
        bodyBattery: $t("coachBattery", 0, 100),
        sleepScore: $t("coachSleep", 0, 100),
        hrvMs: $t("coachHrv", 1, 300)
      }, v = hn(p, d);
      if (!v || !pe(un, v)) throw Error("Could not save check-in. Verify browser storage.");
      h("coachCheckinFeedback").textContent = "Saved for today. Your recommendation has been refreshed.", te();
    } catch (s) {
      h("coachCheckinFeedback").textContent = s instanceof Error ? s.message : "Invalid check-in.";
    }
  }), h("coachEventDiscipline").addEventListener("change", zt), h("coachEventDate").addEventListener("change", zt), h("coachSaveProfile").addEventListener("click", () => {
    const s = gn({ discipline: h("coachEventDiscipline").value, name: h("coachEventName").value, date: h("coachEventDate").value, priority: h("coachEventPriority").value, objective: h("coachEventObjective").value, terrain: h("coachEventTerrain").value, distanceKm: h("coachEventDistance").value ? Number(h("coachEventDistance").value) * 1.609344 : "", durationMinutes: h("coachEventDuration").value, elevationM: h("coachEventElevation").value ? Number(h("coachEventElevation").value) * 0.3048 : "", stages: h("coachEventStages").value });
    if (h("coachEventDate").value && !s.date) {
      h("coachSettingsFeedback").textContent = "Please enter a valid event date.";
      return;
    }
    const d = [["coachEventDistance", "event distance"], ["coachEventElevation", "total climbing"], ["coachEventDuration", "estimated riding time"]];
    s.discipline === "stage-race" && d.push(["coachEventStages", "number of stages"]);
    const p = d.find(([y]) => !h(y).checkValidity());
    if (p) {
      const y = h(p[0]);
      h("coachSettingsFeedback").textContent = "Please check " + p[1] + ": " + (y.validationMessage || "enter a valid value") + ".", y.focus();
      return;
    }
    if (!pe(da, s)) {
      h("coachSettingsFeedback").textContent = "Could not save your event goal. Check browser storage.";
      return;
    }
    a = s;
    const v = Ke({
      ftp: Number(h("coachFtp").value),
      hours: Number(h("coachHours").value),
      days: Number(h("coachDays").value),
      restDay: Number(h("coachRestDay").value),
      experience: h("coachExperience").value,
      goal: h("coachGoal").value
    });
    if (!(O != null && O.saveSettings())) {
      h("coachSettingsFeedback").textContent = "Could not save strength equipment. Check your browser storage and try again.";
      return;
    }
    if (n = v, F = h("coachFtpKnown").value === "yes", !pe(je, n)) {
      h("coachSettingsFeedback").textContent = "Strength equipment saved, but cycling settings could not be stored. Enable browser storage and retry.";
      return;
    }
    if (!pe(yt, F)) {
      h("coachSettingsFeedback").textContent = "Could not save FTP status. Check browser storage.";
      return;
    }
    F || (C = "guided"), qe.value = C, u = !1, i = null, m = null, Ct(), te(), h("coachSettingsFeedback").textContent = "✓ Saved! Your cycling, strength, and weekly plan are updated.", fe("today", !0), h("coachAnswer").textContent = "Your plan is saved. Coach has prepared today’s recommendation.";
  });
  function Rn() {
    (M == null ? void 0 : M.control) === "structured" && !$ && e.setMode("sim");
  }
  async function Jt() {
    const s = h("coachPlatformHistory");
    try {
      V = await e.getPlatformRides();
      try {
        w = await ma();
      } catch {
        w = [];
      }
      const d = V.filter((y) => Number.isFinite(y.start) && y.start >= Date.now() - 7 * 864e5 && y.start <= Date.now()), p = d.reduce((y, D) => y + Math.max(0, D.elapsed), 0) / 3600, v = ["classic", "survival", "cyclequest"];
      s.innerHTML = '<p class="coach-small">' + V.length + " locally saved rides · " + p.toFixed(1) + " hours in the last 7 days. All three riding modes contribute to your training history. Only Classic uses prescribed workouts.</p>" + v.map((y) => '<div class="coach-history-row"><strong>' + { classic: "CLASSIC", survival: "SURVIVAL", cyclequest: "CYCLE QUEST" }[y] + "</strong><span>" + d.filter((D) => D.mode === y).length + " rides · " + (d.filter((D) => D.mode === y).reduce((D, j) => D + j.elapsed, 0) / 3600).toFixed(1) + " hours this week</span></div>").join("") + '<p class="coach-small">Older rides without a mode label count toward total hours. A potential hard-game-day alert uses duration and average power, not a clinical recovery assessment.</p>', te();
    } catch (d) {
      s.textContent = "Local ride history could not be loaded: " + String(d instanceof Error ? d.message : d);
    }
  }
  function Qt() {
    M && M.elapsed > 0 && !$ && Ln(M, null), Rn(), M = null, $ = !1, en(), q.hidden = !0, Kt();
  }
  ue("coachEnd").addEventListener("click", Qt), ue("coachMinimize").addEventListener("click", () => {
    q.classList.toggle("coach-hud-minimized"), ue("coachMinimize").textContent = q.classList.contains("coach-hud-minimized") ? "+" : "−";
  });
  function Dn(s) {
    M && (M.adjusted = Math.round(Math.min(1.25, Math.max(0.7, M.adjusted + s)) * 100) / 100, M.control === "structured" && !$ && e.setTarget(Ve(M.ftp, gt(M.workout, M.elapsed).segment, M.adjusted)), tn());
  }
  ue("coachLighter").addEventListener("click", () => Dn(-0.05)), ue("coachHarder").addEventListener("click", () => Dn(0.05));
  function An(s, d, p, v = !1) {
    if (M || e.isRiding()) {
      h("coachStatus").textContent = "Finish the current ride or coaching session before starting a new one.";
      return;
    }
    const D = Aa().includes(p) ? p : "structured";
    M = { workout: s, mode: d, control: D, ftp: n.ftp, elapsed: 0, adjusted: 1, measured: 0, inRange: 0, sumWatts: 0, countWatts: 0, done: !1, previousIndex: -1 }, ve = "", $ = v, Kt(), q.hidden = !1, q.classList.remove("coach-hud-minimized"), ue("coachMinimize").textContent = "−", v || (e.setMode(D === "structured" ? "target" : "sim"), D === "structured" && e.setTarget(Ve(n.ftp, s.segments[0])), e.makeRoute(Z(s), D === "structured"), e.launchMode("classic")), tn();
  }
  h("coachStartClassic").addEventListener("click", () => {
    if (!ne(je)) {
      fe("settings", !0);
      return;
    }
    !F && C === "structured" && (C = "guided", qe.value = "guided", h("coachStatus").textContent = "FTP is not set. Starting guided ride-by-feel instead of automatic watt targets."), An(it(), "classic", C);
  });
  let Nt = null;
  const De = document.createElement("div");
  De.id = "coachDemoControls", De.hidden = !0, De.innerHTML = '<label>SIMULATED POWER <input id="coachDemoPower" type="range" min="0" max="450" step="5" value="130"></label><span id="coachDemoWatts">130 W</span><button type="button" id="coachDemoStop">STOP DEMO</button>', q.append(De), Nt = De.querySelector("#coachDemoPower"), Nt.addEventListener("input", () => {
    P = Number(Nt.value), ft(De, "coachDemoWatts").textContent = P + " W";
  }), ft(De, "coachDemoStop").addEventListener("click", () => {
    Qt(), Tn();
  });
  function xn() {
    const s = rn(n).find((p) => p.id === "preview");
    P = 130, Nt.value = "130", An(s, "classic", C, !0), en(), De.hidden = !1;
    let d = performance.now();
    L = window.setInterval(() => {
      const p = performance.now(), v = Math.min(1.5, (p - d) / 1e3);
      d = p, Nn(v, P, 85, !0);
    }, 250);
  }
  h("coachDemo").addEventListener("click", xn), h("coachFirstRunDemo").addEventListener("click", xn);
  function en() {
    L !== null && window.clearInterval(L), L = null, De.hidden = !0;
  }
  function tn(s = null) {
    if (!M) return;
    const d = M.workout, p = gt(d, M.elapsed), v = p.done || M.done, y = Ve(M.ftp, p.segment, M.adjusted);
    ue("coachHudState").textContent = $ ? "SIMULATED DEMO" : v ? "WORKOUT COMPLETE" : M.elapsed === 0 ? "WAITING FOR PEDALS" : M.control === "structured" ? "ERG CONTROL" : M.control === "guided" ? "GUIDED SIM" : "RECORD ONLY", ue("coachActual").innerHTML = (s === null ? "—" : String(Math.round(s))) + "<span> W</span>", ue("coachTarget").innerHTML = String(y) + "<span> W</span>", ue("coachRemaining").textContent = v ? "DONE" : qt(p.remaining), ue("coachInterval").textContent = p.segment.name.toUpperCase() + " · " + Math.round(p.segment.low * 100) + "–" + Math.round(p.segment.high * 100) + "% FTP", ue("coachSessionClock").textContent = qt(M.elapsed) + " / " + qt(Z(d)), ue("coachProgressBar").style.width = Math.round(M.elapsed / Z(d) * 100) + "%";
    let D = "Connect a trainer, then start pedaling.";
    $ ? D = "SIMULATED telemetry only — no physical trainer or ride record." : v ? D = "Workout complete! Finish your ride when ready." : M.elapsed > 0 && s !== null && (D = zn(s, M.ftp, p.segment, M.adjusted) ? "On target. Smooth and controlled." : s < M.ftp * p.segment.low * M.adjusted ? "Below target. Build effort gradually." : "Above target. Ease back to your prescribed effort."), ue("coachPrompt").textContent = D;
  }
  function Nn(s, d, p, v) {
    if (!M || M.done || !Number.isFinite(s) || s <= 0 || !v && !$ || !$ && (!Number.isFinite(p) || p < 10)) return;
    const y = gt(M.workout, M.elapsed);
    M.previousIndex !== y.index && (M.previousIndex = y.index, M.control === "structured" && !$ && e.setTarget(Ve(M.ftp, y.segment, M.adjusted)));
    const D = Math.min(3, s, Z(M.workout) - M.elapsed);
    if (D <= 0) return;
    Number.isFinite(d) && d >= 0 && (M.sumWatts += d * D, M.countWatts += D, M.measured += D, zn(d, M.ftp, y.segment, M.adjusted) && (M.inRange += D)), M.elapsed += D;
    const j = gt(M.workout, M.elapsed);
    j.index !== y.index && M.control === "structured" && !$ && e.setTarget(Ve(M.ftp, j.segment, M.adjusted)), M.elapsed >= Z(M.workout) && (M.done = !0, M.control === "structured" && !$ && e.setTarget(Math.max(30, Math.round(M.ftp * 0.45))), $ && en()), (performance.now() - Ee > 250 || M.done) && (Ee = performance.now(), tn(d));
  }
  function Ln(s, d) {
    const p = vt(), v = {
      id: (/* @__PURE__ */ new Date()).toISOString() + ":" + s.workout.id,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      workoutId: s.workout.id,
      workout: s.workout.name,
      mode: s.mode,
      control: s.control,
      elapsedSeconds: Math.round(s.elapsed),
      plannedSeconds: Z(s.workout),
      measuredSeconds: Math.round(s.measured),
      inRangeSeconds: Math.round(s.inRange),
      averageWatts: s.countWatts ? Math.round(s.sumWatts / s.countWatts) : null,
      rpe: d,
      complete: s.done
    };
    return p.push(v), pe(mn, p.slice(-150)), v;
  }
  function Ea() {
    if (!M || $) return null;
    const s = M;
    if (Rn(), M = null, q.hidden = !0, s.elapsed < 5) return null;
    ve = Ln(s, null).id;
    const p = document.createElement("section");
    p.className = "coach-finish-review";
    const v = s.measured ? Math.round(s.inRange / s.measured * 100) : null;
    return p.innerHTML = "<h2>BREAKAWAY COACH / SESSION REVIEW</h2><p><strong>" + R(s.workout.name) + "</strong> · " + Math.round(s.elapsed / 60) + " minutes of " + Math.round(Z(s.workout) / 60) + " planned</p><p>" + (v === null ? "No coached power adherence available." : "Time in prescribed power range: " + v + "% of measured time.") + '</p><p>How hard did the workout feel? Rate your overall effort.</p><div class="coach-rpe-buttons"><button type="button" data-coach-rpe="2">Easy</button><button type="button" data-coach-rpe="5">Moderate</button><button type="button" data-coach-rpe="8">Hard</button><button type="button" data-coach-rpe="10">Maximal</button></div><p id="coachReviewMessage">Feedback stays in this browser and informs your next suggested week.</p>', p.querySelectorAll("[data-coach-rpe]").forEach((y) => y.addEventListener("click", () => {
      const D = Number(y.dataset.coachRpe), j = vt(), re = j.slice().reverse().find((z) => z.id === ve);
      if (!re) return;
      re.rpe = D, pe(mn, j);
      const X = ft(p, "coachReviewMessage");
      X.textContent = xa(D), p.querySelectorAll("[data-coach-rpe]").forEach((z) => z.setAttribute("aria-pressed", String(z === y)));
    })), p;
  }
  function Ta() {
    if (!M) return null;
    const s = gt(M.workout, M.elapsed);
    return { name: M.workout.name, mode: M.mode, control: M.control, remaining: qt(s.remaining), target: Ve(M.ftp, s.segment, M.adjusted), done: M.done };
  }
  return window.addEventListener("breakaway:history-updated", () => {
    Jt();
  }), O = ro(h("coachStrengthSettings"), { finished: () => {
    te(), fe("history");
  } }), vo(h("coachImportRoot")), Ct(), te(), ao(h("coachHistoryImport"), { applySuggestion: (s) => {
    n = Ke({ ...n, ...s }), pe(je, n), Ct(), te();
  } }), { tick: Nn, finish: Ea, endCoaching: Qt, snapshot: Ta, get mode() {
    return (M == null ? void 0 : M.mode) || null;
  }, get active() {
    return !!M;
  } };
}
export {
  Eo as mountCoach
};
