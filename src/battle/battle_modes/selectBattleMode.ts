import { type BattleScopeTag, prototypeConfig } from '../../config/prototypeConfig';
import type { BattleMode } from '../simulation/BattleState';

/**
 * Battle mode is chosen once, when the battle begins, and never changes afterward
 * (boilerplate doc section 10.1-10.2). A scope tag overrides the raw combatant count.
 */
export function selectBattleMode(activeCombatantCount: number, scopeTag: BattleScopeTag): BattleMode {
  const override = prototypeConfig.battleScopeOverrides[scopeTag];
  if (override) return override;
  return activeCombatantCount >= prototypeConfig.captainModeThreshold ? 'captain' : 'individual';
}
