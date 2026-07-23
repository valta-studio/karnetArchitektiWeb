// Scroll engine — POUZE pozoruje (IntersectionObserver) a synchronizuje UI.
// Řízení scrollu zůstává nativnímu CSS scroll snapu.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function scrollBehavior(): ScrollBehavior {
  return reducedMotion.matches ? 'auto' : 'smooth';
}

function levels(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.level[data-level]'));
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
        const hash = id && id !== 'uvod' && id !== 'fotky' ? `#${id}` : ' ';
        history.replaceState(null, '', hash === ' ' ? location.pathname : hash);
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

function scrollToLevel(index: number): void {
  const all = levels();
  const target = all[Math.max(0, Math.min(all.length - 1, index))];
  target?.scrollIntoView({ behavior: scrollBehavior() });
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
  observeLevels();
  observeRows();
  initColumnSnap();
  initKeyboard();
}
