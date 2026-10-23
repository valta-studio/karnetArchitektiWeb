// Scroll engine — POUZE pozoruje (IntersectionObserver) a synchronizuje UI.
// Řízení scrollu zůstává nativnímu CSS scroll snapu.

import { DEEP_LINKS } from '../lib/nav';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function scrollBehavior(): ScrollBehavior {
  return reducedMotion.matches ? 'auto' : 'smooth';
}

/** Nejvýš tolik teček je vidět najednou (vodorovné i svislé). */
const MAX_DOTS = 5;

/**
 * Aktivní tečka + okno nejvýš MAX_DOTS teček kolem ní (ostatní hidden).
 * Krajní tečka okna, za kterou jsou další skryté, je .is-edge (tlumená
 * — naznačuje, že pokračují).
 */
function syncDots(dots: HTMLElement[], activeIndex: number): void {
  const start = Math.max(
    0,
    Math.min(activeIndex - Math.floor(MAX_DOTS / 2), dots.length - MAX_DOTS)
  );
  const end = start + MAX_DOTS - 1;
  dots.forEach((dot, index) => {
    const isActive = index === activeIndex;
    dot.classList.toggle('is-active', isActive);
    if (isActive) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
    dot.hidden = index < start || index > end;
    dot.classList.toggle(
      'is-edge',
      !isActive && ((index === start && start > 0) || (index === end && end < dots.length - 1))
    );
  });
}

/**
 * Nové kolo smyčky: aktivní tečka „přeběhne" z konce na začátek (nebo
 * zpět) — dočasný pruh ve tvaru a barvě staré aktivní tečky doletí na
 * novou a rozplyne se. Fixed v <body>: okno teček se mezitím přestaví.
 */
function sweepDot(from: HTMLElement, fromRect: DOMRect, to: HTMLElement | undefined): void {
  if (!to || reducedMotion.matches) return;
  const toRect = to.getBoundingClientRect();
  const ghost = document.createElement('span');
  ghost.className = 'dot-sweep';
  Object.assign(ghost.style, {
    left: `${fromRect.left}px`,
    top: `${fromRect.top}px`,
    width: `${fromRect.width}px`,
    height: `${fromRect.height}px`,
    background: getComputedStyle(from).backgroundColor,
  });
  document.body.append(ghost);
  ghost
    .animate(
      [
        { translate: '0 0', opacity: 1 },
        { translate: `${toRect.left - fromRect.left}px 0`, opacity: 0 },
      ],
      { duration: 450, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }
    )
    .finished.catch(() => undefined)
    .finally(() => ghost.remove());
}

/** Vypočítá skutečnou scrollLeft pozici CSS snap cíle. */
function rowTargetLeft(row: HTMLElement, target: HTMLElement): number {
  const rowStyle = getComputedStyle(row);
  const targetStyle = getComputedStyle(target);
  const snapAlign = targetStyle.scrollSnapAlign;
  let left =
    target.offsetLeft -
    (parseFloat(rowStyle.scrollPaddingLeft) || 0) -
    (parseFloat(targetStyle.scrollMarginLeft) || 0);

  if (snapAlign.includes('center')) {
    left = target.offsetLeft - (row.clientWidth - target.offsetWidth) / 2;
  } else if (snapAlign.includes('end')) {
    left =
      target.offsetLeft -
      row.clientWidth +
      target.offsetWidth +
      (parseFloat(rowStyle.scrollPaddingRight) || 0);
  }

  const maxLeft = Math.max(0, row.scrollWidth - row.clientWidth);
  return Math.max(0, Math.min(maxLeft, left));
}

/** Posune vodorovnou dráhu na snap pozici prvku bez svislého pohybu stránky. */
function scrollRowTo(row: HTMLElement, target: HTMLElement): void {
  row.scrollTo({ left: rowTargetLeft(row, target), behavior: scrollBehavior() });
}

/** Panel je vykreslený — ne display: none (varianty panelů podle breakpointu). */
function isRendered(el: HTMLElement): boolean {
  return el.getClientRects().length > 0;
}

/** Výchozí pozice dráhy — u smyčky první originální panel, jinak začátek. */
function rowHomeLeft(row: HTMLElement): number {
  const first = Array.from(
    row.querySelectorAll<HTMLElement>(':scope > [data-loop-index]:not([data-loop-clone])')
  ).find(isRendered);
  return first ? rowTargetLeft(row, first) : 0;
}

/** Kopie panelu pro smyčku — pro čtečky skrytá, bez id, mimo tab pořadí. */
function cloneForLoop(panel: HTMLElement): HTMLElement {
  const clone = panel.cloneNode(true) as HTMLElement;
  clone.dataset.loopClone = '';
  clone.setAttribute('aria-hidden', 'true');
  clone.removeAttribute('id');
  for (const node of clone.querySelectorAll('[id]')) node.removeAttribute('id');
  for (const node of clone.querySelectorAll<HTMLElement>('a, button, [tabindex]')) {
    node.tabIndex = -1;
  }
  if (clone.matches('a, button')) clone.tabIndex = -1;
  return clone;
}

/**
 * Nekonečná smyčka vodorovných drah (.scroll-row[data-loop]). Panely se
 * naklonují na obě strany (celé sady, aspoň 1,5× šířka viewportu) a dráha
 * startuje na prvním originálu. Pohyb zůstává plně nativnímu x mandatory
 * snapu — JS až PO doběhnutí scrollu (scrollend, ve starších Safari klid
 * scroll událostí) okamžitě přeskočí z klonu na identický originál.
 * Obsah je stejný, takže skok není vidět; během gesta se nesahá na nic.
 */
function initLoopRows(): void {
  for (const row of document.querySelectorAll<HTMLElement>('.scroll-row[data-loop]')) {
    setupLoop(row);
    attachLoopJump(row);
  }
}

/** Dráha po přestavbě panelů (stránkování textu) — observeRows přepočítá. */
const ROW_REBUILT = 'row:rebuilt';

/** (Znovu)vytvoří klony smyčky z aktuálních originálů a vrátí dráhu domů. */
function setupLoop(row: HTMLElement): void {
  for (const clone of row.querySelectorAll(':scope > [data-loop-clone]')) clone.remove();
  const originals = Array.from(row.children) as HTMLElement[];
  if (originals.length < 2) return;

  originals.forEach((panel, index) => {
    panel.dataset.loopIndex = String(index);
  });

  // šířka sady jen z vykreslených panelů (skryté varianty nemají box)
  const rendered = originals.filter(isRendered);
  const first = rendered[0] ?? originals[0];
  const last = rendered[rendered.length - 1] ?? first;
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const setWidth = last.offsetLeft + last.offsetWidth - first.offsetLeft + gap;
  const copies = Math.max(2, Math.ceil((row.clientWidth * 1.5) / Math.max(1, setWidth)));

  for (let i = 0; i < copies; i += 1) {
    row.prepend(...originals.map(cloneForLoop));
    row.append(...originals.map(cloneForLoop));
  }

  row.scrollTo({ left: rowHomeLeft(row), behavior: 'instant' });
}

/**
 * Skok smyčky: po doběhnutí scrollu, stojí-li dráha na klonu snap cíle
 * (dítě dráhy s data-loop-index + data-loop-clone), přeskočí okamžitě na
 * originál se stejným indexem — hledá se v dráze podle indexu, takže skok
 * platí i po přestavbě panelů (setupLoop).
 */
function attachLoopJump(row: HTMLElement): void {
  const originalOf = (clone: HTMLElement) =>
    row.querySelector<HTMLElement>(
      `:scope > [data-loop-index="${clone.dataset.loopIndex}"]:not([data-loop-clone])`
    );

  // prst na dráze = gesto běží, skok by se s ním pral
  let touching = false;

  // obrázky originálů, které budou po skoku o `delta` vidět
  const imagesAfterJump = (delta: number): HTMLImageElement[] => {
    const view = row.getBoundingClientRect();
    const images: HTMLImageElement[] = [];
    for (const panel of row.querySelectorAll<HTMLElement>(
      ':scope > [data-loop-index]:not([data-loop-clone])'
    )) {
      const rect = panel.getBoundingClientRect();
      const left = rect.left - delta;
      if (left < view.right && left + rect.width > view.left) {
        images.push(...panel.querySelectorAll('img'));
      }
    }
    return images;
  };

  // stojí-li dráha na klonu, skok o rozdíl pozic na jeho originál
  let jumpToken = 0;
  const normalize = async () => {
    if (touching) return;
    let nearest: HTMLElement | undefined;
    let best = Infinity;
    for (const panel of row.children as HTMLCollectionOf<HTMLElement>) {
      if (panel.dataset.loopIndex === undefined || !isRendered(panel)) continue;
      const distance = Math.abs(row.scrollLeft - rowTargetLeft(row, panel));
      if (distance < best) {
        best = distance;
        nearest = panel;
      }
    }
    if (!nearest || nearest.dataset.loopClone === undefined) return;
    // skáče se jen v klidu na snap pozici — mimo ni gesto ještě běží
    // (trackpad v Safari: prsty stojí uprostřed tahu, snap přijde až po
    // zvednutí; skok uprostřed gesta WebKitu rozhodí výběr snap cíle)
    if (best > 2) return;
    const original = originalOf(nearest);
    if (!original) return;
    const delta = original.offsetLeft - nearest.offsetLeft;
    const from = row.scrollLeft;
    const token = ++jumpToken;

    // Originály mimo obrazovku bývají nestažené (loading=lazy) nebo
    // nedekódované (Safari) — skok by na místě klonu problikl prázdným
    // boxem. Skáče se až s hotovými obrázky; co nestihne 2 s, zkusí
    // znovu příští doběhnutí scrollu (klony do té doby vypadají stejně).
    // Stejně tak se čeká na rozjeté přechody (opacity podle vzdálenosti)
    // — skok by je utnul a originál by bliknul rovnou na cílovou hodnotu.
    const images = imagesAfterJump(delta);
    for (const img of images) img.loading = 'eager';
    const transitions = row
      .getAnimations({ subtree: true })
      .filter((animation) => animation instanceof CSSTransition);
    await Promise.race([
      Promise.all([
        ...images.map((img) => img.decode().catch(() => undefined)),
        ...transitions.map((transition) => transition.finished.catch(() => undefined)),
      ]),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
    if (token !== jumpToken || touching || Math.abs(row.scrollLeft - from) > 1) return;
    if (!images.every((img) => img.complete)) return;

    // Vzdálenost od aktivního (data-row-distance, observeRows) se posune
    // o stejný počet panelů jako pozice — synchronně se skokem, jinak by
    // originál jeden snímek nesl starou vzdálenost (např. opacity 0.3).
    // Přechody jsou po dobu skoku vypnuté (scroll.css).
    const panels = Array.from(row.children) as HTMLElement[];
    const shift = panels.indexOf(original) - panels.indexOf(nearest);
    const distances = panels.map((panel) => panel.dataset.rowDistance);
    if (distances.some((distance) => distance !== undefined)) {
      panels.forEach((panel, i) => {
        panel.dataset.rowDistance = distances[i - shift] ?? '2';
      });
    }
    row.dataset.loopJump = '';
    row.scrollTo({ left: from + delta, behavior: 'instant' });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        delete row.dataset.loopJump;
      })
    );
  };

  let timer = 0;
  const schedule = () => {
    clearTimeout(timer);
    timer = window.setTimeout(normalize, 150);
  };
  row.addEventListener(
    'touchstart',
    () => {
      touching = true;
    },
    { passive: true }
  );
  const touchEnd = () => {
    touching = false;
    if (!('onscrollend' in window)) schedule();
  };
  row.addEventListener('touchend', touchEnd, { passive: true });
  row.addEventListener('touchcancel', touchEnd, { passive: true });

  // kolečko / trackpad = gesto běží: čekající skok zrušit. Bez scrollend
  // (Safari) se klid počítá i od wheel událostí — setrvačnost trackpadu
  // je posílá ještě po doběhnutí snapu
  row.addEventListener(
    'wheel',
    () => {
      jumpToken += 1;
      if (!('onscrollend' in window)) schedule();
    },
    { passive: true }
  );

  if ('onscrollend' in window) {
    row.addEventListener('scrollend', normalize);
  } else {
    row.addEventListener('scroll', schedule, { passive: true });
  }
}

// hash se píše jen pro hlavní úrovně homepage (úvod ne — vršek bez kotvy);
// implicitní hash na kartě projektu (#text, #menu…) by po reloadu nebo
// obnovení tabu otevřel stránku uprostřed — mobilní prohlížeče taby
// běžně zahazují a obnovují reloadem
const deepLinkIds = new Set(DEEP_LINKS.map((link) => link.id));

function levels(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.level[data-level]'));
}

/** Svislý scroller — vnitřní kontejner, ne kořenový dokument (viz scroll.css). */
function deck(): HTMLElement {
  return document.querySelector<HTMLElement>('.scroll-deck') ?? document.documentElement;
}

/** scrollTop decku, který dostane vršek prvku na vršek viewportu. */
function levelTopInDeck(el: HTMLElement, scroller: HTMLElement): number {
  return el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
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
  const scroller = deck();

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
      const top = holdTarget === 'top' ? 0 : levelTopInDeck(holdTarget, scroller);
      if (Math.abs(scroller.scrollTop - top) > 1) {
        scroller.scrollTo({ top, left: 0, behavior: 'instant' });
      }
      // dráhy se srážejí na začátek jen u startu od vršku — při návratu na
      // úroveň si prohlížeč smí obnovit vodorovnou pozici (portfolio pás)
      // (smyčka: „začátek" = první originální panel, ne klony před ním)
      if (holdTarget !== 'top') return;
      for (const row of document.querySelectorAll<HTMLElement>('.scroll-row')) {
        const home = rowHomeLeft(row);
        if (Math.abs(row.scrollLeft - home) > 1) row.scrollTo({ left: home, behavior: 'instant' });
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

  levelDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      const target = allLevels[index];
      if (target) scrollToTarget(target);
    });
  });

  const setActive = (target: HTMLElement): void => {
    const id = target.dataset.level ?? '';
    for (const link of navLinks) {
      const isActive = link.dataset.navLink === id;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    const index = allLevels.indexOf(target);
    syncDots(levelDots, index);
    const hash = deepLinkIds.has(id) ? `#${id}` : '';
    if (location.hash !== hash) {
      history.replaceState(null, '', hash || location.pathname);
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (!entry.isIntersecting) {
          // návrat z menu úrovně (desktop): úroveň pod ní je sticky a
          // z viewportu neodchází, takže žádný vstupní záznam nepřijde —
          // aktivní úroveň se dopočítá z pozice ve viewportu
          if (target.dataset.level === 'menu') {
            const active = allLevels[activeLevelIndex()];
            if (active) setActive(active);
          }
          continue;
        }
        // menu overlay na mobilu: fixed přes celý viewport, takže „protíná"
        // i zavřený (visibility geometrii nemění) — do snap toku nepatří,
        // aktivní úroveň (podtržení, tečky, hash) zůstává ta pod ním
        if (getComputedStyle(target).position === 'fixed') continue;
        setActive(target);
      }
    },
    // root = deck (svislý scroller), ne viewport: intersekce se počítá
    // proti scrollovanému kontejneru
    { root: deck(), threshold: 0.5 }
  );

  for (const level of allLevels) observer.observe(level);
}

/** Sleduje pozici v horizontálních drahách → progress dots. */
function observeRows(): void {
  for (const row of document.querySelectorAll<HTMLElement>('.scroll-row[data-row]')) {
    const dotsBox = document.querySelector<HTMLElement>(`[data-dots-for="${row.dataset.row}"]`);
    if (!dotsBox) continue;

    // smyčka (initLoopRows): klony nesou data-loop-index svého originálu,
    // tečka patří originálu i všem jeho klonům
    let all = Array.from(row.children) as HTMLElement[];
    let panels = all.filter((panel) => panel.dataset.loopClone === undefined);
    const originalOf = (panel: HTMLElement) =>
      panel.dataset.loopIndex === undefined ? panel : panels[Number(panel.dataset.loopIndex)];

    // Panely můžou mít varianty podle breakpointu (display: none) — tečky
    // i vzdálenosti se počítají jen z vykreslených; při změně šířky znovu.
    let rendered: HTMLElement[] = [];
    let visible: HTMLElement[] = [];
    let dots: HTMLElement[] = [];
    let lastActive: HTMLElement | undefined;

    // Aktivní je panel, jehož skutečná snap pozice je nejblíž scrollLeft.
    const nearest = (candidates: HTMLElement[]) => {
      let found: HTMLElement | undefined;
      let bestDistance = Infinity;
      for (const panel of candidates) {
        const distance = Math.abs(row.scrollLeft - rowTargetLeft(row, panel));
        if (distance < bestDistance) {
          bestDistance = distance;
          found = panel;
        }
      }
      return found;
    };

    // tečka na každý vykreslený originál; ve smyčce jede k nejbližší
    // kopii cíle (kratší cestou)
    const buildDots = () => {
      dots = visible.map((original, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'dot';
        dot.dataset.dot = '';
        dot.setAttribute('aria-label', `Přejít na pozici ${index + 1} z ${visible.length}`);
        dot.addEventListener('click', () => {
          const target = nearest(rendered.filter((panel) => originalOf(panel) === original));
          if (target) scrollRowTo(row, target);
        });
        return dot;
      });
      dotsBox.replaceChildren(...dots);
    };

    // Na desktopu je často viditelných více užších panelů najednou,
    // takže IntersectionObserver neumí spolehlivě určit aktivní snap cíl.
    // Panely navíc dostanou vzdálenost od aktivního v pořadí (0, 1, 2+)
    // — styl podle ní tlumí okolí (portfolio, ateliér); klony se počítají.
    // Přešla aktivní pozice šev smyčky (první panel sady)? Vpřed = nově
    // aktivní je za ním nebo na něm, vzad = aktivní ho opustila doleva.
    // Skok smyčky (normalize) posouvá o celé sady — ten se nepočítá.
    const crossedSeam = (fromAt: number, toAt: number): boolean => {
      if (row.dataset.loop === undefined || visible.length < 3) return false;
      if (Math.abs(toAt - fromAt) >= visible.length) return false;
      const first = visible[0].dataset.loopIndex;
      const passed =
        toAt > fromAt ? rendered.slice(fromAt + 1, toAt + 1) : rendered.slice(toAt + 1, fromAt + 1);
      return passed.some((panel) => panel.dataset.loopIndex === first);
    };

    const syncActive = () => {
      const active = nearest(rendered);
      const activeDot = active ? visible.indexOf(originalOf(active)) : 0;
      if (!active || active === lastActive) {
        syncDots(dots, activeDot);
        return;
      }
      const from = dots.find((dot) => dot.classList.contains('is-active'));
      const fromRect = from?.getBoundingClientRect();
      const fromAt = lastActive ? rendered.indexOf(lastActive) : -1;
      syncDots(dots, activeDot);
      lastActive = active;
      const activeAt = rendered.indexOf(active);
      rendered.forEach((panel, i) => {
        panel.dataset.rowDistance = String(Math.min(2, Math.abs(i - activeAt)));
      });
      if (from && fromRect && fromAt >= 0 && crossedSeam(fromAt, activeAt)) {
        sweepDot(from, fromRect, dots[activeDot]);
      }
    };

    const refresh = () => {
      rendered = all.filter(isRendered);
      // průměrná vzdálenost středů sousedních panelů — krok plynulého
      // tlumení okolí (.row-fade, scroll.css)
      if (rendered.length > 1) {
        const center = (panel: HTMLElement) => panel.offsetLeft + panel.offsetWidth / 2;
        const step =
          (center(rendered[rendered.length - 1]) - center(rendered[0])) / (rendered.length - 1);
        row.style.setProperty('--row-step', `${step.toFixed(1)}px`);
      }
      const nextVisible = panels.filter(isRendered);
      const changed =
        nextVisible.length !== visible.length || nextVisible.some((p, i) => p !== visible[i]);
      visible = nextVisible;
      if (changed) {
        buildDots();
        lastActive = undefined;
      }
      syncActive();
    };

    let scrollFrame = 0;
    row.addEventListener(
      'scroll',
      () => {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = requestAnimationFrame(syncActive);
      },
      { passive: true }
    );

    const resizeObserver = new ResizeObserver(refresh);
    resizeObserver.observe(row);
    panels.forEach((panel) => resizeObserver.observe(panel));

    // přestavba panelů (stránkování textu + nové klony) → nové seznamy
    row.addEventListener(ROW_REBUILT, () => {
      all = Array.from(row.children) as HTMLElement[];
      panels = all.filter((panel) => panel.dataset.loopClone === undefined);
      visible = [];
      refresh();
    });
    refresh();
  }
}

/**
 * Stránkování textu (karta projektu, odstavce s data-paginate): odstavec
 * vyšší než jeho max-height se rozdělí po slovech do více panelů podobné
 * výšky — každý panel pak drží text svisle na středu (jako ateliér).
 * Přesné měření potřebuje načtený font, proto se po document.fonts.ready
 * a při změně šířky stránkuje znovu z původního textu (+ nové klony smyčky).
 */
function initTextPagination(): void {
  for (const row of document.querySelectorAll<HTMLElement>('.scroll-row')) {
    const sources = Array.from(
      row.querySelectorAll<HTMLElement>(':scope > * > [data-paginate]')
    ).map((paragraph) => ({ paragraph, text: paragraph.textContent ?? '' }));
    if (!sources.length) continue;

    let signature = '';

    // části jednoho odstavce: n dílů podobné délky, dokud se každý vejde
    const split = (paragraph: HTMLElement, text: string): string[] => {
      paragraph.textContent = text;
      const maxHeight = parseFloat(getComputedStyle(paragraph).maxHeight);
      if (!maxHeight || paragraph.scrollHeight <= maxHeight + 1) return [text];
      const words = text.match(/\S+\s*/g) ?? [text];
      const total = text.length;
      for (let n = Math.ceil(paragraph.scrollHeight / maxHeight); n <= 12; n += 1) {
        const parts: string[] = Array.from({ length: n }, () => '');
        let length = 0;
        for (const word of words) {
          parts[Math.min(n - 1, Math.floor((length / total) * n))] += word;
          length += word.length;
        }
        const trimmed = parts.map((part) => part.trim()).filter(Boolean);
        const fits = trimmed.every((part) => {
          paragraph.textContent = part;
          return paragraph.scrollHeight <= maxHeight + 1;
        });
        if (fits) return trimmed;
      }
      return [text];
    };

    // vrací true, pokud se rozdělení změnilo (a DOM přestavěl)
    const paginate = (): boolean => {
      const result = sources.map(({ paragraph, text }) => split(paragraph, text));
      const next = JSON.stringify(result);
      if (next === signature) {
        sources.forEach(({ paragraph }, i) => (paragraph.textContent = result[i][0]));
        return false;
      }
      signature = next;
      for (const extra of row.querySelectorAll(':scope > [data-page-part]')) extra.remove();
      sources.forEach(({ paragraph }, i) => {
        const [first, ...rest] = result[i];
        paragraph.textContent = first;
        let after = paragraph.parentElement as HTMLElement;
        for (const part of rest) {
          const panel = after.cloneNode(false) as HTMLElement;
          const copy = paragraph.cloneNode(false) as HTMLElement;
          panel.dataset.pagePart = '';
          delete panel.dataset.loopIndex;
          delete panel.dataset.rowDistance;
          delete copy.dataset.paginate;
          copy.textContent = part;
          panel.append(copy);
          after.after(panel);
          after = panel;
        }
      });
      return true;
    };

    // stránkuje se na originálech (měření v jejich panelech); klony smyčky
    // se po změně rozdělení vytvoří znovu z nových originálů
    const rebuild = () => {
      if (!paginate()) return;
      if (row.dataset.loop !== undefined) setupLoop(row);
      row.dispatchEvent(new Event(ROW_REBUILT));
    };

    paginate();

    // font (Karnet) mění metriky — přesné rozdělení až s ním
    let width = row.clientWidth;
    document.fonts.ready.then(rebuild);

    // jen změna šířky (rotace, okno) — výška se se schováním address baru
    // mění pořád, svh strop textu ale ne
    let frame = 0;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (row.clientWidth === width) return;
        width = row.clientWidth;
        rebuild();
      });
    });
  }
}

function activeLevelIndex(): number {
  const all = levels();
  const mid = window.innerHeight / 2;
  // odzadu: sticky úroveň pod menu překrývá střed viewportu i tehdy,
  // když už přes ni menu najelo — vyhrává pozdější úroveň v DOM.
  // Fixed menu overlay (mobil) střed překrývá vždy, do toku nepatří.
  for (let i = all.length - 1; i >= 0; i -= 1) {
    if (getComputedStyle(all[i]).position === 'fixed') continue;
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
  // sticky úroveň pod menu (desktop): přilnutá je „vidět" pořád, takže
  // scrollIntoView by nikam nejel — cílem je její statický slot
  if (getComputedStyle(target).position === 'sticky' && target.parentElement) {
    target = target.parentElement;
  }

  if (reducedMotion.matches) {
    target.scrollIntoView();
    return;
  }

  const token = ++jumpToken;
  const html = document.documentElement;
  const scroller = deck();
  html.classList.add('is-jumping');
  target.scrollIntoView({ behavior: 'smooth' });

  const started = performance.now();
  let lastY = scroller.scrollTop;
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
    const y = scroller.scrollTop;
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
    // otevřený menu overlay (mobil): stránka pod ním stojí
    if (document.documentElement.classList.contains('menu-open')) return;
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
        const panel = row.children[0] as HTMLElement | undefined;
        const step = panel?.offsetWidth ?? window.innerWidth;
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
  // klony smyčky musí existovat dřív, než guard srovná dráhy na začátek
  // a než observeRows / initImgSkeleton posbírají panely a obrázky
  initTextPagination();
  initLoopRows();
  initSnapActivation();
  observeLevels();
  observeRows();
  initKeyboard();
}
