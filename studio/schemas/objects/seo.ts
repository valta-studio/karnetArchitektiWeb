import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      description: 'Titulek pro vyhledávače. Prázdné = odvodí se z názvu.',
      validation: (rule) =>
        rule.max(60).warning('Delší než 60 znaků — Google titulek zkrátí.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'Popis pro vyhledávače (ideálně 120–160 znaků). Prázdné = odvodí se z perexu.',
      validation: (rule) =>
        rule.max(160).warning('Delší než 160 znaků — Google popis zkrátí.'),
    }),
    defineField({
      name: 'ogImage',
      title: 'OG obrázek (sdílení)',
      type: 'image',
      description: 'Náhled při sdílení odkazu (1200×630). Prázdné = použije se výchozí.',
    }),
    defineField({
      name: 'noindex',
      title: 'Skrýt před vyhledávači (noindex)',
      type: 'boolean',
      initialValue: false,
    }),
  ],
});
