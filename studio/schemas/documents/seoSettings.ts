import { defineField, defineType } from 'sanity';
import { SearchIcon } from '@sanity/icons';

export default defineType({
  name: 'seoSettings',
  title: 'SEO — globální nastavení',
  type: 'document',
  icon: SearchIcon,
  fields: [
    defineField({
      name: 'siteName',
      title: 'Název webu',
      type: 'string',
      description: 'Používá se v logu a v šabloně titulku. Např. „Karnet, architekti".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'titleTemplate',
      title: 'Šablona titulku',
      type: 'string',
      description: '%s se nahradí titulkem stránky. Např. „%s — Karnet, architekti".',
      initialValue: '%s — Karnet, architekti',
    }),
    defineField({
      name: 'defaultTitle',
      title: 'Výchozí meta title',
      type: 'string',
    }),
    defineField({
      name: 'defaultDescription',
      title: 'Výchozí meta description',
      type: 'text',
      rows: 3,
      validation: (rule) =>
        rule.max(160).warning('Delší než 160 znaků — Google popis zkrátí.'),
    }),
    defineField({
      name: 'defaultOgImage',
      title: 'Výchozí OG obrázek',
      type: 'image',
      description: 'Náhled při sdílení odkazu (1200×630).',
    }),
    defineField({
      name: 'noindex',
      title: 'Skrýt celý web před vyhledávači',
      type: 'boolean',
      description: 'Zapnout jen pro staging prostředí!',
      initialValue: false,
    }),
    defineField({
      name: 'googleSiteVerification',
      title: 'Google Site Verification kód',
      type: 'string',
    }),
    defineField({
      name: 'analyticsId',
      title: 'Měřicí kód (Plausible doména / GA4 ID)',
      type: 'string',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'SEO — globální nastavení' }),
  },
});
