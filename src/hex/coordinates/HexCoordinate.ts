/**
 * Axial hex coordinate. No rendering, no engine dependencies.
 * Reference: Red Blob Games hex grid guide (axial coordinates, pointy-top).
 */
export interface HexCoordinate {
  readonly q: number;
  readonly r: number;
}

export function hex(q: number, r: number): HexCoordinate {
  return { q, r };
}

export function hexEquals(a: HexCoordinate, b: HexCoordinate): boolean {
  return a.q === b.q && a.r === b.r;
}

/** Stable string key for use in Maps/Sets keyed by hex position. */
export function hexKey(h: HexCoordinate): string {
  return `${h.q},${h.r}`;
}

export function hexFromKey(key: string): HexCoordinate {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

/** Derived cube coordinate s, where q + r + s = 0. Useful for distance/ring math. */
export function hexS(h: HexCoordinate): number {
  return -h.q - h.r;
}
