import type { HexCoordinate } from '../../hex';

/** Matches boilerplate doc section 9.2, plus an `attack` stat the melee formula in 9.4 requires. */
export interface BattleUnit {
  readonly id: string;
  readonly soldierId: string;
  readonly captainId: string;
  readonly teamId: string;
  currentHex: HexCoordinate;
  health: number;
  readonly maxHealth: number;
  readonly armor: number;
  readonly attack: number;
  readonly initiative: number;
  fatigue: number;
  alive: boolean;
  canAct: boolean;
}

export interface CreateBattleUnitOptions {
  id: string;
  soldierId: string;
  captainId: string;
  teamId: string;
  currentHex: HexCoordinate;
  health: number;
  armor: number;
  attack: number;
  initiative: number;
}

export function createBattleUnit(options: CreateBattleUnitOptions): BattleUnit {
  return {
    id: options.id,
    soldierId: options.soldierId,
    captainId: options.captainId,
    teamId: options.teamId,
    currentHex: options.currentHex,
    health: options.health,
    maxHealth: options.health,
    armor: options.armor,
    attack: options.attack,
    initiative: options.initiative,
    fatigue: 0,
    alive: true,
    canAct: true,
  };
}
