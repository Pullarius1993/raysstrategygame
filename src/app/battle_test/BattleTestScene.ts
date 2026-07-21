import { Application, Container, Graphics } from 'pixi.js';
import { createHexLayout, hexToWorldPosition, worldPositionToHex } from '../../hex';
import { prototypeConfig } from '../../config/prototypeConfig';
import { Camera2D } from '../../presentation/camera/Camera2D';
import { TouchCameraInput } from '../../presentation/input/TouchCameraInput';
import { hexCornerPoints } from '../../presentation/rendering/hexPolygon';
import {
  battleGridFillColor,
  battleGridStrokeColor,
  healthBarFillColor,
  healthBarLowFillColor,
  selectedRingColor,
  teamColors,
} from '../../presentation/rendering/battleColors';
import { attackUnit, endCaptainActivation, endUnitTurn, moveUnit } from '../../battle/simulation/BattleCommands';
import { canUnitAct, getActiveActorId } from '../../battle/simulation/queries';
import { spawnSkirmish } from '../../battle/units/spawnPrototypeBattle';
import type { BattleState } from '../../battle/simulation/BattleState';
import type { BattleUnit } from '../../battle/units/BattleUnit';
import type { Scene } from '../Scene';

interface UnitView {
  container: Container;
  circle: Graphics;
  healthBarFill: Graphics;
}

export class BattleTestScene implements Scene {
  private root: HTMLElement | null = null;
  private app: Application | null = null;
  private input: TouchCameraInput | null = null;
  private destroyed = false;

  private readonly layout = createHexLayout(prototypeConfig.hexPixelSize);
  private readonly camera = new Camera2D();
  private state: BattleState = spawnSkirmish();
  private selectedUnitId: string | null = null;

  private unitsLayer: Container | null = null;
  private selectionRing: Graphics | null = null;
  private readonly unitViews = new Map<string, UnitView>();

  private statusEl: HTMLElement | null = null;
  private endTurnButton: HTMLButtonElement | null = null;
  private restartButton: HTMLButtonElement | null = null;

  constructor(private readonly onExit: () => void) {}

  mount(container: HTMLElement): void {
    const root = document.createElement('div');
    root.className = 'test-scene';
    root.innerHTML = `
      <div class="hud">
        <div class="hud-panel" id="battle-status">Battle Test</div>
        <div style="display:flex; gap:0.5rem;">
          <button class="hud-button" data-action="restart" hidden>Restart</button>
          <button class="hud-button" data-action="end-turn">End Turn</button>
          <button class="hud-button" data-action="back">Menu</button>
        </div>
      </div>
    `;
    container.appendChild(root);
    this.root = root;
    this.statusEl = root.querySelector('#battle-status');
    this.endTurnButton = root.querySelector('[data-action="end-turn"]');
    this.restartButton = root.querySelector('[data-action="restart"]');

    root.querySelector('[data-action="back"]')?.addEventListener('click', () => this.onExit());
    this.endTurnButton?.addEventListener('click', () => this.handleEndTurn());
    this.restartButton?.addEventListener('click', () => this.handleRestart());

    this.initPixi(root).catch((error: unknown) => {
      console.error('BattleTestScene failed to initialize renderer', error);
      if (this.statusEl) {
        this.statusEl.textContent = `Renderer error: ${error instanceof Error ? error.message : String(error)}`;
      }
    });
  }

  private async initPixi(root: HTMLElement): Promise<void> {
    const app = new Application();
    await app.init({ resizeTo: root, backgroundColor: 0x0d1420, antialias: true, preference: ['webgl', 'canvas'] });
    if (this.destroyed) {
      app.destroy(true);
      return;
    }
    this.app = app;
    root.appendChild(app.canvas);
    app.canvas.style.touchAction = 'none';

    const world = new Container();
    app.stage.addChild(world);

    this.renderGrid(world);

    this.selectionRing = new Graphics();
    world.addChild(this.selectionRing);

    this.unitsLayer = new Container();
    world.addChild(this.unitsLayer);

    this.camera.x = app.screen.width / 2;
    this.camera.y = app.screen.height / 2;

    this.input = new TouchCameraInput(app.canvas, this.camera, (localX, localY) => this.handleTap(localX, localY));

    app.ticker.add(() => {
      world.position.set(this.camera.x, this.camera.y);
      world.scale.set(this.camera.scale);
      this.syncUnitViews();
      this.updateSelectionRing();
      this.updateHud();
    });
  }

  private renderGrid(world: Container): void {
    for (const h of this.state.grid.allHexes()) {
      const pos = hexToWorldPosition(this.layout, h);
      const hexGraphic = new Graphics()
        .poly(hexCornerPoints(this.layout))
        .fill(battleGridFillColor)
        .stroke({ width: 1, color: battleGridStrokeColor, alpha: 0.5 });
      hexGraphic.position.set(pos.x, pos.y);
      world.addChild(hexGraphic);
    }
  }

  private createUnitView(): UnitView {
    const container = new Container();

    const circle = new Graphics();
    container.addChild(circle);

    const healthBarFill = new Graphics();
    container.addChild(healthBarFill);

    return { container, circle, healthBarFill };
  }

  private syncUnitViews(): void {
    if (!this.unitsLayer) return;

    for (const [id, view] of this.unitViews) {
      if (!this.state.units.has(id) || !this.state.units.get(id)!.alive) {
        view.container.destroy({ children: true });
        this.unitViews.delete(id);
      }
    }

    for (const unit of this.state.units.values()) {
      if (!unit.alive) continue;
      let view = this.unitViews.get(unit.id);
      if (!view) {
        view = this.createUnitView();
        this.unitsLayer.addChild(view.container);
        this.unitViews.set(unit.id, view);
      }
      this.updateUnitView(view, unit);
    }
  }

  private updateUnitView(view: UnitView, unit: BattleUnit): void {
    const pos = hexToWorldPosition(this.layout, unit.currentHex);
    view.container.position.set(pos.x, pos.y);

    const radius = this.layout.hexSize * 0.38;
    const eligible = canUnitAct(this.state, unit.id);
    const color = teamColors[unit.teamId] ?? 0xaaaaaa;

    view.circle.clear();
    view.circle
      .circle(0, 0, radius)
      .fill(color)
      .stroke({ width: eligible ? 3 : 1.5, color: eligible ? 0xffffff : 0x111111, alpha: eligible ? 1 : 0.6 });

    const barWidth = radius * 1.6;
    const barHeight = 4;
    const healthFraction = Math.max(0, unit.health / unit.maxHealth);
    view.healthBarFill.clear();
    view.healthBarFill
      .rect(-barWidth / 2, -radius - 10, barWidth, barHeight)
      .fill(0x1a1a1a)
      .rect(-barWidth / 2, -radius - 10, barWidth * healthFraction, barHeight)
      .fill(healthFraction > 0.35 ? healthBarFillColor : healthBarLowFillColor);

    view.container.alpha = unit.alive ? 1 : 0.3;
  }

  private updateSelectionRing(): void {
    if (!this.selectionRing) return;
    this.selectionRing.clear();

    const unit = this.selectedUnitId ? this.state.units.get(this.selectedUnitId) : undefined;
    if (!unit) return;

    const pos = hexToWorldPosition(this.layout, unit.currentHex);
    this.selectionRing
      .circle(pos.x, pos.y, this.layout.hexSize * 0.55)
      .stroke({ width: 3, color: selectedRingColor });
  }

  private updateHud(): void {
    if (!this.statusEl || !this.endTurnButton || !this.restartButton) return;

    if (this.state.battleOver) {
      this.statusEl.textContent = `Battle over — ${this.state.winnerTeamId ?? 'no one'} wins`;
      this.endTurnButton.hidden = true;
      this.restartButton.hidden = false;
      return;
    }

    const activeActorId = getActiveActorId(this.state) ?? '—';
    const modeLabel = this.state.mode === 'individual' ? 'Individual' : 'Captain';
    this.statusEl.textContent = `Round ${this.state.round} · ${modeLabel} mode · Active: ${activeActorId}`;
    this.endTurnButton.hidden = false;
    this.endTurnButton.textContent = this.state.mode === 'individual' ? 'End Turn' : 'End Activation';
    this.restartButton.hidden = true;
  }

  private handleTap(localX: number, localY: number): void {
    if (this.state.battleOver) return;

    const world = this.camera.screenToWorld(localX, localY);
    const targetHex = worldPositionToHex(this.layout, world);
    const unitAtHex = [...this.state.units.values()].find(
      (u) => u.alive && u.currentHex.q === targetHex.q && u.currentHex.r === targetHex.r,
    );

    if (unitAtHex && canUnitAct(this.state, unitAtHex.id)) {
      this.selectedUnitId = unitAtHex.id;
      return;
    }

    if (!this.selectedUnitId) return;
    const selected = this.state.units.get(this.selectedUnitId);
    if (!selected) return;

    if (unitAtHex && unitAtHex.teamId !== selected.teamId) {
      const result = attackUnit(this.state, this.selectedUnitId, unitAtHex.id);
      if (!result.ok && this.statusEl) this.statusEl.textContent = result.reason;
      return;
    }

    if (!unitAtHex) {
      const result = moveUnit(this.state, this.selectedUnitId, targetHex);
      if (!result.ok && this.statusEl) this.statusEl.textContent = result.reason;
    }
  }

  private handleEndTurn(): void {
    const activeActorId = getActiveActorId(this.state);
    if (!activeActorId) return;

    const result = this.state.mode === 'individual' ? endUnitTurn(this.state, activeActorId) : endCaptainActivation(this.state, activeActorId);

    if (result.ok) this.selectedUnitId = null;
  }

  private handleRestart(): void {
    this.state = spawnSkirmish();
    this.selectedUnitId = null;
    for (const view of this.unitViews.values()) view.container.destroy({ children: true });
    this.unitViews.clear();
  }

  unmount(): void {
    this.destroyed = true;
    this.input?.destroy();
    this.input = null;
    this.app?.destroy(true, { children: true });
    this.app = null;
    this.root?.remove();
    this.root = null;
  }
}
