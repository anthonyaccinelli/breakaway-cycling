import { levelFromXP } from '/api/cycle-quest?asset=progression.js';
export const slots = ['Frame', 'Seat', 'Pedals', 'Wheels', 'Tires'];
// What each slot improves. Frame + Seat add HP, Pedals + Wheels add attack, Tires make
// stamina last longer (see staminaEfficiency).
export const SLOT_STATS = ['HP', 'HP', 'ATTACK', 'ATTACK', 'STAMINA'];
const SLOT_COUNT = slots.length,
  PART_COUNT = SLOT_COUNT * 3;
// Bikes saved before Tires existed have 4 slots and 12 parts; bikeFor adds stock tires.
const LEGACY_SLOTS = 4;
export const catalog = [
  ['Steel Frame', 'Trail Frame', 'Road Frame'],
  ['Touring Seat', 'Endurance Seat', 'Race Seat'],
  ['Standard Pedals', 'Trail Pedals', 'Race Pedals'],
  ['Standard Wheels', 'Trail Wheels', 'Road Wheels'],
  ['Standard Tires', 'Trail Tires', 'Race Tires']
].flatMap((names, slot) => names.map((name, variant) => ({ id: slot * 3 + variant, name, slot })));
export const grades = ['Stock', 'Bronze', 'Silver', 'Gold', 'Platinum'];
const prices = [800, 550, 700, 650, 600];
// Each grade above Stock adds GRADE_BONUS% and each upgrade adds UPGRADE_BONUS% to the part's stat.
export const GRADE_BONUS = 10;
export const UPGRADE_BONUS = 2.5;
// Tires count half: stamina drain is divided, and refill multiplied, by 1 + bonus × 0.5
// (a Gold +0 tire, +30%, gives ×1.15).
export const TIRE_WEIGHT = 0.5;
export const unlockedGrade = rider => Math.min(4, Math.max(1, rider.chapter));
export function riderLevel(rider) {
  return levelFromXP(rider.xp);
}
const validTier = n => Number.isInteger(n) && n >= 0 && n <= 50;
export function validBike(bike) {
  if (!bike || !Array.isArray(bike.tiers) || !bike.tiers.every(validTier)) return false;
  const count = bike.tiers.length;
  if (count !== SLOT_COUNT && count !== LEGACY_SLOTS) return false;
  if (
    bike.roadsideRemaining !== undefined &&
    (!Number.isFinite(bike.roadsideRemaining) || bike.roadsideRemaining < 0 || bike.roadsideRemaining > 8)
  )
    return false;
  if (!Number.isSafeInteger(bike.shopStop) || bike.shopStop < 0) return false;
  if (bike.owned === undefined && bike.equipped === undefined) return true;
  if (
    !Array.isArray(bike.owned) ||
    bike.owned.length !== count * 3 ||
    !bike.owned.every(n => n === null || validTier(n))
  )
    return false;
  if (
    bike.grades !== undefined &&
    (!Array.isArray(bike.grades) ||
      bike.grades.length !== count * 3 ||
      !bike.grades.every(n => Number.isInteger(n) && n >= 0 && n <= 4))
  )
    return false;
  return (
    Array.isArray(bike.equipped) &&
    bike.equipped.length === count &&
    bike.equipped.every(
      (id, slot) =>
        Number.isInteger(id) &&
        catalog[id]?.slot === slot &&
        bike.owned[id] !== null &&
        bike.tiers[slot] === bike.owned[id]
    )
  );
}
export function bikeFor(rider) {
  const bike = (rider.bike ??= { tiers: Array(SLOT_COUNT).fill(0), shopStop: 0 });
  // Older bikes: fill in missing slots (Tires) with stock parts.
  while (bike.tiers.length < SLOT_COUNT) bike.tiers.push(0);
  if (!bike.owned) {
    bike.owned = catalog.map(part => (part.id % 3 === 0 ? bike.tiers[part.slot] : null));
    bike.equipped = slots.map((_, i) => i * 3);
  }
  while (bike.owned.length < PART_COUNT) bike.owned.push(bike.owned.length % 3 === 0 ? 0 : null);
  while (bike.equipped.length < SLOT_COUNT) bike.equipped.push(bike.equipped.length * 3);
  bike.grades ??= [];
  while (bike.grades.length < PART_COUNT) bike.grades.push(0);
  return bike;
}
export function partBonus(bike, id) {
  return GRADE_BONUS * (bike.grades?.[id] || 0) + UPGRADE_BONUS * (bike.owned[id] || 0);
}
export function multiplier(bike, slot) {
  if (!bike?.owned)
    return 1 + (UPGRADE_BONUS / 100) * ((bike?.tiers[slot] ?? 0) + (bike?.tiers[slot + 1] ?? 0));
  return 1 + (partBonus(bike, bike.equipped[slot]) + partBonus(bike, bike.equipped[slot + 1])) / 100;
}
// Stamina efficiency from the equipped tires: drain is divided by it and refill multiplied.
export function staminaEfficiency(bike) {
  const slot = SLOT_COUNT - 1;
  if (!bike) return 1;
  const bonus = bike.owned
    ? bike.equipped[slot] === undefined
      ? 0
      : partBonus(bike, bike.equipped[slot])
    : UPGRADE_BONUS * (bike.tiers[slot] ?? 0);
  return 1 + (bonus * TIRE_WEIGHT) / 100;
}
export function partPrice(bike, id, action = 'upgrade', grade = 1) {
  if (action === 'buy') return prices[catalog[id].slot] * grade;
  if (action === 'promote') return prices[catalog[id].slot] * (grade - bike.grades[id]);
  return 100 * ((bike.owned[id] ?? 0) + 1);
}
export function changePart(rider, id, action, grade = 1) {
  const part = catalog[id];
  if (!part || !['buy', 'upgrade', 'equip', 'promote'].includes(action)) return false;
  const bike = bikeFor(rider),
    owned = bike.owned[id];
  if (action === 'equip') {
    if (owned === null) return false;
    bike.equipped[part.slot] = id;
    bike.tiers[part.slot] = owned;
    return true;
  }
  if (!Number.isInteger(grade) || grade < 1 || grade > unlockedGrade(rider)) return false;
  if (action === 'buy' && owned !== null) return false;
  if (action === 'upgrade' && (owned === null || owned >= Math.min(50, riderLevel(rider)))) return false;
  if (action === 'promote' && (owned === null || grade <= bike.grades[id])) return false;
  const price = partPrice(bike, id, action, grade);
  if (rider.coins < price) return false;
  rider.coins -= price;
  if (action === 'buy') {
    bike.owned[id] = 0;
    bike.grades[id] = grade;
  }
  if (action === 'promote') bike.grades[id] = grade;
  if (action === 'upgrade') bike.owned[id]++;
  if (bike.equipped[part.slot] === id) bike.tiers[part.slot] = bike.owned[id];
  return true;
}
export function exploreRoadside(rider, miles, random = Math.random) {
  if (!Number.isFinite(miles) || miles <= 0) return null;
  const bike = bikeFor(rider);
  bike.roadsideRemaining ??= 4 + 4 * random();
  bike.roadsideRemaining = Math.max(0, bike.roadsideRemaining - miles);
  if (bike.roadsideRemaining > 0) return null;
  bike.roadsideRemaining = 4 + 4 * random();
  const repair = random() < 0.5;
  let text = repair ? 'Mechanic · +25% HP' : '';
  if (!repair || random() < 0.2) {
    const available = catalog.filter(p => bike.owned[p.id] === null);
    if (available.length) {
      const part = available[Math.floor(random() * available.length)];
      bike.owned[part.id] = 0;
      bike.grades[part.id] = 0;
      text += (repair ? ' + ' : 'Found ') + part.name + ' · stored';
    } else {
      rider.coins += 50;
      text += (repair ? ' + ' : 'Salvaged parts · ') + '50 coins';
    }
  }
  return { repair, text };
}
