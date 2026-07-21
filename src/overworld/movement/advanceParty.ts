import type { HexCoordinate } from '../../hex';
import type { OverworldGrid } from '../terrain/OverworldGrid';
import type { Party } from '../parties/Party';

/** Seconds of travel time per unit of terrain movement cost. Prototype tuning value. */
export const SECONDS_PER_MOVEMENT_COST = 0.6;

/** Advances a party along its stored path by deltaSeconds, mutating it in place. Returns hexes entered this tick. */
export function advanceParty(party: Party, grid: OverworldGrid, deltaSeconds: number): HexCoordinateEnteredEvent[] {
  const entered: HexCoordinateEnteredEvent[] = [];
  if (party.movementPath.length === 0) return entered;

  party.movementProgress += deltaSeconds;

  while (party.movementPath.length > 0) {
    const nextHex = party.movementPath[0];
    const cost = grid.getMovementCost(party.currentHex, nextHex);
    const timeRequired = cost * SECONDS_PER_MOVEMENT_COST;

    if (party.movementProgress < timeRequired) break;

    party.movementProgress -= timeRequired;
    party.currentHex = nextHex;
    party.movementPath.shift();
    entered.push({ partyId: party.id, hex: nextHex });
  }

  if (party.movementPath.length === 0) {
    party.movementProgress = 0;
  }

  return entered;
}

export interface HexCoordinateEnteredEvent {
  readonly partyId: string;
  readonly hex: HexCoordinate;
}
