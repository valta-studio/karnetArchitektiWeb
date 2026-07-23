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

export function portableTextToHtml(blocks: PortableTextBlock[] | undefined): string {
  if (!blocks?.length) return '';
  return blocks
    .filter((block) => block._type === 'block')
    .map((block) => {
      const inner = block.children
        .map((span) => {
          let html = escapeHtml(span.text);
          if (span.marks?.includes('strong')) html = `<strong>${html}</strong>`;
          if (span.marks?.includes('em')) html = `<em>${html}</em>`;
          return html;
        })
        .join('');
      return `<p>${inner}</p>`;
    })
    .join('\n');
}

export function portableTextToPlain(blocks: PortableTextBlock[] | undefined): string {
  if (!blocks?.length) return '';
  return blocks
    .map((block) => block.children.map((span) => span.text).join(''))
    .join(' ');
}
