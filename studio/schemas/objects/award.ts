import { defineField, defineType } from 'sanity';
import { StarIcon } from '@sanity/icons';

export default defineType({
  name: 'award',
  title: 'Ocenění',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'year',
      title: 'Rok',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'text',
      title: 'Text ocenění',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'text', subtitle: 'year' },
  },
});
