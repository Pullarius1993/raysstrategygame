export interface Scene {
  mount(container: HTMLElement): void;
  unmount(): void;
}
