// Přechod portfolio → karta projektu (cross-document View Transitions).
// Animaci řídí prohlížeč (@view-transition v global.css); JS jen určí,
// která fotka a název na odcházející stránce odpovídají první fotce
// a názvu karty (PhotoRow). Jméno
// přechodu smí na stránce nést jediný prvek, jinak se přechod zahodí —
// a dráha portfolia má klony smyčky, proto ho nelze dát staticky v CSS.

// [selektor uvnitř položky portfolia, jméno přechodu]
const NAMES = [
  ['img', 'project-cover'],
  ['.portfolio-item-title', 'project-title'],
] as const;

export function initPageTransition(): void {
  let clicked: HTMLAnchorElement | null = null;

  document.addEventListener(
    'click',
    (event) => {
      clicked =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a.portfolio-item')
          : null;
    },
    { capture: true }
  );

  // přechod jen po kliknutí na projekt v portfoliu — návrat z karty (zpět,
  // logo) i jiné navigace proběhnou bez animace
  window.addEventListener('pageswap', (event) => {
    if (!event.viewTransition) return;
    const target = event.activation?.entry.url;
    if (
      !clicked ||
      !target ||
      new URL(target).pathname !== new URL(clicked.href).pathname
    ) {
      event.viewTransition.skipTransition();
      return;
    }
    for (const [selector, name] of NAMES) {
      const el = clicked.querySelector<HTMLElement>(selector);
      if (el) el.style.viewTransitionName = name;
    }
  });

  // návrat z bfcache — stránka je ve stavu z odchodu, jméno uklidit
  window.addEventListener('pageshow', () => {
    for (const el of document.querySelectorAll<HTMLElement>(
      '.portfolio-item img, .portfolio-item-title'
    )) {
      el.style.viewTransitionName = '';
    }
    clicked = null;
  });
}
