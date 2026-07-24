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
 * Počáteční pozice = vždy vršek stránky. iOS Safari při navigaci na kartu
 * projektu (i při obnově tabu z bfcache) skrz mandatory snap se
 * scroll-snap-stop: always občas doresolvuje snap až po layoutu obrázků a
 * ukotví stránku uprostřed — typicky na výkresové úrovni. Držíme proto vršek
 * prvních pár snímků po načtení, dokud uživatel sám nezasáhne. Deep-link na
 * homepage (#atelier…) necháváme být — tam cíl řeší nativní kotva.
 */
function initInitialScrollReset(): void {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const hasDeepLink = () => deepLinkIds.has(location.hash.slice(1));
  const toTop = () => {
    if (hasDeepLink()) return;
    // 'instant' — žádná smooth animace, do které by se vrátil snap
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  let interacted = false;
  const stop = () => {
    interacted = true;
  };
  window.addEventListener('touchstart', stop, { once: true, passive: true });
  window.addEventListener('wheel', stop, { once: true, passive: true });
  window.addEventListener('keydown', stop, { once: true });

  toTop();

  const started = performance.now();
  const hold = () => {
    if (interacted) return;
    if (window.scrollY !== 0) toTop();
    if (performance.now() - started < 700) requestAnimationFrame(hold);
  };
  requestAnimationFrame(hold);

  // obnova z bfcache (mobilní prohlížeče běžně obnovují taby)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && !interacted) toTop();
  });
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
  initInitialScrollReset();
  observeLevels();
  observeRows();
  initColumnSnap();
  initKeyboard();
}
