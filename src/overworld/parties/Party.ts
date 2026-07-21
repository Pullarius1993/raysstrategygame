import type { HexCoordinate } from '../../hex';

/** Matches the boilerplate doc section 8.3 schema; unused fields default and stay for future use. */
export interface Party {
  readonly id: string;
  readonly captainId: string;
  currentHex: HexCoordinate;
  movementPath: HexCoordinate[];
  /** Accumulated seconds of travel progress toward entering the next hex in movementPath. */
  movementProgress: number;
  fatigue: number;
  carriedWeight: number;
  mountFactor: number;
  troopCount: number;
}

export function createParty(id: string, captainId: string, startHex: HexCoordinate, troopCount: number): Party {
  return {
    id,
    captainId,
    currentHex: startHex,
    movementPath: [],
    movementProgress: 0,
    fatigue: 0,
    carriedWeight: 0,
    mountFactor: 1,
    troopCount,
  };
}
