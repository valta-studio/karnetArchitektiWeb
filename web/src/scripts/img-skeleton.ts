// Skeleton obrázků (img[data-skeleton]) — dokud se fotka stahuje, drží
// šedý podklad (global.css); po načtení ho třída is-loaded odstraní.
// Box má správné rozměry už před načtením (aspect-ratio z width/height).

export function initImgSkeleton(): void {
  const images = document.querySelectorAll<HTMLImageElement>('img[data-skeleton]');

  for (const img of images) {
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-loaded');
      continue;
    }
    const done = () => img.classList.add('is-loaded');
    img.addEventListener('load', done, { once: true });
    // i při chybě zastavit pulz — zůstane jen alt text
    img.addEventListener('error', done, { once: true });
  }
}
