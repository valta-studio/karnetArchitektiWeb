import { defineField, defineType } from 'sanity';
import { ImagesIcon } from '@sanity/icons';

export default defineType({
  name: 'portfolioLevel',
  title: 'Úroveň 3 — Portfolio',
  type: 'document',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Nadpis / úvod sekce',
      type: 'string',
      description: 'Volitelný.',
    }),
    defineField({
      name: 'projects',
      title: 'Projekty (pořadí)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }],
      description: 'Přetažením změníte pořadí v portfoliu.',
      validation: (rule) => rule.unique(),
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Úroveň 3 — Portfolio' }),
  },
});
