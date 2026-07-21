import type { HexCoordinate } from './HexCoordinate';

export interface WorldPosition {
  readonly x: number;
  readonly y: number;
}

/** Pointy-top hex layout. hexSize is the distance from center to a corner, in world units. */
export interface HexLayout {
  readonly hexSize: number;
  readonly originX: number;
  readonly originY: number;
}

export function createHexLayout(hexSize: number, originX = 0, originY = 0): HexLayout {
  return { hexSize, originX, originY };
}

export function hexToWorldPosition(layout: HexLayout, h: HexCoordinate): WorldPosition {
  const x = layout.hexSize * (Math.sqrt(3) * h.q + (Math.sqrt(3) / 2) * h.r) + layout.originX;
  const y = layout.hexSize * (1.5 * h.r) + layout.originY;
  return { x, y };
}

export function worldPositionToHex(layout: HexLayout, pos: WorldPosition): HexCoordinate {
  const x = (pos.x - layout.originX) / layout.hexSize;
  const y = (pos.y - layout.originY) / layout.hexSize;
  const q = (Math.sqrt(3) / 3) * x - (1 / 3) * y;
  const r = (2 / 3) * y;
  return roundHex(q, r);
}

function roundHex(qf: number, rf: number): HexCoordinate {
  const sf = -qf - rf;
  let q = Math.round(qf);
  let r = Math.round(rf);
  let s = Math.round(sf);

  const qDiff = Math.abs(q - qf);
  const rDiff = Math.abs(r - rf);
  const sDiff = Math.abs(s - sf);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }

  return { q, r };
}
