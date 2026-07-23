import { defineField, defineType } from 'sanity';
import { HomeIcon } from '@sanity/icons';

export default defineType({
  name: 'introLevel',
  title: 'Úroveň 1 — Úvod',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'mode',
      title: 'Zobrazit',
      type: 'string',
      options: {
        list: [
          { title: 'Fotku', value: 'photo' },
          { title: 'Video', value: 'video' },
        ],
        layout: 'radio',
      },
      initialValue: 'photo',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Úvodní fotka',
      type: 'image',
      options: { hotspot: true },
      description: 'Zobrazí se v režimu Fotka a jako záloha, než se načte video.',
    }),
    defineField({
      name: 'videoFile',
      title: 'Video (soubor MP4)',
      type: 'file',
      options: { accept: 'video/mp4' },
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video (URL)',
      type: 'url',
      description: 'Alternativa k souboru — např. odkaz na video CDN.',
    }),
    defineField({
      name: 'poster',
      title: 'Poster snímek videa',
      type: 'image',
      description: 'Zobrazí se, než se video načte / když je autoplay vypnutý.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO (hlavní stránka)',
      type: 'seo',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Úroveň 1 — Úvod' }),
  },
});
