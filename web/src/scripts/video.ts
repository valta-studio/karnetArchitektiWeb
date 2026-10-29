// Úvodní video: lazy autoplay až když je úroveň viditelná. V podkresech
// dalších úrovní NEBĚŽÍ druhý <video> se stejným URL (dvojí stažení i dvojí
// dekodér) — je tam canvas, do kterého zrcadlíme snímky téhož elementu.
// Respektuje prefers-reduced-motion, Save-Data a 2G — pak zůstane poster/fotka.
// Stahování videa začne až po `load`, aby nekonkurovalo posteru (LCP) a fontům.

const painting = new Set<HTMLCanvasElement>();

export function initVideo(): void {
  const videos = Array.from(
    document.querySelectorAll<HTMLVideoElement>('video[data-intro-video]')
  );
  if (!videos.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  const slowNetwork = connection?.effectiveType?.endsWith('2g') ?? false;
  if (reducedMotion || connection?.saveData || slowNetwork) {
    for (const video of videos) video.removeAttribute('autoplay');
    return;
  }

  if (document.readyState === 'complete') observeVideos(videos);
  else window.addEventListener('load', () => observeVideos(videos), { once: true });
}

function observeVideos(videos: HTMLVideoElement[]): void {
  const source = videos[0];
  const mirrors = Array.from(
    document.querySelectorAll<HTMLCanvasElement>('canvas[data-intro-mirror]')
  );
  const mirrorOwners = new Map<Element, HTMLCanvasElement[]>();
  for (const mirror of mirrors) {
    const owner = mirror.closest<HTMLElement>('[data-level]') ?? mirror;
    mirrorOwners.set(owner, [...(mirrorOwners.get(owner) ?? []), mirror]);
  }

  // Video hraje, dokud ho chce aspoň jeden pozorovatel — buď vlastní úroveň,
  // nebo viditelné zrcadlo v úrovni jiné.
  const wanted = new Map<HTMLVideoElement, Set<Element>>();

  const request = (video: HTMLVideoElement, by: Element) => {
    const owners = wanted.get(video) ?? new Set<Element>();
    owners.add(by);
    wanted.set(video, owners);
    // src se nastaví až při prvním zobrazení (lazy-load)
    for (const source of video.querySelectorAll<HTMLSourceElement>('source[data-src]')) {
      if (!source.src && source.dataset.src) source.src = source.dataset.src;
    }
    if (video.readyState === 0) video.load();
    video.play().catch(() => {
      /* autoplay zablokován — zůstane poster */
    });
  };

  const release = (video: HTMLVideoElement, by: Element) => {
    const owners = wanted.get(video);
    owners?.delete(by);
    if (!owners?.size) video.pause();
  };

  // Zrcadlo kreslí, jen když je úroveň vidět, canvas vykreslený (skrytý
  // breakpoint ne) a dráha úrovně stojí na výchozím panelu — po přejetí
  // vlevo/vpravo podkres zmizí (data-row-at-start, scroll-engine).
  const intersecting = new Set<Element>();
  const syncMirrors = (owner: Element) => {
    const ownMirrors = mirrorOwners.get(owner) ?? [];
    const row = owner.querySelector('.scroll-row[data-row]');
    const atStart = !row || row.hasAttribute('data-row-at-start');
    const shown = intersecting.has(owner) && atStart
      ? ownMirrors.filter((mirror) => mirror.clientWidth > 0)
      : [];
    if (shown.length) {
      request(source, owner);
      for (const mirror of shown) startMirror(mirror, source);
    } else {
      release(source, owner);
      for (const mirror of ownMirrors) painting.delete(mirror);
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target;
        if (entry.isIntersecting) intersecting.add(target);
        else intersecting.delete(target);
        if (target instanceof HTMLVideoElement) {
          if (entry.isIntersecting) request(target, target);
          else release(target, target);
        } else {
          syncMirrors(target);
        }
      }
    },
    { threshold: 0.01 }
  );

  for (const video of videos) observer.observe(video);
  for (const owner of mirrorOwners.keys()) {
    observer.observe(owner);
    new MutationObserver(() => syncMirrors(owner)).observe(owner, {
      subtree: true,
      attributeFilter: ['data-row-at-start'],
    });
  }
}

function startMirror(canvas: HTMLCanvasElement, video: HTMLVideoElement): void {
  if (painting.has(canvas)) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  painting.add(canvas);

  // Ne requestVideoFrameCallback — zdrojové video je v tu chvíli mimo
  // viewport, prohlížeč ho nepresentuje a callback by nechodil.
  let painted = -1;
  const draw = () => {
    if (!painting.has(canvas)) return;
    if (video.readyState >= 2 && video.videoWidth && video.currentTime !== painted) {
      paint(ctx, canvas, video);
      painted = video.currentTime;
    }
    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
}

/** Ořez „cover" — canvas object-fit nemá, počítáme ho ručně. */
function paint(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(canvas.clientWidth * dpr);
  const height = Math.round(canvas.clientHeight * dpr);
  if (!width || !height) return;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
  const drawWidth = video.videoWidth * scale;
  const drawHeight = video.videoHeight * scale;
  ctx.drawImage(video, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}
