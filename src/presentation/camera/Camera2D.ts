/** Screen-space camera: x/y are a Pixi container's position, scale is its uniform scale. */
export class Camera2D {
  x = 0;
  y = 0;
  scale = 1;

  constructor(
    readonly minScale = 0.4,
    readonly maxScale = 2.5,
  ) {}

  pan(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  /** Zooms by `factor`, keeping the world point under (screenX, screenY) fixed on screen. */
  zoomAt(screenX: number, screenY: number, factor: number): void {
    const worldX = (screenX - this.x) / this.scale;
    const worldY = (screenY - this.y) / this.scale;

    const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * factor));

    this.x = screenX - worldX * newScale;
    this.y = screenY - worldY * newScale;
    this.scale = newScale;
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return { x: (screenX - this.x) / this.scale, y: (screenY - this.y) / this.scale };
  }
}
