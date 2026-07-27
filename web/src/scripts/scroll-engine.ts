// Scroll engine — POUZE pozoruje (IntersectionObserver) a synchronizuje UI.
// Řízení scrollu zůstává nativnímu CSS scroll snapu.

import { HEADER_LINKS } from '../lib/nav';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function scrollBehavior(): ScrollBehavior {
  return reducedMotion.matches ? 'auto' : 'smooth';
}

// hash se píše jen pro hlavní úrovně homepage (deep-linky z hlavičky);
// implicitní hash na kartě projektu (#text, #menu…) by po reloadu nebo
// obnovení tabu otevřel stránku uprostřed — mobilní prohlížeče taby
// běžně zahazují a obnovují reloadem
const deepLinkIds = new Set(HEADER_LINKS.map((link) => link.id));

function levels(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.level[data-level]'));
}

/**
 * Aktivace scroll snapu až po načtení stránky. iOS Safari s aktivním
 * `y mandatory` doresolvuje snap během načítání (po layoutu obrázků) a umí
 * stránku ukotvit uprostřed — na kartě projektu typicky na výkresové úrovni.
 * Snap je proto od prvního vykreslení vypnutý (html.snap-pending, vkládá
 * inline skript v <head>) a zapíná se po window.load. Pokud uživatel začne
 * scrollovat dřív, snap se zapne hned — gesto pak normálně dosnapuje.
 *
 * Aktivace předpokládá, že stránka stojí na vršku (= platný snap bod).
 * iOS Safari ale umí při navigaci přenést scroll offset předchozí stránky
 * (odscrollovaná homepage → karta projektu) — snap by se pak ukotvil
 * uprostřed (portfolio = 3. úroveň homepage → karta skočí na výkresy).
 * Totéž platí pro horizontální dráhy: snap-pending vypíná i jejich
 * `x mandatory` a stray scrollLeft se sráží na začátek. U čerstvé navigace
 * bez kotvy proto během snap-pending fáze držíme vršek/začátek okamžitým
 * scrollTo; snap je vypnutý, takže se s ním nebojuje (flikr z revertu 27a426f
 * vznikal korekcí proti aktivnímu snapu). Safari umí přenesený offset
 * aplikovat i PO window.load, takže u čerstvé navigace snap-pending + hlídání
 * vršku drží až do první interakce uživatele — v klidu snap stejně nic nedělá
 * a první dotek/kolečko ho zapne dřív, než se gesto rozjede. Reload nechává
 * obnovu pozice prohlížeči a aktivuje po window.load.
 *
 * Back/forward se chová jako čerstvý příchod: návrat z karty projektu má
 * homepage ukázat od úvodu, ne odscrollovanou na portfoliu. Hash v URL je
 * při back/forward jen zbytek průběžného replaceState ze scrollování, ne
 * záměr uživatele — proto se ignoruje. Návrat z bfcache (iOS back swipe)
 * skripty znovu nespouští a stav stránky obnovuje beze změny, řeší ho
 * pageshow handler níže.
 */
function initSnapActivation(): void {
  const html = document.documentElement;

  // bfcache návrat: stránka se obnoví přesně jak se opustila (snap už aktivní,
  // scroll na portfoliu) — srovnat na vršek; vršek je platný snap bod, takže
  // se s aktivním snapem nebojuje
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    for (const row of document.querySelectorAll<HTMLElement>('.scroll-row')) {
      if (row.scrollLeft !== 0) row.scrollTo({ left: 0, behavior: 'instant' });
    }
  });

  if (!html.classList.contains('snap-pending')) return;

  const navType =
    (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)
      ?.type ?? 'navigate';
  const mustStartAtTop =
    navType === 'back_forward' ||
    (navType === 'navigate' && !deepLinkIds.has(location.hash.slice(1)));

  let interacted = false;

  const toStart = () => {
    if (!mustStartAtTop || interacted) return;
    if (window.scrollY !== 0) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    for (const row of document.querySelectorAll<HTMLElement>('.scroll-row')) {
      if (row.scrollLeft !== 0) row.scrollTo({ left: 0, behavior: 'instant' });
    }
  };

  const enable = () => {
    if (!html.classList.contains('snap-pending')) return;
    toStart();
    html.classList.remove('snap-pending');
    window.removeEventListener('scroll', toStart, { capture: true });
  };

  const interact = () => {
    interacted = true;
    enable();
  };

  toStart();
  // scroll bez předchozí interakce = pozice od prohlížeče, ne od uživatele;
  // capture — scroll na dráze nebubluje, na window přijde jen v capture fázi
  window.addEventListener('scroll', toStart, { capture: true, passive: true });

  if (!mustStartAtTop) {
    // reload / deep-link: pozici obnovuje prohlížeč, snap se zapíná po
    // načtení; čerstvá navigace a back/forward čekají až na interakci
    // (Safari umí přenesený/obnovený offset aplikovat i po window.load)
    if (document.readyState === 'complete') {
      requestAnimationFrame(enable);
    } else {
      window.addEventListener('load', () => requestAnimationFrame(enable), { once: true });
    }
  }
  window.addEventListener('pointerdown', interact, { once: true, passive: true });
  window.addEventListener('touchstart', interact, { once: true, passive: true });
  window.addEventListener('wheel', interact, { once: true, passive: true });
  window.addEventListener('keydown', interact, { once: true });
}

/** Sleduje aktivní vertikální úroveň → podtržení v menu, tečky vpravo, hash. */
function observeLevels(): void {
  const navLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')
  );
  const levelDots = Array.from(
    document.querySelectorAll<HTMLElement>('[data-level-dot]')
  );
  const allLevels = levels();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target as HTMLElement;
        const id = target.dataset.level ?? '';
        for (const link of navLinks) {
          const isActive = link.dataset.navLink === id;
          link.classList.toggle('is-active', isActive);
          if (isActive) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        }
        const index = allLevels.indexOf(target);
        levelDots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
        const hash = deepLinkIds.has(id) ? `#${id}` : '';
        if (location.hash !== hash) {
          history.replaceState(null, '', hash || location.pathname);
        }
      }
    },
    { threshold: 0.5 }
  );

  for (const level of allLevels) observer.observe(level);
}

/** Sleduje pozici v horizontálních drahách → progress dots. */
function observeRows(): void {
  for (const row of document.querySelectorAll<HTMLElement>('.scroll-row[data-row]')) {
    const rowId = row.dataset.row;
    const dots = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-dots-for="${rowId}"] [data-dot]`)
    );
    if (!dots.length) continue;

    const panels = Array.from(row.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = panels.indexOf(entry.target as HTMLElement);
          dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
        }
      },
      { root: row, threshold: 0.6 }
    );
    for (const panel of panels) observer.observe(panel);
  }
}

/**
 * Magnetický scroll pro CSS multicol sloupce (textová úroveň karty projektu).
 * Sloupce nejsou elementy, takže nemají vlastní snap body — po layoutu se
 * změří rozteč sloupců a do dráhy se vloží neviditelné snap markery.
 * Posun samotný zůstává plně v režii nativního CSS scroll snapu.
 */
function initColumnSnap(): void {
  for (const row of document.querySelectorAll<HTMLElement>('.scroll-row')) {
    const flow = row.querySelector<HTMLElement>('.text-columns');
    if (!flow) continue;

    const build = () => {
      for (const marker of row.querySelectorAll('.snap-marker')) marker.remove();

      const columnWidth = parseFloat(getComputedStyle(flow).columnWidth);
      if (!columnWidth) return;

      // levé hrany sloupců se odečtou z client rectů řádků textu — plné
      // (zalomené) řádky začínají vždy na levé hraně svého sloupce
      const range = document.createRange();
      range.selectNodeContents(flow);
      const lineRects = Array.from(range.getClientRects()).filter(
        (rect) => rect.width >= columnWidth * 0.6
      );
      const base = flow.getBoundingClientRect().left;
      const lefts = lineRects.map((rect) => Math.round(rect.left - base)).sort((a, b) => a - b);

      const starts: number[] = [];
      for (const x of lefts) {
        if (!starts.length || x > starts[starts.length - 1] + columnWidth * 0.5) starts.push(x);
      }
      if (starts.length < 2) return; // vše se vejde → není co snapovat

      for (const x of starts) {
        const marker = document.createElement('span');
        marker.className = 'snap-marker';
        marker.style.left = `${flow.offsetLeft + x}px`;
        marker.style.width = `${columnWidth}px`;
        row.appendChild(marker);
      }
    };

    build();

    let frame = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(build);
    });
  }
}

function activeLevelIndex(): number {
  const all = levels();
  const mid = window.innerHeight / 2;
  for (let i = 0; i < all.length; i += 1) {
    const rect = all[i].getBoundingClientRect();
    if (rect.top <= mid && rect.bottom > mid) return i;
  }
  return 0;
}

let jumpToken = 0;

/**
 * Programový skok na úroveň (menu, klávesnice). Plynulý scrollIntoView přes
 * mandatory snap se scroll-snap-stop: always na mobilech nedojede — snap
 * animaci přeruší a vrátí o úroveň zpět; 100dvh se navíc během posunu mění
 * se schováváním adresního řádku. Po dobu skoku se proto snap vypne
 * (html.is-jumping, scroll.css) a po ustálení se pozice srovná okamžitým
 * skokem na cíl. Zásah uživatele (touch, kolečko) skok okamžitě pouští.
 */
export function scrollToTarget(target: HTMLElement): void {
  if (reducedMotion.matches) {
    target.scrollIntoView();
    return;
  }

  const token = ++jumpToken;
  const html = document.documentElement;
  html.classList.add('is-jumping');
  target.scrollIntoView({ behavior: 'smooth' });

  const started = performance.now();
  let lastY = window.scrollY;
  let everMoved = false;
  let stillFrames = 0;
  let aborted = false;
  const abort = () => {
    aborted = true;
  };
  window.addEventListener('touchstart', abort, { once: true, passive: true });
  window.addEventListener('wheel', abort, { once: true, passive: true });
  const cleanup = () => {
    window.removeEventListener('touchstart', abort);
    window.removeEventListener('wheel', abort);
  };

  const tick = () => {
    if (token !== jumpToken) {
      cleanup(); // převzal to novější skok
      return;
    }
    const y = window.scrollY;
    if (y !== lastY) everMoved = true;
    stillFrames = y === lastY ? stillFrames + 1 : 0;
    lastY = y;
    const elapsed = performance.now() - started;
    // klid pár snímků po rozjezdu = doběhlo; cíl na místě = žádný rozjezd
    const settled = stillFrames >= 6 && (everMoved || elapsed > 500);
    if (aborted || settled || elapsed > 3000) {
      cleanup();
      // 'instant' — html:focus-within má scroll-behavior: smooth a korekce
      // nesmí spustit další animaci, do které by se vrátil snap
      if (!aborted) target.scrollIntoView({ behavior: 'instant' });
      html.classList.remove('is-jumping');
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function scrollToLevel(index: number): void {
  const all = levels();
  const target = all[Math.max(0, Math.min(all.length - 1, index))];
  if (target) scrollToTarget(target);
}

/** Klávesová navigace mezi úrovněmi a po horizontální dráze. */
function initKeyboard(): void {
  window.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

    switch (event.key) {
      case 'ArrowDown':
      case 'PageDown':
        event.preventDefault();
        scrollToLevel(activeLevelIndex() + 1);
        break;
      case 'ArrowUp':
      case 'PageUp':
        event.preventDefault();
        scrollToLevel(activeLevelIndex() - 1);
        break;
      case 'ArrowRight':
      case 'ArrowLeft': {
        const row = levels()[activeLevelIndex()]?.querySelector<HTMLElement>('.scroll-row');
        if (!row) return;
        event.preventDefault();
        const marker = row.querySelector<HTMLElement>('.snap-marker');
        const panel = row.children[0] as HTMLElement | undefined;
        const step = marker?.offsetWidth ?? panel?.offsetWidth ?? window.innerWidth;
        row.scrollBy({
          left: event.key === 'ArrowRight' ? step : -step,
          behavior: scrollBehavior(),
        });
        break;
      }
    }
  });
}

export function initScrollEngine(): void {
  initSnapActivation();
  observeLevels();
  observeRows();
  initColumnSnap();
  initKeyboard();
}
