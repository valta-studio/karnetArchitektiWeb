// Minimalistický renderer portable textu (odstavce + strong/em).
// Záměrně bez závislosti — obsah ateliéru jsou prosté odstavce.

import type { PortableTextBlock } from '../types/sanity';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function blockToHtml(block: PortableTextBlock): string {
  return block.children
    .map((span) => {
      let html = escapeHtml(span.text).replaceAll('\n', '<br />');
      if (span.marks?.includes('strong')) html = `<strong>${html}</strong>`;
      if (span.marks?.includes('em')) html = `<em>${html}</em>`;
      return html;
    })
    .join('');
}

function isEmptyBlock(block: PortableTextBlock): boolean {
  return block.children.every((span) => !span.text.trim());
}

export function portableTextToHtml(blocks: PortableTextBlock[] | undefined): string {
  if (!blocks?.length) return '';
  const textBlocks = blocks.filter((block) => block._type === 'block');

  // Obsah psaný „psacím strojem" (každý řádek = blok, prázdný blok odděluje
  // odstavce) se seskupí do skutečných odstavců — jinak by mezera mezi <p>
  // působila jako rozbité řádkování. Bez prázdných bloků je blok = odstavec.
  if (textBlocks.some(isEmptyBlock)) {
    const paragraphs: string[][] = [[]];
    for (const block of textBlocks) {
      if (isEmptyBlock(block)) {
        if (paragraphs[paragraphs.length - 1].length) paragraphs.push([]);
      } else {
        paragraphs[paragraphs.length - 1].push(blockToHtml(block));
      }
    }
    return paragraphs
      .filter((lines) => lines.length)
      .map((lines) => `<p>${lines.join('<br />')}</p>`)
      .join('\n');
  }

  return textBlocks.map((block) => `<p>${blockToHtml(block)}</p>`).join('\n');
}

export function portableTextToPlain(blocks: PortableTextBlock[] | undefined): string {
  if (!blocks?.length) return '';
  return blocks
    .map((block) => block.children.map((span) => span.text).join(''))
    .join(' ');
}
