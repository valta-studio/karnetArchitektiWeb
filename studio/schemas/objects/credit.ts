import { defineField, defineType } from 'sanity';
import { TagIcon } from '@sanity/icons';

export default defineType({
  name: 'credit',
  title: 'Kredit',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'Např. Foto, Zahrada, Spolupráce…',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Jméno',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role' },
  },
});
