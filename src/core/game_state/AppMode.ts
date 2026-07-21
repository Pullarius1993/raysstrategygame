/** The application only switches mode/scene here; no campaign state is required yet. */
export type AppMode = 'main_menu' | 'overworld_test' | 'battle_test' | 'settings';

export interface AppCommand {
  readonly type: 'OpenMenu' | 'OpenOverworldTest' | 'OpenBattleTest' | 'OpenSettings' | 'Quit';
}
