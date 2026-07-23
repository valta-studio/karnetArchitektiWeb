// Úvodní video (v úvodu i jako podkres ateliéru): lazy autoplay až když je
// úroveň viditelná. Respektuje prefers-reduced-motion a Save-Data — pak
// zůstane poster/fotka.

export function initVideo(): void {
  const videos = Array.from(
    document.querySelectorAll<HTMLVideoElement>('video[data-intro-video]')
  );
  if (!videos.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection;
  if (reducedMotion || connection?.saveData) {
    for (const video of videos) video.removeAttribute('autoplay');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          // src se nastaví až při prvním zobrazení (lazy-load)
          for (const source of video.querySelectorAll<HTMLSourceElement>('source[data-src]')) {
            if (!source.src && source.dataset.src) source.src = source.dataset.src;
          }
          if (video.readyState === 0) video.load();
          video.play().catch(() => {
            /* autoplay zablokován — zůstane poster */
          });
        } else {
          video.pause();
        }
      }
    },
    { threshold: 0.3 }
  );

  for (const video of videos) observer.observe(video);
}
