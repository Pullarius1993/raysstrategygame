import { Application, Container, Graphics } from 'pixi.js';
import { createHexLayout, type HexCoordinate, hexToWorldPosition, worldPositionToHex } from '../../hex';
import { prototypeConfig } from '../../config/prototypeConfig';
import { SeededRandom } from '../../core/random/SeededRandom';
import { Camera2D } from '../../presentation/camera/Camera2D';
import { TouchCameraInput } from '../../presentation/input/TouchCameraInput';
import { hexCornerPoints } from '../../presentation/rendering/hexPolygon';
import { createParty } from '../../overworld/parties/Party';
import { OverworldGrid } from '../../overworld/terrain/OverworldGrid';
import { terrainColors } from '../../overworld/terrain/terrainColors';
import { selectDestination, tickOverworld } from '../../overworld/simulation/OverworldCommands';
import { SECONDS_PER_MOVEMENT_COST } from '../../overworld/movement/advanceParty';
import type { OverworldState } from '../../overworld/simulation/OverworldState';
import type { Scene } from '../Scene';

export class OverworldTestScene implements Scene {
  private root: HTMLElement | null = null;
  private app: Application | null = null;
  private input: TouchCameraInput | null = null;
  private destroyed = false;

  private readonly layout = createHexLayout(prototypeConfig.hexPixelSize);
  private readonly camera = new Camera2D();
  private readonly state: OverworldState;
  private statusEl: HTMLElement | null = null;

  constructor(private readonly onExit: () => void) {
    const grid = OverworldGrid.generate(prototypeConfig.overworldWidth, prototypeConfig.overworldHeight, new SeededRandom(1337));
    const start: HexCoordinate = { q: Math.floor(prototypeConfig.overworldWidth / 2), r: Math.floor(prototypeConfig.overworldHeight / 2) };
    grid.setTerrain(start, 'Plains');
    const party = createParty('player', 'player-captain', start, 12);
    this.state = { grid, parties: new Map([[party.id, party]]), playerPartyId: party.id };
  }

  mount(container: HTMLElement): void {
    const root = document.createElement('div');
    root.className = 'test-scene';
    root.innerHTML = `
      <div class="hud">
        <div class="hud-panel" id="overworld-status">Overworld Test</div>
        <button class="hud-button" data-action="back">Menu</button>
      </div>
    `;
    container.appendChild(root);
    this.root = root;
    this.statusEl = root.querySelector('#overworld-status');

    root.querySelector('[data-action="back"]')?.addEventListener('click', () => this.onExit());

    this.initPixi(root).catch((error: unknown) => {
      console.error('OverworldTestScene failed to initialize renderer', error);
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

    this.renderTerrain(world);
    const partyGraphic = this.renderParty(world);

    const start = this.state.parties.get(this.state.playerPartyId)!.currentHex;
    const startWorld = hexToWorldPosition(this.layout, start);
    this.camera.x = app.screen.width / 2 - startWorld.x;
    this.camera.y = app.screen.height / 2 - startWorld.y;

    this.input = new TouchCameraInput(app.canvas, this.camera, (localX, localY) => {
      this.handleTap(localX, localY);
    });

    app.ticker.add((ticker) => {
      const deltaSeconds = ticker.deltaMS / 1000;
      tickOverworld(this.state, deltaSeconds);
      world.position.set(this.camera.x, this.camera.y);
      world.scale.set(this.camera.scale);
      this.updatePartyPosition(partyGraphic);
      this.updateStatus();
    });
  }

  private renderTerrain(world: Container): void {
    for (const h of this.state.grid.allHexes()) {
      const terrain = this.state.grid.getTerrain(h)!;
      const pos = hexToWorldPosition(this.layout, h);
      const hexGraphic = new Graphics()
        .poly(hexCornerPoints(this.layout))
        .fill(terrainColors[terrain])
        .stroke({ width: 1, color: 0x0a0e14, alpha: 0.4 });
      hexGraphic.position.set(pos.x, pos.y);
      world.addChild(hexGraphic);
    }
  }

  private renderParty(world: Container): Graphics {
    const marker = new Graphics().circle(0, 0, this.layout.hexSize * 0.4).fill(0xd94f4f).stroke({ width: 2, color: 0xffffff });
    world.addChild(marker);
    return marker;
  }

  private updatePartyPosition(marker: Graphics): void {
    const party = this.state.parties.get(this.state.playerPartyId)!;
    const currentWorld = hexToWorldPosition(this.layout, party.currentHex);

    if (party.movementPath.length === 0) {
      marker.position.set(currentWorld.x, currentWorld.y);
      return;
    }

    const nextHex = party.movementPath[0];
    const nextWorld = hexToWorldPosition(this.layout, nextHex);
    const cost = this.state.grid.getMovementCost(party.currentHex, nextHex);
    const timeRequired = cost * SECONDS_PER_MOVEMENT_COST;
    const fraction = timeRequired > 0 ? Math.min(1, party.movementProgress / timeRequired) : 1;

    marker.position.set(
      currentWorld.x + (nextWorld.x - currentWorld.x) * fraction,
      currentWorld.y + (nextWorld.y - currentWorld.y) * fraction,
    );
  }

  private updateStatus(): void {
    if (!this.statusEl) return;
    const party = this.state.parties.get(this.state.playerPartyId)!;
    const terrain = this.state.grid.getTerrain(party.currentHex);
    const travelling = party.movementPath.length > 0 ? ` · travelling (${party.movementPath.length} hexes left)` : '';
    this.statusEl.textContent = `Hex (${party.currentHex.q}, ${party.currentHex.r}) · ${terrain}${travelling}`;
  }

  private handleTap(localX: number, localY: number): void {
    const world = this.camera.screenToWorld(localX, localY);
    const targetHex = worldPositionToHex(this.layout, world);
    const result = selectDestination(this.state, this.state.playerPartyId, targetHex);
    if (!result.ok && this.statusEl) {
      this.statusEl.textContent = result.reason;
    }
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
