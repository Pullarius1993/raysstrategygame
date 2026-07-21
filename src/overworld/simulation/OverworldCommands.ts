import { type HexCoordinate, findPath, getNeighbors } from '../../hex';
import { commandOk, commandRejected } from '../../core/commands/CommandResult';
import type { CommandResult } from '../../core/commands/CommandResult';
import { advanceParty, type HexCoordinateEnteredEvent } from '../movement/advanceParty';
import type { OverworldState } from './OverworldState';

export type OverworldEvent = HexCoordinateEnteredEvent | { type: 'PathRejected'; partyId: string };

/** Command: set a party's destination. Validates via pathfinding + terrain rules; does not move the party immediately. */
export function selectDestination(
  state: OverworldState,
  partyId: string,
  targetHex: HexCoordinate,
): CommandResult<OverworldState, OverworldEvent> {
  const party = state.parties.get(partyId);
  if (!party) return commandRejected(`Unknown party: ${partyId}`);

  const result = findPath(
    party.currentHex,
    targetHex,
    getNeighbors,
    (from, to) => state.grid.getMovementCost(from, to),
    (h) => state.grid.isPassable(h),
  );

  if (!result.success) {
    return commandRejected('No valid path to that hex');
  }

  // First entry in the path is the party's current hex; drop it so movementPath is hexes still to enter.
  party.movementPath = result.hexes.slice(1);
  party.movementProgress = 0;

  return commandOk(state, [{ partyId, hex: targetHex }]);
}

/** Advances all parties along their stored paths by deltaSeconds. */
export function tickOverworld(state: OverworldState, deltaSeconds: number): OverworldEvent[] {
  const events: OverworldEvent[] = [];
  for (const party of state.parties.values()) {
    events.push(...advanceParty(party, state.grid, deltaSeconds));
  }
  return events;
}
