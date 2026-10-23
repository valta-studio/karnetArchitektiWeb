import { defineField, defineType } from 'sanity';
import { UsersIcon } from '@sanity/icons';

const PLACEMENT_LABELS: Record<string, string> = {
  start: 'Na začátku',
  afterIntro: 'Za úvodními texty',
  afterAwards: 'Za oceněními',
  end: 'Na konci',
};

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
      name: 'founding',
      title: 'Text o založení ateliéru',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'photos',
      title: 'Fotky',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Popis fotky (alt)',
              type: 'string',
              description: 'Krátký popis pro čtečky obrazovky a vyhledávače.',
            }),
            defineField({
              name: 'placement',
              title: 'Umístění',
              type: 'string',
              options: {
                list: [
                  { title: 'Na začátek (před úvodní texty)', value: 'start' },
                  { title: 'Za úvodní texty', value: 'afterIntro' },
                  { title: 'Za ocenění', value: 'afterAwards' },
                  { title: 'Na konec (za lidi)', value: 'end' },
                ],
                layout: 'radio',
              },
              initialValue: 'afterIntro',
            }),
          ],
          preview: {
            select: { media: 'asset', alt: 'alt', placement: 'placement' },
            prepare: ({ media, alt, placement }) => ({
              media,
              title: alt || 'Fotka',
              subtitle: PLACEMENT_LABELS[placement ?? 'afterIntro'],
            }),
          },
        },
      ],
      description:
        'Každá fotka je na webu jedna samostatná zastávka vodorovného posunu mezi textovými panely. ' +
        'Místo určuje „Umístění"; fotky se stejným umístěním jdou za sebou v pořadí tohoto seznamu.',
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
