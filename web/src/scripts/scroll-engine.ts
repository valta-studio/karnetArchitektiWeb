// Scroll engine — POUZE pozoruje (IntersectionObserver) a synchronizuje UI.
// Řízení scrollu zůstává nativnímu CSS scroll snapu.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function scrollBehavior(): ScrollBehavior {
  return reducedMotion.matches ? 'auto' : 'smooth';
}

function levels(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.level[data-level]'));
}

/** Sleduje aktivní vertikální úroveň → podtržení v menu + hash v URL. */
function observeLevels(): void {
  const navLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')
  );

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = (entry.target as HTMLElement).dataset.level ?? '';
        for (const link of navLinks) {
          const isActive = link.dataset.navLink === id;
          link.classList.toggle('is-active', isActive);
          if (isActive) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        }
        const hash = id && id !== 'uvod' && id !== 'fotky' ? `#${id}` : ' ';
        history.replaceState(null, '', hash === ' ' ? location.pathname : hash);
      }
    },
    { threshold: 0.5 }
  );

  for (const level of levels()) observer.observe(level);
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
  observeLevels();
  observeRows();
  initKeyboard();
}
