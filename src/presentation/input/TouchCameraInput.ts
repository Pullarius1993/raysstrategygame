import type { Camera2D } from '../camera/Camera2D';

interface PointerState {
  x: number;
  y: number;
}

const TAP_MOVE_THRESHOLD_PX = 12;

/**
 * Maps raw pointer events on a DOM element into generic camera pan/zoom and
 * tap callbacks. Presentation-layer only; never touches simulation state directly.
 */
export class TouchCameraInput {
  private readonly pointers = new Map<number, PointerState>();
  private pinchStartDistance: number | null = null;
  private pinchStartScale = 1;
  private tapCandidatePointerId: number | null = null;
  private movedDistance = 0;

  private readonly onPointerDown = (event: PointerEvent) => this.handlePointerDown(event);
  private readonly onPointerMove = (event: PointerEvent) => this.handlePointerMove(event);
  private readonly onPointerUp = (event: PointerEvent) => this.handlePointerUp(event);
  private readonly onWheel = (event: WheelEvent) => this.handleWheel(event);

  constructor(
    private readonly element: HTMLElement,
    private readonly camera: Camera2D,
    private readonly onTap: (localX: number, localY: number) => void,
  ) {
    element.addEventListener('pointerdown', this.onPointerDown);
    element.addEventListener('pointermove', this.onPointerMove);
    element.addEventListener('pointerup', this.onPointerUp);
    element.addEventListener('pointercancel', this.onPointerUp);
    element.addEventListener('wheel', this.onWheel, { passive: false });
  }

  destroy(): void {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerUp);
    this.element.removeEventListener('wheel', this.onWheel);
  }

  private localPoint(event: PointerEvent): PointerState {
    const rect = this.element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private handlePointerDown(event: PointerEvent): void {
    this.element.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, this.localPoint(event));

    if (this.pointers.size === 1) {
      this.tapCandidatePointerId = event.pointerId;
      this.movedDistance = 0;
    } else {
      this.tapCandidatePointerId = null;
      this.pinchStartDistance = this.currentPinchDistance();
      this.pinchStartScale = this.camera.scale;
    }
  }

  private handlePointerMove(event: PointerEvent): void {
    const previous = this.pointers.get(event.pointerId);
    if (!previous) return;

    const current = this.localPoint(event);
    this.pointers.set(event.pointerId, current);

    if (this.pointers.size === 1) {
      const dx = current.x - previous.x;
      const dy = current.y - previous.y;
      this.movedDistance += Math.hypot(dx, dy);
      this.camera.pan(dx, dy);
    } else if (this.pointers.size === 2 && this.pinchStartDistance !== null) {
      const distance = this.currentPinchDistance();
      if (distance !== null && this.pinchStartDistance > 0) {
        const center = this.pinchCenter();
        const targetScale = this.pinchStartScale * (distance / this.pinchStartDistance);
        const factor = targetScale / this.camera.scale;
        if (center) this.camera.zoomAt(center.x, center.y, factor);
      }
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    const wasTap =
      this.pointers.size === 1 &&
      this.tapCandidatePointerId === event.pointerId &&
      this.movedDistance < TAP_MOVE_THRESHOLD_PX;

    this.pointers.delete(event.pointerId);
    this.pinchStartDistance = this.pointers.size >= 2 ? this.currentPinchDistance() : null;

    if (wasTap) {
      const point = this.localPoint(event);
      this.onTap(point.x, point.y);
    }
    this.tapCandidatePointerId = null;
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    const rect = this.element.getBoundingClientRect();
    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
    this.camera.zoomAt(event.clientX - rect.left, event.clientY - rect.top, factor);
  }

  private currentPinchDistance(): number | null {
    const points = [...this.pointers.values()];
    if (points.length < 2) return null;
    return Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
  }

  private pinchCenter(): PointerState | null {
    const points = [...this.pointers.values()];
    if (points.length < 2) return null;
    return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
  }
}
