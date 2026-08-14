// Navigace: burger otevírá/zavírá menu overlay (BurgerScreen) — stránka
// zůstává na aktuální úrovni, nikam se nescrolluje. Položky menu scrollují
// na cílovou úroveň. Scroll zůstává nativní — skoky přes více úrovní jdou
// přes scrollToTarget (viz scroll-engine.ts).

import { scrollToTarget } from './scroll-engine';

const MENU_OPEN = 'menu-open';

function setMenuOpen(open: boolean): void {
  document.documentElement.classList.toggle(MENU_OPEN, open);
  for (const button of document.querySelectorAll<HTMLElement>('[data-burger]')) {
    button.setAttribute('aria-expanded', String(open));
  }
}

export function initMenu(): void {
  const html = document.documentElement;
  // overlay režim = mobilní breakpoint (zrcadlí media query v Header.astro
  // a BurgerScreen.astro); na desktopu je burger skrytý a menu obrazovka
  // zůstává poslední snap úrovní dosažitelnou scrollem
  const overlayMode = window.matchMedia('(max-width: 767px)');

  // burger → přepnout overlay
  for (const button of document.querySelectorAll<HTMLElement>('[data-burger]')) {
    button.addEventListener('click', () => {
      setMenuOpen(!html.classList.contains(MENU_OPEN));
    });
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && html.classList.contains(MENU_OPEN)) {
      setMenuOpen(false);
    }
  });

  // opuštění mobilního breakpointu (rotace, resize) → overlay zavřít,
  // obrazovka se vrací do scroll toku jako poslední úroveň
  overlayMode.addEventListener('change', (event) => {
    if (!event.matches) setMenuOpen(false);
  });

  // svislé gesto nad otevřeným overlayem nesmí projít na root scroller
  // (úrovně pod menu by se posouvaly). Root nejde zamknout přes CSS:
  // overflow: hidden na <html> zahodí scroll pozici. Pokud se obsah menu
  // nevejde a overlay sám scrolluje, gesto se nechává jemu —
  // overscroll-behavior: contain pak zastaví řetězení na root.
  const screen = document.querySelector<HTMLElement>('[data-level="menu"]');
  if (screen) {
    const blockScroll = (event: Event) => {
      if (!overlayMode.matches || !html.classList.contains(MENU_OPEN)) return;
      if (screen.scrollHeight > screen.clientHeight) return;
      event.preventDefault();
    };
    screen.addEventListener('wheel', blockScroll, { passive: false });
    screen.addEventListener('touchmove', blockScroll, { passive: false });
  }

  // kotvy v rámci stránky → snap úroveň (otevřený overlay se zavírá)
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-scroll-to]')) {
    link.addEventListener('click', (event) => {
      const id = link.dataset.scrollTo;
      const target = id ? document.querySelector<HTMLElement>(`[data-level="${id}"]`) : null;
      if (!target) return; // odkaz vede na jinou stránku — nech projít
      event.preventDefault();
      setMenuOpen(false);
      scrollToTarget(target);
    });
  }
}
