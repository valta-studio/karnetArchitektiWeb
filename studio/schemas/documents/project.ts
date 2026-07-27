import { defineField, defineType } from 'sanity';
import { CaseIcon } from '@sanity/icons';

export default defineType({
  name: 'project',
  title: 'Projekt',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Název',
      type: 'string',
      description: 'Např. „Vila 1906".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL adresa (slug)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      description: 'Tvoří adresu /portfolio/…',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Pořadí v portfoliu',
      type: 'number',
      description: 'Nižší číslo = dřív. Řazení lze měnit i v úrovni Portfolio.',
    }),
    defineField({
      name: 'years',
      title: 'Roky',
      type: 'string',
      description: 'Např. „2018 – 2021".',
    }),
    defineField({
      name: 'location',
      title: 'Místo',
      type: 'string',
      description: 'Např. „Dobřichovice".',
    }),
    defineField({
      name: 'credits',
      title: 'Kredity',
      type: 'array',
      of: [{ type: 'credit' }],
      description: 'Páry role/jméno — Foto: Petr Polák, Zahrada: …',
    }),
    defineField({
      name: 'perex',
      title: 'Perex',
      type: 'text',
      rows: 5,
      description: 'Krátké uvedení + úvodní odstavec (první sloupec textové úrovně).',
    }),
    defineField({
      name: 'columns',
      title: 'Textové sloupce',
      type: 'array',
      of: [{ type: 'text' }],
      description:
        'Texty navazující na perex — např. historie místa, popis řešení, materiály. ' +
        'Každý text začíná v novém sloupci a delší text sám přeteče do dalších. ' +
        'Počet sloupců na webu tak není omezený, řídí se délkou obsahu.',
    }),
    defineField({
      name: 'cover',
      title: 'Náhledová fotka (portfolio)',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'photos',
      title: 'Fotky (úroveň 1 karty)',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (rule) => rule.min(3).error('Karta potřebuje alespoň 3 fotky.'),
    }),
    defineField({
      name: 'drawings',
      title: 'Výkresy (úroveň 3 karty)',
      type: 'array',
      of: [{ type: 'image' }],
      description: 'Pohledy a půdorysy — ideálně SVG nebo komprimované PNG.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
  ],
  validation: (rule) =>
    rule.custom(async (_doc, context) => {
      const client = context.getClient({ apiVersion: '2025-06-01' });
      const count = await client.fetch<number>(
        'count(*[_type == "project" && !(_id in path("drafts.**"))])'
      );
      if (count > 12) {
        return {
          message: `Publikováno je ${count} projektů — doporučené maximum je 12.`,
          // warning only — handled by warning() below
        };
      }
      return true;
    }).warning(),
  preview: {
    select: { title: 'title', subtitle: 'location', media: 'cover' },
  },
});
