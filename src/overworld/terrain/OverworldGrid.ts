import { type HexCoordinate, hexKey } from '../../hex';
import { type TerrainType, terrainDefinitions } from '../../config/prototypeConfig';
import type { SeededRandom } from '../../core/random/SeededRandom';

const TERRAIN_WEIGHTS: ReadonlyArray<readonly [TerrainType, number]> = [
  ['Plains', 45],
  ['Forest', 20],
  ['Hills', 15],
  ['Mountains', 8],
  ['Marsh', 7],
  ['Water', 5],
];

export class OverworldGrid {
  private readonly terrainByHex = new Map<string, TerrainType>();

  constructor(
    readonly width: number,
    readonly height: number,
  ) {}

  static generate(width: number, height: number, rng: SeededRandom): OverworldGrid {
    const grid = new OverworldGrid(width, height);
    for (const h of grid.allHexes()) {
      grid.terrainByHex.set(hexKey(h), pickWeightedTerrain(rng));
    }
    return grid;
  }

  /** Approximately rectangular pointy-top axial region. */
  *allHexes(): Generator<HexCoordinate> {
    for (let r = 0; r < this.height; r++) {
      const rowOffset = Math.floor(r / 2);
      for (let q = -rowOffset; q < this.width - rowOffset; q++) {
        yield { q, r };
      }
    }
  }

  getTerrain(h: HexCoordinate): TerrainType | undefined {
    return this.terrainByHex.get(hexKey(h));
  }

  setTerrain(h: HexCoordinate, terrain: TerrainType): void {
    this.terrainByHex.set(hexKey(h), terrain);
  }

  isPassable(h: HexCoordinate): boolean {
    const terrain = this.getTerrain(h);
    return terrain !== undefined && terrainDefinitions[terrain].passable;
  }

  getMovementCost(_from: HexCoordinate, to: HexCoordinate): number {
    const terrain = this.getTerrain(to);
    return terrain ? terrainDefinitions[terrain].movementCost : Infinity;
  }
}

function pickWeightedTerrain(rng: SeededRandom): TerrainType {
  const total = TERRAIN_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng.next() * total;
  for (const [terrain, weight] of TERRAIN_WEIGHTS) {
    if (roll < weight) return terrain;
    roll -= weight;
  }
  return 'Plains';
}
