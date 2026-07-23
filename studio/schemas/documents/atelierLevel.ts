import { defineField, defineType } from 'sanity';
import { UsersIcon } from '@sanity/icons';

export default defineType({
  name: 'atelierLevel',
  title: 'Úroveň 2 — Ateliér',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'intro',
      title: 'Úvodní texty studia',
      type: 'array',
      of: [{ type: 'block', styles: [{ title: 'Odstavec', value: 'normal' }] }],
    }),
    defineField({
      name: 'awardsIntro',
      title: 'Úvodní věta k oceněním',
      type: 'text',
      rows: 2,
      description: 'Např. „Naše práce se pravidelně objevuje v odborných a lifestyle magazínech."',
    }),
    defineField({
      name: 'awards',
      title: 'Ocenění',
      type: 'array',
      of: [{ type: 'award' }],
      description: 'Text pište jako celou větu — na webu se zobrazuje jako odstavec.',
    }),
    defineField({
      name: 'publications',
      title: 'Publikace (fotky)',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true }, fields: [
        defineField({ name: 'caption', title: 'Popisek', type: 'string' }),
      ] }],
      description: 'Galerie fotek publikací, pořadí lze přetahovat.',
    }),
    defineField({
      name: 'founding',
      title: 'Text o založení ateliéru',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'people',
      title: 'Lidé',
      type: 'array',
      of: [{ type: 'person' }],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Úroveň 2 — Ateliér' }),
  },
});
