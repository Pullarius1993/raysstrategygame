import type { BattleUnit } from '../units/BattleUnit';

/** Individual mode: one activation slot per living unit, ordered by initiative. */
export function computeUnitActivationOrder(units: BattleUnit[]): string[] {
  return [...units]
    .sort((a, b) => b.initiative - a.initiative || a.id.localeCompare(b.id))
    .map((u) => u.id);
}

/**
 * Captain mode: one activation slot per captain, ordered by that captain's
 * average troop initiative. Exact formula is not locked (doc section 10.4).
 */
export function computeCaptainActivationOrder(units: BattleUnit[]): string[] {
  const initiativeByCaptain = new Map<string, number[]>();
  for (const unit of units) {
    const list = initiativeByCaptain.get(unit.captainId) ?? [];
    list.push(unit.initiative);
    initiativeByCaptain.set(unit.captainId, list);
  }

  const captainIds = [...initiativeByCaptain.keys()];
  const averageOf = (id: string) => {
    const list = initiativeByCaptain.get(id)!;
    return list.reduce((sum, v) => sum + v, 0) / list.length;
  };

  return captainIds.sort((a, b) => averageOf(b) - averageOf(a) || a.localeCompare(b));
}
