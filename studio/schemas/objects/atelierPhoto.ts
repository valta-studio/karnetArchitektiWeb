import { defineField, defineType } from 'sanity';
import { ImageIcon } from '@sanity/icons';

/** Fotka ateliéru — jedna fotka = jedna zastávka vodorovného posunu. */
export default defineType({
  name: 'atelierPhoto',
  title: 'Fotka',
  type: 'image',
  icon: ImageIcon,
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Popis fotky (alt)',
      type: 'string',
      description: 'Krátký popis pro čtečky obrazovky a vyhledávače.',
    }),
  ],
  preview: {
    select: { media: 'asset', alt: 'alt' },
    prepare: ({ media, alt }) => ({ media, title: alt || 'Fotka' }),
  },
});
