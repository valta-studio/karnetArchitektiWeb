// Přechod portfolio → karta projektu (cross-document View Transitions).
// Animaci řídí prohlížeč (@view-transition v global.css); JS jen určí,
// která fotka a název na odcházející stránce odpovídají první fotce
// a názvu karty (PhotoRow). Jméno
// přechodu smí na stránce nést jediný prvek, jinak se přechod zahodí —
// a dráha portfolia má klony smyčky, proto ho nelze dát staticky v CSS.
// Viditelné sousední projekty dostanou vlastní jména a ve snímku odjedou
// ze středu do stran (třídy vt-side-left/right, global.css); fotky karty
// pak přijedou ze stran na střed (:active-view-transition, global.css).

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
    nameSideItems(clicked);
  });

  initBackLink();

  // návrat z bfcache — stránka je ve stavu z odchodu, jméno uklidit
  window.addEventListener('pageshow', () => {
    for (const el of document.querySelectorAll<HTMLElement>(
      '.portfolio-item, .portfolio-item img, .portfolio-item-title'
    )) {
      el.style.viewTransitionName = '';
      el.style.removeProperty('view-transition-class');
    }
    clicked = null;
  });
}

/** Sousední projekty viditelné vedle kliknutého — odjedou do stran. */
function nameSideItems(clicked: HTMLAnchorElement): void {
  const center = (rect: DOMRect) => rect.left + rect.width / 2;
  const clickedCenter = center(clicked.getBoundingClientRect());
  let index = 0;
  for (const item of clicked.parentElement?.children ?? []) {
    if (item === clicked || !(item instanceof HTMLElement)) continue;
    const rect = item.getBoundingClientRect();
    if (rect.width === 0 || rect.right <= 0 || rect.left >= window.innerWidth) continue;
    item.style.viewTransitionName = `portfolio-side-${index++}`;
    item.style.setProperty(
      'view-transition-class',
      center(rect) < clickedCenter ? 'vt-side-left' : 'vt-side-right'
    );
  }
}

/**
 * Zpět z karty projektu (a[data-back], PhotoRow) → portfolio. Přišel-li
 * uživatel z cílové stránky (hlavní), jde se historií: prohlížeč vrátí
 * portfolio i dráhu na projektu, ze kterého odešel (bfcache), a návrat
 * drží scroll-engine na #portfolio. Jinak (přímý odkaz, jiný web) je to
 * obyčejný odkaz na /#portfolio.
 */
function initBackLink(): void {
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-back]')) {
    link.addEventListener('click', (event) => {
      if (!document.referrer || history.length < 2) return;
      const from = new URL(document.referrer);
      const to = new URL(link.href);
      if (from.origin !== to.origin || from.pathname !== to.pathname) return;
      event.preventDefault();
      history.back();
    });
  }
}
