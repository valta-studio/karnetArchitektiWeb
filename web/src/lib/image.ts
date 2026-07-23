// Helpery pro Sanity Image CDN — srcset breakpointy, hotspot ořez.
// Obrázky se na webu renderují VÝHRADNĚ přes components/SanityImage.astro.

import imageUrlBuilder from '@sanity/image-url';
import type { ImageUrlBuilder } from '@sanity/image-url/lib/types/builder';
import { client } from './sanity';
import type { ImageSource, MockImage, SanityImageRef } from '../types/sanity';

export const SRCSET_WIDTHS = [480, 768, 1080, 1440, 1920, 2560];

const builder = client ? imageUrlBuilder(client) : null;

export function isMockImage(image: ImageSource): image is MockImage {
  return image._type === 'mockImage';
}

export function urlFor(image: SanityImageRef): ImageUrlBuilder {
  if (!builder) {
    throw new Error('Sanity klient není nakonfigurován (chybí SANITY_PROJECT_ID).');
  }
  return builder.image(image).auto('format').quality(80);
}

export function srcsetFor(image: SanityImageRef, maxWidth = 2560): string {
  return SRCSET_WIDTHS.filter((w) => w <= maxWidth)
    .map((w) => `${urlFor(image).width(w).url()} ${w}w`)
    .join(', ');
}

/** Rozměry z asset ref: image-<id>-<width>x<height>-<format> */
export function dimensionsFor(image: SanityImageRef): { width: number; height: number } {
  const match = image.asset._ref.match(/-(\d+)x(\d+)-/);
  if (!match) return { width: 1600, height: 1067 };
  return { width: Number(match[1]), height: Number(match[2]) };
}
