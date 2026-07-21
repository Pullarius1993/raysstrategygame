import type { BattleUnit } from '../units/BattleUnit';
import type { BattleGrid } from './BattleGrid';
import type { BattleScopeTag } from '../../config/prototypeConfig';

export type BattleMode = 'individual' | 'captain';

export interface BattleState {
  readonly grid: BattleGrid;
  readonly units: Map<string, BattleUnit>;
  round: number;
  /** Unit ids (individual mode) or captain ids (captain mode), in activation order. Fixed for the battle. */
  readonly initiativeOrder: string[];
  activeIndex: number;
  readonly mode: BattleMode;
  readonly scopeTag: BattleScopeTag;
  battleOver: boolean;
  winnerTeamId: string | null;
}
