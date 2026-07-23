// Navigace: burger ikona scrolluje na burger obrazovku (poslední úroveň),
// položky menu scrollují na cílovou úroveň. Scroll zůstává nativní —
// skoky přes více úrovní jdou přes scrollToTarget (viz scroll-engine.ts).

import { scrollToTarget } from './scroll-engine';

export function initMenu(): void {
  // burger → poslední úroveň (BurgerScreen)
  for (const button of document.querySelectorAll<HTMLElement>('[data-burger]')) {
    button.addEventListener('click', () => {
      const screen = document.querySelector<HTMLElement>('[data-level="menu"]');
      if (screen) scrollToTarget(screen);
    });
  }

  // kotvy v rámci stránky → snap úroveň
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-scroll-to]')) {
    link.addEventListener('click', (event) => {
      const id = link.dataset.scrollTo;
      const target = id ? document.querySelector<HTMLElement>(`[data-level="${id}"]`) : null;
      if (!target) return; // odkaz vede na jinou stránku — nech projít
      event.preventDefault();
      scrollToTarget(target);
    });
  }
}
