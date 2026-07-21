import type { AppCommand } from '../../core/game_state/AppMode';
import type { Scene } from '../Scene';

export class MainMenuScene implements Scene {
  private root: HTMLElement | null = null;

  constructor(private readonly onCommand: (command: AppCommand) => void) {}

  mount(container: HTMLElement): void {
    const root = document.createElement('div');
    root.className = 'menu-screen';
    root.innerHTML = `
      <h1 class="menu-title">Fiefdom</h1>
      <p class="menu-subtitle">Prototype Build</p>
      <div class="menu-buttons">
        <button class="menu-button" data-action="OpenOverworldTest">Overworld Test</button>
        <button class="menu-button" data-action="OpenBattleTest">Battle Test</button>
        <button class="menu-button" data-action="OpenSettings">Settings</button>
        <button class="menu-button menu-button--quit" data-action="Quit">Quit</button>
      </div>
    `;

    root.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const action = target.dataset.action as AppCommand['type'] | undefined;
      if (action) {
        this.onCommand({ type: action });
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
