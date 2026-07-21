import { hex } from '../../hex';
import { prototypeConfig, type BattleScopeTag } from '../../config/prototypeConfig';
import { createBattleUnit } from './BattleUnit';
import { BattleGrid } from '../simulation/BattleGrid';
import { createBattleState } from '../simulation/BattleCommands';
import type { BattleState } from '../simulation/BattleState';

/** Small Skirmish-scale test battle: two 5-troop squads on opposite sides of the grid. */
export function spawnSkirmish(): BattleState {
  const grid = new BattleGrid(prototypeConfig.battleGridRadius);
  const units = [
    ...squad('red', 'cap-red', [hex(-4, 0), hex(-4, 1), hex(-4, -1), hex(-3, 0), hex(-3, 1)]),
    ...squad('blue', 'cap-blue', [hex(4, 0), hex(4, -1), hex(4, 1), hex(3, 0), hex(3, -1)]),
  ];
  return createBattleState({ grid, units, scopeTag: 'Skirmish' });
}

/** Large-scale test battle that crosses the captain-mode threshold, to validate the mode switch. */
export function spawnFieldBattle(): BattleState {
  const grid = new BattleGrid(10);
  const leftHexes = ringOfHexes(hex(-6, 0), 26);
  const rightHexes = ringOfHexes(hex(6, 0), 26);
  const units = [...squad('red', 'cap-red', leftHexes), ...squad('blue', 'cap-blue', rightHexes)];
  const scopeTag: BattleScopeTag = 'Field';
  return createBattleState({ grid, units, scopeTag });
}

function squad(teamId: string, captainId: string, hexes: ReturnType<typeof hex>[]) {
  return hexes.map((h, i) =>
    createBattleUnit({
      id: `${teamId}-${i}`,
      soldierId: `${teamId}-soldier-${i}`,
      captainId,
      teamId,
      currentHex: h,
      health: prototypeConfig.defaultUnitHealth,
      armor: prototypeConfig.defaultUnitArmor,
      attack: prototypeConfig.defaultUnitAttack,
      initiative: prototypeConfig.defaultUnitInitiative + (i % 3),
    }),
  );
}

function ringOfHexes(center: ReturnType<typeof hex>, count: number) {
  const hexes: ReturnType<typeof hex>[] = [];
  let radius = 0;
  outer: while (hexes.length < count) {
    radius += 1;
    for (let dq = -radius; dq <= radius; dq++) {
      for (let dr = -radius; dr <= radius; dr++) {
        if (Math.max(Math.abs(dq), Math.abs(dr), Math.abs(-dq - dr)) !== radius) continue;
        hexes.push(hex(center.q + dq, center.r + dr));
        if (hexes.length >= count) break outer;
      }
    }
  }
  return hexes;
}
