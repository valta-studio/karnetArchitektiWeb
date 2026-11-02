import { defineField, defineType } from 'sanity';
import { UsersIcon } from '@sanity/icons';

// Pořadí polí odpovídá pořadí na webu: textové sekce a mezi nimi seznamy
// fotek (nula, jedna nebo více). Každá fotka je samostatná zastávka
// vodorovného posunu; pořadí v seznamu = pořadí na webu.

const PHOTOS_DESCRIPTION =
  'Nula, jedna nebo více fotek. Každá fotka je na webu jedna zastávka vodorovného posunu; ' +
  'pořadí v seznamu je pořadí na webu.';

const photosField = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'array',
    of: [{ type: 'atelierPhoto' }],
    description: PHOTOS_DESCRIPTION,
  });

const LEGACY_PLACEMENT_LABELS: Record<string, string> = {
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
  fieldsets: [
    { name: 'introSection', title: 'Úvodní texty' },
    { name: 'awardsSection', title: 'Ocenění' },
    { name: 'peopleSection', title: 'Založení a lidé' },
  ],
  fields: [
    photosField('photosStart', 'Fotky na začátku (před úvodními texty)'),

    defineField({
      name: 'intro',
      title: 'Úvodní texty studia',
      type: 'array',
      of: [{ type: 'block', styles: [{ title: 'Odstavec', value: 'normal' }] }],
      fieldset: 'introSection',
    }),

    photosField('photosAfterIntro', 'Fotky mezi úvodními texty a oceněními'),

    defineField({
      name: 'awardsIntro',
      title: 'Úvodní věta k oceněním',
      type: 'text',
      rows: 2,
      description: 'Např. „Naše práce se pravidelně objevuje v odborných a lifestyle magazínech."',
      fieldset: 'awardsSection',
    }),
    defineField({
      name: 'awards',
      title: 'Ocenění',
      type: 'array',
      of: [{ type: 'award' }],
      description: 'Text pište jako celou větu — na webu se zobrazuje jako odstavec.',
      fieldset: 'awardsSection',
    }),

    photosField('photosAfterAwards', 'Fotky mezi oceněními a lidmi'),

    defineField({
      name: 'founding',
      title: 'Text o založení ateliéru',
      type: 'text',
      rows: 4,
      fieldset: 'peopleSection',
    }),
    defineField({
      name: 'people',
      title: 'Lidé',
      type: 'array',
      of: [{ type: 'person' }],
      fieldset: 'peopleSection',
    }),

    photosField('photosEnd', 'Fotky na konci (za lidmi)'),

    // Původní pole s volbou umístění u každé fotky. Zobrazuje se jen dokud
    // obsahuje data — po přesunu fotek do polí výše (migrace
    // `atelier-photos-by-section`, nebo ručně) ho vyprázdněte.
    defineField({
      name: 'photos',
      title: 'Fotky (staré pole — přesuňte do seznamů výše)',
      type: 'array',
      deprecated: {
        reason:
          'Nahrazeno samostatnými seznamy fotek mezi sekcemi. Fotky z tohoto pole se na webu ' +
          'zobrazí jen tehdy, když jsou všechny nové seznamy prázdné.',
      },
      hidden: ({ document }) => !(document?.photos as unknown[] | undefined)?.length,
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Popis fotky (alt)', type: 'string' }),
            defineField({
              name: 'placement',
              title: 'Umístění',
              type: 'string',
              options: {
                list: Object.entries(LEGACY_PLACEMENT_LABELS).map(([value, title]) => ({
                  title,
                  value,
                })),
                layout: 'radio',
              },
            }),
          ],
          preview: {
            select: { media: 'asset', alt: 'alt', placement: 'placement' },
            prepare: ({ media, alt, placement }) => ({
              media,
              title: alt || 'Fotka',
              subtitle: LEGACY_PLACEMENT_LABELS[placement ?? 'afterIntro'],
            }),
          },
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Úroveň 2 — Ateliér' }),
  },
});
