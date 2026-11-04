const Pe = "breakaway.coach.profile.v1", Ht = "breakaway.coach.history.v1", at = { ftp: 200, hours: 5, days: 3, restDay: 6, goal: "fitness", experience: "beginner" };
function Fe(e) {
  const t = e && typeof e == "object" ? e : {}, n = (a, r, o, d) => typeof a == "number" && Number.isFinite(a) ? Math.min(o, Math.max(r, a)) : d;
  return {
    ftp: Math.round(n(t.ftp, 75, 550, at.ftp)),
    hours: n(t.hours, 1, 20, at.hours),
    days: Math.round(n(t.days, 2, 6, at.days)),
    restDay: Math.round(n(t.restDay, 0, 6, at.restDay)),
    goal: ["fitness", "ftp", "endurance", "race"].includes(String(t.goal)) ? t.goal : "fitness",
    experience: ["beginner", "intermediate", "advanced"].includes(String(t.experience)) ? t.experience : "beginner"
  };
}
const B = (e, t, n, a) => ({ name: e, minutes: t, low: n, high: a });
function Ct(e) {
  const t = Fe(e), n = t.experience === "beginner", a = Math.max(20, Math.min(n ? 45 : t.experience === "intermediate" ? 75 : 110, Math.round(t.hours * 60 / t.days) - 15));
  return [
    {
      id: "recovery",
      name: "Recovery Spin",
      description: "Easy spinning and relaxed cadence.",
      category: "Recovery",
      segments: [B("Ease in", 5, 0.4, 0.5), B("Easy spin", n ? 15 : 25, 0.45, 0.58), B("Cool down", 5, 0.35, 0.45)]
    },
    {
      id: "endurance",
      name: "Aerobic Builder",
      description: "Build endurance with an achievable steady effort.",
      category: "Endurance",
      segments: [B("Warm up", 8, 0.45, 0.6), B("Zone 2 cruise", a, 0.56, 0.75), B("Cool down", 7, 0.4, 0.5)]
    },
    {
      id: "tempo",
      name: "Tempo Builder",
      description: "Practice sustained, controlled work with recovery.",
      category: "Tempo",
      segments: [B("Warm up", 10, 0.45, 0.65), B("Tempo 1", n ? 5 : 10, 0.76, 0.87), B("Recovery", 4, 0.45, 0.6), B("Tempo 2", n ? 5 : 10, 0.76, 0.87), B("Cool down", 6, 0.4, 0.5)]
    },
    {
      id: "sweetspot",
      name: "Sweet Spot Builder",
      description: "Develop sustainable power without maximal efforts.",
      category: "Threshold",
      segments: [B("Warm up", 10, 0.45, 0.7), B("Sweet Spot 1", 8, 0.88, 0.94), B("Recovery", 5, 0.45, 0.58), B("Sweet Spot 2", 8, 0.88, 0.94), B("Cool down", 8, 0.4, 0.55)]
    },
    {
      id: "vo2",
      name: "VO2 Intervals",
      description: "Short hard efforts separated by easy recovery.",
      category: "High intensity",
      segments: [B("Warm up", 10, 0.45, 0.7), B("Work 1", 3, 1.05, 1.15), B("Recovery 1", 4, 0.43, 0.55), B("Work 2", 3, 1.05, 1.15), B("Recovery 2", 4, 0.43, 0.55), B("Work 3", 3, 1.05, 1.15), B("Cool down", 8, 0.4, 0.5)]
    },
    {
      id: "preview",
      name: "Coach Test Ride",
      description: "A short session to try live coaching and trainer control.",
      category: "Test",
      segments: [B("Warm up", 2, 0.45, 0.55), B("Steady", 2, 0.65, 0.75), B("Recovery", 1, 0.4, 0.5), B("Tempo", 2, 0.77, 0.85), B("Cool down", 1, 0.4, 0.5)]
    }
  ];
}
function Z(e) {
  return Math.round(e.segments.reduce((t, n) => t + n.minutes * 60, 0));
}
function Je(e, t) {
  const n = Z(e), a = Math.max(0, Math.min(n, t));
  let r = 0;
  for (let o = 0; o < e.segments.length; o++) {
    const d = e.segments[o], i = r + d.minutes * 60;
    if (a < i || o === e.segments.length - 1)
      return { segment: d, index: o, remaining: Math.max(0, i - a), progress: Math.min(1, Math.max(0, (a - r) / (i - r))), total: n, done: t >= n };
    r = i;
  }
  throw Error("The workout must have at least one interval");
}
function un(e, t) {
  const n = Math.max(0, Math.round(t.minutes * 60)), a = Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0"), r = Math.round(e * t.low), o = Math.round(e * t.high), d = He(e, t);
  return {
    duration: a,
    lowWatts: r,
    highWatts: o,
    target: d,
    range: r + "–" + o + " W",
    ftpRange: Math.round(t.low * 100) + "–" + Math.round(t.high * 100) + "% FTP"
  };
}
function He(e, t, n = 1) {
  const a = (t.low + t.high) / 2;
  return Math.max(30, Math.min(1e3, Math.round(e * a * n)));
}
function hn(e, t, n, a = 1) {
  return Number.isFinite(e) && e >= t * n.low * a * 0.95 && e <= t * n.high * a * 1.05;
}
function Kn(e) {
  return ["structured", "guided"];
}
function Dn(e, t = !1) {
  const n = Fe(e), a = n.days === 2 ? [1, 4] : n.days === 3 ? [1, 3, 6] : n.days === 4 ? [1, 2, 4, 6] : n.days === 5 ? [0, 1, 3, 4, 6] : n.days === 6 ? [0, 1, 2, 3, 4, 6] : [0, 1, 2, 3, 4, 5, 6];
  if (n.days < 7 && a.includes(n.restDay)) {
    const o = Array.from({ length: 7 }, (d, i) => i).filter((d) => d !== n.restDay && !a.includes(d)).sort((d, i) => Math.abs(d - n.restDay) - Math.abs(i - n.restDay))[0];
    o !== void 0 && a.splice(a.indexOf(n.restDay), 1, o), a.sort((d, i) => d - i);
  }
  const r = n.experience === "beginner" ? "tempo" : n.goal === "race" ? "vo2" : "sweetspot";
  return Array.from({ length: 7 }, (o, d) => {
    const i = a.indexOf(d);
    if (i < 0) return { day: d, workoutId: null, reason: "Rest or optional easy movement" };
    const m = t ? i === 0 ? "recovery" : "endurance" : i === 0 ? r : i === a.length - 1 ? "endurance" : i % 3 === 0 ? "tempo" : i % 2 === 0 ? "recovery" : "endurance";
    return { day: d, workoutId: m, reason: t ? "Reduced intensity after a difficult session" : "Planned training session" };
  });
}
function Ft(e, t, n = [], a = []) {
  const r = Fe(e), o = n.some((i) => Number.isFinite(i.start) && i.start <= t && t - i.start <= 36 * 36e5 && Number.isFinite(i.elapsed) && i.elapsed >= 1800 && i.avgPower !== null && Number.isFinite(i.avgPower) && i.avgPower >= r.ftp * 0.8), d = a.some((i) => Number.isFinite(i.date) && i.date <= t && t - i.date <= 48 * 36e5 && i.rpe !== null && i.rpe >= 9);
  return { demandingRide: o, veryHardFeedback: d, fatigued: o || d };
}
function pn(e, t, n = [], a = [], r) {
  const o = Fe(e), d = t.getTime(), i = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(), m = (r == null ? void 0 : r.find((l) => l.day === t.getDay())) ?? Dn(o, !1)[t.getDay()], y = n.filter((l) => Number.isFinite(l.start) && l.start <= d && Number.isFinite(l.elapsed) && l.elapsed > 0 && l.start >= d - 7 * 864e5), f = y.some((l) => l.start >= i && l.elapsed >= 900), { demandingRide: S, veryHardFeedback: M } = Ft(o, d, y, a);
  if (f) return {
    workoutId: null,
    status: "completed",
    reason: "You already recorded a ride today. Coach is not stacking another prescribed session. Rest, or choose an optional workout."
  };
  if (!m.workoutId) return {
    workoutId: null,
    status: "rest",
    reason: "Today is outside your " + o.days + " planned training days. Rest supports consistency. You can still choose an optional workout."
  };
  if (S || M) return {
    workoutId: "recovery",
    status: "recovery",
    reason: S ? "A demanding ride was recorded recently. Coach has replaced the planned workout with an easy recovery spin based on duration and average power." : "Your recent workout feedback indicated very high effort. Coach has selected an easier recovery spin."
  };
  const b = {
    fitness: "regular riding and consistency",
    ftp: "building sustainable power",
    endurance: "aerobic endurance",
    race: "preparing for your cycling event"
  };
  return {
    workoutId: m.workoutId,
    status: "planned",
    reason: r && m.reason ? "Event-based plan: " + m.reason : "Your " + o.days + "-day weekly schedule calls for this session to support " + b[o.goal] + ". The recommendation uses your rider profile and basic scheduling rules."
  };
}
function Rt(e, t = 30) {
  const n = e.segments.reduce((f, S) => f + S.minutes, 0), a = Math.max(12, Math.min(t, n));
  if (n <= a) return e;
  const r = e.segments.length;
  if (r >= a) return e;
  const o = a - r, d = e.segments.map((f) => Math.max(0, f.minutes - 1)), i = d.reduce((f, S) => f + S, 0), m = e.segments.map((f, S) => ({
    ...f,
    minutes: Math.max(1, Math.floor((1 + (i ? d[S] / i * o : 0)) * 2) / 2)
  }));
  let y = m.reduce((f, S) => f + S.minutes, 0);
  for (let f = 0; y + 0.5 <= a; f = (f + 1) % m.length)
    m[f].minutes += 0.5, y += 0.5;
  return {
    ...e,
    id: e.id + "-short",
    name: e.name + " · Short",
    segments: m,
    description: "Shortened version: " + e.description
  };
}
function _n(e) {
  return e === null ? "Rate how the session felt so future recommendations have more context." : e >= 9 ? "That felt very hard. Consider recovery or rest next; do not stack another demanding workout." : e >= 7 ? "Challenging session completed. Check your fatigue before the next hard effort." : e <= 3 ? "Comfortable effort. Keep building consistency rather than chasing extra intensity." : "Good training. Keep the next session aligned with your weekly plan.";
}
const Ve = (e) => typeof e == "number" && Number.isFinite(e), rt = (e) => {
  if (e == null || e === "") return null;
  const t = Number(e);
  return Ve(t) ? t : null;
}, ae = (e, t = 1e8) => {
  const n = rt(e);
  return n !== null && n >= 0 && n <= t ? n : null;
}, ge = (e, t = 1e8) => {
  const n = rt(e);
  return n !== null && n > 0 && n <= t ? n : null;
}, wt = (e) => {
  if (e instanceof Date) return Number.isFinite(e.getTime()) ? e.getTime() : null;
  if (typeof e == "number") return Number.isFinite(e) && e > 1e11 ? e : null;
  if (typeof e != "string" || !e.trim()) return null;
  const t = Date.parse(e);
  return Number.isFinite(t) ? t : null;
};
function gn(...e) {
  for (const t of e) {
    const n = rt(t);
    if (n !== null) return n;
  }
  return null;
}
function Ut(e) {
  const t = String(e ?? "").trim().toLowerCase().replace(/[\s_-]/g, "");
  return ["ride", "cycling", "biking", "2", "virtualride", "virtualcycling", "ebikeride", "mountainbikeride", "gravelride", "handcycle", "velomobile", "e-mountainbikeride", "emtbride"].includes(t);
}
function zn(e) {
  return typeof e == "string" && e.trim() ? e.trim().slice(0, 120) : "Cycling activity";
}
function Xn(e) {
  const t = ge(e.duration, 604800), n = wt(e.start);
  if (n === null || n < 9466848e5 || n > Date.now() + 864e5 || t === null || t < 60) throw Error("Invalid ride date or duration.");
  if (!["FIT", "TCX", "GPX", "CSV"].includes(e.source)) throw Error("Unknown recording format.");
  const a = ae(e.avgPower, 2500), r = ae(e.avgHeartRate, 240), o = ae(e.avgCadence, 250), d = ae(e.best20minWatts, 2e3), i = ae(e.distanceMeters, 1e7), m = ae(e.elevationMeters, 1e5), y = ge(e.movingSeconds, 7 * 86400);
  return {
    key: e.stravaId ? "strava:" + e.stravaId : "ride:" + Math.round(n / 1e3) + ":" + Math.round(t),
    stravaId: e.stravaId ? String(e.stravaId).slice(0, 30) : null,
    name: zn(e.name),
    start: n,
    duration: Math.round(t),
    movingSeconds: y === null ? null : Math.round(Math.min(t, y)),
    distanceMeters: i,
    elevationMeters: m,
    avgPower: a,
    avgHeartRate: r,
    avgCadence: o,
    best20minWatts: d,
    source: e.source,
    indoor: !!e.indoor
  };
}
function Gt(e, t) {
  return Xn({
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
function Ue(e, ...t) {
  for (const n of t) {
    const a = wt(e[n]);
    if (a !== null) return a;
  }
  return null;
}
function An(e) {
  let t = [], n = 0, a = 0, r = 0, o = 0;
  for (let d = 1; d < e.length; d++) {
    const i = e[d - 1], m = e[d], y = (m.t - i.t) / 1e3;
    if (!(!Ve(y) || y <= 0)) {
      if (y > 10) {
        t = [], n = 0, a = 0, r = 0;
        continue;
      }
      if (!(!Ve(i.power) || i.power < 0 || i.power > 2e3)) {
        for (t.push({ duration: y, power: i.power }), a += y, r += y * i.power; a > 1200 && n < t.length; ) {
          const f = t[n], S = a - 1200;
          f.duration <= S + 1e-8 ? (a -= f.duration, r -= f.duration * f.power, n++) : (f.duration -= S, a -= S, r -= S * f.power);
        }
        n > 200 && (t = t.slice(n), n = 0), a >= 1199.9 && (o = Math.max(o, r / a));
      }
    }
  }
  return o > 0 ? Math.round(o) : null;
}
function Zn(e, t = "Activity.fit", n, a = null) {
  var Y;
  const r = e.sessions || e.sessionMesgs || (e.session ? [e.session] : []), o = Array.isArray(r) ? r[0] : null;
  if (!o) throw Error("FIT activity has no session.");
  const d = o.sport ?? e.sport ?? ((Y = e.file_id) == null ? void 0 : Y.sport);
  if (!Ut(d)) throw Error("Not a cycling activity.");
  const i = e.records || e.recordMesgs || [], m = Array.isArray(i) ? i : [];
  if (m.length > 16e4) throw Error("FIT activity has too many samples.");
  const y = Ue(o, "start_time", "startTime") ?? Ue(e, "start_time", "startTime") ?? (m.length ? Ue(m[0], "timestamp") : null), f = Ue(o, "timestamp") ?? (m.length ? Ue(m[m.length - 1], "timestamp") : null), S = gn(o.total_elapsed_time, o.totalElapsedTime, o.total_timer_time, o.totalTimerTime), M = S && S > 0 ? S : y !== null && f !== null ? (f - y) / 1e3 : 0, b = m.map((D) => ({ t: Ue(D, "timestamp") ?? NaN, power: gn(D.power, D.watts) ?? NaN })).filter((D) => Ve(D.t));
  let l = 0, T = 0, E = 0, A = 0, C = 0, N = 0;
  for (const D of m) {
    const k = ae(D.power ?? D.watts, 2500);
    k !== null && (l += k, T++);
    const he = ge(D.heart_rate ?? D.heartRate, 240);
    he !== null && (E += he, A++);
    const me = ge(D.cadence, 250);
    me !== null && (C += me, N++);
  }
  const L = String(o.sub_sport ?? o.subSport ?? "").toLowerCase();
  return Gt("FIT", {
    name: n || t,
    start: y ?? 0,
    duration: M,
    stravaId: a,
    indoor: /indoor|virtual|trainer/.test(L),
    movingSeconds: ge(o.total_timer_time ?? o.totalTimerTime, 7 * 86400),
    distanceMeters: ae(o.total_distance ?? o.totalDistance, 1e7),
    elevationMeters: ae(o.total_ascent ?? o.totalAscent, 1e5),
    avgPower: ae(o.avg_power ?? o.avgPower, 2500) ?? (T ? l / T : null),
    avgHeartRate: ge(o.avg_heart_rate ?? o.avgHeartRate, 240) ?? (A ? E / A : null),
    avgCadence: ge(o.avg_cadence ?? o.avgCadence, 250) ?? (N ? C / N : null),
    best20minWatts: An(b)
  });
}
const pt = (e, t) => Array.from(e.getElementsByTagNameNS("*", t));
function Ee(e, ...t) {
  var n;
  for (const a of t) {
    const r = e.getElementsByTagNameNS("*", a)[0];
    if ((n = r == null ? void 0 : r.textContent) != null && n.trim()) return r.textContent.trim();
  }
  return null;
}
function $n(e, ...t) {
  const n = Ee(e, ...t);
  return n ? wt(n) : null;
}
const mn = (e) => e === null ? null : rt(e);
function Jn(e, t) {
  if (e.lat === null || e.lon === null || t.lat === null || t.lon === null) return 0;
  const n = Math.PI / 180, a = (t.lat - e.lat) * n, r = (t.lon - e.lon) * n, o = Math.sin(a / 2) ** 2 + Math.cos(e.lat * n) * Math.cos(t.lat * n) * Math.sin(r / 2) ** 2;
  return 12742e3 * Math.asin(Math.min(1, Math.sqrt(o)));
}
function Qn(e, t = "Activity.gpx", n, a = null) {
  var C;
  if (/<!DOCTYPE|<!ENTITY/i.test(e)) throw Error("XML DTD or entity declarations are not supported.");
  const r = new DOMParser().parseFromString(e, "application/xml");
  if (!r.documentElement || pt(r.documentElement, "parsererror").length) throw Error("Invalid activity XML.");
  const o = /\.tcx$/i.test(t), d = pt(r.documentElement, o ? "Trackpoint" : "trkpt");
  if (d.length < 2 || d.length > 16e4) throw Error("Activity needs timestamped ride samples.");
  if (o) {
    const N = pt(r.documentElement, "Activity");
    if (N.length !== 1 || !Ut(N[0].getAttribute("Sport"))) throw Error("Not a single cycling TCX activity.");
  }
  const i = [];
  for (const N of d) {
    const L = $n(N, o ? "Time" : "time");
    if (L === null) continue;
    const Y = o ? pt(N, "Position")[0] : null;
    i.push({
      t: L,
      hr: ge(Ee(N, "HeartRateBpm", "Value", "hr"), 240),
      power: ae(Ee(N, "Watts", "watts", "PowerInWatts", "power"), 2500) ?? NaN,
      cad: ge(Ee(N, "Cadence", "cad", "RunCadence"), 250),
      ele: rt(Ee(N, "AltitudeMeters", "ele")),
      distance: ae(Ee(N, "DistanceMeters", "distance"), 1e7),
      lat: mn(o ? Y ? Ee(Y, "LatitudeDegrees") : null : N.getAttribute("lat")),
      lon: mn(o ? Y ? Ee(Y, "LongitudeDegrees") : null : N.getAttribute("lon"))
    });
  }
  if (i.length < 2) throw Error("No timestamped GPS/trackpoint data.");
  i.sort((N, L) => N.t - L.t);
  let m = 0, y = 0;
  for (let N = 1; N < i.length; N++) {
    const L = i[N - 1], Y = i[N], D = Y.distance !== null && L.distance !== null && Y.distance >= L.distance ? Y.distance - L.distance : Jn(L, Y);
    D >= 0 && D < 5e3 && (m += D), L.ele !== null && Y.ele !== null && Y.ele > L.ele && Y.ele - L.ele < 200 && (y += Y.ele - L.ele);
  }
  const f = (i[i.length - 1].t - i[0].t) / 1e3;
  let S = 0, M = 0, b = 0, l = 0, T = 0, E = 0;
  for (const N of i)
    Ve(N.power) && (S += N.power, M++), N.hr !== null && (b += N.hr, l++), N.cad !== null && (T += N.cad, E++);
  const A = Ee(r.documentElement, "name");
  return Gt(o ? "TCX" : "GPX", {
    name: n || A || t,
    start: i[0].t,
    duration: f,
    stravaId: a,
    distanceMeters: m || ((C = i.at(-1)) == null ? void 0 : C.distance) || null,
    elevationMeters: y || null,
    movingSeconds: null,
    avgPower: M ? S / M : null,
    avgHeartRate: l ? b / l : null,
    avgCadence: E ? T / E : null,
    best20minWatts: An(i.filter((N) => Ve(N.power)).map((N) => ({ t: N.t, power: N.power })))
  });
}
function ea(e, t = 1e5) {
  var d;
  if (e.length > 32 * 1024 * 1024) throw Error("CSV index is too large.");
  const n = [];
  let a = [], r = "", o = !1;
  for (let i = 0; i < e.length; i++) {
    const m = e[i];
    if (m === '"')
      o && e[i + 1] === '"' ? (r += '"', i++) : o = !o;
    else if (m === "," && !o)
      a.push(r), r = "";
    else if ((m === `
` || m === "\r") && !o) {
      if (m === "\r" && e[i + 1] === `
` && i++, a.push(r), r = "", a.some((y) => y.trim()) && n.push(a), a = [], n.length > t) throw Error("Too many activities in CSV.");
    } else r += m;
  }
  if (o) throw Error("Unclosed quoted field in CSV.");
  return a.push(r), a.some((i) => i.trim()) && n.push(a), (d = n[0]) != null && d[0] && (n[0][0] = n[0][0].replace(/^\uFEFF/, "")), n;
}
function ta(e) {
  const t = ea(e), n = (t.shift() || []).map((o) => o.toLowerCase().replace(/\s/g, "").replace(/[^a-z0-9]/g, "")), a = (o, ...d) => {
    for (const i of d) {
      const m = n.indexOf(i);
      if (m >= 0) return o[m] || "";
    }
    return "";
  }, r = [];
  for (const o of t) {
    if (!Ut(a(o, "activitytype", "type", "sporttype"))) continue;
    const d = wt(a(o, "activitydate", "startdate", "startdatetime"));
    if (d === null) continue;
    const i = ge(a(o, "elapsedtime", "movingtime"), 7 * 86400);
    if (i !== null)
      try {
        const m = a(o, "activityid") || null, y = a(o, "filename") || null, f = Gt("CSV", {
          name: a(o, "activityname", "name") || "Ride",
          start: d,
          duration: i,
          stravaId: m,
          indoor: /virtual/.test(a(o, "activitytype", "type").toLowerCase()),
          movingSeconds: ge(a(o, "movingtime"), 7 * 86400),
          distanceMeters: ae(a(o, "distance"), 1e7),
          elevationMeters: ae(a(o, "elevationgain"), 1e5),
          avgPower: ae(a(o, "averagewatts", "avgpower"), 2500),
          avgHeartRate: ae(a(o, "averageheartrate"), 240),
          avgCadence: ae(a(o, "averagecadence"), 250)
        });
        r.push({ ride: f, file: y });
      } catch {
      }
  }
  return r;
}
function na(e, t) {
  if (e.stravaId && t.stravaId && e.stravaId === t.stravaId) return !0;
  const n = Math.min(300, Math.max(90, Math.min(e.duration, t.duration) * 0.07));
  return Math.abs(e.start - t.start) > 12e4 || Math.abs(e.duration - t.duration) > n ? !1 : e.distanceMeters !== null && t.distanceMeters !== null ? Math.abs(e.distanceMeters - t.distanceMeters) <= Math.max(500, Math.min(e.distanceMeters, t.distanceMeters) * 0.08) : !0;
}
const yn = (e) => ({ FIT: 4, TCX: 3, GPX: 2, CSV: 1 })[e];
function aa(e, t) {
  const n = (d) => [d.avgPower, d.best20minWatts, d.avgHeartRate, d.avgCadence, d.distanceMeters, d.elevationMeters].filter((i) => i !== null).length, a = n(t) > n(e) || n(t) === n(e) && yn(t.source) > yn(e.source), r = a ? t : e, o = a ? e : t;
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
function Nn(e, t) {
  const n = [...e];
  let a = 0, r = 0, o = 0;
  for (const d of t) {
    const i = n.findIndex((m) => na(m, d));
    if (i >= 0) {
      o++;
      const m = aa(n[i], d);
      JSON.stringify(m) !== JSON.stringify(n[i]) && (n[i] = m, r++);
    } else
      n.push(d), a++;
  }
  return n.sort((d, i) => i.start - d.start), { rides: n, added: a, updated: r, duplicates: o };
}
function oa(e, t = Date.now()) {
  var d;
  const n = Array.from({ length: 8 }, (i, m) => {
    const y = new Date(t);
    return y.setHours(0, 0, 0, 0), y.setDate(y.getDate() - y.getDay() - (7 - m) * 7), { start: y.getTime(), hours: 0, rides: 0 };
  });
  for (const i of e) for (const m of n) if (i.start >= m.start && i.start < m.start + 6048e5) {
    m.hours += i.duration / 3600, m.rides++;
    break;
  }
  const a = n.reduce((i, m) => i + m.hours, 0) / 8, r = e.filter((i) => i.start <= t && i.start > t - 56 * 864e5), o = e.filter((i) => i.start > t - 120 * 864e5 && i.start <= t).reduce((i, m) => m.best20minWatts !== null && (i === null || m.best20minWatts > i) ? m.best20minWatts : i, null);
  return {
    total: e.length,
    recent: r.length,
    weeklyHours: Math.round(a * 10) / 10,
    weeks: n,
    suggestedFtp: o !== null && o > 100 ? Math.round(o * 0.95) : null,
    powerRides: e.filter((i) => i.avgPower !== null).length,
    latest: ((d = e[0]) == null ? void 0 : d.start) ?? null,
    allHours: Math.round(e.reduce((i, m) => i + m.duration / 3600, 0))
  };
}
const sa = "breakaway.account.owner.v1";
let ia = "";
function ra(e) {
  let t = ia;
  try {
    t || (t = localStorage.getItem(sa) || "");
  } catch {
  }
  return t ? e + "-" + t : e;
}
const ca = "breakaway-coach-training-history-v1", De = "rides", la = 1, xn = 600 * 1024 * 1024, je = 32 * 1024 * 1024, vn = 32 * 1024 * 1024, Wt = 1e4, Yt = new TextDecoder("utf-8", { fatal: !1 });
function jt() {
  return new Promise((e, t) => {
    if (!("indexedDB" in window)) {
      t(Error("This browser does not support local history storage."));
      return;
    }
    const n = indexedDB.open(ra(ca), la);
    n.onupgradeneeded = () => {
      n.result.objectStoreNames.contains(De) || n.result.createObjectStore(De, { keyPath: "key" });
    }, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error || Error("Could not open local history database."));
  });
}
async function On() {
  const e = await jt();
  try {
    return await new Promise((t, n) => {
      const a = e.transaction(De, "readonly"), r = a.objectStore(De).getAll();
      r.onsuccess = () => t(r.result.sort((o, d) => d.start - o.start)), r.onerror = () => n(r.error || Error("Could not read history."));
    });
  } finally {
    e.close();
  }
}
async function da(e) {
  if (e.length > 15e3) throw Error("Local activity limit reached. Contact support before importing more rides.");
  const t = await jt();
  try {
    return await new Promise((n, a) => {
      const r = t.transaction(De, "readwrite"), o = r.objectStore(De);
      o.clear();
      for (const d of e) o.put(d);
      r.oncomplete = () => n(), r.onerror = () => a(r.error || Error("Could not save imported activities.")), r.onabort = () => a(r.error || Error("Activity import was rolled back."));
    });
  } finally {
    t.close();
  }
}
async function ua() {
  const e = await jt();
  try {
    return await new Promise((t, n) => {
      const a = e.transaction(De, "readwrite");
      a.objectStore(De).clear(), a.oncomplete = () => t(), a.onerror = () => n(a.error || Error("Unable to clear history."));
    });
  } finally {
    e.close();
  }
}
function ve(e, t) {
  if (t < 0 || t + 2 > e.byteLength) throw Error("Truncated ZIP file.");
  return e.getUint16(t, !0);
}
function ke(e, t) {
  if (t < 0 || t + 4 > e.byteLength) throw Error("Truncated ZIP file.");
  return e.getUint32(t, !0);
}
function ha(e) {
  if (e.byteLength > xn) throw Error("This archive exceeds the 600 MB preview limit. Import smaller batches of FIT, TCX, or GPX files.");
  const t = new DataView(e.buffer, e.byteOffset, e.byteLength);
  let n = -1;
  for (let m = e.length - 22; m >= Math.max(0, e.length - 22 - 65535); m--)
    if (ke(t, m) === 101010256 && m + 22 + ve(t, m + 20) <= e.length) {
      n = m;
      break;
    }
  if (n < 0) throw Error("Not a valid ZIP archive or its directory is missing.");
  const a = ve(t, n + 10), r = ke(t, n + 12), o = ke(t, n + 16);
  if (a === 65535 || o === 4294967295 || r === 4294967295 || ve(t, n + 4) !== 0) throw Error("Multi-disk or ZIP64 archives are not supported in this preview.");
  if (a > Wt || o + r > e.length) throw Error("ZIP directory exceeds safe limits.");
  const d = [];
  let i = o;
  for (let m = 0; m < a; m++) {
    if (ke(t, i) !== 33639248) throw Error("Invalid ZIP directory entry.");
    const y = ve(t, i + 8), f = ve(t, i + 10), S = ke(t, i + 16), M = ke(t, i + 20), b = ke(t, i + 24), l = ve(t, i + 28), T = ve(t, i + 30), E = ve(t, i + 32), A = ke(t, i + 42), C = i + 46 + l + T + E;
    if (C > e.length) throw Error("Truncated ZIP entry.");
    const N = Yt.decode(e.subarray(i + 46, i + 46 + l));
    if (i = C, A === 4294967295) continue;
    if (ke(t, A) !== 67324752) throw Error("Invalid ZIP member offset.");
    const L = A + 30 + ve(t, A + 26) + ve(t, A + 28);
    if (L + M > e.length) throw Error("Truncated ZIP member data.");
    d.push({ name: N, compressed: M, expanded: b, method: f, crc: S, start: L, encrypted: !!(y & 1) });
  }
  return d;
}
const pa = (() => {
  const e = new Uint32Array(256);
  for (let t = 0; t < 256; t++) {
    let n = t;
    for (let a = 0; a < 8; a++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
    e[t] = n >>> 0;
  }
  return e;
})();
function ga(e) {
  let t = 4294967295;
  for (const n of e) t = pa[(t ^ n) & 255] ^ t >>> 8;
  return (t ^ 4294967295) >>> 0;
}
async function Ln(e, t, n) {
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
      const { value: y, done: f } = await r.read();
      if (f) break;
      if (y) {
        if (d += y.byteLength, d > n)
          throw await r.cancel(), Error("Decompressed activity exceeds the safe file size limit.");
        o.push(y);
      }
    }
  } finally {
    r.releaseLock();
  }
  const i = new Uint8Array(d);
  let m = 0;
  for (const y of o)
    i.set(y, m), m += y.length;
  return i;
}
async function fn(e, t) {
  if (t.encrypted) throw Error("Encrypted archive entries are unsupported.");
  if (t.expanded > je) throw Error("Activity is larger than the 32 MB per-file limit.");
  if (t.method !== 0 && t.method !== 8) throw Error("Unsupported ZIP compression method: " + t.method);
  const n = e.subarray(t.start, t.start + t.compressed), a = t.method === 0 ? new Uint8Array(n) : await Ln(n, "deflate-raw", je);
  if (a.length !== t.expanded || ga(a) !== t.crc) throw Error("ZIP member failed integrity verification.");
  return a;
}
const bn = (e) => /\.(fit|tcx|gpx)(\.gz)?$/i.test(e), wn = (e) => /(^|\/)activities\.csv$/i.test(e), Qe = (e) => e.trim().replace(/\\/g, "/").replace(/^\.?\//, "").toLowerCase(), ma = () => new Promise((e) => setTimeout(e, 0));
async function ya(e, t) {
  return /\.gz$/i.test(e) ? Ln(t, "gzip", je) : t;
}
async function va(e, t = () => {
}) {
  if (!e.length) throw Error("Choose an activity archive or individual ride files.");
  if (e.length > Wt) throw Error("Select fewer than 10,000 files at a time.");
  const n = [], a = [];
  let r = 0;
  for (const l of e)
    if (/\.zip$/i.test(l.name)) {
      if (r++, l.size > xn) throw Error("This ZIP archive exceeds the 600 MB preview limit.");
      const T = new Uint8Array(await l.arrayBuffer());
      for (const E of ha(T)) {
        const A = Qe(E.name);
        wn(A) && E.expanded <= vn ? a.push({ name: E.name, bytes: () => fn(T, E) }) : bn(A) && /(^|\/)activities\//i.test(A) && E.expanded <= je && n.push({ name: E.name, bytes: () => fn(T, E) });
      }
    } else wn(l.name) && l.size <= vn ? a.push({ name: l.name, bytes: async () => new Uint8Array(await l.arrayBuffer()) }) : bn(l.name) && l.size <= je && n.push({ name: l.name, bytes: async () => new Uint8Array(await l.arrayBuffer()) });
  if (!n.length && !a.length) throw Error("No supported cycling recordings or activities.csv were found.");
  if (n.length > Wt) throw Error("There are too many activity files in this archive.");
  const o = [], d = [];
  let i = 0, m = 0, y = 0;
  for (const l of a)
    try {
      o.push(...ta(Yt.decode(await l.bytes())));
    } catch (T) {
      d.push("activities.csv: " + String(T instanceof Error ? T.message : T));
    }
  const f = /* @__PURE__ */ new Map();
  for (const l of o) l.file && (f.set(Qe(l.file), l), f.set(Qe(l.file).split("/").pop() || "", l));
  const S = [], M = n.length;
  t({ done: y, total: M, current: "Reading activity files", accepted: 0, skipped: i });
  for (const l of n) {
    try {
      const T = await ya(l.name, await l.bytes());
      if (T.byteLength > je) throw Error("Activity exceeds 32 MB.");
      const E = f.get(Qe(l.name)) || f.get(Qe(l.name).split("/").pop() || ""), A = l.name.replace(/^.*\//, "").replace(/\.(fit|gpx|tcx)(\.gz)?$/i, "");
      let C;
      if (/\.fit(\.gz)?$/i.test(l.name)) {
        const N = "/coach-fit-decoder.js", { decodeFIT: L } = await import(
          /* @vite-ignore */
          N
        );
        C = Zn(await L(T), A, E == null ? void 0 : E.ride.name, (E == null ? void 0 : E.ride.stravaId) ?? null);
      } else C = Qn(Yt.decode(T), A.replace(/\.gz$/i, ""), E == null ? void 0 : E.ride.name, (E == null ? void 0 : E.ride.stravaId) ?? null);
      S.push(C), m++;
    } catch (T) {
      i++, d.length < 15 && d.push(l.name.slice(-80) + ": " + String(T instanceof Error ? T.message : T));
    }
    y++, (y % 5 === 0 || y === M) && (t({ done: y, total: M, current: l.name.slice(-70), accepted: m, skipped: i }), await ma());
  }
  return { rides: Nn([], S.concat(o.map((l) => l.ride))).rides, read: m, skipped: i, errors: d, csvRides: o.length, archives: r };
}
const fa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, R = (e) => e.replace(/[&<>"']/g, (t) => fa[t]), ne = (e) => {
  try {
    return JSON.parse(localStorage.getItem(e) || "null");
  } catch {
    return null;
  }
}, ue = (e, t) => {
  try {
    return localStorage.setItem(e, JSON.stringify(t)), !0;
  } catch {
    return !1;
  }
}, Te = (e) => [e.getFullYear(), String(e.getMonth() + 1).padStart(2, "0"), String(e.getDate()).padStart(2, "0")].join("-"), st = (e) => {
  if (typeof e != "string") return "";
  const t = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(e);
  if (!t) return "";
  const n = Number(t[1]), a = Number(t[2]), r = Number(t[3]), o = new Date(n, a - 1, r);
  return o.getFullYear() !== n || o.getMonth() + 1 !== a || o.getDate() !== r ? "" : [t[1], String(a).padStart(2, "0"), String(r).padStart(2, "0")].join("-");
};
function ba(e, t) {
  let n = [], a = null, r = !1;
  e.innerHTML = '<div class="coach-section-top"><span class="coach-tag">05 / RIDER HISTORY</span><span class="coach-tag">YOUR FILES · YOUR DEVICE</span></div><h2>BRING YOUR HISTORY.</h2><p class="coach-small">Import your Strava account export or original cycling recordings. No Strava account connection, API, or server upload.</p><div class="coach-history-import-zone" id="coachImportZone" tabindex="0" role="group" aria-label="Choose a Strava archive or ride files"><div class="coach-upload-icon">⇧</div><strong>DROP A STRAVA ZIP OR RIDE FILES HERE</strong><span>ZIP · activities.csv · FIT · TCX · GPX · FIT.GZ · TCX.GZ · GPX.GZ</span><label for="coachImportFiles" class="coach-upload-button">CHOOSE FILES</label><input id="coachImportFiles" type="file" multiple accept=".zip,.csv,.fit,.tcx,.gpx,.gz" hidden></div><div class="coach-import-stage" id="coachImportStage" aria-live="polite"></div><div id="coachHistoryStats"><p class="coach-small">Loading saved activities…</p></div><p class="coach-small coach-history-privacy">The browser reads activity files locally. Only summarized ride metrics are saved in this browser’s IndexedDB; GPS tracks and original files are not retained. Imported history is not uploaded, synced or used by a hosted AI model.</p><div class="coach-history-footer"><button type="button" id="coachHistoryClear">CLEAR IMPORTED HISTORY</button><a href="https://support.strava.com/en-us/articles/15401919-how-do-i-export-my-strava-data" rel="noopener noreferrer" target="_blank">How to export from Strava ↗</a></div>';
  const o = (l) => e.querySelector("#" + l), d = o("coachImportFiles"), i = o("coachImportStage"), m = o("coachImportZone"), y = o("coachHistoryClear");
  function f() {
    var E, A;
    const l = oa(n), T = l.weeks.map((C, N) => ({ hours: C.hours, week: new Date(C.start).toLocaleDateString(void 0, { month: "short", day: "numeric" }), height: Math.max(2, Math.round(C.hours / Math.max(1, ...l.weeks.map((L) => L.hours)) * 100)), index: N }));
    o("coachHistoryStats").innerHTML = '<div class="coach-history-stats"><div><strong>' + l.total.toLocaleString() + "</strong><span>Historical rides</span></div><div><strong>" + l.weeklyHours.toFixed(1) + " h</strong><span>Avg / week · last 8 weeks</span></div><div><strong>" + l.powerRides.toLocaleString() + '</strong><span>Rides with power</span></div></div><div class="coach-history-bars" role="img" aria-label="Training hours in the last eight calendar weeks">' + T.map((C) => '<div class="coach-history-bar-wrap"><span>' + C.hours.toFixed(1) + 'h</span><div class="coach-history-bar-track"><div style="height:' + C.height + '%"></div></div><small>' + R(C.week) + "</small></div>").join("") + '</div><div class="coach-history-insights"><div><strong>RECENT TRAINING VOLUME</strong><p>' + l.weeklyHours.toFixed(1) + " hours per week on average over the past eight calendar weeks.</p></div><div><strong>POWER HISTORY</strong><p>" + (l.suggestedFtp === null ? "Not enough recent 20-minute recorded power for an FTP estimate." : "Candidate FTP ~" + l.suggestedFtp + " W, calculated as 95% of the best recorded 20-minute power in the last 120 days. Confirm with an FTP test.") + "</p></div></div>" + (l.total ? '<div class="coach-history-suggestions">' + (l.weeklyHours >= 1 ? '<button id="coachUseHours" type="button">USE ' + Math.min(20, Math.max(1, Math.round(l.weeklyHours * 2) / 2)) + " H/WEEK</button>" : "") + (l.suggestedFtp !== null ? '<button id="coachUseFtp" type="button">REVIEW FTP ' + l.suggestedFtp + " W</button>" : "") + "</div>" : "") + (l.total ? '<div class="coach-history-latest"><strong>LATEST IMPORTS</strong>' + n.slice(0, 5).map((C) => "<div><span>" + R(new Date(C.start).toLocaleDateString()) + " · " + R(C.name) + "</span><small>" + R(C.source) + " · " + Math.round(C.duration / 60) + " min</small></div>").join("") + "</div>" : '<p class="coach-small">No imported rides yet. Upload your Strava archive to see fitness history here.</p>'), (E = o("coachUseHours")) == null || E.addEventListener("click", () => {
      l.weeklyHours < 1 || (t.applySuggestion({ hours: Math.min(20, Math.max(1, Math.round(l.weeklyHours * 2) / 2)) }), i.textContent = "Weekly training hours updated in your Coach profile. You can edit them anytime.");
    }), (A = o("coachUseFtp")) == null || A.addEventListener("click", () => {
      l.suggestedFtp !== null && confirm("Apply the historical FTP estimate of " + l.suggestedFtp + " W to Coach? This is not a substitute for an FTP test.") && (t.applySuggestion({ ftp: l.suggestedFtp }), i.textContent = "FTP updated in Coach. Verify your training zones with a recent test.");
    });
  }
  async function S() {
    try {
      n = await On(), f();
    } catch (l) {
      o("coachHistoryStats").textContent = "Could not open local history: " + String(l instanceof Error ? l.message : l);
    }
  }
  function M(l) {
    const T = Nn(n, l.rides), E = T.added, A = T.updated;
    i.innerHTML = '<div class="coach-import-result"><strong>READY TO SAVE · ' + E + " NEW RIDES</strong><p>" + l.read + " recordings parsed · " + l.csvRides + " CSV cycling rows · " + l.skipped + " files skipped · " + A + " existing rides enhanced · " + T.duplicates + " duplicates matched.</p>" + (l.errors.length ? "<details><summary>Import warnings (" + l.errors.length + " shown)</summary><ul>" + l.errors.map((C) => "<li>" + R(C) + "</li>").join("") + "</ul></details>" : "") + '<div class="coach-import-actions"><button type="button" id="coachConfirmImport">SAVE HISTORY TO THIS DEVICE</button><button type="button" id="coachCancelImport">CANCEL</button></div></div>', a = T.rides, o("coachConfirmImport").addEventListener("click", async () => {
      if (!a || r) return;
      r = !0;
      const C = a, N = o("coachConfirmImport");
      N.disabled = !0;
      try {
        await da(C), n = C, a = null, i.textContent = "Saved " + E + " new rides and enhanced " + A + " activities on this device.", f(), window.dispatchEvent(new Event("breakaway:history-updated"));
      } catch (L) {
        i.textContent = "Save failed (nothing was changed): " + String(L instanceof Error ? L.message : L);
      } finally {
        r = !1;
      }
    }), o("coachCancelImport").addEventListener("click", () => {
      a = null, i.textContent = "Import canceled. Your saved history was not changed.";
    });
  }
  async function b(l) {
    if (!(r || !l.length)) {
      r = !0, a = null, y.disabled = !0, m.setAttribute("aria-busy", "true"), i.textContent = "Reading activity files locally…";
      try {
        const T = await va(l, (E) => {
          i.textContent = "Reading " + E.done + " / " + E.total + " files · " + E.accepted + " cycling recordings · " + E.skipped + " skipped";
        });
        T.rides.length ? M(T) : i.textContent = "No valid cycling rides were found. " + (T.errors[0] || "Try a Strava archive or individual activity recordings.");
      } catch (T) {
        i.textContent = "Import could not finish: " + String(T instanceof Error ? T.message : T);
      } finally {
        r = !1, y.disabled = !1, m.removeAttribute("aria-busy"), d.value = "";
      }
    }
  }
  d.addEventListener("change", () => void b(Array.from(d.files || [])));
  for (const l of ["dragenter", "dragover"]) m.addEventListener(l, (T) => {
    T.preventDefault(), m.classList.add("coach-drop-active");
  });
  return m.addEventListener("dragleave", (l) => {
    l.preventDefault(), m.classList.remove("coach-drop-active");
  }), m.addEventListener("drop", (l) => {
    var E;
    l.preventDefault(), m.classList.remove("coach-drop-active");
    const T = Array.from(((E = l.dataTransfer) == null ? void 0 : E.files) || []);
    b(T);
  }), m.addEventListener("keydown", (l) => {
    l.target === m && l.key === "Enter" && (l.preventDefault(), d.click());
  }), y.addEventListener("click", async () => {
    if (!r && confirm("Delete all historical rides imported into Breakaway Coach on this device? Your original Strava files are not affected.")) {
      r = !0, y.disabled = !0;
      try {
        await ua(), a = null, n = [], i.textContent = "Imported history deleted from this device.", f(), window.dispatchEvent(new Event("breakaway:history-updated"));
      } catch (l) {
        i.textContent = "Delete failed: " + String(l instanceof Error ? l.message : l);
      } finally {
        r = !1, y.disabled = !1;
      }
    }
  }), S(), { reload: S };
}
const Sn = "breakaway.coach.strength.settings.v1", kn = "breakaway.coach.strength.history.v1", Pn = { enabled: !1, equipment: ["bodyweight"], experience: "beginner", sessions: 1, minutes: 30, notes: "" }, Hn = [
  { id: "bodyweight", label: "Bodyweight", detail: "Floor space only" },
  { id: "dumbbells", label: "Dumbbells", detail: "Fixed or adjustable" },
  { id: "kettlebells", label: "Kettlebells", detail: "Single or paired" },
  { id: "bands", label: "Resistance bands", detail: "Light to heavy" },
  { id: "barbell", label: "Squat rack + barbell", detail: "With plates" },
  { id: "bench", label: "Weight bench", detail: "Flat or adjustable" },
  { id: "pullup", label: "Pull-up bar", detail: "Safe, securely mounted" }
];
function it(e) {
  const t = e && typeof e == "object" ? e : {}, n = Array.isArray(t.equipment) ? t.equipment.filter((r) => Hn.some((o) => o.id === r)) : [], a = Array.from(/* @__PURE__ */ new Set(["bodyweight", ...n]));
  return {
    enabled: t.enabled === !0,
    equipment: a,
    experience: ["beginner", "intermediate", "advanced"].includes(String(t.experience)) ? t.experience : "beginner",
    sessions: t.sessions === 2 ? 2 : 1,
    minutes: [20, 30, 45].includes(Number(t.minutes)) ? Number(t.minutes) : 30,
    notes: typeof t.notes == "string" ? t.notes.slice(0, 150) : ""
  };
}
const wa = [
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
function ft(e, t) {
  const n = new Set(it(e).equipment);
  return wa.filter((a) => (!t || a.pattern === t) && a.equipment.every((r) => n.has(r)));
}
const Sa = (e, t, n) => {
  const a = ft(e, t);
  return n.map((r) => a.find((o) => o.id === r)).find(Boolean) || a[0];
};
function Bt(e, t = "A", n = !1) {
  const a = it(e), r = a.experience === "beginner", o = n ? 1 : r ? 2 : 3, d = ["Squat", "Hinge", "Push", "Pull", "Core"], i = {
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
      const y = Sa(a, m, i[m]);
      return {
        ...y,
        sets: m === "Core" ? Math.max(1, o - 1) : o,
        restSeconds: n ? 45 : r ? 60 : 90,
        alternatives: ft(a, m).filter((f) => f.id !== y.id).map((f) => f.id)
      };
    })
  };
}
function ka(e, t, n, a) {
  const r = it(t), o = Math.round(Math.max(60, e.hours * 60)), d = n.map((b) => ({
    day: b.day,
    cyclingId: b.workoutId,
    cyclingMinutes: b.workoutId ? a(b.workoutId) : 0,
    strength: null,
    strengthMinutes: 0,
    reason: b.reason
  }));
  if (!r.enabled) {
    let b = d.reduce((E, A) => E + A.cyclingMinutes, 0);
    if (b <= o) return { days: d, budgetMinutes: o, plannedMinutes: b, note: "Strength training is turned off." };
    const l = (E) => E.cyclingId === "recovery" ? 0 : E.cyclingId === "endurance" ? 1 : E.cyclingId === "tempo" ? 2 : 3, T = [...d].filter((E) => E.cyclingId).sort((E, A) => l(E) - l(A));
    for (const E of T) {
      if (b <= o) break;
      const A = Math.min(Math.max(0, E.cyclingMinutes - 15), b - o);
      E.cyclingMinutes -= A, b -= A;
    }
    for (const E of T) {
      if (b <= o) break;
      b -= E.cyclingMinutes, E.cyclingMinutes = 0, E.cyclingId = null, E.reason = "Removed because the selected weekly hours cannot fit all rides.";
    }
    return {
      days: d,
      budgetMinutes: o,
      plannedMinutes: b,
      note: "Strength is off. Cycling was adjusted to fit your available weekly hours."
    };
  }
  const i = d.filter((b) => b.cyclingId && b.day !== e.restDay).sort((b, l) => (b.cyclingId === "endurance" || b.cyclingId === "recovery" ? -1 : 1) - (l.cyclingId === "endurance" || l.cyclingId === "recovery" ? -1 : 1)), m = [];
  for (const b of i) {
    if (m.length >= r.sessions) break;
    m.some((l) => Math.abs(l.day - b.day) === 1) || m.push(b);
  }
  let y = 0;
  for (const b of m)
    b.strength = y ? "B" : "A", b.strengthMinutes = r.minutes, y++;
  let f = d.reduce((b, l) => b + l.cyclingMinutes + l.strengthMinutes, 0);
  if (f > o) {
    const b = [...d].filter((l) => l.cyclingId).sort((l, T) => {
      const E = (A) => A.cyclingId === "recovery" ? 0 : A.cyclingId === "endurance" ? 1 : A.cyclingId === "tempo" ? 2 : 3;
      return E(l) - E(T);
    });
    for (const l of b) {
      if (f <= o) break;
      const T = l.strength ? 0 : 15, E = Math.min(l.cyclingMinutes - T, f - o);
      E > 0 && (l.cyclingMinutes -= E, f -= E, l.cyclingMinutes === 0 && (l.cyclingId = null));
    }
    for (const l of [...m].reverse()) {
      if (f <= o) break;
      const T = Math.max(0, l.strengthMinutes - 15), E = Math.min(T, f - o);
      l.strengthMinutes -= E, f -= E, f > o && (f -= l.strengthMinutes, l.strengthMinutes = 0, l.strength = null);
    }
    for (const l of b) {
      if (f <= o) break;
      const T = Math.min(l.cyclingMinutes, f - o);
      l.cyclingMinutes -= T, f -= T, l.cyclingMinutes === 0 && (l.cyclingId = null);
    }
  }
  const S = d.reduce((b, l) => b + l.cyclingMinutes + l.strengthMinutes, 0), M = d.filter((b) => b.strength).length;
  return { days: d, budgetMinutes: o, plannedMinutes: S, note: M ? r.sessions > M ? "Limited time or available training days reduced strength frequency." : "Strength sessions are included in your total weekly time budget." : "Not enough available time or separate training days for strength. Consider increasing your weekly training time or lowering other sessions." };
}
function Ea(e, t) {
  let n = it(ne(Sn) || Pn);
  const a = ne(kn);
  let r = Array.isArray(a) ? a.filter((O) => O && typeof O.routine == "string" && Array.isArray(O.sets)).slice(-150) : [], o = !1, d = "A", i = !1, m = 0, y = "", f = 30, S = [], M = Bt(n, "A", !1);
  const b = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Map();
  let T = null, E = 0, A = null;
  const C = document.createElement("section");
  C.className = "coach-strength-overlay", C.id = "coachStrengthOverlay", C.hidden = !0, C.setAttribute("role", "dialog"), C.setAttribute("aria-modal", "true"), C.setAttribute("aria-label", "Guided strength session"), document.body.append(C);
  function N() {
    e.innerHTML = '<div class="coach-section-top"><span class="coach-tag">STRENGTH TRAINING</span><span class="coach-tag">OPTIONAL · LOCAL ONLY</span></div><h3>Train with what you own.</h3><p class="coach-small">Set your available equipment. Strength sessions share your weekly training time budget.</p><label class="coach-strength-toggle"><input id="strengthEnabled" type="checkbox" ' + (n.enabled ? "checked" : "") + '><span>Include strength in my training plan</span></label><span class="coach-label">AVAILABLE EQUIPMENT</span><div class="coach-equipment-grid">' + Hn.map((O) => '<label class="coach-gear-choice"><input type="checkbox" data-gear="' + O.id + '" ' + (n.equipment.includes(O.id) ? "checked" : "") + " " + (O.id === "bodyweight" ? "disabled" : "") + "><span><strong>" + R(O.label) + "</strong><small>" + R(O.detail) + "</small></span></label>").join("") + '</div><div class="coach-strength-fields"><label>EXPERIENCE<select id="strengthExperience"><option value="beginner">New to lifting</option><option value="intermediate">Some experience</option><option value="advanced">Experienced</option></select></label><label>SESSIONS / WEEK<select id="strengthSessions"><option value="1">1 session</option><option value="2">2 sessions</option></select></label><label>TIME / SESSION<select id="strengthMinutes"><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option></select></label><label>AVAILABLE WEIGHTS (OPTIONAL)<input type="text" id="strengthWeights" maxlength="150" placeholder="e.g. 25 lb DB, 35 lb KB"></label></div><p id="strengthSaved" class="coach-small" role="status">Your strength setup is saved with your cycling settings using Save My Plan.</p>', e.querySelector("#strengthExperience").value = n.experience, e.querySelector("#strengthSessions").value = String(n.sessions), e.querySelector("#strengthMinutes").value = String(n.minutes), e.querySelector("#strengthWeights").value = n.notes;
  }
  function L() {
    const O = Array.from(e.querySelectorAll("[data-gear]")).filter((v) => v.checked).map((v) => v.dataset.gear), P = it({
      enabled: e.querySelector("#strengthEnabled").checked,
      equipment: O,
      experience: e.querySelector("#strengthExperience").value,
      sessions: Number(e.querySelector("#strengthSessions").value),
      minutes: Number(e.querySelector("#strengthMinutes").value),
      notes: e.querySelector("#strengthWeights").value
    });
    return ue(Sn, P) ? (n = P, N(), e.querySelector("#strengthSaved").textContent = "Equipment settings saved.", !0) : (e.querySelector("#strengthSaved").textContent = "Local storage unavailable. Nothing saved.", !1);
  }
  function Y() {
    T !== null && window.clearInterval(T), T = null, E = 0;
  }
  function D(O) {
    T !== null && window.clearInterval(T), E = Date.now() + O * 1e3;
    const P = () => {
      const v = Math.max(0, Math.ceil((E - Date.now()) / 1e3)), I = C.querySelector("#strengthRestLabel");
      I && (I.textContent = v ? "Rest: " + v + " seconds" : "Rest complete. Ready for the next set."), v || (T !== null && window.clearInterval(T), T = null);
    };
    T = window.setInterval(P, 500), P();
  }
  const k = (O, P) => O + ":" + P;
  function he() {
    if (!o) return;
    const O = C.scrollTop, P = S.reduce((v, I) => v + I.sets, 0);
    if (C.innerHTML = '<div class="coach-strength-session"><header class="coach-strength-session-head"><div><span>BREAKAWAY COACH / STRENGTH</span><h2>' + R(M.title) + "</h2><p>" + f + " min planned · " + b.size + " / " + P + ' sets logged</p></div><button type="button" id="strengthExit">← BACK TO COACH</button></header><div class="coach-strength-session-note">' + R(M.note) + ' Warm up for 5 minutes. Stop or modify anything painful; use a load you can control.</div><div class="coach-strength-progress"><div style="width:' + Math.round(100 * b.size / Math.max(P, 1)) + '%"></div></div><div class="coach-strength-rest"><span id="strengthRestLabel">Rest as needed between sets.</span><button type="button" id="strengthRestStart">START 60s REST</button></div><div class="coach-strength-list">' + S.map((v, I) => {
      const c = ft(n, v.pattern);
      return '<section class="coach-strength-exercise"><div class="coach-strength-exercise-header"><div><small>' + (I + 1) + " / " + S.length + " · " + R(v.pattern.toUpperCase()) + "</small><h3>" + R(v.name) + '</h3></div><label>SWAP EXERCISE<select data-strength-sub="' + I + '">' + c.map((W) => '<option value="' + W.id + '" ' + (W.id === v.id ? "selected" : "") + ">" + R(W.name) + "</option>").join("") + "</select></label></div><p>" + R(v.instructions) + '</p><p class="coach-strength-dose">' + v.sets + " sets · " + R(v.reps) + " · Rest " + v.restSeconds + "s · " + R(v.loadHint) + '</p><div class="coach-strength-sets">' + Array.from({ length: v.sets }, (W, H) => {
        const oe = k(I, H);
        return '<div class="coach-strength-set"><span>SET ' + (H + 1) + '</span><input aria-label="Repetitions: set ' + (H + 1) + " " + R(v.name) + '" data-reps="' + oe + '" maxlength="30" placeholder="' + R(v.reps) + '"><input aria-label="Weight: set ' + (H + 1) + " " + R(v.name) + '" data-load="' + oe + '" maxlength="32" placeholder="Load (lb / kg / BW)"><button type="button" aria-pressed="' + b.has(oe) + '" data-check="' + oe + '">' + (b.has(oe) ? "✓ DONE" : "MARK DONE") + "</button></div>";
      }).join("") + "</div></section>";
    }).join("") + '</div><div class="coach-strength-complete"><label>SESSION EFFORT<select id="strengthRpe"><option value="">Select effort</option><option value="3">Easy</option><option value="5">Moderate</option><option value="7">Hard</option><option value="9">Very hard</option></select></label><button type="button" id="strengthFinish">FINISH & SAVE SESSION →</button><p id="strengthSessionError" role="status"></p></div></div>', C.querySelectorAll("[data-reps],[data-load]").forEach((v) => {
      const I = v.hasAttribute("data-reps") ? "reps" : "load";
      v.value = l.get(I + ":" + v.getAttribute("data-" + I)) || "";
    }), C.querySelector("#strengthRpe").value = y, C.scrollTop = O, T !== null && E > Date.now()) {
      const v = C.querySelector("#strengthRestLabel");
      v && (v.textContent = "Rest: " + Math.ceil((E - Date.now()) / 1e3) + " seconds");
    }
  }
  C.addEventListener("input", (O) => {
    const P = O.target;
    if (P instanceof HTMLInputElement)
      for (const v of ["reps", "load"]) P.hasAttribute("data-" + v) && l.set(v + ":" + P.getAttribute("data-" + v), P.value);
  }), C.addEventListener("change", (O) => {
    const P = O.target;
    if (!(P instanceof HTMLSelectElement)) return;
    if (P.id === "strengthRpe") {
      y = P.value;
      return;
    }
    if (!P.hasAttribute("data-strength-sub")) return;
    const v = Number(P.dataset.strengthSub), I = S[v];
    if (!I) return;
    const c = ft(n, I.pattern).find((W) => W.id === P.value);
    if (c) {
      S[v] = { ...c, sets: I.sets, restSeconds: I.restSeconds, alternatives: I.alternatives };
      for (let W = 0; W < I.sets; W++) {
        const H = k(v, W);
        b.delete(H), l.delete("reps:" + H), l.delete("load:" + H);
      }
      he();
    }
  }), C.addEventListener("click", (O) => {
    var I;
    const P = O.target;
    if (!(P instanceof Element)) return;
    if (P.closest("#strengthExit")) {
      if (b.size && !confirm("Leave without saving your sets?")) return;
      V();
      return;
    }
    const v = P.closest("[data-check]");
    if (v) {
      const c = v.dataset.check;
      if (b.has(c) ? b.delete(c) : b.add(c), b.has(c)) {
        const W = Number(c.split(":")[0]);
        D(((I = S[W]) == null ? void 0 : I.restSeconds) || 60);
      }
      he();
      return;
    }
    if (P.closest("#strengthRestStart")) {
      D(60);
      return;
    }
    P.closest("#strengthFinish") && me();
  });
  function me() {
    if (!b.size) {
      C.querySelector("#strengthSessionError").textContent = "Complete at least one set to save this session.";
      return;
    }
    const O = [];
    S.forEach((I, c) => {
      for (let W = 0; W < I.sets; W++) {
        const H = k(c, W);
        O.push({ exerciseId: I.id, set: W + 1, reps: l.get("reps:" + H) || "", load: l.get("load:" + H) || "", done: b.has(H) });
      }
    });
    const P = {
      id: (/* @__PURE__ */ new Date()).toISOString() + ":" + M.id,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      routine: M.title,
      minutes: Math.max(1, Math.round((Date.now() - m) / 6e4)),
      completedSets: b.size,
      plannedSets: O.length,
      rpe: y ? Number(y) : null,
      sets: O
    }, v = r.concat(P).slice(-150);
    if (!ue(kn, v)) {
      C.querySelector("#strengthSessionError").textContent = "Could not save. Check local browser storage.";
      return;
    }
    r = v, V(), t.finished();
  }
  function V() {
    Y(), o = !1, C.hidden = !0, A == null || A.focus(), A = null;
  }
  function fe(O = "A", P = !1, v) {
    var I;
    return n.enabled ? (d = O, f = Math.min(n.minutes, Math.max(15, v || n.minutes)), i = P || f < 20, M = Bt(n, d, i), S = M.exercises, f < n.minutes && (S = S.map((c) => ({ ...c, sets: Math.max(1, Math.min(c.sets, f < 25 ? 1 : 2)) }))), A = document.activeElement instanceof HTMLElement ? document.activeElement : null, o = !0, b.clear(), l.clear(), y = "", m = Date.now(), Y(), C.hidden = !1, he(), C.scrollTop = 0, (I = C.querySelector("#strengthExit")) == null || I.focus(), !0) : !1;
  }
  return C.addEventListener("keydown", (O) => {
    if (!o) return;
    if (O.key === "Escape") {
      O.preventDefault();
      const c = C.querySelector("#strengthExit");
      c == null || c.click();
      return;
    }
    if (O.key !== "Tab") return;
    const P = Array.from(C.querySelectorAll("button:not(:disabled),input:not(:disabled),select:not(:disabled)"));
    if (!P.length) return;
    const v = P[0], I = P[P.length - 1];
    O.shiftKey && document.activeElement === v ? (O.preventDefault(), I.focus()) : !O.shiftKey && document.activeElement === I && (O.preventDefault(), v.focus());
  }), N(), {
    get settings() {
      return n;
    },
    get history() {
      return r;
    },
    open: fe,
    close: V,
    renderSettings: N,
    saveSettings: L,
    get active() {
      return o;
    },
    completedToday() {
      return r.some((O) => Te(new Date(O.date)) === Te(/* @__PURE__ */ new Date()));
    }
  };
}
function Ta(e, t, n, a) {
  const r = [];
  for (let o = 0; o < 7; o++) {
    const d = new Date(e.getFullYear(), e.getMonth(), e.getDate() + o), i = t.find((T) => T.day === d.getDay()), m = o === 0 && a.status === "completed";
    let y = i != null && i.cyclingId && i.cyclingMinutes > 0 ? i.cyclingId : null;
    o === 0 && (m || a.status === "rest" || !y ? y = null : a.workoutId && (y = a.workoutId));
    const f = n.find((T) => T.id === y), S = (i == null ? void 0 : i.cyclingId) === y ? i.cyclingMinutes : 0, M = f ? Math.max(0, S || Math.round(f.segments.reduce((T, E) => T + E.minutes, 0))) : 0, b = o === 0 ? "Today" : new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d), l = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
    r.push({
      date: d,
      key: l,
      isToday: o === 0,
      label: b + " " + (d.getMonth() + 1) + "/" + d.getDate(),
      title: new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(d),
      rideId: (f == null ? void 0 : f.id) || null,
      rideName: (f == null ? void 0 : f.name) || null,
      rideMinutes: M,
      rideDescription: (f == null ? void 0 : f.description) || null,
      strength: (i == null ? void 0 : i.strength) || null,
      strengthMinutes: (i == null ? void 0 : i.strengthMinutes) || 0,
      completedRide: m,
      reason: o === 0 ? a.reason : (i == null ? void 0 : i.reason) || "Scheduled recovery day"
    });
  }
  return r;
}
const gt = "breakaway.coach.moved-workouts.v1", Fn = (e, t) => Object.prototype.hasOwnProperty.call(e, t);
function Wn(e) {
  const t = {};
  if (!e || typeof e != "object" || Array.isArray(e)) return t;
  for (const [n, a] of Object.entries(e).slice(-365)) {
    if (st(n) !== n || !a || typeof a != "object") continue;
    const r = a;
    r.cyclingId !== null && (typeof r.cyclingId != "string" || !/^[a-z0-9_-]{1,80}$/i.test(r.cyclingId)) || typeof r.cyclingMinutes != "number" || !Number.isInteger(r.cyclingMinutes) || r.cyclingMinutes < 0 || r.cyclingMinutes > 1440 || r.cyclingId === null == (r.cyclingMinutes === 0) && (t[n] = { cyclingId: r.cyclingId, cyclingMinutes: r.cyclingMinutes });
  }
  return t;
}
function En(e, t, n) {
  return Fn(n, e) ? { ...t, ...n[e], reason: "Manually rescheduled by you. " + t.reason } : t;
}
function Ma(e, t, n, a, r) {
  return t === n || st(t) !== t || st(n) !== n || !a.cyclingId || a.cyclingMinutes <= 0 ? e : {
    ...e,
    [t]: { cyclingId: r.cyclingId, cyclingMinutes: r.cyclingMinutes },
    [n]: { cyclingId: a.cyclingId, cyclingMinutes: a.cyclingMinutes }
  };
}
function Ia(e, t, n) {
  if (st(t) !== t) return e;
  const a = Wn({ [t]: n });
  return Fn(a, t) ? { ...e, [t]: a[t] } : e;
}
const Ca = /* @__PURE__ */ new Set(["tempo", "sweetspot", "vo2"]), ot = (e) => !!e.rideId && (Ca.has(e.rideId) || e.rideMinutes >= 120 && e.rideId !== "recovery"), Tn = (e) => {
  const [t, n, a] = e.split("-").map(Number);
  return Date.UTC(t, n - 1, a) / 864e5;
};
function Dt(e) {
  const t = [...e].sort((a, r) => a.key.localeCompare(r.key)), n = /* @__PURE__ */ new Set();
  for (let a = 1; a < t.length; a++) {
    const r = t[a - 1], o = t[a];
    Tn(o.key) - Tn(r.key) === 1 && ot(r) && ot(o) && n.add(r.key + "|" + o.key);
  }
  return n;
}
const Mn = (e, t, n) => {
  const a = e.find((o) => o.key === t), r = e.find((o) => o.key === n);
  return e.map((o) => o.key === t ? { ...o, rideId: r.rideId, rideMinutes: r.rideMinutes } : o.key === n ? { ...o, rideId: a.rideId, rideMinutes: a.rideMinutes } : o);
};
function Ra(e, t, n) {
  const a = e.find((S) => S.key === t), r = e.find((S) => S.key === n);
  if (!a || !r || !a.rideId || t === n) return { warning: null, suggestedKey: null };
  const o = Dt(e), d = Mn(e, t, n), i = [...Dt(d)].filter((S) => !o.has(S)), m = d.filter((S) => [t, n].includes(S.key) && ot(S) && S.strengthMinutes >= 30 && !e.some((M) => M.key === S.key && ot(M) && M.strengthMinutes >= 30));
  if (!i.length && !m.length) return { warning: null, suggestedKey: null };
  const y = [
    i.length ? "This change creates demanding rides on consecutive days (" + i.map((S) => S.split("|").join(" and ")).join("; ") + ")." : "",
    m.length ? "It also places a demanding ride on a strength-training day." : ""
  ].filter(Boolean).join(" "), f = e.filter((S) => S.key !== t && S.key !== n && !S.rideId && !S.completedRide && !S.eventDay && S.key >= t).find((S) => {
    const M = Mn(e, t, S.key);
    return [...Dt(M)].every((b) => o.has(b)) && !M.some((b) => b.key === S.key && ot(b) && b.strengthMinutes >= 30);
  });
  return {
    warning: y + " Consider an easier day between demanding efforts when possible. You can keep your selected move if needed.",
    suggestedKey: (f == null ? void 0 : f.key) || null
  };
}
const Yn = 864e5;
function Ge(e) {
  return [e.getFullYear(), String(e.getMonth() + 1).padStart(2, "0"), String(e.getDate()).padStart(2, "0")].join("-");
}
const Da = (e, t) => Number.isFinite(e.start) && e.start <= t && e.start >= t - 14 * Yn && Number.isFinite(e.elapsed) && e.elapsed >= 900;
function At(e) {
  return Math.max(0, Math.round(e.elapsed / 60));
}
function Aa(e) {
  var me, V, fe, O, P;
  const { now: t, week: n, today: a, ftp: r, ftpKnown: o } = e, d = Ge(t), i = t.getTime(), m = new Set(e.skipped), y = new Set(e.manualOverrides || []), f = e.rides.filter((v) => Da(v, i)), S = new Date(t.getFullYear(), t.getMonth(), t.getDate() - t.getDay()), M = [];
  for (let v = 0; v < 14; v++) {
    const I = new Date(S.getFullYear(), S.getMonth(), S.getDate() + v), c = Ge(I), W = I.getDay(), H = ((me = e.planForDate) == null ? void 0 : me.call(e, I)) ?? n.find((z) => z.day === W), oe = (V = e.event) != null && V.startDate && /^\d{4}-\d{2}-\d{2}$/.test(e.event.startDate) ? /* @__PURE__ */ new Date(e.event.startDate + "T12:00:00") : null, ie = oe ? Math.round((new Date(I.getFullYear(), I.getMonth(), I.getDate(), 12).getTime() - oe.getTime()) / Yn) : -1, Ae = ie >= 0 && ie < Math.max(1, ((fe = e.event) == null ? void 0 : fe.stages) || 1) ? ie + 1 : 0, Q = H != null && H.cyclingId && H.cyclingMinutes > 0 ? H.cyclingId : null, _ = (O = e.originalPlanForDate) == null ? void 0 : O.call(e, I), Ne = _ != null && _.cyclingId && _.cyclingMinutes > 0 ? _.cyclingId : null, be = y.has(c) && !!_ && (Ne !== Q || ((_ == null ? void 0 : _.cyclingMinutes) || 0) !== ((H == null ? void 0 : H.cyclingMinutes) || 0)), we = Q ? H.cyclingMinutes : 0, Ke = I.getTime(), xe = f.filter((z) => Ge(new Date(z.start)) === c), Oe = xe.reduce((z, Ie) => z + At(Ie), 0), We = Ke < new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(), Me = c === d;
    let re = Q, pe = we, ce = Q ? "planned" : "rest", le = (H == null ? void 0 : H.reason) || "Recovery day";
    if (be && (le = "You manually changed this workout. " + le), (We || Me) && xe.length)
      re = null, pe = 0, ce = "completed", le = "A ride was recorded on this date. Coach does not prescribe a duplicate session.";
    else if (Ae)
      re = null, pe = 0, ce = "event", le = "Event stage " + Ae + " of " + Math.max(1, ((P = e.event) == null ? void 0 : P.stages) || 1) + ". No additional indoor workout is prescribed. Follow your event pacing and fueling plan.";
    else if ((We || Me) && m.has(c))
      re = null, pe = 0, ce = "skipped", le = "You skipped this session. Coach will not stack it onto a later day.";
    else if (We)
      re = null, pe = 0, ce = Q ? "missed" : "rest", le = Q ? "This scheduled ride was not recorded and has not been rescheduled." : "Scheduled rest day.";
    else if (Me)
      re = a.workoutId, ce = a.status === "completed" ? "completed" : re ? a.status === "recovery" ? "recovery" : "planned" : "rest", pe = re ? re === "recovery" && Q !== "recovery" ? Math.min(we || e.recoveryMinutes, e.recoveryMinutes) : we : 0, le = a.reason;
    else if (Q) {
      const z = new Date(I.getFullYear(), I.getMonth(), I.getDate(), 9).getTime(), Ie = f.some((J) => J.start < z && z - J.start <= 36 * 36e5 && (At(J) >= 120 || o && J.avgPower !== null && Number.isFinite(J.avgPower) && J.elapsed >= 1800 && J.avgPower >= r * 0.8)), $ = e.feedback.some((J) => Number.isFinite(J.date) && J.date < z && z - J.date <= 48 * 36e5 && J.rpe !== null && J.rpe >= 9), ct = new Date(I.getFullYear(), I.getMonth(), I.getDate() - 1), Ye = Ge(ct), Le = M.find((J) => J.key === Ye), Be = y.has(Ye) && Le && (Le.workoutId === "vo2" || Le.workoutId === "sweetspot") && (Q === "vo2" || Q === "sweetspot" || Q === "tempo");
      (Ie || $ || Be) && Q !== "recovery" && !y.has(c) && (re = "recovery", pe = Math.min(we, e.recoveryMinutes), ce = "recovery", le = $ ? "Very hard recent workout feedback prompted a recovery spin instead of the planned workout." : Be ? "Your manually selected high-intensity workout on the previous day would stack demanding sessions. Coach substituted recovery to protect adaptation." : "A demanding or long ride was recorded before this session. Coach replaced it with easier recovery riding.");
    }
    be && ce === "planned" && (le = "You manually changed this workout. " + ((H == null ? void 0 : H.reason) || "Your chosen workout is saved.")), M.push({
      key: c,
      date: I,
      weekday: W,
      originalId: be ? Ne : Q,
      workoutId: re,
      originalMinutes: be ? (_ == null ? void 0 : _.cyclingMinutes) || 0 : we,
      minutes: pe,
      recordedMinutes: Oe,
      status: ce,
      reason: le,
      changed: be || ce === "completed" || re !== Q || pe !== we,
      strength: Ae ? null : (H == null ? void 0 : H.strength) || null,
      strengthMinutes: Ae ? 0 : (H == null ? void 0 : H.strengthMinutes) || 0
    });
  }
  const l = M.filter((v) => v.date.getTime() <= i && v.date.getTime() >= S.getTime()).filter((v) => f.some((I) => Ge(new Date(I.start)) === v.key)), T = l.reduce((v, I) => v + f.filter((c) => Ge(new Date(c.start)) === I.key).reduce((c, W) => c + At(W), 0), 0), E = l.reduce((v, I) => v + I.originalMinutes, 0), A = Math.max(0, T - E), C = M.slice(0, 7).reduce((v, I) => v + I.originalMinutes + I.strengthMinutes, 0), N = Math.max(0, e.budgetMinutes - C), L = M.slice(0, 7).filter((v) => v.status === "recovery" && v.date.getTime() >= new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()).reduce((v, I) => v + Math.max(0, I.originalMinutes - I.minutes), 0);
  let Y = Math.max(0, A - N - L);
  const D = new Date(S.getFullYear(), S.getMonth(), S.getDate() + 7).getTime(), k = M.filter((v) => v.date.getTime() >= new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime() && v.date.getTime() < D && v.workoutId && v.status !== "completed" && v.status !== "skipped").sort((v, I) => {
    const c = (W) => W.workoutId === "recovery" ? 0 : W.workoutId === "endurance" ? 1 : 2;
    return c(v) - c(I) || v.date.getTime() - I.date.getTime();
  });
  for (const v of k) {
    if (Y <= 0) break;
    const I = Math.max(0, v.minutes - 15), c = Math.min(I, Y);
    c <= 0 || (v.minutes -= c, Y -= c, v.minutes !== v.originalMinutes && (v.status = v.status === "recovery" ? "recovery" : "shortened", v.changed = !0, v.reason += " Additional riding exceeded your remaining weekly time by " + (A - N - L) + " minutes, so Coach shortened this session by " + c + " minutes. Strength and rest days stay unchanged."));
  }
  const he = M.filter((v) => v.date.getTime() < D && (v.changed || v.status === "skipped" && m.has(v.key))).map((v) => ({
    key: v.key,
    originalId: v.originalId,
    workoutId: v.workoutId,
    beforeMinutes: v.originalMinutes,
    afterMinutes: v.status === "completed" ? v.recordedMinutes : v.minutes,
    reason: v.reason,
    kind: v.status === "completed" ? "completed" : v.status === "skipped" ? "skipped" : v.status === "shortened" ? "shortened" : v.status === "missed" ? "missed" : v.status === "event" ? "event" : y.has(v.key) && v.reason.startsWith("You manually changed") ? "manual" : "recovery"
  }));
  return { days: M, changes: he, extraMinutes: A };
}
const Na = (e) => {
  const t = e.match(/\b(\d{1,2}):([0-5]\d):([0-5]\d)\b/);
  if (t) return Math.round((Number(t[1]) * 3600 + Number(t[2]) * 60 + Number(t[3])) / 60);
  const n = e.match(/\b(\d{1,2}):([0-5]\d)\b/);
  if (n) return Number(n[1]) * 60 + Number(n[2]);
  const a = e.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr|h)\b/i), r = e.match(/\b(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)\b/i), o = (a ? Number(a[1]) * 60 : 0) + (r ? Number(r[1]) : 0);
  return o > 0 ? Math.round(o) : null;
};
function In(e) {
  const t = e.trim().slice(0, 3e3), n = Na(t), a = /\b(steady|base|endurance|easy aerobic|consistent|continuous)\b/i.test(t), r = t.match(/\b(?:heart[\s-]*rate|hr)?\s*(?:between|from)\s*(\d{2,3})\s*(?:and|to|[-–—])\s*(\d{2,3})\s*(?:bpm)?\b/i), o = t.match(/\b(?:heart[\s-]*rate|hr)?\s*(\d{2,3})\s*(?:-|–|—|to)\s*(\d{2,3})\s*bpm\b/i), d = t.match(/\b(\d{2,4})\s*(?:-|–|—|to)\s*(\d{2,4})\s*(?:w|watts)\b/i), i = r || o;
  let m = null;
  if (i) {
    const M = Number(i[1]), b = Number(i[2]);
    M >= 35 && b <= 240 && M < b && (m = { kind: "heart-rate", minBpm: M, maxBpm: b });
  } else if (d) {
    const M = Number(d[1]), b = Number(d[2]);
    M >= 20 && b <= 1200 && M < b && (m = { kind: "power", lowWatts: M, highWatts: b });
  }
  const y = [];
  n === null && y.push("Duration not specified. Enter a total workout time."), m === null && y.push("No valid heart-rate or wattage range found. Add an intensity target."), /\bwarm[\s-]?up\b/i.test(t) || y.push("Warmup not specified — no separate warmup was added."), /\bcool[\s-]?down\b/i.test(t) || y.push("Cooldown not specified — no separate cooldown was added."), (m == null ? void 0 : m.kind) === "heart-rate" && (y.push("No power target provided. Breakaway will not convert heart rate into watts."), y.push("A compatible heart-rate monitor is needed for live guidance.")), n !== null && (n < 1 || n > 600) && y.push("Duration must be between 1 and 600 minutes.");
  const f = n !== null && n >= 1 && n <= 600 && m !== null;
  return {
    title: /\b(base|endurance)\b/i.test(t) ? "Base" : "Steady Heart-Rate Ride",
    sport: "cycling",
    durationMinutes: n,
    target: m,
    description: t,
    pace: a ? "steady" : "unspecified",
    notes: a ? ["One continuous, steady session."] : [],
    warnings: y,
    ready: f
  };
}
const Nt = "Ride for 2 hours at a steady pace. Keep heart rate between 103 and 114 bpm.", Cn = "breakaway.coach.imported-workouts.v1", mt = (e) => e === null ? "—" : Math.floor(e / 60) + ":" + String(e % 60).padStart(2, "0") + ":00";
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
  let o = null, d = In(Nt);
  n.value = Nt;
  const i = (y) => {
    for (const f of ["Text", "Image", "File"])
      t("ciTab" + f).setAttribute("aria-selected", String(f === y)), t("ciPanel" + f).hidden = f !== y;
  };
  t("ciTabText").addEventListener("click", () => i("Text")), t("ciTabImage").addEventListener("click", () => i("Image")), t("ciTabFile").addEventListener("click", () => i("File")), t("ciBackToText").addEventListener("click", () => i("Text")), t("ciExample").addEventListener("click", () => {
    n.value = Nt, m();
  });
  function m() {
    d = In(n.value);
    const y = d.target, f = (y == null ? void 0 : y.kind) === "heart-rate", S = (y == null ? void 0 : y.kind) === "power", M = f ? y.minBpm + "–" + y.maxBpm : S ? y.lowWatts + "–" + y.highWatts : "—", b = f ? "BPM" : S ? "WATTS" : "MISSING";
    t("ciTitle").textContent = d.title, t("ciSubtitle").textContent = d.pace === "steady" ? "One continuous steady cycling interval" : "One continuous cycling interval", t("ciDuration").textContent = mt(d.durationMinutes), t("ciTarget").textContent = M, t("ciTargetUnit").textContent = "TARGET " + b, t("ciTimelineTarget").textContent = M + " " + b, t("ciTimelineType").textContent = f ? "Heart-rate target" : S ? "Power target" : "Intensity not specified", t("ciTimelineMinutes").textContent = d.durationMinutes !== null ? d.durationMinutes + " MIN" : "TIME MISSING", t("ciTimelineMiddle").textContent = d.durationMinutes !== null ? mt(Math.floor(d.durationMinutes / 2)) : "—", t("ciTimelineEnd").textContent = mt(d.durationMinutes), t("ciTrainerMode").textContent = f ? "SIM / manual resistance" : S ? "Power guidance / ERG optional" : "Intensity not specified", t("ciStructure").textContent = "One " + (d.pace === "steady" ? "steady " : "") + "block", t("ciWarnings").innerHTML = d.warnings.map((l) => "<li>" + R(l) + "</li>").join(""), t("ciStatus").textContent = d.ready ? "READY TO REVIEW" : "NEEDS DETAILS", t("ciStatus").classList.toggle("is-incomplete", !d.ready), t("ciSave").disabled = !d.ready, t("ciTimeline").setAttribute("aria-label", "Continuous cycling workout lasting " + mt(d.durationMinutes) + " with target " + M + " " + b), t("ciSaveStatus").textContent = "";
  }
  n.addEventListener("input", m), a.addEventListener("change", () => {
    var f;
    const y = (f = a.files) == null ? void 0 : f[0];
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
        const y = JSON.parse(localStorage.getItem(Cn) || "[]"), f = Array.isArray(y) ? y : [];
        localStorage.setItem(Cn, JSON.stringify([...f.slice(-24), { ...d, id: "import-" + Date.now(), savedAt: (/* @__PURE__ */ new Date()).toISOString() }])), t("ciSaveStatus").textContent = "✓ Saved on this device. Imported-workout execution is not yet available.";
      } catch {
        t("ciSaveStatus").textContent = "Unable to save. Please enable browser storage.";
      }
  }), m();
}
const xt = "breakaway.coach.morning.v1", et = "breakaway.coach.ftp-known.v1", yt = (e, t, n) => typeof e == "number" && Number.isFinite(e) && Number.isInteger(e) && e >= t && e <= n ? e : null;
function Ot(e, t) {
  if (!e || typeof e != "object") return null;
  const n = e, a = typeof n.date == "string" ? /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(n.date) : null;
  if ((a ? [a[1], a[2].padStart(2, "0"), a[3].padStart(2, "0")].join("-") : null) !== t || !["tired", "okay", "great"].includes(String(n.feeling))) return null;
  for (const [o, d, i] of [["bodyBattery", 0, 100], ["sleepScore", 0, 100], ["hrvMs", 1, 300]])
    if (n[o] !== null && n[o] !== void 0 && yt(n[o], d, i) === null) return null;
  return {
    date: t,
    feeling: n.feeling,
    bodyBattery: yt(n.bodyBattery, 0, 100),
    sleepScore: yt(n.sleepScore, 0, 100),
    hrvMs: yt(n.hrvMs, 1, 300)
  };
}
function Bn(e) {
  if (!e) return { label: "Not checked in", detail: "Morning check-in is optional. Coach is using your schedule and recent rides.", suggestEasy: !1 };
  if (e.feeling === "tired") return { label: "Check your energy", detail: "You reported feeling tired. Consider an easy session; Body Battery, Sleep Score and HRV alone are not diagnostic.", suggestEasy: !0 };
  const t = [e.bodyBattery, e.sleepScore, e.hrvMs].filter((n) => n !== null).length;
  return {
    label: e.feeling === "great" ? "Feeling good" : "Feeling okay",
    detail: t ? "Your Garmin-style readings are recorded for reference. Personalized recovery thresholds need a baseline, so these numbers do not automatically change workouts." : "Your self-check is saved; there are no device readings today.",
    suggestEasy: !1
  };
}
function Oa(e, t) {
  return !Bn(t).suggestEasy || e.status !== "planned" || !e.workoutId || e.workoutId === "recovery" ? e : { workoutId: "recovery", status: "recovery", reason: "You reported feeling tired during your morning check-in. Coach suggests an easier recovery spin instead of your planned session. This is a training suggestion, not a medical assessment." };
}
function La(e, t, n = !1) {
  return n ? { color: "green", label: "Training complete", detail: "You have already ridden today. No additional prescribed workout is needed." } : !e && !t.demandingRide && !t.veryHardFeedback ? { color: "neutral", label: "Check-in optional", detail: "Coach has no reported fatigue today, but no check-in or personal recovery baseline is available. Follow the plan if you feel well, and adjust as needed." } : (e == null ? void 0 : e.feeling) === "tired" && (t.demandingRide || t.veryHardFeedback) ? { color: "red", label: "Recovery recommended", detail: "You reported fatigue and recent training was demanding. Coach recommends rest or gentle recovery rather than another hard effort." } : (e == null ? void 0 : e.feeling) === "tired" || t.demandingRide || t.veryHardFeedback ? { color: "yellow", label: "Take it easy", detail: (e == null ? void 0 : e.feeling) === "tired" ? "You reported fatigue. Coach suggests a lighter session based on your check-in." : "Recent demanding training suggests a lighter session. Coach uses recorded effort, not Garmin score cutoffs." } : { color: "green", label: "Follow your plan", detail: (e == null ? void 0 : e.feeling) === "great" ? "You feel good today. Follow your planned session without adding extra intensity." : "No fatigue flag was found in available inputs. Missing Garmin data does not mean you are fully recovered." };
}
const Rn = "breakaway.coach.event-goal.v1", Pa = { discipline: "general", name: "", date: "", distanceKm: null, elevationM: null, durationMinutes: null, stages: 1, priority: "A", objective: "finish", terrain: "road" }, bt = { general: "General cycling fitness", criterium: "Criterium", road: "Road race", tt: "Time trial", xco: "Mountain bike XCO / short track", xcm: "Mountain bike marathon", gravel: "Gravel race", cyclocross: "Cyclocross", "gran-fondo": "Gran Fondo / century", ultra: "Ultra-endurance", "stage-race": "Multi-day stage race" }, Lt = (e, t) => e === "" || e === null || e === void 0 ? null : Number.isFinite(Number(e)) && Number(e) > 0 && Number(e) <= t ? Number(e) : null;
function Pt(e) {
  const t = e && typeof e == "object" ? e : {}, n = Object.hasOwn(bt, String(t.discipline)) ? t.discipline : "general", a = typeof t.date == "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && !Number.isNaN((/* @__PURE__ */ new Date(t.date + "T12:00:00")).getTime()) && (/* @__PURE__ */ new Date(t.date + "T12:00:00")).toISOString().slice(0, 10) === t.date ? t.date : "";
  return {
    discipline: n,
    name: typeof t.name == "string" ? t.name.trim().slice(0, 100) : "",
    date: a,
    distanceKm: Lt(t.distanceKm, 5e3),
    elevationM: Lt(t.elevationM, 1e5),
    durationMinutes: Lt(t.durationMinutes, 3e4),
    stages: n === "stage-race" ? Math.max(2, Math.min(30, Math.round(Number(t.stages) || 2))) : 1,
    priority: ["A", "B", "C"].includes(String(t.priority)) ? t.priority : "A",
    objective: t.objective === "perform" ? "perform" : "finish",
    terrain: ["road", "gravel", "trail", "mixed"].includes(String(t.terrain)) ? t.terrain : "road"
  };
}
function qt(e, t) {
  if (!e.date || e.discipline === "general") return { phase: "foundation", weeksLeft: null, description: "Build consistency, comfortable endurance and repeatable training habits." };
  const n = /* @__PURE__ */ new Date(e.date + "T12:00:00"), a = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12), r = Math.round((n.getTime() - a.getTime()) / 864e5), o = e.discipline === "stage-race" ? Math.max(2, e.stages) : 1, d = Math.max(0, Math.ceil(r / 7)), i = r < -(o - 1) ? "post-event" : r <= 0 ? "event" : r <= 7 ? "taper" : r <= 28 ? "specific" : r <= 70 ? "build" : "base";
  return { phase: i, weeksLeft: d, description: { base: "Build a sustainable aerobic foundation before race-specific sessions.", build: "Develop the power and endurance needed for your event.", specific: "Practice efforts that resemble your event while managing fatigue.", taper: "Reduce accumulated fatigue; preserve fitness and arrive ready.", event: "Event day: follow your pacing, fueling and safety plan.", "post-event": "Recover after the event before setting a new primary goal." }[i] };
}
function Ha(e, t, n) {
  const { phase: a } = qt(t, n), o = [...e.days === 2 ? [1, 4] : e.days === 3 ? [1, 3, 6] : e.days === 4 ? [1, 2, 4, 6] : e.days === 5 ? [0, 1, 3, 4, 6] : [0, 1, 2, 3, 4, 6]];
  if (o.includes(e.restDay)) {
    const M = Array.from({ length: 7 }, (b, l) => l).find((b) => b !== e.restDay && !o.includes(b));
    M !== void 0 && o.splice(o.indexOf(e.restDay), 1, M);
  }
  o.sort((M, b) => M - b);
  const d = ["criterium", "xco", "cyclocross"].includes(t.discipline), i = ["ultra", "stage-race", "xcm", "gravel", "gran-fondo"].includes(t.discipline), m = d ? "vo2" : i ? "tempo" : t.discipline === "tt" ? "sweetspot" : "tempo", y = e.experience === "beginner" ? "tempo" : m, f = a === "build" || a === "specific", S = a === "taper" || a === "post-event" || a === "event";
  return Array.from({ length: 7 }, (M, b) => {
    const l = o.indexOf(b);
    if (l < 0) return { day: b, workoutId: null, reason: "Scheduled recovery day" };
    const T = S ? l === 0 ? "recovery" : "endurance" : l === o.length - 1 ? "endurance" : l === 0 ? f ? y : "endurance" : l === 2 && f && d && e.experience === "advanced" ? "tempo" : l % 2 === 0 ? "recovery" : "endurance", E = a === "foundation" ? "General development" : bt[t.discipline] + " · " + a;
    return { day: b, workoutId: T, reason: E + " preparation. " + (S ? "Keep the session easy and avoid chasing workload." : f ? "Match the event demands while maintaining recovery." : "Build consistent aerobic training.") };
  });
}
function tt() {
  const e = ne(Ht);
  return Array.isArray(e) ? e.filter((t) => t && typeof t.workout == "string" && typeof t.date == "string").slice(-150) : [];
}
const vt = (e) => {
  const t = Math.max(0, Math.ceil(e));
  return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
}, nt = (e, t) => e.querySelector("#" + t);
function Wa(e) {
  let n = Fe(ne(Pe) || at), a = Pt(ne(Rn) || Pa), r = Ct(n), o = "endurance", d = !1, i = null, m = "", y = null, f = [], S = null, M = [], b = Wn(ne(gt)), l = null, T = null, E = null, A = "structured";
  const C = "breakaway.coach.skipped-days.v1";
  function N() {
    const s = ne(C);
    return Array.isArray(s) ? [...new Set(s.map(st).filter(Boolean))].slice(-90) : [];
  }
  let L = ne(et) === !0 || ne(et) === null && !!ne(Pe), Y = [], D = null, k = null, he = "", me = 0, V = !1, fe = null, O = 130;
  const P = document.getElementById("screenRoute"), v = document.createElement("section");
  v.id = "breakawayCoachScreen", v.className = "coach-screen coach-v2", v.hidden = !0, v.innerHTML = `
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
          <label>EVENT OR GOAL TYPE<select id="coachEventDiscipline">${Object.entries(bt).map(([s, u]) => '<option value="' + s + '">' + u + "</option>").join("")}</select></label>
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
`, document.body.append(v);
  const I = document.createElement("aside");
  I.id = "breakawayCoachHud", I.className = "coach-hud", I.hidden = !0, I.setAttribute("aria-label", "Live Breakaway Coach"), I.innerHTML = '<div class="coach-hud-top"><strong>◆ BREAKAWAY COACH</strong><span id="coachHudState">WAITING FOR PEDALS</span><button type="button" id="coachMinimize" aria-label="Minimize coaching panel">−</button></div><div class="coach-hud-core"><div><small>ACTUAL</small><strong id="coachActual">—<span> W</span></strong></div><div><small>TARGET</small><strong id="coachTarget">—<span> W</span></strong></div><div><small>REMAINING</small><strong id="coachRemaining">—</strong></div></div><div class="coach-interval-line"><span id="coachInterval">WARM UP</span><span id="coachSessionClock">0:00</span></div><div class="coach-progress"><div id="coachProgressBar"></div></div><p id="coachPrompt" aria-live="polite">Connect a trainer, then start pedaling.</p><div class="coach-hud-actions"><button type="button" id="coachLighter">−5% EFFORT</button><button type="button" id="coachHarder">+5% EFFORT</button><button type="button" id="coachEnd">END COACHING</button></div>', document.body.append(I);
  const c = (s) => nt(v, s), W = (s) => nt(I, s), H = c("coachControl"), oe = ["today", "plan", "history", "settings", "import"];
  function ie(s, u = !1) {
    v.querySelectorAll("[data-coach-tab]").forEach((g) => {
      const p = g.dataset.coachTab === s;
      g.setAttribute("aria-selected", String(p)), g.tabIndex = p ? 0 : -1, p && u && g.focus();
    }), v.querySelectorAll("[data-coach-view]").forEach((g) => {
      g.hidden = g.dataset.coachView !== s;
    }), v.scrollTop = 0, s === "history" && Be();
  }
  v.querySelectorAll("[data-coach-tab]").forEach((s) => {
    s.addEventListener("click", () => ie(s.dataset.coachTab)), s.addEventListener("keydown", (u) => {
      const g = oe.indexOf(s.dataset.coachTab);
      let p = -1;
      u.key === "ArrowRight" && (p = (g + 1) % oe.length), u.key === "ArrowLeft" && (p = (g + oe.length - 1) % oe.length), u.key === "Home" && (p = 0), u.key === "End" && (p = oe.length - 1), p >= 0 && (u.preventDefault(), ie(oe[p], !0));
    });
  }), v.querySelectorAll("[data-navigate-coach]").forEach((s) => s.addEventListener("click", () => {
    const u = s.dataset.navigateCoach;
    oe.includes(u) && ie(u, !0);
  }));
  function Ae() {
    if (L = ne(et) === !0 || ne(et) === null && !!ne(Pe), k) {
      I.hidden = !1;
      return;
    }
    v.hidden = !1, document.body.classList.add("coach-planning"), ie("today"), xe(), c("coachFtpKnown").dispatchEvent(new Event("change")), L || (A = "guided", H.value = "guided");
    const s = Ot(ne(xt), Te(/* @__PURE__ */ new Date()));
    if (s) {
      c("coachFeeling").value = s.feeling;
      for (const [u, g] of [["coachBattery", s.bodyBattery], ["coachSleep", s.sleepScore], ["coachHrv", s.hrvMs]]) c(u).value = g === null ? "" : String(g);
    } else {
      c("coachFeeling").value = "okay";
      for (const u of ["coachBattery", "coachSleep", "coachHrv"]) c(u).value = "";
    }
    $(), Be(), window.scrollTo(0, 0);
  }
  function Q() {
    v.hidden = !0, document.body.classList.remove("coach-planning");
  }
  P == null || P.addEventListener("click", (s) => {
    const u = s.target;
    u instanceof Element && u.closest("#openBreakawayCoach") && Ae();
  }), c("coachBack").addEventListener("click", Q);
  function _(s = /* @__PURE__ */ new Date()) {
    return ka(
      n,
      (D == null ? void 0 : D.settings) || Pn,
      a.discipline === "general" ? Dn(n, !1) : Ha(n, a, s),
      (u) => Math.round(Z(r.find((g) => g.id === u) || r[0]) / 60)
    );
  }
  function Ne() {
    const s = Y.map((w) => ({ start: w.start, elapsed: w.elapsed, avgPower: w.avgPower })), u = f.filter((w) => !s.some((x) => Math.abs(x.start - w.start) < 12e4)).map((w) => ({ start: w.start, elapsed: w.duration, avgPower: w.avgPower, source: "import" })), g = s.concat(u), p = tt().filter((w) => w.mode === "classic" && w.elapsedSeconds > 0).map((w) => ({
      start: Date.parse(w.date) - w.elapsedSeconds * 1e3,
      elapsed: w.elapsedSeconds,
      avgPower: w.averageWatts,
      source: "classic"
    })).filter((w) => Number.isFinite(w.start) && !g.some((x) => Math.abs(x.start - w.start) < 12e4));
    return g.concat(p);
  }
  function be() {
    return tt().map((s) => ({ date: Date.parse(s.date), rpe: s.rpe }));
  }
  function we() {
    const s = be().concat(((D == null ? void 0 : D.history) || []).map((u) => ({ date: Date.parse(u.date), rpe: u.rpe })));
    return Ft(n, Date.now(), L ? Ne() : Ne().map((u) => ({ ...u, avgPower: null })), s).fatigued;
  }
  function Ke() {
    const s = c("coachEventDiscipline").value;
    c("coachEventStagesWrap").hidden = s !== "stage-race", c("coachEventStages").disabled = s !== "stage-race", s === "stage-race" && Number(c("coachEventStages").value) < 2 && (c("coachEventStages").value = "2"), c("coachEventStageHint").hidden = s !== "stage-race", c("coachGeneralFocusWrap").hidden = s !== "general";
    const u = Pt({ discipline: s, date: c("coachEventDate").value }), g = qt(u, /* @__PURE__ */ new Date());
    c("coachGoalPhaseSummary").textContent = u.discipline === "general" ? "General fitness: build a sustainable weekly routine." : g.weeksLeft === null ? "Set an event date to calculate training phases." : g.weeksLeft + " weeks remaining · " + g.phase.toUpperCase() + " phase. " + g.description;
  }
  function xe() {
    c("coachFtp").value = String(n.ftp), c("coachFtpKnown").value = L ? "yes" : "no", c("coachHours").value = String(n.hours), c("coachDays").value = String(n.days), c("coachRestDay").value = String(n.restDay), c("coachExperience").value = n.experience, c("coachGoal").value = n.goal, c("coachEventDiscipline").value = a.discipline, c("coachEventName").value = a.name, c("coachEventDate").value = a.date, c("coachEventPriority").value = a.priority, c("coachEventObjective").value = a.objective, c("coachEventTerrain").value = a.terrain;
    for (const [s, u] of [["coachEventDistance", a.distanceKm === null ? null : Math.round(a.distanceKm / 1.609344 * 10) / 10], ["coachEventDuration", a.durationMinutes], ["coachEventElevation", a.elevationM === null ? null : Math.round(a.elevationM / 0.3048)], ["coachEventStages", a.stages]]) c(s).value = u === null ? "" : String(u);
    Ke();
  }
  function Oe() {
    if (y) return y;
    const s = r.find((w) => w.id === o) || r[0];
    if (d) {
      const w = i;
      return w !== null && w >= 15 && w * 60 < Z(s) ? Rt(s, w) : s;
    }
    const u = _().days.find((w) => w.day === (/* @__PURE__ */ new Date()).getDay()), g = D != null && D.settings.enabled && (u == null ? void 0 : u.cyclingId) === s.id && u.cyclingMinutes > 0 ? u.cyclingMinutes : 1 / 0, p = Math.min(E ?? 1 / 0, g);
    return Number.isFinite(p) && p >= 15 && p * 60 < Z(s) ? Rt(s, p) : s;
  }
  function We(s) {
    const u = Oe(), g = u.segments[s];
    if (!g) return;
    const p = un(n.ftp, g);
    c("coachIntervalDetails").innerHTML = '<div class="coach-interval-identity"><span class="coach-interval-kicker">BLOCK ' + (s + 1) + " / " + u.segments.length + "</span><strong>" + R(g.name) + "</strong><small>" + p.ftpRange + '</small></div><div class="coach-interval-numbers"><div><span>DURATION</span><strong>' + p.duration + "</strong></div><div><span>POWER RANGE</span><strong>" + p.range + "</strong></div><div><span>ERG TARGET</span><strong>" + p.target + " W</strong></div></div>", c("coachSegments").querySelectorAll("[data-coach-segment]").forEach((w) => {
      w.setAttribute("aria-pressed", String(Number(w.dataset.coachSegment) === s));
    });
  }
  const Me = c("coachSegments"), re = (s) => {
    const u = s.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-coach-segment]");
    g && Me.contains(g) && We(Number(g.dataset.coachSegment));
  };
  Me.addEventListener("pointerover", re), Me.addEventListener("focusin", re), Me.addEventListener("click", re);
  function pe(s, u = !1) {
    return u ? "completed" : s ? s === "recovery" ? "recovery" : s === "vo2" || s === "sweetspot" ? "intensity" : s === "tempo" ? "tempo" : "endurance" : "rest";
  }
  function ce() {
    const s = c("coachCalendarStrip"), u = c("coachCalendarDetails"), g = M.findIndex((q) => q.key === S);
    s.innerHTML = M.map((q, _e) => {
      const dt = q.reason.startsWith("Event stage "), ye = q.rideName || (q.completedRide ? "Ride completed" : dt ? "Event day" : null), Ce = q.isToday && (D == null ? void 0 : D.completedToday()) === !0, K = q.strength ? Ce ? "✓ Strength completed" : "Full Body Strength " + q.strength : null, se = [ye, K].filter(Boolean);
      return '<button type="button" class="coach-calendar-pill' + (q.isToday ? " is-today" : "") + '" data-workout-color="' + pe(q.rideId, q.completedRide) + '" data-calendar-index="' + _e + '" draggable="' + !!(q.rideId && !q.completedRide) + '" aria-expanded="' + (q.key === S) + '" aria-controls="coachCalendarDetails" aria-label="' + R(q.title + ": " + (se.join(", ") || "Rest day") + ". " + (q.key === S ? "Collapse details." : "Expand details.")) + '"><span class="coach-calendar-date">' + R(q.label) + '</span><span class="coach-calendar-activity">' + R(ye || (K ? "" : "Rest day")) + "</span>" + (K ? '<span class="coach-calendar-strength">' + R(K) + "</span>" : "") + '<span class="coach-calendar-chevron" aria-hidden="true">' + (q.key === S ? "⌃" : "⌄") + "</span></button>";
    }).join("");
    const p = M[g];
    if (u.hidden = !p, !p) {
      u.innerHTML = "";
      return;
    }
    u.setAttribute("aria-label", "Workouts for " + p.title);
    const w = p.rideId ? r.find((q) => q.id === p.rideId) : null, x = w ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">CYCLING</span><strong>' + R(w.name) + "</strong><p>" + p.rideMinutes + " min · " + R(w.description) + "</p><p>" + R(p.reason) + '</p></div><div class="coach-calendar-session-actions"><button type="button" data-calendar-action="ride" data-calendar-index="' + g + '">' + (p.isToday ? "VIEW TODAY’S RIDE" : "USE THIS RIDE TODAY (OPTIONAL)") + ' →</button><button type="button" data-calendar-action="move" data-calendar-index="' + g + '">' + (l === p.key ? "CANCEL MOVE" : "MOVE WORKOUT") + "</button></div></div>" : p.completedRide ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">CYCLING</span><strong>Ride completed today</strong><p>Coach will account for your recorded ride.</p></div></div>' : "", G = p.isToday && (D == null ? void 0 : D.completedToday()) === !0, de = p.strength ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">' + (G ? "STRENGTH · COMPLETED" : "STRENGTH · NO TRAINER NEEDED") + "</span><strong>Full Body Strength " + p.strength + "</strong><p>" + p.strengthMinutes + " min · Exercises matched to your saved equipment</p></div>" + (G ? "" : '<button type="button" data-calendar-action="strength" data-calendar-index="' + g + '">' + (p.isToday ? "START STRENGTH" : "START STRENGTH TODAY (OPTIONAL)") + " →</button>") + "</div>" : "", j = p.reason.startsWith("Event stage "), X = !x && !de ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">' + (j ? "EVENT DAY" : "RECOVERY") + "</span><strong>" + (j ? "Race or stage day" : "Rest day") + "</strong><p>" + (j ? R(p.reason) : "No workout is scheduled. Recovery is part of your plan.") + "</p></div></div>" : "";
    u.innerHTML = '<div class="coach-calendar-detail-head"><div><span class="coach-calendar-type">DAY DETAILS</span><h3>' + R(p.title) + '</h3></div><button type="button" class="coach-calendar-close" data-calendar-action="close" aria-label="Close calendar day details">✕</button></div><div class="coach-calendar-detail-grid">' + x + de + X + "</div>" + (l ? '<p class="coach-move-hint">Select a destination day above. Cycling sessions swap if both days have rides; strength stays put.</p>' : "");
  }
  c("coachCalendarStrip").addEventListener("click", (s) => {
    var w;
    const u = s.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-calendar-index]");
    if (!g) return;
    const p = M[Number(g.dataset.calendarIndex)];
    if (p) {
      if (l && p.key !== l) {
        le(l, p.key);
        return;
      }
      S = S === p.key ? null : p.key, ce(), (w = c("coachCalendarStrip").querySelectorAll("[data-calendar-index]")[Number(g.dataset.calendarIndex)]) == null || w.focus();
    }
  });
  function le(s, u, g = !1) {
    var G;
    if (!g) {
      const de = M.map((X) => ({
        key: X.key,
        rideId: X.rideId,
        rideMinutes: X.rideMinutes,
        strengthMinutes: X.strengthMinutes,
        completedRide: X.completedRide,
        eventDay: X.reason.startsWith("Event stage ")
      })), j = Ra(de, s, u);
      if (j.warning) {
        T = { from: s, to: u, suggestedKey: j.suggestedKey };
        const X = c("coachMoveRecoveryWarning");
        X.innerHTML = "<strong>RECOVERY CHECK</strong><p>" + R(j.warning) + "</p>" + (j.suggestedKey ? '<button type="button" data-move-decision="suggested">MOVE TO ' + R(j.suggestedKey) + " INSTEAD</button>" : "") + '<button type="button" data-move-decision="proceed">MOVE ANYWAY</button><button type="button" data-move-decision="cancel">KEEP CURRENT PLAN</button>', X.hidden = !1, X.scrollIntoView({ block: "nearest", behavior: "smooth" }), (G = X.querySelector('[data-move-decision="cancel"]')) == null || G.focus();
        return;
      }
    }
    T = null, c("coachMoveRecoveryWarning").hidden = !0;
    const p = M.find((de) => de.key === s), w = M.find((de) => de.key === u);
    if (!p || !w || !p.rideId || p.completedRide || w.completedRide || p.reason.startsWith("Event stage ") || w.reason.startsWith("Event stage ")) return;
    const x = Ma(
      b,
      s,
      u,
      { cyclingId: p.rideId, cyclingMinutes: p.rideMinutes },
      { cyclingId: w.rideId, cyclingMinutes: w.rideMinutes }
    );
    if (x !== b) {
      if (!ue(gt, x)) {
        alert("Unable to save this calendar change. Check browser storage.");
        return;
      }
      b = x, l = null, S = u, d = !1, $();
    }
  }
  const z = document.createElement("section");
  z.id = "coachMoveRecoveryWarning", z.className = "coach-move-recovery-warning", z.setAttribute("role", "alert"), z.setAttribute("aria-label", "Recovery-aware scheduling warning"), z.hidden = !0, c("coachCalendarDetails").after(z), z.addEventListener("click", (s) => {
    var w;
    const u = s.target;
    if (!(u instanceof Element)) return;
    const g = (w = u.closest("[data-move-decision]")) == null ? void 0 : w.dataset.moveDecision;
    if (!g || !T) return;
    const p = T;
    if (g === "cancel") {
      T = null, z.hidden = !0, l = null, ce();
      return;
    }
    if (g === "suggested" && p.suggestedKey) {
      T = null, z.hidden = !0, le(p.from, p.suggestedKey);
      return;
    }
    g === "proceed" && le(p.from, p.to, !0);
  });
  const Ie = c("coachCalendarStrip");
  Ie.addEventListener("dragstart", (s) => {
    const u = s.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-calendar-index]"), p = M[Number(g == null ? void 0 : g.dataset.calendarIndex)];
    if (!(p != null && p.rideId) || p.completedRide) {
      s.preventDefault();
      return;
    }
    l = p.key, s.dataTransfer && (s.dataTransfer.effectAllowed = "move", s.dataTransfer.setData("text/plain", p.key));
  }), Ie.addEventListener("dragover", (s) => {
    s.target instanceof Element && s.target.closest("[data-calendar-index]") && s.preventDefault();
  }), Ie.addEventListener("drop", (s) => {
    s.preventDefault();
    const u = s.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-calendar-index]"), p = M[Number(g == null ? void 0 : g.dataset.calendarIndex)];
    p && l && le(l, p.key);
  }), Ie.addEventListener("dragend", () => {
    T || (l = null);
  }), c("coachCalendarDetails").addEventListener("click", (s) => {
    var w;
    const u = s.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-calendar-action]");
    if (!g) return;
    if (g.dataset.calendarAction === "close") {
      const x = M.findIndex((G) => G.key === S);
      S = null, ce(), x >= 0 && ((w = c("coachCalendarStrip").querySelectorAll("[data-calendar-index]")[x]) == null || w.focus());
      return;
    }
    const p = M[Number(g.dataset.calendarIndex)];
    if (p) {
      if (g.dataset.calendarAction === "move" && p.rideId) {
        l = l === p.key ? null : p.key, ce();
        return;
      }
      g.dataset.calendarAction === "ride" && p.rideId ? (o = p.rideId, d = !0, i = p.rideMinutes, y = null, S = null, $(), c("coachRecommendedName").scrollIntoView({ block: "center", behavior: "smooth" })) : g.dataset.calendarAction === "strength" && p.strength && Ye(p.strength, p.strengthMinutes);
    }
  });
  function $() {
    var ln, dn;
    r = Ct(n);
    const s = /* @__PURE__ */ new Date(), u = Te(s);
    u !== m && (m = u, d = !1, i = null, y = null, S = null);
    const g = Ne(), p = be(), w = L ? g : g.map((h) => ({ ...h, avgPower: null })), x = Ot(ne(xt), u), G = Bn(x), de = La(x, Ft(n, s.getTime(), w, p), g.some((h) => h.start >= new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime() && h.elapsed >= 900));
    c("coachReadinessLabel").textContent = de.label, c("coachReadinessLabel").setAttribute("data-day-color", de.color), c("coachReadinessExplanation").textContent = de.detail + " " + G.detail;
    const j = _(s), X = j.days.find((h) => h.day === s.getDay()), q = En(u, X, b), _e = pn(
      n,
      s,
      w,
      p,
      j.days.map((h) => ({
        day: h.day,
        workoutId: h.day === s.getDay() ? q.cyclingId : h.cyclingId,
        reason: h.day === s.getDay() ? q.reason : h.reason
      }))
    ), dt = Object.prototype.hasOwnProperty.call(b, u), ye = dt && _e.status !== "completed" ? { ..._e, workoutId: q.cyclingId, status: q.cyclingId ? "planned" : "rest", reason: q.reason } : Oa(_e, x), Ce = Aa({
      now: s,
      week: j.days,
      rides: g,
      feedback: p,
      skipped: N(),
      ftp: n.ftp,
      ftpKnown: L,
      budgetMinutes: j.budgetMinutes,
      today: ye,
      recoveryMinutes: Math.round(Z(r.find((h) => h.id === "recovery")) / 60),
      planForDate: (h) => {
        const F = _(h).days.find((U) => U.day === h.getDay());
        return F ? En(Te(h), F, b) : void 0;
      },
      originalPlanForDate: (h) => _(h).days.find((F) => F.day === h.getDay()),
      manualOverrides: Object.keys(b),
      event: a.discipline !== "general" && a.date ? { startDate: a.date, stages: a.discipline === "stage-race" ? a.stages : 1 } : void 0
    }), K = Ce.days.find((h) => h.key === u) ?? {
      weekday: s.getDay(),
      originalId: ((ln = j.days.find((h) => h.day === s.getDay())) == null ? void 0 : ln.cyclingId) ?? null,
      workoutId: ye.workoutId,
      minutes: ye.workoutId ? Math.round(Z(r.find((h) => h.id === ye.workoutId) || r[0]) / 60) : 0,
      status: ye.status === "recovery" ? "recovery" : ye.workoutId ? "planned" : "rest",
      reason: ye.reason,
      strength: null,
      strengthMinutes: 0
    };
    E = K.minutes;
    const se = {
      workoutId: K.workoutId,
      status: K.status === "completed" ? "completed" : K.status === "recovery" ? "recovery" : K.status === "rest" || K.status === "skipped" ? "rest" : "planned",
      reason: K.reason
    }, Gn = N().includes(u);
    c("coachSkipToday").textContent = Gn ? "Undo skipped session" : "Skip today's session", M = Ta(s, j.days, r, se).map((h) => {
      const F = Ce.days.find((ee) => ee.key === h.key);
      if (!F) return h;
      const U = r.find((ee) => ee.id === F.workoutId);
      return {
        ...h,
        rideId: (U == null ? void 0 : U.id) || null,
        rideName: (U == null ? void 0 : U.name) || null,
        rideDescription: (U == null ? void 0 : U.description) || null,
        rideMinutes: F.minutes,
        strength: F.strength,
        strengthMinutes: F.strengthMinutes,
        completedRide: F.status === "completed",
        reason: F.reason
      };
    }), ce();
    const Zt = (h) => {
      var ee, te;
      const F = ((ee = r.find((qe) => qe.id === h.originalId)) == null ? void 0 : ee.name) || (h.originalId ? "Planned ride" : "Rest day"), U = ((te = r.find((qe) => qe.id === h.workoutId)) == null ? void 0 : te.name) || (h.kind === "completed" ? "Ride recorded" : h.kind === "skipped" ? "Skipped" : h.kind === "missed" ? "Not completed" : h.kind === "event" ? "Race or event day" : "No ride scheduled");
      return "<li><strong>" + R(h.key) + "</strong> · " + R(F) + " (" + h.beforeMinutes + " min) → " + R(U) + " (" + h.afterMinutes + " min)<p>" + R(h.reason) + "</p></li>";
    }, ze = Ce.changes.filter((h) => h.key >= u), $t = c("coachAdaptiveToday");
    $t.hidden = ze.length === 0, $t.innerHTML = ze.length ? "<strong>YOUR UPDATED TRAINING WEEK · " + ze.length + " CHANGE" + (ze.length === 1 ? "" : "S") + "</strong><p>Coach checks swaps, completed rides, fatigue, and recovery. Unchanged days stay as planned.</p><ul>" + ze.map(Zt).join("") + "</ul>" : "";
    const Tt = Ce.changes.filter((h) => h.key <= Ce.days[6].key), Jt = c("coachAdaptiveWeek");
    Jt.hidden = Tt.length === 0, Jt.innerHTML = Tt.length ? "<strong>WHAT CHANGED IN YOUR WEEK</strong><p>Manual swaps and recovery adjustments are date-specific. Strength sessions and rest days stay protected.</p><ul>" + Tt.map(Zt).join("") + "</ul>" : "", j.days[s.getDay()];
    const Mt = !!K.strength, It = (D == null ? void 0 : D.completedToday()) || !1, Re = Mt && !K.workoutId, Qt = we();
    d || (o = se.workoutId || "recovery", y = null), r.some((h) => h.id === o) || (o = "recovery", y = null);
    const ut = !d && (!se.workoutId || Re);
    c("coachRestState").hidden = !ut, c("coachWorkoutControls").hidden = ut, c("coachRecommendedName").textContent = ut ? K.status === "event" ? "Race / event day" : Re ? "Strength training day" : se.status === "completed" ? "Ride already completed" : "Rest day" : Oe().name, c("coachRecommendationLabel").textContent = d ? "YOUR CHOICE" : K.status === "event" ? "EVENT DAY" : Re ? "STRENGTH DAY" : se.status === "recovery" ? "RECOVERY ADJUSTMENT" : se.status === "rest" || se.status === "completed" ? "REST RECOMMENDED" : "FROM YOUR PLAN", c("coachWhy").textContent = K.status === "event" && !d ? "Your event takes priority. There is no additional prescribed trainer ride today." : Re && !d ? "Your plan includes strength today. No cycling workout is scheduled." : ut ? "Coach recommends rest today." : d ? "You chose an optional alternative for today. Coach originally recommended: " + se.reason : "Why Coach chose this: " + se.reason;
    const ht = ((dn = j.days.find((h) => h.day === s.getDay())) == null ? void 0 : dn.cyclingId) || null, en = !d && se.status === "recovery" && ht && ht !== se.workoutId;
    if (c("coachChangeDetail").hidden = !en, en) {
      const h = r.find((te) => te.id === ht), F = r.find((te) => te.id === se.workoutId), U = h ? Math.round(Z(h) / 60) : null, ee = F ? Math.round(Z(F) / 60) : null;
      c("coachChangeDetail").innerHTML = '<strong>WHY TODAY CHANGED</strong><div class="coach-change-pair"><span>ORIGINAL: ' + R((h == null ? void 0 : h.name) || ht) + (U === null ? "" : " · " + U + " min") + "</span><span>RECOMMENDED: " + R((F == null ? void 0 : F.name) || "Recovery spin") + (ee === null ? "" : " · " + ee + " min") + "</span></div><p>" + R(se.reason) + "</p><p>See the updated training week for any changes to upcoming sessions. To ride the original workout today, select it under Swap workout.</p>";
    }
    c("coachRestReason").textContent = K.status === "event" ? K.reason : Re ? "Your strength session is ready above. No trainer needed. You can still pick an optional cycling workout." : se.reason, c("coachUseRecommendation").hidden = !d && !dt;
    const Xe = Oe(), jn = Z(Xe);
    c("coachWorkoutInfo").innerHTML = "<div><strong>" + R(Xe.category.toUpperCase()) + "</strong><span>" + Math.round(jn / 60) + " MINUTES · " + Xe.segments.length + " SEGMENTS</span></div><p>" + R(Xe.description) + "</p>" + (L ? "" : "<p><strong>FTP not yet established:</strong> displayed watt values are examples, not individualized targets. Keep the first ride conversational and use guided SIM mode, not ERG.</p>"), c("coachSegments").innerHTML = Xe.segments.map((h, F) => {
      const U = h.low < 0.6 ? "#86b5da" : h.low < 0.8 ? "#63d8bd" : h.low < 1 ? "#f9be70" : "#fb7489", ee = Math.max(24, Math.min(100, Math.round(h.high * 80))), te = un(n.ftp, h), qe = h.name + " — " + te.duration + " duration, " + te.range + " power range, " + te.target + " W ERG target (" + te.ftpRange + ")";
      return '<button type="button" class="coach-segment" data-coach-segment="' + F + '" aria-pressed="false" aria-label="' + R(qe) + '" title="' + R(qe) + '" style="flex:' + h.minutes + '"><span class="coach-segment-bar" aria-hidden="true" style="height:' + ee + "%;background:" + U + '"></span></button>';
    }).join(""), We(0), H.value = A;
    const tn = tt();
    s.getDay();
    const nn = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"], Ze = qt(a, s);
    c("coachGoalHeadlineLabel").textContent = a.discipline === "general" ? "Balanced cycling fitness" : a.name || bt[a.discipline], c("coachGoalHeadlineMeta").textContent = a.discipline === "general" ? "Build consistency and endurance" : (Ze.phase === "event" ? "Event underway" : Ze.phase === "post-event" ? "Event completed" : Ze.weeksLeft === null ? "Set an event date" : Ze.weeksLeft + " weeks to go") + " · " + Ze.phase.toUpperCase() + " PHASE", c("coachHeaderFtp").textContent = L ? "FTP " + n.ftp + " W" : "FTP NOT SET";
    const an = !!ne(Pe);
    c("coachFirstRun").hidden = an, c("coachStartLabel").textContent = an ? "CONNECT MY TRAINER" : "SET UP MY PLAN TO START", c("coachProfileSummary").innerHTML = "<div><strong>" + (L ? n.ftp + " W" : "Not set") + "</strong><span>FTP</span></div><div><strong>" + n.hours + " h</strong><span>Per week</span></div><div><strong>" + n.days + " days</strong><span>Training days</span></div>";
    const on = M.slice(1).flatMap((h) => {
      const F = [];
      return h.rideId && h.rideMinutes > 0 && F.push({ key: h.key, weekday: h.date.getDay(), name: h.rideName || "Cycling ride", type: "ride", id: h.rideId, minutes: h.rideMinutes }), h.strength && h.strengthMinutes > 0 && F.push({ key: h.key, weekday: h.date.getDay(), name: "Full Body Strength " + h.strength, type: "strength", id: h.strength, minutes: h.strengthMinutes }), F;
    }).slice(0, 3);
    c("coachNextUp").innerHTML = on.length ? on.map(
      (h) => '<button type="button" class="coach-upcoming-item" data-workout-color="' + (h.type === "ride" ? pe(h.id) : "strength") + '" data-upcoming-key="' + h.key + '" data-upcoming-type="' + h.type + '" data-upcoming-workout="' + R(h.id) + '"><strong>' + nn[h.weekday] + "</strong><span>" + R(h.name) + "<small>" + h.minutes + " min · " + (h.type === "ride" ? "Ride" : "Strength") + " · " + h.key + '</small></span><span aria-hidden="true">→</span></button>'
    ).join("") : '<p class="coach-small">No more workouts in your next seven days. Rest or review your plan.</p>', c("coachPlanLibrary").innerHTML = r.map((h) => {
      const F = Math.round(Z(h) / 60);
      return '<button type="button" class="coach-library-item" data-library-workout="' + R(h.id) + '"><span><strong>' + R(h.name) + "</strong><small>" + R(h.category) + " · " + F + ' min</small></span><span aria-hidden="true">→</span></button>';
    }).join("");
    const sn = M.map((h) => {
      const F = Ce.days.find((te) => te.key === h.key), U = !!h.rideId && h.rideMinutes > 0, ee = U ? r.find((te) => te.id === h.rideId) : void 0;
      return {
        key: h.key,
        weekday: h.date.getDay(),
        workoutId: U ? h.rideId : null,
        name: (ee == null ? void 0 : ee.name) ?? null,
        minutes: U ? h.rideMinutes : 0,
        strength: h.strength,
        strengthMinutes: h.strengthMinutes,
        status: (F == null ? void 0 : F.status) ?? "rest",
        reason: h.reason,
        changed: (F == null ? void 0 : F.changed) ?? !1,
        missingWorkout: U && !ee
      };
    }), Vn = sn.reduce((h, F) => h + F.minutes + F.strengthMinutes, 0);
    c("coachPlanBudget").textContent = "Next 7 days cycling + strength: " + (Vn / 60).toFixed(1) + " h · Weekly time goal: " + (j.budgetMinutes / 60).toFixed(1) + " h · " + j.note, c("coachWeek").innerHTML = sn.map((h) => {
      const F = h.key < u, U = h.workoutId && h.name && h.minutes > 0 && !F ? '<button type="button" data-day-workout="' + R(h.workoutId) + '" data-workout-color="' + pe(h.workoutId) + '" data-day-key="' + h.key + '"><span><strong>🚴 ' + R(h.name) + "</strong><small>" + h.minutes + " min · " + (h.changed ? "Adjusted · " : "") + 'Classic cycling</small></span><span aria-hidden="true">→</span></button>' : h.missingWorkout ? '<span class="coach-day-warning">Workout missing from library — review your setup</span>' : h.status === "completed" ? '<span class="coach-day-rest">✓ Ride recorded</span>' : h.status === "skipped" ? '<span class="coach-day-rest">Skipped by you · not rescheduled</span>' : h.status === "missed" ? '<span class="coach-day-rest">Not completed · not rescheduled</span>' : h.status === "event" ? '<span class="coach-day-event">🏁 Event day · no indoor session scheduled</span>' : "", ee = h.strength && !F ? '<button type="button" class="coach-day-strength" data-strength-day="' + h.weekday + '" data-strength-variation="' + h.strength + '"><span><strong>▥ Full Body Strength ' + h.strength + "</strong><small>" + h.strengthMinutes + " min" + (h.key === u ? "" : " · Start today (optional)") + " · " + R(((D == null ? void 0 : D.settings.equipment) || []).filter((te) => te !== "bodyweight").join(", ") || "Bodyweight") + '</small></span><span aria-hidden="true">→</span></button>' : h.strength ? '<span class="coach-day-rest">Strength was scheduled</span>' : "";
      return '<div class="coach-day-row ' + (h.key === u ? "coach-week-today" : "") + '"><span class="coach-day-label">' + nn[h.weekday] + "<small>" + R(h.key.slice(5)) + '</small></span><div class="coach-day-items">' + (U + ee || '<span class="coach-day-rest">Rest day</span>') + (h.changed ? '<small class="coach-adaptive-inline">' + R(h.reason) + "</small>" : "") + "</div></div>";
    }).join("");
    const $e = c("coachStrengthToday"), rn = c("coachViewToday").querySelector(".coach-today-grid"), cn = c("coachViewToday").querySelector(".coach-today-side");
    if (Re ? rn.insertBefore($e, rn.firstElementChild) : cn.insertBefore($e, cn.firstElementChild), $e.classList.toggle("coach-strength-primary", Re), $e.hidden = !Mt, Mt) {
      const h = Bt(D.settings, K.strength, Qt);
      $e.innerHTML = '<div class="coach-section-top"><span class="coach-tag">TODAY · STRENGTH</span><span class="coach-tag">' + (It ? "COMPLETED" : "NO TRAINER NEEDED") + "</span></div><h3>" + R(h.title) + "</h3><p>" + K.strengthMinutes + " minutes · " + h.exercises.length + " movements · Matched to your available equipment." + (Qt ? " Recent fatigue suggests going easy or skipping." : "") + '</p><button type="button" id="coachStartStrength" ' + (It ? "disabled" : "") + ">" + (It ? "✓ SESSION LOGGED" : "START STRENGTH WORKOUT →") + "</button>";
    }
    c("coachStrengthHistory").innerHTML = D != null && D.history.length ? '<div class="coach-strength-history">' + D.history.slice(-6).reverse().map((h) => "<div><span><strong>" + R(h.routine) + "</strong><br>" + new Date(h.date).toLocaleDateString() + "</span><small>" + h.completedSets + "/" + h.plannedSets + " sets · " + h.minutes + " min</small></div>").join("") + "</div>" : '<p class="coach-small">Completed strength training sessions will appear here.</p>', c("coachHistory").innerHTML = tn.length ? tn.slice(-5).reverse().map((h) => '<div class="coach-history-row"><strong>' + R(h.workout) + "</strong><span>" + new Date(h.date).toLocaleDateString() + " · " + Math.round(h.elapsedSeconds / 60) + " min · " + R(h.mode.toUpperCase()) + "</span></div>").join("") : '<p class="coach-small">Your coached rides will appear here.</p>', c("coachSuggestion").textContent = Re ? "Your strength workout is ready. No smart trainer needed." : D != null && D.settings.enabled ? "Your next workout is ready. Cycling and strength fit within your weekly time." : "Your next workout is ready. Coach considers your schedule and recent riding.", c("coachSwapList").innerHTML = r.filter((h) => h.id !== "preview").map((h) => '<button type="button" data-swap-workout="' + R(h.id) + '"><span><strong>' + R(h.name) + "</strong><small>" + R(h.category) + " · " + Math.round(Z(h) / 60) + ' min</small></span><span aria-hidden="true">→</span></button>').join("");
  }
  function ct(s, u) {
    const g = r.find((w) => w.id === s);
    if (!g) return;
    const p = Ia(b, Te(/* @__PURE__ */ new Date()), {
      cyclingId: s,
      cyclingMinutes: Math.round(Z(g) / 60)
    });
    if (p === b || !ue(gt, p)) {
      c("coachStatus").textContent = "Could not save your replacement workout. Check browser storage.";
      return;
    }
    b = p, o = s, d = !1, i = null, y = null, c("coachSwapPanel").hidden = !0, c("coachSwapToggle").setAttribute("aria-expanded", "false"), $(), c("coachAnswer").textContent = u, c("coachStatus").textContent = "Saved for today. Coach rechecked upcoming recovery; review What Changed in Your Week for any adjustments.";
  }
  c("coachSkipToday").addEventListener("click", () => {
    const s = Te(/* @__PURE__ */ new Date()), u = new Set(N());
    if (u.has(s) ? u.delete(s) : u.add(s), !ue(C, Array.from(u).slice(-90))) {
      c("coachStatus").textContent = "Could not save the skipped session. Check browser storage.";
      return;
    }
    d = !1, i = null, y = null, $();
  }), c("coachSwapToggle").addEventListener("click", () => {
    const s = c("coachSwapPanel");
    s.hidden = !s.hidden, c("coachSwapToggle").setAttribute("aria-expanded", String(!s.hidden));
  }), c("coachBrowseOptional").addEventListener("click", () => {
    c("coachSwapPanel").hidden = !1, c("coachSwapToggle").setAttribute("aria-expanded", "true");
  }), c("coachUseRecommendation").addEventListener("click", () => {
    const s = Te(/* @__PURE__ */ new Date());
    if (Object.prototype.hasOwnProperty.call(b, s)) {
      const u = { ...b };
      if (delete u[s], !ue(gt, u)) {
        c("coachStatus").textContent = "Could not restore the original recommendation. Check browser storage.";
        return;
      }
      b = u;
    }
    d = !1, i = null, y = null, $(), c("coachAnswer").textContent = "Back to your Coach recommendation.";
  }), c("coachSwapList").addEventListener("click", (s) => {
    const u = s.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-swap-workout]");
    g != null && g.dataset.swapWorkout && ct(g.dataset.swapWorkout, "Replacement workout saved for today. Other days are unchanged.");
  }), v.querySelectorAll("[data-coach-question]").forEach((s) => s.addEventListener("click", () => {
    const u = s.dataset.coachQuestion;
    if (u === "tired") ct("recovery", "Easy recovery selected for today. Rest instead if you feel unusually fatigued or unwell.");
    else if (u === "short") {
      const g = Oe(), p = Math.max(15, Math.min(30, Math.floor(Z(g) / 60 * 0.65))), w = Rt(g, p);
      w === g ? c("coachAnswer").textContent = "This workout is already brief. You can swap to Recovery Spin or take a rest day." : (y = w, d = !0, $(), c("coachAnswer").textContent = "Shorter session prepared. Coach kept the power ranges and reduced interval durations.");
    } else {
      const g = _(), p = pn(n, /* @__PURE__ */ new Date(), Ne(), be(), g.days.map((w) => ({ day: w.day, workoutId: w.cyclingId, reason: w.reason })));
      c("coachAnswer").textContent = p.reason + (d ? " You have selected an alternative for today." : "");
    }
  }));
  function Ye(s, u) {
    if (D != null && D.settings.enabled) {
      if (e.isRiding()) {
        alert("Finish your active cycling session before starting strength training.");
        return;
      }
      D.open(s, we(), u);
    }
  }
  c("coachWeek").addEventListener("click", (s) => {
    const u = s.target;
    if (!(u instanceof Element)) return;
    const g = u.closest("[data-strength-variation]");
    if (g) {
      const w = Number(g.dataset.strengthDay), G = _().days[w];
      G != null && G.strength && Ye(G.strength, G.strengthMinutes);
      return;
    }
    const p = u.closest("[data-day-workout]");
    if (p != null && p.dataset.dayWorkout) {
      const w = M.find((x) => x.key === p.dataset.dayKey);
      o = p.dataset.dayWorkout, d = !0, i = (w == null ? void 0 : w.rideMinutes) ?? null, y = null, $(), ie("today");
    }
  }), c("coachStrengthToday").addEventListener("click", (s) => {
    const u = s.target;
    if (!(u instanceof Element) || !u.closest("#coachStartStrength")) return;
    const p = _().days[(/* @__PURE__ */ new Date()).getDay()];
    p != null && p.strength && Ye(p.strength, p.strengthMinutes);
  }), c("coachPlanLibrary").addEventListener("click", (s) => {
    const u = s.target.closest("[data-library-workout]");
    u != null && u.dataset.libraryWorkout && (o = u.dataset.libraryWorkout, d = !0, i = null, y = null, $(), ie("today"));
  }), c("coachNextUp").addEventListener("click", (s) => {
    const u = s.target.closest("[data-upcoming-workout]");
    if (u != null && u.dataset.upcomingWorkout)
      if (u.dataset.upcomingType === "strength")
        ie("plan", !0);
      else {
        const g = M.find((p) => p.key === u.dataset.upcomingKey);
        o = u.dataset.upcomingWorkout, d = !0, i = (g == null ? void 0 : g.rideMinutes) ?? null, y = null, $(), ie("today");
      }
  }), H.addEventListener("change", () => {
    A = H.value, !L && A === "structured" && (A = "guided", H.value = "guided", c("coachStatus").textContent = "Set a reliable FTP in My Setup before selecting automatic ERG. Ride by feel is available now.");
  }), c("coachFtpKnown").addEventListener("change", () => {
    const s = c("coachFtpKnown").value === "yes";
    c("coachFtp").disabled = !s, c("coachFtpHelp").textContent = s ? "Enter the FTP from your latest reliable assessment." : "No FTP required for your first demo. Indoor rides will default to guided SIM, not automatic ERG watt targets.";
  });
  function Le(s, u, g) {
    const p = c(s);
    if (!p.value.trim()) return null;
    const w = Number(p.value);
    if (!Number.isInteger(w) || w < u || w > g) throw Error(s + " must be a whole number from " + u + " to " + g + ".");
    return w;
  }
  c("coachSaveCheckin").addEventListener("click", () => {
    try {
      const s = /* @__PURE__ */ new Date(), u = Te(s), g = {
        date: u,
        feeling: c("coachFeeling").value,
        bodyBattery: Le("coachBattery", 0, 100),
        sleepScore: Le("coachSleep", 0, 100),
        hrvMs: Le("coachHrv", 1, 300)
      }, p = Ot(g, u);
      if (!p || !ue(xt, p)) throw Error("Could not save check-in. Verify browser storage.");
      c("coachCheckinFeedback").textContent = "Saved for today. Your recommendation has been refreshed.", $();
    } catch (s) {
      c("coachCheckinFeedback").textContent = s instanceof Error ? s.message : "Invalid check-in.";
    }
  }), c("coachEventDiscipline").addEventListener("change", Ke), c("coachEventDate").addEventListener("change", Ke), c("coachSaveProfile").addEventListener("click", () => {
    const s = Pt({ discipline: c("coachEventDiscipline").value, name: c("coachEventName").value, date: c("coachEventDate").value, priority: c("coachEventPriority").value, objective: c("coachEventObjective").value, terrain: c("coachEventTerrain").value, distanceKm: c("coachEventDistance").value ? Number(c("coachEventDistance").value) * 1.609344 : "", durationMinutes: c("coachEventDuration").value, elevationM: c("coachEventElevation").value ? Number(c("coachEventElevation").value) * 0.3048 : "", stages: c("coachEventStages").value });
    if (c("coachEventDate").value && !s.date) {
      c("coachSettingsFeedback").textContent = "Please enter a valid event date.";
      return;
    }
    const u = [["coachEventDistance", "event distance"], ["coachEventElevation", "total climbing"], ["coachEventDuration", "estimated riding time"]];
    s.discipline === "stage-race" && u.push(["coachEventStages", "number of stages"]);
    const g = u.find(([w]) => !c(w).checkValidity());
    if (g) {
      const w = c(g[0]);
      c("coachSettingsFeedback").textContent = "Please check " + g[1] + ": " + (w.validationMessage || "enter a valid value") + ".", w.focus();
      return;
    }
    if (!ue(Rn, s)) {
      c("coachSettingsFeedback").textContent = "Could not save your event goal. Check browser storage.";
      return;
    }
    a = s;
    const p = Fe({
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
    if (n = p, L = c("coachFtpKnown").value === "yes", !ue(Pe, n)) {
      c("coachSettingsFeedback").textContent = "Strength equipment saved, but cycling settings could not be stored. Enable browser storage and retry.";
      return;
    }
    if (!ue(et, L)) {
      c("coachSettingsFeedback").textContent = "Could not save FTP status. Check browser storage.";
      return;
    }
    L || (A = "guided"), H.value = A, d = !1, i = null, y = null, xe(), $(), c("coachSettingsFeedback").textContent = "✓ Saved! Your cycling, strength, and weekly plan are updated.", ie("today", !0), c("coachAnswer").textContent = "Your plan is saved. Coach has prepared today’s recommendation.";
  });
  function St() {
    (k == null ? void 0 : k.control) === "structured" && !V && e.setMode("sim");
  }
  async function Be() {
    const s = c("coachPlatformHistory");
    try {
      Y = await e.getPlatformRides();
      try {
        f = await On();
      } catch {
        f = [];
      }
      const u = Y.filter((w) => Number.isFinite(w.start) && w.start >= Date.now() - 7 * 864e5 && w.start <= Date.now()), g = u.reduce((w, x) => w + Math.max(0, x.elapsed), 0) / 3600, p = ["classic", "survival", "cyclequest"];
      s.innerHTML = '<p class="coach-small">' + Y.length + " locally saved rides · " + g.toFixed(1) + " hours in the last 7 days. All three riding modes contribute to your training history. Only Classic uses prescribed workouts.</p>" + p.map((w) => '<div class="coach-history-row"><strong>' + { classic: "CLASSIC", survival: "SURVIVAL", cyclequest: "CYCLE QUEST" }[w] + "</strong><span>" + u.filter((x) => x.mode === w).length + " rides · " + (u.filter((x) => x.mode === w).reduce((x, G) => x + G.elapsed, 0) / 3600).toFixed(1) + " hours this week</span></div>").join("") + '<p class="coach-small">Older rides without a mode label count toward total hours. A potential hard-game-day alert uses duration and average power, not a clinical recovery assessment.</p>', $();
    } catch (u) {
      s.textContent = "Local ride history could not be loaded: " + String(u instanceof Error ? u.message : u);
    }
  }
  function J() {
    k && k.elapsed > 0 && !V && Xt(k, null), St(), k = null, V = !1, kt(), I.hidden = !0, Q();
  }
  W("coachEnd").addEventListener("click", J), W("coachMinimize").addEventListener("click", () => {
    I.classList.toggle("coach-hud-minimized"), W("coachMinimize").textContent = I.classList.contains("coach-hud-minimized") ? "+" : "−";
  });
  function Vt(s) {
    k && (k.adjusted = Math.round(Math.min(1.25, Math.max(0.7, k.adjusted + s)) * 100) / 100, k.control === "structured" && !V && e.setTarget(He(k.ftp, Je(k.workout, k.elapsed).segment, k.adjusted)), Et());
  }
  W("coachLighter").addEventListener("click", () => Vt(-0.05)), W("coachHarder").addEventListener("click", () => Vt(0.05));
  function Kt(s, u, g, p = !1) {
    if (k || e.isRiding()) {
      c("coachStatus").textContent = "Finish the current ride or coaching session before starting a new one.";
      return;
    }
    const x = Kn().includes(g) ? g : "structured";
    k = { workout: s, mode: u, control: x, ftp: n.ftp, elapsed: 0, adjusted: 1, measured: 0, inRange: 0, sumWatts: 0, countWatts: 0, done: !1, previousIndex: -1 }, he = "", V = p, Q(), I.hidden = !1, I.classList.remove("coach-hud-minimized"), W("coachMinimize").textContent = "−", p || (e.setMode(x === "structured" ? "target" : "sim"), x === "structured" && e.setTarget(He(n.ftp, s.segments[0])), e.makeRoute(Z(s), x === "structured"), e.launchMode("classic")), Et();
  }
  c("coachStartClassic").addEventListener("click", () => {
    if (!ne(Pe)) {
      ie("settings", !0);
      return;
    }
    !L && A === "structured" && (A = "guided", H.value = "guided", c("coachStatus").textContent = "FTP is not set. Starting guided ride-by-feel instead of automatic watt targets."), Kt(Oe(), "classic", A);
  });
  let lt = null;
  const Se = document.createElement("div");
  Se.id = "coachDemoControls", Se.hidden = !0, Se.innerHTML = '<label>SIMULATED POWER <input id="coachDemoPower" type="range" min="0" max="450" step="5" value="130"></label><span id="coachDemoWatts">130 W</span><button type="button" id="coachDemoStop">STOP DEMO</button>', I.append(Se), lt = Se.querySelector("#coachDemoPower"), lt.addEventListener("input", () => {
    O = Number(lt.value), nt(Se, "coachDemoWatts").textContent = O + " W";
  }), nt(Se, "coachDemoStop").addEventListener("click", () => {
    J(), Ae();
  });
  function _t() {
    const s = Ct(n).find((g) => g.id === "preview");
    O = 130, lt.value = "130", Kt(s, "classic", A, !0), kt(), Se.hidden = !1;
    let u = performance.now();
    fe = window.setInterval(() => {
      const g = performance.now(), p = Math.min(1.5, (g - u) / 1e3);
      u = g, zt(p, O, 85, !0);
    }, 250);
  }
  c("coachDemo").addEventListener("click", _t), c("coachFirstRunDemo").addEventListener("click", _t);
  function kt() {
    fe !== null && window.clearInterval(fe), fe = null, Se.hidden = !0;
  }
  function Et(s = null) {
    if (!k) return;
    const u = k.workout, g = Je(u, k.elapsed), p = g.done || k.done, w = He(k.ftp, g.segment, k.adjusted);
    W("coachHudState").textContent = V ? "SIMULATED DEMO" : p ? "WORKOUT COMPLETE" : k.elapsed === 0 ? "WAITING FOR PEDALS" : k.control === "structured" ? "ERG CONTROL" : k.control === "guided" ? "GUIDED SIM" : "RECORD ONLY", W("coachActual").innerHTML = (s === null ? "—" : String(Math.round(s))) + "<span> W</span>", W("coachTarget").innerHTML = String(w) + "<span> W</span>", W("coachRemaining").textContent = p ? "DONE" : vt(g.remaining), W("coachInterval").textContent = g.segment.name.toUpperCase() + " · " + Math.round(g.segment.low * 100) + "–" + Math.round(g.segment.high * 100) + "% FTP", W("coachSessionClock").textContent = vt(k.elapsed) + " / " + vt(Z(u)), W("coachProgressBar").style.width = Math.round(k.elapsed / Z(u) * 100) + "%";
    let x = "Connect a trainer, then start pedaling.";
    V ? x = "SIMULATED telemetry only — no physical trainer or ride record." : p ? x = "Workout complete! Finish your ride when ready." : k.elapsed > 0 && s !== null && (x = hn(s, k.ftp, g.segment, k.adjusted) ? "On target. Smooth and controlled." : s < k.ftp * g.segment.low * k.adjusted ? "Below target. Build effort gradually." : "Above target. Ease back to your prescribed effort."), W("coachPrompt").textContent = x;
  }
  function zt(s, u, g, p) {
    if (!k || k.done || !Number.isFinite(s) || s <= 0 || !p && !V || !V && (!Number.isFinite(g) || g < 10)) return;
    const w = Je(k.workout, k.elapsed);
    k.previousIndex !== w.index && (k.previousIndex = w.index, k.control === "structured" && !V && e.setTarget(He(k.ftp, w.segment, k.adjusted)));
    const x = Math.min(3, s, Z(k.workout) - k.elapsed);
    if (x <= 0) return;
    Number.isFinite(u) && u >= 0 && (k.sumWatts += u * x, k.countWatts += x, k.measured += x, hn(u, k.ftp, w.segment, k.adjusted) && (k.inRange += x)), k.elapsed += x;
    const G = Je(k.workout, k.elapsed);
    G.index !== w.index && k.control === "structured" && !V && e.setTarget(He(k.ftp, G.segment, k.adjusted)), k.elapsed >= Z(k.workout) && (k.done = !0, k.control === "structured" && !V && e.setTarget(Math.max(30, Math.round(k.ftp * 0.45))), V && kt()), (performance.now() - me > 250 || k.done) && (me = performance.now(), Et(u));
  }
  function Xt(s, u) {
    const g = tt(), p = {
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
      rpe: u,
      complete: s.done
    };
    return g.push(p), ue(Ht, g.slice(-150)), p;
  }
  function qn() {
    if (!k || V) return null;
    const s = k;
    if (St(), k = null, I.hidden = !0, s.elapsed < 5) return null;
    he = Xt(s, null).id;
    const g = document.createElement("section");
    g.className = "coach-finish-review";
    const p = s.measured ? Math.round(s.inRange / s.measured * 100) : null;
    return g.innerHTML = "<h2>BREAKAWAY COACH / SESSION REVIEW</h2><p><strong>" + R(s.workout.name) + "</strong> · " + Math.round(s.elapsed / 60) + " minutes of " + Math.round(Z(s.workout) / 60) + " planned</p><p>" + (p === null ? "No coached power adherence available." : "Time in prescribed power range: " + p + "% of measured time.") + '</p><p>How hard did the workout feel? Rate your overall effort.</p><div class="coach-rpe-buttons"><button type="button" data-coach-rpe="2">Easy</button><button type="button" data-coach-rpe="5">Moderate</button><button type="button" data-coach-rpe="8">Hard</button><button type="button" data-coach-rpe="10">Maximal</button></div><p id="coachReviewMessage">Feedback stays in this browser and informs your next suggested week.</p>', g.querySelectorAll("[data-coach-rpe]").forEach((w) => w.addEventListener("click", () => {
      const x = Number(w.dataset.coachRpe), G = tt(), de = G.slice().reverse().find((X) => X.id === he);
      if (!de) return;
      de.rpe = x, ue(Ht, G);
      const j = nt(g, "coachReviewMessage");
      j.textContent = _n(x), g.querySelectorAll("[data-coach-rpe]").forEach((X) => X.setAttribute("aria-pressed", String(X === w)));
    })), g;
  }
  function Un() {
    if (!k) return null;
    const s = Je(k.workout, k.elapsed);
    return { name: k.workout.name, mode: k.mode, control: k.control, remaining: vt(s.remaining), target: He(k.ftp, s.segment, k.adjusted), done: k.done };
  }
  return window.addEventListener("breakaway:history-updated", () => {
    Be();
  }), D = Ea(c("coachStrengthSettings"), { finished: () => {
    $(), ie("history");
  } }), xa(c("coachImportRoot")), xe(), $(), ba(c("coachHistoryImport"), { applySuggestion: (s) => {
    n = Fe({ ...n, ...s }), ue(Pe, n), xe(), $();
  } }), { tick: zt, finish: qn, endCoaching: J, snapshot: Un, get mode() {
    return (k == null ? void 0 : k.mode) || null;
  }, get active() {
    return !!k;
  } };
}
export {
  Wa as mountCoach
};
