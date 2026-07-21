import { describe, expect, it } from 'vitest';
import {
  addHex,
  createHexLayout,
  getDistance,
  getNeighbors,
  hex,
  hexEquals,
  hexToWorldPosition,
  subtractHex,
  worldPositionToHex,
} from '../../src/hex';
import { findPath } from '../../src/hex/pathfinding/findPath';

describe('hex coordinates', () => {
  it('adds and subtracts axial coordinates', () => {
    const a = hex(1, 2);
    const b = hex(3, -1);
    expect(addHex(a, b)).toEqual(hex(4, 1));
    expect(subtractHex(addHex(a, b), b)).toEqual(a);
  });

  it('returns exactly 6 unique neighbors', () => {
    const neighbors = getNeighbors(hex(0, 0));
    expect(neighbors).toHaveLength(6);
    const keys = new Set(neighbors.map((n) => `${n.q},${n.r}`));
    expect(keys.size).toBe(6);
  });

  it('distance to self is zero', () => {
    expect(getDistance(hex(2, -3), hex(2, -3))).toBe(0);
  });

  it('distance is symmetric', () => {
    const a = hex(0, 0);
    const b = hex(4, -2);
    expect(getDistance(a, b)).toBe(getDistance(b, a));
  });

  it('adjacent hexes are distance 1', () => {
    const origin = hex(0, 0);
    for (const neighbor of getNeighbors(origin)) {
      expect(getDistance(origin, neighbor)).toBe(1);
    }
  });
});

describe('hex <-> world position conversion', () => {
  it('round-trips through world position and back to the same hex', () => {
    const layout = createHexLayout(32);
    const original = hex(3, -2);
    const world = hexToWorldPosition(layout, original);
    const roundTripped = worldPositionToHex(layout, world);
    expect(hexEquals(roundTripped, original)).toBe(true);
  });
});

describe('findPath', () => {
  const allNeighbors = getNeighbors;
  const uniformCost = () => 1;
  const alwaysPassable = () => true;

  it('finds a direct path across an open grid', () => {
    const result = findPath(hex(0, 0), hex(3, 0), allNeighbors, uniformCost, alwaysPassable);
    expect(result.success).toBe(true);
    expect(result.hexes[0]).toEqual(hex(0, 0));
    expect(result.hexes.at(-1)).toEqual(hex(3, 0));
    expect(result.totalCost).toBe(3);
  });

  it('never includes impassable hexes in the resulting path', () => {
    const blocked = new Set(['1,0', '1,-1', '0,1']);
    const isPassable = (h: { q: number; r: number }) => !blocked.has(`${h.q},${h.r}`);
    const result = findPath(hex(0, 0), hex(2, 0), allNeighbors, uniformCost, isPassable);
    expect(result.success).toBe(true);
    for (const h of result.hexes) {
      expect(blocked.has(`${h.q},${h.r}`)).toBe(false);
    }
  });

  it('fails when the target is unreachable', () => {
    const target = hex(5, 5);
    const isPassable = (h: { q: number; r: number }) => h.q === 0 && h.r === 0;
    const result = findPath(hex(0, 0), target, allNeighbors, uniformCost, isPassable);
    expect(result.success).toBe(false);
    expect(result.hexes).toHaveLength(0);
  });

  it('respects non-uniform movement cost', () => {
    const expensive = new Set(['1,0']);
    const cost = (_from: { q: number; r: number }, to: { q: number; r: number }) =>
      expensive.has(`${to.q},${to.r}`) ? 10 : 1;
    const result = findPath(hex(0, 0), hex(2, 0), allNeighbors, cost, alwaysPassable);
    expect(result.success).toBe(true);
    expect(result.hexes.some((h) => h.q === 1 && h.r === 0)).toBe(false);
  });
});
