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

  // svislé gesto nad otevřeným overlayem nesmí projít na root scroller
  // (úrovně pod menu by se posouvaly). Root nejde zamknout přes CSS:
  // overflow: hidden na <html> zahodí scroll pozici. Pokud se obsah menu
  // nevejde a overlay sám scrolluje, gesto se nechává jemu —
  // overscroll-behavior: contain pak zastaví řetězení na root.
  const screen = document.querySelector<HTMLElement>('[data-level="menu"]');
  if (screen) {
    const blockScroll = (event: Event) => {
      if (!html.classList.contains(MENU_OPEN)) return;
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

  initMenuAtEnd();
}

/**
 * Menu posunem na konci stránky (.scroll-deck[data-menu-at-end], hlavní
 * stránka i karta projektu): další posun dolů na usazené poslední úrovni
 * menu otevře, posun nahoru s otevřeným menu ho zavře. Počítá se jen NOVÉ gesto —
 * doběh setrvačnosti scrollu, který na konec teprve dojel, menu neotevře.
 * Zbytek gesta, které menu zavřelo, se spolkne (jinak by stránka zároveň
 * odjela o úroveň výš). Scroll sám se neovládá, jen se čte pozice a gesto.
 */
function initMenuAtEnd(): void {
  const deck = document.querySelector<HTMLElement>('.scroll-deck[data-menu-at-end]');
  if (!deck) return;
  const html = document.documentElement;
  const screen = document.querySelector<HTMLElement>('[data-level="menu"]');

  const THRESHOLD = 60; // px tahu / součtu kolečka, než se menu otevře/zavře
  const GESTURE_GAP = 250; // ms bez kolečka = další události jsou nové gesto
  const SETTLE = 250; // ms bez scrollu decku = usazeno
  // Jak dlouho po zavření se polyká zbytek zavíracího gesta. Krátce:
  // setrvačnost trackpadu posílá události i sekundy a nové gesto do ní
  // navazuje bez pauzy — zrušená (preventDefault) první událost gesta
  // by v Chrome zablokovala celé další gesto („scroll nefunguje, dokud
  // se neklikne").
  const SWALLOW_MAX = 350;

  let lastDeckScroll = 0;
  deck.addEventListener('scroll', () => (lastDeckScroll = performance.now()), {
    passive: true,
  });

  const isOpen = () => html.classList.contains(MENU_OPEN);
  const atEnd = () => deck.scrollTop + deck.clientHeight >= deck.scrollHeight - 2;
  const settledAtEnd = () =>
    atEnd() &&
    performance.now() - lastDeckScroll > SETTLE &&
    !isOpen() &&
    !html.classList.contains('is-jumping');
  // zavírá se až s menu odscrollovaným na vršek (malé displeje — obsah
  // menu se nevejde a posouvá se sám)
  const menuAtTop = () => !screen || screen.scrollTop <= 0;

  // kolečko / trackpad. Nové gesto se pozná i bez pauzy: setrvačnost
  // trackpadu posílá události bez přestávky a jejich velikost jen klesá —
  // nový tah ji přeruší a velikost znovu ROSTE; obrat směru je nové gesto
  // vždy. Samotná pauza by nestačila: další tah navazuje na doběh
  // předchozího a menu by šlo otevřít až po kliknutí (= pauze).
  let lastWheel = 0;
  let lastDelta = 0;
  let mode: 'open' | 'close' | 'swallow' | null = null;
  let wheelSum = 0;
  let closedAt = 0;

  // Blokující (passive: false) posluchač jen tehdy, kdy se gesto opravdu
  // ruší — s otevřeným menu a krátce po jeho zavření (polykání). Jinak
  // pasivní: blokující wheel posluchač na window nutí Safari u každého
  // gesta čekat na hlavní vlákno — vodorovný tah trackpadem doleva (= směr
  // gesta „zpět" v historii) se pak rozjížděl až po dlouhém tahu.
  const swallowing = () => mode === 'swallow' && performance.now() - closedAt <= SWALLOW_MAX;
  let blocking = false;
  const syncBlocking = () => {
    const block = isOpen() || swallowing();
    if (block === blocking) return;
    blocking = block;
    // passive není součástí identity posluchače — remove + add ho přepne
    window.removeEventListener('wheel', onWheel);
    window.addEventListener('wheel', onWheel, { passive: !block });
  };
  new MutationObserver(syncBlocking).observe(html, {
    attributes: true,
    attributeFilter: ['class'],
  });

  const onWheel = (event: WheelEvent) => {
    const now = performance.now();
    const dy = event.deltaY;
    // vodorovné gesto (dráha) se nepočítá
    if (Math.abs(dy) <= Math.abs(event.deltaX)) {
      lastWheel = now;
      return;
    }
    const pause = now - lastWheel > GESTURE_GAP;
    const flip = Math.sign(dy) !== Math.sign(lastDelta);
    const rise = !flip && Math.abs(dy) > Math.abs(lastDelta) + 2;
    lastWheel = now;
    lastDelta = dy;

    if (mode === 'swallow') {
      if (now - closedAt <= SWALLOW_MAX && !flip) {
        event.preventDefault();
        return;
      }
      mode = null;
    }
    if (pause || flip) mode = null;
    if (!mode && (pause || flip || rise)) {
      wheelSum = 0;
      if (isOpen()) mode = dy < 0 && menuAtTop() ? 'close' : null;
      else mode = dy > 0 && settledAtEnd() ? 'open' : null;
    }
    if (!mode) return;

    wheelSum += dy;
    if (mode === 'open' && wheelSum > THRESHOLD) {
      mode = null;
      setMenuOpen(true);
    } else if (mode === 'close' && wheelSum < -THRESHOLD) {
      // swallow před zavřením — syncBlocking (MutationObserver) pak
      // posluchač nechá blokující po dobu polykání
      mode = 'swallow';
      closedAt = now;
      setMenuOpen(false);
      event.preventDefault();
      window.setTimeout(syncBlocking, SWALLOW_MAX + 1);
    }
  };
  window.addEventListener('wheel', onWheel, { passive: true });
  syncBlocking();

  // dotyk: tah prstem nahoru (= posun dolů) na usazeném konci otevře,
  // tah dolů (= posun nahoru) s otevřeným menu zavře
  let touchStart: { x: number; y: number; mode: 'open' | 'close' } | null = null;
  let swallowTouch = false;
  window.addEventListener(
    'touchstart',
    (event) => {
      const touch = event.touches[0];
      swallowTouch = false;
      touchStart = null;
      if (!touch) return;
      if (isOpen()) {
        if (menuAtTop()) touchStart = { x: touch.clientX, y: touch.clientY, mode: 'close' };
      } else if (atEnd() && !html.classList.contains('is-jumping')) {
        // dotek je vždy nové gesto — stačí stát na konci (i během doběhu)
        touchStart = { x: touch.clientX, y: touch.clientY, mode: 'open' };
      }
    },
    { passive: true }
  );
  window.addEventListener(
    'touchmove',
    (event) => {
      if (swallowTouch) {
        event.preventDefault();
        return;
      }
      const touch = event.touches[0];
      if (!touchStart || !touch) return;
      const dy = touchStart.y - touch.clientY;
      const dx = Math.abs(touchStart.x - touch.clientX);
      if (touchStart.mode === 'open' && dy > THRESHOLD && dy > dx) {
        touchStart = null;
        setMenuOpen(true);
      } else if (touchStart.mode === 'close' && -dy > THRESHOLD && -dy > dx) {
        touchStart = null;
        swallowTouch = true;
        setMenuOpen(false);
        event.preventDefault();
      }
    },
    { passive: false }
  );

  // klávesnice: šipka dolů / PageDown na poslední úrovni otevře, šipka
  // nahoru / PageUp s otevřeným menu zavře. Capture — dřív než klávesová
  // navigace scroll-engine; preventDefault ji pak vynechá.
  window.addEventListener(
    'keydown',
    (event) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const down = event.key === 'ArrowDown' || event.key === 'PageDown';
      const up = event.key === 'ArrowUp' || event.key === 'PageUp';
      if (down && settledAtEnd()) {
        event.preventDefault();
        setMenuOpen(true);
      } else if (up && isOpen() && menuAtTop()) {
        event.preventDefault();
        setMenuOpen(false);
      }
    },
    { capture: true }
  );
}
