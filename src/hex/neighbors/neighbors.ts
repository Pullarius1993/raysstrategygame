import { type HexCoordinate, hex } from '../coordinates/HexCoordinate';
import { addHex } from '../distance/distance';

/** Axial neighbor directions, order: E, NE, NW, W, SW, SE. */
export const HEX_DIRECTIONS: readonly HexCoordinate[] = [
  hex(1, 0),
  hex(1, -1),
  hex(0, -1),
  hex(-1, 0),
  hex(-1, 1),
  hex(0, 1),
];

export function getNeighbors(h: HexCoordinate): HexCoordinate[] {
  return HEX_DIRECTIONS.map((dir) => addHex(h, dir));
}

export function getNeighbor(h: HexCoordinate, direction: number): HexCoordinate {
  const dir = HEX_DIRECTIONS[((direction % 6) + 6) % 6];
  return addHex(h, dir);
}
