import type { BattleUnit } from '../units/BattleUnit';

/** Prototype-only melee formula (boilerplate doc section 9.4). Not locked. */
export function resolveMeleeDamage(attacker: BattleUnit, defender: BattleUnit): number {
  return Math.max(1, attacker.attack - defender.armor);
}
