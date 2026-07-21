import './app/appShell.css';
import { App } from './app/App';
import { installErrorBanner } from './app/errorBanner';

installErrorBanner();

const container = document.querySelector<HTMLDivElement>('#app')!;
new App(container);
