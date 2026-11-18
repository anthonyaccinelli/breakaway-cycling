export const METERS_PER_MILE = 1609.344;
export function sample(route, m) {
  const a = route.points;
  m = Math.max(0, Math.min(route.distance, m));
  let lo = 0,
    hi = a.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid].d <= m) lo = mid;
    else hi = mid;
  }
  const f = (m - a[lo].d) / Math.max(0.001, a[hi].d - a[lo].d);
  return a[lo].e + (a[hi].e - a[lo].e) * f;
}
export function grade(route, m) {
  if (!route.hasElevation) return 0;
  const a = Math.max(0, m - 40),
    b = Math.min(route.distance, m + 40);
  return b > a ? (100 * (sample(route, b) - sample(route, a))) / (b - a) : 0;
}
// Port of Classic's seeded hill-segment generator. Hills have independent
// lengths, directions, steepness and asymmetric crests, with coherent roughness.
export function generateRoute(
  miles = 15,
  terrain = 'rolling',
  gainFeet = null,
  seed = Math.floor(Math.random() * 1000000000),
  { smooth = true } = {}
) {
  if (!Number.isFinite(miles) || miles < 1 || miles > 100)
    throw Error('Choose a distance between 1 and 100 miles.');
  if (gainFeet !== null && (!Number.isFinite(gainFeet) || gainFeet < 0 || gainFeet > 30000))
    throw Error('Choose elevation gain between 0 and 30,000 ft, or leave it blank for natural terrain.');
  const kind = terrain === 'climbing' ? 'mountain' : terrain;
  const config = {
    flat: [220, 1100, 0.4, 2.2],
    rolling: [230, 1550, 1.8, 7.5],
    mountain: [450, 3100, 3, 10.5],
    punchy: [130, 950, 2.5, 11]
  }[kind];
  if (!config) throw Error('Choose a valid terrain type.');
  const distance = miles * METERS_PER_MILE,
    hills = [];
  const random01 = (index, salt) => {
    let n =
      (Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(seed | 0, 0x85ebca6b) ^ Math.imul(salt, 0xc2b2ae35)) | 0;
    n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
    n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  while (!hills.length || hills.at(-1).end < distance) {
    const i = hills.length,
      start = i ? hills.at(-1).end : 0,
      length = config[0] + (config[1] - config[0]) * random01(i, 1) ** 1.25,
      sign =
        i === 0
          ? random01(i, 2) < 0.5
            ? 1
            : -1
          : random01(i, 2) < 0.78
            ? -hills.at(-1).sign
            : hills.at(-1).sign,
      peak = config[2] + (config[3] - config[2]) * random01(i, 3) ** 1.35;
    hills.push({
      start,
      end: start + length,
      sign,
      peak,
      skew: 0.25 + 0.5 * random01(i, 4),
      rough: random01(i, 5)
    });
  }
  const noise = (m, spacing, salt) => {
    const cell = Math.floor(m / spacing),
      f = m / spacing - cell,
      t = f * f * (3 - 2 * f);
    return 2 * (random01(cell, salt) * (1 - t) + random01(cell + 1, salt) * t) - 1;
  };
  const rawGrade = m => {
    let lo = 0,
      hi = hills.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (hills[mid].end <= m) lo = mid + 1;
      else hi = mid;
    }
    const h = hills[lo],
      t = Math.max(0, Math.min(1, (m - h.start) / (h.end - h.start))),
      crest = t < h.skew ? t / h.skew : (1 - t) / (1 - h.skew),
      envelope = Math.max(0, Math.sin((Math.PI * crest) / 2)) ** (0.65 + 1.2 * h.rough),
      undulation = 0.4 * noise(m, 920, 21) + 0.34 * noise(m, 310, 22) + 0.26 * noise(m, 95, 23),
      roughness = kind === 'flat' ? 0.45 : kind === 'mountain' ? 1.45 : 1.1;
    return h.sign * h.peak * envelope + undulation * roughness;
  };
  const n = Math.min(999, Math.ceil(distance / 80)),
    step = distance / n,
    rawGrades = Array.from({ length: n }, (_, i) => rawGrade((i + 0.5) * step)),
    // Indoors, quick ups and downs mean constant shifting and a jumpy power number. Smoothing
    // averages the grade over about 1.2 km, then the scale below restores the same total ascent.
    window = smooth ? Math.max(1, Math.round(1200 / step)) : 0,
    grades = window
      ? rawGrades.map((_, i) => {
          let total = 0,
            count = 0;
          for (let j = Math.max(0, i - window); j <= Math.min(n - 1, i + window); j++) {
            const w = window + 1 - Math.abs(i - j);
            total += rawGrades[j] * w;
            count += w;
          }
          return total / count;
        })
      : rawGrades;
  const bounded = (g, scale) => Math.max(-12, Math.min(12, g * scale));
  const estimate = scale =>
    grades.reduce((total, g) => total + (Math.max(0, bounded(g, scale)) * step) / 100, 0);
  let scale = 1;
  // Natural terrain keeps the ascent the unsmoothed hills would have had.
  const naturalGain = rawGrades.reduce(
    (t, g) => t + (Math.max(0, Math.max(-12, Math.min(12, g))) * step) / 100,
    0
  );
  if (gainFeet !== null || window) {
    const target = gainFeet !== null ? gainFeet * 0.3048 : naturalGain;
    if (target === 0) scale = 0;
    else {
      let lo = 0,
        hi = 1;
      while (estimate(hi) < target && hi < 1000000) hi *= 2;
      if (estimate(hi) + 0.01 < target)
        throw Error(
          'Requested ascent exceeds the 12% grade limit for this route. Try more miles, less ascent, or natural terrain.'
        );
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (estimate(mid) < target) lo = mid;
        else hi = mid;
      }
      scale = (lo + hi) / 2;
    }
  }
  const points = [{ d: 0, e: 600 }];
  let gain = 0;
  for (let i = 0; i < n; i++) {
    const delta = (bounded(grades[i], scale) * step) / 100;
    gain += Math.max(0, delta);
    points.push({ d: i === n - 1 ? distance : (i + 1) * step, e: points.at(-1).e + delta });
  }
  const min = Math.min(...points.map(p => p.e));
  if (min < 100) for (const p of points) p.e += 100 - min;
  const title = { flat: 'Flat', rolling: 'Rolling', mountain: 'Mountainous', punchy: 'Punchy' }[kind];
  return {
    name: title + ' adventure',
    distance,
    gain,
    hasElevation: true,
    seed,
    terrain: kind,
    generator: smooth ? 'classic-hills-v2-smooth' : 'classic-hills-v1',
    points
  };
}
// Climbs on a route, for summit bosses: a rise of at least 1 km at 3% or more, allowing dips
// of up to 250 m inside it. Returns [{ start, end, gain, grade }] in metres along the route.
export function routeClimbs(route, { minLength = 1000, minGrade = 3 } = {}) {
  if (!route?.points?.length || !(route.distance > 0)) return [];
  const step = 100,
    D = [],
    E = [];
  for (let d = 0; d <= route.distance; d += step) {
    D.push(d);
    E.push(sample(route, d));
  }
  const out = [];
  let start = -1,
    last = -1;
  const commit = () => {
    if (start < 0 || last <= start) return;
    const length = D[last] - D[start],
      gain = E[last] - E[start],
      grade = (100 * gain) / length;
    if (length >= minLength && grade >= minGrade) out.push({ start: D[start], end: D[last], gain, grade });
  };
  for (let i = 1; i < E.length; i++) {
    if (E[i] - E[i - 1] > 0.2) {
      if (start < 0) start = i - 1;
      last = i;
    } else if (start >= 0 && (i - last) * step > 250) {
      commit();
      start = last = -1;
    }
  }
  commit();
  return out;
}
// Where summit bosses wait: the tops of the route's biggest climbs. About one per 25 miles on
// long routes (at most five), one per 8 miles on short ones, spread out along the route.
// Returns climb-top distances in metres, in route order.
export function routeSummits(route) {
  const miles = (route?.distance || 0) / METERS_PER_MILE;
  if (!(miles > 0)) return [];
  const count = Math.max(1, Math.min(5, Math.round(miles >= 25 ? miles / 25 : miles / 8)));
  // Prefer real climbs; on flat routes fall back to the longest gentle rises.
  let climbs = routeClimbs(route, { minLength: 800, minGrade: 1.5 }).filter(c => c.gain >= 25);
  if (climbs.length < count)
    climbs = routeClimbs(route, { minLength: 600, minGrade: 0.8 }).filter(c => c.gain >= 10);
  const spacing = Math.max(3, miles / (count * 2)) * METERS_PER_MILE;
  const picked = [];
  // Not in the first or last mile: the ride is just starting, or the chapter boss waits there.
  climbs = climbs.filter(c => c.end > METERS_PER_MILE && c.end < route.distance - METERS_PER_MILE);
  for (const c of [...climbs].sort((a, b) => b.gain - a.gain)) {
    if (picked.length >= count) break;
    if (picked.every(p => Math.abs(p.end - c.end) >= spacing)) picked.push(c);
  }
  return picked.map(c => c.end).sort((a, b) => a - b);
}
export function parseGPX(text) {
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  if (xml.querySelector('parsererror')) throw Error('This file is not valid GPX XML.');
  const local = (parent, name) => Array.from(parent.getElementsByTagNameNS('*', name));
  let groups = local(xml, 'trkseg').map(el => local(el, 'trkpt'));
  if (!groups.length) {
    const routes = local(xml, 'rte');
    groups = routes.map(el => local(el, 'rtept'));
  }
  if (!groups.length) throw Error('No GPX track or route points found.');
  const points = [];
  let distance = 0,
    gain = 0,
    hasElevation = true;
  let total = 0;
  for (const group of groups) {
    let prev = null;
    for (const el of group) {
      if (++total > 100000) throw Error('GPX is too large: maximum 100,000 points.');
      let lat = Number(el.getAttribute('lat')),
        lon = Number(el.getAttribute('lon'));
      if (
        !el.hasAttribute('lat') ||
        !el.hasAttribute('lon') ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        Math.abs(lat) > 90 ||
        Math.abs(lon) > 180
      )
        throw Error('GPX contains an invalid coordinate.');
      const ele = local(el, 'ele')[0],
        e = ele ? Number(ele.textContent) : 0;
      if (!ele || !Number.isFinite(e)) hasElevation = false;
      const p = { lat, lon, e: Number.isFinite(e) ? e : 0 };
      if (prev) {
        const rad = Math.PI / 180,
          a = (p.lat - prev.lat) * rad,
          b = (p.lon - prev.lon) * rad,
          h = Math.sin(a / 2) ** 2 + Math.cos(prev.lat * rad) * Math.cos(p.lat * rad) * Math.sin(b / 2) ** 2;
        const delta = 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
        distance += delta;
        gain += Math.max(0, p.e - prev.e);
      }
      if (!points.length || distance > points[points.length - 1].d) points.push({ d: distance, e: p.e });
      prev = p;
    }
  }
  if (points.length < 2 || distance < 10)
    throw Error('GPX needs at least two distinct points and 10 meters of distance.');
  if (!hasElevation) {
    points.forEach(p => (p.e = 0));
    gain = 0;
  }
  const track = local(xml, 'trk')[0] || local(xml, 'rte')[0];
  const name = track ? local(track, 'name')[0]?.textContent : 'Uploaded route';
  const route = {
    name: (name || 'Uploaded route').trim().slice(0, 80),
    distance,
    gain,
    hasElevation,
    points
  };
  if (points.length > 1000)
    route.points = Array.from({ length: 1000 }, (_, i) => {
      const d = (i / 999) * distance;
      return { d, e: sample(route, d) };
    });
  return route;
}
