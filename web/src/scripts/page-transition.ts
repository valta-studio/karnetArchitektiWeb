// Přechod portfolio → karta projektu (cross-document View Transitions).
// Animaci řídí prohlížeč (@view-transition v global.css); JS jen určí,
// která fotka na odcházející stránce odpovídá první fotce karty. Jméno
// přechodu smí na stránce nést jediný prvek, jinak se přechod zahodí —
// a dráha portfolia má klony smyčky, proto ho nelze dát staticky v CSS.

const NAME = 'project-cover';

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

  window.addEventListener('pageswap', (event) => {
    if (!event.viewTransition || !clicked) return;
    const target = event.activation?.entry.url;
    if (!target || new URL(target).pathname !== new URL(clicked.href).pathname) return;
    const cover = clicked.querySelector<HTMLElement>('img');
    if (cover) cover.style.viewTransitionName = NAME;
  });

  // návrat z bfcache — stránka je ve stavu z odchodu, jméno uklidit
  window.addEventListener('pageshow', () => {
    for (const el of document.querySelectorAll<HTMLElement>('.portfolio-item img')) {
      el.style.viewTransitionName = '';
    }
    clicked = null;
  });
}
