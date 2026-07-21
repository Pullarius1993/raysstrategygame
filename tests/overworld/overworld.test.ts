import { describe, expect, it } from 'vitest';
import { hex } from '../../src/hex';
import { OverworldGrid } from '../../src/overworld/terrain/OverworldGrid';
import { createParty } from '../../src/overworld/parties/Party';
import { selectDestination, tickOverworld } from '../../src/overworld/simulation/OverworldCommands';
import type { OverworldState } from '../../src/overworld/simulation/OverworldState';
import { SECONDS_PER_MOVEMENT_COST } from '../../src/overworld/movement/advanceParty';

function buildState(): OverworldState {
  const grid = new OverworldGrid(10, 10);
  for (const h of grid.allHexes()) {
    grid.setTerrain(h, 'Plains');
  }
  const party = createParty('player', 'player-captain', hex(0, 0), 10);
  return { grid, parties: new Map([[party.id, party]]), playerPartyId: party.id };
}

describe('overworld simulation', () => {
  it('rejects a destination with no valid path when surrounded by water', () => {
    const state = buildState();
    for (const h of state.grid.allHexes()) {
      if (h.q !== 0 || h.r !== 0) state.grid.setTerrain(h, 'Water');
    }
    const result = selectDestination(state, 'player', hex(3, 0));
    expect(result.ok).toBe(false);
  });

  it('moves the party toward the target over time', () => {
    const state = buildState();
    const result = selectDestination(state, 'player', hex(2, 0));
    expect(result.ok).toBe(true);

    const party = state.parties.get('player')!;
    expect(party.movementPath.length).toBeGreaterThan(0);

    // Plains cost 1 each; advance enough time to cross both hexes.
    tickOverworld(state, SECONDS_PER_MOVEMENT_COST * 2 + 0.01);

    expect(party.currentHex).toEqual(hex(2, 0));
    expect(party.movementPath).toHaveLength(0);
  });

  it('higher terrain cost takes proportionally longer to cross', () => {
    const state = buildState();
    state.grid.setTerrain(hex(1, 0), 'Mountains'); // cost 4
    selectDestination(state, 'player', hex(1, 0));

    const party = state.parties.get('player')!;
    tickOverworld(state, SECONDS_PER_MOVEMENT_COST * 2); // not enough for cost-4 hex
    expect(party.currentHex).toEqual(hex(0, 0));

    tickOverworld(state, SECONDS_PER_MOVEMENT_COST * 3); // now enough (total 5 > 4)
    expect(party.currentHex).toEqual(hex(1, 0));
  });
});
