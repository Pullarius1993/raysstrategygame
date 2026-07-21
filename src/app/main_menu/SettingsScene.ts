import { prototypeConfig } from '../../config/prototypeConfig';
import type { Scene } from '../Scene';

export class SettingsScene implements Scene {
  private root: HTMLElement | null = null;

  constructor(private readonly onBack: () => void) {}

  mount(container: HTMLElement): void {
    const root = document.createElement('div');
    root.className = 'menu-screen';
    root.innerHTML = `
      <h1 class="menu-title">Settings</h1>
      <p class="menu-subtitle">Prototype config (read-only for now)</p>
      <ul class="settings-list">
        <li>Captain mode threshold: ${prototypeConfig.captainModeThreshold}</li>
        <li>Reinforcement phases: ${prototypeConfig.reinforcementPhases.join(', ')}</li>
        <li>Default unit health: ${prototypeConfig.defaultUnitHealth}</li>
        <li>Default unit armor: ${prototypeConfig.defaultUnitArmor}</li>
        <li>Default unit initiative: ${prototypeConfig.defaultUnitInitiative}</li>
      </ul>
      <div class="menu-buttons">
        <button class="menu-button" data-action="back">Back</button>
      </div>
    `;

    root.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.dataset.action === 'back') {
        this.onBack();
      }
    });

    container.appendChild(root);
    this.root = root;
  }

  unmount(): void {
    this.root?.remove();
    this.root = null;
  }
}
