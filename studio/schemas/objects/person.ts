import { defineField, defineType } from 'sanity';
import { UserIcon } from '@sanity/icons';

export default defineType({
  name: 'person',
  title: 'Osoba',
  type: 'object',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'degree',
      title: 'Titul',
      type: 'string',
      description: 'Např. „Ing. arch." — může zůstat prázdné.',
    }),
    defineField({
      name: 'name',
      title: 'Jméno',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'degree' },
  },
});
