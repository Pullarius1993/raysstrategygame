import { getDistance, getNeighbors, findPath, type HexCoordinate, hexKey } from '../../hex';
import { commandOk, commandRejected, type CommandResult } from '../../core/commands/CommandResult';
import { prototypeConfig, type BattleScopeTag } from '../../config/prototypeConfig';
import { resolveMeleeDamage } from '../combat/attack';
import { computeCaptainActivationOrder, computeUnitActivationOrder } from '../initiative/activationOrder';
import { selectBattleMode } from '../battle_modes/selectBattleMode';
import { canUnitAct, getActiveActorId } from './queries';
import type { BattleGrid } from './BattleGrid';
import type { BattleState } from './BattleState';
import type { BattleUnit } from '../units/BattleUnit';

export type BattleEvent =
  | { type: 'UnitMoved'; unitId: string; to: HexCoordinate }
  | { type: 'AttackResolved'; attackerId: string; defenderId: string; damage: number }
  | { type: 'UnitDied'; unitId: string }
  | { type: 'TurnEnded'; actorId: string }
  | { type: 'RoundStarted'; round: number }
  | { type: 'BattleEnded'; winnerTeamId: string | null };

export interface BattleSetup {
  grid: BattleGrid;
  units: BattleUnit[];
  scopeTag: BattleScopeTag;
}

export function createBattleState(setup: BattleSetup): BattleState {
  const aliveCount = setup.units.filter((u) => u.alive).length;
  const mode = selectBattleMode(aliveCount, setup.scopeTag);
  const initiativeOrder =
    mode === 'individual' ? computeUnitActivationOrder(setup.units) : computeCaptainActivationOrder(setup.units);

  return {
    grid: setup.grid,
    units: new Map(setup.units.map((u) => [u.id, u])),
    round: 1,
    initiativeOrder,
    activeIndex: 0,
    mode,
    scopeTag: setup.scopeTag,
    battleOver: false,
    winnerTeamId: null,
  };
}

function isOccupied(state: BattleState, h: HexCoordinate, excludingUnitId: string): boolean {
  for (const unit of state.units.values()) {
    if (unit.id !== excludingUnitId && unit.alive && unit.currentHex.q === h.q && unit.currentHex.r === h.r) {
      return true;
    }
  }
  return false;
}

export function moveUnit(state: BattleState, unitId: string, targetHex: HexCoordinate): CommandResult<BattleState, BattleEvent> {
  if (state.battleOver) return commandRejected('Battle has ended');
  if (!canUnitAct(state, unitId)) return commandRejected('This unit cannot act right now');

  const unit = state.units.get(unitId)!;
  if (unit.hasMoved) return commandRejected('This unit has already moved this turn');

  const isPassable = (h: HexCoordinate) => state.grid.isInBounds(h) && !isOccupied(state, h, unitId);

  const result = findPath(unit.currentHex, targetHex, getNeighbors, () => 1, isPassable);
  if (!result.success) return commandRejected('No path to that hex');

  const stepsNeeded = result.hexes.length - 1;
  if (stepsNeeded > prototypeConfig.defaultUnitMovementRange) return commandRejected('Target is out of movement range');

  unit.currentHex = targetHex;
  unit.hasMoved = true;
  return commandOk(state, [{ type: 'UnitMoved', unitId, to: targetHex }]);
}

export function attackUnit(
  state: BattleState,
  attackerId: string,
  defenderId: string,
): CommandResult<BattleState, BattleEvent> {
  if (state.battleOver) return commandRejected('Battle has ended');
  if (!canUnitAct(state, attackerId)) return commandRejected('This unit cannot act right now');

  const attacker = state.units.get(attackerId);
  const defender = state.units.get(defenderId);
  if (!attacker || !defender) return commandRejected('Unknown unit');
  if (attacker.hasAttacked) return commandRejected('This unit has already attacked this turn');
  if (!defender.alive) return commandRejected('Target is already down');
  if (defender.teamId === attacker.teamId) return commandRejected('Cannot attack your own team');
  if (getDistance(attacker.currentHex, defender.currentHex) !== 1) return commandRejected('Target is not adjacent');

  attacker.hasAttacked = true;
  const damage = resolveMeleeDamage(attacker, defender);
  defender.health = Math.max(0, defender.health - damage);

  const events: BattleEvent[] = [{ type: 'AttackResolved', attackerId, defenderId, damage }];

  if (defender.health === 0) {
    defender.alive = false;
    defender.canAct = false;
    events.push({ type: 'UnitDied', unitId: defenderId });
  }

  const victoryEvent = checkVictory(state);
  if (victoryEvent) events.push(victoryEvent);

  return commandOk(state, events);
}

function checkVictory(state: BattleState): BattleEvent | null {
  const aliveTeams = new Set<string>();
  for (const unit of state.units.values()) {
    if (unit.alive) aliveTeams.add(unit.teamId);
  }
  if (aliveTeams.size <= 1) {
    state.battleOver = true;
    state.winnerTeamId = aliveTeams.values().next().value ?? null;
    return { type: 'BattleEnded', winnerTeamId: state.winnerTeamId };
  }
  return null;
}

/** True if the given actor id (unit id, or captain id in captain mode) still has anyone eligible to act this round. */
function actorHasEligibleUnits(state: BattleState, actorId: string): boolean {
  if (state.mode === 'individual') {
    const unit = state.units.get(actorId);
    return !!unit && unit.alive;
  }
  for (const unit of state.units.values()) {
    if (unit.captainId === actorId && unit.alive) return true;
  }
  return false;
}

function advanceActivation(state: BattleState): { index: number; wrapped: boolean } {
  const n = state.initiativeOrder.length;
  let idx = state.activeIndex;
  let wrapped = false;

  for (let step = 0; step < n; step++) {
    idx = (idx + 1) % n;
    if (idx === 0) wrapped = true;
    if (actorHasEligibleUnits(state, state.initiativeOrder[idx])) {
      return { index: idx, wrapped };
    }
  }
  return { index: state.activeIndex, wrapped: false };
}

function startNewRoundIfNeeded(state: BattleState, wrapped: boolean, events: BattleEvent[]): void {
  if (!wrapped) return;
  state.round += 1;
  for (const unit of state.units.values()) {
    if (unit.alive) {
      unit.canAct = true;
      unit.hasMoved = false;
      unit.hasAttacked = false;
    }
  }
  events.push({ type: 'RoundStarted', round: state.round });
}

export function endUnitTurn(state: BattleState, unitId: string): CommandResult<BattleState, BattleEvent> {
  if (state.mode !== 'individual') return commandRejected('Battle is in captain activation mode');
  if (state.battleOver) return commandRejected('Battle has ended');
  if (getActiveActorId(state) !== unitId) return commandRejected("It is not this unit's turn");

  const unit = state.units.get(unitId)!;
  unit.canAct = false;

  const { index, wrapped } = advanceActivation(state);
  const events: BattleEvent[] = [{ type: 'TurnEnded', actorId: unitId }];
  state.activeIndex = index;
  startNewRoundIfNeeded(state, wrapped, events);

  return commandOk(state, events);
}

export function endCaptainActivation(state: BattleState, captainId: string): CommandResult<BattleState, BattleEvent> {
  if (state.mode !== 'captain') return commandRejected('Battle is in individual initiative mode');
  if (state.battleOver) return commandRejected('Battle has ended');
  if (getActiveActorId(state) !== captainId) return commandRejected("It is not this captain's activation");

  for (const unit of state.units.values()) {
    if (unit.captainId === captainId && unit.alive) unit.canAct = false;
  }

  const { index, wrapped } = advanceActivation(state);
  const events: BattleEvent[] = [{ type: 'TurnEnded', actorId: captainId }];
  state.activeIndex = index;
  startNewRoundIfNeeded(state, wrapped, events);

  return commandOk(state, events);
}

export function unitHexKey(unit: BattleUnit): string {
  return hexKey(unit.currentHex);
}
