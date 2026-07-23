import { defineField, defineType } from 'sanity';
import { EnvelopeIcon } from '@sanity/icons';

export default defineType({
  name: 'contact',
  title: 'Úroveň 4 — Kontakt',
  type: 'document',
  icon: EnvelopeIcon,
  fields: [
    defineField({
      name: 'email',
      title: 'E-mail',
      type: 'string',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'phone',
      title: 'Telefon',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Adresa kanceláře',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'socialLinks',
      title: 'Sociální sítě',
      type: 'array',
      of: [{ type: 'socialLink' }],
    }),
    defineField({
      name: 'billing',
      title: 'Fakturační údaje',
      type: 'object',
      options: { collapsible: true },
      fields: [
        defineField({ name: 'companyName', title: 'Název společnosti', type: 'string' }),
        defineField({ name: 'registeredAddress', title: 'Sídlo', type: 'text', rows: 2 }),
        defineField({ name: 'ico', title: 'IČO', type: 'string' }),
        defineField({ name: 'dic', title: 'DIČ', type: 'string' }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Úroveň 4 — Kontakt' }),
  },
});
