import { describe, expect, it } from 'vitest';
import { hex } from '../../src/hex';
import { createBattleUnit } from '../../src/battle/units/BattleUnit';
import { BattleGrid } from '../../src/battle/simulation/BattleGrid';
import {
  attackUnit,
  createBattleState,
  endCaptainActivation,
  endUnitTurn,
  moveUnit,
} from '../../src/battle/simulation/BattleCommands';
import { selectBattleMode } from '../../src/battle/battle_modes/selectBattleMode';

function unit(id: string, teamId: string, captainId: string, atHex = hex(0, 0), overrides: Partial<Parameters<typeof createBattleUnit>[0]> = {}) {
  return createBattleUnit({
    id,
    soldierId: `soldier-${id}`,
    captainId,
    teamId,
    currentHex: atHex,
    health: 10,
    armor: 2,
    attack: 4,
    initiative: 5,
    ...overrides,
  });
}

describe('selectBattleMode', () => {
  it('uses individual initiative under the threshold', () => {
    expect(selectBattleMode(49, 'Field')).toBe('individual');
  });

  it('uses captain activation at/over the threshold', () => {
    expect(selectBattleMode(50, 'Field')).toBe('captain');
  });

  it('lets a scope tag override the raw count', () => {
    expect(selectBattleMode(40, 'SiegeAssault')).toBe('captain');
  });
});

describe('individual initiative battle', () => {
  it('rejects movement beyond range and out of turn', () => {
    const grid = new BattleGrid(6);
    const a = unit('a', 'red', 'cap-a', hex(0, 0), { initiative: 10 });
    const b = unit('b', 'blue', 'cap-b', hex(5, 0), { initiative: 1 });
    const state = createBattleState({ grid, units: [a, b], scopeTag: 'Skirmish' });

    // 'a' acts first (higher initiative).
    const outOfRange = moveUnit(state, 'a', hex(4, 0));
    expect(outOfRange.ok).toBe(false);

    const notYourTurn = moveUnit(state, 'b', hex(4, 0));
    expect(notYourTurn.ok).toBe(false);

    const validMove = moveUnit(state, 'a', hex(2, 0));
    expect(validMove.ok).toBe(true);
    expect(state.units.get('a')!.currentHex).toEqual(hex(2, 0));
  });

  it('resolves melee damage, death, and victory', () => {
    const grid = new BattleGrid(6);
    const attacker = unit('a', 'red', 'cap-a', hex(0, 0), { initiative: 10, attack: 9 });
    const defender = unit('b', 'blue', 'cap-b', hex(1, 0), { initiative: 1, health: 5, armor: 1 });
    const state = createBattleState({ grid, units: [attacker, defender], scopeTag: 'Skirmish' });

    const result = attackUnit(state, 'a', 'b');
    expect(result.ok).toBe(true);
    expect(defender.health).toBe(0);
    expect(defender.alive).toBe(false);
    expect(state.battleOver).toBe(true);
    expect(state.winnerTeamId).toBe('red');
  });

  it('limits a unit to a single move per activation', () => {
    const grid = new BattleGrid(6);
    const a = unit('a', 'red', 'cap-a', hex(0, 0), { initiative: 10 });
    const b = unit('b', 'blue', 'cap-b', hex(5, 0), { initiative: 1 });
    const state = createBattleState({ grid, units: [a, b], scopeTag: 'Skirmish' });

    const firstMove = moveUnit(state, 'a', hex(0, -1));
    expect(firstMove.ok).toBe(true);

    const secondMove = moveUnit(state, 'a', hex(0, -2));
    expect(secondMove.ok).toBe(false);
    expect(a.currentHex).toEqual(hex(0, -1));
  });

  it('limits a unit to a single attack per activation', () => {
    const grid = new BattleGrid(6);
    const a = unit('a', 'red', 'cap-a', hex(0, 0), { initiative: 10, attack: 1 });
    const b = unit('b', 'blue', 'cap-b', hex(1, 0), { initiative: 1, health: 100, armor: 0 });
    const state = createBattleState({ grid, units: [a, b], scopeTag: 'Skirmish' });

    const firstAttack = attackUnit(state, 'a', 'b');
    expect(firstAttack.ok).toBe(true);

    const secondAttack = attackUnit(state, 'a', 'b');
    expect(secondAttack.ok).toBe(false);
    expect(b.health).toBe(99);
  });

  it('refreshes move/attack allowance on the next round', () => {
    const grid = new BattleGrid(6);
    const a = unit('a', 'red', 'cap-a', hex(0, 0), { initiative: 10, attack: 1 });
    const b = unit('b', 'blue', 'cap-b', hex(1, 0), { initiative: 1, health: 100, armor: 0 });
    const state = createBattleState({ grid, units: [a, b], scopeTag: 'Skirmish' });

    attackUnit(state, 'a', 'b');
    expect(attackUnit(state, 'a', 'b').ok).toBe(false);

    endUnitTurn(state, 'a');
    endUnitTurn(state, 'b');
    expect(state.round).toBe(2);
    expect(a.hasAttacked).toBe(false);
    expect(a.hasMoved).toBe(false);

    expect(attackUnit(state, 'a', 'b').ok).toBe(true);
  });

  it('advances rounds after every unit has ended their turn', () => {
    const grid = new BattleGrid(6);
    const a = unit('a', 'red', 'cap-a', hex(0, 0), { initiative: 10 });
    const b = unit('b', 'blue', 'cap-b', hex(5, 0), { initiative: 1 });
    const state = createBattleState({ grid, units: [a, b], scopeTag: 'Skirmish' });

    expect(state.round).toBe(1);
    endUnitTurn(state, 'a');
    expect(state.round).toBe(1);
    endUnitTurn(state, 'b');
    expect(state.round).toBe(2);
    expect(a.canAct).toBe(true);
    expect(b.canAct).toBe(true);
  });
});

describe('captain activation battle', () => {
  it('lets any of the active captain\'s units act, and locks them out after ending activation', () => {
    const grid = new BattleGrid(10);
    const units = [
      unit('a1', 'red', 'cap-red', hex(0, 0), { initiative: 10 }),
      unit('a2', 'red', 'cap-red', hex(0, 1), { initiative: 9 }),
      unit('b1', 'blue', 'cap-blue', hex(5, 0), { initiative: 1 }),
    ];
    const state = createBattleState({ grid, units, scopeTag: 'SiegeAssault' });
    expect(state.mode).toBe('captain');
    expect(state.initiativeOrder[0]).toBe('cap-red');

    const move = moveUnit(state, 'a2', hex(1, 1));
    expect(move.ok).toBe(true);

    const blueBlocked = moveUnit(state, 'b1', hex(4, 0));
    expect(blueBlocked.ok).toBe(false);

    endCaptainActivation(state, 'cap-red');
    expect(state.units.get('a1')!.canAct).toBe(false);
    expect(state.units.get('a2')!.canAct).toBe(false);
    expect(state.initiativeOrder[state.activeIndex]).toBe('cap-blue');
  });

  it('still caps each individual unit to one move even while its captain is active', () => {
    const grid = new BattleGrid(10);
    const units = [
      unit('a1', 'red', 'cap-red', hex(0, 0), { initiative: 10 }),
      unit('a2', 'red', 'cap-red', hex(0, 5), { initiative: 9 }),
      unit('b1', 'blue', 'cap-blue', hex(5, 0), { initiative: 1 }),
    ];
    const state = createBattleState({ grid, units, scopeTag: 'SiegeAssault' });

    const firstMove = moveUnit(state, 'a1', hex(1, 0));
    expect(firstMove.ok).toBe(true);
    const secondMove = moveUnit(state, 'a1', hex(2, 0));
    expect(secondMove.ok).toBe(false);

    // A different unit under the same active captain can still act.
    const otherUnitMove = moveUnit(state, 'a2', hex(1, 5));
    expect(otherUnitMove.ok).toBe(true);
  });
});
