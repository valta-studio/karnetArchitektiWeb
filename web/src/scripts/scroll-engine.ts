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
 * Guard nedrží jen vršek, ale obecně cílovou úroveň: při back/forward
 * a u deep-linků určuje cíl kotva v hashi. Návrat z karty projektu má
 * homepage ukázat zpátky na portfoliu — hash #portfolio tam zůstal
 * z průběžného replaceState při scrollování. iOS Safari totiž při plném
 * načtení po back přenese offset KARTY, ne uloženou pozici homepage:
 * z 2. úrovně karty se homepage otevřela na 2. úrovni (ateliér). Guard
 * proto stray scrolly sráží na vršek úrovně z hashe. Back/forward
 * i reload bez kotvy nechávají pozici prohlížeči.
 *
 * Zapnutí snapu a puštění guardu jsou dva oddělené kroky. Snap se
 * zapíná už na touchstart — WebKit nepřepne snap-type doprostřed
 * rozjetého gesta, takže první swipe by bez toho jel volně a bez
 * magnetu. Korekce stray scrollů ale drží dál: přenesený offset umí
 * WebKit aplikovat i sekundy po loadu (po layoutu fotek) a tap mezitím
 * není projev scrollování. Guard pouští až skutečné gesto — touchmove,
 * kolečko, klávesa, nebo pohyb/klik myši (pointerType 'mouse';
 * tažení nativního scrollbaru žádný pointerdown/wheel nevystřelí a myš
 * se k němu vždy přesouvá přes obsah). Korekce se s uživatelem nemůže
 * poprat: každý uživatelský scroll začíná touchmove/wheel/klávesou,
 * samotný tap žádný scroll nevyvolá; korekce po zapnutém snapu skáče
 * instantně na snap bod, takže se nepere ani se snapem.
 *
 * bfcache návrat (iOS back swipe) skripty nespouští a WebKit umí
 * obnovenou pozici přepsat přeneseným offsetem karty stejně jako při
 * plném načtení — pageshow handler proto snap-pending vrátí a guard
 * natáhne znovu s cílem z kotvy v hashi.
 */
function initSnapActivation(): void {
  const html = document.documentElement;

  const arm = (navType: string): void => {
    if (!html.classList.contains('snap-pending')) return;

    const hashId = location.hash.slice(1);
    const hashLevel = deepLinkIds.has(hashId)
      ? document.querySelector<HTMLElement>(`.level[data-level="${hashId}"]`)
      : null;

    // cíl držený během snap-pending fáze:
    // - kotva v hashi (deep-link z hlavičky, návrat zpět z karty projektu)
    //   → vršek její úrovně
    // - čerstvá navigace bez kotvy → vršek stránky
    // - reload a back/forward bez kotvy → null, pozice zůstává prohlížeči
    let holdTarget: HTMLElement | 'top' | null = null;
    if (navType !== 'reload' && hashLevel) {
      holdTarget = hashLevel;
    } else if (navType === 'navigate' && !deepLinkIds.has(hashId)) {
      holdTarget = 'top';
    }

    let interacted = false;

    const toTarget = () => {
      if (!holdTarget || interacted) return;
      const top = holdTarget === 'top' ? 0 : holdTarget.offsetTop;
      if (Math.abs(window.scrollY - top) > 1) {
        window.scrollTo({ top, left: 0, behavior: 'instant' });
      }
      // dráhy se srážejí na začátek jen u startu od vršku — při návratu na
      // úroveň si prohlížeč smí obnovit vodorovnou pozici (portfolio pás)
      if (holdTarget !== 'top') return;
      for (const row of document.querySelectorAll<HTMLElement>('.scroll-row')) {
        if (row.scrollLeft !== 0) row.scrollTo({ left: 0, behavior: 'instant' });
      }
    };

    const cleanups: Array<() => void> = [];
    const on = (
      type: string,
      handler: EventListener,
      options?: AddEventListenerOptions
    ) => {
      window.addEventListener(type, handler, options);
      cleanups.push(() => window.removeEventListener(type, handler, options));
    };

    // zapne snap (srovnáno na cíl); korekce stray scrollů běží dál
    const activateSnap = () => {
      if (!html.classList.contains('snap-pending')) return;
      toTarget();
      html.classList.remove('snap-pending');
    };

    // skutečné scroll gesto: zapnout snap a ukončit i korekce
    const release = () => {
      interacted = true;
      activateSnap();
      for (const off of cleanups) off();
    };

    toTarget();
    // scroll bez předchozí interakce = pozice od prohlížeče, ne od uživatele;
    // capture — scroll na dráze nebubluje, na window přijde jen v capture fázi
    on('scroll', toTarget, { capture: true, passive: true });

    if (!holdTarget) {
      // reload / back-forward bez kotvy: pozici obnovuje prohlížeč, snap se
      // zapíná po načtení; s cílem se čeká až na scroll gesto (WebKit umí
      // přenesený offset aplikovat i po window.load)
      if (document.readyState === 'complete') {
        requestAnimationFrame(release);
      } else {
        on('load', () => requestAnimationFrame(release), { once: true });
      }
    }
    // dotek = snap hned (první swipe musí mít magnet), gesto = konec korekcí
    on('touchstart', activateSnap, { passive: true });
    on('touchmove', release, { passive: true });
    on('wheel', release, { passive: true });
    on('keydown', release);
    const mouseRelease = (event: Event) => {
      if ((event as PointerEvent).pointerType === 'mouse') release();
    };
    on('pointerdown', mouseRelease, { passive: true });
    on('pointermove', mouseRelease, { passive: true });
  };

  arm(
    (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)
      ?.type ?? 'navigate'
  );

  // bfcache návrat: skripty se nespouští, jen se vrátí snap-pending a guard
  // se natáhne znovu — chová se jako back/forward s kotvou z hashe
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    html.classList.add('snap-pending');
    arm('back_forward');
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
    // textová dráha má vlastní tečky (dynamické sloupce) — řeší initColumnSnap
    if (row.querySelector('.text-columns')) continue;

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

    const dotsBox = document.querySelector<HTMLElement>(
      `[data-dots-for="${row.dataset.row}"]`
    );
    let markers: HTMLElement[] = [];
    let dots: HTMLElement[] = [];

    // aktivní tečku určuje nejbližší snap marker k aktuální pozici dráhy
    // (marker se snap-align: start dojíždí na scroll-padding-inline-start)
    const syncActive = () => {
      if (!dots.length || !markers.length) return;
      const padStart = parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0;
      const pos = row.scrollLeft + padStart;
      let index = 0;
      let best = Infinity;
      markers.forEach((marker, i) => {
        const dist = Math.abs(marker.offsetLeft - pos);
        if (dist < best) {
          best = dist;
          index = i;
        }
      });
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    };

    const build = () => {
      for (const marker of row.querySelectorAll('.snap-marker')) marker.remove();
      markers = [];

      const columnWidth = parseFloat(getComputedStyle(flow).columnWidth);
      if (columnWidth) {
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

        // < 2 sloupce → vše se vejde, není co snapovat (ani co indikovat)
        if (starts.length >= 2) {
          for (const x of starts) {
            const marker = document.createElement('span');
            marker.className = 'snap-marker';
            marker.style.left = `${flow.offsetLeft + x}px`;
            marker.style.width = `${columnWidth}px`;
            row.appendChild(marker);
            markers.push(marker);
          }
        }
      }

      // tečky = počet snap sloupců (jedna na sloupec, nebo žádná)
      if (dotsBox && dots.length !== markers.length) {
        dotsBox.replaceChildren();
        dots = markers.map(() => {
          const dot = document.createElement('span');
          dot.className = 'dot';
          dotsBox.appendChild(dot);
          return dot;
        });
      }
      syncActive();
    };

    build();

    let scrollFrame = 0;
    row.addEventListener(
      'scroll',
      () => {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(syncActive);
      },
      { passive: true }
    );

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
