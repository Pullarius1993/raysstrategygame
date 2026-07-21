import type { AppCommand, AppMode } from '../core/game_state/AppMode';
import { BattleTestScene } from './battle_test/BattleTestScene';
import { MainMenuScene } from './main_menu/MainMenuScene';
import { SettingsScene } from './main_menu/SettingsScene';
import { OverworldTestScene } from './overworld_test/OverworldTestScene';
import type { Scene } from './Scene';

export class App {
  private currentScene: Scene | null = null;

  constructor(private readonly container: HTMLElement) {
    this.goTo('main_menu');
  }

  private goTo(mode: AppMode): void {
    this.currentScene?.unmount();
    this.container.innerHTML = '';
    this.currentScene = this.createScene(mode);
    this.currentScene.mount(this.container);
  }

  private createScene(mode: AppMode): Scene {
    switch (mode) {
      case 'main_menu':
        return new MainMenuScene((command) => this.handleCommand(command));
      case 'overworld_test':
        return new OverworldTestScene(() => this.goTo('main_menu'));
      case 'battle_test':
        return new BattleTestScene(() => this.goTo('main_menu'));
      case 'settings':
        return new SettingsScene(() => this.goTo('main_menu'));
    }
  }

  private handleCommand(command: AppCommand): void {
    switch (command.type) {
      case 'OpenOverworldTest':
        this.goTo('overworld_test');
        break;
      case 'OpenBattleTest':
        this.goTo('battle_test');
        break;
      case 'OpenSettings':
        this.goTo('settings');
        break;
      case 'OpenMenu':
        this.goTo('main_menu');
        break;
      case 'Quit':
        // No native process to exit in a browser prototype; return to menu instead.
        this.goTo('main_menu');
        break;
    }
  }
}
