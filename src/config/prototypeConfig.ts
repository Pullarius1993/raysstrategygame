/**
 * Prototype tuning variables, kept out of gameplay code per the boilerplate
 * doc (section 25). Edit these during playtesting instead of hunting through
 * simulation modules.
 */

export type TerrainType = 'Plains' | 'Forest' | 'Hills' | 'Mountains' | 'Marsh' | 'Road' | 'Water';

export interface TerrainDefinition {
  readonly movementCost: number;
  readonly passable: boolean;
  readonly visualCategory: string;
}

export const terrainDefinitions: Record<TerrainType, TerrainDefinition> = {
  Plains: { movementCost: 1, passable: true, visualCategory: 'plains' },
  Forest: { movementCost: 2, passable: true, visualCategory: 'forest' },
  Hills: { movementCost: 2, passable: true, visualCategory: 'hills' },
  Mountains: { movementCost: 4, passable: true, visualCategory: 'mountains' },
  Marsh: { movementCost: 3, passable: true, visualCategory: 'marsh' },
  Road: { movementCost: 0.75, passable: true, visualCategory: 'road' },
  Water: { movementCost: 1, passable: false, visualCategory: 'water' },
};

export type BattleScopeTag = 'Personal' | 'Skirmish' | 'Field' | 'SiegeAssault' | 'Keep';

export const prototypeConfig = {
  /** 49 or fewer active combatants -> individual initiative; 50+ -> captain activation. */
  captainModeThreshold: 50,

  /**
   * Scope tags may force a battle mode regardless of raw combatant count
   * (doc example: a 40-person SiegeAssault may use captain mode even though
   * it's under threshold). Tags absent from this map fall back to the
   * count-based default in selectBattleMode.
   */
  battleScopeOverrides: {
    SiegeAssault: 'captain',
  } as Partial<Record<BattleScopeTag, 'individual' | 'captain'>>,

  /** Battle rounds at which a new reinforcement wave may enter. */
  reinforcementPhases: [3, 6, 9],

  /** Milliseconds after battle start during which reinforcements remain eligible to arrive. */
  reinforcementWindowDurationMs: 90_000,

  defaultUnitHealth: 10,
  defaultUnitArmor: 2,
  defaultUnitInitiative: 5,
  defaultUnitAttack: 4,
  defaultUnitMovementRange: 3,

  /** Tactical battle grid radius, in hexes, for the prototype battlefield. */
  battleGridRadius: 6,

  /** Overworld grid dimensions for the prototype map. */
  overworldWidth: 20,
  overworldHeight: 20,

  hexPixelSize: 32,
} as const;
