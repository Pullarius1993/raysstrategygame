import type { HexLayout } from '../../hex';

/** Flat [x0,y0, x1,y1, ...] corner points for a pointy-top hex, for Graphics.poly(). */
export function hexCornerPoints(layout: HexLayout): number[] {
  const points: number[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    points.push(layout.hexSize * Math.cos(angle), layout.hexSize * Math.sin(angle));
  }
  return points;
}
