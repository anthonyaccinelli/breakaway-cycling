const Te = "breakaway.coach.profile.v1", kt = "breakaway.coach.history.v1", Ve = { ftp: 200, hours: 5, days: 3, restDay: 6, goal: "fitness", experience: "beginner" };
function Ie(e) {
  const t = e && typeof e == "object" ? e : {}, a = (s, l, o, d) => typeof s == "number" && Number.isFinite(s) ? Math.min(o, Math.max(l, s)) : d;
  return {
    ftp: Math.round(a(t.ftp, 75, 550, Ve.ftp)),
    hours: a(t.hours, 1, 20, Ve.hours),
    days: Math.round(a(t.days, 2, 6, Ve.days)),
    restDay: Math.round(a(t.restDay, 0, 6, Ve.restDay)),
    goal: ["fitness", "ftp", "endurance", "race"].includes(String(t.goal)) ? t.goal : "fitness",
    experience: ["beginner", "intermediate", "advanced"].includes(String(t.experience)) ? t.experience : "beginner"
  };
}
const H = (e, t, a, s) => ({ name: e, minutes: t, low: a, high: s });
function mt(e) {
  const t = Ie(e), a = t.experience === "beginner", s = Math.max(20, Math.min(a ? 45 : t.experience === "intermediate" ? 75 : 110, Math.round(t.hours * 60 / t.days) - 15));
  return [
    {
      id: "recovery",
      name: "Recovery Spin",
      description: "Easy spinning and relaxed cadence.",
      category: "Recovery",
      segments: [H("Ease in", 5, 0.4, 0.5), H("Easy spin", a ? 15 : 25, 0.45, 0.58), H("Cool down", 5, 0.35, 0.45)]
    },
    {
      id: "endurance",
      name: "Aerobic Builder",
      description: "Build endurance with an achievable steady effort.",
      category: "Endurance",
      segments: [H("Warm up", 8, 0.45, 0.6), H("Zone 2 cruise", s, 0.56, 0.75), H("Cool down", 7, 0.4, 0.5)]
    },
    {
      id: "tempo",
      name: "Tempo Builder",
      description: "Practice sustained, controlled work with recovery.",
      category: "Tempo",
      segments: [H("Warm up", 10, 0.45, 0.65), H("Tempo 1", a ? 5 : 10, 0.76, 0.87), H("Recovery", 4, 0.45, 0.6), H("Tempo 2", a ? 5 : 10, 0.76, 0.87), H("Cool down", 6, 0.4, 0.5)]
    },
    {
      id: "sweetspot",
      name: "Sweet Spot Builder",
      description: "Develop sustainable power without maximal efforts.",
      category: "Threshold",
      segments: [H("Warm up", 10, 0.45, 0.7), H("Sweet Spot 1", 8, 0.88, 0.94), H("Recovery", 5, 0.45, 0.58), H("Sweet Spot 2", 8, 0.88, 0.94), H("Cool down", 8, 0.4, 0.55)]
    },
    {
      id: "vo2",
      name: "VO2 Intervals",
      description: "Short hard efforts separated by easy recovery.",
      category: "High intensity",
      segments: [H("Warm up", 10, 0.45, 0.7), H("Work 1", 3, 1.05, 1.15), H("Recovery 1", 4, 0.43, 0.55), H("Work 2", 3, 1.05, 1.15), H("Recovery 2", 4, 0.43, 0.55), H("Work 3", 3, 1.05, 1.15), H("Cool down", 8, 0.4, 0.5)]
    },
    {
      id: "preview",
      name: "Coach Test Ride",
      description: "A short session to try live coaching and trainer control.",
      category: "Test",
      segments: [H("Warm up", 2, 0.45, 0.55), H("Steady", 2, 0.65, 0.75), H("Recovery", 1, 0.4, 0.5), H("Tempo", 2, 0.77, 0.85), H("Cool down", 1, 0.4, 0.5)]
    }
  ];
}
function V(e) {
  return Math.round(e.segments.reduce((t, a) => t + a.minutes * 60, 0));
}
function Be(e, t) {
  const a = V(e), s = Math.max(0, Math.min(a, t));
  let l = 0;
  for (let o = 0; o < e.segments.length; o++) {
    const d = e.segments[o], i = l + d.minutes * 60;
    if (s < i || o === e.segments.length - 1)
      return { segment: d, index: o, remaining: Math.max(0, i - s), progress: Math.min(1, Math.max(0, (s - l) / (i - l))), total: a, done: t >= a };
    l = i;
  }
  throw Error("The workout must have at least one interval");
}
function Zt(e, t) {
  const a = Math.max(0, Math.round(t.minutes * 60)), s = Math.floor(a / 60) + ":" + String(a % 60).padStart(2, "0"), l = Math.round(e * t.low), o = Math.round(e * t.high), d = Me(e, t);
  return {
    duration: s,
    lowWatts: l,
    highWatts: o,
    target: d,
    range: l + "–" + o + " W",
    ftpRange: Math.round(t.low * 100) + "–" + Math.round(t.high * 100) + "% FTP"
  };
}
function Me(e, t, a = 1) {
  const s = (t.low + t.high) / 2;
  return Math.max(30, Math.min(1e3, Math.round(e * s * a)));
}
function $t(e, t, a, s = 1) {
  return Number.isFinite(e) && e >= t * a.low * s * 0.95 && e <= t * a.high * s * 1.05;
}
function Ma(e) {
  return ["structured", "guided"];
}
function ua(e, t = !1) {
  const a = Ie(e), s = a.days === 2 ? [1, 4] : a.days === 3 ? [1, 3, 6] : a.days === 4 ? [1, 2, 4, 6] : a.days === 5 ? [0, 1, 3, 4, 6] : a.days === 6 ? [0, 1, 2, 3, 4, 6] : [0, 1, 2, 3, 4, 5, 6];
  if (a.days < 7 && s.includes(a.restDay)) {
    const o = Array.from({ length: 7 }, (d, i) => i).filter((d) => d !== a.restDay && !s.includes(d)).sort((d, i) => Math.abs(d - a.restDay) - Math.abs(i - a.restDay))[0];
    o !== void 0 && s.splice(s.indexOf(a.restDay), 1, o), s.sort((d, i) => d - i);
  }
  const l = a.experience === "beginner" ? "tempo" : a.goal === "race" ? "vo2" : "sweetspot";
  return Array.from({ length: 7 }, (o, d) => {
    const i = s.indexOf(d);
    if (i < 0) return { day: d, workoutId: null, reason: "Rest or optional easy movement" };
    const g = t ? i === 0 ? "recovery" : "endurance" : i === 0 ? l : i === s.length - 1 ? "endurance" : i % 3 === 0 ? "tempo" : i % 2 === 0 ? "recovery" : "endurance";
    return { day: d, workoutId: g, reason: t ? "Reduced intensity after a difficult session" : "Planned training session" };
  });
}
function Tt(e, t, a = [], s = []) {
  const l = Ie(e), o = a.some((i) => Number.isFinite(i.start) && i.start <= t && t - i.start <= 36 * 36e5 && Number.isFinite(i.elapsed) && i.elapsed >= 1800 && i.avgPower !== null && Number.isFinite(i.avgPower) && i.avgPower >= l.ftp * 0.8), d = s.some((i) => Number.isFinite(i.date) && i.date <= t && t - i.date <= 48 * 36e5 && i.rpe !== null && i.rpe >= 9);
  return { demandingRide: o, veryHardFeedback: d, fatigued: o || d };
}
function Jt(e, t, a = [], s = [], l) {
  const o = Ie(e), d = t.getTime(), i = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(), g = (l == null ? void 0 : l.find((c) => c.day === t.getDay())) ?? ua(o, !1)[t.getDay()], p = a.filter((c) => Number.isFinite(c.start) && c.start <= d && Number.isFinite(c.elapsed) && c.elapsed > 0 && c.start >= d - 7 * 864e5), f = p.some((c) => c.start >= i && c.elapsed >= 900), { demandingRide: I, veryHardFeedback: R } = Tt(o, d, p, s);
  if (f) return {
    workoutId: null,
    status: "completed",
    reason: "You already recorded a ride today. Coach is not stacking another prescribed session. Rest, or choose an optional workout."
  };
  if (!g.workoutId) return {
    workoutId: null,
    status: "rest",
    reason: "Today is outside your " + o.days + " planned training days. Rest supports consistency. You can still choose an optional workout."
  };
  if (I || R) return {
    workoutId: "recovery",
    status: "recovery",
    reason: I ? "A demanding ride was recorded recently. Coach has replaced the planned workout with an easy recovery spin based on duration and average power." : "Your recent workout feedback indicated very high effort. Coach has selected an easier recovery spin."
  };
  const w = {
    fitness: "regular riding and consistency",
    ftp: "building sustainable power",
    endurance: "aerobic endurance",
    race: "preparing for your cycling event"
  };
  return {
    workoutId: g.workoutId,
    status: "planned",
    reason: l && g.reason ? "Event-based plan: " + g.reason : "Your " + o.days + "-day weekly schedule calls for this session to support " + w[o.goal] + ". The recommendation uses your rider profile and basic scheduling rules."
  };
}
function yt(e, t = 30) {
  const a = e.segments.reduce((f, I) => f + I.minutes, 0), s = Math.max(12, Math.min(t, a));
  if (a <= s) return e;
  const l = e.segments.length;
  if (l >= s) return e;
  const o = s - l, d = e.segments.map((f) => Math.max(0, f.minutes - 1)), i = d.reduce((f, I) => f + I, 0), g = e.segments.map((f, I) => ({
    ...f,
    minutes: Math.max(1, Math.floor((1 + (i ? d[I] / i * o : 0)) * 2) / 2)
  }));
  let p = g.reduce((f, I) => f + I.minutes, 0);
  for (let f = 0; p + 0.5 <= s; f = (f + 1) % g.length)
    g[f].minutes += 0.5, p += 0.5;
  return {
    ...e,
    id: e.id + "-short",
    name: e.name + " · Short",
    segments: g,
    description: "Shortened version: " + e.description
  };
}
function Ia(e) {
  return e === null ? "Rate how the session felt so future recommendations have more context." : e >= 9 ? "That felt very hard. Consider recovery or rest next; do not stack another demanding workout." : e >= 7 ? "Challenging session completed. Check your fatigue before the next hard effort." : e <= 3 ? "Comfortable effort. Keep building consistency rather than chasing extra intensity." : "Good training. Keep the next session aligned with your weekly plan.";
}
const Oe = (e) => typeof e == "number" && Number.isFinite(e), ze = (e) => {
  if (e == null || e === "") return null;
  const t = Number(e);
  return Oe(t) ? t : null;
}, J = (e, t = 1e8) => {
  const a = ze(e);
  return a !== null && a >= 0 && a <= t ? a : null;
}, ue = (e, t = 1e8) => {
  const a = ze(e);
  return a !== null && a > 0 && a <= t ? a : null;
}, rt = (e) => {
  if (e instanceof Date) return Number.isFinite(e.getTime()) ? e.getTime() : null;
  if (typeof e == "number") return Number.isFinite(e) && e > 1e11 ? e : null;
  if (typeof e != "string" || !e.trim()) return null;
  const t = Date.parse(e);
  return Number.isFinite(t) ? t : null;
};
function Qt(...e) {
  for (const t of e) {
    const a = ze(t);
    if (a !== null) return a;
  }
  return null;
}
function At(e) {
  const t = String(e ?? "").trim().toLowerCase().replace(/[\s_-]/g, "");
  return ["ride", "cycling", "biking", "2", "virtualride", "virtualcycling", "ebikeride", "mountainbikeride", "gravelride", "handcycle", "velomobile", "e-mountainbikeride", "emtbride"].includes(t);
}
function Ca(e) {
  return typeof e == "string" && e.trim() ? e.trim().slice(0, 120) : "Cycling activity";
}
function Ra(e) {
  const t = ue(e.duration, 604800), a = rt(e.start);
  if (a === null || a < 9466848e5 || a > Date.now() + 864e5 || t === null || t < 60) throw Error("Invalid ride date or duration.");
  if (!["FIT", "TCX", "GPX", "CSV"].includes(e.source)) throw Error("Unknown recording format.");
  const s = J(e.avgPower, 2500), l = J(e.avgHeartRate, 240), o = J(e.avgCadence, 250), d = J(e.best20minWatts, 2e3), i = J(e.distanceMeters, 1e7), g = J(e.elevationMeters, 1e5), p = ue(e.movingSeconds, 7 * 86400);
  return {
    key: e.stravaId ? "strava:" + e.stravaId : "ride:" + Math.round(a / 1e3) + ":" + Math.round(t),
    stravaId: e.stravaId ? String(e.stravaId).slice(0, 30) : null,
    name: Ca(e.name),
    start: a,
    duration: Math.round(t),
    movingSeconds: p === null ? null : Math.round(Math.min(t, p)),
    distanceMeters: i,
    elevationMeters: g,
    avgPower: s,
    avgHeartRate: l,
    avgCadence: o,
    best20minWatts: d,
    source: e.source,
    indoor: !!e.indoor
  };
}
function Dt(e, t) {
  return Ra({
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
function De(e, ...t) {
  for (const a of t) {
    const s = rt(e[a]);
    if (s !== null) return s;
  }
  return null;
}
function ha(e) {
  let t = [], a = 0, s = 0, l = 0, o = 0;
  for (let d = 1; d < e.length; d++) {
    const i = e[d - 1], g = e[d], p = (g.t - i.t) / 1e3;
    if (!(!Oe(p) || p <= 0)) {
      if (p > 10) {
        t = [], a = 0, s = 0, l = 0;
        continue;
      }
      if (!(!Oe(i.power) || i.power < 0 || i.power > 2e3)) {
        for (t.push({ duration: p, power: i.power }), s += p, l += p * i.power; s > 1200 && a < t.length; ) {
          const f = t[a], I = s - 1200;
          f.duration <= I + 1e-8 ? (s -= f.duration, l -= f.duration * f.power, a++) : (f.duration -= I, s -= I, l -= I * f.power);
        }
        a > 200 && (t = t.slice(a), a = 0), s >= 1199.9 && (o = Math.max(o, l / s));
      }
    }
  }
  return o > 0 ? Math.round(o) : null;
}
function Aa(e, t = "Activity.fit", a, s = null) {
  var F;
  const l = e.sessions || e.sessionMesgs || (e.session ? [e.session] : []), o = Array.isArray(l) ? l[0] : null;
  if (!o) throw Error("FIT activity has no session.");
  const d = o.sport ?? e.sport ?? ((F = e.file_id) == null ? void 0 : F.sport);
  if (!At(d)) throw Error("Not a cycling activity.");
  const i = e.records || e.recordMesgs || [], g = Array.isArray(i) ? i : [];
  if (g.length > 16e4) throw Error("FIT activity has too many samples.");
  const p = De(o, "start_time", "startTime") ?? De(e, "start_time", "startTime") ?? (g.length ? De(g[0], "timestamp") : null), f = De(o, "timestamp") ?? (g.length ? De(g[g.length - 1], "timestamp") : null), I = Qt(o.total_elapsed_time, o.totalElapsedTime, o.total_timer_time, o.totalTimerTime), R = I && I > 0 ? I : p !== null && f !== null ? (f - p) / 1e3 : 0, w = g.map((Y) => ({ t: De(Y, "timestamp") ?? NaN, power: Qt(Y.power, Y.watts) ?? NaN })).filter((Y) => Oe(Y.t));
  let c = 0, M = 0, E = 0, A = 0, C = 0, k = 0;
  for (const Y of g) {
    const B = J(Y.power ?? Y.watts, 2500);
    B !== null && (c += B, M++);
    const ae = ue(Y.heart_rate ?? Y.heartRate, 240);
    ae !== null && (E += ae, A++);
    const re = ue(Y.cadence, 250);
    re !== null && (C += re, k++);
  }
  const v = String(o.sub_sport ?? o.subSport ?? "").toLowerCase();
  return Dt("FIT", {
    name: a || t,
    start: p ?? 0,
    duration: R,
    stravaId: s,
    indoor: /indoor|virtual|trainer/.test(v),
    movingSeconds: ue(o.total_timer_time ?? o.totalTimerTime, 7 * 86400),
    distanceMeters: J(o.total_distance ?? o.totalDistance, 1e7),
    elevationMeters: J(o.total_ascent ?? o.totalAscent, 1e5),
    avgPower: J(o.avg_power ?? o.avgPower, 2500) ?? (M ? c / M : null),
    avgHeartRate: ue(o.avg_heart_rate ?? o.avgHeartRate, 240) ?? (A ? E / A : null),
    avgCadence: ue(o.avg_cadence ?? o.avgCadence, 250) ?? (k ? C / k : null),
    best20minWatts: ha(w)
  });
}
const tt = (e, t) => Array.from(e.getElementsByTagNameNS("*", t));
function we(e, ...t) {
  var a;
  for (const s of t) {
    const l = e.getElementsByTagNameNS("*", s)[0];
    if ((a = l == null ? void 0 : l.textContent) != null && a.trim()) return l.textContent.trim();
  }
  return null;
}
function Da(e, ...t) {
  const a = we(e, ...t);
  return a ? rt(a) : null;
}
const ea = (e) => e === null ? null : ze(e);
function xa(e, t) {
  if (e.lat === null || e.lon === null || t.lat === null || t.lon === null) return 0;
  const a = Math.PI / 180, s = (t.lat - e.lat) * a, l = (t.lon - e.lon) * a, o = Math.sin(s / 2) ** 2 + Math.cos(e.lat * a) * Math.cos(t.lat * a) * Math.sin(l / 2) ** 2;
  return 12742e3 * Math.asin(Math.min(1, Math.sqrt(o)));
}
function Na(e, t = "Activity.gpx", a, s = null) {
  var C;
  if (/<!DOCTYPE|<!ENTITY/i.test(e)) throw Error("XML DTD or entity declarations are not supported.");
  const l = new DOMParser().parseFromString(e, "application/xml");
  if (!l.documentElement || tt(l.documentElement, "parsererror").length) throw Error("Invalid activity XML.");
  const o = /\.tcx$/i.test(t), d = tt(l.documentElement, o ? "Trackpoint" : "trkpt");
  if (d.length < 2 || d.length > 16e4) throw Error("Activity needs timestamped ride samples.");
  if (o) {
    const k = tt(l.documentElement, "Activity");
    if (k.length !== 1 || !At(k[0].getAttribute("Sport"))) throw Error("Not a single cycling TCX activity.");
  }
  const i = [];
  for (const k of d) {
    const v = Da(k, o ? "Time" : "time");
    if (v === null) continue;
    const F = o ? tt(k, "Position")[0] : null;
    i.push({
      t: v,
      hr: ue(we(k, "HeartRateBpm", "Value", "hr"), 240),
      power: J(we(k, "Watts", "watts", "PowerInWatts", "power"), 2500) ?? NaN,
      cad: ue(we(k, "Cadence", "cad", "RunCadence"), 250),
      ele: ze(we(k, "AltitudeMeters", "ele")),
      distance: J(we(k, "DistanceMeters", "distance"), 1e7),
      lat: ea(o ? F ? we(F, "LatitudeDegrees") : null : k.getAttribute("lat")),
      lon: ea(o ? F ? we(F, "LongitudeDegrees") : null : k.getAttribute("lon"))
    });
  }
  if (i.length < 2) throw Error("No timestamped GPS/trackpoint data.");
  i.sort((k, v) => k.t - v.t);
  let g = 0, p = 0;
  for (let k = 1; k < i.length; k++) {
    const v = i[k - 1], F = i[k], Y = F.distance !== null && v.distance !== null && F.distance >= v.distance ? F.distance - v.distance : xa(v, F);
    Y >= 0 && Y < 5e3 && (g += Y), v.ele !== null && F.ele !== null && F.ele > v.ele && F.ele - v.ele < 200 && (p += F.ele - v.ele);
  }
  const f = (i[i.length - 1].t - i[0].t) / 1e3;
  let I = 0, R = 0, w = 0, c = 0, M = 0, E = 0;
  for (const k of i)
    Oe(k.power) && (I += k.power, R++), k.hr !== null && (w += k.hr, c++), k.cad !== null && (M += k.cad, E++);
  const A = we(l.documentElement, "name");
  return Dt(o ? "TCX" : "GPX", {
    name: a || A || t,
    start: i[0].t,
    duration: f,
    stravaId: s,
    distanceMeters: g || ((C = i.at(-1)) == null ? void 0 : C.distance) || null,
    elevationMeters: p || null,
    movingSeconds: null,
    avgPower: R ? I / R : null,
    avgHeartRate: c ? w / c : null,
    avgCadence: E ? M / E : null,
    best20minWatts: ha(i.filter((k) => Oe(k.power)).map((k) => ({ t: k.t, power: k.power })))
  });
}
function Oa(e, t = 1e5) {
  var d;
  if (e.length > 32 * 1024 * 1024) throw Error("CSV index is too large.");
  const a = [];
  let s = [], l = "", o = !1;
  for (let i = 0; i < e.length; i++) {
    const g = e[i];
    if (g === '"')
      o && e[i + 1] === '"' ? (l += '"', i++) : o = !o;
    else if (g === "," && !o)
      s.push(l), l = "";
    else if ((g === `
` || g === "\r") && !o) {
      if (g === "\r" && e[i + 1] === `
` && i++, s.push(l), l = "", s.some((p) => p.trim()) && a.push(s), s = [], a.length > t) throw Error("Too many activities in CSV.");
    } else l += g;
  }
  if (o) throw Error("Unclosed quoted field in CSV.");
  return s.push(l), s.some((i) => i.trim()) && a.push(s), (d = a[0]) != null && d[0] && (a[0][0] = a[0][0].replace(/^\uFEFF/, "")), a;
}
function La(e) {
  const t = Oa(e), a = (t.shift() || []).map((o) => o.toLowerCase().replace(/\s/g, "").replace(/[^a-z0-9]/g, "")), s = (o, ...d) => {
    for (const i of d) {
      const g = a.indexOf(i);
      if (g >= 0) return o[g] || "";
    }
    return "";
  }, l = [];
  for (const o of t) {
    if (!At(s(o, "activitytype", "type", "sporttype"))) continue;
    const d = rt(s(o, "activitydate", "startdate", "startdatetime"));
    if (d === null) continue;
    const i = ue(s(o, "elapsedtime", "movingtime"), 7 * 86400);
    if (i !== null)
      try {
        const g = s(o, "activityid") || null, p = s(o, "filename") || null, f = Dt("CSV", {
          name: s(o, "activityname", "name") || "Ride",
          start: d,
          duration: i,
          stravaId: g,
          indoor: /virtual/.test(s(o, "activitytype", "type").toLowerCase()),
          movingSeconds: ue(s(o, "movingtime"), 7 * 86400),
          distanceMeters: J(s(o, "distance"), 1e7),
          elevationMeters: J(s(o, "elevationgain"), 1e5),
          avgPower: J(s(o, "averagewatts", "avgpower"), 2500),
          avgHeartRate: J(s(o, "averageheartrate"), 240),
          avgCadence: J(s(o, "averagecadence"), 250)
        });
        l.push({ ride: f, file: p });
      } catch {
      }
  }
  return l;
}
function Pa(e, t) {
  if (e.stravaId && t.stravaId && e.stravaId === t.stravaId) return !0;
  const a = Math.min(300, Math.max(90, Math.min(e.duration, t.duration) * 0.07));
  return Math.abs(e.start - t.start) > 12e4 || Math.abs(e.duration - t.duration) > a ? !1 : e.distanceMeters !== null && t.distanceMeters !== null ? Math.abs(e.distanceMeters - t.distanceMeters) <= Math.max(500, Math.min(e.distanceMeters, t.distanceMeters) * 0.08) : !0;
}
const ta = (e) => ({ FIT: 4, TCX: 3, GPX: 2, CSV: 1 })[e];
function Ha(e, t) {
  const a = (d) => [d.avgPower, d.best20minWatts, d.avgHeartRate, d.avgCadence, d.distanceMeters, d.elevationMeters].filter((i) => i !== null).length, s = a(t) > a(e) || a(t) === a(e) && ta(t.source) > ta(e.source), l = s ? t : e, o = s ? e : t;
  return {
    ...l,
    key: e.key,
    stravaId: e.stravaId ?? t.stravaId,
    name: e.source === "CSV" && e.name !== "Ride" ? e.name : l.name,
    avgPower: l.avgPower ?? o.avgPower,
    avgHeartRate: l.avgHeartRate ?? o.avgHeartRate,
    avgCadence: l.avgCadence ?? o.avgCadence,
    best20minWatts: l.best20minWatts ?? o.best20minWatts,
    distanceMeters: l.distanceMeters ?? o.distanceMeters,
    elevationMeters: l.elevationMeters ?? o.elevationMeters,
    movingSeconds: l.movingSeconds ?? o.movingSeconds
  };
}
function pa(e, t) {
  const a = [...e];
  let s = 0, l = 0, o = 0;
  for (const d of t) {
    const i = a.findIndex((g) => Pa(g, d));
    if (i >= 0) {
      o++;
      const g = Ha(a[i], d);
      JSON.stringify(g) !== JSON.stringify(a[i]) && (a[i] = g, l++);
    } else
      a.push(d), s++;
  }
  return a.sort((d, i) => i.start - d.start), { rides: a, added: s, updated: l, duplicates: o };
}
function Fa(e, t = Date.now()) {
  var d;
  const a = Array.from({ length: 8 }, (i, g) => {
    const p = new Date(t);
    return p.setHours(0, 0, 0, 0), p.setDate(p.getDate() - p.getDay() - (7 - g) * 7), { start: p.getTime(), hours: 0, rides: 0 };
  });
  for (const i of e) for (const g of a) if (i.start >= g.start && i.start < g.start + 6048e5) {
    g.hours += i.duration / 3600, g.rides++;
    break;
  }
  const s = a.reduce((i, g) => i + g.hours, 0) / 8, l = e.filter((i) => i.start <= t && i.start > t - 56 * 864e5), o = e.filter((i) => i.start > t - 120 * 864e5 && i.start <= t).reduce((i, g) => g.best20minWatts !== null && (i === null || g.best20minWatts > i) ? g.best20minWatts : i, null);
  return {
    total: e.length,
    recent: l.length,
    weeklyHours: Math.round(s * 10) / 10,
    weeks: a,
    suggestedFtp: o !== null && o > 100 ? Math.round(o * 0.95) : null,
    powerRides: e.filter((i) => i.avgPower !== null).length,
    latest: ((d = e[0]) == null ? void 0 : d.start) ?? null,
    allHours: Math.round(e.reduce((i, g) => i + g.duration / 3600, 0))
  };
}
const Wa = "breakaway.account.owner.v1";
let Ya = "";
function Ba(e) {
  let t = Ya;
  try {
    t || (t = localStorage.getItem(Wa) || "");
  } catch {
  }
  return t ? e + "-" + t : e;
}
const qa = "breakaway-coach-training-history-v1", ke = "rides", Ga = 1, ga = 600 * 1024 * 1024, Ne = 32 * 1024 * 1024, aa = 32 * 1024 * 1024, Mt = 1e4, It = new TextDecoder("utf-8", { fatal: !1 });
function xt() {
  return new Promise((e, t) => {
    if (!("indexedDB" in window)) {
      t(Error("This browser does not support local history storage."));
      return;
    }
    const a = indexedDB.open(Ba(qa), Ga);
    a.onupgradeneeded = () => {
      a.result.objectStoreNames.contains(ke) || a.result.createObjectStore(ke, { keyPath: "key" });
    }, a.onsuccess = () => e(a.result), a.onerror = () => t(a.error || Error("Could not open local history database."));
  });
}
async function ma() {
  const e = await xt();
  try {
    return await new Promise((t, a) => {
      const s = e.transaction(ke, "readonly"), l = s.objectStore(ke).getAll();
      l.onsuccess = () => t(l.result.sort((o, d) => d.start - o.start)), l.onerror = () => a(l.error || Error("Could not read history."));
    });
  } finally {
    e.close();
  }
}
async function Ua(e) {
  if (e.length > 15e3) throw Error("Local activity limit reached. Contact support before importing more rides.");
  const t = await xt();
  try {
    return await new Promise((a, s) => {
      const l = t.transaction(ke, "readwrite"), o = l.objectStore(ke);
      o.clear();
      for (const d of e) o.put(d);
      l.oncomplete = () => a(), l.onerror = () => s(l.error || Error("Could not save imported activities.")), l.onabort = () => s(l.error || Error("Activity import was rolled back."));
    });
  } finally {
    t.close();
  }
}
async function Ka() {
  const e = await xt();
  try {
    return await new Promise((t, a) => {
      const s = e.transaction(ke, "readwrite");
      s.objectStore(ke).clear(), s.oncomplete = () => t(), s.onerror = () => a(s.error || Error("Unable to clear history."));
    });
  } finally {
    e.close();
  }
}
function ge(e, t) {
  if (t < 0 || t + 2 > e.byteLength) throw Error("Truncated ZIP file.");
  return e.getUint16(t, !0);
}
function be(e, t) {
  if (t < 0 || t + 4 > e.byteLength) throw Error("Truncated ZIP file.");
  return e.getUint32(t, !0);
}
function ja(e) {
  if (e.byteLength > ga) throw Error("This archive exceeds the 600 MB preview limit. Import smaller batches of FIT, TCX, or GPX files.");
  const t = new DataView(e.buffer, e.byteOffset, e.byteLength);
  let a = -1;
  for (let g = e.length - 22; g >= Math.max(0, e.length - 22 - 65535); g--)
    if (be(t, g) === 101010256 && g + 22 + ge(t, g + 20) <= e.length) {
      a = g;
      break;
    }
  if (a < 0) throw Error("Not a valid ZIP archive or its directory is missing.");
  const s = ge(t, a + 10), l = be(t, a + 12), o = be(t, a + 16);
  if (s === 65535 || o === 4294967295 || l === 4294967295 || ge(t, a + 4) !== 0) throw Error("Multi-disk or ZIP64 archives are not supported in this preview.");
  if (s > Mt || o + l > e.length) throw Error("ZIP directory exceeds safe limits.");
  const d = [];
  let i = o;
  for (let g = 0; g < s; g++) {
    if (be(t, i) !== 33639248) throw Error("Invalid ZIP directory entry.");
    const p = ge(t, i + 8), f = ge(t, i + 10), I = be(t, i + 16), R = be(t, i + 20), w = be(t, i + 24), c = ge(t, i + 28), M = ge(t, i + 30), E = ge(t, i + 32), A = be(t, i + 42), C = i + 46 + c + M + E;
    if (C > e.length) throw Error("Truncated ZIP entry.");
    const k = It.decode(e.subarray(i + 46, i + 46 + c));
    if (i = C, A === 4294967295) continue;
    if (be(t, A) !== 67324752) throw Error("Invalid ZIP member offset.");
    const v = A + 30 + ge(t, A + 26) + ge(t, A + 28);
    if (v + R > e.length) throw Error("Truncated ZIP member data.");
    d.push({ name: k, compressed: R, expanded: w, method: f, crc: I, start: v, encrypted: !!(p & 1) });
  }
  return d;
}
const Va = (() => {
  const e = new Uint32Array(256);
  for (let t = 0; t < 256; t++) {
    let a = t;
    for (let s = 0; s < 8; s++) a = a & 1 ? 3988292384 ^ a >>> 1 : a >>> 1;
    e[t] = a >>> 0;
  }
  return e;
})();
function _a(e) {
  let t = 4294967295;
  for (const a of e) t = Va[(t ^ a) & 255] ^ t >>> 8;
  return (t ^ 4294967295) >>> 0;
}
async function ya(e, t, a) {
  if (typeof DecompressionStream > "u") throw Error("Compressed archives require a current Chrome or Edge browser.");
  let s;
  try {
    s = new Blob([new Uint8Array(e)]).stream().pipeThrough(new DecompressionStream(t));
  } catch {
    throw Error("This browser cannot expand " + t + " files. Try a recent Chrome or Edge.");
  }
  const l = s.getReader(), o = [];
  let d = 0;
  try {
    for (; ; ) {
      const { value: p, done: f } = await l.read();
      if (f) break;
      if (p) {
        if (d += p.byteLength, d > a)
          throw await l.cancel(), Error("Decompressed activity exceeds the safe file size limit.");
        o.push(p);
      }
    }
  } finally {
    l.releaseLock();
  }
  const i = new Uint8Array(d);
  let g = 0;
  for (const p of o)
    i.set(p, g), g += p.length;
  return i;
}
async function na(e, t) {
  if (t.encrypted) throw Error("Encrypted archive entries are unsupported.");
  if (t.expanded > Ne) throw Error("Activity is larger than the 32 MB per-file limit.");
  if (t.method !== 0 && t.method !== 8) throw Error("Unsupported ZIP compression method: " + t.method);
  const a = e.subarray(t.start, t.start + t.compressed), s = t.method === 0 ? new Uint8Array(a) : await ya(a, "deflate-raw", Ne);
  if (s.length !== t.expanded || _a(s) !== t.crc) throw Error("ZIP member failed integrity verification.");
  return s;
}
const oa = (e) => /\.(fit|tcx|gpx)(\.gz)?$/i.test(e), sa = (e) => /(^|\/)activities\.csv$/i.test(e), qe = (e) => e.trim().replace(/\\/g, "/").replace(/^\.?\//, "").toLowerCase(), za = () => new Promise((e) => setTimeout(e, 0));
async function Xa(e, t) {
  return /\.gz$/i.test(e) ? ya(t, "gzip", Ne) : t;
}
async function Za(e, t = () => {
}) {
  if (!e.length) throw Error("Choose an activity archive or individual ride files.");
  if (e.length > Mt) throw Error("Select fewer than 10,000 files at a time.");
  const a = [], s = [];
  let l = 0;
  for (const c of e)
    if (/\.zip$/i.test(c.name)) {
      if (l++, c.size > ga) throw Error("This ZIP archive exceeds the 600 MB preview limit.");
      const M = new Uint8Array(await c.arrayBuffer());
      for (const E of ja(M)) {
        const A = qe(E.name);
        sa(A) && E.expanded <= aa ? s.push({ name: E.name, bytes: () => na(M, E) }) : oa(A) && /(^|\/)activities\//i.test(A) && E.expanded <= Ne && a.push({ name: E.name, bytes: () => na(M, E) });
      }
    } else sa(c.name) && c.size <= aa ? s.push({ name: c.name, bytes: async () => new Uint8Array(await c.arrayBuffer()) }) : oa(c.name) && c.size <= Ne && a.push({ name: c.name, bytes: async () => new Uint8Array(await c.arrayBuffer()) });
  if (!a.length && !s.length) throw Error("No supported cycling recordings or activities.csv were found.");
  if (a.length > Mt) throw Error("There are too many activity files in this archive.");
  const o = [], d = [];
  let i = 0, g = 0, p = 0;
  for (const c of s)
    try {
      o.push(...La(It.decode(await c.bytes())));
    } catch (M) {
      d.push("activities.csv: " + String(M instanceof Error ? M.message : M));
    }
  const f = /* @__PURE__ */ new Map();
  for (const c of o) c.file && (f.set(qe(c.file), c), f.set(qe(c.file).split("/").pop() || "", c));
  const I = [], R = a.length;
  t({ done: p, total: R, current: "Reading activity files", accepted: 0, skipped: i });
  for (const c of a) {
    try {
      const M = await Xa(c.name, await c.bytes());
      if (M.byteLength > Ne) throw Error("Activity exceeds 32 MB.");
      const E = f.get(qe(c.name)) || f.get(qe(c.name).split("/").pop() || ""), A = c.name.replace(/^.*\//, "").replace(/\.(fit|gpx|tcx)(\.gz)?$/i, "");
      let C;
      if (/\.fit(\.gz)?$/i.test(c.name)) {
        const k = "/coach-fit-decoder.js", { decodeFIT: v } = await import(
          /* @vite-ignore */
          k
        );
        C = Aa(await v(M), A, E == null ? void 0 : E.ride.name, (E == null ? void 0 : E.ride.stravaId) ?? null);
      } else C = Na(It.decode(M), A.replace(/\.gz$/i, ""), E == null ? void 0 : E.ride.name, (E == null ? void 0 : E.ride.stravaId) ?? null);
      I.push(C), g++;
    } catch (M) {
      i++, d.length < 15 && d.push(c.name.slice(-80) + ": " + String(M instanceof Error ? M.message : M));
    }
    p++, (p % 5 === 0 || p === R) && (t({ done: p, total: R, current: c.name.slice(-70), accepted: g, skipped: i }), await za());
  }
  return { rides: pa([], I.concat(o.map((c) => c.ride))).rides, read: g, skipped: i, errors: d, csvRides: o.length, archives: l };
}
const $a = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, D = (e) => e.replace(/[&<>"']/g, (t) => $a[t]), ee = (e) => {
  try {
    return JSON.parse(localStorage.getItem(e) || "null");
  } catch {
    return null;
  }
}, me = (e, t) => {
  try {
    return localStorage.setItem(e, JSON.stringify(t)), !0;
  } catch {
    return !1;
  }
}, xe = (e) => [e.getFullYear(), String(e.getMonth() + 1).padStart(2, "0"), String(e.getDate()).padStart(2, "0")].join("-"), Ja = (e) => {
  if (typeof e != "string") return "";
  const t = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(e);
  if (!t) return "";
  const a = Number(t[1]), s = Number(t[2]), l = Number(t[3]), o = new Date(a, s - 1, l);
  return o.getFullYear() !== a || o.getMonth() + 1 !== s || o.getDate() !== l ? "" : [t[1], String(s).padStart(2, "0"), String(l).padStart(2, "0")].join("-");
};
function Qa(e, t) {
  let a = [], s = null, l = !1;
  e.innerHTML = '<div class="coach-section-top"><span class="coach-tag">05 / RIDER HISTORY</span><span class="coach-tag">YOUR FILES · YOUR DEVICE</span></div><h2>BRING YOUR HISTORY.</h2><p class="coach-small">Import your Strava account export or original cycling recordings. No Strava account connection, API, or server upload.</p><div class="coach-history-import-zone" id="coachImportZone" tabindex="0" role="group" aria-label="Choose a Strava archive or ride files"><div class="coach-upload-icon">⇧</div><strong>DROP A STRAVA ZIP OR RIDE FILES HERE</strong><span>ZIP · activities.csv · FIT · TCX · GPX · FIT.GZ · TCX.GZ · GPX.GZ</span><label for="coachImportFiles" class="coach-upload-button">CHOOSE FILES</label><input id="coachImportFiles" type="file" multiple accept=".zip,.csv,.fit,.tcx,.gpx,.gz" hidden></div><div class="coach-import-stage" id="coachImportStage" aria-live="polite"></div><div id="coachHistoryStats"><p class="coach-small">Loading saved activities…</p></div><p class="coach-small coach-history-privacy">The browser reads activity files locally. Only summarized ride metrics are saved in this browser’s IndexedDB; GPS tracks and original files are not retained. Imported history is not uploaded, synced or used by a hosted AI model.</p><div class="coach-history-footer"><button type="button" id="coachHistoryClear">CLEAR IMPORTED HISTORY</button><a href="https://support.strava.com/en-us/articles/15401919-how-do-i-export-my-strava-data" rel="noopener noreferrer" target="_blank">How to export from Strava ↗</a></div>';
  const o = (c) => e.querySelector("#" + c), d = o("coachImportFiles"), i = o("coachImportStage"), g = o("coachImportZone"), p = o("coachHistoryClear");
  function f() {
    var E, A;
    const c = Fa(a), M = c.weeks.map((C, k) => ({ hours: C.hours, week: new Date(C.start).toLocaleDateString(void 0, { month: "short", day: "numeric" }), height: Math.max(2, Math.round(C.hours / Math.max(1, ...c.weeks.map((v) => v.hours)) * 100)), index: k }));
    o("coachHistoryStats").innerHTML = '<div class="coach-history-stats"><div><strong>' + c.total.toLocaleString() + "</strong><span>Historical rides</span></div><div><strong>" + c.weeklyHours.toFixed(1) + " h</strong><span>Avg / week · last 8 weeks</span></div><div><strong>" + c.powerRides.toLocaleString() + '</strong><span>Rides with power</span></div></div><div class="coach-history-bars" role="img" aria-label="Training hours in the last eight calendar weeks">' + M.map((C) => '<div class="coach-history-bar-wrap"><span>' + C.hours.toFixed(1) + 'h</span><div class="coach-history-bar-track"><div style="height:' + C.height + '%"></div></div><small>' + D(C.week) + "</small></div>").join("") + '</div><div class="coach-history-insights"><div><strong>RECENT TRAINING VOLUME</strong><p>' + c.weeklyHours.toFixed(1) + " hours per week on average over the past eight calendar weeks.</p></div><div><strong>POWER HISTORY</strong><p>" + (c.suggestedFtp === null ? "Not enough recent 20-minute recorded power for an FTP estimate." : "Candidate FTP ~" + c.suggestedFtp + " W, calculated as 95% of the best recorded 20-minute power in the last 120 days. Confirm with an FTP test.") + "</p></div></div>" + (c.total ? '<div class="coach-history-suggestions">' + (c.weeklyHours >= 1 ? '<button id="coachUseHours" type="button">USE ' + Math.min(20, Math.max(1, Math.round(c.weeklyHours * 2) / 2)) + " H/WEEK</button>" : "") + (c.suggestedFtp !== null ? '<button id="coachUseFtp" type="button">REVIEW FTP ' + c.suggestedFtp + " W</button>" : "") + "</div>" : "") + (c.total ? '<div class="coach-history-latest"><strong>LATEST IMPORTS</strong>' + a.slice(0, 5).map((C) => "<div><span>" + D(new Date(C.start).toLocaleDateString()) + " · " + D(C.name) + "</span><small>" + D(C.source) + " · " + Math.round(C.duration / 60) + " min</small></div>").join("") + "</div>" : '<p class="coach-small">No imported rides yet. Upload your Strava archive to see fitness history here.</p>'), (E = o("coachUseHours")) == null || E.addEventListener("click", () => {
      c.weeklyHours < 1 || (t.applySuggestion({ hours: Math.min(20, Math.max(1, Math.round(c.weeklyHours * 2) / 2)) }), i.textContent = "Weekly training hours updated in your Coach profile. You can edit them anytime.");
    }), (A = o("coachUseFtp")) == null || A.addEventListener("click", () => {
      c.suggestedFtp !== null && confirm("Apply the historical FTP estimate of " + c.suggestedFtp + " W to Coach? This is not a substitute for an FTP test.") && (t.applySuggestion({ ftp: c.suggestedFtp }), i.textContent = "FTP updated in Coach. Verify your training zones with a recent test.");
    });
  }
  async function I() {
    try {
      a = await ma(), f();
    } catch (c) {
      o("coachHistoryStats").textContent = "Could not open local history: " + String(c instanceof Error ? c.message : c);
    }
  }
  function R(c) {
    const M = pa(a, c.rides), E = M.added, A = M.updated;
    i.innerHTML = '<div class="coach-import-result"><strong>READY TO SAVE · ' + E + " NEW RIDES</strong><p>" + c.read + " recordings parsed · " + c.csvRides + " CSV cycling rows · " + c.skipped + " files skipped · " + A + " existing rides enhanced · " + M.duplicates + " duplicates matched.</p>" + (c.errors.length ? "<details><summary>Import warnings (" + c.errors.length + " shown)</summary><ul>" + c.errors.map((C) => "<li>" + D(C) + "</li>").join("") + "</ul></details>" : "") + '<div class="coach-import-actions"><button type="button" id="coachConfirmImport">SAVE HISTORY TO THIS DEVICE</button><button type="button" id="coachCancelImport">CANCEL</button></div></div>', s = M.rides, o("coachConfirmImport").addEventListener("click", async () => {
      if (!s || l) return;
      l = !0;
      const C = s, k = o("coachConfirmImport");
      k.disabled = !0;
      try {
        await Ua(C), a = C, s = null, i.textContent = "Saved " + E + " new rides and enhanced " + A + " activities on this device.", f(), window.dispatchEvent(new Event("breakaway:history-updated"));
      } catch (v) {
        i.textContent = "Save failed (nothing was changed): " + String(v instanceof Error ? v.message : v);
      } finally {
        l = !1;
      }
    }), o("coachCancelImport").addEventListener("click", () => {
      s = null, i.textContent = "Import canceled. Your saved history was not changed.";
    });
  }
  async function w(c) {
    if (!(l || !c.length)) {
      l = !0, s = null, p.disabled = !0, g.setAttribute("aria-busy", "true"), i.textContent = "Reading activity files locally…";
      try {
        const M = await Za(c, (E) => {
          i.textContent = "Reading " + E.done + " / " + E.total + " files · " + E.accepted + " cycling recordings · " + E.skipped + " skipped";
        });
        M.rides.length ? R(M) : i.textContent = "No valid cycling rides were found. " + (M.errors[0] || "Try a Strava archive or individual activity recordings.");
      } catch (M) {
        i.textContent = "Import could not finish: " + String(M instanceof Error ? M.message : M);
      } finally {
        l = !1, p.disabled = !1, g.removeAttribute("aria-busy"), d.value = "";
      }
    }
  }
  d.addEventListener("change", () => void w(Array.from(d.files || [])));
  for (const c of ["dragenter", "dragover"]) g.addEventListener(c, (M) => {
    M.preventDefault(), g.classList.add("coach-drop-active");
  });
  return g.addEventListener("dragleave", (c) => {
    c.preventDefault(), g.classList.remove("coach-drop-active");
  }), g.addEventListener("drop", (c) => {
    var E;
    c.preventDefault(), g.classList.remove("coach-drop-active");
    const M = Array.from(((E = c.dataTransfer) == null ? void 0 : E.files) || []);
    w(M);
  }), g.addEventListener("keydown", (c) => {
    c.target === g && c.key === "Enter" && (c.preventDefault(), d.click());
  }), p.addEventListener("click", async () => {
    if (!l && confirm("Delete all historical rides imported into Breakaway Coach on this device? Your original Strava files are not affected.")) {
      l = !0, p.disabled = !0;
      try {
        await Ka(), s = null, a = [], i.textContent = "Imported history deleted from this device.", f(), window.dispatchEvent(new Event("breakaway:history-updated"));
      } catch (c) {
        i.textContent = "Delete failed: " + String(c instanceof Error ? c.message : c);
      } finally {
        l = !1, p.disabled = !1;
      }
    }
  }), I(), { reload: I };
}
const ia = "breakaway.coach.strength.settings.v1", ra = "breakaway.coach.strength.history.v1", va = { enabled: !1, equipment: ["bodyweight"], experience: "beginner", sessions: 1, minutes: 30, notes: "" }, fa = [
  { id: "bodyweight", label: "Bodyweight", detail: "Floor space only" },
  { id: "dumbbells", label: "Dumbbells", detail: "Fixed or adjustable" },
  { id: "kettlebells", label: "Kettlebells", detail: "Single or paired" },
  { id: "bands", label: "Resistance bands", detail: "Light to heavy" },
  { id: "barbell", label: "Squat rack + barbell", detail: "With plates" },
  { id: "bench", label: "Weight bench", detail: "Flat or adjustable" },
  { id: "pullup", label: "Pull-up bar", detail: "Safe, securely mounted" }
];
function _e(e) {
  const t = e && typeof e == "object" ? e : {}, a = Array.isArray(t.equipment) ? t.equipment.filter((l) => fa.some((o) => o.id === l)) : [], s = Array.from(/* @__PURE__ */ new Set(["bodyweight", ...a]));
  return {
    enabled: t.enabled === !0,
    equipment: s,
    experience: ["beginner", "intermediate", "advanced"].includes(String(t.experience)) ? t.experience : "beginner",
    sessions: t.sessions === 2 ? 2 : 1,
    minutes: [20, 30, 45].includes(Number(t.minutes)) ? Number(t.minutes) : 30,
    notes: typeof t.notes == "string" ? t.notes.slice(0, 150) : ""
  };
}
const en = [
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
function st(e, t) {
  const a = new Set(_e(e).equipment);
  return en.filter((s) => (!t || s.pattern === t) && s.equipment.every((l) => a.has(l)));
}
const tn = (e, t, a) => {
  const s = st(e, t);
  return a.map((l) => s.find((o) => o.id === l)).find(Boolean) || s[0];
};
function Ct(e, t = "A", a = !1) {
  const s = _e(e), l = s.experience === "beginner", o = a ? 1 : l ? 2 : 3, d = ["Squat", "Hinge", "Push", "Pull", "Core"], i = {
    Squat: t === "A" ? ["bar-squat", "db-goblet", "kb-goblet", "body-squat"] : ["split-squat", "db-goblet", "kb-goblet", "body-squat", "bar-squat"],
    Hinge: t === "A" ? ["bar-rdl", "db-rdl", "kb-deadlift", "hip-bridge"] : ["single-bridge", "db-rdl", "kb-deadlift", "hip-bridge"],
    Push: t === "A" ? ["bar-bench", "db-press", "kb-press", "pushup"] : ["pushup", "db-press", "kb-press", "bar-bench"],
    Pull: t === "A" ? ["db-row", "kb-row", "bar-row", "band-row", "pull-up", "prone-ytw"] : ["band-row", "pull-up", "db-row", "kb-row", "bar-row", "prone-ytw"],
    Core: t === "A" ? ["dead-bug", "suitcase", "kb-suitcase", "side-plank"] : ["side-plank", "suitcase", "kb-suitcase", "dead-bug"]
  };
  return {
    id: "strength-" + t.toLowerCase(),
    title: a ? "Recovery Strength & Mobility" : "Full Body Strength " + t,
    minutes: a ? 20 : s.minutes,
    light: a,
    note: a ? "Recent fatigue suggests a very easy session or rest. Skip if sore or unwell." : "Leave about 2–3 repetitions in reserve and prioritize control over heavy loads.",
    exercises: d.map((g) => {
      const p = tn(s, g, i[g]);
      return {
        ...p,
        sets: g === "Core" ? Math.max(1, o - 1) : o,
        restSeconds: a ? 45 : l ? 60 : 90,
        alternatives: st(s, g).filter((f) => f.id !== p.id).map((f) => f.id)
      };
    })
  };
}
function an(e, t, a, s) {
  const l = _e(t), o = Math.round(Math.max(60, e.hours * 60)), d = a.map((w) => ({
    day: w.day,
    cyclingId: w.workoutId,
    cyclingMinutes: w.workoutId ? s(w.workoutId) : 0,
    strength: null,
    strengthMinutes: 0,
    reason: w.reason
  }));
  if (!l.enabled) {
    let w = d.reduce((E, A) => E + A.cyclingMinutes, 0);
    if (w <= o) return { days: d, budgetMinutes: o, plannedMinutes: w, note: "Strength training is turned off." };
    const c = (E) => E.cyclingId === "recovery" ? 0 : E.cyclingId === "endurance" ? 1 : E.cyclingId === "tempo" ? 2 : 3, M = [...d].filter((E) => E.cyclingId).sort((E, A) => c(E) - c(A));
    for (const E of M) {
      if (w <= o) break;
      const A = Math.min(Math.max(0, E.cyclingMinutes - 15), w - o);
      E.cyclingMinutes -= A, w -= A;
    }
    for (const E of M) {
      if (w <= o) break;
      w -= E.cyclingMinutes, E.cyclingMinutes = 0, E.cyclingId = null, E.reason = "Removed because the selected weekly hours cannot fit all rides.";
    }
    return {
      days: d,
      budgetMinutes: o,
      plannedMinutes: w,
      note: "Strength is off. Cycling was adjusted to fit your available weekly hours."
    };
  }
  const i = d.filter((w) => w.cyclingId && w.day !== e.restDay).sort((w, c) => (w.cyclingId === "endurance" || w.cyclingId === "recovery" ? -1 : 1) - (c.cyclingId === "endurance" || c.cyclingId === "recovery" ? -1 : 1)), g = [];
  for (const w of i) {
    if (g.length >= l.sessions) break;
    g.some((c) => Math.abs(c.day - w.day) === 1) || g.push(w);
  }
  let p = 0;
  for (const w of g)
    w.strength = p ? "B" : "A", w.strengthMinutes = l.minutes, p++;
  let f = d.reduce((w, c) => w + c.cyclingMinutes + c.strengthMinutes, 0);
  if (f > o) {
    const w = [...d].filter((c) => c.cyclingId).sort((c, M) => {
      const E = (A) => A.cyclingId === "recovery" ? 0 : A.cyclingId === "endurance" ? 1 : A.cyclingId === "tempo" ? 2 : 3;
      return E(c) - E(M);
    });
    for (const c of w) {
      if (f <= o) break;
      const M = c.strength ? 0 : 15, E = Math.min(c.cyclingMinutes - M, f - o);
      E > 0 && (c.cyclingMinutes -= E, f -= E, c.cyclingMinutes === 0 && (c.cyclingId = null));
    }
    for (const c of [...g].reverse()) {
      if (f <= o) break;
      const M = Math.max(0, c.strengthMinutes - 15), E = Math.min(M, f - o);
      c.strengthMinutes -= E, f -= E, f > o && (f -= c.strengthMinutes, c.strengthMinutes = 0, c.strength = null);
    }
    for (const c of w) {
      if (f <= o) break;
      const M = Math.min(c.cyclingMinutes, f - o);
      c.cyclingMinutes -= M, f -= M, c.cyclingMinutes === 0 && (c.cyclingId = null);
    }
  }
  const I = d.reduce((w, c) => w + c.cyclingMinutes + c.strengthMinutes, 0), R = d.filter((w) => w.strength).length;
  return { days: d, budgetMinutes: o, plannedMinutes: I, note: R ? l.sessions > R ? "Limited time or available training days reduced strength frequency." : "Strength sessions are included in your total weekly time budget." : "Not enough available time or separate training days for strength. Consider increasing your weekly training time or lowering other sessions." };
}
function nn(e, t) {
  let a = _e(ee(ia) || va);
  const s = ee(ra);
  let l = Array.isArray(s) ? s.filter((m) => m && typeof m.routine == "string" && Array.isArray(m.sets)).slice(-150) : [], o = !1, d = "A", i = !1, g = 0, p = "", f = 30, I = [], R = Ct(a, "A", !1);
  const w = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Map();
  let M = null, E = 0, A = null;
  const C = document.createElement("section");
  C.className = "coach-strength-overlay", C.id = "coachStrengthOverlay", C.hidden = !0, C.setAttribute("role", "dialog"), C.setAttribute("aria-modal", "true"), C.setAttribute("aria-label", "Guided strength session"), document.body.append(C);
  function k() {
    e.innerHTML = '<div class="coach-section-top"><span class="coach-tag">STRENGTH TRAINING</span><span class="coach-tag">OPTIONAL · LOCAL ONLY</span></div><h3>Train with what you own.</h3><p class="coach-small">Set your available equipment. Strength sessions share your weekly training time budget.</p><label class="coach-strength-toggle"><input id="strengthEnabled" type="checkbox" ' + (a.enabled ? "checked" : "") + '><span>Include strength in my training plan</span></label><span class="coach-label">AVAILABLE EQUIPMENT</span><div class="coach-equipment-grid">' + fa.map((m) => '<label class="coach-gear-choice"><input type="checkbox" data-gear="' + m.id + '" ' + (a.equipment.includes(m.id) ? "checked" : "") + " " + (m.id === "bodyweight" ? "disabled" : "") + "><span><strong>" + D(m.label) + "</strong><small>" + D(m.detail) + "</small></span></label>").join("") + '</div><div class="coach-strength-fields"><label>EXPERIENCE<select id="strengthExperience"><option value="beginner">New to lifting</option><option value="intermediate">Some experience</option><option value="advanced">Experienced</option></select></label><label>SESSIONS / WEEK<select id="strengthSessions"><option value="1">1 session</option><option value="2">2 sessions</option></select></label><label>TIME / SESSION<select id="strengthMinutes"><option value="20">20 min</option><option value="30">30 min</option><option value="45">45 min</option></select></label><label>AVAILABLE WEIGHTS (OPTIONAL)<input type="text" id="strengthWeights" maxlength="150" placeholder="e.g. 25 lb DB, 35 lb KB"></label></div><p id="strengthSaved" class="coach-small" role="status">Your strength setup is saved with your cycling settings using Save My Plan.</p>', e.querySelector("#strengthExperience").value = a.experience, e.querySelector("#strengthSessions").value = String(a.sessions), e.querySelector("#strengthMinutes").value = String(a.minutes), e.querySelector("#strengthWeights").value = a.notes;
  }
  function v() {
    const m = Array.from(e.querySelectorAll("[data-gear]")).filter((T) => T.checked).map((T) => T.dataset.gear), n = _e({
      enabled: e.querySelector("#strengthEnabled").checked,
      equipment: m,
      experience: e.querySelector("#strengthExperience").value,
      sessions: Number(e.querySelector("#strengthSessions").value),
      minutes: Number(e.querySelector("#strengthMinutes").value),
      notes: e.querySelector("#strengthWeights").value
    });
    return me(ia, n) ? (a = n, k(), e.querySelector("#strengthSaved").textContent = "Equipment settings saved.", !0) : (e.querySelector("#strengthSaved").textContent = "Local storage unavailable. Nothing saved.", !1);
  }
  function F() {
    M !== null && window.clearInterval(M), M = null, E = 0;
  }
  function Y(m) {
    M !== null && window.clearInterval(M), E = Date.now() + m * 1e3;
    const n = () => {
      const T = Math.max(0, Math.ceil((E - Date.now()) / 1e3)), x = C.querySelector("#strengthRestLabel");
      x && (x.textContent = T ? "Rest: " + T + " seconds" : "Rest complete. Ready for the next set."), T || (M !== null && window.clearInterval(M), M = null);
    };
    M = window.setInterval(n, 500), n();
  }
  const B = (m, n) => m + ":" + n;
  function ae() {
    if (!o) return;
    const m = C.scrollTop, n = I.reduce((T, x) => T + x.sets, 0);
    if (C.innerHTML = '<div class="coach-strength-session"><header class="coach-strength-session-head"><div><span>BREAKAWAY COACH / STRENGTH</span><h2>' + D(R.title) + "</h2><p>" + f + " min planned · " + w.size + " / " + n + ' sets logged</p></div><button type="button" id="strengthExit">← BACK TO COACH</button></header><div class="coach-strength-session-note">' + D(R.note) + ' Warm up for 5 minutes. Stop or modify anything painful; use a load you can control.</div><div class="coach-strength-progress"><div style="width:' + Math.round(100 * w.size / Math.max(n, 1)) + '%"></div></div><div class="coach-strength-rest"><span id="strengthRestLabel">Rest as needed between sets.</span><button type="button" id="strengthRestStart">START 60s REST</button></div><div class="coach-strength-list">' + I.map((T, x) => {
      const O = st(a, T.pattern);
      return '<section class="coach-strength-exercise"><div class="coach-strength-exercise-header"><div><small>' + (x + 1) + " / " + I.length + " · " + D(T.pattern.toUpperCase()) + "</small><h3>" + D(T.name) + '</h3></div><label>SWAP EXERCISE<select data-strength-sub="' + x + '">' + O.map((P) => '<option value="' + P.id + '" ' + (P.id === T.id ? "selected" : "") + ">" + D(P.name) + "</option>").join("") + "</select></label></div><p>" + D(T.instructions) + '</p><p class="coach-strength-dose">' + T.sets + " sets · " + D(T.reps) + " · Rest " + T.restSeconds + "s · " + D(T.loadHint) + '</p><div class="coach-strength-sets">' + Array.from({ length: T.sets }, (P, j) => {
        const ne = B(x, j);
        return '<div class="coach-strength-set"><span>SET ' + (j + 1) + '</span><input aria-label="Repetitions: set ' + (j + 1) + " " + D(T.name) + '" data-reps="' + ne + '" maxlength="30" placeholder="' + D(T.reps) + '"><input aria-label="Weight: set ' + (j + 1) + " " + D(T.name) + '" data-load="' + ne + '" maxlength="32" placeholder="Load (lb / kg / BW)"><button type="button" aria-pressed="' + w.has(ne) + '" data-check="' + ne + '">' + (w.has(ne) ? "✓ DONE" : "MARK DONE") + "</button></div>";
      }).join("") + "</div></section>";
    }).join("") + '</div><div class="coach-strength-complete"><label>SESSION EFFORT<select id="strengthRpe"><option value="">Select effort</option><option value="3">Easy</option><option value="5">Moderate</option><option value="7">Hard</option><option value="9">Very hard</option></select></label><button type="button" id="strengthFinish">FINISH & SAVE SESSION →</button><p id="strengthSessionError" role="status"></p></div></div>', C.querySelectorAll("[data-reps],[data-load]").forEach((T) => {
      const x = T.hasAttribute("data-reps") ? "reps" : "load";
      T.value = c.get(x + ":" + T.getAttribute("data-" + x)) || "";
    }), C.querySelector("#strengthRpe").value = p, C.scrollTop = m, M !== null && E > Date.now()) {
      const T = C.querySelector("#strengthRestLabel");
      T && (T.textContent = "Rest: " + Math.ceil((E - Date.now()) / 1e3) + " seconds");
    }
  }
  C.addEventListener("input", (m) => {
    const n = m.target;
    if (n instanceof HTMLInputElement)
      for (const T of ["reps", "load"]) n.hasAttribute("data-" + T) && c.set(T + ":" + n.getAttribute("data-" + T), n.value);
  }), C.addEventListener("change", (m) => {
    const n = m.target;
    if (!(n instanceof HTMLSelectElement)) return;
    if (n.id === "strengthRpe") {
      p = n.value;
      return;
    }
    if (!n.hasAttribute("data-strength-sub")) return;
    const T = Number(n.dataset.strengthSub), x = I[T];
    if (!x) return;
    const O = st(a, x.pattern).find((P) => P.id === n.value);
    if (O) {
      I[T] = { ...O, sets: x.sets, restSeconds: x.restSeconds, alternatives: x.alternatives };
      for (let P = 0; P < x.sets; P++) {
        const j = B(T, P);
        w.delete(j), c.delete("reps:" + j), c.delete("load:" + j);
      }
      ae();
    }
  }), C.addEventListener("click", (m) => {
    var x;
    const n = m.target;
    if (!(n instanceof Element)) return;
    if (n.closest("#strengthExit")) {
      if (w.size && !confirm("Leave without saving your sets?")) return;
      he();
      return;
    }
    const T = n.closest("[data-check]");
    if (T) {
      const O = T.dataset.check;
      if (w.has(O) ? w.delete(O) : w.add(O), w.has(O)) {
        const P = Number(O.split(":")[0]);
        Y(((x = I[P]) == null ? void 0 : x.restSeconds) || 60);
      }
      ae();
      return;
    }
    if (n.closest("#strengthRestStart")) {
      Y(60);
      return;
    }
    n.closest("#strengthFinish") && re();
  });
  function re() {
    if (!w.size) {
      C.querySelector("#strengthSessionError").textContent = "Complete at least one set to save this session.";
      return;
    }
    const m = [];
    I.forEach((x, O) => {
      for (let P = 0; P < x.sets; P++) {
        const j = B(O, P);
        m.push({ exerciseId: x.id, set: P + 1, reps: c.get("reps:" + j) || "", load: c.get("load:" + j) || "", done: w.has(j) });
      }
    });
    const n = {
      id: (/* @__PURE__ */ new Date()).toISOString() + ":" + R.id,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      routine: R.title,
      minutes: Math.max(1, Math.round((Date.now() - g) / 6e4)),
      completedSets: w.size,
      plannedSets: m.length,
      rpe: p ? Number(p) : null,
      sets: m
    }, T = l.concat(n).slice(-150);
    if (!me(ra, T)) {
      C.querySelector("#strengthSessionError").textContent = "Could not save. Check local browser storage.";
      return;
    }
    l = T, he(), t.finished();
  }
  function he() {
    F(), o = !1, C.hidden = !0, A == null || A.focus(), A = null;
  }
  function K(m = "A", n = !1, T) {
    var x;
    return a.enabled ? (d = m, f = Math.min(a.minutes, Math.max(15, T || a.minutes)), i = n || f < 20, R = Ct(a, d, i), I = R.exercises, f < a.minutes && (I = I.map((O) => ({ ...O, sets: Math.max(1, Math.min(O.sets, f < 25 ? 1 : 2)) }))), A = document.activeElement instanceof HTMLElement ? document.activeElement : null, o = !0, w.clear(), c.clear(), p = "", g = Date.now(), F(), C.hidden = !1, ae(), C.scrollTop = 0, (x = C.querySelector("#strengthExit")) == null || x.focus(), !0) : !1;
  }
  return C.addEventListener("keydown", (m) => {
    if (!o) return;
    if (m.key === "Escape") {
      m.preventDefault();
      const O = C.querySelector("#strengthExit");
      O == null || O.click();
      return;
    }
    if (m.key !== "Tab") return;
    const n = Array.from(C.querySelectorAll("button:not(:disabled),input:not(:disabled),select:not(:disabled)"));
    if (!n.length) return;
    const T = n[0], x = n[n.length - 1];
    m.shiftKey && document.activeElement === T ? (m.preventDefault(), x.focus()) : !m.shiftKey && document.activeElement === x && (m.preventDefault(), T.focus());
  }), k(), {
    get settings() {
      return a;
    },
    get history() {
      return l;
    },
    open: K,
    close: he,
    renderSettings: k,
    saveSettings: v,
    get active() {
      return o;
    },
    completedToday() {
      return l.some((m) => xe(new Date(m.date)) === xe(/* @__PURE__ */ new Date()));
    }
  };
}
function on(e, t, a, s) {
  const l = [];
  for (let o = 0; o < 7; o++) {
    const d = new Date(e.getFullYear(), e.getMonth(), e.getDate() + o), i = t.find((M) => M.day === d.getDay()), g = o === 0 && s.status === "completed";
    let p = i != null && i.cyclingId && i.cyclingMinutes > 0 ? i.cyclingId : null;
    o === 0 && (g || s.status === "rest" || !p ? p = null : s.workoutId && (p = s.workoutId));
    const f = a.find((M) => M.id === p), I = (i == null ? void 0 : i.cyclingId) === p ? i.cyclingMinutes : 0, R = f ? Math.max(0, I || Math.round(f.segments.reduce((M, E) => M + E.minutes, 0))) : 0, w = o === 0 ? "Today" : new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d), c = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
    l.push({
      date: d,
      key: c,
      isToday: o === 0,
      label: w + " " + (d.getMonth() + 1) + "/" + d.getDate(),
      title: new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(d),
      rideId: (f == null ? void 0 : f.id) || null,
      rideName: (f == null ? void 0 : f.name) || null,
      rideMinutes: R,
      rideDescription: (f == null ? void 0 : f.description) || null,
      strength: (i == null ? void 0 : i.strength) || null,
      strengthMinutes: (i == null ? void 0 : i.strengthMinutes) || 0,
      completedRide: g,
      reason: o === 0 ? s.reason : (i == null ? void 0 : i.reason) || "Scheduled recovery day"
    });
  }
  return l;
}
const ba = 864e5;
function Ge(e) {
  return [e.getFullYear(), String(e.getMonth() + 1).padStart(2, "0"), String(e.getDate()).padStart(2, "0")].join("-");
}
const sn = (e, t) => Number.isFinite(e.start) && e.start <= t && e.start >= t - 14 * ba && Number.isFinite(e.elapsed) && e.elapsed >= 900;
function vt(e) {
  return Math.max(0, Math.round(e.elapsed / 60));
}
function rn(e) {
  var ae, re, he, K;
  const { now: t, week: a, today: s, ftp: l, ftpKnown: o } = e, d = Ge(t), i = t.getTime(), g = new Set(e.skipped), p = e.rides.filter((m) => sn(m, i)), f = new Date(t.getFullYear(), t.getMonth(), t.getDate() - t.getDay()), I = [];
  for (let m = 0; m < 14; m++) {
    const n = new Date(f.getFullYear(), f.getMonth(), f.getDate() + m), T = Ge(n), x = n.getDay(), O = ((ae = e.planForDate) == null ? void 0 : ae.call(e, n)) ?? a.find((W) => W.day === x), P = (re = e.event) != null && re.startDate && /^\d{4}-\d{2}-\d{2}$/.test(e.event.startDate) ? /* @__PURE__ */ new Date(e.event.startDate + "T12:00:00") : null, j = P ? Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12).getTime() - P.getTime()) / ba) : -1, ne = j >= 0 && j < Math.max(1, ((he = e.event) == null ? void 0 : he.stages) || 1) ? j + 1 : 0, X = O != null && O.cyclingId && O.cyclingMinutes > 0 ? O.cyclingId : null, le = X ? O.cyclingMinutes : 0, Le = n.getTime(), Pe = p.filter((W) => Ge(new Date(W.start)) === T), He = Pe.reduce((W, Ce) => W + vt(Ce), 0), Se = Le < new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(), ye = T === d;
    let oe = X, ie = le, ce = X ? "planned" : "rest", de = (O == null ? void 0 : O.reason) || "Recovery day";
    if ((Se || ye) && Pe.length)
      oe = null, ie = 0, ce = "completed", de = "A ride was recorded on this date. Coach does not prescribe a duplicate session.";
    else if (ne)
      oe = null, ie = 0, ce = "event", de = "Event stage " + ne + " of " + Math.max(1, ((K = e.event) == null ? void 0 : K.stages) || 1) + ". No additional indoor workout is prescribed. Follow your event pacing and fueling plan.";
    else if ((Se || ye) && g.has(T))
      oe = null, ie = 0, ce = "skipped", de = "You skipped this session. Coach will not stack it onto a later day.";
    else if (Se)
      oe = null, ie = 0, ce = X ? "missed" : "rest", de = X ? "This scheduled ride was not recorded and has not been rescheduled." : "Scheduled rest day.";
    else if (ye)
      oe = s.workoutId, ce = s.status === "completed" ? "completed" : oe ? s.status === "recovery" ? "recovery" : "planned" : "rest", ie = oe ? oe === "recovery" && X !== "recovery" ? Math.min(le || e.recoveryMinutes, e.recoveryMinutes) : le : 0, de = s.reason;
    else if (X) {
      const W = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 9).getTime(), Ce = p.some((Z) => Z.start < W && W - Z.start <= 36 * 36e5 && (vt(Z) >= 120 || o && Z.avgPower !== null && Number.isFinite(Z.avgPower) && Z.elapsed >= 1800 && Z.avgPower >= l * 0.8)), Re = e.feedback.some((Z) => Number.isFinite(Z.date) && Z.date < W && W - Z.date <= 48 * 36e5 && Z.rpe !== null && Z.rpe >= 9);
      (Ce || Re) && X !== "recovery" && (oe = "recovery", ie = Math.min(le, e.recoveryMinutes), ce = "recovery", de = Re ? "Very hard recent workout feedback prompted a recovery spin instead of the planned workout." : "A demanding or long ride was recorded before this session. Coach replaced it with easier recovery riding.");
    }
    I.push({
      key: T,
      date: n,
      weekday: x,
      originalId: X,
      workoutId: oe,
      originalMinutes: le,
      minutes: ie,
      recordedMinutes: He,
      status: ce,
      reason: de,
      changed: ce === "completed" || oe !== X || ie !== le,
      strength: ne ? null : (O == null ? void 0 : O.strength) || null,
      strengthMinutes: ne ? 0 : (O == null ? void 0 : O.strengthMinutes) || 0
    });
  }
  const w = I.filter((m) => m.date.getTime() <= i && m.date.getTime() >= f.getTime()).filter((m) => p.some((n) => Ge(new Date(n.start)) === m.key)), c = w.reduce((m, n) => m + p.filter((T) => Ge(new Date(T.start)) === n.key).reduce((T, x) => T + vt(x), 0), 0), M = w.reduce((m, n) => m + n.originalMinutes, 0), E = Math.max(0, c - M), A = I.slice(0, 7).reduce((m, n) => m + n.originalMinutes + n.strengthMinutes, 0), C = Math.max(0, e.budgetMinutes - A), k = I.slice(0, 7).filter((m) => m.status === "recovery" && m.date.getTime() >= new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()).reduce((m, n) => m + Math.max(0, n.originalMinutes - n.minutes), 0);
  let v = Math.max(0, E - C - k);
  const F = new Date(f.getFullYear(), f.getMonth(), f.getDate() + 7).getTime(), Y = I.filter((m) => m.date.getTime() >= new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime() && m.date.getTime() < F && m.workoutId && m.status !== "completed" && m.status !== "skipped").sort((m, n) => {
    const T = (x) => x.workoutId === "recovery" ? 0 : x.workoutId === "endurance" ? 1 : 2;
    return T(m) - T(n) || m.date.getTime() - n.date.getTime();
  });
  for (const m of Y) {
    if (v <= 0) break;
    const n = Math.max(0, m.minutes - 15), T = Math.min(n, v);
    T <= 0 || (m.minutes -= T, v -= T, m.minutes !== m.originalMinutes && (m.status = m.status === "recovery" ? "recovery" : "shortened", m.changed = !0, m.reason += " Additional riding exceeded your remaining weekly time by " + (E - C - k) + " minutes, so Coach shortened this session by " + T + " minutes. Strength and rest days stay unchanged."));
  }
  const B = I.filter((m) => m.date.getTime() < F && (m.changed || m.status === "skipped" && g.has(m.key))).map((m) => ({
    key: m.key,
    originalId: m.originalId,
    workoutId: m.workoutId,
    beforeMinutes: m.originalMinutes,
    afterMinutes: m.status === "completed" ? m.recordedMinutes : m.minutes,
    reason: m.reason,
    kind: m.status === "completed" ? "completed" : m.status === "skipped" ? "skipped" : m.status === "shortened" ? "shortened" : m.status === "missed" ? "missed" : m.status === "event" ? "event" : "recovery"
  }));
  return { days: I, changes: B, extraMinutes: E };
}
const cn = (e) => {
  const t = e.match(/\b(\d{1,2}):([0-5]\d):([0-5]\d)\b/);
  if (t) return Math.round((Number(t[1]) * 3600 + Number(t[2]) * 60 + Number(t[3])) / 60);
  const a = e.match(/\b(\d{1,2}):([0-5]\d)\b/);
  if (a) return Number(a[1]) * 60 + Number(a[2]);
  const s = e.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr|h)\b/i), l = e.match(/\b(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)\b/i), o = (s ? Number(s[1]) * 60 : 0) + (l ? Number(l[1]) : 0);
  return o > 0 ? Math.round(o) : null;
};
function ca(e) {
  const t = e.trim().slice(0, 3e3), a = cn(t), s = /\b(steady|base|endurance|easy aerobic|consistent|continuous)\b/i.test(t), l = t.match(/\b(?:heart[\s-]*rate|hr)?\s*(?:between|from)\s*(\d{2,3})\s*(?:and|to|[-–—])\s*(\d{2,3})\s*(?:bpm)?\b/i), o = t.match(/\b(?:heart[\s-]*rate|hr)?\s*(\d{2,3})\s*(?:-|–|—|to)\s*(\d{2,3})\s*bpm\b/i), d = t.match(/\b(\d{2,4})\s*(?:-|–|—|to)\s*(\d{2,4})\s*(?:w|watts)\b/i), i = l || o;
  let g = null;
  if (i) {
    const R = Number(i[1]), w = Number(i[2]);
    R >= 35 && w <= 240 && R < w && (g = { kind: "heart-rate", minBpm: R, maxBpm: w });
  } else if (d) {
    const R = Number(d[1]), w = Number(d[2]);
    R >= 20 && w <= 1200 && R < w && (g = { kind: "power", lowWatts: R, highWatts: w });
  }
  const p = [];
  a === null && p.push("Duration not specified. Enter a total workout time."), g === null && p.push("No valid heart-rate or wattage range found. Add an intensity target."), /\bwarm[\s-]?up\b/i.test(t) || p.push("Warmup not specified — no separate warmup was added."), /\bcool[\s-]?down\b/i.test(t) || p.push("Cooldown not specified — no separate cooldown was added."), (g == null ? void 0 : g.kind) === "heart-rate" && (p.push("No power target provided. Breakaway will not convert heart rate into watts."), p.push("A compatible heart-rate monitor is needed for live guidance.")), a !== null && (a < 1 || a > 600) && p.push("Duration must be between 1 and 600 minutes.");
  const f = a !== null && a >= 1 && a <= 600 && g !== null;
  return {
    title: /\b(base|endurance)\b/i.test(t) ? "Base" : "Steady Heart-Rate Ride",
    sport: "cycling",
    durationMinutes: a,
    target: g,
    description: t,
    pace: s ? "steady" : "unspecified",
    notes: s ? ["One continuous, steady session."] : [],
    warnings: p,
    ready: f
  };
}
const ft = "Ride for 2 hours at a steady pace. Keep heart rate between 103 and 114 bpm.", la = "breakaway.coach.imported-workouts.v1", at = (e) => e === null ? "—" : Math.floor(e / 60) + ":" + String(e % 60).padStart(2, "0") + ":00";
function ln(e) {
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
  const t = (p) => e.querySelector("#" + p), a = t("ciDescription"), s = t("ciImage"), l = t("ciImagePreview");
  let o = null, d = ca(ft);
  a.value = ft;
  const i = (p) => {
    for (const f of ["Text", "Image", "File"])
      t("ciTab" + f).setAttribute("aria-selected", String(f === p)), t("ciPanel" + f).hidden = f !== p;
  };
  t("ciTabText").addEventListener("click", () => i("Text")), t("ciTabImage").addEventListener("click", () => i("Image")), t("ciTabFile").addEventListener("click", () => i("File")), t("ciBackToText").addEventListener("click", () => i("Text")), t("ciExample").addEventListener("click", () => {
    a.value = ft, g();
  });
  function g() {
    d = ca(a.value);
    const p = d.target, f = (p == null ? void 0 : p.kind) === "heart-rate", I = (p == null ? void 0 : p.kind) === "power", R = f ? p.minBpm + "–" + p.maxBpm : I ? p.lowWatts + "–" + p.highWatts : "—", w = f ? "BPM" : I ? "WATTS" : "MISSING";
    t("ciTitle").textContent = d.title, t("ciSubtitle").textContent = d.pace === "steady" ? "One continuous steady cycling interval" : "One continuous cycling interval", t("ciDuration").textContent = at(d.durationMinutes), t("ciTarget").textContent = R, t("ciTargetUnit").textContent = "TARGET " + w, t("ciTimelineTarget").textContent = R + " " + w, t("ciTimelineType").textContent = f ? "Heart-rate target" : I ? "Power target" : "Intensity not specified", t("ciTimelineMinutes").textContent = d.durationMinutes !== null ? d.durationMinutes + " MIN" : "TIME MISSING", t("ciTimelineMiddle").textContent = d.durationMinutes !== null ? at(Math.floor(d.durationMinutes / 2)) : "—", t("ciTimelineEnd").textContent = at(d.durationMinutes), t("ciTrainerMode").textContent = f ? "SIM / manual resistance" : I ? "Power guidance / ERG optional" : "Intensity not specified", t("ciStructure").textContent = "One " + (d.pace === "steady" ? "steady " : "") + "block", t("ciWarnings").innerHTML = d.warnings.map((c) => "<li>" + D(c) + "</li>").join(""), t("ciStatus").textContent = d.ready ? "READY TO REVIEW" : "NEEDS DETAILS", t("ciStatus").classList.toggle("is-incomplete", !d.ready), t("ciSave").disabled = !d.ready, t("ciTimeline").setAttribute("aria-label", "Continuous cycling workout lasting " + at(d.durationMinutes) + " with target " + R + " " + w), t("ciSaveStatus").textContent = "";
  }
  a.addEventListener("input", g), s.addEventListener("change", () => {
    var f;
    const p = (f = s.files) == null ? void 0 : f[0];
    if (o && (URL.revokeObjectURL(o), o = null), l.hidden = !0, l.removeAttribute("src"), !p) {
      t("ciImageStatus").textContent = "No file selected";
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(p.type) || p.size > 8 * 1024 * 1024) {
      t("ciImageStatus").textContent = "Please select a JPG, PNG or WebP under 8 MB.";
      return;
    }
    o = URL.createObjectURL(p), l.src = o, l.hidden = !1, t("ciImageStatus").textContent = p.name + " · image preview only";
  }), t("ciSave").addEventListener("click", () => {
    if (d.ready)
      try {
        const p = JSON.parse(localStorage.getItem(la) || "[]"), f = Array.isArray(p) ? p : [];
        localStorage.setItem(la, JSON.stringify([...f.slice(-24), { ...d, id: "import-" + Date.now(), savedAt: (/* @__PURE__ */ new Date()).toISOString() }])), t("ciSaveStatus").textContent = "✓ Saved on this device. Imported-workout execution is not yet available.";
      } catch {
        t("ciSaveStatus").textContent = "Unable to save. Please enable browser storage.";
      }
  }), g();
}
const bt = "breakaway.coach.morning.v1", Ue = "breakaway.coach.ftp-known.v1", nt = (e, t, a) => typeof e == "number" && Number.isFinite(e) && Number.isInteger(e) && e >= t && e <= a ? e : null;
function wt(e, t) {
  if (!e || typeof e != "object") return null;
  const a = e, s = typeof a.date == "string" ? /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(a.date) : null;
  if ((s ? [s[1], s[2].padStart(2, "0"), s[3].padStart(2, "0")].join("-") : null) !== t || !["tired", "okay", "great"].includes(String(a.feeling))) return null;
  for (const [o, d, i] of [["bodyBattery", 0, 100], ["sleepScore", 0, 100], ["hrvMs", 1, 300]])
    if (a[o] !== null && a[o] !== void 0 && nt(a[o], d, i) === null) return null;
  return {
    date: t,
    feeling: a.feeling,
    bodyBattery: nt(a.bodyBattery, 0, 100),
    sleepScore: nt(a.sleepScore, 0, 100),
    hrvMs: nt(a.hrvMs, 1, 300)
  };
}
function wa(e) {
  if (!e) return { label: "Not checked in", detail: "Morning check-in is optional. Coach is using your schedule and recent rides.", suggestEasy: !1 };
  if (e.feeling === "tired") return { label: "Check your energy", detail: "You reported feeling tired. Consider an easy session; Body Battery, Sleep Score and HRV alone are not diagnostic.", suggestEasy: !0 };
  const t = [e.bodyBattery, e.sleepScore, e.hrvMs].filter((a) => a !== null).length;
  return {
    label: e.feeling === "great" ? "Feeling good" : "Feeling okay",
    detail: t ? "Your Garmin-style readings are recorded for reference. Personalized recovery thresholds need a baseline, so these numbers do not automatically change workouts." : "Your self-check is saved; there are no device readings today.",
    suggestEasy: !1
  };
}
function dn(e, t) {
  return !wa(t).suggestEasy || e.status !== "planned" || !e.workoutId || e.workoutId === "recovery" ? e : { workoutId: "recovery", status: "recovery", reason: "You reported feeling tired during your morning check-in. Coach suggests an easier recovery spin instead of your planned session. This is a training suggestion, not a medical assessment." };
}
function un(e, t, a = !1) {
  return a ? { color: "green", label: "Training complete", detail: "You have already ridden today. No additional prescribed workout is needed." } : !e && !t.demandingRide && !t.veryHardFeedback ? { color: "neutral", label: "Check-in optional", detail: "Coach has no reported fatigue today, but no check-in or personal recovery baseline is available. Follow the plan if you feel well, and adjust as needed." } : (e == null ? void 0 : e.feeling) === "tired" && (t.demandingRide || t.veryHardFeedback) ? { color: "red", label: "Recovery recommended", detail: "You reported fatigue and recent training was demanding. Coach recommends rest or gentle recovery rather than another hard effort." } : (e == null ? void 0 : e.feeling) === "tired" || t.demandingRide || t.veryHardFeedback ? { color: "yellow", label: "Take it easy", detail: (e == null ? void 0 : e.feeling) === "tired" ? "You reported fatigue. Coach suggests a lighter session based on your check-in." : "Recent demanding training suggests a lighter session. Coach uses recorded effort, not Garmin score cutoffs." } : { color: "green", label: "Follow your plan", detail: (e == null ? void 0 : e.feeling) === "great" ? "You feel good today. Follow your planned session without adding extra intensity." : "No fatigue flag was found in available inputs. Missing Garmin data does not mean you are fully recovered." };
}
const da = "breakaway.coach.event-goal.v1", hn = { discipline: "general", name: "", date: "", distanceKm: null, elevationM: null, durationMinutes: null, stages: 1, priority: "A", objective: "finish", terrain: "road" }, it = { general: "General cycling fitness", criterium: "Criterium", road: "Road race", tt: "Time trial", xco: "Mountain bike XCO / short track", xcm: "Mountain bike marathon", gravel: "Gravel race", cyclocross: "Cyclocross", "gran-fondo": "Gran Fondo / century", ultra: "Ultra-endurance", "stage-race": "Multi-day stage race" }, St = (e, t) => e === "" || e === null || e === void 0 ? null : Number.isFinite(Number(e)) && Number(e) > 0 && Number(e) <= t ? Number(e) : null;
function Et(e) {
  const t = e && typeof e == "object" ? e : {}, a = Object.hasOwn(it, String(t.discipline)) ? t.discipline : "general", s = typeof t.date == "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && !Number.isNaN((/* @__PURE__ */ new Date(t.date + "T12:00:00")).getTime()) && (/* @__PURE__ */ new Date(t.date + "T12:00:00")).toISOString().slice(0, 10) === t.date ? t.date : "";
  return {
    discipline: a,
    name: typeof t.name == "string" ? t.name.trim().slice(0, 100) : "",
    date: s,
    distanceKm: St(t.distanceKm, 5e3),
    elevationM: St(t.elevationM, 1e5),
    durationMinutes: St(t.durationMinutes, 3e4),
    stages: a === "stage-race" ? Math.max(2, Math.min(30, Math.round(Number(t.stages) || 2))) : 1,
    priority: ["A", "B", "C"].includes(String(t.priority)) ? t.priority : "A",
    objective: t.objective === "perform" ? "perform" : "finish",
    terrain: ["road", "gravel", "trail", "mixed"].includes(String(t.terrain)) ? t.terrain : "road"
  };
}
function Rt(e, t) {
  if (!e.date || e.discipline === "general") return { phase: "foundation", weeksLeft: null, description: "Build consistency, comfortable endurance and repeatable training habits." };
  const a = /* @__PURE__ */ new Date(e.date + "T12:00:00"), s = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12), l = Math.round((a.getTime() - s.getTime()) / 864e5), o = e.discipline === "stage-race" ? Math.max(2, e.stages) : 1, d = Math.max(0, Math.ceil(l / 7)), i = l < -(o - 1) ? "post-event" : l <= 0 ? "event" : l <= 7 ? "taper" : l <= 28 ? "specific" : l <= 70 ? "build" : "base";
  return { phase: i, weeksLeft: d, description: { base: "Build a sustainable aerobic foundation before race-specific sessions.", build: "Develop the power and endurance needed for your event.", specific: "Practice efforts that resemble your event while managing fatigue.", taper: "Reduce accumulated fatigue; preserve fitness and arrive ready.", event: "Event day: follow your pacing, fueling and safety plan.", "post-event": "Recover after the event before setting a new primary goal." }[i] };
}
function pn(e, t, a) {
  const { phase: s } = Rt(t, a), o = [...e.days === 2 ? [1, 4] : e.days === 3 ? [1, 3, 6] : e.days === 4 ? [1, 2, 4, 6] : e.days === 5 ? [0, 1, 3, 4, 6] : [0, 1, 2, 3, 4, 6]];
  if (o.includes(e.restDay)) {
    const R = Array.from({ length: 7 }, (w, c) => c).find((w) => w !== e.restDay && !o.includes(w));
    R !== void 0 && o.splice(o.indexOf(e.restDay), 1, R);
  }
  o.sort((R, w) => R - w);
  const d = ["criterium", "xco", "cyclocross"].includes(t.discipline), i = ["ultra", "stage-race", "xcm", "gravel", "gran-fondo"].includes(t.discipline), g = d ? "vo2" : i ? "tempo" : t.discipline === "tt" ? "sweetspot" : "tempo", p = e.experience === "beginner" ? "tempo" : g, f = s === "build" || s === "specific", I = s === "taper" || s === "post-event" || s === "event";
  return Array.from({ length: 7 }, (R, w) => {
    const c = o.indexOf(w);
    if (c < 0) return { day: w, workoutId: null, reason: "Scheduled recovery day" };
    const M = I ? c === 0 ? "recovery" : "endurance" : c === o.length - 1 ? "endurance" : c === 0 ? f ? p : "endurance" : c === 2 && f && d && e.experience === "advanced" ? "tempo" : c % 2 === 0 ? "recovery" : "endurance", E = s === "foundation" ? "General development" : it[t.discipline] + " · " + s;
    return { day: w, workoutId: M, reason: E + " preparation. " + (I ? "Keep the session easy and avoid chasing workload." : f ? "Match the event demands while maintaining recovery." : "Build consistent aerobic training.") };
  });
}
function Ke() {
  const e = ee(kt);
  return Array.isArray(e) ? e.filter((t) => t && typeof t.workout == "string" && typeof t.date == "string").slice(-150) : [];
}
const ot = (e) => {
  const t = Math.max(0, Math.ceil(e));
  return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
}, je = (e, t) => e.querySelector("#" + t);
function mn(e) {
  let a = Ie(ee(Te) || Ve), s = Et(ee(da) || hn), l = mt(a), o = "endurance", d = !1, i = null, g = "", p = null, f = [], I = null, R = [], w = null, c = "structured";
  const M = "breakaway.coach.skipped-days.v1";
  function E() {
    const r = ee(M);
    return Array.isArray(r) ? [...new Set(r.map(Ja).filter(Boolean))].slice(-90) : [];
  }
  let A = ee(Ue) === !0 || ee(Ue) === null && !!ee(Te), C = [], k = null, v = null, F = "", Y = 0, B = !1, ae = null, re = 130;
  const he = document.getElementById("screenRoute"), K = document.createElement("section");
  K.id = "breakawayCoachScreen", K.className = "coach-screen coach-v2", K.hidden = !0, K.innerHTML = `
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
      <div class="coach-calendar-heading"><span class="coach-tag">YOUR NEXT 7 DAYS</span><span class="coach-calendar-hint">Select a day for details</span></div>
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
          <label>EVENT OR GOAL TYPE<select id="coachEventDiscipline">${Object.entries(it).map(([r, h]) => '<option value="' + r + '">' + h + "</option>").join("")}</select></label>
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
`, document.body.append(K);
  const m = document.createElement("aside");
  m.id = "breakawayCoachHud", m.className = "coach-hud", m.hidden = !0, m.setAttribute("aria-label", "Live Breakaway Coach"), m.innerHTML = '<div class="coach-hud-top"><strong>◆ BREAKAWAY COACH</strong><span id="coachHudState">WAITING FOR PEDALS</span><button type="button" id="coachMinimize" aria-label="Minimize coaching panel">−</button></div><div class="coach-hud-core"><div><small>ACTUAL</small><strong id="coachActual">—<span> W</span></strong></div><div><small>TARGET</small><strong id="coachTarget">—<span> W</span></strong></div><div><small>REMAINING</small><strong id="coachRemaining">—</strong></div></div><div class="coach-interval-line"><span id="coachInterval">WARM UP</span><span id="coachSessionClock">0:00</span></div><div class="coach-progress"><div id="coachProgressBar"></div></div><p id="coachPrompt" aria-live="polite">Connect a trainer, then start pedaling.</p><div class="coach-hud-actions"><button type="button" id="coachLighter">−5% EFFORT</button><button type="button" id="coachHarder">+5% EFFORT</button><button type="button" id="coachEnd">END COACHING</button></div>', document.body.append(m);
  const n = (r) => je(K, r), T = (r) => je(m, r), x = n("coachControl"), O = ["today", "plan", "history", "settings", "import"];
  function P(r, h = !1) {
    K.querySelectorAll("[data-coach-tab]").forEach((y) => {
      const b = y.dataset.coachTab === r;
      y.setAttribute("aria-selected", String(b)), y.tabIndex = b ? 0 : -1, b && h && y.focus();
    }), K.querySelectorAll("[data-coach-view]").forEach((y) => {
      y.hidden = y.dataset.coachView !== r;
    }), K.scrollTop = 0, r === "history" && ct();
  }
  K.querySelectorAll("[data-coach-tab]").forEach((r) => {
    r.addEventListener("click", () => P(r.dataset.coachTab)), r.addEventListener("keydown", (h) => {
      const y = O.indexOf(r.dataset.coachTab);
      let b = -1;
      h.key === "ArrowRight" && (b = (y + 1) % O.length), h.key === "ArrowLeft" && (b = (y + O.length - 1) % O.length), h.key === "Home" && (b = 0), h.key === "End" && (b = O.length - 1), b >= 0 && (h.preventDefault(), P(O[b], !0));
    });
  }), K.querySelectorAll("[data-navigate-coach]").forEach((r) => r.addEventListener("click", () => {
    const h = r.dataset.navigateCoach;
    O.includes(h) && P(h, !0);
  }));
  function j() {
    if (A = ee(Ue) === !0 || ee(Ue) === null && !!ee(Te), v) {
      m.hidden = !1;
      return;
    }
    K.hidden = !1, document.body.classList.add("coach-planning"), P("today"), Se(), n("coachFtpKnown").dispatchEvent(new Event("change")), A || (c = "guided", x.value = "guided");
    const r = wt(ee(bt), xe(/* @__PURE__ */ new Date()));
    if (r) {
      n("coachFeeling").value = r.feeling;
      for (const [h, y] of [["coachBattery", r.bodyBattery], ["coachSleep", r.sleepScore], ["coachHrv", r.hrvMs]]) n(h).value = y === null ? "" : String(y);
    } else {
      n("coachFeeling").value = "okay";
      for (const h of ["coachBattery", "coachSleep", "coachHrv"]) n(h).value = "";
    }
    W(), ct(), window.scrollTo(0, 0);
  }
  function ne() {
    K.hidden = !0, document.body.classList.remove("coach-planning");
  }
  he == null || he.addEventListener("click", (r) => {
    const h = r.target;
    h instanceof Element && h.closest("#openBreakawayCoach") && j();
  }), n("coachBack").addEventListener("click", ne);
  function X(r = /* @__PURE__ */ new Date()) {
    return an(
      a,
      (k == null ? void 0 : k.settings) || va,
      s.discipline === "general" ? ua(a, !1) : pn(a, s, r),
      (h) => Math.round(V(l.find((y) => y.id === h) || l[0]) / 60)
    );
  }
  function le() {
    const r = C.map((S) => ({ start: S.start, elapsed: S.elapsed, avgPower: S.avgPower })), h = f.filter((S) => !r.some((N) => Math.abs(N.start - S.start) < 12e4)).map((S) => ({ start: S.start, elapsed: S.duration, avgPower: S.avgPower, source: "import" })), y = r.concat(h), b = Ke().filter((S) => S.mode === "classic" && S.elapsedSeconds > 0).map((S) => ({
      start: Date.parse(S.date) - S.elapsedSeconds * 1e3,
      elapsed: S.elapsedSeconds,
      avgPower: S.averageWatts,
      source: "classic"
    })).filter((S) => Number.isFinite(S.start) && !y.some((N) => Math.abs(N.start - S.start) < 12e4));
    return y.concat(b);
  }
  function Le() {
    return Ke().map((r) => ({ date: Date.parse(r.date), rpe: r.rpe }));
  }
  function Pe() {
    const r = Le().concat(((k == null ? void 0 : k.history) || []).map((h) => ({ date: Date.parse(h.date), rpe: h.rpe })));
    return Tt(a, Date.now(), A ? le() : le().map((h) => ({ ...h, avgPower: null })), r).fatigued;
  }
  function He() {
    const r = n("coachEventDiscipline").value;
    n("coachEventStagesWrap").hidden = r !== "stage-race", n("coachEventStages").disabled = r !== "stage-race", r === "stage-race" && Number(n("coachEventStages").value) < 2 && (n("coachEventStages").value = "2"), n("coachEventStageHint").hidden = r !== "stage-race", n("coachGeneralFocusWrap").hidden = r !== "general";
    const h = Et({ discipline: r, date: n("coachEventDate").value }), y = Rt(h, /* @__PURE__ */ new Date());
    n("coachGoalPhaseSummary").textContent = h.discipline === "general" ? "General fitness: build a sustainable weekly routine." : y.weeksLeft === null ? "Set an event date to calculate training phases." : y.weeksLeft + " weeks remaining · " + y.phase.toUpperCase() + " phase. " + y.description;
  }
  function Se() {
    n("coachFtp").value = String(a.ftp), n("coachFtpKnown").value = A ? "yes" : "no", n("coachHours").value = String(a.hours), n("coachDays").value = String(a.days), n("coachRestDay").value = String(a.restDay), n("coachExperience").value = a.experience, n("coachGoal").value = a.goal, n("coachEventDiscipline").value = s.discipline, n("coachEventName").value = s.name, n("coachEventDate").value = s.date, n("coachEventPriority").value = s.priority, n("coachEventObjective").value = s.objective, n("coachEventTerrain").value = s.terrain;
    for (const [r, h] of [["coachEventDistance", s.distanceKm === null ? null : Math.round(s.distanceKm / 1.609344 * 10) / 10], ["coachEventDuration", s.durationMinutes], ["coachEventElevation", s.elevationM === null ? null : Math.round(s.elevationM / 0.3048)], ["coachEventStages", s.stages]]) n(r).value = h === null ? "" : String(h);
    He();
  }
  function ye() {
    if (p) return p;
    const r = l.find((S) => S.id === o) || l[0];
    if (d) {
      const S = i;
      return S !== null && S >= 15 && S * 60 < V(r) ? yt(r, S) : r;
    }
    const h = X().days.find((S) => S.day === (/* @__PURE__ */ new Date()).getDay()), y = k != null && k.settings.enabled && (h == null ? void 0 : h.cyclingId) === r.id && h.cyclingMinutes > 0 ? h.cyclingMinutes : 1 / 0, b = Math.min(w ?? 1 / 0, y);
    return Number.isFinite(b) && b >= 15 && b * 60 < V(r) ? yt(r, b) : r;
  }
  function oe(r) {
    const h = ye(), y = h.segments[r];
    if (!y) return;
    const b = Zt(a.ftp, y);
    n("coachIntervalDetails").innerHTML = '<div class="coach-interval-identity"><span class="coach-interval-kicker">BLOCK ' + (r + 1) + " / " + h.segments.length + "</span><strong>" + D(y.name) + "</strong><small>" + b.ftpRange + '</small></div><div class="coach-interval-numbers"><div><span>DURATION</span><strong>' + b.duration + "</strong></div><div><span>POWER RANGE</span><strong>" + b.range + "</strong></div><div><span>ERG TARGET</span><strong>" + b.target + " W</strong></div></div>", n("coachSegments").querySelectorAll("[data-coach-segment]").forEach((S) => {
      S.setAttribute("aria-pressed", String(Number(S.dataset.coachSegment) === r));
    });
  }
  const ie = n("coachSegments"), ce = (r) => {
    const h = r.target;
    if (!(h instanceof Element)) return;
    const y = h.closest("[data-coach-segment]");
    y && ie.contains(y) && oe(Number(y.dataset.coachSegment));
  };
  ie.addEventListener("pointerover", ce), ie.addEventListener("focusin", ce), ie.addEventListener("click", ce);
  function de() {
    const r = n("coachCalendarStrip"), h = n("coachCalendarDetails"), y = R.findIndex((q) => q.key === I);
    r.innerHTML = R.map((q, _) => {
      const Q = q.reason.startsWith("Event stage "), Ze = q.rideName || (q.completedRide ? "Ride completed" : Q ? "Event day" : null), $e = q.isToday && (k == null ? void 0 : k.completedToday()) === !0, pe = q.strength ? $e ? "✓ Strength completed" : "Full Body Strength " + q.strength : null, Je = [Ze, pe].filter(Boolean);
      return '<button type="button" class="coach-calendar-pill' + (q.isToday ? " is-today" : "") + '" data-calendar-index="' + _ + '" aria-expanded="' + (q.key === I) + '" aria-controls="coachCalendarDetails" aria-label="' + D(q.title + ": " + (Je.join(", ") || "Rest day") + ". " + (q.key === I ? "Collapse details." : "Expand details.")) + '"><span class="coach-calendar-date">' + D(q.label) + '</span><span class="coach-calendar-activity">' + D(Ze || (pe ? "" : "Rest day")) + "</span>" + (pe ? '<span class="coach-calendar-strength">' + D(pe) + "</span>" : "") + '<span class="coach-calendar-chevron" aria-hidden="true">' + (q.key === I ? "⌃" : "⌄") + "</span></button>";
    }).join("");
    const b = R[y];
    if (h.hidden = !b, !b) {
      h.innerHTML = "";
      return;
    }
    h.setAttribute("aria-label", "Workouts for " + b.title);
    const S = b.rideId ? l.find((q) => q.id === b.rideId) : null, N = S ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">CYCLING</span><strong>' + D(S.name) + "</strong><p>" + b.rideMinutes + " min · " + D(S.description) + "</p><p>" + D(b.reason) + '</p></div><button type="button" data-calendar-action="ride" data-calendar-index="' + y + '">' + (b.isToday ? "VIEW TODAY’S RIDE" : "USE THIS RIDE TODAY (OPTIONAL)") + " →</button></div>" : b.completedRide ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">CYCLING</span><strong>Ride completed today</strong><p>Coach will account for your recorded ride.</p></div></div>' : "", U = b.isToday && (k == null ? void 0 : k.completedToday()) === !0, fe = b.strength ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">' + (U ? "STRENGTH · COMPLETED" : "STRENGTH · NO TRAINER NEEDED") + "</span><strong>Full Body Strength " + b.strength + "</strong><p>" + b.strengthMinutes + " min · Exercises matched to your saved equipment</p></div>" + (U ? "" : '<button type="button" data-calendar-action="strength" data-calendar-index="' + y + '">' + (b.isToday ? "START STRENGTH" : "START STRENGTH TODAY (OPTIONAL)") + " →</button>") + "</div>" : "", te = b.reason.startsWith("Event stage "), se = !N && !fe ? '<div class="coach-calendar-session"><div><span class="coach-calendar-type">' + (te ? "EVENT DAY" : "RECOVERY") + "</span><strong>" + (te ? "Race or stage day" : "Rest day") + "</strong><p>" + (te ? D(b.reason) : "No workout is scheduled. Recovery is part of your plan.") + "</p></div></div>" : "";
    h.innerHTML = '<div class="coach-calendar-detail-head"><div><span class="coach-calendar-type">DAY DETAILS</span><h3>' + D(b.title) + '</h3></div><button type="button" class="coach-calendar-close" data-calendar-action="close" aria-label="Close calendar day details">✕</button></div><div class="coach-calendar-detail-grid">' + N + fe + se + "</div>";
  }
  n("coachCalendarStrip").addEventListener("click", (r) => {
    var S;
    const h = r.target;
    if (!(h instanceof Element)) return;
    const y = h.closest("[data-calendar-index]");
    if (!y) return;
    const b = R[Number(y.dataset.calendarIndex)];
    b && (I = I === b.key ? null : b.key, de(), (S = n("coachCalendarStrip").querySelectorAll("[data-calendar-index]")[Number(y.dataset.calendarIndex)]) == null || S.focus());
  }), n("coachCalendarDetails").addEventListener("click", (r) => {
    var S;
    const h = r.target;
    if (!(h instanceof Element)) return;
    const y = h.closest("[data-calendar-action]");
    if (!y) return;
    if (y.dataset.calendarAction === "close") {
      const N = R.findIndex((U) => U.key === I);
      I = null, de(), N >= 0 && ((S = n("coachCalendarStrip").querySelectorAll("[data-calendar-index]")[N]) == null || S.focus());
      return;
    }
    const b = R[Number(y.dataset.calendarIndex)];
    b && (y.dataset.calendarAction === "ride" && b.rideId ? (o = b.rideId, d = !0, i = b.rideMinutes, p = null, I = null, W(), n("coachRecommendedName").scrollIntoView({ block: "center", behavior: "smooth" })) : y.dataset.calendarAction === "strength" && b.strength && Re(b.strength, b.strengthMinutes));
  });
  function W() {
    var zt, Xt;
    l = mt(a);
    const r = /* @__PURE__ */ new Date(), h = xe(r);
    h !== g && (g = h, d = !1, i = null, p = null, I = null);
    const y = le(), b = Le(), S = A ? y : y.map((u) => ({ ...u, avgPower: null })), N = wt(ee(bt), h), U = wa(N), fe = un(N, Tt(a, r.getTime(), S, b), y.some((u) => u.start >= new Date(r.getFullYear(), r.getMonth(), r.getDate()).getTime() && u.elapsed >= 900));
    n("coachReadinessLabel").textContent = fe.label, n("coachReadinessLabel").setAttribute("data-day-color", fe.color), n("coachReadinessExplanation").textContent = fe.detail + " " + U.detail;
    const te = X(r), se = dn(Jt(
      a,
      r,
      S,
      b,
      te.days.map((u) => ({ day: u.day, workoutId: u.cyclingId, reason: u.reason }))
    ), N), q = rn({
      now: r,
      week: te.days,
      rides: y,
      feedback: b,
      skipped: E(),
      ftp: a.ftp,
      ftpKnown: A,
      budgetMinutes: te.budgetMinutes,
      today: se,
      recoveryMinutes: Math.round(V(l.find((u) => u.id === "recovery")) / 60),
      planForDate: (u) => X(u).days.find((L) => L.day === u.getDay()),
      event: s.discipline !== "general" && s.date ? { startDate: s.date, stages: s.discipline === "stage-race" ? s.stages : 1 } : void 0
    }), _ = q.days.find((u) => u.key === h) ?? {
      weekday: r.getDay(),
      originalId: ((zt = te.days.find((u) => u.day === r.getDay())) == null ? void 0 : zt.cyclingId) ?? null,
      workoutId: se.workoutId,
      minutes: se.workoutId ? Math.round(V(l.find((u) => u.id === se.workoutId) || l[0]) / 60) : 0,
      status: se.status === "recovery" ? "recovery" : se.workoutId ? "planned" : "rest",
      reason: se.reason,
      strength: null,
      strengthMinutes: 0
    };
    w = _.minutes;
    const Q = {
      workoutId: _.workoutId,
      status: _.status === "completed" ? "completed" : _.status === "recovery" ? "recovery" : _.status === "rest" || _.status === "skipped" ? "rest" : "planned",
      reason: _.reason
    }, Ze = E().includes(h);
    n("coachSkipToday").textContent = Ze ? "Undo skipped session" : "Skip today's session", R = on(r, te.days, l, Q).map((u) => {
      const L = q.days.find((z) => z.key === u.key);
      if (!L) return u;
      const G = l.find((z) => z.id === L.workoutId);
      return {
        ...u,
        rideId: (G == null ? void 0 : G.id) || null,
        rideName: (G == null ? void 0 : G.name) || null,
        rideDescription: (G == null ? void 0 : G.description) || null,
        rideMinutes: L.minutes,
        strength: L.strength,
        strengthMinutes: L.strengthMinutes,
        completedRide: L.status === "completed",
        reason: L.reason
      };
    }), de();
    const $e = (u) => {
      var z, $;
      const L = ((z = l.find((Ae) => Ae.id === u.originalId)) == null ? void 0 : z.name) || (u.originalId ? "Planned ride" : "Rest day"), G = (($ = l.find((Ae) => Ae.id === u.workoutId)) == null ? void 0 : $.name) || (u.kind === "completed" ? "Ride recorded" : u.kind === "skipped" ? "Skipped" : u.kind === "missed" ? "Not completed" : u.kind === "event" ? "Race or event day" : "No ride scheduled");
      return "<li><strong>" + D(u.key) + "</strong> · " + D(L) + " (" + u.beforeMinutes + " min) → " + D(G) + " (" + u.afterMinutes + " min)<p>" + D(u.reason) + "</p></li>";
    }, pe = q.changes.filter((u) => u.key >= h), Je = n("coachAdaptiveToday");
    Je.hidden = pe.length === 0, Je.innerHTML = pe.length ? "<strong>YOUR UPDATED TRAINING WEEK · " + pe.length + " CHANGE" + (pe.length === 1 ? "" : "S") + "</strong><p>Coach accounts for extra rides and recovery without adding make-up sessions.</p><ul>" + pe.map($e).join("") + "</ul>" : "";
    const ht = q.changes.filter((u) => u.key <= q.days[6].key), Wt = n("coachAdaptiveWeek");
    Wt.hidden = ht.length === 0, Wt.innerHTML = ht.length ? "<strong>WHAT CHANGED IN YOUR WEEK</strong><p>Workout adjustments are date-specific. Your strength sessions and chosen rest day stay protected.</p><ul>" + ht.map($e).join("") + "</ul>" : "", te.days[r.getDay()];
    const pt = !!_.strength, gt = (k == null ? void 0 : k.completedToday()) || !1, Ee = pt && !_.workoutId, Yt = Pe();
    d || (o = Q.workoutId || "recovery", p = null), l.some((u) => u.id === o) || (o = "recovery", p = null);
    const Qe = !d && (!Q.workoutId || Ee);
    n("coachRestState").hidden = !Qe, n("coachWorkoutControls").hidden = Qe, n("coachRecommendedName").textContent = Qe ? _.status === "event" ? "Race / event day" : Ee ? "Strength training day" : Q.status === "completed" ? "Ride already completed" : "Rest day" : ye().name, n("coachRecommendationLabel").textContent = d ? "YOUR CHOICE" : _.status === "event" ? "EVENT DAY" : Ee ? "STRENGTH DAY" : Q.status === "recovery" ? "RECOVERY ADJUSTMENT" : Q.status === "rest" || Q.status === "completed" ? "REST RECOMMENDED" : "FROM YOUR PLAN", n("coachWhy").textContent = _.status === "event" && !d ? "Your event takes priority. There is no additional prescribed trainer ride today." : Ee && !d ? "Your plan includes strength today. No cycling workout is scheduled." : Qe ? "Coach recommends rest today." : d ? "You chose an optional alternative for today. Coach originally recommended: " + Q.reason : "Why Coach chose this: " + Q.reason;
    const et = ((Xt = te.days.find((u) => u.day === r.getDay())) == null ? void 0 : Xt.cyclingId) || null, Bt = !d && Q.status === "recovery" && et && et !== Q.workoutId;
    if (n("coachChangeDetail").hidden = !Bt, Bt) {
      const u = l.find(($) => $.id === et), L = l.find(($) => $.id === Q.workoutId), G = u ? Math.round(V(u) / 60) : null, z = L ? Math.round(V(L) / 60) : null;
      n("coachChangeDetail").innerHTML = '<strong>WHY TODAY CHANGED</strong><div class="coach-change-pair"><span>ORIGINAL: ' + D((u == null ? void 0 : u.name) || et) + (G === null ? "" : " · " + G + " min") + "</span><span>RECOMMENDED: " + D((L == null ? void 0 : L.name) || "Recovery spin") + (z === null ? "" : " · " + z + " min") + "</span></div><p>" + D(Q.reason) + "</p><p>See the updated training week for any changes to upcoming sessions. To ride the original workout today, select it under Swap workout.</p>";
    }
    n("coachRestReason").textContent = _.status === "event" ? _.reason : Ee ? "Your strength session is ready above. No trainer needed. You can still pick an optional cycling workout." : Q.reason, n("coachUseRecommendation").hidden = !d;
    const Fe = ye(), ka = V(Fe);
    n("coachWorkoutInfo").innerHTML = "<div><strong>" + D(Fe.category.toUpperCase()) + "</strong><span>" + Math.round(ka / 60) + " MINUTES · " + Fe.segments.length + " SEGMENTS</span></div><p>" + D(Fe.description) + "</p>" + (A ? "" : "<p><strong>FTP not yet established:</strong> displayed watt values are examples, not individualized targets. Keep the first ride conversational and use guided SIM mode, not ERG.</p>"), n("coachSegments").innerHTML = Fe.segments.map((u, L) => {
      const G = u.low < 0.6 ? "#86b5da" : u.low < 0.8 ? "#63d8bd" : u.low < 1 ? "#f9be70" : "#fb7489", z = Math.max(24, Math.min(100, Math.round(u.high * 80))), $ = Zt(a.ftp, u), Ae = u.name + " — " + $.duration + " duration, " + $.range + " power range, " + $.target + " W ERG target (" + $.ftpRange + ")";
      return '<button type="button" class="coach-segment" data-coach-segment="' + L + '" aria-pressed="false" aria-label="' + D(Ae) + '" title="' + D(Ae) + '" style="flex:' + u.minutes + '"><span class="coach-segment-bar" aria-hidden="true" style="height:' + z + "%;background:" + G + '"></span></button>';
    }).join(""), oe(0), x.value = c;
    const qt = Ke();
    r.getDay();
    const Gt = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"], We = Rt(s, r);
    n("coachGoalHeadlineLabel").textContent = s.discipline === "general" ? "Balanced cycling fitness" : s.name || it[s.discipline], n("coachGoalHeadlineMeta").textContent = s.discipline === "general" ? "Build consistency and endurance" : (We.phase === "event" ? "Event underway" : We.phase === "post-event" ? "Event completed" : We.weeksLeft === null ? "Set an event date" : We.weeksLeft + " weeks to go") + " · " + We.phase.toUpperCase() + " PHASE", n("coachHeaderFtp").textContent = A ? "FTP " + a.ftp + " W" : "FTP NOT SET";
    const Ut = !!ee(Te);
    n("coachFirstRun").hidden = Ut, n("coachStartLabel").textContent = Ut ? "CONNECT MY TRAINER" : "SET UP MY PLAN TO START", n("coachProfileSummary").innerHTML = "<div><strong>" + (A ? a.ftp + " W" : "Not set") + "</strong><span>FTP</span></div><div><strong>" + a.hours + " h</strong><span>Per week</span></div><div><strong>" + a.days + " days</strong><span>Training days</span></div>";
    const Kt = R.slice(1).flatMap((u) => {
      const L = [];
      return u.rideId && u.rideMinutes > 0 && L.push({ key: u.key, weekday: u.date.getDay(), name: u.rideName || "Cycling ride", type: "ride", id: u.rideId, minutes: u.rideMinutes }), u.strength && u.strengthMinutes > 0 && L.push({ key: u.key, weekday: u.date.getDay(), name: "Full Body Strength " + u.strength, type: "strength", id: u.strength, minutes: u.strengthMinutes }), L;
    }).slice(0, 3);
    n("coachNextUp").innerHTML = Kt.length ? Kt.map(
      (u) => '<button type="button" class="coach-upcoming-item" data-upcoming-key="' + u.key + '" data-upcoming-type="' + u.type + '" data-upcoming-workout="' + D(u.id) + '"><strong>' + Gt[u.weekday] + "</strong><span>" + D(u.name) + "<small>" + u.minutes + " min · " + (u.type === "ride" ? "Ride" : "Strength") + " · " + u.key + '</small></span><span aria-hidden="true">→</span></button>'
    ).join("") : '<p class="coach-small">No more workouts in your next seven days. Rest or review your plan.</p>', n("coachPlanLibrary").innerHTML = l.map((u) => {
      const L = Math.round(V(u) / 60);
      return '<button type="button" class="coach-library-item" data-library-workout="' + D(u.id) + '"><span><strong>' + D(u.name) + "</strong><small>" + D(u.category) + " · " + L + ' min</small></span><span aria-hidden="true">→</span></button>';
    }).join("");
    const jt = R.map((u) => {
      const L = q.days.find(($) => $.key === u.key), G = !!u.rideId && u.rideMinutes > 0, z = G ? l.find(($) => $.id === u.rideId) : void 0;
      return {
        key: u.key,
        weekday: u.date.getDay(),
        workoutId: G ? u.rideId : null,
        name: (z == null ? void 0 : z.name) ?? null,
        minutes: G ? u.rideMinutes : 0,
        strength: u.strength,
        strengthMinutes: u.strengthMinutes,
        status: (L == null ? void 0 : L.status) ?? "rest",
        reason: u.reason,
        changed: (L == null ? void 0 : L.changed) ?? !1,
        missingWorkout: G && !z
      };
    }), Ta = jt.reduce((u, L) => u + L.minutes + L.strengthMinutes, 0);
    n("coachPlanBudget").textContent = "Next 7 days cycling + strength: " + (Ta / 60).toFixed(1) + " h · Weekly time goal: " + (te.budgetMinutes / 60).toFixed(1) + " h · " + te.note, n("coachWeek").innerHTML = jt.map((u) => {
      const L = u.key < h, G = u.workoutId && u.name && u.minutes > 0 && !L ? '<button type="button" data-day-workout="' + D(u.workoutId) + '" data-day-key="' + u.key + '"><span><strong>🚴 ' + D(u.name) + "</strong><small>" + u.minutes + " min · " + (u.changed ? "Adjusted · " : "") + 'Classic cycling</small></span><span aria-hidden="true">→</span></button>' : u.missingWorkout ? '<span class="coach-day-warning">Workout missing from library — review your setup</span>' : u.status === "completed" ? '<span class="coach-day-rest">✓ Ride recorded</span>' : u.status === "skipped" ? '<span class="coach-day-rest">Skipped by you · not rescheduled</span>' : u.status === "missed" ? '<span class="coach-day-rest">Not completed · not rescheduled</span>' : u.status === "event" ? '<span class="coach-day-event">🏁 Event day · no indoor session scheduled</span>' : "", z = u.strength && !L ? '<button type="button" class="coach-day-strength" data-strength-day="' + u.weekday + '" data-strength-variation="' + u.strength + '"><span><strong>▥ Full Body Strength ' + u.strength + "</strong><small>" + u.strengthMinutes + " min" + (u.key === h ? "" : " · Start today (optional)") + " · " + D(((k == null ? void 0 : k.settings.equipment) || []).filter(($) => $ !== "bodyweight").join(", ") || "Bodyweight") + '</small></span><span aria-hidden="true">→</span></button>' : u.strength ? '<span class="coach-day-rest">Strength was scheduled</span>' : "";
      return '<div class="coach-day-row ' + (u.key === h ? "coach-week-today" : "") + '"><span class="coach-day-label">' + Gt[u.weekday] + "<small>" + D(u.key.slice(5)) + '</small></span><div class="coach-day-items">' + (G + z || '<span class="coach-day-rest">Rest day</span>') + (u.changed ? '<small class="coach-adaptive-inline">' + D(u.reason) + "</small>" : "") + "</div></div>";
    }).join("");
    const Ye = n("coachStrengthToday"), Vt = n("coachViewToday").querySelector(".coach-today-grid"), _t = n("coachViewToday").querySelector(".coach-today-side");
    if (Ee ? Vt.insertBefore(Ye, Vt.firstElementChild) : _t.insertBefore(Ye, _t.firstElementChild), Ye.classList.toggle("coach-strength-primary", Ee), Ye.hidden = !pt, pt) {
      const u = Ct(k.settings, _.strength, Yt);
      Ye.innerHTML = '<div class="coach-section-top"><span class="coach-tag">TODAY · STRENGTH</span><span class="coach-tag">' + (gt ? "COMPLETED" : "NO TRAINER NEEDED") + "</span></div><h3>" + D(u.title) + "</h3><p>" + _.strengthMinutes + " minutes · " + u.exercises.length + " movements · Matched to your available equipment." + (Yt ? " Recent fatigue suggests going easy or skipping." : "") + '</p><button type="button" id="coachStartStrength" ' + (gt ? "disabled" : "") + ">" + (gt ? "✓ SESSION LOGGED" : "START STRENGTH WORKOUT →") + "</button>";
    }
    n("coachStrengthHistory").innerHTML = k != null && k.history.length ? '<div class="coach-strength-history">' + k.history.slice(-6).reverse().map((u) => "<div><span><strong>" + D(u.routine) + "</strong><br>" + new Date(u.date).toLocaleDateString() + "</span><small>" + u.completedSets + "/" + u.plannedSets + " sets · " + u.minutes + " min</small></div>").join("") + "</div>" : '<p class="coach-small">Completed strength training sessions will appear here.</p>', n("coachHistory").innerHTML = qt.length ? qt.slice(-5).reverse().map((u) => '<div class="coach-history-row"><strong>' + D(u.workout) + "</strong><span>" + new Date(u.date).toLocaleDateString() + " · " + Math.round(u.elapsedSeconds / 60) + " min · " + D(u.mode.toUpperCase()) + "</span></div>").join("") : '<p class="coach-small">Your coached rides will appear here.</p>', n("coachSuggestion").textContent = Ee ? "Your strength workout is ready. No smart trainer needed." : k != null && k.settings.enabled ? "Your next workout is ready. Cycling and strength fit within your weekly time." : "Your next workout is ready. Coach considers your schedule and recent riding.", n("coachSwapList").innerHTML = l.filter((u) => u.id !== "preview").map((u) => '<button type="button" data-swap-workout="' + D(u.id) + '"><span><strong>' + D(u.name) + "</strong><small>" + D(u.category) + " · " + Math.round(V(u) / 60) + ' min</small></span><span aria-hidden="true">→</span></button>').join("");
  }
  function Ce(r, h) {
    l.some((y) => y.id === r) && (o = r, d = !0, i = null, p = null, n("coachSwapPanel").hidden = !0, n("coachSwapToggle").setAttribute("aria-expanded", "false"), W(), n("coachAnswer").textContent = h);
  }
  n("coachSkipToday").addEventListener("click", () => {
    const r = xe(/* @__PURE__ */ new Date()), h = new Set(E());
    if (h.has(r) ? h.delete(r) : h.add(r), !me(M, Array.from(h).slice(-90))) {
      n("coachStatus").textContent = "Could not save the skipped session. Check browser storage.";
      return;
    }
    d = !1, i = null, p = null, W();
  }), n("coachSwapToggle").addEventListener("click", () => {
    const r = n("coachSwapPanel");
    r.hidden = !r.hidden, n("coachSwapToggle").setAttribute("aria-expanded", String(!r.hidden));
  }), n("coachBrowseOptional").addEventListener("click", () => {
    n("coachSwapPanel").hidden = !1, n("coachSwapToggle").setAttribute("aria-expanded", "true");
  }), n("coachUseRecommendation").addEventListener("click", () => {
    d = !1, i = null, p = null, W(), n("coachAnswer").textContent = "Back to your Coach recommendation.";
  }), n("coachSwapList").addEventListener("click", (r) => {
    const h = r.target;
    if (!(h instanceof Element)) return;
    const y = h.closest("[data-swap-workout]");
    y != null && y.dataset.swapWorkout && Ce(y.dataset.swapWorkout, "Workout swapped for today. Your weekly plan has not changed.");
  }), K.querySelectorAll("[data-coach-question]").forEach((r) => r.addEventListener("click", () => {
    const h = r.dataset.coachQuestion;
    if (h === "tired") Ce("recovery", "Easy recovery selected for today. Rest instead if you feel unusually fatigued or unwell.");
    else if (h === "short") {
      const y = ye(), b = Math.max(15, Math.min(30, Math.floor(V(y) / 60 * 0.65))), S = yt(y, b);
      S === y ? n("coachAnswer").textContent = "This workout is already brief. You can swap to Recovery Spin or take a rest day." : (p = S, d = !0, W(), n("coachAnswer").textContent = "Shorter session prepared. Coach kept the power ranges and reduced interval durations.");
    } else {
      const y = X(), b = Jt(a, /* @__PURE__ */ new Date(), le(), Le(), y.days.map((S) => ({ day: S.day, workoutId: S.cyclingId, reason: S.reason })));
      n("coachAnswer").textContent = b.reason + (d ? " You have selected an alternative for today." : "");
    }
  }));
  function Re(r, h) {
    if (k != null && k.settings.enabled) {
      if (e.isRiding()) {
        alert("Finish your active cycling session before starting strength training.");
        return;
      }
      k.open(r, Pe(), h);
    }
  }
  n("coachWeek").addEventListener("click", (r) => {
    const h = r.target;
    if (!(h instanceof Element)) return;
    const y = h.closest("[data-strength-variation]");
    if (y) {
      const S = Number(y.dataset.strengthDay), U = X().days[S];
      U != null && U.strength && Re(U.strength, U.strengthMinutes);
      return;
    }
    const b = h.closest("[data-day-workout]");
    if (b != null && b.dataset.dayWorkout) {
      const S = R.find((N) => N.key === b.dataset.dayKey);
      o = b.dataset.dayWorkout, d = !0, i = (S == null ? void 0 : S.rideMinutes) ?? null, p = null, W(), P("today");
    }
  }), n("coachStrengthToday").addEventListener("click", (r) => {
    const h = r.target;
    if (!(h instanceof Element) || !h.closest("#coachStartStrength")) return;
    const b = X().days[(/* @__PURE__ */ new Date()).getDay()];
    b != null && b.strength && Re(b.strength, b.strengthMinutes);
  }), n("coachPlanLibrary").addEventListener("click", (r) => {
    const h = r.target.closest("[data-library-workout]");
    h != null && h.dataset.libraryWorkout && (o = h.dataset.libraryWorkout, d = !0, i = null, p = null, W(), P("today"));
  }), n("coachNextUp").addEventListener("click", (r) => {
    const h = r.target.closest("[data-upcoming-workout]");
    if (h != null && h.dataset.upcomingWorkout)
      if (h.dataset.upcomingType === "strength")
        P("plan", !0);
      else {
        const y = R.find((b) => b.key === h.dataset.upcomingKey);
        o = h.dataset.upcomingWorkout, d = !0, i = (y == null ? void 0 : y.rideMinutes) ?? null, p = null, W(), P("today");
      }
  }), x.addEventListener("change", () => {
    c = x.value, !A && c === "structured" && (c = "guided", x.value = "guided", n("coachStatus").textContent = "Set a reliable FTP in My Setup before selecting automatic ERG. Ride by feel is available now.");
  }), n("coachFtpKnown").addEventListener("change", () => {
    const r = n("coachFtpKnown").value === "yes";
    n("coachFtp").disabled = !r, n("coachFtpHelp").textContent = r ? "Enter the FTP from your latest reliable assessment." : "No FTP required for your first demo. Indoor rides will default to guided SIM, not automatic ERG watt targets.";
  });
  function Z(r, h, y) {
    const b = n(r);
    if (!b.value.trim()) return null;
    const S = Number(b.value);
    if (!Number.isInteger(S) || S < h || S > y) throw Error(r + " must be a whole number from " + h + " to " + y + ".");
    return S;
  }
  n("coachSaveCheckin").addEventListener("click", () => {
    try {
      const r = /* @__PURE__ */ new Date(), h = xe(r), y = {
        date: h,
        feeling: n("coachFeeling").value,
        bodyBattery: Z("coachBattery", 0, 100),
        sleepScore: Z("coachSleep", 0, 100),
        hrvMs: Z("coachHrv", 1, 300)
      }, b = wt(y, h);
      if (!b || !me(bt, b)) throw Error("Could not save check-in. Verify browser storage.");
      n("coachCheckinFeedback").textContent = "Saved for today. Your recommendation has been refreshed.", W();
    } catch (r) {
      n("coachCheckinFeedback").textContent = r instanceof Error ? r.message : "Invalid check-in.";
    }
  }), n("coachEventDiscipline").addEventListener("change", He), n("coachEventDate").addEventListener("change", He), n("coachSaveProfile").addEventListener("click", () => {
    const r = Et({ discipline: n("coachEventDiscipline").value, name: n("coachEventName").value, date: n("coachEventDate").value, priority: n("coachEventPriority").value, objective: n("coachEventObjective").value, terrain: n("coachEventTerrain").value, distanceKm: n("coachEventDistance").value ? Number(n("coachEventDistance").value) * 1.609344 : "", durationMinutes: n("coachEventDuration").value, elevationM: n("coachEventElevation").value ? Number(n("coachEventElevation").value) * 0.3048 : "", stages: n("coachEventStages").value });
    if (n("coachEventDate").value && !r.date) {
      n("coachSettingsFeedback").textContent = "Please enter a valid event date.";
      return;
    }
    const h = [["coachEventDistance", "event distance"], ["coachEventElevation", "total climbing"], ["coachEventDuration", "estimated riding time"]];
    r.discipline === "stage-race" && h.push(["coachEventStages", "number of stages"]);
    const y = h.find(([S]) => !n(S).checkValidity());
    if (y) {
      const S = n(y[0]);
      n("coachSettingsFeedback").textContent = "Please check " + y[1] + ": " + (S.validationMessage || "enter a valid value") + ".", S.focus();
      return;
    }
    if (!me(da, r)) {
      n("coachSettingsFeedback").textContent = "Could not save your event goal. Check browser storage.";
      return;
    }
    s = r;
    const b = Ie({
      ftp: Number(n("coachFtp").value),
      hours: Number(n("coachHours").value),
      days: Number(n("coachDays").value),
      restDay: Number(n("coachRestDay").value),
      experience: n("coachExperience").value,
      goal: n("coachGoal").value
    });
    if (!(k != null && k.saveSettings())) {
      n("coachSettingsFeedback").textContent = "Could not save strength equipment. Check your browser storage and try again.";
      return;
    }
    if (a = b, A = n("coachFtpKnown").value === "yes", !me(Te, a)) {
      n("coachSettingsFeedback").textContent = "Strength equipment saved, but cycling settings could not be stored. Enable browser storage and retry.";
      return;
    }
    if (!me(Ue, A)) {
      n("coachSettingsFeedback").textContent = "Could not save FTP status. Check browser storage.";
      return;
    }
    A || (c = "guided"), x.value = c, d = !1, i = null, p = null, Se(), W(), n("coachSettingsFeedback").textContent = "✓ Saved! Your cycling, strength, and weekly plan are updated.", P("today", !0), n("coachAnswer").textContent = "Your plan is saved. Coach has prepared today’s recommendation.";
  });
  function Nt() {
    (v == null ? void 0 : v.control) === "structured" && !B && e.setMode("sim");
  }
  async function ct() {
    const r = n("coachPlatformHistory");
    try {
      C = await e.getPlatformRides();
      try {
        f = await ma();
      } catch {
        f = [];
      }
      const h = C.filter((S) => Number.isFinite(S.start) && S.start >= Date.now() - 7 * 864e5 && S.start <= Date.now()), y = h.reduce((S, N) => S + Math.max(0, N.elapsed), 0) / 3600, b = ["classic", "survival", "cyclequest"];
      r.innerHTML = '<p class="coach-small">' + C.length + " locally saved rides · " + y.toFixed(1) + " hours in the last 7 days. All three riding modes contribute to your training history. Only Classic uses prescribed workouts.</p>" + b.map((S) => '<div class="coach-history-row"><strong>' + { classic: "CLASSIC", survival: "SURVIVAL", cyclequest: "CYCLE QUEST" }[S] + "</strong><span>" + h.filter((N) => N.mode === S).length + " rides · " + (h.filter((N) => N.mode === S).reduce((N, U) => N + U.elapsed, 0) / 3600).toFixed(1) + " hours this week</span></div>").join("") + '<p class="coach-small">Older rides without a mode label count toward total hours. A potential hard-game-day alert uses duration and average power, not a clinical recovery assessment.</p>', W();
    } catch (h) {
      r.textContent = "Local ride history could not be loaded: " + String(h instanceof Error ? h.message : h);
    }
  }
  function lt() {
    v && v.elapsed > 0 && !B && Ft(v, null), Nt(), v = null, B = !1, dt(), m.hidden = !0, ne();
  }
  T("coachEnd").addEventListener("click", lt), T("coachMinimize").addEventListener("click", () => {
    m.classList.toggle("coach-hud-minimized"), T("coachMinimize").textContent = m.classList.contains("coach-hud-minimized") ? "+" : "−";
  });
  function Ot(r) {
    v && (v.adjusted = Math.round(Math.min(1.25, Math.max(0.7, v.adjusted + r)) * 100) / 100, v.control === "structured" && !B && e.setTarget(Me(v.ftp, Be(v.workout, v.elapsed).segment, v.adjusted)), ut());
  }
  T("coachLighter").addEventListener("click", () => Ot(-0.05)), T("coachHarder").addEventListener("click", () => Ot(0.05));
  function Lt(r, h, y, b = !1) {
    if (v || e.isRiding()) {
      n("coachStatus").textContent = "Finish the current ride or coaching session before starting a new one.";
      return;
    }
    const N = Ma().includes(y) ? y : "structured";
    v = { workout: r, mode: h, control: N, ftp: a.ftp, elapsed: 0, adjusted: 1, measured: 0, inRange: 0, sumWatts: 0, countWatts: 0, done: !1, previousIndex: -1 }, F = "", B = b, ne(), m.hidden = !1, m.classList.remove("coach-hud-minimized"), T("coachMinimize").textContent = "−", b || (e.setMode(N === "structured" ? "target" : "sim"), N === "structured" && e.setTarget(Me(a.ftp, r.segments[0])), e.makeRoute(V(r), N === "structured"), e.launchMode("classic")), ut();
  }
  n("coachStartClassic").addEventListener("click", () => {
    if (!ee(Te)) {
      P("settings", !0);
      return;
    }
    !A && c === "structured" && (c = "guided", x.value = "guided", n("coachStatus").textContent = "FTP is not set. Starting guided ride-by-feel instead of automatic watt targets."), Lt(ye(), "classic", c);
  });
  let Xe = null;
  const ve = document.createElement("div");
  ve.id = "coachDemoControls", ve.hidden = !0, ve.innerHTML = '<label>SIMULATED POWER <input id="coachDemoPower" type="range" min="0" max="450" step="5" value="130"></label><span id="coachDemoWatts">130 W</span><button type="button" id="coachDemoStop">STOP DEMO</button>', m.append(ve), Xe = ve.querySelector("#coachDemoPower"), Xe.addEventListener("input", () => {
    re = Number(Xe.value), je(ve, "coachDemoWatts").textContent = re + " W";
  }), je(ve, "coachDemoStop").addEventListener("click", () => {
    lt(), j();
  });
  function Pt() {
    const r = mt(a).find((y) => y.id === "preview");
    re = 130, Xe.value = "130", Lt(r, "classic", c, !0), dt(), ve.hidden = !1;
    let h = performance.now();
    ae = window.setInterval(() => {
      const y = performance.now(), b = Math.min(1.5, (y - h) / 1e3);
      h = y, Ht(b, re, 85, !0);
    }, 250);
  }
  n("coachDemo").addEventListener("click", Pt), n("coachFirstRunDemo").addEventListener("click", Pt);
  function dt() {
    ae !== null && window.clearInterval(ae), ae = null, ve.hidden = !0;
  }
  function ut(r = null) {
    if (!v) return;
    const h = v.workout, y = Be(h, v.elapsed), b = y.done || v.done, S = Me(v.ftp, y.segment, v.adjusted);
    T("coachHudState").textContent = B ? "SIMULATED DEMO" : b ? "WORKOUT COMPLETE" : v.elapsed === 0 ? "WAITING FOR PEDALS" : v.control === "structured" ? "ERG CONTROL" : v.control === "guided" ? "GUIDED SIM" : "RECORD ONLY", T("coachActual").innerHTML = (r === null ? "—" : String(Math.round(r))) + "<span> W</span>", T("coachTarget").innerHTML = String(S) + "<span> W</span>", T("coachRemaining").textContent = b ? "DONE" : ot(y.remaining), T("coachInterval").textContent = y.segment.name.toUpperCase() + " · " + Math.round(y.segment.low * 100) + "–" + Math.round(y.segment.high * 100) + "% FTP", T("coachSessionClock").textContent = ot(v.elapsed) + " / " + ot(V(h)), T("coachProgressBar").style.width = Math.round(v.elapsed / V(h) * 100) + "%";
    let N = "Connect a trainer, then start pedaling.";
    B ? N = "SIMULATED telemetry only — no physical trainer or ride record." : b ? N = "Workout complete! Finish your ride when ready." : v.elapsed > 0 && r !== null && (N = $t(r, v.ftp, y.segment, v.adjusted) ? "On target. Smooth and controlled." : r < v.ftp * y.segment.low * v.adjusted ? "Below target. Build effort gradually." : "Above target. Ease back to your prescribed effort."), T("coachPrompt").textContent = N;
  }
  function Ht(r, h, y, b) {
    if (!v || v.done || !Number.isFinite(r) || r <= 0 || !b && !B || !B && (!Number.isFinite(y) || y < 10)) return;
    const S = Be(v.workout, v.elapsed);
    v.previousIndex !== S.index && (v.previousIndex = S.index, v.control === "structured" && !B && e.setTarget(Me(v.ftp, S.segment, v.adjusted)));
    const N = Math.min(3, r, V(v.workout) - v.elapsed);
    if (N <= 0) return;
    Number.isFinite(h) && h >= 0 && (v.sumWatts += h * N, v.countWatts += N, v.measured += N, $t(h, v.ftp, S.segment, v.adjusted) && (v.inRange += N)), v.elapsed += N;
    const U = Be(v.workout, v.elapsed);
    U.index !== S.index && v.control === "structured" && !B && e.setTarget(Me(v.ftp, U.segment, v.adjusted)), v.elapsed >= V(v.workout) && (v.done = !0, v.control === "structured" && !B && e.setTarget(Math.max(30, Math.round(v.ftp * 0.45))), B && dt()), (performance.now() - Y > 250 || v.done) && (Y = performance.now(), ut(h));
  }
  function Ft(r, h) {
    const y = Ke(), b = {
      id: (/* @__PURE__ */ new Date()).toISOString() + ":" + r.workout.id,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      workoutId: r.workout.id,
      workout: r.workout.name,
      mode: r.mode,
      control: r.control,
      elapsedSeconds: Math.round(r.elapsed),
      plannedSeconds: V(r.workout),
      measuredSeconds: Math.round(r.measured),
      inRangeSeconds: Math.round(r.inRange),
      averageWatts: r.countWatts ? Math.round(r.sumWatts / r.countWatts) : null,
      rpe: h,
      complete: r.done
    };
    return y.push(b), me(kt, y.slice(-150)), b;
  }
  function Sa() {
    if (!v || B) return null;
    const r = v;
    if (Nt(), v = null, m.hidden = !0, r.elapsed < 5) return null;
    F = Ft(r, null).id;
    const y = document.createElement("section");
    y.className = "coach-finish-review";
    const b = r.measured ? Math.round(r.inRange / r.measured * 100) : null;
    return y.innerHTML = "<h2>BREAKAWAY COACH / SESSION REVIEW</h2><p><strong>" + D(r.workout.name) + "</strong> · " + Math.round(r.elapsed / 60) + " minutes of " + Math.round(V(r.workout) / 60) + " planned</p><p>" + (b === null ? "No coached power adherence available." : "Time in prescribed power range: " + b + "% of measured time.") + '</p><p>How hard did the workout feel? Rate your overall effort.</p><div class="coach-rpe-buttons"><button type="button" data-coach-rpe="2">Easy</button><button type="button" data-coach-rpe="5">Moderate</button><button type="button" data-coach-rpe="8">Hard</button><button type="button" data-coach-rpe="10">Maximal</button></div><p id="coachReviewMessage">Feedback stays in this browser and informs your next suggested week.</p>', y.querySelectorAll("[data-coach-rpe]").forEach((S) => S.addEventListener("click", () => {
      const N = Number(S.dataset.coachRpe), U = Ke(), fe = U.slice().reverse().find((se) => se.id === F);
      if (!fe) return;
      fe.rpe = N, me(kt, U);
      const te = je(y, "coachReviewMessage");
      te.textContent = Ia(N), y.querySelectorAll("[data-coach-rpe]").forEach((se) => se.setAttribute("aria-pressed", String(se === S)));
    })), y;
  }
  function Ea() {
    if (!v) return null;
    const r = Be(v.workout, v.elapsed);
    return { name: v.workout.name, mode: v.mode, control: v.control, remaining: ot(r.remaining), target: Me(v.ftp, r.segment, v.adjusted), done: v.done };
  }
  return window.addEventListener("breakaway:history-updated", () => {
    ct();
  }), k = nn(n("coachStrengthSettings"), { finished: () => {
    W(), P("history");
  } }), ln(n("coachImportRoot")), Se(), W(), Qa(n("coachHistoryImport"), { applySuggestion: (r) => {
    a = Ie({ ...a, ...r }), me(Te, a), Se(), W();
  } }), { tick: Ht, finish: Sa, endCoaching: lt, snapshot: Ea, get mode() {
    return (v == null ? void 0 : v.mode) || null;
  }, get active() {
    return !!v;
  } };
}
export {
  mn as mountCoach
};
