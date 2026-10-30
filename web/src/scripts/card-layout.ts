// Karta projektu: fotky (PhotoRow) i pás výkresů (DrawingsRow) sedí svisle
// na středu mezi spodní hranou loga a horní hranou názvu projektu (fixní,
// vidět na všech úrovních) — stejná mezera nad i pod. Logo i název se můžou
// zalomit do více řádků (délka názvu, šířka obrazovky), proto se hrany
// měří — JS jen nastaví --card-top / --card-bottom na <html> (výchozí
// hodnoty v global.css), scroll neřídí.

// Hrany písma, ne řádků: Karnet Primary (hhea) má ascent 1.0 a descent
// 0.2 em, verzálky 0.7 em. Řádek výšky L em má účaří (L − 1.2) / 2 + 1.0 em
// od svého vršku — logo (L = 1): spodek verzálek 0.1 em nad spodkem boxu;
// název (L = 1.2): vršek verzálek 0.3 em pod vrškem boxu.
const ASCENT = 1;
const DESCENT = 0.2;
const CAP_HEIGHT = 0.7;

/** Velikost písma, výška řádku a poloha účaří od vršku řádku (px). */
function lineMetrics(el: HTMLElement) {
  const style = getComputedStyle(el);
  const fontSize = parseFloat(style.fontSize);
  const lineHeight = parseFloat(style.lineHeight) || fontSize;
  const baseline = (lineHeight - (ASCENT + DESCENT) * fontSize) / 2 + ASCENT * fontSize;
  return { fontSize, lineHeight, baseline };
}

export function initCardLayout(): void {
  const root = document.documentElement;
  const title = document.querySelector<HTMLElement>('.photo-row-title');
  const logo = document.querySelector<HTMLElement>('.site-header .logo');
  if (!title || !logo) return;

  const sync = () => {
    const logoRect = logo.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const logoMetrics = lineMetrics(logo);
    const titleMetrics = lineMetrics(title);
    // spodek verzálek posledního řádku loga
    const logoInkBottom = logoRect.bottom - logoMetrics.lineHeight + logoMetrics.baseline;
    // vršek verzálek prvního řádku názvu
    const titleInkTop =
      titleRect.top + titleMetrics.baseline - CAP_HEIGHT * titleMetrics.fontSize;
    root.style.setProperty('--card-top', `${Math.round(logoInkBottom)}px`);
    root.style.setProperty('--card-bottom', `${Math.round(window.innerHeight - titleInkTop)}px`);
  };

  const resizeObserver = new ResizeObserver(sync);
  resizeObserver.observe(logo);
  resizeObserver.observe(title);
  window.addEventListener('resize', sync);
  document.fonts.ready.then(sync);
  sync();
}
