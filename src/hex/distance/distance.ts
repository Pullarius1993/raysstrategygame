import { type HexCoordinate, hex, hexS } from '../coordinates/HexCoordinate';

export function addHex(a: HexCoordinate, b: HexCoordinate): HexCoordinate {
  return hex(a.q + b.q, a.r + b.r);
}

export function subtractHex(a: HexCoordinate, b: HexCoordinate): HexCoordinate {
  return hex(a.q - b.q, a.r - b.r);
}

/** Hex distance is symmetric: getDistance(a, b) === getDistance(b, a). */
export function getDistance(a: HexCoordinate, b: HexCoordinate): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = hexS(a) - hexS(b);
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
}
