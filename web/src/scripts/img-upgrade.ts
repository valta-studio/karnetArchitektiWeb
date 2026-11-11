// Dotažení plné kvality (img[data-full-srcset], SanityImage `preview`).
// Obrázek se nejdřív vykreslí v menší verzi se srcsetem/sizes jiného místa
// (první fotka karty = obálka z portfolia, prohlížeč ji vezme z cache).
// Po jejím načtení se přepne na plný srcset — prohlížeč starou bitmapu
// drží na obrazovce, dokud se nová nestáhne, takže výměna není vidět.
// Klony smyčky drah (cloneNode) nesou data-* také a přepnou se stejně.

function upgrade(img: HTMLImageElement): void {
  const { fullSrcset, fullSizes } = img.dataset;
  if (!fullSrcset) return;
  delete img.dataset.fullSrcset;
  delete img.dataset.fullSizes;
  if (fullSizes) img.sizes = fullSizes;
  img.srcset = fullSrcset;
}

export function initImgUpgrade(): void {
  for (const img of document.querySelectorAll<HTMLImageElement>('img[data-full-srcset]')) {
    if (img.complete && img.naturalWidth > 0) {
      upgrade(img);
      continue;
    }
    img.addEventListener('load', () => upgrade(img), { once: true });
    // když se menší verze nestáhne, zkusit rovnou plnou
    img.addEventListener('error', () => upgrade(img), { once: true });
  }
}
