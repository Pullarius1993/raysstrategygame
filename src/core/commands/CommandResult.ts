/**
 * Shared shape for pure simulation command handlers: validate rules, then
 * return either a rejection reason or the new state plus emitted events.
 * Presentation/input code calls these; it never mutates game rules directly.
 */
export type CommandResult<TState, TEvent> =
  | { readonly ok: true; readonly state: TState; readonly events: TEvent[] }
  | { readonly ok: false; readonly reason: string };

export function commandOk<TState, TEvent>(state: TState, events: TEvent[] = []): CommandResult<TState, TEvent> {
  return { ok: true, state, events };
}

export function commandRejected<TState, TEvent>(reason: string): CommandResult<TState, TEvent> {
  return { ok: false, reason };
}
