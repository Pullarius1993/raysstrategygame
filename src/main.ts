import './app/appShell.css';
import { App } from './app/App';

const container = document.querySelector<HTMLDivElement>('#app')!;
new App(container);
