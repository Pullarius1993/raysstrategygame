/**
 * Prototype-only diagnostic aid: surfaces uncaught errors as an on-screen
 * banner, since a phone opened via file:// has no attached devtools console.
 */
export function installErrorBanner(): void {
  const banner = document.createElement('div');
  banner.style.cssText =
    'display:none; position:fixed; inset:0 0 auto 0; z-index:1000; background:#5a1414; color:#fff; ' +
    'font:12px/1.4 monospace; padding:0.75rem; max-height:40vh; overflow:auto; white-space:pre-wrap;';
  document.body.appendChild(banner);

  const show = (message: string) => {
    banner.style.display = 'block';
    banner.textContent += (banner.textContent ? '\n\n' : '') + message;
  };

  window.addEventListener('error', (event) => {
    show(`Error: ${event.message}\n${event.filename}:${event.lineno}:${event.colno}`);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    show(`Unhandled rejection: ${reason instanceof Error ? (reason.stack ?? reason.message) : String(reason)}`);
  });
}
