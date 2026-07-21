import type { BattleState } from './BattleState';

export function getActiveActorId(state: BattleState): string | undefined {
  return state.initiativeOrder[state.activeIndex];
}

export function canUnitAct(state: BattleState, unitId: string): boolean {
  const unit = state.units.get(unitId);
  if (!unit || !unit.alive || !unit.canAct) return false;
  const activeActorId = getActiveActorId(state);
  return state.mode === 'individual' ? unit.id === activeActorId : unit.captainId === activeActorId;
}
