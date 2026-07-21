import type { HexCoordinate } from '../coordinates/HexCoordinate';
import { hexKey } from '../coordinates/HexCoordinate';
import { getDistance } from '../distance/distance';

export interface PathResult {
  readonly success: boolean;
  readonly hexes: HexCoordinate[];
  readonly totalCost: number;
}

export type GetNeighborsFn = (h: HexCoordinate) => HexCoordinate[];
export type GetMovementCostFn = (from: HexCoordinate, to: HexCoordinate) => number;
export type IsPassableFn = (h: HexCoordinate) => boolean;

interface FrontierNode {
  hex: HexCoordinate;
  priority: number;
}

/**
 * Generic A* pathfinding over abstract cost callbacks, so the same algorithm
 * serves overworld parties and tactical units with different movement rules.
 */
export function findPath(
  startHex: HexCoordinate,
  targetHex: HexCoordinate,
  getNeighbors: GetNeighborsFn,
  getMovementCost: GetMovementCostFn,
  isPassable: IsPassableFn,
): PathResult {
  if (!isPassable(startHex) || !isPassable(targetHex)) {
    return { success: false, hexes: [], totalCost: 0 };
  }

  const startKey = hexKey(startHex);
  const targetKey = hexKey(targetHex);

  const frontier: FrontierNode[] = [{ hex: startHex, priority: 0 }];
  const cameFrom = new Map<string, HexCoordinate>();
  const costSoFar = new Map<string, number>();
  cameFrom.set(startKey, startHex);
  costSoFar.set(startKey, 0);

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.priority - b.priority);
    const current = frontier.shift()!;
    const currentKey = hexKey(current.hex);

    if (currentKey === targetKey) {
      return { success: true, hexes: reconstructPath(cameFrom, startHex, targetHex), totalCost: costSoFar.get(targetKey)! };
    }

    for (const next of getNeighbors(current.hex)) {
      if (!isPassable(next)) continue;

      const nextKey = hexKey(next);
      const newCost = costSoFar.get(currentKey)! + getMovementCost(current.hex, next);

      if (!costSoFar.has(nextKey) || newCost < costSoFar.get(nextKey)!) {
        costSoFar.set(nextKey, newCost);
        const priority = newCost + getDistance(next, targetHex);
        frontier.push({ hex: next, priority });
        cameFrom.set(nextKey, current.hex);
      }
    }
  }

  return { success: false, hexes: [], totalCost: 0 };
}

function reconstructPath(
  cameFrom: Map<string, HexCoordinate>,
  startHex: HexCoordinate,
  targetHex: HexCoordinate,
): HexCoordinate[] {
  const path: HexCoordinate[] = [targetHex];
  let currentKey = hexKey(targetHex);
  const startKey = hexKey(startHex);

  while (currentKey !== startKey) {
    const prev = cameFrom.get(currentKey)!;
    path.push(prev);
    currentKey = hexKey(prev);
  }

  path.reverse();
  return path;
}
