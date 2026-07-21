import { type HexCoordinate, getDistance, hex } from '../../hex';

/** Flat, fully-passable hex battlefield within `radius` of the origin. Terrain/height are future scope. */
export class BattleGrid {
  constructor(readonly radius: number) {}

  *allHexes(): Generator<HexCoordinate> {
    for (let q = -this.radius; q <= this.radius; q++) {
      for (let r = -this.radius; r <= this.radius; r++) {
        const candidate = hex(q, r);
        if (getDistance(hex(0, 0), candidate) <= this.radius) yield candidate;
      }
    }
  }

  isInBounds(h: HexCoordinate): boolean {
    return getDistance(hex(0, 0), h) <= this.radius;
  }
}
