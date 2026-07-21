import type { Party } from '../parties/Party';
import type { OverworldGrid } from '../terrain/OverworldGrid';

export interface OverworldState {
  readonly grid: OverworldGrid;
  readonly parties: Map<string, Party>;
  readonly playerPartyId: string;
}
